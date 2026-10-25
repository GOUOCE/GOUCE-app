import json
import os
import unittest
from types import SimpleNamespace

os.environ.setdefault("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/gouce_test")
os.environ.setdefault("SECRET_KEY_JWT", "test-secret-key")
os.environ.setdefault("ALGORITHM", "HS256")

from fastapi import FastAPI

from src.modulos.auth.api.http.auth_routes import (
    get_hasher,
    get_repository,
    get_token_service,
    router,
)


class RepositorioSemUsuario:
    def buscar_contexto_autenticacao_por_email(self, _email):
        return None


class HasherFalso:
    def verify(self, *_args, **_kwargs):
        return False


class LoginValidacaoMensagensTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(router)
        self.app.dependency_overrides[get_repository] = lambda: RepositorioSemUsuario()
        self.app.dependency_overrides[get_hasher] = lambda: HasherFalso()
        self.app.dependency_overrides[get_token_service] = lambda: SimpleNamespace()

    def tearDown(self):
        self.app.dependency_overrides.clear()

    async def login(self, payload):
        raw_body = json.dumps(payload).encode("utf-8")
        messages = []
        received = False

        async def receive():
            nonlocal received
            if not received:
                received = True
                return {"type": "http.request", "body": raw_body, "more_body": False}
            return {"type": "http.disconnect"}

        async def send(message):
            messages.append(message)

        scope = {
            "type": "http",
            "asgi": {"version": "3.0", "spec_version": "2.3"},
            "http_version": "1.1",
            "method": "POST",
            "scheme": "http",
            "path": "/auth/login",
            "raw_path": b"/auth/login",
            "query_string": b"",
            "headers": [
                (b"content-type", b"application/json"),
                (b"content-length", str(len(raw_body)).encode("ascii")),
            ],
            "client": ("testclient", 50000),
            "server": ("testserver", 80),
            "root_path": "",
            "state": {},
        }

        await self.app(scope, receive, send)

        start = next(m for m in messages if m["type"] == "http.response.start")
        body = b"".join(m.get("body", b"") for m in messages if m["type"] == "http.response.body")
        return start["status"], json.loads(body)

    async def test_email_com_formato_invalido_devolve_mensagem_em_portugues(self):
        status, body = await self.login({"email": "naoeumemail", "senha": "Senha@123"})

        self.assertEqual(status, 422)
        self.assertIs(body["success"], False)
        self.assertEqual(body["error"]["code"], "REQUEST_VALIDATION_ERROR")
        self.assertEqual(
            body["error"]["details"],
            [{"field": "email", "message": "Informe um e-mail válido."}],
        )
        self.assertNotIn("not a valid email", json.dumps(body))

    async def test_dominio_reservado_tambem_devolve_mensagem_em_portugues(self):
        status, body = await self.login({"email": "usuario@gouce.local", "senha": "Senha@123"})

        self.assertEqual(status, 422)
        self.assertEqual(body["error"]["details"][0]["message"], "Informe um e-mail válido.")

    async def test_senha_ausente_devolve_mensagem_em_portugues(self):
        status, body = await self.login({"email": "maria@example.com"})

        self.assertEqual(status, 422)
        self.assertEqual(
            body["error"]["details"],
            [{"field": "senha", "message": "Informe a senha."}],
        )

    async def test_credenciais_invalidas_continuam_como_401_com_detail(self):
        status, body = await self.login({"email": "maria@example.com", "senha": "Senha@123"})

        self.assertEqual(status, 401)
        self.assertEqual(body["detail"], "Email ou senha inválidos")


if __name__ == "__main__":
    unittest.main()
