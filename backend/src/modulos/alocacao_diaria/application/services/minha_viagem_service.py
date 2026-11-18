"""Service da HU-019: Consulta de Alocação Diária / Minha Viagem.

Responsabilidades:
- Buscar agendamento ativo do aluno para a data consultada.
- Verificar alocações de cada turno agendado (ida e/ou volta).
- Detectar realocação comparando a rota da alocação com a rota original do aluno.
- Montar resposta estruturada com todos os dados de frota ou status de espera.
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
from src.modulos.crud_basicos.domain.entities.onibus import OnibusORM
from src.modulos.crud_basicos.domain.entities.ponto_de_parada import PontoDeParadaORM
from src.modulos.motoristas.model.entities.motorista import MotoristaORM
from src.modulos.rotas.model.entities.rota_complementar import RotaComplementarORM
from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM


# ---------------------------------------------------------------------------
# Helpers internos
# ---------------------------------------------------------------------------


def _fmt_time(t) -> Optional[str]:
    """Formata `datetime.time` como ``'HH:MM'``, ou ``None``."""
    return t.strftime("%H:%M") if t else None


def _ponto_dto(ponto: Optional[PontoDeParadaORM], bairro: Optional[BairroORM]) -> Optional[dict]:
    if ponto is None:
        return None
    return {
        "ponto_id": ponto.ponto_id,
        "nome": ponto.nome,
        "bairro": bairro.nome if bairro else None,
    }


def _faculdade_dto(ies: Optional[FaculdadeORM]) -> Optional[dict]:
    if ies is None:
        return None
    return {
        "id": ies.id_faculdade,
        "nome": ies.nome_faculdade,
        "sigla": ies.sigla,
        "campus": ies.campus_faculdade,
    }


def _rota_complementar_dto(rc: Optional[RotaComplementarORM]) -> Optional[dict]:
    if rc is None:
        return None
    return {
        "id": rc.id,
        "nome": rc.nome,
        "horario_saida": _fmt_time(rc.horario_saida),
        "horario_retorno": _fmt_time(rc.horario_retorno),
        "ponto_conexao": rc.ponto_conexao,
    }


def _rota_original_id(
    agendamento: AgendamentoORM,
    turno: str,
    rotas_ativas: list[RotaPrincipalORM],
    comp_map: dict[int, int],
) -> Optional[int]:
    """Calcula a rota principal esperada para o aluno no turno, usando a mesma
    lógica de ``AlocacaoService._route_for``.

    Retorna ``None`` quando não é possível determinar (nenhuma rota ativa
    corresponde ao par ponto+IES do aluno).
    """
    # Se há rota complementar, ela aponta para uma rota principal
    comp_id = (
        agendamento.rota_complementar_ida_id
        if turno == "ida"
        else agendamento.rota_complementar_volta_id
    )
    if comp_id and comp_id in comp_map:
        return comp_map[comp_id]

    # Senão, cruza a faculdade com as rotas ativas
    faculty_id = agendamento.ies_destino_id if turno == "ida" else agendamento.ies_origem_id
    for rota in rotas_ativas:
        faculdades = rota.faculdades_ida if turno == "ida" else rota.faculdades_volta
        if faculty_id in {f.id_faculdade for f in faculdades}:
            return rota.id
    return None


# ---------------------------------------------------------------------------
# Service principal
# ---------------------------------------------------------------------------


class MinhaViagemService:
    """Serviço de leitura da consulta Minha Viagem (HU-019)."""

    def __init__(self, session: Session):
        self.session = session

    # ------------------------------------------------------------------
    # API pública
    # ------------------------------------------------------------------

    def consultar(self, aluno_id: int, target: date) -> dict:
        """Retorna a situação completa da viagem do aluno para a ``target``.

        Sempre retorna ``200`` — a chave ``possui_agendamento`` indica se
        há agendamento ativo para a data.
        """
        agora = datetime.now(timezone.utc).isoformat()

        # 1. Agendamento ativo do aluno para a data
        agendamento: Optional[AgendamentoORM] = (
            self.session.query(AgendamentoORM)
            .filter(
                AgendamentoORM.aluno_id == aluno_id,
                AgendamentoORM.data == target,
                AgendamentoORM.status == "ATIVO",
            )
            .first()
        )

        if agendamento is None:
            return {
                "data": target.isoformat(),
                "possui_agendamento": False,
                "agendamento_id": None,
                "status_geral": "SEM_AGENDAMENTO",
                "mensagem": "Você não possui agendamento confirmado para esta data.",
                "foi_realocado": False,
                "aviso_realocacao": None,
                "ida": None,
                "volta": None,
                "consultado_em": agora,
            }

        # 2. Pré-carrega entidades compartilhadas
        ponto_emb = self.session.get(PontoDeParadaORM, agendamento.ponto_embarque_id)
        ponto_des = (
            self.session.get(PontoDeParadaORM, agendamento.ponto_desembarque_id)
            if agendamento.ponto_desembarque_id
            else None
        )
        bairro_emb = self.session.get(BairroORM, ponto_emb.bairro_id) if ponto_emb else None
        bairro_des = self.session.get(BairroORM, ponto_des.bairro_id) if ponto_des else None
        ies_dest = self.session.get(FaculdadeORM, agendamento.ies_destino_id) if agendamento.ies_destino_id else None
        ies_orig = self.session.get(FaculdadeORM, agendamento.ies_origem_id) if agendamento.ies_origem_id else None
        rc_ida = (
            self.session.get(RotaComplementarORM, agendamento.rota_complementar_ida_id)
            if agendamento.rota_complementar_ida_id
            else None
        )
        rc_volta = (
            self.session.get(RotaComplementarORM, agendamento.rota_complementar_volta_id)
            if agendamento.rota_complementar_volta_id
            else None
        )

        # 3. Mapa de rota complementar → rota principal (para detecção de realocação)
        comp_map: dict[int, int] = {
            rc.id: rc.rota_principal_id
            for rc in self.session.query(RotaComplementarORM).filter(RotaComplementarORM.ativo.is_(True)).all()
        }
        rotas_ativas: list[RotaPrincipalORM] = (
            self.session.query(RotaPrincipalORM).filter(RotaPrincipalORM.ativo.is_(True)).all()
        )

        # 4. Monta os turnos solicitados
        turno_ida = None
        turno_volta = None

        if agendamento.usa_ida:
            turno_ida = self._montar_turno(
                agendamento=agendamento,
                turno="ida",
                ponto=ponto_emb,
                bairro=bairro_emb,
                ies=ies_dest,
                rota_complementar=rc_ida,
                rotas_ativas=rotas_ativas,
                comp_map=comp_map,
            )

        if agendamento.usa_volta:
            turno_volta = self._montar_turno(
                agendamento=agendamento,
                turno="volta",
                ponto=ponto_des,
                bairro=bairro_des,
                ies=ies_orig,
                rota_complementar=rc_volta,
                rotas_ativas=rotas_ativas,
                comp_map=comp_map,
            )

        # 5. Status geral e aviso de realocação
        turnos = [t for t in (turno_ida, turno_volta) if t is not None]
        alocados = [t for t in turnos if t["status_alocacao"] == "ALOCADO"]
        foi_realocado = any(t["foi_realocado"] for t in alocados)
        aviso_realocacao = next(
            (t["aviso_realocacao"] for t in alocados if t["aviso_realocacao"]),
            None,
        )

        if not alocados:
            status_geral = "AGUARDANDO_ALOCACAO"
        elif len(alocados) < len(turnos):
            status_geral = "PARCIALMENTE_ALOCADO"
        else:
            status_geral = "ALOCADO"

        return {
            "data": target.isoformat(),
            "possui_agendamento": True,
            "agendamento_id": agendamento.id,
            "status_geral": status_geral,
            "mensagem": None,
            "foi_realocado": foi_realocado,
            "aviso_realocacao": aviso_realocacao,
            "ida": turno_ida,
            "volta": turno_volta,
            "consultado_em": agora,
        }

    # ------------------------------------------------------------------
    # Helpers privados
    # ------------------------------------------------------------------

    def _montar_turno(
        self,
        agendamento: AgendamentoORM,
        turno: str,
        ponto: Optional[PontoDeParadaORM],
        bairro: Optional[BairroORM],
        ies: Optional[FaculdadeORM],
        rota_complementar: Optional[RotaComplementarORM],
        rotas_ativas: list[RotaPrincipalORM],
        comp_map: dict[int, int],
    ) -> dict:
        """Monta o dict de um turno, buscando alocação ativa se existir."""
        # Busca alocação ativa para este agendamento/turno
        aloc_aluno: Optional[AlocacaoAlunoORM] = (
            self.session.query(AlocacaoAlunoORM)
            .filter(
                AlocacaoAlunoORM.agendamento_id == agendamento.id,
                AlocacaoAlunoORM.turno == turno,
                AlocacaoAlunoORM.status == "ALOCADO",
            )
            .first()
        )

        ponto_dto = _ponto_dto(ponto, bairro)
        faculdade_dto = _faculdade_dto(ies)
        rc_dto = _rota_complementar_dto(rota_complementar)

        if aloc_aluno is None:
            # Distribuição ainda não realizada para este turno
            return {
                "turno": turno,
                "status_alocacao": "AGUARDANDO_ALOCACAO",
                "mensagem_status": "Aguardando alocação do veículo",
                "ponto": ponto_dto,
                "faculdade": faculdade_dto,
                "rota_complementar": rc_dto,
                "rota_id": None,
                "nome_rota": None,
                "horario": None,
                "onibus_id": None,
                "placa": None,
                "apelido_onibus": None,
                "motorista_id": None,
                "nome_motorista": None,
                "tipo_lugar": None,
                "foi_realocado": False,
                "aviso_realocacao": None,
            }

        # Distribuição realizada — carrega entidades de frota
        alocacao: Optional[AlocacaoDiariaORM] = self.session.get(
            AlocacaoDiariaORM, aloc_aluno.alocacao_diaria_id
        )
        rota: Optional[RotaPrincipalORM] = (
            self.session.get(RotaPrincipalORM, alocacao.rota_id) if alocacao else None
        )
        onibus: Optional[OnibusORM] = (
            self.session.get(OnibusORM, alocacao.onibus_id) if alocacao else None
        )
        motorista: Optional[MotoristaORM] = (
            self.session.get(MotoristaORM, alocacao.motorista_id) if alocacao else None
        )

        # Horário: ida → horario_saida; volta → horario_retorno
        horario = None
        if rota:
            horario = (
                _fmt_time(rota.horario_saida)
                if turno == "ida"
                else _fmt_time(rota.horario_retorno)
            )

        # Detecção de realocação: compara rota da alocação com rota original
        rota_original_id = _rota_original_id(agendamento, turno, rotas_ativas, comp_map)
        rota_atual_id = alocacao.rota_id if alocacao else None
        foi_realocado = (
            rota_original_id is not None
            and rota_atual_id is not None
            and rota_original_id != rota_atual_id
        )
        placa = onibus.placa_onibus if onibus else (alocacao.onibus_id if alocacao else None)
        aviso_realocacao = (
            f"Atenção: Você foi realocado. Seu ônibus para hoje é o veículo {placa}"
            if foi_realocado
            else None
        )

        return {
            "turno": turno,
            "status_alocacao": "ALOCADO",
            "mensagem_status": "Alocado",
            "ponto": ponto_dto,
            "faculdade": faculdade_dto,
            "rota_complementar": rc_dto,
            "rota_id": rota.id if rota else None,
            "nome_rota": rota.nome if rota else None,
            "horario": horario,
            "onibus_id": alocacao.onibus_id if alocacao else None,
            "placa": placa,
            "apelido_onibus": onibus.apelido_onibus if onibus else None,
            "motorista_id": motorista.id if motorista else None,
            "nome_motorista": motorista.nome_completo if motorista else None,
            "tipo_lugar": aloc_aluno.tipo_lugar,
            "foi_realocado": foi_realocado,
            "aviso_realocacao": aviso_realocacao,
        }
