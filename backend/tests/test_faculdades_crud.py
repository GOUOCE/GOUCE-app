import json
import unittest
from datetime import datetime
from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from src.modulos.crud_basicos.application.dtos.faculdade_dto import (
    CriarFaculdadeDTO,
    AtualizarFaculdadeDTO,
)
from src.modulos.crud_basicos.application.services.faculdade_service import (
    FaculdadeService,
    FaculdadeValidationError,
)
from src.modulos.crud_basicos.infrastructure.repositories.faculdade_repository import (
    FaculdadeJaCadastradaError,
    FaculdadeNaoEncontradaError,
    FaculdadeRepository,
)
from src.modulos.crud_basicos.interface.http.faculdade_routes import (
    get_session,
    router as faculdade_router,
)
from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
from src.shared.auth.dependencies import require_roles
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.infrastructure.audit_model import LogAuditoriaORM
from src.shared.infrastructure.db import Base


class FaculdadesCrudUnitTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(
            self.engine,
            tables=[FaculdadeORM.__table__, LogAuditoriaORM.__table__],
        )
        self.Session = sessionmaker(bind=self.engine)
        self.session = self.Session()
        self.repository = FaculdadeRepository(self.session)
        self.service = FaculdadeService(self.repository)

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(
            self.engine,
            tables=[FaculdadeORM.__table__, LogAuditoriaORM.__table__],
        )

    def test_criar_faculdade_com_sucesso(self):
        faculdade = self.service.criar(nome="UFC", campus="Quixadá")

        self.assertIsNotNone(faculdade.id_faculdade)
        self.assertEqual(faculdade.nome_faculdade, "UFC")
        self.assertEqual(faculdade.campus_faculdade, "Quixadá")
        self.assertTrue(faculdade.ativo)

    def test_strip_normaliza_ao_criar_e_ao_editar(self):
        faculdade = self.service.criar(
            nome="   Universidade Federal do Ceará   ",
            campus="   Campus Quixadá   ",
        )
        self.assertEqual(faculdade.nome_faculdade, "Universidade Federal do Ceará")
        self.assertEqual(faculdade.campus_faculdade, "Campus Quixadá")

        atualizada = self.service.atualizar(
            faculdade.id_faculdade,
            nome="   UFC Atualizada   ",
            campus="   Campus Pici   ",
        )
        self.assertEqual(atualizada.nome_faculdade, "UFC Atualizada")
        self.assertEqual(atualizada.campus_faculdade, "Campus Pici")

    def test_duplicado_faculdade_ativa_bloqueia_com_mensagem_exata(self):
        self.service.criar("UFC", "Quixadá")

        with self.assertRaises(FaculdadeJaCadastradaError) as ctx:
            self.service.criar("UFC", "Quixadá")

        self.assertEqual(str(ctx.exception), "Esta faculdade já está cadastrada.")

    def test_duplicado_faculdade_inativa_bloqueia_com_mensagem_exata(self):
        faculdade = self.service.criar("IFCE", "Cedro")
        self.service.inativar(faculdade.id_faculdade, usuario_executor_id=1)

        faculdade_inativa = self.repository.buscar_por_id(faculdade.id_faculdade)
        self.assertFalse(faculdade_inativa.ativo)

        with self.assertRaises(FaculdadeJaCadastradaError) as ctx:
            self.service.criar("IFCE", "Cedro")

        self.assertEqual(str(ctx.exception), "Esta faculdade já está cadastrada.")

    def test_duplicado_fallback_integrity_error(self):
        class FailingSession:
            def __init__(self, real_session):
                self.real = real_session

            def query(self, *args, **kwargs):
                return self.real.query(*args, **kwargs)

            def add(self, item):
                pass

            def commit(self):
                raise IntegrityError("duplicate key", params=None, orig=Exception("uq_faculdade_nome_campus"))

            def rollback(self):
                pass

        failing_repo = FaculdadeRepository(FailingSession(self.session))
        with self.assertRaises(FaculdadeJaCadastradaError) as ctx:
            failing_repo.criar("UNIFOR", "Fortaleza")

        self.assertEqual(str(ctx.exception), "Esta faculdade já está cadastrada.")

    def test_editar_revalida_unicidade_ignorando_o_proprio_registro(self):
        f1 = self.service.criar("UFC", "Crateús")
        f2 = self.service.criar("UFC", "Sobral")

        # Mantém o mesmo nome e campus da própria faculdade -> deve permitir
        f1_atualizada = self.service.atualizar(f1.id_faculdade, nome="UFC", campus="Crateús")
        self.assertEqual(f1_atualizada.nome_faculdade, "UFC")

        # Tenta atualizar f1 para coincidir com f2 -> deve bloquear
        with self.assertRaises(FaculdadeJaCadastradaError) as ctx:
            self.service.atualizar(f1.id_faculdade, nome="UFC", campus="Sobral")

        self.assertEqual(str(ctx.exception), "Esta faculdade já está cadastrada.")

    def test_editar_faculdade_inexistente_lanca_erro(self):
        with self.assertRaises(FaculdadeNaoEncontradaError):
            self.service.atualizar(9999, nome="Inexistente", campus="Campus")

    def test_inativar_com_auditoria_registra_dados_e_soft_delete(self):
        faculdade = self.service.criar("UECE", "Itaperi")
        faculdade_id = faculdade.id_faculdade

        self.service.inativar(faculdade_id, usuario_executor_id=42)

        # Registro continua no banco (soft delete)
        faculdade_db = self.repository.buscar_por_id(faculdade_id)
        self.assertIsNotNone(faculdade_db)
        self.assertFalse(faculdade_db.ativo)

        # Log de auditoria registrado corretamente
        log = self.session.query(LogAuditoriaORM).filter(
            LogAuditoriaORM.entidade == "faculdade",
            LogAuditoriaORM.entidade_id == faculdade_id,
        ).first()

        self.assertIsNotNone(log)
        self.assertEqual(log.usuario_id, 42)
        self.assertEqual(log.acao, "INATIVAR")
        self.assertEqual(log.valor_anterior, "ativo")
        self.assertEqual(log.valor_novo, "inativo")
        self.assertIsInstance(log.criado_em, datetime)

    def test_inativar_faculdade_inexistente_lanca_erro(self):
        with self.assertRaises(FaculdadeNaoEncontradaError):
            self.service.inativar(9999, usuario_executor_id=1)

    def test_ativar_com_auditoria_registra_dados(self):
        faculdade = self.service.criar("UECE", "Itaperi")
        faculdade_id = faculdade.id_faculdade
        self.service.inativar(faculdade_id, usuario_executor_id=1)

        self.service.ativar(faculdade_id, usuario_executor_id=77)

        faculdade_db = self.repository.buscar_por_id(faculdade_id)
        self.assertTrue(faculdade_db.ativo)

        log = self.session.query(LogAuditoriaORM).filter(
            LogAuditoriaORM.entidade == "faculdade",
            LogAuditoriaORM.entidade_id == faculdade_id,
            LogAuditoriaORM.acao == "ATIVAR",
        ).first()

        self.assertIsNotNone(log)
        self.assertEqual(log.usuario_id, 77)
        self.assertEqual(log.acao, "ATIVAR")
        self.assertEqual(log.valor_anterior, "inativo")
        self.assertEqual(log.valor_novo, "ativo")
        self.assertIsInstance(log.criado_em, datetime)

    def test_ativar_faculdade_inexistente_lanca_erro(self):
        with self.assertRaises(FaculdadeNaoEncontradaError):
            self.service.ativar(9999, usuario_executor_id=1)

    def test_listagem_com_e_sem_filtro_na_query_sql(self):
        f1 = self.service.criar("UFC", "Russas")
        f2 = self.service.criar("UFC", "Sobral")
        self.service.inativar(f2.id_faculdade, usuario_executor_id=1)

        # Sem filtro: retorna ativas e inativas
        todas = self.service.listar(ativo=None)
        nomes_campi = [(f.nome_faculdade, f.campus_faculdade) for f in todas]
        self.assertIn(("UFC", "Russas"), nomes_campi)
        self.assertIn(("UFC", "Sobral"), nomes_campi)
        self.assertEqual(len(todas), 2)

        # Com filtro ativo=True: apenas ativas
        ativas = self.service.listar(ativo=True)
        self.assertEqual(len(ativas), 1)
        self.assertEqual(ativas[0].campus_faculdade, "Russas")

        # Com filtro ativo=False: apenas inativas
        inativas = self.service.listar(ativo=False)
        self.assertEqual(len(inativas), 1)
        self.assertEqual(inativas[0].campus_faculdade, "Sobral")

    def test_campos_obrigatorios_no_service(self):
        with self.assertRaises(FaculdadeValidationError) as ctx:
            self.service.criar("", "Campus")
        self.assertEqual(ctx.exception.field, "nome")

        with self.assertRaises(FaculdadeValidationError) as ctx:
            self.service.criar("   ", "Campus")
        self.assertEqual(ctx.exception.field, "nome")

        with self.assertRaises(FaculdadeValidationError) as ctx:
            self.service.criar("Nome", "")
        self.assertEqual(ctx.exception.field, "campus")

        with self.assertRaises(FaculdadeValidationError) as ctx:
            self.service.criar("Nome", "   ")
        self.assertEqual(ctx.exception.field, "campus")


class FaculdadesApiHttpTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(
            self.engine,
            tables=[FaculdadeORM.__table__, LogAuditoriaORM.__table__],
        )
        self.Session = sessionmaker(bind=self.engine)
        self.session = self.Session()

        self.app = FastAPI()
        self.app.include_router(faculdade_router)

        fake_admin = {
            "sub": "1",
            "current_user_id": 1,
            "role": "administrador",
            "current_roles": ["administrador"],
        }
        from src.shared.auth.dependencies import get_current_user
        from src.modulos.crud_basicos.interface.http.faculdade_routes import admin_required

        self.app.dependency_overrides[get_session] = lambda: self.session
        self.app.dependency_overrides[get_current_user] = lambda: fake_admin
        self.app.dependency_overrides[admin_required] = lambda: fake_admin

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(
            self.engine,
            tables=[FaculdadeORM.__table__, LogAuditoriaORM.__table__],
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

    async def test_criar_faculdade_http_retorna_201(self):
        status, body = await self.asgi_request(
            "/faculdades",
            payload={"nome": "UFC", "campus": "Quixadá"},
            method="POST",
        )
        self.assertEqual(status, 201)
        self.assertTrue(body["success"])
        self.assertEqual(body["message"], "Operação realizada com sucesso")
        self.assertEqual(body["data"]["nome_faculdade"], "UFC")
        self.assertEqual(body["data"]["campus_faculdade"], "Quixadá")
        self.assertTrue(body["data"]["ativo"])

    async def test_criar_duplicado_ativa_retorna_409(self):
        await self.asgi_request(
            "/faculdades",
            payload={"nome": "UFC", "campus": "Quixadá"},
            method="POST",
        )
        status, body = await self.asgi_request(
            "/faculdades",
            payload={"nome": "UFC", "campus": "Quixadá"},
            method="POST",
        )
        self.assertEqual(status, 409)
        self.assertIn("Esta faculdade já está cadastrada.", str(body))

    async def test_criar_duplicado_inativa_retorna_409(self):
        _, res1 = await self.asgi_request(
            "/faculdades",
            payload={"nome": "IFCE", "campus": "Canindé"},
            method="POST",
        )
        faculdade_id = res1["data"]["id_faculdade"]

        await self.asgi_request(f"/faculdades/{faculdade_id}/inativar", method="PATCH")

        status, body = await self.asgi_request(
            "/faculdades",
            payload={"nome": "IFCE", "campus": "Canindé"},
            method="POST",
        )
        self.assertEqual(status, 409)
        self.assertIn("Esta faculdade já está cadastrada.", str(body))

    async def test_editar_faculdade_http(self):
        _, res = await self.asgi_request(
            "/faculdades",
            payload={"nome": "UFC", "campus": "Sobral"},
            method="POST",
        )
        faculdade_id = res["data"]["id_faculdade"]

        # Edição permitida
        status, body = await self.asgi_request(
            f"/faculdades/{faculdade_id}",
            payload={"nome": "UFC", "campus": "Sobral Sul"},
            method="PATCH",
        )
        self.assertEqual(status, 200)
        self.assertEqual(body["data"]["campus_faculdade"], "Sobral Sul")

        # Revalidar unicidade com outra faculdade
        await self.asgi_request(
            "/faculdades",
            payload={"nome": "UFC", "campus": "Russas"},
            method="POST",
        )
        status_conflito, body_conflito = await self.asgi_request(
            f"/faculdades/{faculdade_id}",
            payload={"nome": "UFC", "campus": "Russas"},
            method="PATCH",
        )
        self.assertEqual(status_conflito, 409)
        self.assertIn("Esta faculdade já está cadastrada.", str(body_conflito))

    async def test_inativar_faculdade_http_retorna_sucesso_e_auditoria(self):
        _, res = await self.asgi_request(
            "/faculdades",
            payload={"nome": "UNILAB", "campus": "Redenção"},
            method="POST",
        )
        faculdade_id = res["data"]["id_faculdade"]

        status, body = await self.asgi_request(
            f"/faculdades/{faculdade_id}/inativar",
            method="PATCH",
        )
        self.assertEqual(status, 200)
        self.assertEqual(body["message"], "Operação realizada com sucesso")
        self.assertFalse(body["data"]["ativo"])

        # Verificar log de auditoria criado
        log = self.session.query(LogAuditoriaORM).filter(
            LogAuditoriaORM.entidade == "faculdade",
            LogAuditoriaORM.entidade_id == faculdade_id,
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.usuario_id, 1)
        self.assertEqual(log.acao, "INATIVAR")

    async def test_ativar_faculdade_http_retorna_sucesso_e_auditoria(self):
        _, res = await self.asgi_request(
            "/faculdades",
            payload={"nome": "UNILAB", "campus": "Redenção"},
            method="POST",
        )
        faculdade_id = res["data"]["id_faculdade"]
        await self.asgi_request(f"/faculdades/{faculdade_id}/inativar", method="PATCH")

        status, body = await self.asgi_request(
            f"/faculdades/{faculdade_id}/ativar",
            method="PATCH",
        )
        self.assertEqual(status, 200)
        self.assertEqual(body["message"], "Operação realizada com sucesso")
        self.assertTrue(body["data"]["ativo"])

        log = self.session.query(LogAuditoriaORM).filter(
            LogAuditoriaORM.entidade == "faculdade",
            LogAuditoriaORM.entidade_id == faculdade_id,
            LogAuditoriaORM.acao == "ATIVAR",
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.usuario_id, 1)
        self.assertEqual(log.acao, "ATIVAR")
        self.assertEqual(log.valor_anterior, "inativo")
        self.assertEqual(log.valor_novo, "ativo")

    async def test_listar_faculdades_com_e_sem_filtro(self):
        await self.asgi_request("/faculdades", payload={"nome": "F1", "campus": "C1"}, method="POST")
        _, res2 = await self.asgi_request("/faculdades", payload={"nome": "F2", "campus": "C2"}, method="POST")
        f2_id = res2["data"]["id_faculdade"]
        await self.asgi_request(f"/faculdades/{f2_id}/inativar", method="PATCH")

        # Sem filtro: 2 registros
        status_todas, body_todas = await self.asgi_request("/faculdades", method="GET")
        self.assertEqual(status_todas, 200)
        self.assertEqual(len(body_todas), 2)

        # Com filtro ativo=true: 1 registro
        status_ativas, body_ativas = await self.asgi_request("/faculdades", method="GET", query_string=b"ativo=true")
        self.assertEqual(status_ativas, 200)
        self.assertEqual(len(body_ativas), 1)
        self.assertTrue(body_ativas[0]["ativo"])

        # Com filtro ativo=false: 1 registro
        status_inativas, body_inativas = await self.asgi_request("/faculdades", method="GET", query_string=b"ativo=false")
        self.assertEqual(status_inativas, 200)
        self.assertEqual(len(body_inativas), 1)
        self.assertFalse(body_inativas[0]["ativo"])

    async def test_campos_obrigatorios_retornam_422(self):
        # Sem campus
        status, _ = await self.asgi_request("/faculdades", payload={"nome": "UFC"}, method="POST")
        self.assertEqual(status, 422)

        # Sem nome
        status, _ = await self.asgi_request("/faculdades", payload={"campus": "Quixadá"}, method="POST")
        self.assertEqual(status, 422)

        # Nome vazio / com espaços
        status, _ = await self.asgi_request("/faculdades", payload={"nome": "   ", "campus": "Quixadá"}, method="POST")
        self.assertEqual(status, 422)

        # Campus vazio / com espaços
        status, _ = await self.asgi_request("/faculdades", payload={"nome": "UFC", "campus": "   "}, method="POST")
        self.assertEqual(status, 422)


if __name__ == "__main__":
    unittest.main()
