from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.shared.auth.jwt_service import JWTService
from src.shared.infrastructure.db import get_session
from src.modulos.usuarios.infrastructure.repositories.usuario_repository import (
    SQLAlchemyUsuarioRepository,
)
from jose import JWTError

security = HTTPBearer(auto_error=False)

def get_jwt_service():
    return JWTService()


def get_usuario_repository(session=Depends(get_session)):
    return SQLAlchemyUsuarioRepository(session)


def get_token_from_request(
    request: Request,
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)] = None
) -> str:
    """Extrai token do cookie HttpOnly ou do header Authorization"""
    # Tentar ler do cookie primeiro
    token = request.cookies.get("access_token")
    if token:
        return token
    
    # Se não encontrar no cookie, tentar do header Bearer
    if credentials:
        return credentials.credentials
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não autenticado",
        headers={"WWW-Authenticate": "Bearer"}
    )


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sessão inválida ou expirada",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _forbidden() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Acesso negado",
    )


def _parse_user_id(payload: dict) -> int | None:
    subject = payload.get("sub")
    if subject is None or isinstance(subject, bool):
        return None

    if isinstance(subject, int):
        user_id = subject
    elif isinstance(subject, str) and subject.isdecimal():
        user_id = int(subject)
    else:
        return None

    return user_id if user_id > 0 else None


def _role_matches(token_role: object, current_role: object) -> bool:
    return isinstance(token_role, str) and token_role == current_role


async def get_current_user(
    token: Annotated[str, Depends(get_token_from_request)],
    jwt_service: Annotated[JWTService, Depends(get_jwt_service)],
    repository: Annotated[SQLAlchemyUsuarioRepository, Depends(get_usuario_repository)],
) -> dict:
    """Valida o token e o estado atual do usuário no banco de dados."""
    try:
        payload = jwt_service.decode(token)
    except JWTError:
        raise _unauthorized()

    if payload.get("type") != "access":
        raise _unauthorized()

    user_id = _parse_user_id(payload)
    if user_id is None:
        raise _unauthorized()

    contexto = repository.buscar_contexto_autenticacao_por_id(user_id)
    if not contexto or not contexto.get("ativo"):
        raise _unauthorized()

    perfil_atual = contexto.get("role")
    if not perfil_atual or not _role_matches(payload.get("role"), perfil_atual):
        raise _unauthorized()

    # Mantém os claims originais e adiciona o perfil consultado no banco para
    # que as dependências de autorização nunca precisem confiar só no JWT.
    usuario_validado = dict(payload)
    usuario_validado["current_role"] = perfil_atual
    usuario_validado["current_user_id"] = user_id
    return usuario_validado


async def verify_supervisor_role(
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    if current_user.get("current_role") != "supervisor":
        raise _forbidden()
    return current_user


async def verify_supervisor_ou_tecnico(
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    """Valida usuário autenticado com role supervisor ou tecnico."""
    if current_user.get("current_role") not in {"supervisor", "tecnico"}:
        raise _forbidden()
    return current_user


async def verify_colaborador_role(
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    if current_user.get("current_role") not in {"colaborador", "tecnico"}:
        raise _forbidden()
    return current_user


async def verify_any_user(
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    """Valida autenticação e estado atual de qualquer perfil suportado."""
    return current_user


def require_roles(*roles: str):
    """Cria uma dependência de autorização baseada no perfil atual do banco."""
    allowed_roles = set(roles)

    async def dependency(
        current_user: Annotated[dict, Depends(get_current_user)],
    ) -> dict:
        if current_user.get("current_role") not in allowed_roles:
            raise _forbidden()
        return current_user

    return dependency
