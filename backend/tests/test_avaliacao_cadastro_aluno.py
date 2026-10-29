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
    CadastroForaDaFilaError,
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


    def test_avaliar_quem_nao_esta_na_fila_e_recusado_e_nada_e_gravado(self):
        # HU-027 (AC-02, AC-04): aprovar de novo renovava a validade e reprovar um ativo tirava o acesso dele.
        for status_atual in ("ativado", "rejeitado", "inativado"):
            for novo_status in ("ativado", "rejeitado"):
                with self.subTest(status_atual=status_atual, novo_status=novo_status):
                    repositorio = FakeRepositorio(status_cadastro=status_atual)

                    with self.assertRaises(CadastroForaDaFilaError) as contexto:
                        AprovarAlunoUseCase(repositorio).execute(
                            4,
                            novo_status,
                            motivo_reprovacao="Cadastro com dados inconsistentes." if novo_status == "rejeitado" else None,
                            documentos_reenvio=[DOCUMENTO_VALIDO] if novo_status == "rejeitado" else None,
                        )

                    self.assertIn("fila de solicitações", str(contexto.exception))
                    self.assertEqual(repositorio.chamadas, [])
                    self.assertEqual(repositorio.aluno.status_cadastro, status_atual)

    def test_mensagem_diz_a_situacao_do_aluno(self):
        casos = {
            "ativado": "já está com o cadastro aprovado",
            "rejeitado": "aguardando o reenvio dos documentos",
            "inativado": "acesso inativado",
        }
        for status_atual, trecho in casos.items():
            with self.subTest(status_atual=status_atual):
                with self.assertRaises(CadastroForaDaFilaError) as contexto:
                    AprovarAlunoUseCase(FakeRepositorio(status_cadastro=status_atual)).execute(4, "ativado")

                self.assertIn(trecho, str(contexto.exception))

    def test_quem_esta_na_fila_pode_ser_aprovado_ou_reprovado(self):
        # A renovação da HU-028 chega como analise_renovacao e passa pela mesma avaliação.
        for status_atual in ("pendente", "analise_renovacao"):
            with self.subTest(status_atual=status_atual, novo_status="ativado"):
                repositorio = FakeRepositorio(status_cadastro=status_atual)
                AprovarAlunoUseCase(repositorio).execute(4, "ativado")
                self.assertEqual(repositorio.aluno.status_cadastro, "ativado")

            with self.subTest(status_atual=status_atual, novo_status="rejeitado"):
                repositorio = FakeRepositorio(status_cadastro=status_atual)
                AprovarAlunoUseCase(repositorio).execute(
                    4, "rejeitado", motivo_reprovacao="Dados inconsistentes.", documentos_reenvio=[DOCUMENTO_VALIDO]
                )
                self.assertEqual(repositorio.aluno.status_cadastro, "rejeitado")


class FakeSessao:
    def __init__(self):
        self.registros = []
        self.commits = 0

    def add(self, registro):
        self.registros.append(registro)

    def commit(self):
        self.commits += 1

    def refresh(self, entidade):
        pass


class AuditoriaDaAvaliacaoTest(unittest.TestCase):
    def avaliar(self, status_atual, novo_status, usuario_responsavel_id=1, **extras):
        aluno = SimpleNamespace(
            aluno_id=4,
            status_cadastro=status_atual,
            motivo_reprovacao=None,
            documentos_reenvio=None,
            validade_acesso=None,
            data_hora_envio_analise=None,
            data_hora_ultima_renovacao_matricula=None,
        )
        sessao = FakeSessao()
        repositorio = SQLAlchemyUsuarioRepository(sessao)
        repositorio.buscar_aluno_por_id = lambda aluno_id: aluno

        repositorio.atualizar_status_aluno(
            aluno_id=4,
            novo_status=novo_status,
            usuario_responsavel_id=usuario_responsavel_id,
            **extras,
        )

        self.assertEqual(len(sessao.registros), 1)
        self.assertEqual(sessao.commits, 1)
        return sessao.registros[0]

    def test_aprovacao_registra_o_administrador_e_o_status_antes_e_depois(self):
        # RNF-013: o log gravava o id do aluno como autor e o status novo também como anterior.
        registro = self.avaliar("pendente", "ativado", usuario_responsavel_id=1)

        self.assertEqual(registro.usuario_id, 1)
        self.assertEqual(registro.acao, "UPDATE_STATUS")
        self.assertEqual(registro.entidade, "aluno")
        self.assertEqual(registro.entidade_id, 4)
        self.assertEqual(registro.valor_anterior, "pendente")
        self.assertEqual(registro.valor_novo, "ativado")

    def test_reprovacao_registra_o_status_de_onde_o_aluno_saiu(self):
        registro = self.avaliar(
            "analise_renovacao",
            "rejeitado",
            usuario_responsavel_id=7,
            motivo_reprovacao="Dados inconsistentes.",
            documentos_reenvio=[DOCUMENTO_VALIDO],
        )

        self.assertEqual(registro.usuario_id, 7)
        self.assertEqual(registro.valor_anterior, "analise_renovacao")
        self.assertEqual(registro.valor_novo, "rejeitado")

    def test_sem_responsavel_o_autor_fica_vazio_em_vez_de_virar_o_aluno(self):
        registro = self.avaliar("pendente", "ativado", usuario_responsavel_id=None)

        self.assertIsNone(registro.usuario_id)


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

    async def patch(self, caminho, corpo=None, bruto=None):
        if bruto is None:
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

    async def test_aprovar_e_reprovar_passam_o_administrador_logado_para_a_auditoria(self):
        with patch(f"{ROTAS_USUARIO}.get_email_service", return_value=MagicMock()):
            await self.patch("/usuarios/alunos/4/aprovar")
            self.assertEqual(self.repositorio.chamadas[0]["usuario_responsavel_id"], 1)

            self.repositorio = FakeRepositorio()
            await self.patch(
                "/usuarios/alunos/4/status",
                {
                    "status_cadastro": "rejeitado",
                    "motivo_reprovacao": "Cadastro com dados inconsistentes.",
                    "documentos_reenvio": [DOCUMENTO_VALIDO],
                },
            )
            self.assertEqual(self.repositorio.chamadas[0]["usuario_responsavel_id"], 1)

    async def test_aprovar_aluno_fora_da_fila_devolve_409_sem_alterar_nem_enviar_e_mail(self):
        for status_atual in ("ativado", "rejeitado"):
            with self.subTest(status_atual=status_atual):
                self.repositorio = FakeRepositorio(status_cadastro=status_atual)
                with patch(f"{ROTAS_USUARIO}.get_email_service") as email:
                    status, corpo = await self.patch("/usuarios/alunos/4/aprovar")

                self.assertEqual(status, 409)
                self.assertIn("fila de solicitações", corpo["detail"])
                self.assertEqual(self.repositorio.chamadas, [])
                self.assertEqual(self.repositorio.aluno.status_cadastro, status_atual)
                email.assert_not_called()

    async def test_reprovar_aluno_ativo_devolve_409_e_mantem_o_acesso(self):
        self.repositorio = FakeRepositorio(status_cadastro="ativado")

        with patch(f"{ROTAS_USUARIO}.get_email_service") as email:
            status, corpo = await self.patch(
                "/usuarios/alunos/4/status",
                {
                    "status_cadastro": "rejeitado",
                    "motivo_reprovacao": "Cadastro com dados inconsistentes.",
                    "documentos_reenvio": [DOCUMENTO_VALIDO],
                },
            )

        self.assertEqual(status, 409)
        self.assertIn("já está com o cadastro aprovado", corpo["detail"])
        self.assertEqual(self.repositorio.aluno.status_cadastro, "ativado")
        email.assert_not_called()

    async def recusa(self, corpo, caminho="/usuarios/alunos/4/status", bruto=None):
        """Envia a requisição esperando 422 e devolve os detalhes por campo; o aluno não pode mudar."""
        with patch(f"{ROTAS_USUARIO}.get_email_service") as email:
            status, resposta = await self.patch(caminho, corpo, bruto=bruto)

        self.assertEqual(status, 422)
        self.assertEqual(resposta["success"], False)
        self.assertEqual(resposta["error"]["code"], "REQUEST_VALIDATION_ERROR")
        self.assertEqual(resposta["error"]["message"], "Requisição inválida")
        self.assertEqual(self.repositorio.chamadas, [])
        self.assertEqual(self.repositorio.aluno.status_cadastro, "pendente")
        email.assert_not_called()

        detalhes = {d["field"]: d["message"] for d in resposta["error"]["details"]}
        for mensagem in detalhes.values():
            # Nada de texto padrão do pydantic (inglês) nem do prefixo técnico.
            self.assertNotIn("Value error", mensagem)
            self.assertNotRegex(mensagem, r"\b(should|Input|String|valid)\b")
        return detalhes

    async def test_recusas_da_reprovacao_vem_em_portugues_no_formato_padrao(self):
        # Os quatro payloads da issue #317.
        motivo_vazio = await self.recusa({
            "status_cadastro": "rejeitado",
            "motivo_reprovacao": "Cadastro com dados inconsistentes.",
            "documentos_reenvio": [{"tipo": "comprovante_matricula", "motivo": ""}],
        })
        self.assertEqual(motivo_vazio, {"documentos_reenvio.0.motivo": "Informe o motivo do documento."})

        tipo_invalido = await self.recusa({
            "status_cadastro": "rejeitado",
            "motivo_reprovacao": "Cadastro com dados inconsistentes.",
            "documentos_reenvio": [{"tipo": "rg", "motivo": "Ilegível."}],
        })
        self.assertEqual(
            tipo_invalido,
            {
                "documentos_reenvio.0.tipo": (
                    "Tipo de documento inválido. Use comprovante_matricula, comprovante_residencia ou foto_perfil."
                )
            },
        )

        motivo_longo = await self.recusa({
            "status_cadastro": "rejeitado",
            "motivo_reprovacao": "x" * 256,
            "documentos_reenvio": [DOCUMENTO_VALIDO],
        })
        self.assertEqual(motivo_longo, {"motivo_reprovacao": "O motivo da reprovação deve ter no máximo 255 caracteres."})

        sem_motivo = await self.recusa({
            "status_cadastro": "rejeitado",
            "documentos_reenvio": [DOCUMENTO_VALIDO],
        })
        self.assertEqual(sem_motivo, {"motivo_reprovacao": "Informe o motivo da reprovação."})

    async def test_reprovar_sem_dados_indica_cada_campo_que_falta(self):
        detalhes = await self.recusa({"status_cadastro": "rejeitado"})

        self.assertEqual(
            detalhes,
            {
                "motivo_reprovacao": "Informe o motivo da reprovação.",
                "documentos_reenvio": "Informe ao menos um documento para o aluno reenviar, com o motivo.",
            },
        )

    async def test_motivo_so_com_espacos_conta_como_vazio(self):
        detalhes = await self.recusa({
            "status_cadastro": "rejeitado",
            "motivo_reprovacao": "   ",
            "documentos_reenvio": [{"tipo": "comprovante_matricula", "motivo": "   "}],
        })

        self.assertEqual(
            detalhes,
            {
                "motivo_reprovacao": "Informe o motivo da reprovação.",
                "documentos_reenvio.0.motivo": "Informe o motivo do documento.",
            },
        )

    async def test_dados_de_reprovacao_em_outro_status_indicam_o_campo(self):
        detalhes = await self.recusa({
            "status_cadastro": "ativado",
            "motivo_reprovacao": "Sem motivo para isto.",
            "documentos_reenvio": [DOCUMENTO_VALIDO],
        })

        self.assertEqual(
            detalhes,
            {
                "motivo_reprovacao": "O motivo da reprovação só pode ser informado ao reprovar o cadastro.",
                "documentos_reenvio": "Os documentos para reenvio só podem ser informados ao reprovar o cadastro.",
            },
        )

    async def test_status_invalido_lista_as_opcoes_em_portugues(self):
        detalhes = await self.recusa({"status_cadastro": "aprovadissimo"})

        self.assertEqual(
            detalhes,
            {
                "status_cadastro": (
                    "Status do cadastro inválido. Use ativado, pendente, inativado, analise_renovacao ou rejeitado."
                )
            },
        )

    async def test_campo_obrigatorio_do_documento_e_tipo_errado_em_portugues(self):
        detalhes = await self.recusa({
            "status_cadastro": "rejeitado",
            "motivo_reprovacao": "Dados inconsistentes.",
            "documentos_reenvio": [{"tipo": "comprovante_matricula"}],
        })
        self.assertEqual(detalhes, {"documentos_reenvio.0.motivo": "O motivo do documento é obrigatório."})

        detalhes = await self.recusa({
            "status_cadastro": "rejeitado",
            "motivo_reprovacao": "Dados inconsistentes.",
            "documentos_reenvio": "comprovante_matricula",
        })
        self.assertEqual(detalhes, {"documentos_reenvio": "Os documentos para reenvio devem ser enviados em uma lista."})

    async def test_id_do_aluno_nao_numerico_e_json_malformado_em_portugues(self):
        detalhes = await self.recusa({"status_cadastro": "ativado"}, caminho="/usuarios/alunos/abc/status")
        self.assertEqual(detalhes, {"aluno_id": "O ID do aluno deve ser um número inteiro."})

        detalhes = await self.recusa(None, bruto=b"{status_cadastro: ")
        self.assertEqual(detalhes, {None: "Corpo da requisição inválido. Envie um JSON válido."})

    async def test_aprovar_avisa_o_aluno_por_e_mail(self):
        # HU-027, AC-04: o aluno aprovado precisa saber que o acesso foi liberado.
        for caminho, corpo in (
            ("/usuarios/alunos/4/aprovar", None),
            ("/usuarios/alunos/4/status", {"status_cadastro": "ativado"}),
        ):
            with self.subTest(caminho=caminho):
                self.repositorio = FakeRepositorio()
                with patch(f"{ROTAS_USUARIO}.get_email_service", return_value=MagicMock()) as email:
                    status, resposta = await self.patch(caminho, corpo)

                self.assertEqual(status, 200)
                self.assertEqual(resposta["status_cadastro"], "ativado")
                email.return_value.enviar_aprovacao_aluno.assert_called_once_with(
                    email_destino="aluno@example.com",
                    nome_usuario="Aluno Teste",
                )
                email.return_value.enviar_documentos_rejeitados.assert_not_called()

    async def test_falha_no_envio_do_e_mail_mantem_a_aprovacao_e_fica_no_log(self):
        for caminho, corpo in (
            ("/usuarios/alunos/4/aprovar", None),
            ("/usuarios/alunos/4/status", {"status_cadastro": "ativado"}),
        ):
            with self.subTest(caminho=caminho):
                self.repositorio = FakeRepositorio()
                servico = MagicMock()
                servico.enviar_aprovacao_aluno.return_value = False

                with patch(f"{ROTAS_USUARIO}.get_email_service", return_value=servico):
                    with self.assertLogs(ROTAS_USUARIO, level="WARNING") as registro:
                        status, _ = await self.patch(caminho, corpo)

                self.assertEqual(status, 200)
                self.assertEqual(self.repositorio.aluno.status_cadastro, "ativado")
                self.assertIn("E-mail de aprovação não enviado", registro.output[0])

    async def test_aluno_inexistente_continua_devolvendo_404(self):
        status, corpo = await self.patch("/usuarios/alunos/999999/aprovar")

        self.assertEqual(status, 404)
        self.assertEqual(corpo["detail"], "Aluno não encontrado")


if __name__ == "__main__":
    unittest.main()
