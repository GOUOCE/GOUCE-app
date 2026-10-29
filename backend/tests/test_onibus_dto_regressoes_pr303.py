import unittest
from pydantic import ValidationError
from src.modulos.crud_basicos.application.dtos.onibus_dto import CriarOnibusDTO, AtualizarOnibusDTO
from src.shared.http.validation import validation_details


class OnibusLimitesTest(unittest.TestCase):
    def test_decimais_nao_sao_truncados_e_limite_nao_estoura(self):
        for dto in (CriarOnibusDTO, AtualizarOnibusDTO):
            for campo in ('assentos', 'capacidade_em_pe'):
                for valor in (2.5, '2.5', 101, 883833333333, -1):
                    with self.subTest(dto=dto.__name__, campo=campo, valor=valor):
                        with self.assertRaises(ValidationError):
                            dto(**{'placa': 'GHI3J45', 'assentos': 40, 'capacidade_em_pe': 0, campo: valor})

    def test_fronteiras_suportadas_pelo_banco(self):
        for dto in (CriarOnibusDTO, AtualizarOnibusDTO):
            valor = dto(placa='GHI3J45', assentos=100, capacidade_em_pe=0)
            self.assertEqual(valor.assentos, 100)
            self.assertEqual(valor.capacidade_em_pe, 0)

    def test_mensagem_de_limite_em_portugues(self):
        try:
            CriarOnibusDTO(placa='GHI3J45', assentos=883833333333, capacidade_em_pe=0)
        except ValidationError as error:
            self.assertIn('no máximo 100', validation_details(error.errors())[0]['message'])
        else:
            self.fail('O valor acima do banco deveria ser rejeitado')
