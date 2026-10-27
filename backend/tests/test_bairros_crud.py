import json
import unittest
from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.modulos.crud_basicos.application.dtos.bairro_dto import (
    AtualizarBairroDTO,
    CriarBairroDTO,
)
from src.modulos.crud_basicos.application.services.bairro_service import (
    BairroService,
    BairroValidationError,
)
from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
from src.modulos.crud_basicos.domain.entities.ponto_de_parada import PontoDeParadaORM
from src.modulos.crud_basicos.infrastructure.repositories.bairro_repository import (
    BairroComRotaAtivaError,
    BairroJaAtivadoError,
    BairroJaCadastradoError,
    BairroJaDesativadoError,
    BairroNaoEncontradoError,
    BairroRepository,
    PontoDeParadaJaCadastradoError,
)
from src.modulos.crud_basicos.interface.http.bairro_routes import (
    admin_required,
    get_session,
    router as bairro_router,
)
from src.shared.auth.dependencies import get_current_user, get_optional_current_user
from src.shared.infrastructure.audit_model import LogAuditoriaORM
from src.shared.infrastructure.db import Base


class BairrosCrudUnitTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(
            self.engine,
            tables=[
                BairroORM.__table__,
                PontoDeParadaORM.__table__,
                LogAuditoriaORM.__table__,
            ],
        )
        self.Session = sessionmaker(bind=self.engine)
        self.session = self.Session()
        self.repository = BairroRepository(self.session)
        self.service = BairroService(self.repository)

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(
            self.engine,
            tables=[
                BairroORM.__table__,
                PontoDeParadaORM.__table__,
                LogAuditoriaORM.__table__,
            ],
        )

    def test_criterio_2_e_1_criar_e_listar_com_pontos(self):
        bairro = self.service.criar("Centro", ["Praça Matriz", "Hospital"])
        self.assertIsNotNone(bairro.bairro_id)
        self.assertEqual(bairro.nome, "Centro")
        self.assertTrue(bairro.ativo)
        self.assertEqual(len(bairro.pontos_de_parada), 2)
        nomes_pontos = [p.nome for p in bairro.pontos_de_parada]
        self.assertIn("Praça Matriz", nomes_pontos)
        self.assertIn("Hospital", nomes_pontos)

        itens = self.service.listar(ativo=True)
        self.assertEqual(len(itens), 1)
        self.assertEqual(len(itens[0].pontos_de_parada), 2)

    def test_criterio_3_unicidade_bairro_mensagem_exata(self):
        self.service.criar("Centro", ["Praça Matriz"])

        with self.assertRaises(BairroJaCadastradoError) as ctx:
            self.service.criar("centro", ["Outro Ponto"])

        self.assertEqual(str(ctx.exception), "Esta localidade já está cadastrada.")

    def test_criterio_3_unicidade_ponto_de_parada_mensagem_exata(self):
        with self.assertRaises(PontoDeParadaJaCadastradoError) as ctx:
            self.service.criar("Bairro 1", ["Ponto A", "ponto a"])

        self.assertEqual(
            str(ctx.exception),
            "O ponto de parada 'ponto a' está repetido neste bairro.",
        )

    def test_criterio_3_mesmo_ponto_em_bairros_diferentes_e_permitido(self):
        self.service.criar("Centro", ["Posto de Saúde"])
        novo = self.service.criar("Planalto Universitário", ["Posto de Saúde"])

        self.assertEqual(
            [p.nome for p in novo.pontos_de_parada],
            ["Posto de Saúde"],
        )
        self.assertEqual(len(self.service.listar()), 2)

    def test_criterio_3_unicidade_bloqueia_mesmo_se_inativo(self):
        b1 = self.service.criar("Bairro Antigo", ["Ponto Antigo"])
        self.service.inativar(b1.bairro_id, usuario_executor_id=1)

        b1_db = self.repository.buscar_por_id(b1.bairro_id)
        self.assertFalse(b1_db.ativo)

        with self.assertRaises(BairroJaCadastradoError) as ctx:
            self.service.criar("Bairro Antigo", ["Novo Ponto"])
        self.assertEqual(str(ctx.exception), "Esta localidade já está cadastrada.")

        outro = self.service.criar("Outro Bairro", ["Ponto Antigo"])
        self.assertEqual(
            [p.nome for p in outro.pontos_de_parada],
            ["Ponto Antigo"],
        )

    def test_criterio_4_edicao_mantem_validacoes(self):
        b1 = self.service.criar("Planalto", ["Ponto 1", "Ponto 2"])
        b2 = self.service.criar("Alto Alegre", ["Ponto 3"])

        atualizado = self.service.atualizar(
            b1.bairro_id,
            nome="Planalto Nobre",
            pontos_de_parada=["Ponto 1", "Ponto Renovado"],
        )
        self.assertEqual(atualizado.nome, "Planalto Nobre")
        nomes = [p.nome for p in atualizado.pontos_de_parada]
        self.assertIn("Ponto 1", nomes)
        self.assertIn("Ponto Renovado", nomes)

        with self.assertRaises(BairroJaCadastradoError) as ctx:
            self.service.atualizar(b1.bairro_id, nome="Alto Alegre")
        self.assertEqual(str(ctx.exception), "Esta localidade já está cadastrada.")

        atualizado = self.service.atualizar(
            b1.bairro_id, pontos_de_parada=["Ponto 3"]
        )
        self.assertEqual(
            [p.nome for p in atualizado.pontos_de_parada],
            ["Ponto 3"],
        )

        b2_db = self.repository.buscar_por_id(b2.bairro_id)
        self.assertEqual(
            [p.nome for p in b2_db.pontos_de_parada],
            ["Ponto 3"],
        )

        with self.assertRaises(PontoDeParadaJaCadastradoError) as ctx:
            self.service.atualizar(
                b1.bairro_id, pontos_de_parada=["Ponto 3", "ponto 3"]
            )
        self.assertEqual(
            str(ctx.exception),
            "O ponto de parada 'ponto 3' está repetido neste bairro.",
        )

    def test_criterio_5_inativacao_e_reativacao_gera_log_auditoria(self):
        b = self.service.criar("Distrito", ["Ponto X"])
        bid = b.bairro_id

        self.service.inativar(bid, usuario_executor_id=42)
        b_inativo = self.repository.buscar_por_id(bid)
        self.assertFalse(b_inativo.ativo)

        log_inativar = (
            self.session.query(LogAuditoriaORM)
            .filter(
                LogAuditoriaORM.entidade == "bairro",
                LogAuditoriaORM.acao == "INATIVAR",
            )
            .first()
        )
        self.assertIsNotNone(log_inativar)
        self.assertEqual(log_inativar.usuario_id, 42)
        self.assertEqual(log_inativar.entidade_id, bid)
        self.assertEqual(log_inativar.valor_anterior, "ativo")
        self.assertEqual(log_inativar.valor_novo, "inativo")
        self.assertIsNotNone(log_inativar.criado_em)

        self.service.ativar(bid, usuario_executor_id=42)
        b_reativado = self.repository.buscar_por_id(bid)
        self.assertTrue(b_reativado.ativo)

        log_reativar = (
            self.session.query(LogAuditoriaORM)
            .filter(
                LogAuditoriaORM.entidade == "bairro",
                LogAuditoriaORM.acao == "ATIVAR",
            )
            .first()
        )
        self.assertIsNotNone(log_reativar)
        self.assertEqual(log_reativar.usuario_id, 42)
        self.assertEqual(log_reativar.entidade_id, bid)
        self.assertEqual(log_reativar.valor_anterior, "inativo")
        self.assertEqual(log_reativar.valor_novo, "ativo")
        self.assertIsNotNone(log_reativar.criado_em)

    def test_criterio_6_bloqueio_por_rota_ativa(self):
        rotas_ativas_por_bairro = {99: True}
        repo_com_rota = BairroRepository(
            self.session,
            rota_ativa_checker=lambda bid: rotas_ativas_por_bairro.get(bid, False),
        )
        svc = BairroService(repo_com_rota)

        b = svc.criar("Bairro Com Rota", ["Ponto Rota"])
        rotas_ativas_por_bairro[b.bairro_id] = True

        with self.assertRaises(BairroComRotaAtivaError) as ctx:
            svc.inativar(b.bairro_id, usuario_executor_id=1)

        self.assertEqual(
            str(ctx.exception),
            "Este bairro não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar.",
        )

    def test_criterio_8_validacao_campos_obrigatorios(self):
        with self.assertRaises(BairroValidationError) as ctx:
            self.service.criar("   ", ["Ponto 1"])
        self.assertEqual(ctx.exception.field, "nome")
        self.assertEqual(str(ctx.exception), "O nome do bairro é obrigatório.")

        with self.assertRaises(BairroValidationError) as ctx:
            self.service.criar("Centro", [])
        self.assertEqual(ctx.exception.field, "pontos_de_parada")
        self.assertEqual(
            str(ctx.exception), "Ao menos um ponto de parada é obrigatório."
        )

        with self.assertRaises(BairroValidationError) as ctx:
            self.service.criar("Centro", ["   "])
        self.assertEqual(ctx.exception.field, "pontos_de_parada")
        self.assertEqual(
            str(ctx.exception), "O nome do ponto de parada não pode ser vazio."
        )


class BairrosApiHttpTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(
            self.engine,
            tables=[
                BairroORM.__table__,
                PontoDeParadaORM.__table__,
                LogAuditoriaORM.__table__,
            ],
        )
        self.Session = sessionmaker(bind=self.engine)
        self.session = self.Session()

        self.app = FastAPI()
        self.app.include_router(bairro_router)

        fake_admin = {
            "sub": "1",
            "current_user_id": 1,
            "role": "administrador",
            "current_roles": ["administrador"],
        }

        self.app.dependency_overrides[get_session] = lambda: self.session
        self.app.dependency_overrides[get_current_user] = lambda: fake_admin
        self.app.dependency_overrides[get_optional_current_user] = lambda: fake_admin
        self.app.dependency_overrides[admin_required] = lambda: fake_admin

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(
            self.engine,
            tables=[
                BairroORM.__table__,
                PontoDeParadaORM.__table__,
                LogAuditoriaORM.__table__,
            ],
        )

    async def asgi_request(self, path, payload=None, method="GET", query_string=b""):
        raw_body = json.dumps(payload).encode("utf-8") if payload is not None else b""
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

    async def test_api_fluxo_completo_e_criterios_de_aceite(self):
        status, body = await self.asgi_request(
            "/bairros",
            payload={
                "nome_bairro": "Bairro das Flores",
                "pontos_de_parada": ["Rua das Rosas", "Avenida dos Cravos"],
            },
            method="POST",
        )
        self.assertEqual(status, 201)
        self.assertTrue(body["success"])
        self.assertEqual(body["message"], "Operação realizada com sucesso")
        bairro_id = body["data"]["bairro_id"]
        self.assertEqual(len(body["data"]["pontos_de_parada"]), 2)

        status2, body2 = await self.asgi_request(
            "/bairros",
            payload={
                "nome": "Bairro Inativo Teste",
                "pontos_de_parada": ["Ponto Isolado"],
            },
            method="POST",
        )
        bid2 = body2["data"]["bairro_id"]
        await self.asgi_request(f"/bairros/{bid2}/inativar", method="PATCH")

        status_admin_all, body_admin_all = await self.asgi_request("/bairros", method="GET")
        self.assertEqual(status_admin_all, 200)
        self.assertEqual(len(body_admin_all), 2)

        status_ativos, body_ativos = await self.asgi_request(
            "/bairros", method="GET", query_string=b"ativo=true"
        )
        self.assertEqual(status_ativos, 200)
        self.assertEqual(len(body_ativos), 1)
        self.assertEqual(body_ativos[0]["bairro_id"], bairro_id)

        status_inativos, body_inativos = await self.asgi_request(
            "/bairros", method="GET", query_string=b"ativo=false"
        )
        self.assertEqual(status_inativos, 200)
        self.assertEqual(len(body_inativos), 1)
        self.assertEqual(body_inativos[0]["bairro_id"], bid2)

        status_dup, body_dup = await self.asgi_request(
            "/bairros",
            payload={
                "nome": "bairro das flores",
                "pontos_de_parada": ["Ponto Qualquer"],
            },
            method="POST",
        )
        self.assertEqual(status_dup, 409)
        self.assertIn("Esta localidade já está cadastrada.", str(body_dup))

        status_mesmo_ponto, body_mesmo_ponto = await self.asgi_request(
            "/bairros",
            payload={
                "nome": "Planalto Universitário",
                "pontos_de_parada": ["Rua das Rosas"],
            },
            method="POST",
        )
        self.assertEqual(status_mesmo_ponto, 201)
        self.assertTrue(body_mesmo_ponto["success"])
        self.assertEqual(body_mesmo_ponto["message"], "Operação realizada com sucesso")

        status_ponto_dup, body_ponto_dup = await self.asgi_request(
            "/bairros",
            payload={
                "nome": "Bairro Com Ponto Repetido",
                "pontos_de_parada": ["Praça Central", "praça central"],
            },
            method="POST",
        )
        self.assertEqual(status_ponto_dup, 409)
        self.assertIn("está repetido neste bairro", str(body_ponto_dup))

        status_inativar, body_inativar = await self.asgi_request(
            f"/bairros/{bairro_id}/inativar", method="PATCH"
        )
        self.assertEqual(status_inativar, 200)
        self.assertEqual(body_inativar["message"], "Operação realizada com sucesso")
        self.assertFalse(body_inativar["data"]["ativo"])

        status_reativar, body_reativar = await self.asgi_request(
            f"/bairros/{bairro_id}/ativar", method="PATCH"
        )
        self.assertEqual(status_reativar, 200)
        self.assertEqual(body_reativar["message"], "Operação realizada com sucesso")
        self.assertTrue(body_reativar["data"]["ativo"])

        status_val, body_val = await self.asgi_request(
            "/bairros",
            payload={"nome": "", "pontos_de_parada": []},
            method="POST",
        )
        self.assertEqual(status_val, 422)