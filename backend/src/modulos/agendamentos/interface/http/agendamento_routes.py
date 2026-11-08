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
                mensagem="Nenhum agendamento foi criado.",
                agendamento_criado=False,
                estado_dia="DISPONIVEL",
            )
        return OperacaoAgendamentoDTO(
            mensagem="Agendamento realizado com sucesso",
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
        if item.status == "CANCELADO":
            return OperacaoAgendamentoDTO(
                mensagem="Agendamento cancelado com sucesso",
                agendamento=item,
                estado_dia="DISPONIVEL",
            )
        return OperacaoAgendamentoDTO(
            mensagem="Agendamento atualizado com sucesso",
            agendamento=item,
            estado_dia="AGENDADO",
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
