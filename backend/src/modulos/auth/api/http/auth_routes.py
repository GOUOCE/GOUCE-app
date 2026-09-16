from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from src.shared.infrastructure.db import get_session
from src.shared.auth.jwt_service import JWTService
from src.shared.security.argon2_hasher import Argon2PasswordHasher
from src.modulos.auth.application.dtos.login_dto import (
    LoginDTO,
    LoginResponseDTO,
    RefreshTokenResponseDTO,
)
from src.modulos.auth.application.use_cases.login_use_case import (
    LoginUseCase,
    UsuarioInativoError,
)
from src.modulos.auth.application.use_cases.refresh_token_use_case import RefreshTokenUseCase
from src.modulos.usuarios.infrastructure.repositories.usuario_repository import (
    SQLAlchemyUsuarioRepository,
)

router = APIRouter(prefix="/auth", tags=["Autenticação"])


def get_repository(session: Annotated[Session, Depends(get_session)]):
    return SQLAlchemyUsuarioRepository(session)


def get_hasher():
    return Argon2PasswordHasher()


def get_token_service():
    return JWTService()


@router.post(
    "/login",
    response_model=LoginResponseDTO,
    status_code=200,
    summary="Autenticar Usuário",
    description="Realiza login de usuário com validação de credenciais e verifica se a conta está ativa."
)
async def login(
    login_data: LoginDTO,
    response: Response,
    repository=Depends(get_repository),
    hasher=Depends(get_hasher),
    token_service=Depends(get_token_service),
):
    try:
        use_case = LoginUseCase(repository, hasher, token_service)
        login_response = use_case.execute(login_data)

        # Adicionar tokens em HttpOnly cookies
        response.set_cookie(
            key="access_token",
            value=login_response.token_acesso,
            httponly=True,
            samesite="lax",
            max_age=900,  # 15 minutos
        )
        response.set_cookie(
            key="refresh_token",
            value=login_response.token_atualizacao,
            httponly=True,
            samesite="lax",
            max_age=2592000 if login_data.lembrar_me else 28800,  # 30 dias ou 8 horas
        )

        return login_response
    except UsuarioInativoError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao realizar login: {str(e)}")


@router.post(
    "/refresh",
    response_model=RefreshTokenResponseDTO,
    status_code=200,
    summary="Renovar Token de Acesso",
    description="Usa o refresh token via cookie ou body para obter um novo access token."
)
async def refresh_token(
    request: Request,
    response: Response,
    token_service=Depends(get_token_service),
):
    try:
        refresh_token_val = request.cookies.get("refresh_token")

        if not refresh_token_val:
            try:
                data = await request.json()
                refresh_token_val = data.get("token_atualizacao")
            except Exception:
                refresh_token_val = None

        if not refresh_token_val:
            raise ValueError("Token de atualização não encontrado")

        use_case = RefreshTokenUseCase(token_service)
        refresh_response = use_case.execute(refresh_token_val)

        response.set_cookie(
            key="access_token",
            value=refresh_response.token_acesso,
            httponly=True,
            samesite="lax",
            max_age=900,
        )

        return refresh_response
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao renovar token: {str(e)}")
