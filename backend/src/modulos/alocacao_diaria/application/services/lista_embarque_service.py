"""Service da HU-018: Visualização da Lista de Embarque.

Responsabilidades:
- Consultar alocações ativas (status='ALOCADO') com agendamentos ATIVOS.
- Consolidar por agendamento (ida + volta) em um único registro de aluno.
- Filtrar pela faculdade do representante quando aplicável (RN-015).
- Descobrir automaticamente a(s) rota(s) do dia para representante sem rota_id.
- Prover a listagem de rotas com alocação para popular o seletor da UI (CA-01).
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from src.modulos.alocacao_diaria.model.entities.alocacao import (
    AlocacaoAlunoORM,
    AlocacaoDiariaORM,
)
from src.modulos.agendamentos.model.entities.agendamento import AgendamentoORM
from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
from src.modulos.crud_basicos.domain.entities.ponto_de_parada import PontoDeParadaORM
from src.modulos.motoristas.model.entities.motorista import MotoristaORM
from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM
from src.modulos.usuarios.model.entities.representante import RepresentanteORM
from src.modulos.usuarios.model.entities.usuario import UsuarioORM


class ListaEmbarqueError(Exception):
    """Erro de negócio do serviço da lista de embarque."""

    def __init__(self, message: str, status_code: int = 422):
        self.status_code = status_code
        super().__init__(message)


# ---------------------------------------------------------------------------
# Helpers internos
# ---------------------------------------------------------------------------


def _ponto_dto(ponto: PontoDeParadaORM, bairros: dict[int, BairroORM]) -> dict:
    bairro = bairros.get(ponto.bairro_id)
    return {
        "ponto_id": ponto.ponto_id,
        "nome": ponto.nome,
        "bairro": bairro.nome if bairro else None,
    }


def _faculdade_dto(faculdade: FaculdadeORM) -> dict:
    return {
        "id": faculdade.id_faculdade,
        "nome": faculdade.nome_faculdade,
        "sigla": faculdade.sigla,
        "campus": faculdade.campus_faculdade,
    }


def _indicacao_turno(agendamento: AgendamentoORM) -> str:
    """Calcula a indicação de turno com base no agendamento original."""
    if agendamento.usa_ida and agendamento.usa_volta:
        if agendamento.ies_destino_id == agendamento.ies_origem_id:
            return "IDA_E_VOLTA_MESMA_IES"
        return "IDA_E_VOLTA_IES_DISTINTAS"
    if agendamento.usa_ida:
        return "APENAS_IDA"
    return "APENAS_VOLTA"


def _texto_contador(total: int) -> str:
    if total == 1:
        return "1 aluno alocado"
    return f"{total} alunos alocados"


# ---------------------------------------------------------------------------
# Service principal
# ---------------------------------------------------------------------------


class ListaEmbarqueService:
    """Serviço de leitura da lista de embarque (HU-018)."""

    def __init__(self, session: Session):
        self.session = session

    # ------------------------------------------------------------------
    # Representante — acesso ao vínculo ativo
    # ------------------------------------------------------------------

    def obter_representante(self, user_id: int) -> Optional[dict]:
        """Retorna ``{id_faculdade_responsavel, ...}`` para o representante ativo.

        Retorna ``None`` se o usuário não for um representante ativo ou não
        tiver faculdade responsável atribuída.
        """
        repr_orm: RepresentanteORM | None = (
            self.session.query(RepresentanteORM)
            .filter(
                RepresentanteORM.administrador_id == user_id,
                RepresentanteORM.is_representante_ativo.is_(True),
            )
            .first()
        )
        if repr_orm is None:
            return None
        if not repr_orm.id_faculdade_responsavel:
            return None
        return {
            "administrador_id": repr_orm.administrador_id,
            "id_faculdade_responsavel": repr_orm.id_faculdade_responsavel,
        }

    # ------------------------------------------------------------------
    # Rotas do dia — seletor da UI (CA-01)
    # ------------------------------------------------------------------

    def rotas_do_dia(
        self,
        target: date,
        faculdade_id: Optional[int] = None,
    ) -> list[dict]:
        """Lista rotas com alocação para a data, opcionalmente filtradas pela IES.

        Para representante (``faculdade_id`` não nulo): retorna apenas as rotas
        que possuem ao menos um aluno ALOCADO vinculado à IES responsável.
        Para administrador: todas as rotas com alocação na data.
        """
        if faculdade_id is None:
            # Admin: retorna todas as rotas que têm alocacao_diaria na data
            alocacoes = (
                self.session.query(AlocacaoDiariaORM)
                .filter(AlocacaoDiariaORM.data == target)
                .all()
            )
            rota_ids = {a.rota_id for a in alocacoes}
        else:
            # Representante: apenas rotas onde a IES tem alunos alocados
            rows = (
                self.session.query(AlocacaoDiariaORM.rota_id, AlocacaoAlunoORM.turno, AgendamentoORM)
                .join(AlocacaoAlunoORM, AlocacaoAlunoORM.alocacao_diaria_id == AlocacaoDiariaORM.id)
                .join(AgendamentoORM, AlocacaoAlunoORM.agendamento_id == AgendamentoORM.id)
                .filter(
                    AlocacaoDiariaORM.data == target,
                    AlocacaoAlunoORM.status == "ALOCADO",
                    AgendamentoORM.status == "ATIVO",
                )
                .all()
            )
            rota_ids: set[int] = set()
            for rota_id, turno, agendamento in rows:
                ies_id = (
                    agendamento.ies_destino_id
                    if turno == "ida"
                    else agendamento.ies_origem_id
                )
                if ies_id == faculdade_id:
                    rota_ids.add(rota_id)

        if not rota_ids:
            return []

        rotas = (
            self.session.query(RotaPrincipalORM)
            .filter(RotaPrincipalORM.id.in_(rota_ids))
            .order_by(RotaPrincipalORM.nome)
            .all()
        )
        return [
            {
                "rota_id": r.id,
                "nome_rota": r.nome,
                "horario_saida": r.horario_saida.strftime("%H:%M"),
            }
            for r in rotas
        ]

    # ------------------------------------------------------------------
    # Lista de embarque — consulta principal (CA-01 … CA-06)
    # ------------------------------------------------------------------

    def listar(
        self,
        target: date,
        rota_id: int,
        turno: Optional[str] = None,
        faculdade_id: Optional[int] = None,
    ) -> dict:
        """Retorna a lista de embarque consolidada para uma rota/dia.

        Parameters
        ----------
        target:
            Data de operação.
        rota_id:
            ID da rota principal.
        turno:
            Filtro opcional: ``'ida'`` ou ``'volta'``. Sem filtro, ambos.
        faculdade_id:
            ID da IES responsável do representante. ``None`` para administrador.
        """
        # 1. Carrega a rota para garantir que existe e obter os metadados
        rota: RotaPrincipalORM | None = self.session.get(RotaPrincipalORM, rota_id)
        if rota is None:
            raise ListaEmbarqueError("Rota não encontrada.", 404)

        # 2. Alocações diárias da rota/data (com filtro opcional de turno)
        alocacoes_q = self.session.query(AlocacaoDiariaORM).filter(
            AlocacaoDiariaORM.data == target,
            AlocacaoDiariaORM.rota_id == rota_id,
        )
        if turno:
            alocacoes_q = alocacoes_q.filter(AlocacaoDiariaORM.turno == turno)
        alocacoes: list[AlocacaoDiariaORM] = alocacoes_q.all()

        alocacao_ids = [a.id for a in alocacoes]
        alocacao_por_id: dict[int, AlocacaoDiariaORM] = {a.id: a for a in alocacoes}

        # 3. Registros de aluno ALOCADOS com agendamento ATIVO
        rows: list[tuple[AlocacaoAlunoORM, AgendamentoORM]]
        if alocacao_ids:
            rows = (
                self.session.query(AlocacaoAlunoORM, AgendamentoORM)
                .join(AgendamentoORM, AlocacaoAlunoORM.agendamento_id == AgendamentoORM.id)
                .filter(
                    AlocacaoAlunoORM.alocacao_diaria_id.in_(alocacao_ids),
                    AlocacaoAlunoORM.status == "ALOCADO",
                    AgendamentoORM.status == "ATIVO",
                )
                .all()
            )
        else:
            rows = []

        # 4. Filtro por IES do representante
        if faculdade_id is not None:
            rows = [
                (aloc_aluno, ag)
                for aloc_aluno, ag in rows
                if (
                    ag.ies_destino_id == faculdade_id
                    if aloc_aluno.turno == "ida"
                    else ag.ies_origem_id == faculdade_id
                )
            ]

        # 5. Coleta IDs para batch-load
        aluno_ids = {ag.aluno_id for _, ag in rows}
        ponto_ids: set[int] = set()
        ies_ids: set[int] = set()
        for _, ag in rows:
            for pid in (ag.ponto_embarque_id, ag.ponto_desembarque_id):
                if pid:
                    ponto_ids.add(pid)
            for fid in (ag.ies_destino_id, ag.ies_origem_id):
                if fid:
                    ies_ids.add(fid)

        motorista_ids = {a.motorista_id for a in alocacoes}

        # 6. Batch-load de entidades relacionadas
        usuarios: dict[int, UsuarioORM] = (
            {u.id: u for u in self.session.query(UsuarioORM).filter(UsuarioORM.id.in_(aluno_ids)).all()}
            if aluno_ids else {}
        )
        pontos: dict[int, PontoDeParadaORM] = (
            {p.ponto_id: p for p in self.session.query(PontoDeParadaORM).filter(PontoDeParadaORM.ponto_id.in_(ponto_ids)).all()}
            if ponto_ids else {}
        )
        bairro_ids = {p.bairro_id for p in pontos.values() if p.bairro_id}
        bairros: dict[int, BairroORM] = (
            {b.bairro_id: b for b in self.session.query(BairroORM).filter(BairroORM.bairro_id.in_(bairro_ids)).all()}
            if bairro_ids else {}
        )
        faculdades: dict[int, FaculdadeORM] = (
            {f.id_faculdade: f for f in self.session.query(FaculdadeORM).filter(FaculdadeORM.id_faculdade.in_(ies_ids)).all()}
            if ies_ids else {}
        )
        motoristas: dict[int, MotoristaORM] = (
            {m.id: m for m in self.session.query(MotoristaORM).filter(MotoristaORM.id.in_(motorista_ids)).all()}
            if motorista_ids else {}
        )

        # 7. Consolidação por agendamento_id (une ida + volta em uma linha)
        consolidado: dict[int, dict] = {}
        for aloc_aluno, ag in rows:
            ag_id = ag.id
            alocacao = alocacao_por_id[aloc_aluno.alocacao_diaria_id]
            motorista = motoristas.get(alocacao.motorista_id)
            motorista_nome = motorista.nome_completo if motorista else None

            if ag_id not in consolidado:
                usuario = usuarios.get(ag.aluno_id)
                nome_aluno = usuario.nome_completo if usuario else ""

                ponto_emb = pontos.get(ag.ponto_embarque_id) if ag.ponto_embarque_id else None
                ponto_des = pontos.get(ag.ponto_desembarque_id) if ag.ponto_desembarque_id else None
                ies_dest = faculdades.get(ag.ies_destino_id) if ag.ies_destino_id else None
                ies_orig = faculdades.get(ag.ies_origem_id) if ag.ies_origem_id else None

                consolidado[ag_id] = {
                    "aluno_id": ag.aluno_id,
                    "agendamento_id": ag_id,
                    "nome_aluno": nome_aluno,
                    "ponto_embarque": _ponto_dto(ponto_emb, bairros) if ponto_emb else None,
                    "ponto_desembarque": _ponto_dto(ponto_des, bairros) if ponto_des else None,
                    "ies_ida": _faculdade_dto(ies_dest) if ies_dest else None,
                    "ies_volta": _faculdade_dto(ies_orig) if ies_orig else None,
                    "indicacao_turno": _indicacao_turno(ag),
                    "tipo_lugar_ida": None,
                    "tipo_lugar_volta": None,
                    "onibus_ida": None,
                    "onibus_volta": None,
                    "motorista_ida": None,
                    "motorista_volta": None,
                }

            entry = consolidado[ag_id]
            if aloc_aluno.turno == "ida":
                entry["tipo_lugar_ida"] = aloc_aluno.tipo_lugar
                entry["onibus_ida"] = alocacao.onibus_id
                entry["motorista_ida"] = motorista_nome
            else:
                entry["tipo_lugar_volta"] = aloc_aluno.tipo_lugar
                entry["onibus_volta"] = alocacao.onibus_id
                entry["motorista_volta"] = motorista_nome

        # 8. Ordenação alfabética pelo nome (nome_completo é descriptografado)
        alunos_lista = sorted(
            consolidado.values(),
            key=lambda x: (x["nome_aluno"] or "").lower(),
        )

        # 9. Veículos escalados com contagem de sentados/em_pé
        veiculos = []
        for alocacao in alocacoes:
            motorista = motoristas.get(alocacao.motorista_id)
            sentados = sum(
                1
                for aa in alocacao.alunos
                if aa.status == "ALOCADO" and aa.tipo_lugar == "sentado"
            )
            em_pe = sum(
                1
                for aa in alocacao.alunos
                if aa.status == "ALOCADO" and aa.tipo_lugar == "em_pe"
            )
            veiculos.append({
                "alocacao_id": alocacao.id,
                "turno": alocacao.turno,
                "onibus_placa": alocacao.onibus_id,
                "motorista_nome": motorista.nome_completo if motorista else "",
                "total_sentados": sentados,
                "total_em_pe": em_pe,
            })

        # 10. Monta a resposta
        total = len(alunos_lista)
        agora = datetime.now(timezone.utc)

        return {
            "data": target.isoformat(),
            "rota_id": rota_id,
            "nome_rota": rota.nome,
            "horario_saida": rota.horario_saida.strftime("%H:%M") if rota.horario_saida else None,
            "horario_retorno": rota.horario_retorno.strftime("%H:%M") if rota.horario_retorno else None,
            "veiculos_escalados": veiculos,
            "total_alunos_alocados": total,
            "texto_contador": _texto_contador(total),
            "permite_imprimir": total > 0,
            "mensagem": (
                None
                if total > 0
                else "Essa rota não possui nenhum aluno alocado para este dia."
            ),
            "ultima_sincronizacao": agora.isoformat(),
            "indicador_sincronizacao": "Atualizado agora",
            "alunos": alunos_lista,
        }
