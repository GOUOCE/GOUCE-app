from functools import wraps
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from sqlalchemy.orm import Session

from src.modulos.rotas.application.dtos.rota_principal_dto import (
    AtualizarRotaPrincipalDTO,
    CriarRotaPrincipalDTO,
    OpcoesRotaPrincipalResponseDTO,
    OperacaoRotaPrincipalResponseDTO,
    RotaPrincipalResponseDTO,
)
from src.modulos.rotas.application.use_cases.gerenciar_rotas_principais_use_case import (
    GerenciarRotasPrincipaisUseCase,
    RotaComAgendamentosPendentesError,
    RotaComComplementaresAtivasError,
    RotaComVinculoInativoError,
    RotaPrincipalNaoEncontradaError,
    RotaPrincipalStatusInalteradoError,
    RotaPrincipalValidationError,
)
from src.modulos.rotas.infrastructure.nome_rota import MENSAGEM_NOME_ROTA_EM_USO
from src.modulos.rotas.infrastructure.repositories.rota_principal_repository import (
    RotaPrincipalNomeEmUsoError,
    RotaPrincipalRepository,
    RotaReferenciaInvalidaError,
)
from src.shared.auth.dependencies import require_roles
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.http.validation import validation_details
from src.shared.infrastructure.db import get_session

MENSAGEM_SUCESSO = "Operação realizada com sucesso"

_ROTULOS_CAMPOS = {
    "nome": "Nome da rota",
    "horario_saida": "Horário de saída",
    "horario_retorno": "Horário de retorno",
}
_MENSAGENS_LISTA = {
    "bairros_ids": "Vincule ao menos um bairro.",
    "faculdades_ida_ids": "Informe ao menos uma faculdade na ida.",
    "faculdades_volta_ids": "Informe ao menos uma faculdade na volta.",
}


def _error_response(status_code: int, code: str, message: str, details=None):
    error = {"code": code, "message": message}
    if details is not None:
        error["details"] = details
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "error": error},
    )


def _mensagem_campo_rota(error: dict, field: str | None) -> str | None:
    """Mensagens específicas dos campos de rota; ``None`` usa a padrão."""
    error_type = error.get("type")
    context = error.get("ctx") or {}

    if field in _MENSAGENS_LISTA:
        vazia = _MENSAGENS_LISTA[field]
        if error_type in {"missing", "too_short"} or (
            error_type == "list_type" and error.get("input") is None
        ):
            return vazia
        return "Informe IDs válidos (números inteiros positivos)."

    rotulo = _ROTULOS_CAMPOS.get(field)
    if rotulo is None:
        return None
    if field in {"horario_saida", "horario_retorno"}:
        if error_type == "missing":
            return f"{rotulo} é obrigatório."
        return "Horário deve estar no formato HH:MM."
    if error_type in {"missing", "string_too_short"} or (
        error_type == "string_type" and error.get("input") is None
    ):
        return f"{rotulo} é obrigatório."
    if error_type == "string_too_long":
        return f"{rotulo} deve ter no máximo {context.get('max_length')} caracteres."
    if error_type == "string_type":
        return f"{rotulo} deve ser um texto válido."
    return None


def _detalhes_validacao_rota(errors: list[dict]) -> list[dict]:
    details = validation_details(errors)
    vistos: set[str | None] = set()
    resultado = []
    for error, detail in zip(errors, details):
        campo = detail["field"]
        # Erros de item ("bairros_ids.0") são agrupados no campo da lista.
        if campo and campo.split(".")[0] in _MENSAGENS_LISTA:
            campo = detail["field"] = campo.split(".")[0]
        if error.get("type") == "extra_forbidden":
            detail["message"] = "Campo não permitido."
        else:
            mensagem = _mensagem_campo_rota(error, campo)
            if mensagem is not None:
                detail["message"] = mensagem
        if campo in vistos and campo in _MENSAGENS_LISTA:
            continue
        vistos.add(campo)
        resultado.append(detail)
    return resultado


class RotaPrincipalValidationRoute(APIRoute):
    """Envelope de erro das rotas administrativas, com mensagens por campo."""

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
                    _detalhes_validacao_rota(error.errors()),
                )
            except (RotaPrincipalValidationError, RotaReferenciaInvalidaError) as error:
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
    prefix="/rotas-principais",
    tags=["Rotas Principais"],
    route_class=RotaPrincipalValidationRoute,
)

admin_required = require_roles(CargoEnum.ADMINISTRADOR.value)


def get_repository(session: Annotated[Session, Depends(get_session)]):
    return RotaPrincipalRepository(session)


def get_use_case(repository=Depends(get_repository)):
    return GerenciarRotasPrincipaisUseCase(repository)


def _executor_id(current_user: dict) -> int:
    return int(current_user["current_user_id"])


def _nao_encontrada() -> HTTPException:
    return HTTPException(status_code=404, detail="Rota não encontrada.")


def _nome_em_uso() -> HTTPException:
    return HTTPException(status_code=409, detail=MENSAGEM_NOME_ROTA_EM_USO)


@router.get("", response_model=list[RotaPrincipalResponseDTO])
async def listar_rotas(
    incluir_inativos: bool = Query(default=False),
    nome: str | None = Query(default=None),
    use_case: GerenciarRotasPrincipaisUseCase = Depends(get_use_case),
    _: dict = Depends(admin_required),
):
    return use_case.listar(incluir_inativos=incluir_inativos, nome=nome)


# Declarada antes de "/{rota_id}" para não ser interpretada como um ID.
@router.get("/opcoes", response_model=OpcoesRotaPrincipalResponseDTO)
async def listar_opcoes(
    use_case: GerenciarRotasPrincipaisUseCase = Depends(get_use_case),
    _: dict = Depends(admin_required),
):
    return use_case.listar_opcoes()


@router.post(
    "",
    response_model=OperacaoRotaPrincipalResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
async def criar_rota(
    dados: CriarRotaPrincipalDTO,
    current_user: dict = Depends(admin_required),
    use_case: GerenciarRotasPrincipaisUseCase = Depends(get_use_case),
):
    try:
        resultado = use_case.criar(
            dados.nome,
            dados.horario_saida,
            dados.horario_retorno,
            dados.bairros_ids,
            dados.faculdades_ida_ids,
            dados.faculdades_volta_ids,
            _executor_id(current_user),
        )
    except RotaPrincipalNomeEmUsoError:
        raise _nome_em_uso()
    return {"message": MENSAGEM_SUCESSO, "data": resultado}


@router.get("/{rota_id}", response_model=RotaPrincipalResponseDTO)
async def buscar_rota(
    rota_id: int,
    use_case: GerenciarRotasPrincipaisUseCase = Depends(get_use_case),
    _: dict = Depends(admin_required),
):
    try:
        return use_case.buscar(rota_id)
    except RotaPrincipalNaoEncontradaError:
        raise _nao_encontrada()


@router.patch("/{rota_id}", response_model=OperacaoRotaPrincipalResponseDTO)
async def atualizar_rota(
    rota_id: int,
    dados: AtualizarRotaPrincipalDTO,
    current_user: dict = Depends(admin_required),
    use_case: GerenciarRotasPrincipaisUseCase = Depends(get_use_case),
):
    campos = {nome: getattr(dados, nome) for nome in dados.model_fields_set}
    try:
        resultado = use_case.atualizar(rota_id, campos, _executor_id(current_user))
    except RotaPrincipalNaoEncontradaError:
        raise _nao_encontrada()
    except RotaPrincipalNomeEmUsoError:
        raise _nome_em_uso()
    return {"message": MENSAGEM_SUCESSO, "data": resultado}


@router.patch("/{rota_id}/inativar", response_model=OperacaoRotaPrincipalResponseDTO)
async def inativar_rota(
    rota_id: int,
    current_user: dict = Depends(admin_required),
    use_case: GerenciarRotasPrincipaisUseCase = Depends(get_use_case),
):
    try:
        resultado = use_case.inativar(rota_id, _executor_id(current_user))
    except RotaPrincipalNaoEncontradaError:
        raise _nao_encontrada()
    except (
        RotaComAgendamentosPendentesError,
        RotaComComplementaresAtivasError,
        RotaPrincipalStatusInalteradoError,
    ) as error:
        raise HTTPException(status_code=409, detail=str(error))
    return {"message": MENSAGEM_SUCESSO, "data": resultado}


@router.patch("/{rota_id}/reativar", response_model=OperacaoRotaPrincipalResponseDTO)
async def reativar_rota(
    rota_id: int,
    current_user: dict = Depends(admin_required),
    use_case: GerenciarRotasPrincipaisUseCase = Depends(get_use_case),
):
    try:
        resultado = use_case.reativar(rota_id, _executor_id(current_user))
    except RotaPrincipalNaoEncontradaError:
        raise _nao_encontrada()
    except (RotaComVinculoInativoError, RotaPrincipalStatusInalteradoError) as error:
        raise HTTPException(status_code=409, detail=str(error))
    return {"message": MENSAGEM_SUCESSO, "data": resultado}
