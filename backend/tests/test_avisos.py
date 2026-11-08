from datetime import datetime, timedelta, timezone
import json
import os
import unittest
from urllib.parse import urlsplit

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://test:test@localhost:5432/test",
)

from fastapi import FastAPI

from src.modulos.avisos.application.use_cases.gerenciar_avisos_use_case import (
    AvisoValidationError,
    GerenciarAvisosUseCase,
)
from src.modulos.avisos.infrastructure.repositories.aviso_repository import (
    AvisoRepository,
)
from src.modulos.avisos.infrastructure.services.notificacao_push_service import (
    NotificacaoPushService,
)
from src.modulos.avisos.interface.http import aviso_routes
from src.modulos.avisos.model.entities.aviso import AvisoORM
from src.modulos.usuarios.model.entities.usuario import UsuarioORM
from src.shared.auth.dependencies import get_current_user
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.infrastructure.audit_model import LogAuditoriaORM
from src.shared.infrastructure.db import Base


class ASGIResponse:
    def __init__(self, status_code: int, body: bytes):
        self.status_code = status_code
        self._body = body

    def json(self):
        return json.loads(self._body.decode("utf-8"))


async def asgi_request(app, method: str, path: str, body=None) -> ASGIResponse:
    parsed_path = urlsplit(path)
    request_body = b"" if body is None else json.dumps(body).encode("utf-8")
    request_headers = [
        (b"content-type", b"application/json"),
        (b"content-length", str(len(request_body)).encode("ascii")),
    ]
    messages = []
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
        messages.append(message)

    scope = {
        "type": "http",
        "asgi": {"version": "3.0", "spec_version": "2.3"},
        "http_version": "1.1",
        "method": method,
        "scheme": "http",
        "path": parsed_path.path,
        "raw_path": parsed_path.path.encode("utf-8"),
        "query_string": parsed_path.query.encode("ascii"),
        "headers": request_headers,
        "client": ("testclient", 50000),
        "server": ("testserver", 80),
        "root_path": "",
        "state": {},
    }

    await app(scope, receive, send)

    start = next(m for m in messages if m["type"] == "http.response.start")
    response_body = b"".join(
        m.get("body", b"")
        for m in messages
        if m["type"] == "http.response.body"
    )
    return ASGIResponse(start["status"], response_body)


class AvisoUseCaseAndRepositoryTest(unittest.TestCase):
    """Testa repositório, auditoria e caso de uso de avisos com SQLite em memória."""

    def setUp(self):
        NotificacaoPushService.limpar_eventos_memoria()
        self.engine = create_engine(
            "sqlite://",
            poolclass=StaticPool,
            connect_args={"check_same_thread": False},
        )
        Base.metadata.create_all(
            self.engine,
            tables=[
                UsuarioORM.__table__,
                AvisoORM.__table__,
                LogAuditoriaORM.__table__,
            ],
        )
        self.session = sessionmaker(bind=self.engine)()
        self.repository = AvisoRepository(self.session)
        self.use_case = GerenciarAvisosUseCase(self.repository)

    def tearDown(self):
        NotificacaoPushService.limpar_eventos_memoria()
        self.session.close()
        self.engine.dispose()

    def test_criar_aviso_persiste_autor_e_registra_auditoria(self):
        criado = self.use_case.criar(
            titulo="  Alteração de horário - Linha 02  ",
            descricao="  A saída passa a ser às 06h30 a partir de segunda-feira.  ",
            autor_id=42,
        )

        self.assertEqual(criado["id"], 1)
        self.assertEqual(criado["titulo"], "Alteração de horário - Linha 02")
        self.assertEqual(
            criado["descricao"],
            "A saída passa a ser às 06h30 a partir de segunda-feira.",
        )
        self.assertEqual(criado["conteudo"], criado["descricao"])
        self.assertEqual(criado["autor_id"], 42)
        self.assertIsNotNone(criado["data_criacao"])

        logs = self.session.query(LogAuditoriaORM).all()
        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0].usuario_id, 42)
        self.assertEqual(logs[0].acao, "CRIAR")
        self.assertEqual(logs[0].entidade, "aviso")
        self.assertEqual(logs[0].entidade_id, 1)
        self.assertEqual(logs[0].valor_novo, "Alteração de horário - Linha 02")

    def test_listar_ordena_do_mais_recente_para_o_mais_antigo_e_filtra_por_titulo(self):
        agora = datetime.now(timezone.utc)
        aviso_antigo = AvisoORM(
            titulo="Reajuste no ponto de embarque",
            descricao="O ponto de embarque da Linha 02 foi reajustado.",
            autor_id=10,
            data_criacao=agora - timedelta(days=2),
        )
        aviso_ontem = AvisoORM(
            titulo="Manutenção preventiva no Ônibus 02",
            descricao="O Ônibus 2 passará por manutenção preventiva hoje à noite.",
            autor_id=10,
            data_criacao=agora - timedelta(days=1),
        )
        aviso_hoje = AvisoORM(
            titulo="Alteração de horário - Linha 02 - Bairro Novo",
            descricao="A saída da rota Linha 02 passa a ser às 06h30.",
            autor_id=10,
            data_criacao=agora,
        )
        self.session.add_all([aviso_antigo, aviso_ontem, aviso_hoje])
        self.session.commit()

        todos = self.use_case.listar()
        self.assertEqual(
            [item["titulo"] for item in todos],
            [
                "Alteração de horário - Linha 02 - Bairro Novo",
                "Manutenção preventiva no Ônibus 02",
                "Reajuste no ponto de embarque",
            ],
        )

        filtrados = self.use_case.listar(titulo="manutenção")
        self.assertEqual(len(filtrados), 1)
        self.assertEqual(
            filtrados[0]["titulo"],
            "Manutenção preventiva no Ônibus 02",
        )

    def test_use_case_rejeita_campos_vazios_ou_fora_dos_limites(self):
        with self.assertRaises(AvisoValidationError) as ctx_titulo:
            self.use_case.criar("   ", "Descrição válida do aviso", 1)
        self.assertEqual(ctx_titulo.exception.field, "titulo")

        with self.assertRaises(AvisoValidationError) as ctx_desc:
            self.use_case.criar("Título válido", "  ", 1)
        self.assertEqual(ctx_desc.exception.field, "descricao")

    def test_criar_aviso_dispara_notificacao_push_e_filtra_apos_id(self):
        primeiro = self.use_case.criar(
            titulo="Alteração de horário",
            descricao="A saída da rota Linha 02 passa a ser às 06h30.",
            autor_id=42,
        )
        segundo = self.use_case.criar(
            titulo="Manutenção preventiva",
            descricao="O Ônibus 2 passará por manutenção preventiva hoje à noite.",
            autor_id=42,
        )
        self.use_case.notificacao_service.disparar_realocacao_onibus("07")

        todas = self.use_case.listar_notificacoes()
        self.assertEqual(len(todas), 3)
        self.assertEqual(todas[0]["tipo"], "realocacao")
        self.assertEqual(todas[0]["app_nome"], "TRANSPORTE UFC")
        self.assertEqual(todas[0]["titulo"], "Você foi realocado")
        self.assertIn("ônibus 07", todas[0]["mensagem"])

        novas = self.use_case.listar_notificacoes(apos_id=primeiro["id"])
        self.assertEqual(len(novas), 2)
        self.assertEqual(novas[1]["aviso_id"], segundo["id"])


class AvisoRoutesTest(unittest.IsolatedAsyncioTestCase):
    """Testa contrato HTTP, validações (422) e controle de acesso (RBAC) de /avisos."""

    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            poolclass=StaticPool,
            connect_args={"check_same_thread": False},
        )
        Base.metadata.create_all(
            self.engine,
            tables=[
                UsuarioORM.__table__,
                AvisoORM.__table__,
                LogAuditoriaORM.__table__,
            ],
        )
        self.session = sessionmaker(bind=self.engine)()
        self.repository = AvisoRepository(self.session)
        self.use_case = GerenciarAvisosUseCase(self.repository)

        self.app = FastAPI()
        self.app.include_router(aviso_routes.router)
        self.app.dependency_overrides[aviso_routes.get_use_case] = (
            lambda: self.use_case
        )
        self.app.dependency_overrides[get_current_user] = self._admin_context

    def tearDown(self):
        self.app.dependency_overrides.clear()
        self.session.close()
        self.engine.dispose()

    @staticmethod
    def _admin_context():
        return {
            "sub": "42",
            "type": "access",
            "role": CargoEnum.ADMINISTRADOR.value,
            "current_role": CargoEnum.ADMINISTRADOR.value,
            "current_roles": [CargoEnum.ADMINISTRADOR.value],
            "current_user_id": 42,
        }

    @staticmethod
    def _student_context():
        return {
            "sub": "7",
            "type": "access",
            "role": CargoEnum.ALUNO.value,
            "current_role": CargoEnum.ALUNO.value,
            "current_roles": [CargoEnum.ALUNO.value],
            "current_user_id": 7,
        }

    async def test_publicar_aviso_como_admin_retorna_201_e_associa_autor(self):
        response = await asgi_request(
            self.app,
            "POST",
            "/avisos",
            {
                "titulo": "Alteração de horário - Linha 02",
                "descricao": "A saída da rota Linha 02 passa a ser às 06h30.",
            },
        )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertIs(body["success"], True)
        self.assertEqual(body["message"], "Aviso publicado com sucesso.")
        self.assertEqual(body["data"]["titulo"], "Alteração de horário - Linha 02")
        self.assertEqual(
            body["data"]["descricao"],
            "A saída da rota Linha 02 passa a ser às 06h30.",
        )
        self.assertEqual(body["data"]["autor_id"], 42)

    async def test_publicar_aviso_aceita_alias_conteudo(self):
        response = await asgi_request(
            self.app,
            "POST",
            "/avisos",
            {
                "titulo": "Desvio temporário na Linha 01",
                "conteudo": "A Linha 01 seguirá por rota alternativa até sexta-feira.",
            },
        )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(
            body["data"]["descricao"],
            "A Linha 01 seguirá por rota alternativa até sexta-feira.",
        )
        self.assertEqual(body["data"]["conteudo"], body["data"]["descricao"])

    async def test_publicar_aviso_com_campos_vazios_retorna_422_por_campo(self):
        esperado = [
            {"field": "titulo", "message": "Título é obrigatório."},
            {"field": "descricao", "message": "Descrição é obrigatória."},
        ]
        for payload in (
            {"titulo": "", "descricao": ""},
            {"titulo": "   ", "descricao": "   "},
            {},
        ):
            with self.subTest(payload=payload):
                response = await asgi_request(self.app, "POST", "/avisos", payload)
                self.assertEqual(response.status_code, 422)
                body = response.json()
                self.assertIs(body["success"], False)
                self.assertEqual(body["error"]["code"], "REQUEST_VALIDATION_ERROR")
                self.assertEqual(body["error"]["details"], esperado)

    async def test_aluno_pode_listar_avisos_mas_nao_pode_publicar(self):
        await asgi_request(
            self.app,
            "POST",
            "/avisos",
            {
                "titulo": "Aviso Oficial",
                "descricao": "Comunicado importante para todos os estudantes.",
            },
        )

        self.app.dependency_overrides[get_current_user] = self._student_context

        # Aluno pode listar e buscar por título
        get_resp = await asgi_request(self.app, "GET", "/avisos?titulo=Oficial")
        self.assertEqual(get_resp.status_code, 200)
        self.assertEqual(len(get_resp.json()), 1)

        # Aluno pode consultar notificações recentes (HU-024)
        notif_resp = await asgi_request(self.app, "GET", "/avisos/notificacoes")
        self.assertEqual(notif_resp.status_code, 200)
        notificacoes = notif_resp.json()
        self.assertEqual(len(notificacoes), 1)
        self.assertEqual(notificacoes[0]["app_nome"], "TRANSPORTE UFC")
        self.assertEqual(notificacoes[0]["titulo"], "Aviso Oficial")
        self.assertEqual(
            notificacoes[0]["mensagem"],
            "Comunicado importante para todos os estudantes.",
        )

        # Aluno NÃO pode publicar (RN-006 -> 403 Forbidden)
        post_resp = await asgi_request(
            self.app,
            "POST",
            "/avisos",
            {
                "titulo": "Tentativa Aluno",
                "descricao": "Não deve ser permitido.",
            },
        )
        self.assertEqual(post_resp.status_code, 403)
        self.assertEqual(post_resp.json()["error"]["code"], "FORBIDDEN")


if __name__ == "__main__":
    unittest.main()
