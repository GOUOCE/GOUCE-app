import unittest
from types import SimpleNamespace
from unittest.mock import Mock

from src.modulos.usuarios.application.dtos.renovacao_vinculo_dto import (
    RenovacaoVinculoDTO,
)
from src.modulos.usuarios.application.use_cases.criar_usuario_use_case import (
    ValidacaoMultiplaError,
)
from src.modulos.usuarios.application.use_cases.renovar_vinculo_use_case import (
    RenovarVinculoUseCase,
)
from src.modulos.usuarios.application.use_cases.validar_etapa_4_use_case import (
    ValidarEtapa4UsuarioUseCase,
    validar_regras_arquivo,
)


def renovacao_dto() -> RenovacaoVinculoDTO:
    return RenovacaoVinculoDTO(
        nome="Maria da Silva",
        raca="Pardo",
        identificacao_sexual="Bissexual",
        identificacao_genero="Mulher",
        transgenero="Não",
        tem_filhos=False,
        telefone="85999990000",
        bairro_id="Centro",
        faculdade_id="UFC",
        curso="Engenharia de Software",
        campus="Quixadá",
        periodo_ingresso="2024.1",
        turno_curso="Noturno",
        semestre_atual=4,
    )


class ValidarRenovacaoArquivosTest(unittest.TestCase):
    def test_rejeita_envio_sem_anexos(self):
        with self.assertRaises(ValidacaoMultiplaError) as contexto:
            ValidarEtapa4UsuarioUseCase().execute(None, None)

        campos = {erro["field"] for erro in contexto.exception.erros}
        self.assertEqual(campos, {"comprovante_matricula", "comprovante_residencia"})

    def test_rejeita_docx(self):
        erro = validar_regras_arquivo("comprovante.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", b"conteudo")

        self.assertEqual(erro, "Formato inválido")

    def test_rejeita_arquivo_de_oito_mb(self):
        erro = validar_regras_arquivo("comprovante.pdf", "application/pdf", b"x" * (8 * 1024 * 1024))

        self.assertEqual(erro, "Arquivo excede o limite de tamanho")


class RenovarVinculoFalhasTest(unittest.TestCase):
    def setUp(self):
        self.repository = Mock()
        self.repository.buscar_com_detalhes_por_id.return_value = (
            SimpleNamespace(id=7),
            SimpleNamespace(aluno_id=7),
        )
        self.salvar_arquivo = Mock()
        self.use_case = RenovarVinculoUseCase(self.repository, self.salvar_arquivo)

    def test_nao_persiste_nada_quando_arquivo_e_invalido(self):
        with self.assertRaises(ValidacaoMultiplaError):
            self.use_case.execute(
                7,
                renovacao_dto(),
                ("comprovante.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", b"arquivo"),
                ("residencia.pdf", "application/pdf", b"arquivo"),
            )

        self.salvar_arquivo.execute.assert_not_called()
        self.repository.atualizar_dados_renovacao.assert_not_called()

    def test_rejeita_comprovante_acima_de_cinco_mb(self):
        with self.assertRaises(ValidacaoMultiplaError) as contexto:
            self.use_case.execute(
                7,
                renovacao_dto(),
                ("matricula.pdf", "application/pdf", b"x" * (5 * 1024 * 1024 + 1)),
                ("residencia.pdf", "application/pdf", b"arquivo"),
            )

        self.assertEqual(
            contexto.exception.erros,
            [{"field": "comprovante_matricula", "message": "Arquivo excede o limite de tamanho"}],
        )
        self.salvar_arquivo.execute.assert_not_called()
        self.repository.atualizar_dados_renovacao.assert_not_called()

    def test_falha_de_armazenamento_nao_atualiza_aluno(self):
        self.salvar_arquivo.execute.side_effect = ConnectionError("storage indisponivel")

        with self.assertRaises(ConnectionError):
            self.use_case.execute(
                7,
                renovacao_dto(),
                ("matricula.pdf", "application/pdf", b"arquivo"),
                ("residencia.pdf", "application/pdf", b"arquivo"),
            )

        self.repository.atualizar_dados_renovacao.assert_not_called()


if __name__ == "__main__":
    unittest.main()