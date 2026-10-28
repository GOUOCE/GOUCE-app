import os

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test")
os.environ.setdefault("SECRET_KEY_JWT", "test-secret")
os.environ.setdefault("ALGORITHM", "HS256")

import asyncio
import json
import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import FastAPI, HTTPException

from src.modulos.auth.application.dtos.login_dto import LoginDTO
from src.modulos.auth.application.use_cases.login_use_case import LoginUseCase
from src.modulos.auth.application.use_cases.refresh_token_use_case import RefreshTokenUseCase
from src.modulos.usuarios.application.dtos.usuario_dto import PerfilAlunoResponseDTO
from src.modulos.usuarios.infrastructure.repositories.usuario_repository import (
    SQLAlchemyUsuarioRepository,
)
from src.modulos.usuarios.interface.http import usuario_routes
from src.shared.auth import dependencies
from src.shared.auth.dependencies import (
    get_current_user,
    verify_active_student,
    verify_student_profile_access,
    verify_student_renewal_access,
    verify_student_standard_access,
)
from src.shared.enums.cargo_enum import CargoEnum

DOCUMENTOS_ANTIGOS = [
    {"tipo": "comprovante_matricula", "motivo": "Comprovante de matrícula desatualizado."},
]


class RepositorioAluno(SQLAlchemyUsuarioRepository):
    """Repositório real da sessão, com o aluno em memória no lugar do banco."""

    def __init__(self, status_cadastro):
        self.usuario = SimpleNamespace(
            id=1,
            senha="hash",
            nome_completo="Aluna Qa",
            email="aluna@example.com",
            telefone=None,
            limite_de_bloqueio=None,
        )
        self.aluno = SimpleNamespace(
            status_cadastro=status_cadastro,
            validade_acesso=None,
            motivo_reprovacao=None,
            documentos_reenvio=DOCUMENTOS_ANTIGOS,
            curso="Direito",
            faculdade_id=1,
            periodo_ingresso="2024.1",
            turno_curso="Matutino",
            id_foto_aluno=None,
        )

    def buscar_por_email(self, email):
        return self.usuario

    def buscar_com_detalhes_por_id(self, user_id):
        if user_id != self.usuario.id:
            return None, None
        return self.usuario, self.aluno

    def buscar_aluno_por_id(self, user_id):
        return self.aluno

    def _buscar_flag_perfil_opcional(self, *args, **kwargs):
        return None


class FakeTokenService:
    def __init__(self, payload=None):
        self.payload = payload or {}

    def decode(self, token):
        return dict(self.payload)

    def refresh_access_token(self, token):
        return "novo-access-token"

    def generate(self, user, cargo, lembrar_me=False):
        return f"access-{cargo}"

    def generate_refresh_token(self, user, cargo, lembrar_me=False):
        return f"refresh-{cargo}"


class FakeHasher:
    def verify(self, senha, senha_hash):
        return True


def usuario_atual(status):
    return {
        "current_role": CargoEnum.ALUNO.value,
        "current_roles": [CargoEnum.ALUNO.value],
        "current_status": status,
        "access_expired": False,
    }


async def asgi_request(app, method, path, body=None, headers=None):
    request_body = b"" if body is None else json.dumps(body).encode("utf-8")
    request_headers = [(b"content-type", b"application/json")]
    request_headers.extend(
        (key.lower().encode("latin-1"), value.encode("latin-1"))
        for key, value in (headers or {}).items()
    )
    resposta = {"status": None, "corpo": bytearray()}
    enviado = False

    async def receive():
        nonlocal enviado
        if enviado:
            return {"type": "http.disconnect"}
        enviado = True
        return {"type": "http.request", "body": request_body, "more_body": False}

    async def send(message):
        if message["type"] == "http.response.start":
            resposta["status"] = message["status"]
        elif message["type"] == "http.response.body":
            resposta["corpo"].extend(message.get("body", b""))

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

    return resposta["status"], json.loads(bytes(resposta["corpo"]) or b"null")


class AlunoPendenteSessaoTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.repositorio = RepositorioAluno("pendente")

    def test_contexto_do_aluno_pendente_tem_sessao_e_status(self):
        contexto = self.repositorio.buscar_contexto_autenticacao_por_id(1)

        self.assertTrue(contexto["ativo"])
        self.assertEqual(contexto["status"], "pendente")
        self.assertEqual(contexto["role"], CargoEnum.ALUNO.value)
        self.assertFalse(contexto["acesso_expirado"])

    def test_login_do_aluno_pendente_devolve_tokens_e_o_status(self):
        resposta = LoginUseCase(self.repositorio, FakeHasher(), FakeTokenService()).execute(
            LoginDTO(email="aluna@example.com", senha="senha")
        )

        self.assertEqual(resposta.usuario["status_cadastro"], "pendente")
        self.assertEqual(resposta.usuario["role"], CargoEnum.ALUNO.value)
        self.assertTrue(resposta.token_acesso)

    def test_refresh_do_aluno_pendente_mantem_a_sessao(self):
        servico = FakeTokenService({"sub": "1", "role": CargoEnum.ALUNO.value, "type": "refresh"})

        resposta = RefreshTokenUseCase(servico).execute("refresh-token", self.repositorio)

        self.assertEqual(resposta.token_acesso, "novo-access-token")

    async def test_token_do_aluno_pendente_continua_valido_depois_do_reenvio(self):
        # O aluno rejeitado reenvia e vira pendente: o mesmo token precisa seguir valendo.
        rejeitado = RepositorioAluno("rejeitado")
        servico = FakeTokenService({"sub": "1", "role": CargoEnum.ALUNO.value, "type": "access"})

        antes = await get_current_user("access", servico, rejeitado)
        rejeitado.aluno.status_cadastro = "pendente"
        depois = await get_current_user("access", servico, rejeitado)

        self.assertEqual(antes["current_status"], "rejeitado")
        self.assertEqual(depois["current_status"], "pendente")

    async def test_dependencias_de_aluno_barram_o_pendente_exceto_perfil_e_status(self):
        pendente = usuario_atual("pendente")

        self.assertIs(await verify_student_profile_access(pendente), pendente)
        for dependencia in (
            verify_active_student,  # base do agendamento (RN-011)
            verify_student_standard_access,
            verify_student_renewal_access,
        ):
            with self.subTest(dependencia=dependencia.__name__):
                with self.assertRaises(HTTPException) as erro:
                    await dependencia(pendente)
                self.assertEqual(erro.exception.status_code, 403)

    async def test_dependencias_de_aluno_nao_mudam_para_os_outros_status(self):
        ativado = usuario_atual("ativado")
        for dependencia in (
            verify_active_student,
            verify_student_standard_access,
            verify_student_renewal_access,
            verify_student_profile_access,
        ):
            with self.subTest(dependencia=dependencia.__name__):
                self.assertIs(await dependencia(ativado), ativado)

        rejeitado = usuario_atual("rejeitado")
        with self.assertRaises(HTTPException) as erro:
            await verify_student_profile_access(rejeitado)
        self.assertEqual(erro.exception.status_code, 403)


class AlunoPendenteHttpTest(unittest.TestCase):
    def setUp(self):
        self.status = "pendente"
        self.repositorio = RepositorioAluno(self.status)
        self.app = FastAPI()
        self.app.include_router(usuario_routes.router)
        self.app.dependency_overrides[usuario_routes.get_repository] = lambda: self.repositorio
        self.app.dependency_overrides[dependencies.get_usuario_repository] = lambda: self.repositorio
        self.app.dependency_overrides[dependencies.get_jwt_service] = lambda: FakeTokenService(
            {"sub": "1", "role": CargoEnum.ALUNO.value, "type": "access"}
        )

    def tearDown(self):
        self.app.dependency_overrides.clear()

    def chamar(self, metodo, caminho, corpo=None):
        return asyncio.run(
            asgi_request(self.app, metodo, caminho, corpo, {"Authorization": "Bearer access-token"})
        )

    def test_pendente_consulta_o_proprio_status_pelo_perfil(self):
        class PerfilFalso:
            def __init__(self, *args, **kwargs):
                pass

            def execute(self, user_id):
                return PerfilAlunoResponseDTO(
                    id=user_id,
                    nome="Aluna Qa",
                    email="aluna@example.com",
                    data_criacao=datetime.now(timezone.utc),
                    status_cadastro="pendente",
                )

        with patch.object(usuario_routes, "ObterPerfilAlunoUseCase", PerfilFalso):
            status, corpo = self.chamar("GET", "/usuarios/me")

        self.assertEqual(status, 200, corpo)
        self.assertEqual(corpo["status_cadastro"], "pendente")

    def test_pendente_nao_ve_os_motivos_antigos_como_pendencia(self):
        status, corpo = self.chamar("GET", "/usuarios/reenvio_documento")

        self.assertEqual(status, 200)
        self.assertEqual(corpo, {"documentos": []})

    def test_rejeitado_continua_vendo_os_documentos_para_reenviar(self):
        self.repositorio.aluno.status_cadastro = "rejeitado"

        status, corpo = self.chamar("GET", "/usuarios/reenvio_documento")

        self.assertEqual(status, 200)
        self.assertEqual(corpo, {"documentos": DOCUMENTOS_ANTIGOS})

    def test_pendente_nao_reenvia_documentos(self):
        status, corpo = self.chamar("PUT", "/usuarios/reenvio_documento")

        self.assertEqual(status, 403)
        self.assertEqual(
            corpo["error"]["message"],
            "O reenvio de documentos está disponível somente para cadastros rejeitados.",
        )

    def test_pendente_nao_edita_perfil_nem_email(self):
        for metodo, caminho, corpo in (
            ("PATCH", "/usuarios/me", {"telefone": "85999990000"}),
            ("PATCH", "/usuarios/me/email", {"novo_email": "novo@example.com", "senha": "Senha@123"}),
        ):
            with self.subTest(caminho=caminho):
                status, _ = self.chamar(metodo, caminho, corpo)
                self.assertEqual(status, 403)

    def test_pendente_nao_acessa_rota_de_administrador(self):
        status, _ = self.chamar("GET", "/usuarios/")

        self.assertEqual(status, 403)


if __name__ == "__main__":
    unittest.main()
