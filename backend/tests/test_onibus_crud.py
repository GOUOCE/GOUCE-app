import json
import unittest
from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.modulos.arquivos.model.entities.arquivo import ArquivoORM
from src.modulos.crud_basicos.domain.entities.onibus import OnibusORM
from src.modulos.crud_basicos.infrastructure.repositories.onibus_repository import (
    OnibusJaCadastradoError,
    OnibusNaoEncontradoError,
    OnibusJaAtivado,
    OnibusJaDesativado,
    OnibusRepository,
)
from src.modulos.crud_basicos.application.services.onibus_service import (
    OnibusService,
    OnibusValidationError,
)
from src.modulos.crud_basicos.interface.http.onibus_routes import (
    admin_required,
    get_arquivo_repository,
    get_session,
    get_storage_service,
    router as onibus_router,
)
from src.shared.auth.dependencies import get_current_user, get_optional_current_user
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.infrastructure.audit_model import LogAuditoriaORM
from src.shared.infrastructure.db import Base


class FakeStorageService:
    def __init__(self):
        self.deleted_objects = []

    def salvar_arquivo(self, conteudo, nome_objeto, content_type=None):
        return f"http://storage.test/{nome_objeto}"

    def deletar_arquivo(self, nome_objeto):
        self.deleted_objects.append(nome_objeto)
        return True


class OnibusCrudUnitTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        self.tables = [
            ArquivoORM.__table__,
            OnibusORM.__table__,
            LogAuditoriaORM.__table__,
        ]
        Base.metadata.create_all(self.engine, tables=self.tables)
        self.Session = sessionmaker(bind=self.engine)
        self.session = self.Session()
        self.repository = OnibusRepository(self.session)
        self.service = OnibusService(self.repository)

        # Arquivo mock
        self.arquivo_foto = ArquivoORM(
            id="arq-foto-onibus-1",
            nome="onibus.jpg",
            url="http://minio/onibus.jpg",
            tamanho_bytes=2048,
            content_type="image/jpeg",
        )
        self.session.add(self.arquivo_foto)
        self.session.commit()

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(self.engine, tables=self.tables)

    def test_criar_onibus_com_sucesso(self):
        onibus = self.service.criar(
            placa="ABC-1234",
            qtd_assentos=44,
            capacidade_maxima=20,
            apelido="Trovão Azul",
            id_foto_onibus=self.arquivo_foto.id,
        )

        self.assertEqual(onibus.placa, "ABC-1234")
        self.assertEqual(onibus.assentos, 44)
        self.assertEqual(onibus.capacidade_em_pe, 20)
        self.assertEqual(onibus.apelido, "Trovão Azul")
        self.assertTrue(onibus.ativo)
        self.assertEqual(onibus.id_foto_onibus, self.arquivo_foto.id)

    def test_criar_onibus_com_placa_duplicada_bloqueia(self):
        self.service.criar(placa="ABC-1234", qtd_assentos=40, capacidade_maxima=15)

        with self.assertRaises(OnibusJaCadastradoError) as ctx:
            self.service.criar(placa="abc-1234", qtd_assentos=30, capacidade_maxima=10)
        self.assertEqual(str(ctx.exception), "Este veículo já está registrado.")

    def test_criar_onibus_com_placa_duplicada_considerando_inativo_bloqueia(self):
        onibus = self.service.criar(placa="XYZ-9876", qtd_assentos=40, capacidade_maxima=15)
        self.service.inativar(onibus.placa, usuario_executor_id=1)

        with self.assertRaises(OnibusJaCadastradoError) as ctx:
            self.service.criar(placa="XYZ-9876", qtd_assentos=50, capacidade_maxima=20)
        self.assertEqual(str(ctx.exception), "Este veículo já está registrado.")

    def test_validacao_foto_invalida(self):
        with self.assertRaises(OnibusValidationError) as ctx:
            self.service.criar(
                placa="FOT-0001",
                qtd_assentos=40,
                capacidade_maxima=10,
                id_foto_onibus="arquivo-inexistente",
            )
        self.assertEqual(str(ctx.exception), "A foto informada não é um arquivo válido registrado no sistema.")

    def test_atualizar_onibus_com_sucesso(self):
        onibus = self.service.criar(placa="OLD-1111", qtd_assentos=30, capacidade_maxima=10)
        atualizado = self.service.atualizar(
            placa_atual=onibus.placa,
            nova_placa="NEW-2222",
            qtd_assentos=45,
            capacidade_maxima=25,
            apelido="Expresso",
        )

        self.assertEqual(atualizado.placa, "NEW-2222")
        self.assertEqual(atualizado.assentos, 45)
        self.assertEqual(atualizado.capacidade_em_pe, 25)
        self.assertEqual(atualizado.apelido, "Expresso")

    def test_atualizar_mantendo_propria_placa(self):
        onibus = self.service.criar(placa="MAN-3333", qtd_assentos=30, capacidade_maxima=10)
        atualizado = self.service.atualizar(
            placa_atual="MAN-3333",
            nova_placa="MAN-3333",
            qtd_assentos=35,
        )
        self.assertEqual(atualizado.assentos, 35)

    def test_atualizar_para_placa_ja_existente_bloqueia(self):
        self.service.criar(placa="BUS-0001", qtd_assentos=30, capacidade_maxima=10)
        self.service.criar(placa="BUS-0002", qtd_assentos=30, capacidade_maxima=10)

        with self.assertRaises(OnibusJaCadastradoError) as ctx:
            self.service.atualizar(placa_atual="BUS-0002", nova_placa="BUS-0001")
        self.assertEqual(str(ctx.exception), "Este veículo já está registrado.")

    def test_inativar_e_reativar_com_auditoria(self):
        onibus = self.service.criar(placa="AUD-1234", qtd_assentos=40, capacidade_maxima=15)

        # Inativar
        inativado = self.service.inativar(onibus.placa, usuario_executor_id=99)
        self.assertFalse(inativado.ativo)

        log_inativar = self.session.query(LogAuditoriaORM).filter_by(
            entidade="onibus",
            acao="INATIVAR",
        ).first()
        self.assertIsNotNone(log_inativar)
        self.assertEqual(log_inativar.usuario_id, 99)
        self.assertEqual(log_inativar.valor_novo, "inativo")

        # Reativar
        reativado = self.service.ativar(onibus.placa, usuario_executor_id=99)
        self.assertTrue(reativado.ativo)

        log_ativar = self.session.query(LogAuditoriaORM).filter_by(
            entidade="onibus",
            acao="ATIVAR",
        ).first()
        self.assertIsNotNone(log_ativar)
        self.assertEqual(log_ativar.usuario_id, 99)
        self.assertEqual(log_ativar.valor_novo, "ativo")

    def test_criar_editar_e_mudar_status_por_atualizar_gravam_o_administrador(self):
        onibus = self.service.criar(
            placa="LOG-1234", qtd_assentos=40, capacidade_maxima=15, usuario_executor_id=7
        )
        self.service.atualizar(onibus.placa, qtd_assentos=44, usuario_executor_id=7)
        self.service.atualizar(onibus.placa, ativo=False, usuario_executor_id=7)

        logs = (
            self.session.query(LogAuditoriaORM)
            .filter_by(entidade="onibus")
            .order_by(LogAuditoriaORM.id)
            .all()
        )
        self.assertEqual(
            [(log.acao, log.usuario_id) for log in logs],
            [("CRIAR", 7), ("EDITAR", 7), ("INATIVAR", 7)],
        )


class OnibusApiHttpTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        self.tables = [
            ArquivoORM.__table__,
            OnibusORM.__table__,
            LogAuditoriaORM.__table__,
        ]
        Base.metadata.create_all(self.engine, tables=self.tables)
        self.Session = sessionmaker(bind=self.engine)
        self.session = self.Session()

        self.app = FastAPI()
        self.app.include_router(onibus_router)

        self.fake_admin = {
            "sub": "1",
            "current_user_id": 1,
            "role": CargoEnum.ADMINISTRADOR.value,
            "current_roles": [CargoEnum.ADMINISTRADOR.value],
        }

        self.app.dependency_overrides[get_session] = lambda: self.session
        self.app.dependency_overrides[get_current_user] = lambda: self.fake_admin
        self.app.dependency_overrides[get_optional_current_user] = lambda: self.fake_admin
        self.app.dependency_overrides[admin_required] = lambda: self.fake_admin
        self.app.dependency_overrides[get_storage_service] = lambda: FakeStorageService()

    async def asyncTearDown(self):
        self.session.close()
        Base.metadata.drop_all(self.engine, tables=self.tables)

    async def asgi_request(self, path: str, payload=None, method="GET", query_string=b""):
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

    async def asgi_multipart_request(self, path: str, fields: dict, files: dict, method="POST"):
        boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
        body_parts = []
        for name, value in fields.items():
            if value is not None:
                body_parts.append(
                    f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n".encode("utf-8")
                )
        for name, (filename, content, content_type) in files.items():
            header = f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"; filename=\"{filename}\"\r\nContent-Type: {content_type}\r\n\r\n"
            body_parts.append(header.encode("utf-8") + content + b"\r\n")
        body_parts.append(f"--{boundary}--\r\n".encode("utf-8"))
        raw_body = b"".join(body_parts)

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
                (b"content-type", f"multipart/form-data; boundary={boundary}".encode("ascii")),
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

    async def test_regressao_limites_post_patch_sem_alterar_registro(self):
        base = {"placa": "QAQ3J45", "assentos": 40, "capacidade_em_pe": 10}
        status, _ = await self.asgi_request("/onibus", payload=base, method="POST")
        self.assertEqual(status, 201)
        for campo in ("assentos", "capacidade_em_pe"):
            for valor in (2.5, 101, 883833333333):
                for method, path in (("POST", "/onibus"), ("PATCH", "/onibus/QAQ3J45")):
                    with self.subTest(campo=campo, valor=valor, method=method):
                        status, body = await self.asgi_request(path, payload={**base, campo: valor}, method=method)
                        self.assertEqual(status, 422)
                        self.assertTrue(body["error"]["details"])
                        if valor >= 101:
                            self.assertIn("no máximo 100", body["error"]["details"][0]["message"])
        status, body = await self.asgi_request("/onibus/QAQ3J45")
        self.assertEqual(status, 200)
        self.assertEqual(body["assentos"], 40)
        self.assertEqual(body["capacidade_em_pe"], 10)

    async def test_limite_100_em_cada_campo_post_patch(self):
        status, body = await self.asgi_request("/onibus", payload={"placa": "CEM1234", "assentos": 100, "capacidade_em_pe": 100}, method="POST")
        self.assertEqual(status, 201)
        status, body = await self.asgi_request("/onibus/CEM1234", payload={"assentos": 100, "capacidade_em_pe": 100}, method="PATCH")
        self.assertEqual(status, 200)
        self.assertEqual(body["data"]["assentos"], 100)
        self.assertEqual(body["data"]["capacidade_em_pe"], 100)

    async def test_criar_onibus_api_201(self):
        payload = {
            "placa": "RIO-2A18",
            "assentos": 42,
            "capacidade_em_pe": 28,
            "apelido": "Ônibus Central",
        }
        status, body = await self.asgi_request("/onibus", payload=payload, method="POST")
        self.assertEqual(status, 201)
        self.assertTrue(body["success"])
        self.assertEqual(body["message"], "Operação realizada com sucesso")
        data = body["data"]
        self.assertEqual(data["placa"], "RIO-2A18")
        self.assertEqual(data["assentos"], 42)
        self.assertEqual(data["capacidade_em_pe"], 28)

    async def test_criar_onibus_duplicado_retorna_409(self):
        payload = {"placa": "DUP-1234", "assentos": 40, "capacidade_em_pe": 20}
        await self.asgi_request("/onibus", payload=payload, method="POST")

        status, body = await self.asgi_request("/onibus", payload=payload, method="POST")
        self.assertEqual(status, 409)
        self.assertEqual(body["error"]["message"], "Este veículo já está registrado.")

    async def test_listagem_com_e_sem_incluir_inativos(self):
        # 1 ativo e 1 inativo
        await self.asgi_request("/onibus", payload={"placa": "ATV-0001", "assentos": 40, "capacidade_em_pe": 20}, method="POST")
        await self.asgi_request("/onibus", payload={"placa": "INA-0002", "assentos": 30, "capacidade_em_pe": 10}, method="POST")
        await self.asgi_request("/onibus/INA-0002/inativar", method="PATCH")

        # Sem filtro (admin vê todos por padrão): 2 registros
        status, body_todos = await self.asgi_request("/onibus", method="GET")
        self.assertEqual(status, 200)
        self.assertEqual(len(body_todos), 2)

        # Com filtro ativo=true: 1 registro
        status, body_ativos = await self.asgi_request("/onibus", method="GET", query_string=b"ativo=true")
        self.assertEqual(status, 200)
        self.assertEqual(len(body_ativos), 1)
        self.assertEqual(body_ativos[0]["placa"], "ATV-0001")

        # Com filtro ativo=false: 1 registro
        status, body_inativos = await self.asgi_request("/onibus", method="GET", query_string=b"ativo=false")
        self.assertEqual(status, 200)
        self.assertEqual(len(body_inativos), 1)
        self.assertEqual(body_inativos[0]["placa"], "INA-0002")

        # Usuário não-admin (público) vê apenas ativos
        self.app.dependency_overrides[get_optional_current_user] = lambda: None
        status_pub, body_pub = await self.asgi_request("/onibus", method="GET")
        self.assertEqual(status_pub, 200)
        self.assertEqual(len(body_pub), 1)
        self.assertEqual(body_pub[0]["placa"], "ATV-0001")

        # Restaura override para os demais testes
        self.app.dependency_overrides[get_optional_current_user] = lambda: self.fake_admin

    async def test_inativar_e_reativar_api(self):
        await self.asgi_request("/onibus", payload={"placa": "FLT-9999", "assentos": 50, "capacidade_em_pe": 20}, method="POST")

        # Inativar
        status_inativar, body_inativar = await self.asgi_request("/onibus/FLT-9999/inativar", method="PATCH")
        self.assertEqual(status_inativar, 200)
        self.assertEqual(body_inativar["message"], "Operação realizada com sucesso")
        self.assertFalse(body_inativar["data"]["ativo"])

        # Reativar via /reativar
        status_reativar, body_reativar = await self.asgi_request("/onibus/FLT-9999/reativar", method="PATCH")
        self.assertEqual(status_reativar, 200)
        self.assertEqual(body_reativar["message"], "Operação realizada com sucesso")
        self.assertTrue(body_reativar["data"]["ativo"])

    async def test_escritas_gravam_o_administrador_logado_na_auditoria(self):
        placa = "AUD-1A11"
        status, _ = await self.asgi_request("/onibus", payload={"placa": placa, "assentos": 30, "capacidade_em_pe": 10}, method="POST")
        self.assertEqual(status, 201)
        status, _ = await self.asgi_request(f"/onibus/{placa}", payload={"assentos": 40}, method="PATCH")
        self.assertEqual(status, 200)
        files = {"foto": ("foto.png", b"fake-png-content", "image/png")}
        status, _ = await self.asgi_multipart_request(f"/onibus/{placa}/foto", fields={}, files=files, method="POST")
        self.assertEqual(status, 200)
        status, _ = await self.asgi_request(f"/onibus/{placa}", payload={"ativo": False}, method="PATCH")
        self.assertEqual(status, 200)
        status, _ = await self.asgi_request(f"/onibus/{placa}", payload={"ativo": True}, method="PATCH")
        self.assertEqual(status, 200)
        status, _ = await self.asgi_request(f"/onibus/{placa}/foto", method="DELETE")
        self.assertEqual(status, 200)

        logs = (
            self.session.query(LogAuditoriaORM)
            .filter_by(entidade="onibus")
            .order_by(LogAuditoriaORM.id)
            .all()
        )
        self.assertEqual(
            [log.acao for log in logs],
            ["CRIAR", "EDITAR", "EDITAR", "INATIVAR", "ATIVAR", "EDITAR"],
        )
        self.assertEqual({log.usuario_id for log in logs}, {self.fake_admin["current_user_id"]})

    async def test_validacao_de_frota_devolve_motivo_em_portugues(self):
        base = {"placa": "VAL-1A11", "assentos": 30, "capacidade_em_pe": 10}
        casos = [
            ({**base, "assentos": -1}, "assentos", "A quantidade de assentos deve ser maior que zero."),
            ({**base, "capacidade_em_pe": -1}, "capacidade_em_pe", "A capacidade em pé não pode ser negativa."),
            ({k: v for k, v in base.items() if k != "placa"}, "placa", "A placa do veículo é obrigatória."),
            ({k: v for k, v in base.items() if k != "assentos"}, "assentos", "A quantidade de assentos é obrigatória."),
        ]
        for payload, campo, mensagem in casos:
            with self.subTest(campo=campo, mensagem=mensagem):
                status, body = await self.asgi_request("/onibus", payload=payload, method="POST")
                self.assertEqual(status, 422)
                self.assertEqual(body["error"]["details"], [{"field": campo, "message": mensagem}])
        self.assertEqual(self.session.query(OnibusORM).count(), 0)

    async def test_bloqueio_403_para_nao_admin(self):
        user_aluno = {
            "sub": "2",
            "current_user_id": 2,
            "role": CargoEnum.ALUNO.value,
            "current_roles": [CargoEnum.ALUNO.value],
        }
        self.app.dependency_overrides[get_current_user] = lambda: user_aluno
        self.app.dependency_overrides[get_optional_current_user] = lambda: user_aluno
        from src.shared.auth.dependencies import require_roles
        self.app.dependency_overrides[admin_required] = require_roles(CargoEnum.ADMINISTRADOR.value)

        # POST /onibus
        status_post, _ = await self.asgi_request("/onibus", payload={"placa": "BLO-0001", "assentos": 40, "capacidade_em_pe": 10}, method="POST")
        self.assertEqual(status_post, 403)

    async def test_criar_onibus_com_upload_foto_multipart_swagger(self):
        fields = {
            "placa": "FOT-1111",
            "assentos": "45",
            "capacidade_em_pe": "15",
            "apelido": "Ônibus Fotográfico",
        }
        files = {
            "foto": ("onibus.jpg", b"fake-jpg-binary-content-1234", "image/jpeg")
        }
        status, body = await self.asgi_multipart_request("/onibus", fields=fields, files=files, method="POST")
        self.assertEqual(status, 201)
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["placa"], "FOT-1111")
        self.assertIsNotNone(body["data"]["id_foto_onibus"])

    async def test_upload_foto_onibus_endpoint_dedicado(self):
        # Cria ônibus
        await self.asgi_request("/onibus", payload={"placa": "UPL-2222", "assentos": 40, "capacidade_em_pe": 10}, method="POST")

        # Envia foto no endpoint dedicado /onibus/{placa}/foto
        files = {
            "foto": ("foto_lateral.png", b"fake-png-content-5678", "image/png")
        }
        status, body = await self.asgi_multipart_request("/onibus/UPL-2222/foto", fields={}, files=files, method="POST")
        self.assertEqual(status, 200)
        self.assertTrue(body["success"])
        self.assertEqual(body["message"], "Foto do ônibus enviada com sucesso")
        self.assertIsNotNone(body["data"]["id_foto_onibus"])

    async def test_atualizar_onibus_com_upload_foto_multipart(self):
        # Cria ônibus
        await self.asgi_request("/onibus", payload={"placa": "ATU-3333", "assentos": 40, "capacidade_em_pe": 10}, method="POST")

        # Atualiza com multipart e nova foto
        fields = {"assentos": "48"}
        files = {
            "foto": ("nova_foto.webp", b"fake-webp-content-9999", "image/webp")
        }
        status, body = await self.asgi_multipart_request("/onibus/ATU-3333", fields=fields, files=files, method="PATCH")
        self.assertEqual(status, 200)
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["assentos"], 48)
        self.assertIsNotNone(body["data"]["id_foto_onibus"])

    async def test_remover_foto_onibus(self):
        # Cria com foto
        fields = {"placa": "DEL-4444", "assentos": "40", "capacidade_em_pe": "10"}
        files = {"foto": ("onibus.png", b"conteudo", "image/png")}
        _, body_criado = await self.asgi_multipart_request("/onibus", fields=fields, files=files, method="POST")
        self.assertIsNotNone(body_criado["data"]["id_foto_onibus"])

        # Remove foto
        status_del, body_del = await self.asgi_request("/onibus/DEL-4444/foto", method="DELETE")
        self.assertEqual(status_del, 200)
        self.assertTrue(body_del["success"])
        self.assertIsNone(body_del["data"]["id_foto_onibus"])


if __name__ == "__main__":
    unittest.main()
