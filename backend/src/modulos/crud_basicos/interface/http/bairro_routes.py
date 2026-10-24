from functools import wraps
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.modulos.crud_basicos.application.dtos.bairro_dto import (
    AtualizarBairroDTO,
    BairroResponseDTO,
    CriarBairroDTO,
    OperacaoBairroResponseDTO,
)
from src.modulos.crud_basicos.application.services.bairro_service import (
    BairroService,
    BairroValidationError,
)
from src.modulos.crud_basicos.infrastructure.repositories.bairro_repository import (
    BairroComRotaAtivaError,
    BairroJaAtivadoError,
    BairroJaCadastradoError,
    BairroJaDesativadoError,
    BairroNaoEncontradoError,
    BairroRepository,
    PontoDeParadaJaCadastradoError,
)
from src.shared.auth.dependencies import get_optional_current_user, require_roles
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.http.validation import validation_details
from src.shared.infrastructure.db import get_session


def _error_response(status_code: int, code: str, message: str, details=None):
    error = {"code": code, "message": message}
    if details is not None:
        error["details"] = details
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
            "detail": message,
            "error": error,
        },
    )


class BairroValidationRoute(APIRoute):
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
    prefix="/bairros",
    tags=["Bairros"],
    route_class=BairroValidationRoute,
)


def get_repository(session: Annotated[Session, Depends(get_session)]) -> BairroRepository:
    return BairroRepository(session)


def get_service(
    repository: Annotated[BairroRepository, Depends(get_repository)]
) -> BairroService:
    return BairroService(repository)


admin_required = require_roles(CargoEnum.ADMINISTRADOR.value)


def is_admin_user(user: Optional[dict]) -> bool:
    if not user:
        return False
    roles = user.get("current_roles") or []
    if isinstance(roles, str):
        roles = [roles]
    role = user.get("current_role") or user.get("role")
    if role and role not in roles:
        roles = list(roles) + [role]
    return CargoEnum.ADMINISTRADOR.value in roles


def _montar_resposta_operacao(
    bairro, message: str = "Operação realizada com sucesso"
) -> OperacaoBairroResponseDTO:
    return OperacaoBairroResponseDTO(
        success=True,
        message=message,
        data=BairroResponseDTO.model_validate(bairro),
    )


@router.get("", response_model=list[BairroResponseDTO])
async def listar_bairros(
    ativo: Optional[bool] = Query(default=None),
    limite: Optional[int] = Query(default=None, ge=1),
    offset: Optional[int] = Query(default=None, ge=0),
    service: BairroService = Depends(get_service),
    current_user: Optional[dict] = Depends(get_optional_current_user),
):
    if not is_admin_user(current_user):
        ativo = True
    return service.listar(ativo=ativo, limite=limite, offset=offset)


@router.get("/{bairro_id}", response_model=BairroResponseDTO)
async def buscar_bairro(
    bairro_id: int,
    service: BairroService = Depends(get_service),
    current_user: Optional[dict] = Depends(get_optional_current_user),
):
    try:
        bairro = service.buscar_por_id(bairro_id)
        if not is_admin_user(current_user) and not bairro.ativo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bairro não encontrado.",
            )
        return bairro
    except BairroNaoEncontradoError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bairro não encontrado.",
        )
    except BairroValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )


@router.post(
    "",
    response_model=OperacaoBairroResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
async def criar_bairro(
    dados: CriarBairroDTO,
    service: BairroService = Depends(get_service),
    _: dict = Depends(admin_required),
):
    try:
        bairro = service.criar(
            nome=dados.nome,
            pontos_de_parada=dados.pontos_de_parada,
        )
        return _montar_resposta_operacao(bairro, "Operação realizada com sucesso")
    except (BairroJaCadastradoError, PontoDeParadaJaCadastradoError) as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    except BairroValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta localidade já está cadastrada.",
        )


@router.patch("/{bairro_id}", response_model=OperacaoBairroResponseDTO)
async def atualizar_bairro(
    bairro_id: int,
    dados: AtualizarBairroDTO,
    service: BairroService = Depends(get_service),
    _: dict = Depends(admin_required),
):
    try:
        bairro = service.atualizar(
            bairro_id=bairro_id,
            nome=dados.nome,
            pontos_de_parada=dados.pontos_de_parada,
        )
        return _montar_resposta_operacao(bairro, "Operação realizada com sucesso")
    except BairroNaoEncontradoError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bairro não encontrado.",
        )
    except (BairroJaCadastradoError, PontoDeParadaJaCadastradoError) as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    except BairroValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta localidade já está cadastrada.",
        )


@router.patch(
    "/{bairro_id}/ativar",
    response_model=OperacaoBairroResponseDTO,
)
@router.patch(
    "/{bairro_id}/reativar",
    response_model=OperacaoBairroResponseDTO,
    include_in_schema=False,
)
async def ativar_bairro(
    bairro_id: int,
    current_user: dict = Depends(admin_required),
    service: BairroService = Depends(get_service),
):
    try:
        user_id = current_user.get("current_user_id") or current_user.get("sub")
        usuario_executor_id = int(user_id) if user_id is not None else None
        bairro = service.ativar(
            bairro_id=bairro_id,
            usuario_executor_id=usuario_executor_id,
        )
        return _montar_resposta_operacao(bairro, "Operação realizada com sucesso")
    except BairroNaoEncontradoError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bairro não encontrado.",
        )
    except (BairroJaAtivadoError, BairroJaDesativadoError) as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )
    except BairroValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )


@router.patch(
    "/{bairro_id}/inativar",
    response_model=OperacaoBairroResponseDTO,
)
async def inativar_bairro(
    bairro_id: int,
    current_user: dict = Depends(admin_required),
    service: BairroService = Depends(get_service),
):
    try:
        user_id = current_user.get("current_user_id") or current_user.get("sub")
        usuario_executor_id = int(user_id) if user_id is not None else None
        bairro = service.inativar(
            bairro_id=bairro_id,
            usuario_executor_id=usuario_executor_id,
        )
        return _montar_resposta_operacao(bairro, "Operação realizada com sucesso")
    except BairroNaoEncontradoError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bairro não encontrado.",
        )
    except (BairroJaAtivadoError, BairroJaDesativadoError) as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )
    except BairroComRotaAtivaError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )
    except BairroValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )
