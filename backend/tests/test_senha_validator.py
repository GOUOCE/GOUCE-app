import unittest

from src.shared.validators.senha_validator import SenhaValidator


class SenhaValidatorTest(unittest.TestCase):
    def setUp(self):
        self.validator = SenhaValidator()

    def test_rejeita_senha_com_menos_de_oito_caracteres(self):
        valida, mensagem = self.validator.validar_senha("Abc1234")

        self.assertFalse(valida)
        self.assertIn("8 caracteres", mensagem)

    def test_rejeita_senha_sem_letra_maiuscula(self):
        valida, mensagem = self.validator.validar_senha("abc12345")

        self.assertFalse(valida)
        self.assertIn("maiúscula", mensagem)

    def test_rejeita_senha_sem_letra_minuscula(self):
        valida, mensagem = self.validator.validar_senha("ABC12345")

        self.assertFalse(valida)
        self.assertIn("minúscula", mensagem)

    def test_rejeita_senha_sem_numero(self):
        valida, mensagem = self.validator.validar_senha("Abcdefgh")

        self.assertFalse(valida)
        self.assertIn("número", mensagem)

    def test_aceita_senha_com_regras_de_complexidade(self):
        self.assertEqual(self.validator.validar_senha("Abcdefg1"), (True, ""))


if __name__ == "__main__":
    unittest.main()