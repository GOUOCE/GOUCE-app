"""Service da HU-018: Visualização da Lista de Embarque.

Responsabilidades:
- Consultar alocações ativas (status='ALOCADO') com agendamentos ATIVOS.
- Consolidar por agendamento (ida + volta) em um único registro de aluno.
- Filtrar pela faculdade do representante quando aplicável (RN-015).
- Descobrir automaticamente a(s) rota(s) do dia para representante sem rota_id.
- Prover a listagem de rotas com alocação para popular o seletor da UI (CA-01).
"""

from __future__ import annotations

import unicodedata
from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import or_
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


def _chave_ordenacao_nome(nome: Optional[str]) -> tuple[str, str]:
    """Chave de ordem alfabética pt-BR: ignora acentos e caixa (Ágata antes de Ana).

    O nome original é usado como desempate para manter a ordem determinística.
    """
    original = nome or ""
    base = "".join(
        ch
        for ch in unicodedata.normalize("NFD", original)
        if not unicodedata.combining(ch)
    )
    return (base.casefold(), original.casefold())


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
        """Retorna ``{administrador_id, id_faculdade_responsavel}`` do vínculo ativo.

        Retorna ``None`` somente se o usuário não for um representante ativo.
        Vínculo ativo sem faculdade responsável (estado legado) retorna o dict com
        ``id_faculdade_responsavel=None``, para que o chamador distinga os dois
        motivos de recusa.
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
        return {
            "administrador_id": repr_orm.administrador_id,
            "id_faculdade_responsavel": repr_orm.id_faculdade_responsavel or None,
        }

    # ------------------------------------------------------------------
    # Rotas do dia — seletor da UI (CA-01)
    # ------------------------------------------------------------------

    def rotas_do_dia(
        self,
        target: date,
        faculdade_id: Optional[int] = None,
    ) -> list[dict]:
        """Lista rotas disponíveis para a data, opcionalmente filtradas pela IES.

        Para representante (``faculdade_id`` não nulo): retorna as rotas com alunos
        ALOCADOS vinculados à IES responsável ou, caso ainda não haja alocação no
        dia, as rotas principais ativas vinculadas àquela IES.
        Para administrador: todas as rotas com alocação na data e as rotas
        principais ativas (permitindo consultar rotas sem alunos no FA-002).
        """
        if faculdade_id is None:
            alocacoes = (
                self.session.query(AlocacaoDiariaORM.rota_id)
                .filter(AlocacaoDiariaORM.data == target)
                .all()
            )
            rotas_ativas = (
                self.session.query(RotaPrincipalORM.id)
                .filter(RotaPrincipalORM.ativo.is_(True))
                .all()
            )
            rota_ids = {rota_id for (rota_id,) in alocacoes} | {
                rota_id for (rota_id,) in rotas_ativas
            }
        else:
            # Representante: rotas onde a IES tem alunos alocados; fallback para rotas ativas da IES
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
                rotas_ies = (
                    self.session.query(RotaPrincipalORM.id)
                    .filter(
                        RotaPrincipalORM.ativo.is_(True),
                        or_(
                            RotaPrincipalORM.faculdades_ida.any(
                                FaculdadeORM.id_faculdade == faculdade_id
                            ),
                            RotaPrincipalORM.faculdades_volta.any(
                                FaculdadeORM.id_faculdade == faculdade_id
                            ),
                        ),
                    )
                    .all()
                )
                rota_ids = {rota_id for (rota_id,) in rotas_ies}

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

        # 7. Consolidação por agendamento_id (une ida + volta em uma linha).
        # Somente os trechos visíveis (alocados na rota/turno filtrado e, para
        # representante, da IES responsável) populam o DTO (RN-015 / RNF-010).
        consolidado: dict[int, dict] = {}
        ies_visivel: dict[int, dict] = {}
        for aloc_aluno, ag in rows:
            ag_id = ag.id
            alocacao = alocacao_por_id[aloc_aluno.alocacao_diaria_id]
            motorista = motoristas.get(alocacao.motorista_id)
            motorista_nome = motorista.nome_completo if motorista else None

            if ag_id not in consolidado:
                usuario = usuarios.get(ag.aluno_id)
                nome_aluno = usuario.nome_completo if usuario else ""

                consolidado[ag_id] = {
                    "aluno_id": ag.aluno_id,
                    "agendamento_id": ag_id,
                    "nome_aluno": nome_aluno,
                    "ponto_embarque": None,
                    "ponto_desembarque": None,
                    "ies_ida": None,
                    "ies_volta": None,
                    "indicacao_turno": "APENAS_IDA",
                    "tipo_lugar_ida": None,
                    "tipo_lugar_volta": None,
                    "onibus_ida": None,
                    "onibus_volta": None,
                    "motorista_ida": None,
                    "motorista_volta": None,
                    "status_presenca": ag.presenca_status,
                }
                ies_visivel[ag_id] = {"ida": None, "volta": None}
                ies_visivel[ag_id]["_vis_ida"] = False
                ies_visivel[ag_id]["_vis_volta"] = False

            entry = consolidado[ag_id]
            if aloc_aluno.turno == "ida":
                ponto_emb = pontos.get(ag.ponto_embarque_id) if ag.ponto_embarque_id else None
                ies_dest = faculdades.get(ag.ies_destino_id) if ag.ies_destino_id else None
                entry["ponto_embarque"] = _ponto_dto(ponto_emb, bairros) if ponto_emb else None
                entry["ies_ida"] = _faculdade_dto(ies_dest) if ies_dest else None
                entry["tipo_lugar_ida"] = aloc_aluno.tipo_lugar
                entry["onibus_ida"] = alocacao.onibus_id
                entry["motorista_ida"] = motorista_nome
                ies_visivel[ag_id]["ida"] = ag.ies_destino_id
                ies_visivel[ag_id]["_vis_ida"] = True
            else:
                ponto_des = pontos.get(ag.ponto_desembarque_id) if ag.ponto_desembarque_id else None
                ies_orig = faculdades.get(ag.ies_origem_id) if ag.ies_origem_id else None
                entry["ponto_desembarque"] = _ponto_dto(ponto_des, bairros) if ponto_des else None
                entry["ies_volta"] = _faculdade_dto(ies_orig) if ies_orig else None
                entry["tipo_lugar_volta"] = aloc_aluno.tipo_lugar
                entry["onibus_volta"] = alocacao.onibus_id
                entry["motorista_volta"] = motorista_nome
                ies_visivel[ag_id]["volta"] = ag.ies_origem_id
                ies_visivel[ag_id]["_vis_volta"] = True

        # Recalcula indicacao_turno apenas com os trechos visíveis
        for ag_id, entry in consolidado.items():
            vis = ies_visivel[ag_id]
            if vis["_vis_ida"] and vis["_vis_volta"]:
                entry["indicacao_turno"] = (
                    "IDA_E_VOLTA_MESMA_IES"
                    if vis["ida"] == vis["volta"]
                    else "IDA_E_VOLTA_IES_DISTINTAS"
                )
            elif vis["_vis_ida"]:
                entry["indicacao_turno"] = "APENAS_IDA"
            else:
                entry["indicacao_turno"] = "APENAS_VOLTA"

        # 8. Ordenação alfabética pelo nome (nome_completo é descriptografado)
        alunos_lista = sorted(
            consolidado.values(),
            key=lambda x: _chave_ordenacao_nome(x["nome_aluno"]),
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
        total_presentes = sum(
            1 for aluno in alunos_lista if aluno["status_presenca"] == "PRESENTE"
        )
        total_faltas = sum(
            1 for aluno in alunos_lista if aluno["status_presenca"] == "FALTA"
        )

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
                else (
                    "Não há registros de viagens ou agendamentos para a data selecionada."
                    if not alocacoes
                    else "Essa rota não possui nenhum aluno alocado para este dia."
                )
            ),
            "ultima_sincronizacao": agora.isoformat(),
            "indicador_sincronizacao": "Atualizado agora",
            "alunos": alunos_lista,
            "total_presentes": total_presentes,
            "total_faltas": total_faltas,
            "total_pendentes": total - total_presentes - total_faltas,
            "somente_leitura": target != date.today(),
        }

    def registrar_presenca(
        self,
        target: date,
        rota_id: int,
        agendamento_id: int,
        status_presenca: str,
        usuario_id: int,
        faculdade_id: Optional[int] = None,
    ) -> dict:
        """Registra ou corrige a presença para um agendamento alocado na rota do dia."""
        if target != date.today():
            raise ListaEmbarqueError(
                "A chamada só pode ser realizada no dia exato da viagem.", 422
            )
        if status_presenca not in {"PRESENTE", "FALTA"}:
            raise ListaEmbarqueError("Status de presença inválido.", 422)

        registros = (
            self.session.query(AlocacaoAlunoORM, AgendamentoORM)
            .join(AgendamentoORM, AlocacaoAlunoORM.agendamento_id == AgendamentoORM.id)
            .join(
                AlocacaoDiariaORM,
                AlocacaoAlunoORM.alocacao_diaria_id == AlocacaoDiariaORM.id,
            )
            .filter(
                AlocacaoDiariaORM.data == target,
                AlocacaoDiariaORM.rota_id == rota_id,
                AlocacaoAlunoORM.status == "ALOCADO",
                AgendamentoORM.id == agendamento_id,
                AgendamentoORM.status == "ATIVO",
            )
            .all()
        )
        if not registros:
            raise ListaEmbarqueError(
                "O aluno não possui agendamento ativo na rota e data selecionadas.", 422
            )

        if faculdade_id is not None:
            pertence_a_faculdade = any(
                (
                    agendamento.ies_destino_id == faculdade_id
                    if alocacao.turno == "ida"
                    else agendamento.ies_origem_id == faculdade_id
                )
                for alocacao, agendamento in registros
            )
            if not pertence_a_faculdade:
                raise ListaEmbarqueError(
                    "O representante não é responsável pela faculdade deste aluno.", 403
                )

        agendamento = registros[0][1]
        agendamento.presenca_status = status_presenca
        agendamento.presenca_registrada_em = datetime.now(timezone.utc)
        agendamento.presenca_registrada_por = usuario_id
        self.session.commit()

        return {
            "agendamento_id": agendamento.id,
            "status_presenca": agendamento.presenca_status,
            "presenca_registrada_em": agendamento.presenca_registrada_em.isoformat(),
        }
