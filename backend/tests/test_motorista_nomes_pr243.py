import unittest
from pydantic import ValidationError
from src.modulos.motoristas.application.dtos.motorista_dto import CriarMotoristaDTO, AtualizarMotoristaDTO


class MotoristaNomesPR243Test(unittest.TestCase):
    def test_normaliza_espacos_e_preserva_nomes_validos(self):
        for dto in (CriarMotoristaDTO, AtualizarMotoristaDTO):
            for nome in ('Maria da Silva', 'João D’Ávila', 'Ana-Clara Souza'):
                with self.subTest(dto=dto.__name__, nome=nome):
                    self.assertEqual(dto(nome=nome, telefone='88998112233').nome, nome)
            self.assertEqual(dto(nome='  Maria   da   Silva  ', telefone='88998112233').nome, 'Maria da Silva')

    def test_rejeita_nome_sem_letras_suficientes_e_caracteres_invalidos(self):
        for dto in (CriarMotoristaDTO, AtualizarMotoristaDTO):
            for nome in ('333333333333', 'Maria 😀', '-- Silva', 'João @Silva', 'A- Souza'):
                with self.subTest(dto=dto.__name__, nome=nome):
                    with self.assertRaises(ValidationError):
                        dto(nome=nome, telefone='88998112233')
