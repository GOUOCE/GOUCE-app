import os
import unittest

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://test:test@localhost:5432/test",
)

from src.modulos.motoristas.application.validators.telefone_validator import (
    MENSAGEM_TELEFONE_INVALIDO,
    validar_telefone_br,
)

TELEFONES_VALIDOS = (
    "(88) 99811-2233",
    "88998112233",
    "(88) 3412-5566",
    "8834125566",
    "88 99811-2233",
    "(11) 2345-6789",
    "(99) 99999-9999",
    "85888880000",
)

TELEFONES_INVALIDOS = (
    "123",
    "998112233",
    "889981122334",
    "889981122334455",
    "abcdefghijk",
    "(88) abcdef",
    "456",
    "(77) zzzzzz",
    "12345678901234567",
    "+55 88 99811-2233",
    "(88 99811-2233",
    "88) 99811-2233",
    "((88)) 99811-2233",
    "(08) 99811-2233",
    "(10) 99811-2233",
    "0899811-2233",
    "88.99811.2233",
    "88/99811/2233",
    "(88)(99811)2233",
    "88 (99811) 2233",
    "( 88) 99811-2233",
    "-88998112233",
    "88 99811-2233",
    # Dígitos não ASCII (árabe-índico, devanágari e fullwidth).
    "٨٨٩٩٨١١٢٢٣٣",
    "८८९९८११२२३३",
    "８８９９８１１２２３３",
    "(88) 99811-223३",
    "",
    "   ",
    "1" * 41,
)

# Os DTOs removem espaços nas pontas antes de validar; a função pura não.
TELEFONES_COM_ESPACO_NAS_PONTAS = (
    " 88998112233",
    "88998112233\n",
    "(88) 99811-2233" + " " * 30,
)


class ValidarTelefoneBrTest(unittest.TestCase):
    def test_aceita_celular_e_fixo_com_ou_sem_mascara(self):
        for telefone in TELEFONES_VALIDOS:
            with self.subTest(telefone=telefone):
                self.assertEqual(validar_telefone_br(telefone), telefone)

    def test_rejeita_telefones_malformados_com_mensagem_unica(self):
        for telefone in TELEFONES_INVALIDOS:
            with self.subTest(telefone=telefone):
                with self.assertRaises(ValueError) as contexto:
                    validar_telefone_br(telefone)
                self.assertEqual(
                    str(contexto.exception),
                    "Informe um telefone válido com DDD.",
                )

    def test_rejeita_espaco_nas_pontas_na_funcao_pura(self):
        for telefone in TELEFONES_COM_ESPACO_NAS_PONTAS:
            with self.subTest(telefone=telefone):
                with self.assertRaises(ValueError):
                    validar_telefone_br(telefone)

    def test_limites_de_9_10_11_e_12_digitos(self):
        casos = {
            "889981122": False,
            "8834125566": True,
            "88998112233": True,
            "889981122334": False,
        }
        for telefone, valido in casos.items():
            with self.subTest(digitos=len(telefone)):
                if valido:
                    self.assertEqual(validar_telefone_br(telefone), telefone)
                else:
                    with self.assertRaises(ValueError):
                        validar_telefone_br(telefone)

    def test_ddd_de_11_a_99_sem_zero_a_esquerda(self):
        self.assertEqual(validar_telefone_br("1198112233"), "1198112233")
        self.assertEqual(validar_telefone_br("9998112233"), "9998112233")
        for ddd in ("00", "01", "08", "10"):
            with self.subTest(ddd=ddd):
                with self.assertRaises(ValueError):
                    validar_telefone_br(f"{ddd}98112233")

    def test_nao_exige_nono_digito_nem_checa_primeiro_digito_do_fixo(self):
        self.assertEqual(validar_telefone_br("85888880000"), "85888880000")
        self.assertEqual(validar_telefone_br("8811112222"), "8811112222")

    def test_rejeita_valor_que_nao_e_texto(self):
        for valor in (None, 88998112233, 1.5, ["88998112233"]):
            with self.subTest(valor=valor):
                with self.assertRaises(ValueError):
                    validar_telefone_br(valor)

    def test_mensagem_publica_e_a_do_criterio_de_aceite(self):
        self.assertEqual(
            MENSAGEM_TELEFONE_INVALIDO,
            "Informe um telefone válido com DDD.",
        )


if __name__ == "__main__":
    unittest.main()
