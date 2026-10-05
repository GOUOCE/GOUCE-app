import unittest
from datetime import date

from pydantic import ValidationError

from src.modulos.usuarios.application.dtos.usuario_dto import (
    ValidarEtapa3CadastroUsuarioDTO,
)
from src.modulos.usuarios.application.use_cases.criar_usuario_use_case import (
    ValidacaoMultiplaError,
)
from src.modulos.usuarios.application.use_cases.validar_etapa_3_use_case import (
    ValidarEtapa3UsuarioUseCase,
)
from src.shared.validators.periodo_ingresso_validator import PeriodoIngressoValidator


class ValidarEtapa3UseCaseTest(unittest.TestCase):
    def setUp(self):
        hoje = date.today()
        semestre_atual = 1 if hoje.month <= 6 else 2
        self.periodo_ingresso = f"{hoje.year - 2}.1"
        self.maximo_semestre = (
            (hoje.year - (hoje.year - 2)) * 2
            + (semestre_atual - 1)
            + 1
        )
        self.use_case = ValidarEtapa3UsuarioUseCase()

    def payload(self, **updates):
        data = {
            "bairro_id": "Centro",
            "telefone": "85999990000",
            "faculdade_id": "UFC",
            "curso": "Direito",
            "campus": "Quixadá",
            "periodo_ingresso": self.periodo_ingresso,
            "turno_curso": "Noturno",
            "semestre_atual": self.maximo_semestre,
        }
        data.update(updates)
        return data

    def test_aceita_semestre_dentro_do_tempo_decorrido(self):
        dto = ValidarEtapa3CadastroUsuarioDTO(**self.payload(semestre_atual=4))

        resposta = self.use_case.execute(dto)

        self.assertTrue(resposta.success)

    def test_rejeita_semestre_acima_do_tempo_decorrido(self):
        dto = ValidarEtapa3CadastroUsuarioDTO(
            **self.payload(semestre_atual=self.maximo_semestre + 1)
        )

        with self.assertRaises(ValidacaoMultiplaError) as contexto:
            self.use_case.execute(dto)

        self.assertEqual(contexto.exception.erros[0]["field"], "semestre_atual")
        self.assertIn(str(self.maximo_semestre), str(contexto.exception.erros[0]))

    def test_dto_exige_bairro_periodo_e_semestre(self):
        data = self.payload()

        for field in ("bairro_id", "periodo_ingresso", "semestre_atual"):
            with self.subTest(field=field):
                incompleto = dict(data)
                incompleto.pop(field)
                with self.assertRaises(ValidationError):
                    ValidarEtapa3CadastroUsuarioDTO(**incompleto)

    def test_calculo_de_semestres_decorridos(self):
        hoje = date(2026, 10, 5)

        resultado = PeriodoIngressoValidator().quantidade_semestres_decorridos(
            "2022.1",
            hoje=hoje,
        )

        self.assertEqual(resultado, 10)

    def test_dezesseis_e_permitido_e_dezessete_e_bloqueado(self):
        dto_valido = ValidarEtapa3CadastroUsuarioDTO(
            **self.payload(
                periodo_ingresso="2018.1",
                semestre_atual=16,
            )
        )
        self.assertTrue(self.use_case.execute(dto_valido).success)

        dto_invalido = ValidarEtapa3CadastroUsuarioDTO(
            **self.payload(
                periodo_ingresso="2018.1",
                semestre_atual=17,
            )
        )
        with self.assertRaises(ValidacaoMultiplaError) as contexto:
            self.use_case.execute(dto_invalido)

        self.assertEqual(contexto.exception.erros[0]["field"], "semestre_atual")


if __name__ == "__main__":
    unittest.main()
