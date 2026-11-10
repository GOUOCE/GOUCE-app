from typing import Annotated

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from src.modulos.agendamentos.application.dtos.agendamento_dto import (
    AgendamentoDetalheDTO,
    AgendamentoInputDTO,
    CalendarioResponseDTO,
    CancelamentoAgendamentoDTO,
    MeusAgendamentosDTO,
    OperacaoAgendamentoDTO,
)
from src.modulos.agendamentos.application.errors import AgendamentoError
from src.modulos.agendamentos.application.use_cases.gerenciar_agendamentos_use_case import (
    GerenciarAgendamentosUseCase,
)
from src.modulos.agendamentos.infrastructure.repositories.agendamento_repository import (
    AgendamentoRepository,
)
from src.shared.auth.dependencies import verify_student_standard_access
from src.shared.infrastructure.db import get_session

router = APIRouter(prefix="/transporte/agendamentos", tags=["Agendamentos"])
router_legacy = APIRouter(prefix="/agendamentos", tags=["Agendamentos Legacy"])


def _student_id(user: dict) -> int:
    return int(user["current_user_id"])


def _error(error: AgendamentoError):
    content = {"success": False, "error": {"code": error.code, "message": error.message}}
    if error.fields:
        content["error"]["details"] = [
            {"field": field, "message": error.message} for field in error.fields
        ]
    return JSONResponse(status_code=error.status_code, content=content)


def _repository(
    session: Annotated[Session, Depends(get_session)],
) -> AgendamentoRepository:
    return AgendamentoRepository(session)


def _use_case(repository: AgendamentoRepository = Depends(_repository)):
    return GerenciarAgendamentosUseCase(repository)


@router.get("/opcoes")
def opcoes(
    session: Annotated[Session, Depends(get_session)],
    user: dict = Depends(verify_student_standard_access),
):
    from src.modulos.crud_basicos.domain.entities.ponto_de_parada import PontoDeParadaORM
    from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
    from src.modulos.rotas.model.entities.rota_complementar import RotaComplementarORM

    pontos = session.query(PontoDeParadaORM).filter(PontoDeParadaORM.ativo == True).all()
    faculdades = session.query(FaculdadeORM).filter(FaculdadeORM.ativo == True).all()
    rotas_comp = session.query(RotaComplementarORM).all()

    return {
        "pontosEmbarque": [{"label": p.nome, "value": str(p.ponto_id)} for p in pontos],
        "faculdades": [{"label": f"{f.sigla} - {f.nome_faculdade}", "value": str(f.id_faculdade)} for f in faculdades],
        "rotasComplementaresIda": [{"label": "Nenhuma (Rota Direta)", "value": ""}] + [{"label": rc.nome, "value": str(rc.id)} for rc in rotas_comp],
        "rotasComplementaresVolta": [{"label": "Nenhuma (Rota Direta)", "value": ""}] + [{"label": rc.nome, "value": str(rc.id)} for rc in rotas_comp],
    }


@router_legacy.get("/opcoes")
def opcoes_legacy(
    session: Annotated[Session, Depends(get_session)],
    user: dict = Depends(verify_student_standard_access),
):
    return opcoes(session, user)


@router_legacy.get("/meus")
def meus_legacy(
    service: GerenciarAgendamentosUseCase = Depends(_use_case),
    user: dict = Depends(verify_student_standard_access),
):
    return service.my_bookings(_student_id(user))


@router.post("", response_model=OperacaoAgendamentoDTO)
def criar(
    payload: AgendamentoInputDTO,
    service: GerenciarAgendamentosUseCase = Depends(_use_case),
    user: dict = Depends(verify_student_standard_access),
):
    try:
        item = service.create(_student_id(user), payload)
        if item is None:
            return OperacaoAgendamentoDTO(
                mensagem="Agendamento criado com sucesso",
                agendamento=None,
                estado_dia="AGENDADO",
            )
        return OperacaoAgendamentoDTO(
            mensagem="Agendamento criado com sucesso",
            agendamento=item,
            estado_dia="AGENDADO",
        )
    except AgendamentoError as error:
        return _error(error)


@router.put("/{agendamento_id}", response_model=OperacaoAgendamentoDTO)
def atualizar(
    agendamento_id: int,
    payload: AgendamentoInputDTO,
    service: GerenciarAgendamentosUseCase = Depends(_use_case),
    user: dict = Depends(verify_student_standard_access),
):
    try:
        item = service.update(_student_id(user), agendamento_id, payload)
        mensagem = "Agendamento cancelado com sucesso" if item is None else "Agendamento atualizado com sucesso"
        estado_dia = "DISPONIVEL" if item is None else "AGENDADO"
        return OperacaoAgendamentoDTO(
            mensagem=mensagem,
            agendamento=item,
            estado_dia=estado_dia,
        )
    except AgendamentoError as error:
        return _error(error)


@router.get("/calendario", response_model=CalendarioResponseDTO)
def calendario(
    mes: Annotated[str, Query(pattern=r"^\d{4}-\d{2}$")],
    service: GerenciarAgendamentosUseCase = Depends(_use_case),
    user: dict = Depends(verify_student_standard_access),
):
    try:
        return service.calendar_view(_student_id(user), mes)
    except AgendamentoError as error:
        return _error(error)


@router.get("/meus", response_model=MeusAgendamentosDTO)
def meus(
    service: GerenciarAgendamentosUseCase = Depends(_use_case),
    user: dict = Depends(verify_student_standard_access),
):
    return service.my_bookings(_student_id(user))


# Declarada antes de "/{agendamento_id}" para "detalhes" não ser lido como um id.
@router.get("/detalhes", response_model=AgendamentoDetalheDTO)
def detalhes_por_data(
    data: Annotated[str, Query()],
    service: GerenciarAgendamentosUseCase = Depends(_use_case),
    user: dict = Depends(verify_student_standard_access),
):
    try:
        return service.detail_by_date(_student_id(user), data)
    except AgendamentoError as error:
        return _error(error)


@router.get("/{agendamento_id}", response_model=AgendamentoDetalheDTO)
def detalhar(
    agendamento_id: int,
    service: GerenciarAgendamentosUseCase = Depends(_use_case),
    user: dict = Depends(verify_student_standard_access),
):
    try:
        return service.detail(_student_id(user), agendamento_id)
    except AgendamentoError as error:
        return _error(error)


@router.delete("/{agendamento_id}", response_model=CancelamentoAgendamentoDTO)
def cancelar(
    agendamento_id: int,
    service: GerenciarAgendamentosUseCase = Depends(_use_case),
    user: dict = Depends(verify_student_standard_access),
):
    try:
        student_id = _student_id(user)
        service.cancel(student_id, agendamento_id)
        return CancelamentoAgendamentoDTO(
            mensagem="Agendamento cancelado com sucesso",
            estado_dia="DISPONIVEL",
            **service.summary(student_id),
        )
    except AgendamentoError as error:
        return _error(error)
