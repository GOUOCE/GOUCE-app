import contextlib
import hashlib
import io
import json
import os
import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import ANY, Mock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/gouce_test")
os.environ.setdefault("SECRET_KEY_JWT", "test-secret-key")
os.environ.setdefault("ALGORITHM", "HS256")

from fastapi import FastAPI

from src.modulos.auth.api.http.auth_routes import (
    get_email_service,
    get_hasher,
    get_repository,
    get_token_repository,
    redirect_to_app,
    router,
)
from src.modulos.auth.application.dtos.recuperacao_senha_dto import (
    ValidarTokenRecuperacaoDTO,
)
from src.modulos.auth.application.exceptions import TokenExpiredError
from src.modulos.auth.application.use_cases.validar_token_recuperacao_use_case import (
    ValidarTokenRecuperacaoUseCase,
)
from src.modulos.auth.domain.entities.password_reset_token import PasswordResetTokenORM
from src.modulos.auth.infrastructure.repositories.password_reset_token_repository import (
    SQLAlchemyPasswordResetTokenRepository,
)
from src.shared.infrastructure.services.email_service import SMTPEmailService


def token_hash(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


class FakeSession:
    def __init__(self, fail_commit=False):
        self.fail_commit = fail_commit
        self.commit_count = 0
        self.rollback_count = 0
        self.repository = None

    def add(self, _entity):
        pass

    def flush(self):
        pass

    def commit(self):
        self.commit_count += 1
        if self.fail_commit:
            raise RuntimeError("database secret token=internal")
        if self.repository:
            self.repository.commit_transaction()

    def rollback(self):
        self.rollback_count += 1
        if self.repository:
            self.repository.rollback_transaction()


class FakeTokenRepository:
    def __init__(self, usuario, *, fail_commit=False):
        self.usuario = usuario
        self.session = FakeSession(fail_commit=fail_commit)
        self.session.repository = self
        self.active_tokens = {}
        self.pending_tokens = {}
        self.next_id = 1
        self.lock_calls = 0
        self.mark_calls = 0
        self.mark_returns_false = False
        self.deactivate_calls = 0
        self._in_transaction = False
        self._token_snapshot = []
        self._user_snapshot = None

    def _begin_transaction(self):
        if self._in_transaction:
            return
        self._in_transaction = True
        tokens = list(self.active_tokens.values()) + list(self.pending_tokens.values())
        self._token_snapshot = [(item, item.used_at) for item in tokens]
        self._user_snapshot = {
            "senha": self.usuario.senha,
            "tentativas_falhas": self.usuario.tentativas_falhas,
            "limite_de_bloqueio": self.usuario.limite_de_bloqueio,
        }

    def commit_transaction(self):
        self.active_tokens.update(self.pending_tokens)
        self.pending_tokens.clear()
        self._in_transaction = False

    def rollback_transaction(self):
        for item, used_at in self._token_snapshot:
            item.used_at = used_at
        if self._user_snapshot is not None:
            for field, value in self._user_snapshot.items():
                setattr(self.usuario, field, value)
        self.pending_tokens.clear()
        self._in_transaction = False

    def add_token(self, raw_token, *, expires_at=None, used_at=None):
        token = SimpleNamespace(
            id=self.next_id,
            token_hash=token_hash(raw_token),
            expires_at=expires_at or datetime.now(timezone.utc) + timedelta(minutes=15),
            used_at=used_at,
            usuario=self.usuario,
        )
        self.next_id += 1
        self.active_tokens[token.token_hash] = token
        return token

    def create_token(self, usuario_id, token_hash_value, expires_at):
        self._begin_transaction()
        token = SimpleNamespace(
            id=self.next_id,
            token_hash=token_hash_value,
            expires_at=expires_at,
            used_at=None,
            usuario=self.usuario,
        )
        self.next_id += 1
        self.pending_tokens[token_hash_value] = token
        return token

    def find_by_hash(self, token_hash_value):
        return self.active_tokens.get(token_hash_value)

    def find_by_hash_for_update(self, token_hash_value):
        self.lock_calls += 1
        self._begin_transaction()
        return self.active_tokens.get(token_hash_value)

    def deactivate_active_tokens_for_user(self, usuario_id):
        self._begin_transaction()
        self.deactivate_calls += 1
        for token in self.active_tokens.values():
            if token.usuario.id == usuario_id and token.used_at is None:
                token.used_at = datetime.now(timezone.utc)

    def mark_as_used(self, token_id, used_at=None):
        self._begin_transaction()
        self.mark_calls += 1
        if self.mark_returns_false:
            return False
        tokens = list(self.active_tokens.values()) + list(self.pending_tokens.values())
        token = next((item for item in tokens if item.id == token_id), None)
        if not token or token.used_at is not None:
            return False
        token.used_at = used_at or datetime.now(timezone.utc)
        return True


class FakeUserRepository:
    def __init__(self, usuario=None, internal_error=None):
        self.usuario = usuario
        self.internal_error = internal_error

    def buscar_por_email(self, _email):
        if self.internal_error:
            raise self.internal_error
        return self.usuario


class FakeEmailService:
    def __init__(self, result=True, error=None):
        self.result = result
        self.error = error
        self.tokens = []

    def enviar_email_recuperacao_senha(self, email_destino, nome_usuario, token_recuperacao):
        self.tokens.append(token_recuperacao)
        if self.error:
            raise self.error
        return self.result


class FakeHasher:
    def hash(self, senha):
        return f"argon2-hash::{senha}"


class RecuperacaoSenhaApiResponsesTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(router)
        self.usuario = SimpleNamespace(
            id=1,
            email="maria@example.com",
            nome_completo="Maria da Silva",
            senha="hash-antigo",
            tentativas_falhas=2,
            limite_de_bloqueio=datetime.now(timezone.utc),
        )
        self.usuario_repository = FakeUserRepository(self.usuario)
        self.token_repository = FakeTokenRepository(self.usuario)
        self.email_service = FakeEmailService()
        self.hasher = FakeHasher()

        self.app.dependency_overrides[get_repository] = lambda: self.usuario_repository
        self.app.dependency_overrides[get_token_repository] = lambda: self.token_repository
        self.app.dependency_overrides[get_email_service] = lambda: self.email_service
        self.app.dependency_overrides[get_hasher] = lambda: self.hasher

    def tearDown(self):
        self.app.dependency_overrides.clear()

    async def asgi_request(self, path, payload=None, method="POST", query_string=b""):
        raw_body = json.dumps(payload or {}).encode("utf-8")
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
            "query_string": query_string,
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
        try:
            decoded_body = json.loads(body)
        except json.JSONDecodeError:
            decoded_body = body.decode("utf-8")
        return start["status"], decoded_body

    async def request(self, path, payload):
        return await self.asgi_request(path, payload)

    @staticmethod
    def assert_error(test_case, status, body, code, expected_status=None):
        if expected_status is None:
            test_case.assertGreaterEqual(status, 400)
        else:
            test_case.assertEqual(status, expected_status)
        test_case.assertIs(body["success"], False)
        test_case.assertEqual(body["error"]["code"], code)
        test_case.assertIsInstance(body["error"]["message"], str)
        test_case.assertIsInstance(body["error"]["details"], list)

    def add_reset_token(self, raw_token="token-valido", **kwargs):
        return self.token_repository.add_token(raw_token, **kwargs)

    async def test_solicitacao_cadastrada_retorna_sucesso_padronizado(self):
        status, body = await self.request(
            "/auth/solicitar-recuperacao",
            {"email": "maria@example.com"},
        )

        self.assertEqual(status, 200)
        self.assertIs(body["success"], True)
        self.assertEqual(
            body["message"],
            "Se o e-mail estiver cadastrado no sistema, você receberá as instruções para redefinição de senha.",
        )
        self.assertEqual(self.token_repository.session.commit_count, 1)
        self.assertEqual(self.token_repository.session.rollback_count, 0)
        serialized = json.dumps(body).lower()
        self.assertNotIn(self.email_service.tokens[0], serialized)
        self.assertNotIn("token_hash", body)

    async def test_solicitacao_inexistente_tem_mesmo_status_e_corpo(self):
        status_cadastrado, body_cadastrado = await self.request(
            "/auth/solicitar-recuperacao",
            {"email": "maria@example.com"},
        )

        self.usuario_repository.usuario = None
        status_inexistente, body_inexistente = await self.request(
            "/auth/solicitar-recuperacao",
            {"email": "desconhecido@example.com"},
        )

        self.assertEqual(status_inexistente, status_cadastrado)
        self.assertEqual(body_inexistente, body_cadastrado)

    async def test_solicitacao_com_falha_de_email_retorna_erro_e_faz_rollback(self):
        token_anterior = self.add_reset_token("token-anterior")
        self.email_service.result = False

        status, body = await self.request(
            "/auth/solicitar-recuperacao",
            {"email": "maria@example.com"},
        )

        self.assert_error(self, status, body, "EMAIL_SEND_FAILED")
        self.assertEqual(self.token_repository.session.rollback_count, 1)
        self.assertEqual(self.token_repository.pending_tokens, {})
        self.assertEqual(
            set(self.token_repository.active_tokens),
            {token_hash("token-anterior")},
        )
        self.assertIsNone(token_anterior.used_at)
        self.assertNotIn(self.email_service.tokens[0], json.dumps(body))

    async def test_smtp_incompleto_retorna_erro_e_nao_persiste_token(self):
        self.email_service = SMTPEmailService()
        self.email_service.smtp_server = None
        self.email_service.smtp_user = None
        self.email_service.smtp_password = None
        self.app.dependency_overrides[get_email_service] = lambda: self.email_service

        status, body = await self.request(
            "/auth/solicitar-recuperacao",
            {"email": "maria@example.com"},
        )

        self.assert_error(self, status, body, "EMAIL_SEND_FAILED", 500)
        self.assertEqual(self.token_repository.session.rollback_count, 1)
        self.assertEqual(self.token_repository.pending_tokens, {})
        self.assertEqual(self.token_repository.active_tokens, {})

    async def test_excecao_do_email_retorna_resposta_segura(self):
        segredo = "smtp credential token=nao-expor"
        self.email_service.error = RuntimeError(segredo)

        status, body = await self.request(
            "/auth/solicitar-recuperacao",
            {"email": "maria@example.com"},
        )

        self.assert_error(self, status, body, "EMAIL_SEND_FAILED")
        self.assertEqual(self.token_repository.session.rollback_count, 1)
        self.assertEqual(self.token_repository.pending_tokens, {})
        self.assertEqual(self.token_repository.active_tokens, {})
        self.assertNotIn(segredo, json.dumps(body))
        self.assertNotIn("smtp", json.dumps(body).lower())

    async def test_erro_interno_retorna_mensagem_publica_generica(self):
        segredo = "database password token=nao-expor"
        self.usuario_repository.internal_error = RuntimeError(segredo)

        status, body = await self.request(
            "/auth/solicitar-recuperacao",
            {"email": "maria@example.com"},
        )

        self.assert_error(self, status, body, "INTERNAL_ERROR")
        self.assertEqual(status, 500)
        self.assertNotIn(segredo, json.dumps(body))
        self.assertNotIn("database", json.dumps(body).lower())

    async def test_validacao_estrutural_retorna_422_padronizado(self):
        status, body = await self.request("/auth/solicitar-recuperacao", {})

        self.assert_error(self, status, body, "REQUEST_VALIDATION_ERROR")
        self.assertEqual(status, 422)

    async def test_validacao_de_token_valido_retorna_sucesso(self):
        self.add_reset_token()

        status, body = await self.request(
            "/auth/validar-token",
            {"token": "token-valido"},
        )

        self.assertEqual(status, 200)
        self.assertIs(body["success"], True)
        self.assertIs(body["valido"], True)
        self.assertEqual(body["message"], "Token válido.")

    async def test_validacao_diferencia_token_invalido_expirado_e_utilizado(self):
        status, body = await self.request(
            "/auth/validar-token",
            {"token": "token-inexistente"},
        )
        self.assert_error(self, status, body, "TOKEN_INVALID", 400)

        self.add_reset_token(
            "token-expirado",
            expires_at=datetime.now(timezone.utc) - timedelta(seconds=1),
        )
        status, body = await self.request(
            "/auth/validar-token",
            {"token": "token-expirado"},
        )
        self.assert_error(self, status, body, "TOKEN_EXPIRED", 400)

        self.add_reset_token(
            "token-utilizado",
            used_at=datetime.now(timezone.utc),
        )
        status, body = await self.request(
            "/auth/validar-token",
            {"token": "token-utilizado"},
        )
        self.assert_error(self, status, body, "TOKEN_ALREADY_USED", 400)

    def test_instante_exato_da_expiracao_e_rejeitado(self):
        instante = datetime(2026, 9, 27, 12, 0, tzinfo=timezone.utc)
        token = self.add_reset_token("token-exato", expires_at=instante)
        use_case = ValidarTokenRecuperacaoUseCase(
            self.token_repository,
            clock=lambda: instante,
        )

        with self.assertRaises(TokenExpiredError):
            use_case.execute(ValidarTokenRecuperacaoDTO(token="token-exato"))

        self.assertIsNotNone(token)

    async def test_redefinicao_bem_sucedida_padronizada_e_consume_token(self):
        token = self.add_reset_token()

        status, body = await self.request(
            "/auth/redefinir-senha",
            {"token": "token-valido", "nova_senha": "Nova1234"},
        )

        self.assertEqual(status, 200)
        self.assertIs(body["success"], True)
        self.assertEqual(body["message"], "Senha alterada com sucesso.")
        self.assertEqual(self.usuario.senha, "argon2-hash::Nova1234")
        self.assertIsNotNone(token.used_at)
        self.assertEqual(self.token_repository.session.commit_count, 1)
        self.assertEqual(self.token_repository.lock_calls, 1)
        serialized = json.dumps(body).lower()
        self.assertNotIn("nova123", serialized)
        self.assertNotIn("argon2-hash", serialized)
        self.assertNotIn("token-valido", serialized)
        self.assertNotIn(token_hash("token-valido"), serialized)

        status, body = await self.request(
            "/auth/redefinir-senha",
            {"token": "token-valido", "nova_senha": "Outra1234"},
        )
        self.assert_error(self, status, body, "TOKEN_ALREADY_USED", 400)

    async def test_redefinicao_retorna_erros_de_token_e_senha(self):
        status, body = await self.request(
            "/auth/redefinir-senha",
            {"token": "token-inexistente", "nova_senha": "Nova1234"},
        )
        self.assert_error(self, status, body, "TOKEN_INVALID", 400)

        self.add_reset_token(
            "token-expirado",
            expires_at=datetime.now(timezone.utc) - timedelta(seconds=1),
        )
        status, body = await self.request(
            "/auth/redefinir-senha",
            {"token": "token-expirado", "nova_senha": "Nova1234"},
        )
        self.assert_error(self, status, body, "TOKEN_EXPIRED", 400)

        self.add_reset_token("token-utilizado", used_at=datetime.now(timezone.utc))
        status, body = await self.request(
            "/auth/redefinir-senha",
            {"token": "token-utilizado", "nova_senha": "Nova1234"},
        )
        self.assert_error(self, status, body, "TOKEN_ALREADY_USED", 400)

        self.add_reset_token("token-senha-invalida")
        status, body = await self.request(
            "/auth/redefinir-senha",
            {"token": "token-senha-invalida", "nova_senha": "abcdef"},
        )
        self.assert_error(self, status, body, "PASSWORD_INVALID", 400)

    async def test_falha_de_commit_faz_rollback_sem_consumir_token(self):
        self.token_repository = FakeTokenRepository(self.usuario, fail_commit=True)
        token = self.token_repository.add_token("token-commit")

        status, body = await self.request(
            "/auth/redefinir-senha",
            {"token": "token-commit", "nova_senha": "Nova1234"},
        )

        self.assert_error(self, status, body, "INTERNAL_ERROR")
        self.assertIsNone(token.used_at)
        self.assertEqual(self.usuario.senha, "hash-antigo")
        self.assertEqual(self.token_repository.session.rollback_count, 1)
        self.assertNotIn("database secret", json.dumps(body).lower())

    async def test_rowcount_condicional_rejeita_consumo_concorrente(self):
        self.token_repository.add_token("token-concorrente")
        self.token_repository.mark_returns_false = True

        status, body = await self.request(
            "/auth/redefinir-senha",
            {"token": "token-concorrente", "nova_senha": "Nova1234"},
        )

        self.assert_error(self, status, body, "TOKEN_ALREADY_USED", 400)
        self.assertEqual(self.token_repository.lock_calls, 1)
        self.assertEqual(self.token_repository.mark_calls, 1)
        self.assertEqual(self.usuario.senha, "hash-antigo")
        self.assertEqual(self.token_repository.session.rollback_count, 1)

    async def test_logs_do_smtp_nao_contem_token_bruto(self):
        service = SMTPEmailService()
        service.smtp_server = "smtp.test"
        service.smtp_user = "user@test"
        service.smtp_password = "password-test"
        service.from_email = "no-reply@test"
        raw_token = "token-super-secreto"

        stdout = io.StringIO()
        with contextlib.redirect_stdout(stdout), self.assertLogs("email_service", level="ERROR") as logs:
            with patch(
                "src.shared.infrastructure.services.email_service.smtplib.SMTP",
                side_effect=RuntimeError(f"smtp failure {raw_token}"),
            ):
                self.assertFalse(
                    service.enviar_email_recuperacao_senha(
                        "maria@example.com",
                        "Maria",
                        raw_token,
                    )
                )

        self.assertNotIn(raw_token, stdout.getvalue())
        self.assertNotIn(raw_token, "\n".join(logs.output))

    async def test_smtp_incompleto_nao_registra_token_bruto_e_retorna_falha(self):
        service = SMTPEmailService()
        service.smtp_server = None
        service.smtp_user = None
        service.smtp_password = None
        raw_token = "token-simulacao-secreto"
        stdout = io.StringIO()

        with contextlib.redirect_stdout(stdout), self.assertLogs("email_service", level="WARNING") as logs:
            self.assertFalse(
                service.enviar_email_recuperacao_senha(
                    "maria@example.com",
                    "Maria",
                    raw_token,
                )
            )

        self.assertNotIn(raw_token, stdout.getvalue())
        self.assertNotIn(raw_token, "\n".join(logs.output))

    def test_lock_do_token_sobrescreve_eager_join_e_restringe_for_update(self):
        query = Mock()
        query.options.return_value = query
        query.filter.return_value = query
        query.with_for_update.return_value = query
        expected = object()
        query.first.return_value = expected
        session = Mock()
        session.query.return_value = query

        repository = SQLAlchemyPasswordResetTokenRepository(session)
        with patch(
            "src.modulos.auth.infrastructure.repositories.password_reset_token_repository.lazyload",
            return_value=object(),
        ) as lazyload_mock:
            result = repository.find_by_hash_for_update("token-hash")

        self.assertIs(result, expected)
        session.query.assert_called_once_with(PasswordResetTokenORM)
        lazyload_mock.assert_called_once_with(PasswordResetTokenORM.usuario)
        query.options.assert_called_once_with(lazyload_mock.return_value)
        query.with_for_update.assert_called_once_with(of=PasswordResetTokenORM)

    def test_rowcount_zero_do_consumo_atomico_retorna_false(self):
        query = Mock()
        query.filter.return_value = query
        query.update.return_value = 0
        session = Mock()
        session.query.return_value = query

        repository = SQLAlchemyPasswordResetTokenRepository(session)

        self.assertFalse(repository.mark_as_used(42))
        query.update.assert_called_once()
        query.update.assert_called_once_with(
            ANY,
            synchronize_session=False,
        )

    async def test_html_intermediario_escapa_token_arbitrario(self):
        token_malicioso = '"><script>alert(1)</script>'
        with patch.dict(os.environ, {"APP_DEEP_LINK_URL": "exp://10.0.0.42:8081"}):
            response = await redirect_to_app(token_malicioso)
        content = response.body.decode("utf-8")

        self.assertNotIn(token_malicioso, content)
        self.assertIn("%22%3E%3Cscript%3Ealert%281%29%3C%2Fscript%3E", content)
        self.assertIn("exp://10.0.0.42:8081/--/redefinir-senha", content)


if __name__ == "__main__":
    unittest.main()
