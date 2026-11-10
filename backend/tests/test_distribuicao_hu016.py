import unittest

from src.modulos.alocacao_diaria.application.services.distribuicao import (
    OnibusDisponivel,
    Passageiro,
    distribuir_alunos,
)


class DistribuicaoHu016Test(unittest.TestCase):
    def test_demanda_menor_que_assentos(self):
        resultado = distribuir_alunos(
            {1: [Passageiro(index, "ida") for index in range(3)]},
            [OnibusDisponivel("A", 4, 2, 10)],
        )
        self.assertEqual(resultado["alocacoes"][0]["sentados"], 3)
        self.assertEqual(resultado["alocacoes"][0]["em_pe"], 0)

    def test_demanda_excedente_vai_para_em_pe(self):
        resultado = distribuir_alunos(
            {1: [Passageiro(index, "ida") for index in range(5)]},
            [OnibusDisponivel("A", 3, 2, 10)],
        )
        self.assertEqual(resultado["alocacoes"][0]["sentados"], 3)
        self.assertEqual(resultado["alocacoes"][0]["em_pe"], 2)

    def test_demanda_acima_da_capacidade_sinaliza_excedentes(self):
        resultado = distribuir_alunos(
            {1: [Passageiro(index, "ida") for index in range(6)]},
            [OnibusDisponivel("A", 3, 2, 10)],
        )
        self.assertEqual(len(resultado["excedentes_globais"]), 1)

    def test_realoca_para_outro_onibus_com_vaga(self):
        resultado = distribuir_alunos(
            {1: [Passageiro(index, "ida") for index in range(5)]},
            [
                OnibusDisponivel("A", 2, 0, 10),
                OnibusDisponivel("B", 3, 0, 11),
            ],
        )
        self.assertEqual(sum(len(item["alunos"]) for item in resultado["alocacoes"]), 5)
        self.assertEqual(len(resultado["alocacoes"]), 2)

    def test_separa_turnos_e_respeita_rodizio(self):
        resultado = distribuir_alunos(
            {
                (1, "ida"): [Passageiro(1, "ida")],
                (1, "volta"): [Passageiro(2, "volta")],
            },
            [
                OnibusDisponivel("A", 2, 0, 10),
                OnibusDisponivel("B", 2, 0, 11),
            ],
            rodizio={1: "B"},
        )
        self.assertEqual({item["turno"] for item in resultado["alocacoes"]}, {"ida", "volta"})
        self.assertEqual(resultado["alocacoes"][0]["onibus_id"], "B")


if __name__ == "__main__":
    unittest.main()
