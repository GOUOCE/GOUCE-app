import json
import unittest
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.modulos.arquivos.model.entities.arquivo import ArquivoORM
from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
from src.modulos.usuarios.infrastructure.repositories.representante_repository import (
    RepresentanteRepository,
)
from src.modulos.usuarios.interface.http.representante_routes import (
    get_session,
    router as representante_router,
)
from src.modulos.usuarios.model.entities.aluno import AlunoORM
from src.modulos.usuarios.model.entities.representante import RepresentanteORM
from src.modulos.usuarios.model.entities.tipo import TipoORM
from src.modulos.usuarios.model.entities.usuario import UsuarioORM
from src.modulos.usuarios.model.entities.usuario_tipo import UsuarioTipoORM
from src.shared.auth.dependencies import get_current_user
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.enums.status_cadastro_enum import StatusCadastroEnum
from src.shared.infrastructure.audit_model import LogAuditoriaORM
from src.shared.infrastructure.db import Base
from src.shared.security.argon2_hasher import Argon2PasswordHasher
from src.shared.security.lgpd_encryption import hash_email


class GerenciamentoRepresentantesTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        self.tables = [
            ArquivoORM.__table__,
            UsuarioORM.__table__,
            AlunoORM.__table__,
            RepresentanteORM.__table__,
            FaculdadeORM.__table__,
            BairroORM.__table__,
            TipoORM.__table__,
            UsuarioTipoORM.__table__,
            LogAuditoriaORM.__table__,
        ]
        Base.metadata.create_all(self.engine, tables=self.tables)
        self.Session = sessionmaker(bind=self.engine)
        self.session = self.Session()

        # Seed tipos básicos
        self.tipo_admin = TipoORM(tipo_usuario=CargoEnum.ADMINISTRADOR.value)
        self.tipo_aluno = TipoORM(tipo_usuario=CargoEnum.ALUNO.value)
        self.tipo_representante = TipoORM(tipo_usuario=CargoEnum.REPRESENTANTE.value)
        self.session.add_all([self.tipo_admin, self.tipo_aluno, self.tipo_representante])

        # Seed arquivo mock para FKs de aluno
        self.arquivo_comprovante = ArquivoORM(
            id="arq-comp-1",
            nome="comprovante.pdf",
            url="http://minio/comprovante.pdf",
            tamanho_bytes=1024,
            content_type="application/pdf",
        )
        self.session.add(self.arquivo_comprovante)

        # Seed faculdades
        self.faculdade_ativa_1 = FaculdadeORM(
            nome_faculdade="UFC",
            campus_faculdade="Quixadá",
            ativo=True,
        )
        self.faculdade_ativa_2 = FaculdadeORM(
            nome_faculdade="IFCE",
            campus_faculdade="Quixadá",
            ativo=True,
        )
        self.faculdade_inativa = FaculdadeORM(
            nome_faculdade="UECE",
            campus_faculdade="Itaperi",
            ativo=False,
        )
        self.session.add_all([self.faculdade_ativa_1, self.faculdade_ativa_2, self.faculdade_inativa])

        # Seed admin executor
        hasher = Argon2PasswordHasher()
        self.admin_user = UsuarioORM(
            nome_completo="Admin Geral",
            email="admin@gouce.com",
            email_hash=hash_email("admin@gouce.com"),
            senha=hasher.hash("SenhaForte123!"),
            ativo=True,
        )
        self.session.add(self.admin_user)
        self.session.flush()

        self.session.add(UsuarioTipoORM(id_usuario=self.admin_user.id, id_tipo=self.tipo_admin.id))

        self.session.commit()

        # Configurar FastAPI
        self.app = FastAPI()
        self.app.include_router(representante_router)

        self.current_user_override = {
            "sub": str(self.admin_user.id),
            "current_user_id": self.admin_user.id,
            "role": CargoEnum.ADMINISTRADOR.value,
            "current_roles": [CargoEnum.ADMINISTRADOR.value],
        }

        self.app.dependency_overrides[get_session] = lambda: self.session
        self.app.dependency_overrides[get_current_user] = lambda: self.current_user_override

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

    def _criar_aluno(self, nome="Aluno Teste", email="aluno@teste.com", status_cadastro=StatusCadastroEnum.ATIVADO.value, usuario_ativo=True, faculdade=None):
        hasher = Argon2PasswordHasher()
        faculdade_aluno = faculdade or self.faculdade_ativa_1
        usuario = UsuarioORM(
            nome_completo=nome,
            email=email,
            email_hash=hash_email(email),
            senha=hasher.hash("SenhaForte123!"),
            ativo=usuario_ativo,
        )
        self.session.add(usuario)
        self.session.flush()

        self.session.add(UsuarioTipoORM(id_usuario=usuario.id, id_tipo=self.tipo_aluno.id))

        aluno = AlunoORM(
            aluno_id=usuario.id,
            status_cadastro=status_cadastro,
            faculdade_id=faculdade_aluno.id_faculdade,
            id_comprovante_matricula=self.arquivo_comprovante.id,
            id_comprovante_residencia=self.arquivo_comprovante.id,
            data_nascimento=20000101,
            identificacao_genero="Masculino",
            tem_filhos=False,
            curso="Engenharia de Software",
            semestre_atual=4,
            periodo_ingresso="2022.1",
            raca="Parda",
            transgenero="Não",
            termos_de_uso=True,
        )
        self.session.add(aluno)
        self.session.commit()
        return usuario, aluno

    async def test_promocao_valida_com_faculdade(self):
        usuario, aluno = self._criar_aluno()
        payload = {"aluno_id": usuario.id, "faculdade_id": self.faculdade_ativa_1.id_faculdade}

        status, body = await self.asgi_request("/representantes/promover", payload=payload, method="POST")
        self.assertEqual(status, 201)
        data = body["data"]

        self.assertEqual(data["id"], usuario.id)
        self.assertEqual(data["aluno_id"], usuario.id)
        self.assertEqual(data["nome"], "Aluno Teste")
        self.assertTrue(data["ativo"])
        self.assertEqual(data["faculdade_id"], self.faculdade_ativa_1.id_faculdade)
        self.assertEqual(data["faculdade"]["nome_faculdade"], "UFC")
        self.assertEqual(data["instituicao"], "UFC")
        self.assertEqual(data["campus"], "Quixadá")
        self.assertEqual(data["curso"], "Engenharia de Software")

        # Verifica persistência no banco
        rep = self.session.query(RepresentanteORM).filter_by(administrador_id=usuario.id).first()
        self.assertIsNotNone(rep)
        self.assertTrue(rep.is_representante_ativo)
        self.assertEqual(rep.id_faculdade_responsavel, self.faculdade_ativa_1.id_faculdade)

        # Permissão em usuario_tipo adicionada
        vinculo = self.session.query(UsuarioTipoORM).filter_by(id_usuario=usuario.id, id_tipo=self.tipo_representante.id).first()
        self.assertIsNotNone(vinculo)

    async def test_promocao_faculdade_inexistente(self):
        usuario, _ = self._criar_aluno()
        status, body = await self.asgi_request("/representantes/promover", payload={"aluno_id": usuario.id, "faculdade_id": 99999}, method="POST")
        self.assertEqual(status, 404)
        self.assertIn("Faculdade não encontrada", body["error"]["message"])

    async def test_promocao_faculdade_inativa(self):
        usuario, _ = self._criar_aluno()
        status, body = await self.asgi_request("/representantes/promover", payload={"aluno_id": usuario.id, "faculdade_id": self.faculdade_inativa.id_faculdade}, method="POST")
        self.assertEqual(status, 422)
        self.assertIn("Faculdade inativa", body["error"]["message"])

    async def test_promocao_aluno_inexistente(self):
        status, body = await self.asgi_request("/representantes/promover", payload={"aluno_id": 99999, "faculdade_id": self.faculdade_ativa_1.id_faculdade}, method="POST")
        self.assertEqual(status, 404)
        self.assertIn("Aluno não encontrado", body["error"]["message"])

    async def test_promocao_aluno_nao_aprovado(self):
        usuario, _ = self._criar_aluno(status_cadastro=StatusCadastroEnum.PENDENTE.value)
        status, body = await self.asgi_request("/representantes/promover", payload={"aluno_id": usuario.id, "faculdade_id": self.faculdade_ativa_1.id_faculdade}, method="POST")
        self.assertEqual(status, 422)
        self.assertIn("Aluno não aprovado ou inativo", body["error"]["message"])

    async def test_promocao_aluno_inativo(self):
        usuario, _ = self._criar_aluno(usuario_ativo=False)
        status, body = await self.asgi_request("/representantes/promover", payload={"aluno_id": usuario.id, "faculdade_id": self.faculdade_ativa_1.id_faculdade}, method="POST")
        self.assertEqual(status, 422)
        self.assertIn("Aluno não aprovado ou inativo", body["error"]["message"])

    async def test_promocao_aluno_com_validade_de_acesso_vencida(self):
        usuario, aluno = self._criar_aluno()
        aluno.validade_acesso = datetime.now(timezone.utc) - timedelta(days=30)
        self.session.commit()

        status, body = await self.asgi_request("/representantes/promover", payload={"aluno_id": usuario.id, "faculdade_id": self.faculdade_ativa_1.id_faculdade}, method="POST")

        self.assertEqual(status, 422)
        self.assertIn("validade de acesso expirada", body["error"]["message"])
        self.assertIsNone(self.session.query(RepresentanteORM).filter_by(administrador_id=usuario.id).first())
        self.assertIsNone(self.session.query(UsuarioTipoORM).filter_by(id_usuario=usuario.id, id_tipo=self.tipo_representante.id).first())
        self.assertIsNone(self.session.query(LogAuditoriaORM).filter_by(acao="PROMOVER").first())

    async def test_promocao_aluno_com_validade_de_acesso_em_dia(self):
        usuario, aluno = self._criar_aluno()
        aluno.validade_acesso = datetime.now(timezone.utc) + timedelta(days=180)
        self.session.commit()

        status, _ = await self.asgi_request("/representantes/promover", payload={"aluno_id": usuario.id, "faculdade_id": self.faculdade_ativa_1.id_faculdade}, method="POST")

        self.assertEqual(status, 201)

    async def test_promocao_duplicidade_ja_ativo(self):
        usuario, _ = self._criar_aluno()
        await self.asgi_request("/representantes/promover", payload={"aluno_id": usuario.id, "faculdade_id": self.faculdade_ativa_1.id_faculdade}, method="POST")

        # Tentativa de promover novamente aluno já ativo
        status, body = await self.asgi_request("/representantes/promover", payload={"aluno_id": usuario.id, "faculdade_id": self.faculdade_ativa_2.id_faculdade}, method="POST")
        self.assertEqual(status, 409)
        self.assertIn("já é um representante ativo", body["error"]["message"])

    async def test_revogacao_valida_e_repromocao(self):
        usuario, _ = self._criar_aluno()
        # 1. Promove
        await self.asgi_request("/representantes/promover", payload={"aluno_id": usuario.id, "faculdade_id": self.faculdade_ativa_1.id_faculdade}, method="POST")

        # 2. Revoga
        status_revogar, body_revogado = await self.asgi_request(f"/representantes/{usuario.id}/revogar", method="PATCH")
        self.assertEqual(status_revogar, 200)
        data_revogado = body_revogado["data"]
        self.assertFalse(data_revogado["ativo"])
        self.assertEqual(data_revogado["faculdade_id"], self.faculdade_ativa_1.id_faculdade)

        # Verifica banco: registro não é deletado, mas fica inativo
        rep = self.session.query(RepresentanteORM).filter_by(administrador_id=usuario.id).first()
        self.assertIsNotNone(rep)
        self.assertFalse(rep.is_representante_ativo)
        self.assertEqual(rep.id_faculdade_responsavel, self.faculdade_ativa_1.id_faculdade)

        # Permissão em usuario_tipo removida
        vinculo = self.session.query(UsuarioTipoORM).filter_by(id_usuario=usuario.id, id_tipo=self.tipo_representante.id).first()
        self.assertIsNone(vinculo)

        # Aluno continua ativo
        user_db = self.session.query(UsuarioORM).filter_by(id=usuario.id).first()
        self.assertTrue(user_db.ativo)

        # 3. Re-promover revogado em OUTRA faculdade
        status_repromover, body_repromovido = await self.asgi_request(
            "/representantes/promover",
            payload={"aluno_id": usuario.id, "faculdade_id": self.faculdade_ativa_2.id_faculdade},
            method="POST",
        )
        self.assertEqual(status_repromover, 201)
        data_repromovido = body_repromovido["data"]
        self.assertTrue(data_repromovido["ativo"])
        self.assertEqual(data_repromovido["faculdade_id"], self.faculdade_ativa_2.id_faculdade)
        self.assertEqual(data_repromovido["instituicao"], "IFCE")

    async def test_revogacao_invalida_nao_encontrado_e_ja_revogado(self):
        # Inexistente -> 404
        status_404, _ = await self.asgi_request("/representantes/99999/revogar", method="PATCH")
        self.assertEqual(status_404, 404)

        # Já revogado -> 409
        usuario, _ = self._criar_aluno()
        await self.asgi_request("/representantes/promover", payload={"aluno_id": usuario.id, "faculdade_id": self.faculdade_ativa_1.id_faculdade}, method="POST")
        await self.asgi_request(f"/representantes/{usuario.id}/revogar", method="PATCH")

        status_409, body_409 = await self.asgi_request(f"/representantes/{usuario.id}/revogar", method="PATCH")
        self.assertEqual(status_409, 409)
        self.assertIn("não é um representante ativo", body_409["error"]["message"])

    async def test_bloqueio_403_para_nao_admin(self):
        self.current_user_override = {
            "sub": "2",
            "current_user_id": 2,
            "role": CargoEnum.ALUNO.value,
            "current_roles": [CargoEnum.ALUNO.value],
        }

        # GET /representantes
        status_get, _ = await self.asgi_request("/representantes", method="GET")
        self.assertEqual(status_get, 403)

        # POST /representantes/promover
        status_post, _ = await self.asgi_request("/representantes/promover", payload={"aluno_id": 1, "faculdade_id": 1}, method="POST")
        self.assertEqual(status_post, 403)

        # PATCH /representantes/1/revogar
        status_patch, _ = await self.asgi_request("/representantes/1/revogar", method="PATCH")
        self.assertEqual(status_patch, 403)

    async def test_auditoria_com_faculdade_id(self):
        usuario, _ = self._criar_aluno()
        await self.asgi_request("/representantes/promover", payload={"aluno_id": usuario.id, "faculdade_id": self.faculdade_ativa_1.id_faculdade}, method="POST")

        log_promover = self.session.query(LogAuditoriaORM).filter_by(
            entidade="representante",
            entidade_id=usuario.id,
            acao="PROMOVER",
        ).first()

        self.assertIsNotNone(log_promover)
        self.assertEqual(log_promover.usuario_id, self.admin_user.id)
        valor_novo = json.loads(log_promover.valor_novo)
        self.assertEqual(valor_novo["faculdade_id"], self.faculdade_ativa_1.id_faculdade)
        self.assertEqual(valor_novo["aluno_id"], usuario.id)

        # Agora revogar
        await self.asgi_request(f"/representantes/{usuario.id}/revogar", method="PATCH")
        log_revogar = self.session.query(LogAuditoriaORM).filter_by(
            entidade="representante",
            entidade_id=usuario.id,
            acao="REVOGAR",
        ).first()

        self.assertIsNotNone(log_revogar)
        self.assertEqual(log_revogar.usuario_id, self.admin_user.id)
        valor_revogado = json.loads(log_revogar.valor_novo)
        self.assertEqual(valor_revogado["faculdade_id"], self.faculdade_ativa_1.id_faculdade)
        self.assertFalse(valor_revogado["ativo"])

    async def test_listagem_e_filtros_por_faculdade_e_ativo(self):
        u1, _ = self._criar_aluno(nome="Aluno UFC", email="ufc@teste.com", faculdade=self.faculdade_ativa_1)
        u2, _ = self._criar_aluno(nome="Aluno IFCE", email="ifce@teste.com", faculdade=self.faculdade_ativa_2)

        await self.asgi_request("/representantes/promover", payload={"aluno_id": u1.id, "faculdade_id": self.faculdade_ativa_1.id_faculdade}, method="POST")
        await self.asgi_request("/representantes/promover", payload={"aluno_id": u2.id, "faculdade_id": self.faculdade_ativa_2.id_faculdade}, method="POST")

        # Revogar u1
        await self.asgi_request(f"/representantes/{u1.id}/revogar", method="PATCH")

        # 1. Listar sem filtro (retorna todos)
        status_todos, body_todos = await self.asgi_request("/representantes", method="GET")
        self.assertEqual(status_todos, 200)
        self.assertEqual(len(body_todos), 2)

        # 2. Filtrar por faculdade UFC
        status_ufc, body_ufc = await self.asgi_request("/representantes", method="GET", query_string=f"faculdade_id={self.faculdade_ativa_1.id_faculdade}".encode())
        self.assertEqual(status_ufc, 200)
        self.assertEqual(len(body_ufc), 1)
        self.assertEqual(body_ufc[0]["id"], u1.id)

        # 3. Filtrar por ativo=true
        status_ativos, body_ativos = await self.asgi_request("/representantes", method="GET", query_string=b"ativo=true")
        self.assertEqual(status_ativos, 200)
        self.assertEqual(len(body_ativos), 1)
        self.assertEqual(body_ativos[0]["id"], u2.id)

        # 4. Filtrar por ativo=false
        status_inativos, body_inativos = await self.asgi_request("/representantes", method="GET", query_string=b"ativo=false")
        self.assertEqual(status_inativos, 200)
        self.assertEqual(len(body_inativos), 1)
        self.assertEqual(body_inativos[0]["id"], u1.id)

    async def test_perfil_representante_nao_inicializado_retorna_500(self):
        # Remove o tipo representante do banco
        self.session.delete(self.tipo_representante)
        self.session.commit()

        usuario, _ = self._criar_aluno()
        status, body = await self.asgi_request("/representantes/promover", payload={"aluno_id": usuario.id, "faculdade_id": self.faculdade_ativa_1.id_faculdade}, method="POST")
        self.assertEqual(status, 500)
        self.assertIn("não está inicializado", body["error"]["message"])


if __name__ == "__main__":
    unittest.main()
