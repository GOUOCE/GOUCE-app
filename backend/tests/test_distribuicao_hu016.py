import unittest
from datetime import date
from types import SimpleNamespace
from unittest.mock import MagicMock

from fastapi import FastAPI
from tests.rota_principal_support import asgi_request

from src.modulos.alocacao_diaria.interface.http import alocacao_routes
from src.modulos.alocacao_diaria.application.dtos.alocacao_dto import DistribuicaoRequestDTO
from src.modulos.alocacao_diaria.application.services.alocacao_service import (
    AlocacaoService,
    DistribuicaoError,
)
from src.modulos.alocacao_diaria.application.services.distribuicao import (
    OnibusDisponivel,
    Passageiro,
    distribuir_alunos,
)


class _Query:
    def __init__(self, items):
        self.items = items

    def filter(self, *args):
        return self

    def __iter__(self):
        return iter(self.items)


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
        self.assertEqual(sum(item["sentados"] for item in resultado["alocacoes"]), 5)
        self.assertEqual(sum(item["em_pe"] for item in resultado["alocacoes"]), 0)

    def test_prioriza_assentos_de_todos_os_onibus_antes_de_em_pe(self):
        resultado = distribuir_alunos(
            {1: [Passageiro(index, "ida") for index in range(8)]},
            [
                OnibusDisponivel("ABC1D23", 3, 2, 10),
                OnibusDisponivel("HIJ7K89", 4, 0, 11),
            ],
        )
        self.assertEqual(sum(item["sentados"] for item in resultado["alocacoes"]), 7)
        self.assertEqual(sum(item["em_pe"] for item in resultado["alocacoes"]), 1)
        self.assertEqual(len(resultado["excedentes_globais"]), 0)

    def test_nao_usa_lugar_em_pe_enquanto_houver_assento_em_outro_onibus(self):
        resultado = distribuir_alunos(
            {1: [Passageiro(index, "ida") for index in range(5)]},
            [
                OnibusDisponivel("ABC1D23", 3, 2, 10),
                OnibusDisponivel("HIJ7K89", 4, 0, 11),
            ],
        )

        self.assertEqual(sum(item["sentados"] for item in resultado["alocacoes"]), 5)
        self.assertEqual(sum(item["em_pe"] for item in resultado["alocacoes"]), 0)
        self.assertEqual(len(resultado["excedentes_globais"]), 0)

    def test_distribui_cinco_alunos_em_assentos_de_dois_onibus(self):
        resultado = distribuir_alunos(
            {1: [Passageiro(index, "ida") for index in range(5)]},
            [
                OnibusDisponivel("ABC1D23", 3, 2, 10),
                OnibusDisponivel("HIJ7K89", 4, 0, 11),
            ],
        )
        self.assertEqual(sum(item["sentados"] for item in resultado["alocacoes"]), 5)
        self.assertEqual(sum(item["em_pe"] for item in resultado["alocacoes"]), 0)

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

    def test_reutiliza_onibus_e_motorista_na_volta(self):
        resultado = distribuir_alunos(
            {
                (1, "ida"): [
                    Passageiro(1, "ida"),
                    Passageiro(2, "ida"),
                    Passageiro(3, "ida"),
                ],
                (1, "volta"): [Passageiro(4, "volta")],
            },
            [OnibusDisponivel("V1", 3, 0, 10)],
        )

        self.assertEqual(len(resultado["alocacoes"]), 2)
        self.assertEqual(
            {(item["onibus_id"], item["motorista_id"], item["turno"]) for item in resultado["alocacoes"]},
            {("V1", 10, "ida"), ("V1", 10, "volta")},
        )
        self.assertEqual(resultado["excedentes_globais"], [])

    def test_confirmacao_automatica_retorna_excedentes_globais(self):
        session = MagicMock()
        service = AlocacaoService(session)
        service.preview = MagicMock(
            return_value={
                "data": "2026-11-24",
                "alocacoes": [{"onibus_id": "ABC1D23", "alunos": []}],
                "excedentes_globais": [
                    {"agendamento_id": 64, "turno": "ida"},
                ],
            }
        )
        service._validar_payload = MagicMock()
        service._persistir = MagicMock()

        resultado = service.persist(
            DistribuicaoRequestDTO(data=date(2026, 11, 24), modo="automatico")
        )

        self.assertEqual(
            resultado["excedentes_globais"],
            [{"agendamento_id": 64, "turno": "ida"}],
        )
        session.commit.assert_called_once()

    def test_confirmacao_manual_recusa_lista_de_alocacoes_vazia(self):
        session = MagicMock()
        service = AlocacaoService(session)
        payload = DistribuicaoRequestDTO(data=date(2026, 11, 26), modo="manual")

        with self.assertRaisesRegex(DistribuicaoError, "lista de alocações não pode ser vazia"):
            service.persist(payload)

        session.commit.assert_not_called()
        session.rollback.assert_not_called()

    def test_confirmacao_manual_permite_realocacao_entre_rotas(self):
        booking = SimpleNamespace(
            id=64,
            usa_ida=True,
            usa_volta=False,
            rota_complementar_ida_id=None,
            rota_complementar_volta_id=None,
            ies_destino_id=100,
            ies_origem_id=100,
        )
        session = MagicMock()
        session.query.side_effect = lambda model: _Query(
            {
                "AgendamentoORM": [booking],
                "RotaPrincipalORM": [
                    SimpleNamespace(
                        id=1,
                        faculdades_ida=[SimpleNamespace(id_faculdade=100)],
                        faculdades_volta=[],
                    ),
                    SimpleNamespace(
                        id=2,
                        faculdades_ida=[SimpleNamespace(id_faculdade=200)],
                        faculdades_volta=[],
                    ),
                ],
                "RotaComplementarORM": [],
                "OnibusORM": [
                    SimpleNamespace(
                        placa_onibus="V2",
                        qtd_assentos=3,
                        capacidade_maxima=2,
                    )
                ],
                "MotoristaORM": [SimpleNamespace(id=10)],
            }[model.__name__]
        )
        service = AlocacaoService(session)

        service._validar_payload(
            date(2026, 11, 24),
            [
                {
                    "rota_id": 2,
                    "onibus_id": "V2",
                    "motorista_id": 10,
                    "turno": "ida",
                    "alunos": [
                        {
                            "agendamento_id": 64,
                            "tipo_lugar": "sentado",
                        }
                    ],
                }
            ],
        )


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
