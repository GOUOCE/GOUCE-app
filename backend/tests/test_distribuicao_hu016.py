import unittest

from fastapi import FastAPI
from tests.rota_principal_support import asgi_request

from src.modulos.alocacao_diaria.interface.http import alocacao_routes
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


class DistribuicaoHttpHu016Test(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(alocacao_routes.router)
        self.app.dependency_overrides[alocacao_routes.admin_required] = lambda: {"sub": "1", "cargo": "ADMINISTRADOR"}

    async def test_data_invalida_retorna_422_mensagem_amigavel(self):
        status, response = await asgi_request(
            self.app,
            "GET",
            "/alocacao-diaria/distribuicao-automatica?data=2026-02-30",
        )
        self.assertEqual(status, 422)
        self.assertEqual(
            response,
            {
                "success": False,
                "error": {
                    "code": "DISTRIBUICAO_INVALIDA",
                    "message": "Data inválida.",
                },
            },
        )


if __name__ == "__main__":
    unittest.main()
