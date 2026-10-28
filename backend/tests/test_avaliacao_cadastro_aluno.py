import json
import os
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/gouce_test",
)

from fastapi import FastAPI

from src.modulos.usuarios.application.dtos.usuario_dto import AtualizarStatusAlunoDTO
from src.modulos.usuarios.application.use_cases.aprovar_aluno_use_case import (
    AprovarAlunoUseCase,
    AvaliacaoCadastroError,
)
from src.modulos.usuarios.infrastructure.repositories.usuario_repository import (
    SQLAlchemyUsuarioRepository,
)
from src.modulos.usuarios.interface.http.usuario_routes import get_repository, router
from src.shared.auth.dependencies import get_current_user

ROTAS_USUARIO = "src.modulos.usuarios.interface.http.usuario_routes"
ADMIN = {
    "sub": "1",
    "current_user_id": 1,
    "role": "administrador",
    "current_roles": ["administrador"],
}
DOCUMENTO_VALIDO = {"tipo": "comprovante_matricula", "motivo": "Documento ilegível."}


class FakeRepositorio:
    """Repositório em memória: guarda o aluno e registra o que a avaliação tentou gravar."""

    def __init__(self, status_cadastro="pendente"):
        self.aluno = SimpleNamespace(
            aluno_id=4,
            status_cadastro=status_cadastro,
            motivo_reprovacao=None,
            documentos_reenvio=None,
        )
        self.usuario = SimpleNamespace(id=4, email="aluno@example.com", nome_completo="Aluno Teste")
        self.chamadas = []

    normalizar_documentos_reenvio = staticmethod(SQLAlchemyUsuarioRepository.normalizar_documentos_reenvio)

    def buscar_aluno_por_id(self, aluno_id):
        return self.aluno if aluno_id == self.aluno.aluno_id else None

    def buscar_com_detalhes_por_id(self, aluno_id):
        return self.usuario, self.aluno

    def atualizar_status_aluno(self, **kwargs):
        self.chamadas.append(kwargs)
        self.aluno.status_cadastro = kwargs["novo_status"]
        self.aluno.motivo_reprovacao = kwargs.get("motivo_reprovacao")
        self.aluno.documentos_reenvio = kwargs.get("documentos_reenvio")
        return self.aluno


class AvaliacaoCadastroUseCaseTest(unittest.TestCase):
    def test_reprovar_sem_documento_valido_e_recusado_e_nada_e_gravado(self):
        # RN-012: o aluno rejeitado fica sem nada para reenviar se a lista de documentos esvazia.
        for documentos in (None, [], [{"tipo": "comprovante_matricula", "motivo": "   "}]):
            with self.subTest(documentos=documentos):
                repositorio = FakeRepositorio()

                with self.assertRaises(AvaliacaoCadastroError):
                    AprovarAlunoUseCase(repositorio).execute(
                        4,
                        "rejeitado",
                        motivo_reprovacao="Cadastro com dados inconsistentes.",
                        documentos_reenvio=documentos,
                    )

                self.assertEqual(repositorio.chamadas, [])
                self.assertEqual(repositorio.aluno.status_cadastro, "pendente")

    def test_reprovar_com_documento_grava_o_motivo_sem_espacos_nas_pontas(self):
        repositorio = FakeRepositorio()

        AprovarAlunoUseCase(repositorio).execute(
            4,
            "rejeitado",
            motivo_reprovacao="Cadastro com dados inconsistentes.",
            documentos_reenvio=[{"tipo": "comprovante_matricula", "motivo": "  Ilegível.  "}],
        )

        self.assertEqual(
            repositorio.chamadas[0]["documentos_reenvio"],
            [{"tipo": "comprovante_matricula", "motivo": "Ilegível."}],
        )


class AvaliacaoCadastroDTOTest(unittest.TestCase):
    def test_motivo_do_documento_vazio_ou_so_com_espacos_e_recusado(self):
        for motivo in ("", "   ", "\t\n"):
            with self.subTest(motivo=repr(motivo)):
                with self.assertRaises(ValueError) as contexto:
                    AtualizarStatusAlunoDTO(
                        status_cadastro="rejeitado",
                        motivo_reprovacao="Cadastro com dados inconsistentes.",
                        documentos_reenvio=[{"tipo": "comprovante_matricula", "motivo": motivo}],
                    )

                self.assertIn("documentos_reenvio", str(contexto.exception))
                self.assertIn("motivo", str(contexto.exception))


class AvaliacaoCadastroRotasTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.repositorio = FakeRepositorio()
        self.app = FastAPI()
        self.app.include_router(router)
        self.app.dependency_overrides[get_repository] = lambda: self.repositorio
        self.app.dependency_overrides[get_current_user] = lambda: ADMIN

    async def patch(self, caminho, corpo=None):
        bruto = json.dumps(corpo).encode("utf-8") if corpo is not None else b""
        mensagens = []
        recebido = False

        async def receive():
            nonlocal recebido
            if not recebido:
                recebido = True
                return {"type": "http.request", "body": bruto, "more_body": False}
            return {"type": "http.disconnect"}

        async def send(mensagem):
            mensagens.append(mensagem)

        escopo = {
            "type": "http",
            "asgi": {"version": "3.0", "spec_version": "2.3"},
            "http_version": "1.1",
            "method": "PATCH",
            "scheme": "http",
            "path": caminho,
            "raw_path": caminho.encode("utf-8"),
            "query_string": b"",
            "headers": [
                (b"content-type", b"application/json"),
                (b"content-length", str(len(bruto)).encode("ascii")),
            ],
            "client": ("testclient", 50000),
            "server": ("testserver", 80),
            "root_path": "",
            "state": {},
        }

        await self.app(escopo, receive, send)

        inicio = next(m for m in mensagens if m["type"] == "http.response.start")
        corpo_resposta = b"".join(m.get("body", b"") for m in mensagens if m["type"] == "http.response.body")
        return inicio["status"], json.loads(corpo_resposta)

    async def test_reprovar_com_motivo_do_documento_em_branco_devolve_422_e_nao_altera_o_aluno(self):
        with patch(f"{ROTAS_USUARIO}.get_email_service") as email:
            status, _ = await self.patch(
                "/usuarios/alunos/4/status",
                {
                    "status_cadastro": "rejeitado",
                    "motivo_reprovacao": "Cadastro com dados inconsistentes.",
                    "documentos_reenvio": [{"tipo": "comprovante_matricula", "motivo": "   "}],
                },
            )

        self.assertEqual(status, 422)
        self.assertEqual(self.repositorio.chamadas, [])
        self.assertEqual(self.repositorio.aluno.status_cadastro, "pendente")
        email.assert_not_called()

    async def test_reprovar_com_documento_valido_grava_e_avisa_o_aluno(self):
        with patch(f"{ROTAS_USUARIO}.get_email_service", return_value=MagicMock()) as email:
            status, corpo = await self.patch(
                "/usuarios/alunos/4/status",
                {
                    "status_cadastro": "rejeitado",
                    "motivo_reprovacao": "Cadastro com dados inconsistentes.",
                    "documentos_reenvio": [DOCUMENTO_VALIDO],
                },
            )

        self.assertEqual(status, 200)
        self.assertEqual(corpo["status_cadastro"], "rejeitado")
        self.assertEqual(corpo["documentos_reenvio"], [DOCUMENTO_VALIDO])
        email.return_value.enviar_documentos_rejeitados.assert_called_once()


if __name__ == "__main__":
    unittest.main()
