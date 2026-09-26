import json
import os
import unittest
from types import SimpleNamespace

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/gouce_test",
)

from fastapi import FastAPI

from src.modulos.usuarios.interface.http.usuario_routes import (
    get_hasher,
    get_repository,
    router,
)
from src.shared.auth.dependencies import verify_any_user
from src.shared.validators.telefone_validator import TelefoneValidator


class FakeEditRepository:
    def __init__(self):
        self.usuario = SimpleNamespace(
            id=1,
            nome_completo="Maria da Silva",
            email="atual@example.com",
            telefone="85999990000",
            senha="hash-da-senha",
        )
        self.aluno = SimpleNamespace(aluno_id=1, bairro_id="Centro")
        self.email_ocupado = "ocupado@example.com"
        self.update_calls = []
        self.email_update_calls = []
        self.commit_count = 0
        self.internal_error = None

    def _raise_internal_error(self):
        if self.internal_error:
            raise self.internal_error

    def buscar_com_detalhes_por_id(self, user_id):
        self._raise_internal_error()
        if user_id != self.usuario.id:
            return None, None
        return self.usuario, self.aluno

    def atualizar_dados_parciais(self, user_id, telefone=None, bairro_id=None):
        self._raise_internal_error()
        self.update_calls.append(
            {"user_id": user_id, "telefone": telefone, "bairro_id": bairro_id}
        )
        if telefone is not None:
            self.usuario.telefone = telefone
        if bairro_id is not None:
            self.aluno.bairro_id = bairro_id
        self.commit_count += 1
        return self.usuario, self.aluno

    def buscar_por_email(self, email):
        self._raise_internal_error()
        if email == self.email_ocupado:
            return SimpleNamespace(id=2)
        return None

    def atualizar_email(self, user_id, novo_email):
        self._raise_internal_error()
        self.email_update_calls.append({"user_id": user_id, "email": novo_email})
        self.usuario.email = novo_email
        self.commit_count += 1
        return self.usuario


class FakeHasher:
    def verify(self, senha, senha_hash):
        return senha == "Senha123" and senha_hash == "hash-da-senha"


class EdicaoPerfilValidacoesTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(router)
        self.repository = FakeEditRepository()
        self.app.dependency_overrides[get_repository] = lambda: self.repository
        self.app.dependency_overrides[get_hasher] = FakeHasher
        self.app.dependency_overrides[verify_any_user] = lambda: {"sub": "1"}

    async def asgi_request(self, path, payload, method="PATCH"):
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
            "method": method,
            "scheme": "http",
            "path": path,
            "raw_path": path.encode("utf-8"),
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

        start = next(message for message in messages if message["type"] == "http.response.start")
        body = b"".join(
            message.get("body", b"")
            for message in messages
            if message["type"] == "http.response.body"
        )
        return start["status"], json.loads(body)

    @staticmethod
    def assert_error_response(test_case, body, code):
        test_case.assertIs(body["success"], False)
        test_case.assertEqual(body["error"]["code"], code)
        test_case.assertIsInstance(body["error"]["message"], str)
        test_case.assertTrue(body["error"]["message"])

    def test_telefone_validator_aceita_formatos_mascarado_e_numerico(self):
        validator = TelefoneValidator()

        self.assertTrue(validator.validar_telefone("(85) 98888-1111"))
        self.assertTrue(validator.validar_telefone("85988881111"))

    def test_telefone_validator_rejeita_caracteres_e_regras_invalidas(self):
        validator = TelefoneValidator()

        for telefone in (
            "8598888111",
            "85a988881111",
            "(00) 98888-1111",
            "85688881111",
        ):
            with self.subTest(telefone=telefone):
                self.assertFalse(validator.validar_telefone(telefone))

    async def test_patch_telefone_mascarado_e_numerico_retorna_200(self):
        for telefone in ("(85) 98888-1111", "85988881111"):
            with self.subTest(telefone=telefone):
                status, body = await self.asgi_request("/usuarios/me", {"telefone": telefone})

                self.assertEqual(status, 200)
                self.assertEqual(body["telefone"], telefone)
                self.assertEqual(self.repository.update_calls[-1]["telefone"], telefone)

    async def test_telefone_invalido_nao_chega_a_persistencia(self):
        for telefone in (
            "8598888111",
            "85a988881111",
            "(00) 98888-1111",
            "85688881111",
        ):
            with self.subTest(telefone=telefone):
                status, body = await self.asgi_request("/usuarios/me", {"telefone": telefone})

                self.assertEqual(status, 400)
                self.assert_error_response(self, body, "VALIDATION_ERROR")
                self.assertEqual(body["error"]["details"][0]["field"], "telefone")
                self.assertEqual(self.repository.update_calls, [])
                self.assertEqual(self.repository.commit_count, 0)

    async def test_patch_somente_bairro_preserva_atualizacao_parcial(self):
        status, body = await self.asgi_request("/usuarios/me", {"bairro_id": "Aldeota"})

        self.assertEqual(status, 200)
        self.assertEqual(body["bairro_id"], "Aldeota")
        self.assertEqual(body["telefone"], "85999990000")
        self.assertEqual(self.repository.update_calls[0]["telefone"], None)
        self.assertEqual(self.repository.update_calls[0]["bairro_id"], "Aldeota")

    async def test_bairro_vazio_e_rejeitado_antes_da_persistencia(self):
        status, body = await self.asgi_request("/usuarios/me", {"bairro_id": "   "})

        self.assertEqual(status, 400)
        self.assert_error_response(self, body, "VALIDATION_ERROR")
        self.assertEqual(body["error"]["details"][0]["field"], "bairro_id")
        self.assertEqual(self.repository.update_calls, [])
        self.assertEqual(self.repository.commit_count, 0)

    async def test_patch_vazio_mantem_contrato_parcial_atual(self):
        status, body = await self.asgi_request("/usuarios/me", {})

        self.assertEqual(status, 200)
        self.assertEqual(body["telefone"], "85999990000")
        self.assertEqual(body["bairro_id"], "Centro")

    async def test_campos_nao_editaveis_sao_rejeitados_sem_persistencia(self):
        for campo, valor in (
            ("status_cadastro", "ativado"),
            ("nome", "Outro Nome"),
            ("curso", "Outro Curso"),
        ):
            with self.subTest(campo=campo):
                status, body = await self.asgi_request("/usuarios/me", {campo: valor})

                self.assertEqual(status, 422)
                self.assert_error_response(self, body, "REQUEST_VALIDATION_ERROR")
                self.assertEqual(body["error"]["details"][0]["field"], campo)
                self.assertEqual(self.repository.update_calls, [])

    async def test_email_valido_e_persistido(self):
        status, body = await self.asgi_request(
            "/usuarios/me/email",
            {"novo_email": "novo@example.com", "senha": "Senha123"},
        )

        self.assertEqual(status, 200)
        self.assertEqual(body["email"], "novo@example.com")
        self.assertEqual(self.repository.email_update_calls[0]["email"], "novo@example.com")

    async def test_email_com_formato_invalido_retorna_envelope_padronizado(self):
        status, body = await self.asgi_request(
            "/usuarios/me/email",
            {"novo_email": "nao-e-email", "senha": "Senha123"},
        )

        self.assertEqual(status, 422)
        self.assert_error_response(self, body, "REQUEST_VALIDATION_ERROR")
        self.assertEqual(body["error"]["details"][0]["field"], "novo_email")
        self.assertEqual(self.repository.email_update_calls, [])

    async def test_email_duplicado_retorna_409_sem_persistir(self):
        status, body = await self.asgi_request(
            "/usuarios/me/email",
            {"novo_email": "ocupado@example.com", "senha": "Senha123"},
        )

        self.assertEqual(status, 409)
        self.assert_error_response(self, body, "EMAIL_ALREADY_REGISTERED")
        self.assertEqual(self.repository.email_update_calls, [])
        self.assertEqual(self.repository.commit_count, 0)

    async def test_email_igual_ao_atual_retorna_400_sem_persistir(self):
        status, body = await self.asgi_request(
            "/usuarios/me/email",
            {"novo_email": "atual@example.com", "senha": "Senha123"},
        )

        self.assertEqual(status, 400)
        self.assert_error_response(self, body, "VALIDATION_ERROR")
        self.assertEqual(body["error"]["details"][0]["field"], "novo_email")
        self.assertEqual(self.repository.email_update_calls, [])

    async def test_senha_incorreta_retorna_400_sem_persistir(self):
        status, body = await self.asgi_request(
            "/usuarios/me/email",
            {"novo_email": "novo@example.com", "senha": "senha-errada"},
        )

        self.assertEqual(status, 400)
        self.assert_error_response(self, body, "VALIDATION_ERROR")
        self.assertEqual(body["error"]["details"][0]["field"], "senha")
        self.assertEqual(self.repository.email_update_calls, [])

    async def test_email_com_campos_obrigatorios_ausentes_retorna_422(self):
        for payload in ({}, {"novo_email": "novo@example.com"}, {"senha": "Senha123"}):
            with self.subTest(payload=payload):
                status, body = await self.asgi_request("/usuarios/me/email", payload)

                self.assertEqual(status, 422)
                self.assert_error_response(self, body, "REQUEST_VALIDATION_ERROR")
                self.assertTrue(body["error"]["details"])
                self.assertEqual(self.repository.email_update_calls, [])

    async def test_email_com_campo_extra_e_rejeitado(self):
        status, body = await self.asgi_request(
            "/usuarios/me/email",
            {
                "novo_email": "novo@example.com",
                "senha": "Senha123",
                "nome": "Não editável",
            },
        )

        self.assertEqual(status, 422)
        self.assert_error_response(self, body, "REQUEST_VALIDATION_ERROR")
        self.assertEqual(body["error"]["details"][0]["field"], "nome")
        self.assertEqual(self.repository.email_update_calls, [])

    async def test_erro_interno_retorna_500_sem_detalhes_tecnicos(self):
        detalhe_interno = "SQL secret_table constraint senha=segredo"
        self.repository.internal_error = RuntimeError(detalhe_interno)

        status, body = await self.asgi_request("/usuarios/me", {"telefone": "85988881111"})

        self.assertEqual(status, 500)
        self.assert_error_response(self, body, "INTERNAL_ERROR")
        self.assertNotIn(detalhe_interno, json.dumps(body))


if __name__ == "__main__":
    unittest.main()
