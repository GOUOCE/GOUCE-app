import unittest
from datetime import date
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi import FastAPI
from tests.rota_principal_support import asgi_request

from src.modulos.alocacao_diaria.interface.http import alocacao_routes
from src.modulos.alocacao_diaria.interface.http import rodizio_routes
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
from src.modulos.alocacao_diaria.application.dtos.rodizio_dto import RodizioItemDTO, RodizioRequestDTO
from src.modulos.alocacao_diaria.application.services.rodizio_service import RodizioError, RodizioService


class _Query:
    def __init__(self, items):
        self.items = items

    def filter(self, *args):
        return self

    def all(self):
        return list(self.items)

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
        service._hoje = lambda: date(2026, 11, 1)  # fixa 'hoje' antes das datas dos testes (issue #542)
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
        service._hoje = lambda: date(2026, 11, 1)  # fixa 'hoje' antes das datas dos testes (issue #542)
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
                "MotoristaORM": [SimpleNamespace(id=10, ativo=True)],
            }[model.__name__]
        )
        service = AlocacaoService(session)
        service._hoje = lambda: date(2026, 11, 1)  # fixa 'hoje' antes das datas dos testes (issue #542)

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


class RodizioHu020Test(unittest.TestCase):
    def _session(self, routes=None, buses=None):
        session = MagicMock()
        routes = routes or [SimpleNamespace(id=1), SimpleNamespace(id=2)]
        buses = buses or [
            SimpleNamespace(placa_onibus="ABC1D23", qtd_assentos=20, capacidade_maxima=10),
            SimpleNamespace(placa_onibus="XYZ9K87", qtd_assentos=30, capacidade_maxima=15),
        ]
        session.query.side_effect = lambda model: _Query(
            routes if model.__name__ == "RotaPrincipalORM" else buses
        )
        return session

    def test_bloqueia_mesmo_onibus_em_duas_rotas_no_mesmo_turno(self):
        session = self._session()
        service = RodizioService(session)
        payload = RodizioRequestDTO(
            data_inicio=date(2026, 11, 23),
            itens=[
                RodizioItemDTO(rota_id=1, onibus_id="ABC1D23", turno="ida"),
                RodizioItemDTO(rota_id=2, onibus_id="ABC1D23", turno="ida"),
            ],
        )

        with self.assertRaisesRegex(RodizioError, "mesmo ônibus não pode"):
            service._validar(payload)

    def test_bloqueia_onibus_inativo(self):
        session = self._session(
            buses=[SimpleNamespace(placa_onibus="XYZ9K87", qtd_assentos=30, capacidade_maxima=15)]
        )
        service = RodizioService(session)
        payload = RodizioRequestDTO(
            data_inicio=date(2026, 11, 23),
            itens=[RodizioItemDTO(rota_id=1, onibus_id="OLD0A00", turno="ida")],
        )

        with self.assertRaisesRegex(RodizioError, "inexistente ou inativo"):
            service._validar(payload)

    def test_normaliza_placa_com_hifen(self):
        session = self._session(
            buses=[SimpleNamespace(placa_onibus="LSN4I49", qtd_assentos=30, capacidade_maxima=15)]
        )
        service = RodizioService(session)
        payload = RodizioRequestDTO(
            data_inicio=date(2026, 11, 23),
            itens=[RodizioItemDTO(rota_id=1, onibus_id="LSN-4I49", turno="ida")],
        )

        service._validar(payload)
        self.assertEqual(payload.itens[0].onibus_id, "LSN4I49")

    def test_preview_calcula_escala_sem_erro_de_tipo(self):
        session = self._session(
            routes=[SimpleNamespace(id=1, nome="Rota 1")],
            buses=[SimpleNamespace(placa_onibus="LSN4I49", qtd_assentos=30, capacidade_maxima=15)]
        )
        service = RodizioService(session)
        payload = RodizioRequestDTO(
            data_inicio=date(2026, 11, 23),
            itens=[RodizioItemDTO(rota_id=1, onibus_id="LSN-4I49", turno="ida")],
        )

        with patch.object(AlocacaoService, "_demanda", return_value={}):
            resultado = service.preview(payload)

        self.assertEqual(resultado["semanas"], 4)
        self.assertEqual(len(resultado["escalas"]), 4)


class RodizioSwaggerTest(unittest.TestCase):
    def test_openapi_documenta_todos_os_endpoints_hu020(self):
        app = FastAPI()
        app.include_router(rodizio_routes.router)
        schema = app.openapi()

        self.assertIn("/rodizio-frota", schema["paths"])
        self.assertIn("/rodizio-frota/preview", schema["paths"])
        self.assertIn("/rodizio-frota/confirmar", schema["paths"])

        preview = schema["paths"]["/rodizio-frota/preview"]["post"]
        confirmar = schema["paths"]["/rodizio-frota/confirmar"]["post"]
        self.assertIn("Gerar prévia", preview["summary"])
        self.assertIn("Confirmar", confirmar["summary"])
        self.assertIn("409", preview["responses"])
        self.assertIn("409", confirmar["responses"])


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
