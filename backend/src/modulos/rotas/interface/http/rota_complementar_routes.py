from functools import wraps
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from sqlalchemy.orm import Session

from src.modulos.rotas.application.dtos.rota_complementar_dto import (
    AtualizarRotaComplementarDTO,
    CriarRotaComplementarDTO,
    OperacaoRotaComplementarResponseDTO,
    OpcoesRotaComplementarResponseDTO,
    RotaComplementarResponseDTO,
)
from src.modulos.rotas.application.use_cases.gerenciar_rotas_complementares_use_case import (
    MENSAGEM_ID_PRINCIPAL_INVALIDO,
    GerenciarRotasComplementaresUseCase,
    RotaComplementarComAgendamentosPendentesError,
    RotaComplementarNaoEncontradaError,
    RotaComplementarStatusInalteradoError,
    RotaComplementarValidationError,
)
from src.modulos.rotas.infrastructure.repositories.rota_complementar_repository import (
    RotaComplementarComPrincipalInativaError,
    RotaComplementarNomeEmUsoError,
    RotaComplementarReferenciaInvalidaError,
    RotaComplementarRepository,
)
from src.shared.auth.dependencies import require_roles
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.http.validation import validation_details
from src.shared.infrastructure.db import get_session

MENSAGEM_SUCESSO = "Operação realizada com sucesso"

_ROTULOS_TEXTO = {
    "nome": "Nome da rota complementar",
    "ponto_conexao": "Ponto de conexão",
}
_ERRO_DE_TEXTO_VAZIO = {"missing", "string_too_short"}


def _error_response(status_code: int, code: str, message: str, details=None):
    error = {"code": code, "message": message}
    if details is not None:
        error["details"] = details
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "error": error},
    )


def _mensagem_campo_complementar(error: dict, field: str | None) -> str | None:
    """Mensagens específicas dos campos da rota complementar; ``None`` usa a padrão."""
    error_type = error.get("type")
    context = error.get("ctx") or {}
    sem_valor = error_type == "missing" or error.get("input") is None

    if field in _ROTULOS_TEXTO:
        rotulo = _ROTULOS_TEXTO[field]
        if error_type in _ERRO_DE_TEXTO_VAZIO or (
            error_type == "string_type" and sem_valor
        ):
            return f"{rotulo} é obrigatório."
        if error_type == "string_too_long":
            return f"{rotulo} deve ter no máximo {context.get('max_length')} caracteres."
        if error_type == "string_type":
            return f"{rotulo} deve ser um texto válido."
        return None
    if field == "horario_saida":
        if sem_valor:
            return "Horário de saída é obrigatório."
        return "Horário deve estar no formato HH:MM."
    if field == "rota_principal_id":
        if sem_valor:
            return "Rota principal vinculada é obrigatória."
        return MENSAGEM_ID_PRINCIPAL_INVALIDO
    return None


def _detalhes_validacao_complementar(errors: list[dict]) -> list[dict]:
    details = validation_details(errors)
    for error, detail in zip(errors, details):
        if error.get("type") == "extra_forbidden":
            detail["message"] = "Campo não permitido."
            continue
        mensagem = _mensagem_campo_complementar(error, detail["field"])
        if mensagem is not None:
            detail["message"] = mensagem
    return details


class RotaComplementarValidationRoute(APIRoute):
    """Envelope de erro das rotas complementares, com mensagens por campo."""

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
                    _detalhes_validacao_complementar(error.errors()),
                )
            except (
                RotaComplementarValidationError,
                RotaComplementarReferenciaInvalidaError,
            ) as error:
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
    prefix="/rotas-complementares",
    tags=["Rotas Complementares"],
    route_class=RotaComplementarValidationRoute,
)

admin_required = require_roles(CargoEnum.ADMINISTRADOR.value)


def get_repository(session: Annotated[Session, Depends(get_session)]):
    return RotaComplementarRepository(session)


def get_use_case(repository=Depends(get_repository)):
    return GerenciarRotasComplementaresUseCase(repository)


def _executor_id(current_user: dict) -> int:
    return int(current_user["current_user_id"])


def _nao_encontrada() -> HTTPException:
    return HTTPException(status_code=404, detail="Rota complementar não encontrada.")


def _nome_em_uso() -> HTTPException:
    return HTTPException(
        status_code=409, detail="Já existe uma rota complementar com este nome."
    )


@router.get("", response_model=list[RotaComplementarResponseDTO])
async def listar_rotas_complementares(
    incluir_inativos: bool = Query(default=False),
    nome: str | None = Query(default=None),
    rota_principal_id: int | None = Query(default=None),
    use_case: GerenciarRotasComplementaresUseCase = Depends(get_use_case),
    _: dict = Depends(admin_required),
):
    return use_case.listar(
        incluir_inativos=incluir_inativos,
        nome=nome,
        rota_principal_id=rota_principal_id,
    )


# Declarada antes de "/{rota_id}" para não ser interpretada como um ID.
@router.get("/opcoes", response_model=OpcoesRotaComplementarResponseDTO)
async def listar_opcoes(
    use_case: GerenciarRotasComplementaresUseCase = Depends(get_use_case),
    _: dict = Depends(admin_required),
):
    return use_case.listar_opcoes()


@router.post(
    "",
    response_model=OperacaoRotaComplementarResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
async def criar_rota_complementar(
    dados: CriarRotaComplementarDTO,
    current_user: dict = Depends(admin_required),
    use_case: GerenciarRotasComplementaresUseCase = Depends(get_use_case),
):
    try:
        resultado = use_case.criar(
            dados.nome,
            dados.horario_saida,
            dados.ponto_conexao,
            dados.rota_principal_id,
            _executor_id(current_user),
        )
    except RotaComplementarNomeEmUsoError:
        raise _nome_em_uso()
    return {"message": MENSAGEM_SUCESSO, "data": resultado}


@router.get("/{rota_id}", response_model=RotaComplementarResponseDTO)
async def buscar_rota_complementar(
    rota_id: int,
    use_case: GerenciarRotasComplementaresUseCase = Depends(get_use_case),
    _: dict = Depends(admin_required),
):
    try:
        return use_case.buscar(rota_id)
    except RotaComplementarNaoEncontradaError:
        raise _nao_encontrada()


@router.patch("/{rota_id}", response_model=OperacaoRotaComplementarResponseDTO)
async def atualizar_rota_complementar(
    rota_id: int,
    dados: AtualizarRotaComplementarDTO,
    current_user: dict = Depends(admin_required),
    use_case: GerenciarRotasComplementaresUseCase = Depends(get_use_case),
):
    campos = {nome: getattr(dados, nome) for nome in dados.model_fields_set}
    try:
        resultado = use_case.atualizar(rota_id, campos, _executor_id(current_user))
    except RotaComplementarNaoEncontradaError:
        raise _nao_encontrada()
    except RotaComplementarNomeEmUsoError:
        raise _nome_em_uso()
    return {"message": MENSAGEM_SUCESSO, "data": resultado}


@router.patch(
    "/{rota_id}/inativar", response_model=OperacaoRotaComplementarResponseDTO
)
async def inativar_rota_complementar(
    rota_id: int,
    current_user: dict = Depends(admin_required),
    use_case: GerenciarRotasComplementaresUseCase = Depends(get_use_case),
):
    try:
        resultado = use_case.inativar(rota_id, _executor_id(current_user))
    except RotaComplementarNaoEncontradaError:
        raise _nao_encontrada()
    except (
        RotaComplementarComAgendamentosPendentesError,
        RotaComplementarStatusInalteradoError,
    ) as error:
        raise HTTPException(status_code=409, detail=str(error))
    return {"message": MENSAGEM_SUCESSO, "data": resultado}


@router.patch(
    "/{rota_id}/reativar", response_model=OperacaoRotaComplementarResponseDTO
)
async def reativar_rota_complementar(
    rota_id: int,
    current_user: dict = Depends(admin_required),
    use_case: GerenciarRotasComplementaresUseCase = Depends(get_use_case),
):
    try:
        resultado = use_case.reativar(rota_id, _executor_id(current_user))
    except RotaComplementarNaoEncontradaError:
        raise _nao_encontrada()
    except (
        RotaComplementarComPrincipalInativaError,
        RotaComplementarStatusInalteradoError,
    ) as error:
        raise HTTPException(status_code=409, detail=str(error))
    return {"message": MENSAGEM_SUCESSO, "data": resultado}
