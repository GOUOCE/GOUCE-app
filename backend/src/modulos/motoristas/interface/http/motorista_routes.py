from functools import wraps
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from sqlalchemy.orm import Session

from src.modulos.motoristas.application.dtos.motorista_dto import (
    AtualizarMotoristaDTO,
    CriarMotoristaDTO,
    MotoristaResponseDTO,
    OperacaoMotoristaResponseDTO,
)
from src.modulos.motoristas.application.use_cases.gerenciar_motoristas_use_case import (
    GerenciarMotoristasUseCase,
    MotoristaComAlocacoesPendentesError,
    MotoristaNaoEncontradoError,
    MotoristaValidationError,
)
from src.modulos.motoristas.infrastructure.repositories.motorista_repository import (
    MotoristaRepository,
    MotoristaTelefoneEmUsoError,
)
from src.shared.auth.dependencies import require_roles
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.http.validation import validation_details
from src.shared.infrastructure.db import get_session


_ROTULOS_CAMPOS = {
    "nome": "Nome Completo",
    "telefone": "Telefone",
}


def _error_response(status_code: int, code: str, message: str, details=None):
    error = {"code": code, "message": message}
    if details is not None:
        error["details"] = details
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "error": error},
    )


def _mensagem_campo_motorista(error: dict, field: str | None) -> str | None:
    """Mensagens específicas dos campos de motorista; ``None`` usa a padrão."""
    rotulo = _ROTULOS_CAMPOS.get(field)
    if rotulo is None:
        return None

    error_type = error.get("type")
    context = error.get("ctx") or {}
    if error_type in {"missing", "string_too_short"} or (
        error_type == "string_type" and error.get("input") is None
    ):
        return f"{rotulo} é obrigatório."
    if error_type == "string_too_long":
        return (
            f"{rotulo} deve ter no máximo "
            f"{context.get('max_length')} caracteres."
        )
    if error_type == "string_type":
        return f"{rotulo} deve ser um texto válido."
    if error_type == "value_error" and field == "telefone":
        return "Telefone deve conter ao menos um dígito."
    return None


def _detalhes_validacao_motorista(errors: list[dict]) -> list[dict]:
    details = validation_details(errors)
    for error, detail in zip(errors, details):
        if error.get("type") == "extra_forbidden":
            detail["message"] = "Campo não permitido."
            continue
        mensagem = _mensagem_campo_motorista(error, detail["field"])
        if mensagem is not None:
            detail["message"] = mensagem
    return details


class MotoristaValidationRoute(APIRoute):
    """Mesmo envelope de erro das rotas administrativas, com mensagens por campo."""

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
                    _detalhes_validacao_motorista(error.errors()),
                )
            except MotoristaValidationError as error:
                return _error_response(
                    422,
                    "REQUEST_VALIDATION_ERROR",
                    "Requisição inválida",
                    [{"field": error.field, "message": str(error)}],
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
    prefix="/motoristas",
    tags=["Motoristas"],
    route_class=MotoristaValidationRoute,
)


def get_repository(session: Annotated[Session, Depends(get_session)]):
    return MotoristaRepository(session)


def get_use_case(repository=Depends(get_repository)):
    return GerenciarMotoristasUseCase(repository)


@router.get("", response_model=list[MotoristaResponseDTO])
async def listar_motoristas(
    incluir_inativos: bool = Query(default=False),
    nome: str | None = Query(default=None),
    use_case: GerenciarMotoristasUseCase = Depends(get_use_case),
    _: dict = Depends(require_roles(CargoEnum.ADMINISTRADOR.value)),
):
    return use_case.listar(incluir_inativos=incluir_inativos, nome=nome)


@router.post(
    "",
    response_model=OperacaoMotoristaResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
async def criar_motorista(
    dados: CriarMotoristaDTO,
    use_case: GerenciarMotoristasUseCase = Depends(get_use_case),
    _: dict = Depends(require_roles(CargoEnum.ADMINISTRADOR.value)),
):
    try:
        resultado = use_case.criar(dados.nome, dados.telefone)
        return {
            "message": "Motorista cadastrado com sucesso.",
            "data": resultado,
        }
    except MotoristaTelefoneEmUsoError:
        raise HTTPException(
            status_code=409,
            detail="Este profissional já está registrado.",
        )


@router.get("/{motorista_id}", response_model=MotoristaResponseDTO)
async def buscar_motorista(
    motorista_id: int,
    use_case: GerenciarMotoristasUseCase = Depends(get_use_case),
    _: dict = Depends(require_roles(CargoEnum.ADMINISTRADOR.value)),
):
    try:
        return use_case.buscar(motorista_id)
    except MotoristaNaoEncontradoError:
        raise HTTPException(status_code=404, detail="Motorista não encontrado.")


@router.patch(
    "/{motorista_id}",
    response_model=OperacaoMotoristaResponseDTO,
)
async def atualizar_motorista(
    motorista_id: int,
    dados: AtualizarMotoristaDTO,
    use_case: GerenciarMotoristasUseCase = Depends(get_use_case),
    _: dict = Depends(require_roles(CargoEnum.ADMINISTRADOR.value)),
):
    try:
        resultado = use_case.atualizar(
            motorista_id,
            dados.nome,
            dados.telefone,
        )
        return {
            "message": "Motorista alterado com sucesso.",
            "data": resultado,
        }
    except MotoristaNaoEncontradoError:
        raise HTTPException(status_code=404, detail="Motorista não encontrado.")
    except MotoristaTelefoneEmUsoError:
        raise HTTPException(
            status_code=409,
            detail="Este profissional já está registrado.",
        )


@router.patch(
    "/{motorista_id}/inativar",
    response_model=OperacaoMotoristaResponseDTO,
)
async def inativar_motorista(
    motorista_id: int,
    current_user: dict = Depends(require_roles(CargoEnum.ADMINISTRADOR.value)),
    use_case: GerenciarMotoristasUseCase = Depends(get_use_case),
):
    try:
        resultado = use_case.inativar(
            motorista_id,
            int(current_user["current_user_id"]),
        )
        return {
            "message": "Motorista inativado com sucesso.",
            "data": resultado,
        }
    except MotoristaNaoEncontradoError:
        raise HTTPException(status_code=404, detail="Motorista não encontrado.")
    except MotoristaComAlocacoesPendentesError as error:
        raise HTTPException(status_code=409, detail=str(error))


@router.patch(
    "/{motorista_id}/reativar",
    response_model=OperacaoMotoristaResponseDTO,
)
async def reativar_motorista(
    motorista_id: int,
    current_user: dict = Depends(require_roles(CargoEnum.ADMINISTRADOR.value)),
    use_case: GerenciarMotoristasUseCase = Depends(get_use_case),
):
    try:
        resultado = use_case.reativar(
            motorista_id,
            int(current_user["current_user_id"]),
        )
        return {
            "message": "Motorista reativado com sucesso.",
            "data": resultado,
        }
    except MotoristaNaoEncontradoError:
        raise HTTPException(status_code=404, detail="Motorista não encontrado.")
