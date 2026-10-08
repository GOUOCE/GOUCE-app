from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.shared.auth.dependencies import require_roles
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.infrastructure.db import get_session
from src.shared.security.argon2_hasher import Argon2PasswordHasher
from src.shared.infrastructure.services.email_service import SMTPEmailService
from src.modulos.usuarios.application.dtos.administrador_dto import (
    AdministradorResponseDTO,
    AtualizarAdministradorDTO,
    CriarAdministradorDTO,
    OperacaoAdministradorResponseDTO,
    PromoverAdministradorDTO,
)
from src.modulos.usuarios.application.use_cases.gerenciar_administradores_use_case import (
    AdministradorValidationError,
    AdministradorEmailEnvioError,
    AdministradorNaoEncontradoError,
    GerenciarAdministradoresUseCase,
)
from src.modulos.usuarios.infrastructure.repositories.administrador_repository import (
    AdministradorJaExistenteError,
    AdministradorEmailEmUsoError,
    AlunoNaoEncontradoError,
    AdministradorRepository,
    TipoAdministradorNaoInicializadoError,
)

router = APIRouter(prefix="/administradores", tags=["Administradores"])


def get_repository(session: Annotated[Session, Depends(get_session)]):
    return AdministradorRepository(session)


def get_email_service():
    return SMTPEmailService()


def get_use_case(repository=Depends(get_repository)):
    return GerenciarAdministradoresUseCase(repository, Argon2PasswordHasher())


def get_criar_administrador_dependencies(
    use_case=Depends(get_use_case),
    email_service=Depends(get_email_service),
):
    return use_case, email_service


def _data(resultado) -> dict:
    return AdministradorRepository._serializar(*resultado)


@router.get("", response_model=list[AdministradorResponseDTO])
async def listar_administradores(
    ativo: bool | None = Query(default=None),
    repository: AdministradorRepository = Depends(get_repository),
    _: dict = Depends(require_roles(CargoEnum.ADMINISTRADOR.value)),
):
    return repository.listar(ativo)


@router.post("", response_model=OperacaoAdministradorResponseDTO, status_code=status.HTTP_201_CREATED)
async def criar_administrador(
    dados: CriarAdministradorDTO,
    dependencias=Depends(get_criar_administrador_dependencies),
    _: dict = Depends(require_roles(CargoEnum.ADMINISTRADOR.value)),
):
    try:
        use_case, email_service = dependencias
        resultado, email_enviado = use_case.criar(dados.nome, str(dados.email), email_service=email_service)
        mensagem = (
            "Administrador criado com sucesso. A senha foi gerada automaticamente e enviada por e-mail."
            if email_enviado
            else "Administrador criado com sucesso, mas não foi possível enviar a senha por e-mail."
        )
        return {"message": mensagem, "data": _data(resultado)}
    except AdministradorEmailEnvioError:
        raise HTTPException(
            status_code=503,
            detail="Não foi possível enviar a senha por e-mail. O administrador não foi criado.",
        )
    except AdministradorEmailEmUsoError:
        raise HTTPException(status_code=409, detail="Este e-mail já está em uso por outro usuário no sistema.")


@router.post("/promover", response_model=OperacaoAdministradorResponseDTO, status_code=status.HTTP_201_CREATED)
async def promover_aluno(
    dados: PromoverAdministradorDTO,
    use_case: GerenciarAdministradoresUseCase = Depends(get_use_case),
    _: dict = Depends(require_roles(CargoEnum.ADMINISTRADOR.value)),
):
    try:
        resultado = use_case.promover(dados.aluno_id, str(dados.email) if dados.email else None)
        return {"message": "Operação realizada com sucesso", "data": _data(resultado)}
    except AlunoNaoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except AdministradorJaExistenteError as error:
        raise HTTPException(status_code=409, detail=str(error))
    except AdministradorValidationError as error:
        raise HTTPException(status_code=422, detail=str(error))
    except TipoAdministradorNaoInicializadoError as error:
        raise HTTPException(status_code=500, detail=str(error))
    except AdministradorValidationError as error:
        raise HTTPException(status_code=422, detail=str(error))
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Este e-mail já está em uso por outro usuário no sistema.")


@router.patch("/{administrador_id}", response_model=OperacaoAdministradorResponseDTO)
async def atualizar_administrador(
    administrador_id: int,
    dados: AtualizarAdministradorDTO,
    use_case: GerenciarAdministradoresUseCase = Depends(get_use_case),
    _: dict = Depends(require_roles(CargoEnum.ADMINISTRADOR.value)),
):
    try:
        resultado = use_case.atualizar(administrador_id, dados.nome, str(dados.email) if dados.email else None)
        return {"message": "Operação realizada com sucesso", "data": _data(resultado)}
    except AdministradorNaoEncontradoError:
        raise HTTPException(status_code=404, detail="Administrador não encontrado.")
    except AdministradorEmailEmUsoError:
        raise HTTPException(status_code=409, detail="Este e-mail já está em uso por outro usuário no sistema.")
    except AdministradorValidationError as error:
        raise HTTPException(status_code=422, detail=str(error))


@router.patch("/{administrador_id}/inativar", response_model=OperacaoAdministradorResponseDTO)
async def inativar_administrador(
    administrador_id: int,
    current_user: dict = Depends(require_roles(CargoEnum.ADMINISTRADOR.value)),
    use_case: GerenciarAdministradoresUseCase = Depends(get_use_case),
):
    try:
        resultado = use_case.inativar(administrador_id, int(current_user["current_user_id"]))
        return {"message": "Operação realizada com sucesso", "data": _data(resultado)}
    except AdministradorNaoEncontradoError:
        raise HTTPException(status_code=404, detail="Administrador não encontrado.")
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error))
