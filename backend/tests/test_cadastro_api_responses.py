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
    get_arquivo_repository,
    get_hasher,
    get_repository,
    get_token_service,
    get_storage_service,
    router,
)
from src.modulos.usuarios.infrastructure.repositories.usuario_repository import (
    SQLAlchemyUsuarioRepository,
)
from src.modulos.usuarios.model.entities.aluno import AlunoORM
from src.modulos.usuarios.model.entities.usuario import UsuarioORM


class FakeRepository:
    def __init__(self, email_exists=False, internal_error=None):
        self.email_exists = email_exists
        self.internal_error = internal_error
        self.invalid_response = False
        self.last_command = None

    def buscar_por_email(self, email):
        if self.internal_error:
            raise self.internal_error
        return object() if self.email_exists else None

    def criar_aluno(self, comando, senha_hash):
        self.last_command = comando
        return SimpleNamespace(
            id=1,
            nome_completo=None if self.invalid_response else comando.nome,
            email=str(comando.email),
        )


class FakeArquivoRepository:
    def __init__(self):
        self.saved_files = []

    def buscar_por_id(self, arquivo_id):
        return object()

    def salvar(self, arquivo):
        self.saved_files.append(arquivo)
        return arquivo


class FakeStorageService:
    def salvar_arquivo(self, conteudo, nome_objeto, content_type=None):
        return f"http://storage.test/{nome_objeto}"


class FailingStorageService:
    def salvar_arquivo(self, conteudo, nome_objeto, content_type=None):
        raise ValueError("SQL secret_table constraint senha=segredo")


class FakeHasher:
    def hash(self, senha):
        return "hash-seguro"


class FakeSession:
    def __init__(self):
        self.added = []

    def add(self, entity):
        if isinstance(entity, UsuarioORM):
            entity.id = 1
        self.added.append(entity)

    def flush(self):
        pass

    def commit(self):
        pass

    def refresh(self, entity):
        pass

    def rollback(self):
        pass


class CadastroApiResponsesTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(router)
        self.repository = FakeRepository()
        self.app.dependency_overrides[get_repository] = lambda: self.repository
        self.app.dependency_overrides[get_arquivo_repository] = FakeArquivoRepository
        self.app.dependency_overrides[get_hasher] = FakeHasher
        self.app.dependency_overrides[get_token_service] = lambda: object()
        self.app.dependency_overrides[get_storage_service] = FakeStorageService

    @staticmethod
    def payload(**updates):
        data = {
            "nome": "Maria da Silva",
            "email": "maria@example.com",
            "senha": "Senha123",
            "telefone": "85999990000",
            "faculdade_id": "UFC",
            "bairro_id": "Centro",
            "id_comprovante_matricula": "arquivo-matricula",
            "id_comprovante_residencia": "arquivo-residencia",
            "data_nascimento": "15/03/2002",
            "curso": "Engenharia de Software",
            "semestre_atual": 5,
            "periodo_ingresso": "2024.1",
            "turno_curso": "Matutino",
            "termos_de_uso": True,
        }
        data.update(updates)
        return data

    async def asgi_request(self, raw_body, path, content_type):
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
            "path": path,
            "raw_path": path.encode("utf-8"),
            "query_string": b"",
            "headers": [
                (b"content-type", content_type.encode("ascii")),
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

    async def request(self, payload):
        return await self.asgi_request(
            json.dumps(payload).encode("utf-8"),
            "/usuarios/cadastrar-json",
            "application/json",
        )

    @staticmethod
    def multipart_body(fields, file_content=b"arquivo-de-teste"):
        boundary = "CadastroTestBoundary"
        boundary_bytes = boundary.encode("ascii")
        parts = []

        for name, value in fields.items():
            parts.extend([
                b"--" + boundary_bytes + b"\r\n",
                f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"),
                str(value).encode("utf-8") + b"\r\n",
            ])

        for name, filename in (
            ("comprovante_matricula", "matricula.pdf"),
            ("comprovante_residencia", "residencia.pdf"),
        ):
            parts.extend([
                b"--" + boundary_bytes + b"\r\n",
                (
                    f'Content-Disposition: form-data; name="{name}"; '
                    f'filename="{filename}"\r\n'
                    "Content-Type: application/pdf\r\n\r\n"
                ).encode("utf-8"),
                file_content + b"\r\n",
            ])

        parts.append(b"--" + boundary_bytes + b"--\r\n")
        return b"".join(parts), f"multipart/form-data; boundary={boundary}"

    async def multipart_request(self, payload, file_content=b"arquivo-de-teste"):
        raw_body, content_type = self.multipart_body(payload, file_content)
        return await self.asgi_request(raw_body, "/usuarios/cadastrar", content_type)

    @staticmethod
    def assert_error_response(test_case, body, code):
        test_case.assertIs(body["success"], False)
        test_case.assertEqual(body["error"]["code"], code)
        test_case.assertIsInstance(body["error"]["message"], str)
        test_case.assertTrue(body["error"]["message"])

    async def test_cadastro_com_sucesso_retorna_201(self):
        status, body = await self.request(self.payload())

        self.assertEqual(status, 201)
        self.assertIs(body["success"], True)
        self.assertEqual(body["message"], "Cadastro enviado para análise da coordenação")
        self.assertEqual(
            set(body["data"]),
            {"id", "nome", "email", "status_cadastro"},
        )
        self.assertEqual(body["data"]["status_cadastro"], "pendente")
        self.assertNotIn("senha", json.dumps(body).lower())
        self.assertNotIn("hash", json.dumps(body).lower())
        self.assertNotIn("token", json.dumps(body).lower())

    async def test_email_ja_cadastrado_retorna_409(self):
        self.repository.email_exists = True

        status, body = await self.request(self.payload())

        self.assert_error_response(self, body, "EMAIL_ALREADY_REGISTERED")
        self.assertEqual(status, 409)
        self.assertEqual(body["error"]["message"], "E-mail já cadastrado no sistema")

    async def test_validacao_de_negocio_retorna_400_com_campo(self):
        status, body = await self.request(self.payload(nome="Maria"))

        self.assert_error_response(self, body, "VALIDATION_ERROR")
        self.assertEqual(status, 400)
        self.assertEqual(body["error"]["details"][0]["field"], "nome")
        self.assertTrue(body["error"]["details"][0]["message"])

    async def test_validacao_estrutural_retorna_422_sem_expor_senha(self):
        senha_sensivel = "SEGREDO_NAO_DEVE_APARECER_" * 10
        payload = self.payload(senha=senha_sensivel)
        payload.pop("email")

        status, body = await self.request(payload)

        self.assert_error_response(self, body, "REQUEST_VALIDATION_ERROR")
        self.assertEqual(status, 422)
        self.assertNotIn(senha_sensivel, json.dumps(body))
        self.assertTrue(body["error"]["details"])
        self.assertTrue(all("input" not in detail for detail in body["error"]["details"]))
        self.assertTrue(all(senha_sensivel not in json.dumps(detail) for detail in body["error"]["details"]))

    async def test_erro_interno_retorna_500_sem_detalhes_tecnicos(self):
        detalhe_interno = "SQL secret_table constraint senha=segredo"
        self.repository.internal_error = RuntimeError(detalhe_interno)

        status, body = await self.request(self.payload())

        self.assert_error_response(self, body, "INTERNAL_ERROR")
        self.assertEqual(status, 500)
        self.assertNotIn(detalhe_interno, json.dumps(body))

    async def test_falha_de_dependencia_retorna_500_padronizado(self):
        detalhe_interno = "credencial interna do banco"

        def failing_hasher():
            raise RuntimeError(detalhe_interno)

        self.app.dependency_overrides[get_hasher] = failing_hasher

        status, body = await self.request(self.payload())

        self.assert_error_response(self, body, "INTERNAL_ERROR")
        self.assertEqual(status, 500)
        self.assertNotIn(detalhe_interno, json.dumps(body))

    async def test_falha_de_montagem_da_resposta_retorna_500_padronizado(self):
        self.repository.invalid_response = True

        status, body = await self.request(self.payload())

        self.assert_error_response(self, body, "INTERNAL_ERROR")
        self.assertEqual(status, 500)

    async def test_resposta_nao_expoe_senha_hash_ou_tokens(self):
        status, body = await self.request(self.payload())
        serialized = json.dumps(body).lower()

        self.assertEqual(status, 201)
        self.assertIs(body["success"], True)
        self.assertNotIn("senha", serialized)
        self.assertNotIn("hash", serialized)
        self.assertNotIn("token", serialized)

    async def test_status_enviado_pelo_cliente_e_ignorado(self):
        status, body = await self.request(self.payload(status_cadastro="ativado"))

        self.assertEqual(status, 201)
        self.assertIs(body["success"], True)
        self.assertEqual(body["data"]["status_cadastro"], "pendente")
        self.assertFalse(hasattr(self.repository.last_command, "status_cadastro"))

        session = FakeSession()
        SQLAlchemyUsuarioRepository(session).criar_aluno(
            self.repository.last_command,
            "hash-seguro",
        )
        aluno = next(entity for entity in session.added if isinstance(entity, AlunoORM))
        self.assertEqual(aluno.status_cadastro, "pendente")

    async def test_cadastro_multipart_com_sucesso_retorna_contrato_publico(self):
        status, body = await self.multipart_request(self.payload())

        self.assertEqual(status, 201)
        self.assertIs(body["success"], True)
        self.assertEqual(
            set(body["data"]),
            {"id", "nome", "email", "status_cadastro"},
        )
        self.assertEqual(body["data"]["status_cadastro"], "pendente")
        serialized = json.dumps(body).lower()
        self.assertNotIn("senha", serialized)
        self.assertNotIn("hash", serialized)
        self.assertNotIn("token", serialized)

    async def test_cadastro_multipart_validacao_de_negocio_retorna_400(self):
        status, body = await self.multipart_request(self.payload(nome="Maria"))

        self.assert_error_response(self, body, "VALIDATION_ERROR")
        self.assertEqual(status, 400)
        self.assertEqual(body["error"]["details"][0]["field"], "nome")
        self.assertTrue(body["error"]["details"][0]["message"])

    async def test_cadastro_multipart_arquivo_invalido_retorna_400(self):
        status, body = await self.multipart_request(self.payload(), file_content=b"")

        self.assert_error_response(self, body, "VALIDATION_ERROR")
        self.assertEqual(status, 400)
        self.assertEqual(body["error"]["details"][0]["field"], "arquivo")
        self.assertIn("arquivo", body["error"]["details"][0]["message"].lower())

    async def test_cadastro_multipart_email_ja_cadastrado_retorna_409(self):
        self.repository.email_exists = True

        status, body = await self.multipart_request(self.payload())

        self.assert_error_response(self, body, "EMAIL_ALREADY_REGISTERED")
        self.assertEqual(status, 409)

    async def test_cadastro_multipart_validacao_estrutural_retorna_422(self):
        senha_sensivel = "SEGREDO_MULTIPART_NAO_DEVE_APARECER_" * 10
        payload = self.payload(senha=senha_sensivel)
        payload.pop("email")

        status, body = await self.multipart_request(payload)

        self.assert_error_response(self, body, "REQUEST_VALIDATION_ERROR")
        self.assertEqual(status, 422)
        self.assertNotIn(senha_sensivel, json.dumps(body))
        self.assertTrue(body["error"]["details"])
        self.assertTrue(all("input" not in detail for detail in body["error"]["details"]))
        self.assertTrue(all(senha_sensivel not in json.dumps(detail) for detail in body["error"]["details"]))

    async def test_cadastro_multipart_erro_interno_retorna_500(self):
        detalhe_interno = "SQL secret_table constraint senha=segredo"
        self.repository.internal_error = RuntimeError(detalhe_interno)

        status, body = await self.multipart_request(self.payload())

        self.assert_error_response(self, body, "INTERNAL_ERROR")
        self.assertEqual(status, 500)
        self.assertNotIn(detalhe_interno, json.dumps(body))

    async def test_cadastro_multipart_value_error_interno_nao_expoe_detalhes(self):
        self.app.dependency_overrides[get_storage_service] = FailingStorageService

        status, body = await self.multipart_request(self.payload())

        self.assert_error_response(self, body, "INTERNAL_ERROR")
        self.assertEqual(status, 500)
        self.assertNotIn("secret_table", json.dumps(body))


if __name__ == "__main__":
    unittest.main()
