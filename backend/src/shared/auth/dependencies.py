import inspect
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
    """Extrai token do cookie HttpOnly, header Authorization ou query params (token/access_token)"""
    # 1. Tentar ler do cookie
    token = request.cookies.get("access_token")
    if token:
        return token
    
    # 2. Tentar ler do header Bearer
    if credentials:
        return credentials.credentials

    # 3. Tentar ler dos query params (suporte para <Image source={{ uri }}> em React Native Android)
    token_param = request.query_params.get("token") or request.query_params.get("access_token")
    if token_param:
        return token_param

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não autenticado",
        headers={"WWW-Authenticate": "Bearer"}
    )


def get_optional_token_from_request(
    request: Request,
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)] = None
) -> Optional[str]:
    """Extrai token do cookie HttpOnly, header Authorization ou query params, sem erro se ausente."""
    token = request.cookies.get("access_token")
    if token:
        return token

    if credentials:
        return credentials.credentials

    token_param = request.query_params.get("token") or request.query_params.get("access_token")
    if token_param:
        return token_param

    return None


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


def _roles(value: object) -> set[str]:
    if isinstance(value, str):
        return {value}
    if isinstance(value, list):
        return {role for role in value if isinstance(role, str)}
    return set()


def _role_matches(token_role: object, current_roles: object) -> bool:
    return bool(_roles(token_role) & _roles(current_roles))


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

    perfis_atuais = contexto.get("roles") or [contexto.get("role")]
    if not perfis_atuais or not _role_matches(payload.get("role"), perfis_atuais):
        raise _unauthorized()

    # Mantém os claims originais e adiciona o perfil consultado no banco para
    # que as dependências de autorização nunca precisem confiar só no JWT.
    usuario_validado = dict(payload)
    usuario_validado["current_role"] = contexto.get("role")
    usuario_validado["current_roles"] = perfis_atuais
    usuario_validado["current_user_id"] = user_id
    usuario_validado["current_status"] = contexto.get("status")
    usuario_validado["access_expired"] = bool(contexto.get("acesso_expirado"))
    return usuario_validado


async def get_optional_current_user(
    request: Request,
    jwt_service: Annotated[JWTService, Depends(get_jwt_service)],
    repository: Annotated[SQLAlchemyUsuarioRepository, Depends(get_usuario_repository)],
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)] = None,
) -> Optional[dict]:
    """Retorna o usuário autenticado ou None se não autenticado / token inválido."""
    if get_optional_current_user in request.app.dependency_overrides:
        override = request.app.dependency_overrides[get_optional_current_user]
        res = override() if callable(override) else override
        if inspect.iscoroutine(res):
            res = await res
        return res

    if get_current_user in request.app.dependency_overrides:
        override = request.app.dependency_overrides[get_current_user]
        try:
            res = override() if callable(override) else override
            if inspect.iscoroutine(res):
                res = await res
            return res
        except HTTPException:
            return None

    token = get_optional_token_from_request(request, credentials)
    if not token:
        return None

    try:
        payload = jwt_service.decode(token)
    except JWTError:
        return None

    if payload.get("type") != "access":
        return None

    user_id = _parse_user_id(payload)
    if user_id is None:
        return None

    try:
        contexto = repository.buscar_contexto_autenticacao_por_id(user_id)
    except Exception:
        return None

    if not contexto or not contexto.get("ativo"):
        return None

    perfis_atuais = contexto.get("roles") or [contexto.get("role")]
    if not perfis_atuais or not _role_matches(payload.get("role"), perfis_atuais):
        return None

    usuario_validado = dict(payload)
    usuario_validado["current_role"] = contexto.get("role")
    usuario_validado["current_roles"] = perfis_atuais
    usuario_validado["current_user_id"] = user_id
    usuario_validado["current_status"] = contexto.get("status")
    usuario_validado["access_expired"] = bool(contexto.get("acesso_expirado"))
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
        current_roles = current_user.get("current_roles") or current_user.get("current_role")
        if not (_roles(current_roles) & allowed_roles):
            raise _forbidden()
        return current_user

    return dependency


async def verify_active_student(
    current_user: Annotated[dict, Depends(require_roles("aluno"))],
) -> dict:
    """Restringe uma operacao ao aluno com acesso liberado."""
    if current_user.get("current_status") not in {"ativado", "analise_renovacao", "rejeitado"}:
        raise _forbidden()
    return current_user


async def verify_student_standard_access(
    current_user: Annotated[dict, Depends(require_roles("aluno"))],
) -> dict:
    """Restringe recursos normais a alunos sem pendências de acesso."""
    if current_user.get("current_status") in {"rejeitado", "pendente"} or current_user.get("access_expired"):
        raise _forbidden()
    return current_user


async def verify_student_renewal_access(
    current_user: Annotated[dict, Depends(require_roles("aluno"))],
) -> dict:
    """Permite a renovação para alunos com vínculo expirado."""
    if current_user.get("current_status") in {"rejeitado", "pendente"}:
        raise _forbidden()
    return current_user


async def verify_student_profile_access(
    current_user: Annotated[dict, Depends(require_roles("aluno"))],
) -> dict:
    """Permite ao aluno consultar o próprio perfil e status, inclusive com o
    cadastro pendente (HU-031) ou o vínculo vencido (HU-028)."""
    if current_user.get("current_status") == "rejeitado":
        raise _forbidden()
    return current_user
