import json
import logging
import os
from html import escape
from typing import Annotated
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.routing import APIRoute
from sqlalchemy.orm import Session
from fastapi.responses import HTMLResponse, JSONResponse
from jose import JWTError

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
    RecuperacaoErroResponseDTO,
)
from src.modulos.auth.application.exceptions import RecuperacaoApplicationError
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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Autenticação"])


def _validation_details(errors: list[dict]) -> list[dict]:
    details = []
    for error in errors:
        location = [
            str(part)
            for part in error.get("loc", ())
            if part not in {"body", "path", "query", "form"}
        ]
        details.append({
            "field": ".".join(location) or None,
            "message": error.get("msg", "Valor inválido"),
        })
    return details


def _error_response(
    status_code: int,
    code: str,
    message: str,
    details: list[dict] | None = None,
) -> JSONResponse:
    # O cliente atual prioriza error.details para montar a mensagem exibida.
    # Repetir somente a mensagem pública evita alerta vazio sem expor detalhes.
    safe_details = details or [{"field": None, "message": message}]
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "code": code,
                "message": message,
                "details": safe_details,
            },
        },
    )


def _internal_error_response(error: Exception, context: str) -> JSONResponse:
    # Não registrar a mensagem da exceção: ela pode conter token ou credenciais.
    logger.error(
        "Erro interno no fluxo de recuperação (contexto=%s, tipo=%s)",
        context,
        type(error).__name__,
    )
    return _error_response(
        status_code=500,
        code="INTERNAL_ERROR",
        message="Erro interno ao processar a solicitação.",
    )


class RecuperacaoValidationRoute(APIRoute):
    """Padroniza validações e falhas públicas apenas das rotas de recuperação."""

    def get_route_handler(self):
        original_route_handler = super().get_route_handler()

        async def custom_route_handler(request: Request):
            try:
                return await original_route_handler(request)
            except RecuperacaoApplicationError as error:
                return _error_response(
                    status_code=error.status_code,
                    code=error.code,
                    message=error.public_message,
                    details=error.details,
                )
            except RequestValidationError as error:
                return _error_response(
                    status_code=422,
                    code="REQUEST_VALIDATION_ERROR",
                    message="Requisição inválida.",
                    details=_validation_details(error.errors()),
                )
            except HTTPException as error:
                if error.status_code >= 500:
                    return _internal_error_response(error, request.url.path)
                return _error_response(
                    status_code=error.status_code,
                    code="REQUEST_VALIDATION_ERROR" if error.status_code == 422 else "REQUEST_ERROR",
                    message="Requisição inválida.",
                )
            except Exception as error:
                return _internal_error_response(error, request.url.path)

        return custom_route_handler


RECUPERACAO_ERROR_RESPONSES = {
    400: {"model": RecuperacaoErroResponseDTO},
    422: {"model": RecuperacaoErroResponseDTO},
    500: {"model": RecuperacaoErroResponseDTO},
}

recovery_router = APIRouter(route_class=RecuperacaoValidationRoute)


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
        raise HTTPException(status_code=401, detail=str(e))
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
    repository=Depends(get_repository),
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
        refresh_response = use_case.execute(refresh_token_val, repository)

        response.set_cookie(
            key="access_token",
            value=refresh_response.token_acesso,
            httponly=True,
            samesite="lax",
            max_age=900,
        )

        return refresh_response
    except ValueError as e:
        raise HTTPException(status_code=401, detail="Token de atualização inválido ou sessão revogada")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token de atualização inválido ou expirado")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro interno ao renovar token")


from src.shared.infrastructure.services.email_service import SMTPEmailService

def get_email_service():
    return SMTPEmailService()


@recovery_router.post(
    "/solicitar-recuperacao",
    response_model=SolicitarRecuperacaoSenhaResponseDTO,
    status_code=200,
    responses=RECUPERACAO_ERROR_RESPONSES,
    summary="Solicitar Recuperação de Senha",
    description="Gera token de recuperação seguro e envia instruções por e-mail. Retorna resposta genérica para evitar enumeração de contas."
)
async def solicitar_recuperacao(
    dto: SolicitarRecuperacaoSenhaDTO,
    usuario_repository=Depends(get_repository),
    token_repository=Depends(get_token_repository),
    email_service=Depends(get_email_service),
):
    use_case = SolicitarRecuperacaoSenhaUseCase(
        usuario_repository=usuario_repository,
        token_repository=token_repository,
        email_service=email_service,
    )
    return use_case.execute(dto)


@recovery_router.post(
    "/validar-token",
    response_model=ValidarTokenRecuperacaoResponseDTO,
    status_code=200,
    responses=RECUPERACAO_ERROR_RESPONSES,
    summary="Validar Token de Recuperação",
    description="Verifica se o token/código de recuperação é válido, não expirou e não foi utilizado."
)
async def validar_token(
    dto: ValidarTokenRecuperacaoDTO,
    token_repository=Depends(get_token_repository),
):
    use_case = ValidarTokenRecuperacaoUseCase(token_repository)
    return use_case.execute(dto)


@recovery_router.get(
    "/redefinir-senha",
    include_in_schema=False,
    responses=RECUPERACAO_ERROR_RESPONSES,
)
async def redirect_to_app(token: str, request: Request):
    """
    Rota 'ponte' para abrir o aplicativo móvel a partir do link do e-mail.
    """
    token_encoded = quote(token, safe="")
    base_host = request.url.netloc
    host_ip = base_host.split(":")[0] if ":" in base_host else base_host
    default_deep_link = f"exp://{host_ip}:8081/--"
    app_deep_link = os.getenv("APP_DEEP_LINK_URL", default_deep_link)
    expo_link = f"{app_deep_link}/redefinir-senha?token={token_encoded}"
    custom_scheme_link = f"gouoce-app://redefinir-senha?token={token_encoded}"
    expo_link_html = escape(expo_link, quote=True)
    custom_scheme_link_html = escape(custom_scheme_link, quote=True)
    expo_link_js = json.dumps(expo_link)

    content = f"""
    <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="margin:0; padding:20px; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; background-color:#f8f9ff;">
            <div style="text-align:center; max-width:400px;">
                <h2 style="color:#333; margin-bottom:10px;">Recuperação de Senha</h2>
                <p style="color:#666; text-align:center; margin-bottom:30px;">Clique no botão abaixo para abrir o GOUOCE no seu celular.</p>

                <a href="{expo_link_html}"
                   style="background-color:#3e5f90; color:white; padding:18px 30px; text-decoration:none; border-radius:10px; font-weight:bold; font-size:16px; width:100%; text-align:center; box-sizing:border-box; margin-bottom:20px; display:inline-block;">
                    ABRIR NO APLICATIVO
                </a>

                <p style="font-size:12px; color:#999; margin-top:20px;">
                    Caso o botão não funcione, tente abrir o link manual:
                    <br><a href="{custom_scheme_link_html}" style="color:#3e5f90;">{custom_scheme_link_html}</a>
                </p>

                <script>
                    // Tenta redirecionar automaticamente para o Expo Go
                    setTimeout(function() {{
                        window.location.href = {expo_link_js};
                    }}, 1000);
                </script>
            </div>
        </body>
    </html>
    """
    return HTMLResponse(content=content)


@recovery_router.post(
    "/redefinir-senha",
    response_model=RedefinirSenhaResponseDTO,
    status_code=200,
    responses=RECUPERACAO_ERROR_RESPONSES,
    summary="Redefinir Senha do Usuário",
    description="Altera a senha do usuário associada ao token e invalida o token após utilização."
)
async def redefinir_senha(
    dto: RedefinirSenhaDTO,
    usuario_repository=Depends(get_repository),
    token_repository=Depends(get_token_repository),
    hasher=Depends(get_hasher),
):
    use_case = RedefinirSenhaUseCase(usuario_repository, token_repository, hasher)
    return use_case.execute(dto)


router.include_router(recovery_router)
