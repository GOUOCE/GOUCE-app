from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from src.modulos.alocacao_diaria.application.dtos.alocacao_dto import DistribuicaoRequestDTO
from src.modulos.alocacao_diaria.application.services.alocacao_service import (
    AlocacaoService,
    DistribuicaoError,
)
from src.modulos.alocacao_diaria.application.services.lista_embarque_service import (
    ListaEmbarqueError,
    ListaEmbarqueService,
)
from src.modulos.alocacao_diaria.application.services.minha_viagem_service import (
    MinhaViagemService,
)
from src.shared.auth.dependencies import require_roles
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.infrastructure.db import get_session

router = APIRouter(prefix="/alocacao-diaria", tags=["Alocação diária"])
admin_required = require_roles(CargoEnum.ADMINISTRADOR.value)

# Dependência de acesso para leitura: administrador OU representante
_leitura_required = require_roles(
    CargoEnum.ADMINISTRADOR.value,
    CargoEnum.REPRESENTANTE.value,
    CargoEnum.SUPERVISOR.value,
)


def _service(session: Annotated[Session, Depends(get_session)]) -> AlocacaoService:
    return AlocacaoService(session)


def _lista_service(session: Annotated[Session, Depends(get_session)]) -> ListaEmbarqueService:
    return ListaEmbarqueService(session)


def _minha_viagem_service(session: Annotated[Session, Depends(get_session)]) -> MinhaViagemService:
    return MinhaViagemService(session)


_aluno_required = require_roles(CargoEnum.ALUNO.value)


def _error(error: DistribuicaoError):
    return JSONResponse(
        status_code=error.status_code,
        content={
            "success": False,
            "error": {"code": "DISTRIBUICAO_INVALIDA", "message": str(error)},
        },
    )


def _lista_error(error: ListaEmbarqueError):
    return JSONResponse(
        status_code=error.status_code,
        content={
            "success": False,
            "error": {"code": "LISTA_EMBARQUE_ERRO", "message": str(error)},
        },
    )


def _roles_set(current_user: dict) -> set[str]:
    """Extrai o conjunto de perfis ativos do usuário autenticado."""
    roles = current_user.get("current_roles") or current_user.get("current_role") or []
    if isinstance(roles, str):
        return {roles}
    return set(roles)


def _parse_data(data: str) -> date:
    """Converte ``YYYY-MM-DD`` em ``date``; data civil impossível gera 422."""
    try:
        return date.fromisoformat(data)
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail="Data inválida. Informe uma data real no formato YYYY-MM-DD.",
        )


# ---------------------------------------------------------------------------
# Endpoints de distribuição — HU-016/HU-017 (apenas Administrador)
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# Endpoint auxiliar — rotas com alocação no dia (CA-01)
# Acesso: Administrador e Representante
# ---------------------------------------------------------------------------


@router.get("/rotas-do-dia")
def rotas_do_dia(
    data: Annotated[str, Query(pattern=r"^\d{4}-\d{2}-\d{2}$")],
    service: Annotated[ListaEmbarqueService, Depends(_lista_service)],
    current_user: Annotated[dict, Depends(_leitura_required)],
):
    """Lista as rotas que possuem alocação para a data informada.

    - **Administrador**: vê todas as rotas com alocação na data.
    - **Representante**: vê apenas as rotas que têm alunos vinculados à sua IES.

    Usado para popular o seletor "Rota *" na tela da Lista de Embarque (CA-01).
    """
    target = _parse_data(data)
    roles = _roles_set(current_user)
    is_admin = CargoEnum.ADMINISTRADOR.value in roles

    faculdade_id: Optional[int] = None
    if not is_admin:
        repr_data = service.obter_representante(current_user["current_user_id"])
        if not repr_data:
            raise HTTPException(
                status_code=403,
                detail="Usuário sem vínculo de representante ativo.",
            )
        faculdade_id = repr_data.get("id_faculdade_responsavel")
        if not faculdade_id:
            raise HTTPException(
                status_code=403,
                detail="Representante sem faculdade responsável definida.",
            )

    rotas = service.rotas_do_dia(target, faculdade_id=faculdade_id)
    return {"data": target.isoformat(), "rotas": rotas}


# ---------------------------------------------------------------------------
# Endpoint principal — lista de embarque (CA-01 … CA-07)
# Acesso: Administrador e Representante
# ---------------------------------------------------------------------------


@router.get("/lista-embarque")
def lista_embarque(
    data: Annotated[str, Query(pattern=r"^\d{4}-\d{2}-\d{2}$")],
    service: Annotated[ListaEmbarqueService, Depends(_lista_service)],
    current_user: Annotated[dict, Depends(_leitura_required)],
    rota_id: Annotated[Optional[int], Query(gt=0)] = None,
    turno: Annotated[
        Optional[str], Query(pattern=r"^(ida|volta)$")
    ] = None,
):
    """Retorna a lista de embarque consolidada para uma rota e data.

    **Administrador (CA-01 / CA-02):** deve informar ``rota_id`` obrigatoriamente
    (retorna ``422`` sem ele). Pode filtrar por ``turno``.

    **Representante (RN-015):** ``rota_id`` é opcional — sem ele, o sistema
    descobre automaticamente a(s) rota(s) vinculadas à IES responsável.
    Se múltiplas rotas forem encontradas, retorna ``422`` com a lista de rotas
    disponíveis. Apenas alunos da IES responsável são exibidos.

    Critérios de aceite cobertos: CA-01, CA-02, CA-03, CA-04, CA-05, CA-06, CA-07.
    """
    target = _parse_data(data)
    roles = _roles_set(current_user)
    is_admin = CargoEnum.ADMINISTRADOR.value in roles

    if is_admin:
        # CA-01 / CA-02: administrador deve informar rota_id
        if rota_id is None:
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "ROTA_ID_OBRIGATORIO",
                    "message": "O parâmetro rota_id é obrigatório para administradores.",
                },
            )
        try:
            return service.listar(target, rota_id, turno, faculdade_id=None)
        except ListaEmbarqueError as exc:
            return _lista_error(exc)

    # --- Fluxo do representante ---
    repr_data = service.obter_representante(current_user["current_user_id"])
    if not repr_data:
        raise HTTPException(
            status_code=403,
            detail="Usuário sem vínculo de representante ativo.",
        )
    faculdade_id: Optional[int] = repr_data.get("id_faculdade_responsavel")
    if not faculdade_id:
        raise HTTPException(
            status_code=403,
            detail="Representante sem faculdade responsável definida.",
        )

    # Descoberta automática de rota_id quando não informado
    if rota_id is None:
        rotas_disponiveis = service.rotas_do_dia(target, faculdade_id=faculdade_id)
        if not rotas_disponiveis:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "SEM_ROTA_NO_DIA",
                    "message": "Nenhuma rota encontrada para esta data e faculdade.",
                },
            )
        if len(rotas_disponiveis) > 1:
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "MULTIPLAS_ROTAS",
                    "message": "Múltiplas rotas disponíveis. Especifique rota_id.",
                    "rotas_disponiveis": rotas_disponiveis,
                },
            )
        rota_id = rotas_disponiveis[0]["rota_id"]

    try:
        return service.listar(target, rota_id, turno, faculdade_id=faculdade_id)
    except ListaEmbarqueError as exc:
        return _lista_error(exc)


# ---------------------------------------------------------------------------
# Endpoint HU-019 — Minha Viagem (apenas Aluno autenticado)
# ---------------------------------------------------------------------------


@router.get("/minha-viagem")
def minha_viagem(
    service: Annotated[MinhaViagemService, Depends(_minha_viagem_service)],
    current_user: Annotated[dict, Depends(_aluno_required)],
    data: Annotated[Optional[date], Query()] = None,
):
    """Retorna a situação da viagem do aluno autenticado para a data informada.

    - **data** (opcional): data no formato ``YYYY-MM-DD``. Padrão: hoje.
    - Restrito ao perfil ``aluno``. Retorna ``403`` para outros perfis.

    Critérios de aceite cobertos: CA-01, CA-02, CA-03, CA-04, FA-001, FA-002.
    """
    aluno_id = int(current_user["current_user_id"])
    target = data or date.today()
    return service.consultar(aluno_id, target)
