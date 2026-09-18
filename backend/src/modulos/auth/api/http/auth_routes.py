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
from src.modulos.auth.application.dtos.recuperacao_senha_dto import (
    SolicitarRecuperacaoSenhaDTO,
    SolicitarRecuperacaoSenhaResponseDTO,
    ValidarTokenRecuperacaoDTO,
    ValidarTokenRecuperacaoResponseDTO,
    RedefinirSenhaDTO,
    RedefinirSenhaResponseDTO,
)
from src.modulos.auth.application.use_cases.login_use_case import (
    LoginUseCase,
    UsuarioInativoError,
)
from src.modulos.auth.application.use_cases.refresh_token_use_case import RefreshTokenUseCase
from src.modulos.auth.application.use_cases.solicitar_recuperacao_use_case import (
    SolicitarRecuperacaoSenhaUseCase,
)
from src.modulos.auth.application.use_cases.validar_token_recuperacao_use_case import (
    ValidarTokenRecuperacaoUseCase,
)
from src.modulos.auth.application.use_cases.redefinir_senha_use_case import (
    RedefinirSenhaUseCase,
)
from src.modulos.usuarios.infrastructure.repositories.usuario_repository import (
    SQLAlchemyUsuarioRepository,
)
from src.modulos.auth.infrastructure.repositories.password_reset_token_repository import (
    SQLAlchemyPasswordResetTokenRepository,
)

router = APIRouter(prefix="/auth", tags=["Autenticação"])


def get_repository(session: Annotated[Session, Depends(get_session)]):
    return SQLAlchemyUsuarioRepository(session)


def get_token_repository(session: Annotated[Session, Depends(get_session)]):
    return SQLAlchemyPasswordResetTokenRepository(session)


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


from src.shared.infrastructure.services.email_service import SMTPEmailService

def get_email_service():
    return SMTPEmailService()


@router.post(
    "/solicitar-recuperacao",
    response_model=SolicitarRecuperacaoSenhaResponseDTO,
    status_code=200,
    summary="Solicitar Recuperação de Senha",
    description="Gera token de recuperação seguro e envia instruções por e-mail. Retorna resposta genérica para evitar enumeração de contas."
)
async def solicitar_recuperacao(
    dto: SolicitarRecuperacaoSenhaDTO,
    usuario_repository=Depends(get_repository),
    token_repository=Depends(get_token_repository),
    email_service=Depends(get_email_service),
):
    try:
        use_case = SolicitarRecuperacaoSenhaUseCase(
            usuario_repository=usuario_repository,
            token_repository=token_repository,
            email_service=email_service,
        )
        return use_case.execute(dto)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao solicitar recuperação de senha: {str(e)}")


@router.post(
    "/validar-token",
    response_model=ValidarTokenRecuperacaoResponseDTO,
    status_code=200,
    summary="Validar Token de Recuperação",
    description="Verifica se o token/código de recuperação é válido, não expirou e não foi utilizado."
)
async def validar_token(
    dto: ValidarTokenRecuperacaoDTO,
    token_repository=Depends(get_token_repository),
):
    try:
        use_case = ValidarTokenRecuperacaoUseCase(token_repository)
        return use_case.execute(dto)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao validar token de recuperação: {str(e)}")


@router.get(
    "/redefinir-senha",
    include_in_schema=False
)
async def redirect_to_app(token: str):
    """
    Rota 'ponte' para abrir o aplicativo móvel a partir do link do e-mail.
    """
    from fastapi.responses import HTMLResponse

    # Tenta abrir o app no Expo Go usando o IP local e o túnel
    content = f"""
    <html>
        <body style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background-color: #F8F9FF;">
            <div style="text-align: center; padding: 20px;">
                <h2 style="color: #333;">Recuperação de Senha</h2>
                <p style="color: #666;">Clique no botão abaixo para abrir o GOUOCE no seu celular.</p>
                <div style="margin-top: 30px;">
                    <a href="exp://192.168.0.3:8081/--/redefinir-senha?token={token}"
                       style="background-color: #3e5f90; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        ABRIR NO APLICATIVO
                    </a>
                </div>
                <script>
                    // Tenta redirecionar para o esquema do Expo Go
                    window.location.href = "exp://192.168.0.3:8081/--/redefinir-senha?token={token}";
                </script>
            </div>
        </body>
    </html>
    """
    return HTMLResponse(content=content)


@router.post(
    "/redefinir-senha",
    response_model=RedefinirSenhaResponseDTO,
    status_code=200,
    summary="Redefinir Senha do Usuário",
    description="Altera a senha do usuário associada ao token e invalida o token após utilização."
)
async def redefinir_senha(
    dto: RedefinirSenhaDTO,
    usuario_repository=Depends(get_repository),
    token_repository=Depends(get_token_repository),
    hasher=Depends(get_hasher),
):
    try:
        use_case = RedefinirSenhaUseCase(usuario_repository, token_repository, hasher)
        return use_case.execute(dto)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao redefinir senha: {str(e)}")
