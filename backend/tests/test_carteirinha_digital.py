import os
import unittest
from types import SimpleNamespace
from unittest.mock import Mock

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/gouce_test",
)

from fastapi import HTTPException

from src.modulos.usuarios.interface.http.aluno_router import obter_carteirinha
from src.shared.enums.status_cadastro_enum import StatusCadastroEnum


class CarteirinhaDigitalTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.repository = Mock()
        self.repository.buscar_com_detalhes_por_id.return_value = (
            SimpleNamespace(
                id=1,
                nome_completo="Maria Souza",
                email="maria@example.com",
                telefone="85999990000",
            ),
            SimpleNamespace(
                status_cadastro=StatusCadastroEnum.ATIVADO.value,
                faculdade_id="Universidade Federal",
                curso="Engenharia de Software",
                bairro_id="Centro",
                id_foto_aluno="foto-maria",
                campus="Quixadá",
                semestre_atual=4,
                periodo_ingresso="2024.1",
                turno_curso="Noturno",
                data_nascimento=None,
                identificacao_genero=None,
                raca=None,
                identificacao_sexual=None,
                tem_filhos=False,
                validade_acesso=None,
                motivo_reprovacao=None,
                id_comprovante_matricula=None,
                id_comprovante_residencia=None,
            ),
        )
        self.current_user = {
            "current_user_id": 1,
            "current_status": StatusCadastroEnum.ATIVADO.value,
        }

    async def test_aluno_aprovado_recebe_dados_da_carteirinha(self):
        resposta = await obter_carteirinha(self.current_user, self.repository)

        self.assertEqual(resposta.id, 1)
        self.assertEqual(resposta.nome, "Maria Souza")
        self.assertEqual(resposta.faculdade_id, "Universidade Federal")
        self.assertEqual(resposta.curso, "Engenharia de Software")
        self.assertEqual(resposta.id_foto_aluno, "foto-maria")
        self.repository.buscar_com_detalhes_por_id.assert_called_once_with(1)

    async def test_carteirinha_fica_indisponivel_para_status_nao_aprovado(self):
        for status in (
            StatusCadastroEnum.PENDENTE.value,
            StatusCadastroEnum.INATIVADO.value,
            StatusCadastroEnum.ANALISE_RENOVACAO.value,
        ):
            with self.subTest(status=status):
                self.current_user["current_status"] = status

                with self.assertRaises(HTTPException) as contexto:
                    await obter_carteirinha(self.current_user, self.repository)

                self.assertEqual(contexto.exception.status_code, 403)
                self.assertEqual(
                    contexto.exception.detail,
                    "Carteirinha indisponível. Seu cadastro está inativo ou em análise.",
                )

        self.repository.buscar_com_detalhes_por_id.assert_not_called()

    async def test_sessao_sem_id_inteiro_retorna_erro_de_autenticacao(self):
        for user_id in (None, "1", True):
            with self.subTest(user_id=user_id):
                self.current_user["current_user_id"] = user_id

                with self.assertRaises(HTTPException) as contexto:
                    await obter_carteirinha(self.current_user, self.repository)

                self.assertEqual(contexto.exception.status_code, 401)
                self.assertEqual(contexto.exception.detail, "Sessão inválida")

    async def test_usuario_nao_encontrado_retorna_404(self):
        self.repository.buscar_com_detalhes_por_id.return_value = (None, None)

        with self.assertRaises(HTTPException) as contexto:
            await obter_carteirinha(self.current_user, self.repository)

        self.assertEqual(contexto.exception.status_code, 404)
        self.assertEqual(contexto.exception.detail, "Usuário não encontrado")

    async def test_erro_do_repositorio_retorna_500(self):
        self.repository.buscar_com_detalhes_por_id.side_effect = RuntimeError(
            "falha de conexão"
        )

        with self.assertRaises(HTTPException) as contexto:
            await obter_carteirinha(self.current_user, self.repository)

        self.assertEqual(contexto.exception.status_code, 500)
        self.assertEqual(contexto.exception.detail, "Erro interno ao consultar o perfil")


if __name__ == "__main__":
    unittest.main()