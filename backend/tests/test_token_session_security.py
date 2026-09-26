import os

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test")
os.environ.setdefault("SECRET_KEY_JWT", "test-secret")
os.environ.setdefault("ALGORITHM", "HS256")

import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from fastapi import HTTPException, Response
from jose import jwt
from jose import JWTError
from starlette.requests import Request

from src.modulos.arquivos.api.http.arquivo_routes import (
    _buscar_arquivo_autorizado,
    obter_arquivo,
)
from src.modulos.auth.api.http.auth_routes import refresh_token
from src.modulos.auth.application.dtos.login_dto import LoginDTO
from src.modulos.auth.application.use_cases.login_use_case import LoginUseCase
from src.modulos.auth.application.use_cases.refresh_token_use_case import RefreshTokenUseCase
from src.modulos.usuarios.infrastructure.repositories.usuario_repository import (
    SQLAlchemyUsuarioRepository,
)
from src.shared.auth.dependencies import (
    get_current_user,
    get_token_from_request,
    require_roles,
)
from src.shared.auth.jwt_service import ALGORITHM, SECRET, JWTService
from src.shared.enums.cargo_enum import CargoEnum


class FakeTokenService:
    def __init__(self, payload=None, error=None):
        self.payload = payload
        self.error = error

    def decode(self, token):
        if self.error:
            raise self.error
        return dict(self.payload or {})

    def refresh_access_token(self, token):
        return "novo-access-token"

    def generate(self, user, cargo, lembrar_me=False):
        return f"access-{cargo}"

    def generate_refresh_token(self, user, cargo, lembrar_me=False):
        return f"refresh-{cargo}"


class FakeRepository:
    def __init__(self, contexts=None):
        self.contexts = contexts or {}

    def buscar_contexto_autenticacao_por_id(self, user_id):
        return self.contexts.get(user_id)


class StudentRepository(SQLAlchemyUsuarioRepository):
    def __init__(self, usuario, aluno):
        self.usuario = usuario
        self.aluno = aluno

    def buscar_com_detalhes_por_id(self, user_id):
        if user_id != self.usuario.id:
            return None, None
        return self.usuario, self.aluno

    def _buscar_flag_perfil_opcional(self, *args, **kwargs):
        return None


class FakeArquivoRepository:
    def __init__(self, arquivo=None, arquivo_do_usuario=None):
        self.arquivo = arquivo
        self.arquivo_do_usuario = arquivo_do_usuario

    def buscar_por_id(self, arquivo_id):
        return self.arquivo

    def buscar_por_id_do_usuario(self, arquivo_id, user_id):
        return self.arquivo_do_usuario


def access_payload(user_id=1, role=CargoEnum.ALUNO.value):
    return {"sub": str(user_id), "role": role, "type": "access"}


def refresh_payload(user_id=1, role=CargoEnum.ALUNO.value):
    return {"sub": str(user_id), "role": role, "type": "refresh"}


def active_context(role=CargoEnum.ALUNO.value):
    return {
        "usuario": SimpleNamespace(id=1, senha="hash", limite_de_bloqueio=None),
        "role": role,
        "ativo": True,
        "status": "ativado",
        "aluno": None,
    }


def request_with_cookie(cookie_value: str) -> Request:
    return Request({
        "type": "http",
        "method": "POST",
        "path": "/auth/refresh",
        "headers": [(b"cookie", f"refresh_token={cookie_value}".encode())],
        "query_string": b"",
    })


class TokenSessionSecurityTests(unittest.IsolatedAsyncioTestCase):
    async def assert_http_status(self, awaitable, expected_status):
        with self.assertRaises(HTTPException) as raised:
            await awaitable
        self.assertEqual(raised.exception.status_code, expected_status)

    def test_missing_token_returns_401(self):
        request = Request({
            "type": "http",
            "method": "GET",
            "path": "/usuarios/me",
            "headers": [],
            "query_string": b"",
        })
        with self.assertRaises(HTTPException) as raised:
            get_token_from_request(request, None)
        self.assertEqual(raised.exception.status_code, 401)

    async def test_invalid_access_token_returns_401(self):
        service = FakeTokenService(error=JWTError("invalid"))
        repository = FakeRepository()
        await self.assert_http_status(
            get_current_user("invalid", service, repository),
            401,
        )

    async def test_expired_signed_access_token_returns_401(self):
        token = jwt.encode(
            {
                **access_payload(),
                "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
            },
            SECRET,
            algorithm=ALGORITHM,
        )

        await self.assert_http_status(
            get_current_user(
                token,
                JWTService(),
                FakeRepository({1: active_context()}),
            ),
            401,
        )

    def test_signed_token_without_expiration_is_invalid(self):
        token = jwt.encode(
            access_payload(),
            SECRET,
            algorithm=ALGORITHM,
        )

        with self.assertRaises(JWTError):
            JWTService().decode(token)

    async def test_refresh_token_is_not_accepted_as_access_token(self):
        service = FakeTokenService(payload=refresh_payload())
        repository = FakeRepository({1: active_context()})
        await self.assert_http_status(
            get_current_user("refresh", service, repository),
            401,
        )

    async def test_nonexistent_user_returns_401(self):
        service = FakeTokenService(payload=access_payload())
        await self.assert_http_status(
            get_current_user("access", service, FakeRepository()),
            401,
        )

    async def test_active_student_can_access_own_protected_context(self):
        service = FakeTokenService(payload=access_payload())
        repository = FakeRepository({1: active_context()})
        current_user = await get_current_user("access", service, repository)
        self.assertEqual(current_user["current_user_id"], 1)
        self.assertEqual(current_user["current_role"], CargoEnum.ALUNO.value)

    async def test_token_is_rejected_after_user_inactivation(self):
        context = active_context()
        repository = FakeRepository({1: context})
        service = FakeTokenService(payload=access_payload())

        await get_current_user("access", service, repository)
        context["ativo"] = False
        context["status"] = "inativado"

        await self.assert_http_status(
            get_current_user("access", service, repository),
            401,
        )

    async def test_expired_access_validity_is_rejected(self):
        usuario = SimpleNamespace(id=1, senha="hash", limite_de_bloqueio=None)
        aluno = SimpleNamespace(
            status_cadastro="ativado",
            validade_acesso=datetime.now(timezone.utc) - timedelta(minutes=1),
            motivo_reprovacao=None,
        )
        repository = StudentRepository(usuario, aluno)
        contexto = repository.buscar_contexto_autenticacao_por_id(1)

        self.assertFalse(contexto["ativo"])
        self.assertEqual(contexto["role"], CargoEnum.ALUNO.value)

        await self.assert_http_status(
            get_current_user(
                "access",
                FakeTokenService(payload=access_payload()),
                repository,
            ),
            401,
        )

    async def test_pending_student_is_rejected(self):
        usuario = SimpleNamespace(id=1, senha="hash", limite_de_bloqueio=None)
        aluno = SimpleNamespace(
            status_cadastro="pendente",
            validade_acesso=None,
            motivo_reprovacao=None,
        )
        repository = StudentRepository(usuario, aluno)

        await self.assert_http_status(
            get_current_user(
                "access",
                FakeTokenService(payload=access_payload()),
                repository,
            ),
            401,
        )

    async def test_role_divergence_returns_401(self):
        service = FakeTokenService(
            payload=access_payload(role=CargoEnum.ALUNO.value)
        )
        repository = FakeRepository({1: active_context(CargoEnum.ADMINISTRADOR.value)})
        await self.assert_http_status(
            get_current_user("access", service, repository),
            401,
        )

    async def test_student_is_forbidden_from_administrative_dependency(self):
        dependency = require_roles(CargoEnum.ADMINISTRADOR.value)
        await self.assert_http_status(
            dependency(active_context(CargoEnum.ALUNO.value)),
            403,
        )

    async def test_manual_request_cannot_bypass_role_authorization(self):
        dependency = require_roles(CargoEnum.ADMINISTRADOR.value)
        aluno_token_context = active_context(CargoEnum.ALUNO.value)

        with self.assertRaises(HTTPException) as raised:
            await dependency(aluno_token_context)

        self.assertEqual(raised.exception.status_code, 403)

    async def test_invalid_refresh_returns_401_instead_of_500(self):
        request = request_with_cookie("invalid-refresh")
        service = FakeTokenService(error=JWTError("invalid"))

        with self.assertRaises(HTTPException) as raised:
            await refresh_token(
                request,
                Response(),
                FakeRepository(),
                service,
            )

        self.assertEqual(raised.exception.status_code, 401)

    async def test_refresh_after_inactivation_returns_401(self):
        context = active_context()
        context["ativo"] = False
        context["status"] = "inativado"
        request = request_with_cookie("refresh-token")
        service = FakeTokenService(payload=refresh_payload())

        with self.assertRaises(HTTPException) as raised:
            await refresh_token(
                request,
                Response(),
                FakeRepository({1: context}),
                service,
            )

        self.assertEqual(raised.exception.status_code, 401)

    async def test_refresh_role_divergence_returns_401(self):
        request = request_with_cookie("refresh-token")
        service = FakeTokenService(
            payload=refresh_payload(role=CargoEnum.ALUNO.value)
        )
        current_context = active_context(CargoEnum.ADMINISTRADOR.value)

        with self.assertRaises(HTTPException) as raised:
            await refresh_token(
                request,
                Response(),
                FakeRepository({1: current_context}),
                service,
            )

        self.assertEqual(raised.exception.status_code, 401)

    async def test_login_uses_current_profile_instead_of_assuming_student(self):
        usuario = SimpleNamespace(
            id=1,
            senha="hash",
            nome_completo="Representante",
            email="rep@example.com",
            telefone=None,
            limite_de_bloqueio=None,
        )
        contexto = {
            "usuario": usuario,
            "role": CargoEnum.SUPERVISOR.value,
            "ativo": True,
            "status": "ativado",
            "aluno": None,
        }

        class LoginRepository:
            def buscar_contexto_autenticacao_por_email(self, email):
                return contexto

        class Hasher:
            def verify(self, senha, senha_hash):
                return True

        response = LoginUseCase(
            LoginRepository(),
            Hasher(),
            FakeTokenService(),
        ).execute(LoginDTO(email="rep@example.com", senha="senha"))

        self.assertEqual(response.usuario["role"], CargoEnum.SUPERVISOR.value)

    async def test_file_from_another_user_is_not_revealed(self):
        arquivo = SimpleNamespace(
            id="arquivo-1",
            nome="comprovante.pdf",
            url="http://minio/arquivo-1",
            content_type="application/pdf",
            tamanho_bytes=10,
        )
        repository = FakeArquivoRepository(
            arquivo=arquivo,
            arquivo_do_usuario=None,
        )
        aluno_user = {
            "sub": "1",
            "current_user_id": 1,
            "current_role": CargoEnum.ALUNO.value,
            "role": CargoEnum.ALUNO.value,
        }

        self.assertIsNone(
            _buscar_arquivo_autorizado(repository, "arquivo-1", aluno_user)
        )

        with self.assertRaises(HTTPException) as raised:
            await obter_arquivo("arquivo-1", repository, aluno_user)
        self.assertEqual(raised.exception.status_code, 404)


if __name__ == "__main__":
    unittest.main()
