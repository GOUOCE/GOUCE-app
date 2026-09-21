import os

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test")
os.environ.setdefault("SECRET_KEY_JWT", "test-secret")
os.environ.setdefault("ALGORITHM", "HS256")

import asyncio
import json
import unittest
from types import SimpleNamespace

from fastapi import FastAPI

from src.modulos.arquivos.api.http import arquivo_routes
from src.modulos.auth.api.http import auth_routes
from src.modulos.usuarios.interface.http import usuario_routes
from src.shared.auth import dependencies
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.enums.status_cadastro_enum import StatusCadastroEnum


class RecordingUserRepository:
    def __init__(self):
        self.created_command = None

    def buscar_por_email(self, email):
        return None

    def criar_aluno(self, comando, senha_hash):
        self.created_command = comando
        return SimpleNamespace(
            id=1,
            nome_completo=comando.nome,
            email=comando.email,
            telefone=comando.telefone,
        )

    def listar_todos(self):
        return []


class FileRepository:
    def buscar_por_id(self, arquivo_id):
        return SimpleNamespace(id=arquivo_id)

    def buscar_por_id_do_usuario(self, arquivo_id, user_id):
        return None


class ContextRepository:
    def __init__(self, contexto):
        self.contexto = contexto

    def buscar_contexto_autenticacao_por_id(self, user_id):
        return self.contexto


class FakeTokenService:
    def __init__(self, payload):
        self.payload = payload

    def decode(self, token):
        return dict(self.payload)

    def refresh_access_token(self, token):
        return "novo-access-token"


class FakeHasher:
    def hash(self, senha):
        return "senha-hash"


def access_payload(role=CargoEnum.ALUNO.value):
    return {"sub": "1", "role": role, "type": "access"}


def refresh_payload(role=CargoEnum.ALUNO.value):
    return {"sub": "1", "role": role, "type": "refresh"}


class ASGIResponse:
    def __init__(self, status_code, body):
        self.status_code = status_code
        self._body = body

    def json(self):
        return json.loads(self._body.decode("utf-8"))


async def asgi_request(app, method, path, body=None, headers=None):
    request_body = b"" if body is None else json.dumps(body).encode("utf-8")
    request_headers = [(b"content-type", b"application/json")]
    request_headers.extend(
        (key.lower().encode("latin-1"), value.encode("latin-1"))
        for key, value in (headers or {}).items()
    )

    response_status = None
    response_body = bytearray()
    request_sent = False

    async def receive():
        nonlocal request_sent
        if request_sent:
            return {"type": "http.disconnect"}
        request_sent = True
        return {
            "type": "http.request",
            "body": request_body,
            "more_body": False,
        }

    async def send(message):
        nonlocal response_status
        if message["type"] == "http.response.start":
            response_status = message["status"]
        elif message["type"] == "http.response.body":
            response_body.extend(message.get("body", b""))

    await app({
        "type": "http",
        "http_version": "1.1",
        "method": method,
        "scheme": "http",
        "path": path,
        "raw_path": path.encode("utf-8"),
        "query_string": b"",
        "headers": request_headers,
        "client": ("testclient", 50000),
        "server": ("testserver", 80),
        "root_path": "",
    }, receive, send)

    return ASGIResponse(response_status, bytes(response_body))


class TokenSessionSecurityHttpTests(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(auth_routes.router)
        self.app.include_router(usuario_routes.router)
        self.app.include_router(arquivo_routes.router)

        self.user_repository = RecordingUserRepository()
        self.file_repository = FileRepository()
        self.context_repository = ContextRepository({
            "role": CargoEnum.ALUNO.value,
            "ativo": True,
        })
        self.access_token_service = FakeTokenService(access_payload())
        self.refresh_token_service = FakeTokenService(refresh_payload())

        self.app.dependency_overrides[usuario_routes.get_repository] = (
            lambda: self.user_repository
        )
        self.app.dependency_overrides[usuario_routes.get_arquivo_repository] = (
            lambda: self.file_repository
        )
        self.app.dependency_overrides[usuario_routes.get_hasher] = (
            lambda: FakeHasher()
        )
        self.app.dependency_overrides[usuario_routes.get_token_service] = (
            lambda: self.access_token_service
        )
        self.app.dependency_overrides[arquivo_routes.get_repository] = (
            lambda: self.file_repository
        )
        self.app.dependency_overrides[auth_routes.get_repository] = (
            lambda: self.context_repository
        )
        self.app.dependency_overrides[auth_routes.get_token_service] = (
            lambda: self.refresh_token_service
        )
        self.app.dependency_overrides[dependencies.get_jwt_service] = (
            lambda: self.access_token_service
        )
        self.app.dependency_overrides[dependencies.get_usuario_repository] = (
            lambda: self.context_repository
        )

    def tearDown(self):
        self.app.dependency_overrides.clear()

    def request(self, method, path, body=None, headers=None):
        return asyncio.run(asgi_request(self.app, method, path, body, headers))

    def test_public_json_registration_forces_pending_status(self):
        response = self.request(
            "POST",
            "/usuarios/cadastrar-json",
            body={
                "nome": "Maria Silva",
                "email": "maria@example.com",
                "senha": "Senha123",
                "status_cadastro": StatusCadastroEnum.ATIVADO.value,
                "faculdade_id": "faculdade-1",
                "curso": "Direito",
                "data_nascimento": "2000-01-01",
                "id_comprovante_matricula": "arquivo-1",
                "id_comprovante_residencia": "arquivo-2",
                "termos_de_uso": True,
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            self.user_repository.created_command.status_cadastro,
            StatusCadastroEnum.PENDENTE.value,
        )
        self.assertEqual(response.json()["status_cadastro"], "pendente")

    def test_student_cannot_reach_admin_route_through_http(self):
        response = self.request(
            "GET",
            "/usuarios/",
            headers={"Authorization": "Bearer access-token"},
        )

        self.assertEqual(response.status_code, 403)

    def test_inactive_session_is_rejected_by_http_dependency(self):
        self.context_repository.contexto = {
            "role": CargoEnum.ALUNO.value,
            "ativo": False,
        }

        response = self.request(
            "GET",
            "/arquivos/arquivo-1",
            headers={"Authorization": "Bearer access-token"},
        )

        self.assertEqual(response.status_code, 401)

    def test_student_cannot_read_another_users_file_through_http(self):
        response = self.request(
            "GET",
            "/arquivos/arquivo-de-outro-usuario",
            headers={"Authorization": "Bearer access-token"},
        )

        self.assertEqual(response.status_code, 404)

    def test_refresh_for_inactive_user_is_rejected_over_http(self):
        self.context_repository.contexto = {
            "role": CargoEnum.ALUNO.value,
            "ativo": False,
        }

        response = self.request(
            "POST",
            "/auth/refresh",
            body={"token_atualizacao": "refresh-token"},
        )

        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
