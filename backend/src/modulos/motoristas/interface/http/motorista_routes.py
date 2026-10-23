from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.modulos.motoristas.application.dtos.motorista_dto import (
    AtualizarMotoristaDTO,
    CriarMotoristaDTO,
    MotoristaResponseDTO,
    OperacaoMotoristaResponseDTO,
)
from src.modulos.motoristas.application.use_cases.gerenciar_motoristas_use_case import (
    GerenciarMotoristasUseCase,
    MotoristaNaoEncontradoError,
    MotoristaValidationError,
)
from src.modulos.motoristas.infrastructure.repositories.motorista_repository import (
    AlocacoesFuturasNaoVerificadasError,
    MotoristaRepository,
    MotoristaTelefoneEmUsoError,
)
from src.modulos.usuarios.interface.http.administrador_routes import (
    AdministradorValidationRoute,
)
from src.shared.auth.dependencies import require_roles
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.infrastructure.db import get_session


class MotoristaValidationRoute(AdministradorValidationRoute):
    """Mantém o mesmo envelope de erro usado nas rotas administrativas."""


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
    ativo: bool | None = Query(default=None),
    nome: str | None = Query(default=None),
    use_case: GerenciarMotoristasUseCase = Depends(get_use_case),
    _: dict = Depends(require_roles(CargoEnum.ADMINISTRADOR.value)),
):
    try:
        return use_case.listar(ativo=ativo, nome=nome)
    except MotoristaValidationError as error:
        raise HTTPException(status_code=422, detail=str(error))


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
            "message": "Motorista criado com sucesso.",
            "data": resultado,
        }
    except MotoristaValidationError as error:
        raise HTTPException(status_code=422, detail=str(error))
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
    except MotoristaValidationError as error:
        raise HTTPException(status_code=422, detail=str(error))


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
            "message": "Operação realizada com sucesso",
            "data": resultado,
        }
    except MotoristaNaoEncontradoError:
        raise HTTPException(status_code=404, detail="Motorista não encontrado.")
    except MotoristaValidationError as error:
        raise HTTPException(status_code=422, detail=str(error))
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
            "message": "Operação realizada com sucesso",
            "data": resultado,
        }
    except MotoristaNaoEncontradoError:
        raise HTTPException(status_code=404, detail="Motorista não encontrado.")
    except MotoristaValidationError as error:
        raise HTTPException(status_code=422, detail=str(error))
    except AlocacoesFuturasNaoVerificadasError:
        raise HTTPException(
            status_code=503,
            detail=(
                "A inativação está indisponível até que a verificação "
                "de alocações futuras esteja disponível."
            ),
        )


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
            "message": "Operação realizada com sucesso",
            "data": resultado,
        }
    except MotoristaNaoEncontradoError:
        raise HTTPException(status_code=404, detail="Motorista não encontrado.")
    except MotoristaValidationError as error:
        raise HTTPException(status_code=422, detail=str(error))
