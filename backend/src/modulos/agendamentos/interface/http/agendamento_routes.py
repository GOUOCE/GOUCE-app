from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from src.modulos.agendamentos.application.dtos.agendamento_dto import (
    AgendamentoInputDTO,
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
        return OperacaoAgendamentoDTO(
            mensagem="Agendamento atualizado com sucesso",
            agendamento=item,
            estado_dia="AGENDADO",
        )
    except AgendamentoError as error:
        return _error(error)
