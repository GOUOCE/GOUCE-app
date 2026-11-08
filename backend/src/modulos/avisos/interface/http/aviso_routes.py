from functools import wraps
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from sqlalchemy.orm import Session

from src.modulos.avisos.application.dtos.aviso_dto import (
    AvisoResponseDTO,
    CriarAvisoDTO,
    OperacaoAvisoResponseDTO,
)
from src.modulos.avisos.application.use_cases.gerenciar_avisos_use_case import (
    AvisoValidationError,
    GerenciarAvisosUseCase,
)
from src.modulos.avisos.infrastructure.repositories.aviso_repository import (
    AvisoRepository,
)
from src.shared.auth.dependencies import require_roles, verify_any_user
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


def _mensagem_campo_aviso(error: dict, field: str | None) -> str | None:
    """Mensagens em português específicas para os campos de aviso."""
    if field not in {"titulo", "descricao", "conteudo"}:
        return None

    is_titulo = field == "titulo"
    rotulo = "Título" if is_titulo else "Descrição"
    obrigatorio = "Título é obrigatório." if is_titulo else "Descrição é obrigatória."

    error_type = error.get("type")
    context = error.get("ctx") or {}
    input_val = error.get("input")

    if error_type == "missing" or (error_type == "string_type" and input_val is None):
        return obrigatorio

    if error_type == "string_too_short":
        if isinstance(input_val, str) and not input_val.strip():
            return obrigatorio
        min_len = context.get("min_length", 3)
        if is_titulo:
            return f"O título deve ter pelo menos {min_len} caracteres."
        return f"A descrição deve ter pelo menos {min_len} caracteres."

    if error_type == "string_too_long":
        max_len = context.get("max_length")
        if is_titulo:
            return f"O título deve ter no máximo {max_len} caracteres."
        return f"A descrição deve ter no máximo {max_len} caracteres."

    if error_type == "string_type":
        return f"{rotulo} deve ser um texto válido."

    return None


def _detalhes_validacao_aviso(errors: list[dict]) -> list[dict]:
    details = validation_details(errors)
    for error, detail in zip(errors, details):
        if error.get("type") == "extra_forbidden":
            detail["message"] = "Campo não permitido."
            continue
        mensagem = _mensagem_campo_aviso(error, detail["field"])
        if mensagem is not None:
            if detail["field"] == "conteudo":
                detail["field"] = "descricao"
            detail["message"] = mensagem
    return details


class AvisoValidationRoute(APIRoute):
    """Envelope de erro padronizado com mensagens em português por campo."""

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
                    _detalhes_validacao_aviso(error.errors()),
                )
            except AvisoValidationError as error:
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
    prefix="/avisos",
    tags=["Avisos"],
    route_class=AvisoValidationRoute,
)


def get_repository(session: Annotated[Session, Depends(get_session)]):
    return AvisoRepository(session)


def get_use_case(repository: Annotated[AvisoRepository, Depends(get_repository)]):
    return GerenciarAvisosUseCase(repository)


@router.get("", response_model=list[AvisoResponseDTO])
async def listar_avisos(
    titulo: str | None = Query(default=None),
    busca: str | None = Query(default=None),
    use_case: GerenciarAvisosUseCase = Depends(get_use_case),
    _: dict = Depends(verify_any_user),
):
    termo_busca = titulo if titulo is not None else busca
    return use_case.listar(titulo=termo_busca)


@router.post(
    "",
    response_model=OperacaoAvisoResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
async def publicar_aviso(
    dados: CriarAvisoDTO,
    use_case: GerenciarAvisosUseCase = Depends(get_use_case),
    current_user: dict = Depends(require_roles(CargoEnum.ADMINISTRADOR.value)),
):
    resultado = use_case.criar(
        titulo=dados.titulo,
        descricao=dados.descricao,
        autor_id=int(current_user["current_user_id"]),
    )
    return {
        "message": "Aviso publicado com sucesso.",
        "data": resultado,
    }
