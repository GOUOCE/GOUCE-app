from functools import wraps
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from sqlalchemy.orm import Session

from src.modulos.usuarios.application.dtos.representante_dto import (
    OperacaoRepresentanteResponseDTO,
    PromoverRepresentanteDTO,
    RepresentanteResponseDTO,
)
from src.modulos.usuarios.application.use_cases.gerenciar_representantes_use_case import (
    GerenciarRepresentantesUseCase,
    RepresentanteValidationError,
)
from src.modulos.usuarios.infrastructure.repositories.representante_repository import (
    AlunoNaoAprovadoOuInativoError,
    AlunoNaoEncontradoError,
    FaculdadeInativaError,
    FaculdadeNaoEncontradaError,
    RepresentanteJaAtivoError,
    RepresentanteNaoAtivoError,
    RepresentanteNaoEncontradoError,
    RepresentanteRepository,
    TipoRepresentanteNaoInicializadoError,
)
from src.shared.auth.dependencies import require_roles
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.http.validation import validation_details
from src.shared.infrastructure.db import get_session


def _error_response(status_code: int, code: str, message: str, details=None):
    error = {"code": code, "message": message}
    if details is not None:
        error["details"] = details
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "error": error},
    )


class RepresentanteValidationRoute(APIRoute):
    def get_route_handler(self):
        original_route_handler = super().get_route_handler()

        @wraps(original_route_handler)
        async def custom_route_handler(request: Request):
            try:
                return await original_route_handler(request)
            except RequestValidationError as error:
                return _error_response(
                    422,
                    "REQUEST_VALIDATION_ERROR",
                    "Requisição inválida",
                    validation_details(error.errors()),
                )
            except HTTPException as error:
                code_by_status = {
                    400: "VALIDATION_ERROR",
                    401: "UNAUTHORIZED",
                    403: "FORBIDDEN",
                    404: "RESOURCE_NOT_FOUND",
                    409: "CONFLICT",
                    422: "REQUEST_VALIDATION_ERROR",
                    500: "INTERNAL_ERROR",
                    503: "SERVICE_UNAVAILABLE",
                }
                detail = error.detail
                message = str(detail) if detail else "Requisição inválida"
                return _error_response(
                    error.status_code,
                    code_by_status.get(error.status_code, "REQUEST_ERROR"),
                    message,
                )

        return custom_route_handler


router = APIRouter(
    prefix="/representantes",
    tags=["Representantes"],
    route_class=RepresentanteValidationRoute,
)


def get_repository(session: Annotated[Session, Depends(get_session)]):
    return RepresentanteRepository(session)


def get_use_case(repository: RepresentanteRepository = Depends(get_repository)):
    return GerenciarRepresentantesUseCase(repository)


def _data(resultado) -> dict:
    return RepresentanteRepository._serializar(*resultado)


@router.get("", response_model=list[RepresentanteResponseDTO])
async def listar_representantes(
    ativo: bool | None = Query(default=None),
    faculdade_id: int | None = Query(default=None),
    repository: RepresentanteRepository = Depends(get_repository),
    _: dict = Depends(require_roles(CargoEnum.ADMINISTRADOR.value)),
):
    return repository.listar(ativo=ativo, faculdade_id=faculdade_id)


@router.post("/promover", response_model=OperacaoRepresentanteResponseDTO, status_code=status.HTTP_201_CREATED)
async def promover_aluno(
    dados: PromoverRepresentanteDTO,
    current_user: dict = Depends(require_roles(CargoEnum.ADMINISTRADOR.value)),
    use_case: GerenciarRepresentantesUseCase = Depends(get_use_case),
):
    try:
        resultado = use_case.promover(
            aluno_id=dados.aluno_id,
            faculdade_id=dados.faculdade_id,
            usuario_executor_id=int(current_user["current_user_id"]),
        )
        return {"message": "Operação realizada com sucesso", "data": _data(resultado)}
    except AlunoNaoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except FaculdadeNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except FaculdadeInativaError as error:
        raise HTTPException(status_code=422, detail=str(error))
    except AlunoNaoAprovadoOuInativoError as error:
        raise HTTPException(status_code=422, detail=str(error))
    except RepresentanteJaAtivoError as error:
        raise HTTPException(status_code=409, detail=str(error))
    except TipoRepresentanteNaoInicializadoError as error:
        raise HTTPException(status_code=500, detail=str(error))
    except RepresentanteValidationError as error:
        raise HTTPException(status_code=422, detail=str(error))


@router.patch("/{representante_id}/revogar", response_model=OperacaoRepresentanteResponseDTO)
async def revogar_representante(
    representante_id: int,
    current_user: dict = Depends(require_roles(CargoEnum.ADMINISTRADOR.value)),
    use_case: GerenciarRepresentantesUseCase = Depends(get_use_case),
):
    try:
        resultado = use_case.revogar(
            representante_id=representante_id,
            usuario_executor_id=int(current_user["current_user_id"]),
        )
        return {"message": "Operação realizada com sucesso", "data": _data(resultado)}
    except RepresentanteNaoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except RepresentanteNaoAtivoError as error:
        raise HTTPException(status_code=409, detail=str(error))
    except RepresentanteValidationError as error:
        raise HTTPException(status_code=422, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error))
