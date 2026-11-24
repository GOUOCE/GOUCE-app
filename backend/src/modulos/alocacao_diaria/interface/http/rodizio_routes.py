from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from src.modulos.alocacao_diaria.application.dtos.rodizio_dto import RodizioRequestDTO
from src.modulos.alocacao_diaria.application.services.rodizio_service import RodizioError, RodizioService
from src.shared.auth.dependencies import require_roles
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.infrastructure.db import get_session


router = APIRouter(prefix="/rodizio-frota", tags=["Rodízio de frota"])
admin_required = require_roles(CargoEnum.ADMINISTRADOR.value)


def _service(session: Annotated[Session, Depends(get_session)]) -> RodizioService:
    return RodizioService(session)


def _error(error: RodizioError):
    return JSONResponse(
        status_code=error.status_code,
        content={
            "success": False,
            "error": {"code": "RODIZIO_INVALIDO", "message": str(error)},
        },
    )


RODIZIO_ERROR_RESPONSES = {
    401: {
        "description": "Token ausente, inválido ou expirado.",
        "content": {
            "application/json": {
                "example": {
                    "detail": "Não autenticado",
                }
            }
        },
    },
    403: {
        "description": "Usuário autenticado sem perfil administrador.",
        "content": {
            "application/json": {
                "example": {
                    "detail": "Acesso negado",
                }
            }
        },
    },
    409: {
        "description": "Ônibus inativo ou conflito do mesmo ônibus em duas rotas no mesmo turno.",
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "error": {
                        "code": "RODIZIO_INVALIDO",
                        "message": "O mesmo ônibus não pode ser alocado a mais de uma rota no mesmo dia e horário.",
                    },
                }
            }
        },
    },
    422: {
        "description": "Dados inválidos, rota inativa ou configuração incompleta.",
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "error": {
                        "code": "RODIZIO_INVALIDO",
                        "message": "É necessário selecionar pelo menos um ônibus para o rodízio.",
                    },
                }
            }
        },
    },
}


@router.get(
    "",
    summary="Consultar contexto do rodízio",
    description=(
        "Lista as rotas principais ativas, os ônibus ativos e a configuração "
        "vigente do rodízio. Ônibus inativos não são retornados como opções."
    ),
    responses={
        **RODIZIO_ERROR_RESPONSES,
        200: {
            "description": "Contexto do rodízio e configuração vigente.",
            "content": {
                "application/json": {
                    "example": {
                        "ativa": True,
                        "configuracao": {
                            "id": 1,
                            "data_inicio": "2026-11-23",
                            "semanas": 4,
                            "itens": [
                                {
                                    "rota_id": 1,
                                    "onibus_id": "ABC1D23",
                                    "turno": "ida",
                                },
                            ],
                        },
                        "rotas": [
                            {"id": 1, "nome": "Rota Centro - UFC"},
                        ],
                        "onibus": [
                            {
                                "placa": "ABC1D23",
                                "apelido": "Ônibus Centro",
                                "assentos": 40,
                                "capacidade_em_pe": 10,
                            },
                        ],
                    }
                }
            },
        },
    },
)
def obter_rodizio(
    service: Annotated[RodizioService, Depends(_service)],
    _: dict = Depends(admin_required),
):
    return service.listar_contexto()


@router.post(
    "/preview",
    summary="Gerar prévia do rodízio",
    description=(
        "Valida a configuração e gera a escala das próximas semanas sem persistir "
        "nenhum dado. Se a demanda prevista superar assentos mais a capacidade "
        "máxima em pé, a prévia sinaliza o alerta de capacidade."
    ),
    responses={
        **RODIZIO_ERROR_RESPONSES,
        200: {
            "description": "Prévia calculada e sem alterações persistidas.",
            "content": {
                "application/json": {
                    "example": {
                        "ativa": False,
                        "data_inicio": "2026-11-23",
                        "semanas": 4,
                        "escalas": [
                            {
                                "semana": 1,
                                "data_inicio": "2026-11-23",
                                "data_fim": "2026-11-29",
                                "itens": [
                                    {
                                        "rota_id": 1,
                                        "rota_nome": "Rota Centro - UFC",
                                        "onibus_id": "ABC1D23",
                                        "turno": "ida",
                                        "demanda_prevista": 45,
                                        "capacidade_assentos": 40,
                                        "capacidade_em_pe": 10,
                                        "alerta_capacidade": None,
                                    },
                                ],
                            },
                        ],
                        "alertas": [],
                    }
                }
            },
        },
    },
)
def prever_rodizio(
    payload: RodizioRequestDTO,
    service: Annotated[RodizioService, Depends(_service)],
    _: dict = Depends(admin_required),
):
    try:
        return service.preview(payload)
    except RodizioError as error:
        return _error(error)


@router.post(
    "/confirmar",
    summary="Confirmar e aplicar rodízio",
    description=(
        "Executa novamente as validações, desativa a configuração anterior ativa "
        "e persiste o novo rodízio semanal. O rodízio passa a orientar as alocações "
        "diárias futuras da HU-016."
    ),
    responses={
        **RODIZIO_ERROR_RESPONSES,
        200: {
            "description": "Rodízio validado e persistido.",
            "content": {
                "application/json": {
                    "example": {
                        "mensagem": "Rodízio configurado e aplicado com sucesso",
                        "configuracao": {
                            "id": 1,
                            "data_inicio": "2026-11-23",
                            "semanas": 4,
                            "itens": [
                                {
                                    "rota_id": 1,
                                    "onibus_id": "ABC1D23",
                                    "turno": "ida",
                                },
                            ],
                        },
                    }
                }
            },
        },
    },
)
def confirmar_rodizio(
    payload: RodizioRequestDTO,
    service: Annotated[RodizioService, Depends(_service)],
    current_user: dict = Depends(admin_required),
):
    try:
        usuario_id = current_user.get("current_user_id") or current_user.get("sub")
        return service.confirmar(payload, int(usuario_id) if usuario_id is not None else None)
    except RodizioError as error:
        return _error(error)
