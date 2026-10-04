import unittest

from src.modulos.usuarios.infrastructure.repositories.usuario_repository import SQLAlchemyUsuarioRepository
from src.modulos.usuarios.application.dtos.usuario_dto import AtualizarStatusAlunoDTO
from src.shared.enums.tipo_documento_reenvio_enum import TipoDocumentoReenvioEnum
from src.modulos.usuarios.application.dtos.usuario_dto import AlunoResumoResponseDTO


class ListarUsuariosStatusOrdemTest(unittest.TestCase):
    def test_resumo_do_aluno_exige_id(self):
        resposta = AlunoResumoResponseDTO(
            id=42,
            nome="Maria da Silva",
            email="maria@example.com",
            faculdade="UFC",
            status_cadastro="pendente",
        )
        self.assertEqual(resposta.id, 42)

    def test_dto_de_rejeicao_documenta_documentos_com_tipo_e_motivo(self):
        dto = AtualizarStatusAlunoDTO(
            status_cadastro="rejeitado",
            motivo_reprovacao="Documentos precisam ser reenviados",
            documentos_reenvio=[
                {
                    "tipo": "comprovante_matricula",
                    "motivo": "Documento ilegível",
                }
            ],
        )

        self.assertEqual(
            dto.documentos_reenvio[0].tipo,
            TipoDocumentoReenvioEnum.COMPROVANTE_MATRICULA,
        )
        self.assertEqual(dto.documentos_reenvio[0].motivo, "Documento ilegível")

    def test_dto_de_rejeicao_exige_motivo_e_documentos(self):
        with self.assertRaises(ValueError):
            AtualizarStatusAlunoDTO(status_cadastro="rejeitado")

    def test_dto_de_aprovacao_nao_recebe_dados_de_rejeicao(self):
        with self.assertRaises(ValueError):
            AtualizarStatusAlunoDTO(
                status_cadastro="ativado",
                motivo_reprovacao="Motivo indevido",
            )

    def test_validar_status_cadastro_rejeita_valor_fora_do_enum(self):
        self.assertEqual(
            SQLAlchemyUsuarioRepository.validar_status_cadastro(" REJEITADO "),
            "rejeitado",
        )
        self.assertIsNone(SQLAlchemyUsuarioRepository.validar_status_cadastro(None))

        with self.assertRaises(ValueError):
            SQLAlchemyUsuarioRepository.validar_status_cadastro("status_inexistente")

    def test_validar_ordem_data_aceita_apenas_asc_e_desc(self):
        self.assertEqual(SQLAlchemyUsuarioRepository.validar_ordem_data("asc"), "asc")
        self.assertEqual(SQLAlchemyUsuarioRepository.validar_ordem_data("DESC"), "desc")
        self.assertIsNone(SQLAlchemyUsuarioRepository.validar_ordem_data(None))

        with self.assertRaises(ValueError):
            SQLAlchemyUsuarioRepository.validar_ordem_data("crescente")


if __name__ == "__main__":
    unittest.main()
