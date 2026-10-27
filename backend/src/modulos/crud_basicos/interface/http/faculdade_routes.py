from functools import wraps
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.modulos.crud_basicos.application.dtos.faculdade_dto import (
    AtualizarFaculdadeDTO,
    CriarFaculdadeDTO,
    FaculdadeResponseDTO,
    OperacaoFaculdadeResponseDTO,
)
from src.modulos.crud_basicos.application.services.faculdade_service import (
    FaculdadeService,
    FaculdadeValidationError,
)
from src.modulos.crud_basicos.infrastructure.repositories.faculdade_repository import (
    FaculdadeComRotaAtivaError,
    FaculdadeJaAtivadaError,
    FaculdadeJaCadastradaError,
    FaculdadeJaDesativadaError,
    FaculdadeNaoEncontradaError,
    FaculdadeRepository,
)
from src.modulos.rotas.infrastructure.rota_ativa_checkers import (
    faculdade_em_rota_ativa,
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


class FaculdadeValidationRoute(APIRoute):
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
    prefix="/faculdades",
    tags=["Faculdades"],
    route_class=FaculdadeValidationRoute,
)


def get_repository(session: Annotated[Session, Depends(get_session)]) -> FaculdadeRepository:
    return FaculdadeRepository(
        session, rota_ativa_checker=faculdade_em_rota_ativa(session)
    )


def get_service(
    repository: Annotated[FaculdadeRepository, Depends(get_repository)]
) -> FaculdadeService:
    return FaculdadeService(repository)


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
    faculdade, message: str = "Operação realizada com sucesso"
) -> OperacaoFaculdadeResponseDTO:
    return OperacaoFaculdadeResponseDTO(
        success=True,
        message=message,
        data=FaculdadeResponseDTO.model_validate(faculdade),
    )


@router.get("", response_model=list[FaculdadeResponseDTO])
async def listar_faculdades(
    ativo: Optional[bool] = Query(default=None),
    limite: Optional[int] = Query(default=None, ge=1),
    offset: Optional[int] = Query(default=None, ge=0),
    service: FaculdadeService = Depends(get_service),
    current_user: Optional[dict] = Depends(get_optional_current_user),
):
    if not is_admin_user(current_user):
        ativo = True
    return service.listar(ativo=ativo, limite=limite, offset=offset)


@router.get("/{faculdade_id}", response_model=FaculdadeResponseDTO)
async def buscar_faculdade(
    faculdade_id: int,
    service: FaculdadeService = Depends(get_service),
    current_user: Optional[dict] = Depends(get_optional_current_user),
):
    try:
        faculdade = service.buscar_por_id(faculdade_id)
        if not is_admin_user(current_user) and not faculdade.ativo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Faculdade não encontrada.",
            )
        return faculdade
    except FaculdadeNaoEncontradaError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Faculdade não encontrada.",
        )
    except FaculdadeValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )


@router.post(
    "",
    response_model=OperacaoFaculdadeResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
async def criar_faculdade(
    dados: CriarFaculdadeDTO,
    service: FaculdadeService = Depends(get_service),
    _: dict = Depends(admin_required),
):
    try:
        faculdade = service.criar(nome=dados.nome, campus=dados.campus, sigla=dados.sigla)
        return _montar_resposta_operacao(faculdade, "Operação realizada com sucesso")
    except FaculdadeJaCadastradaError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    except FaculdadeValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta faculdade já está cadastrada.",
        )


@router.patch("/{faculdade_id}", response_model=OperacaoFaculdadeResponseDTO)
async def atualizar_faculdade(
    faculdade_id: int,
    dados: AtualizarFaculdadeDTO,
    service: FaculdadeService = Depends(get_service),
    current_user: dict = Depends(admin_required)
):
    try:
        user_id = current_user.get("current_user_id") or current_user.get("sub")
        usuario_executor_id = int(user_id) if user_id is not None else None
        faculdade = service.atualizar(
            faculdade_id=faculdade_id,
            nome=dados.nome,
            usuario_executor_id=usuario_executor_id,
            campus=dados.campus,
            sigla=dados.sigla,
            ativo=dados.ativo,
        )
        return _montar_resposta_operacao(faculdade, "Operação realizada com sucesso")
    except FaculdadeNaoEncontradaError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Faculdade não encontrada.",
        )
    except (FaculdadeJaCadastradaError, FaculdadeComRotaAtivaError) as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    except FaculdadeValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta faculdade já está cadastrada.",
        )


@router.patch(
    "/{faculdade_id}/ativar",
    response_model=OperacaoFaculdadeResponseDTO,
)
async def ativar_faculdade(
    faculdade_id: int,
    current_user: dict = Depends(admin_required),
    service: FaculdadeService = Depends(get_service),
):
    try:
        user_id = current_user.get("current_user_id") or current_user.get("sub")
        usuario_executor_id = int(user_id) if user_id is not None else None
        faculdade = service.ativar(
            faculdade_id=faculdade_id,
            usuario_executor_id=usuario_executor_id,
        )
        return _montar_resposta_operacao(faculdade, "Operação realizada com sucesso")
    except FaculdadeNaoEncontradaError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Faculdade não encontrada.",
        )
    except FaculdadeJaAtivadaError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    except FaculdadeValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )


@router.patch(
    "/{faculdade_id}/inativar",
    response_model=OperacaoFaculdadeResponseDTO,
)
async def inativar_faculdade(
    faculdade_id: int,
    current_user: dict = Depends(admin_required),
    service: FaculdadeService = Depends(get_service),
):
    try:
        user_id = current_user.get("current_user_id") or current_user.get("sub")
        usuario_executor_id = int(user_id) if user_id is not None else None
        faculdade = service.inativar(
            faculdade_id=faculdade_id,
            usuario_executor_id=usuario_executor_id,
        )
        return _montar_resposta_operacao(faculdade, "Operação realizada com sucesso")
    except FaculdadeNaoEncontradaError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Faculdade não encontrada.",
        )
    except (FaculdadeComRotaAtivaError, FaculdadeJaDesativadaError) as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    except FaculdadeValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )
