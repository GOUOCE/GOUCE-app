import unittest
from unittest.mock import patch

from src.shared.infrastructure.services.email_service import SMTPEmailService


class EmailDocumentosRejeitadosTest(unittest.TestCase):
    """HU-027 (#371): o e-mail de reenvio mostra o nome de cada documento com acento."""

    def test_nomes_dos_documentos_com_acento_no_texto_e_no_html(self):
        servico = SMTPEmailService()
        documentos = [
            {"tipo": "comprovante_matricula", "motivo": "Matrícula vencida."},
            {"tipo": "comprovante_residencia", "motivo": "Endereço ilegível."},
            {"tipo": "foto_perfil", "motivo": "Foto desfocada."},
        ]

        with patch.object(servico, "_enviar_mensagem", return_value=True) as enviar:
            servico.enviar_documentos_rejeitados("aluno@teste.com", "Bruno Lima", documentos)

        _, _, texto, html = enviar.call_args.args
        for esperado in (
            "Comprovante de matrícula: Matrícula vencida.",
            "Comprovante de residência: Endereço ilegível.",
            "Foto de perfil: Foto desfocada.",
        ):
            self.assertIn(esperado, texto)
        self.assertIn("<strong>Comprovante de matrícula</strong>: Matrícula vencida.", html)
        self.assertNotIn("Comprovante Matricula", texto + html)

    def test_tipo_desconhecido_vira_texto_legivel(self):
        self.assertEqual(SMTPEmailService._nome_documento("outro_documento"), "Outro documento")
        self.assertEqual(SMTPEmailService._nome_documento(None), "Documento")


if __name__ == "__main__":
    unittest.main()
