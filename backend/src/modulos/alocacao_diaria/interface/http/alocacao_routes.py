from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from src.modulos.alocacao_diaria.application.dtos.alocacao_dto import DistribuicaoRequestDTO
from src.modulos.alocacao_diaria.application.services.alocacao_service import (
    AlocacaoService,
    DistribuicaoError,
)
from src.shared.auth.dependencies import require_roles
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.infrastructure.db import get_session

router = APIRouter(prefix="/alocacao-diaria", tags=["Alocação diária"])
admin_required = require_roles(CargoEnum.ADMINISTRADOR.value)


def _service(session: Annotated[Session, Depends(get_session)]) -> AlocacaoService:
    return AlocacaoService(session)


def _error(error: DistribuicaoError):
    return JSONResponse(
        status_code=error.status_code,
        content={
            "success": False,
            "error": {"code": "DISTRIBUICAO_INVALIDA", "message": str(error)},
        },
    )


@router.get("/distribuicao-automatica")
def visualizar_distribuicao(
    data: Annotated[str, Query(pattern=r"^\d{4}-\d{2}-\d{2}$")],
    service: Annotated[AlocacaoService, Depends(_service)],
    _: dict = Depends(admin_required),
):
    try:
        data_parsed = date.fromisoformat(data)
    except ValueError:
        return _error(DistribuicaoError("Data inválida."))

    try:
        return service.preview(data_parsed)
    except DistribuicaoError as error:
        return _error(error)


@router.post("/distribuicao", status_code=201)
def persistir_distribuicao(
    payload: DistribuicaoRequestDTO,
    service: Annotated[AlocacaoService, Depends(_service)],
    _: dict = Depends(admin_required),
):
    try:
        return service.persist(payload)
    except DistribuicaoError as error:
        return _error(error)
