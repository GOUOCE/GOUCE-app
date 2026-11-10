"""Testes da camada HTTP da HU-014 (use case simulado, sem banco)."""

import unittest
from datetime import date, datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock

from fastapi import FastAPI
from tests.rota_principal_support import asgi_request

from src.modulos.agendamentos.application.errors import AgendamentoError
from src.modulos.agendamentos.interface.http import agendamento_routes as routes
from src.shared.auth.dependencies import verify_student_standard_access

BASE = "/transporte/agendamentos"
DETALHE = {
    "id": 8, "aluno_id": 7, "data": date(2026, 11, 10), "usa_ida": True,
    "usa_volta": False, "status": "ATIVO", "pode_remover": True,
    "pode_editar": True,
    "atualizado_em": datetime(2026, 11, 10, 8, 0, tzinfo=timezone.utc),
}

# HU-015: ônibus e motorista são sempre null nesta fase (alocação fica para o EP-005).
ROTA_PRINCIPAL_IDA = {
    "id": 100, "nome": "Rota Centro", "horario_saida": "06:30", "horario_retorno": "17:30",
}
ROTA_PRINCIPAL_VOLTA = {
    "id": 200, "nome": "Rota Integrada", "horario_saida": "07:00", "horario_retorno": "18:00",
}
DETALHE_COM_ROTA_PRINCIPAL = {
    **DETALHE,
    "usa_volta": True,
    "rota_principal_ida": ROTA_PRINCIPAL_IDA,
    "rota_principal_volta": ROTA_PRINCIPAL_VOLTA,
}
DETALHE_TRAJETO_DIRETO = {
    **DETALHE,
    "rota_principal_ida": ROTA_PRINCIPAL_IDA,
    "rota_principal_volta": None,
}


class AgendamentoRoutesHu014Test(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.service = MagicMock()
        self.app = FastAPI()
        self.app.include_router(routes.router)
        self.app.dependency_overrides[routes._use_case] = lambda: self.service
        self.app.dependency_overrides[verify_student_standard_access] = lambda: {
            "current_user_id": 7
        }

    async def call(self, method, path, body=None):
        return await asgi_request(self.app, method, path, body)

    async def test_delete_retorna_mensagem_e_contador_atualizado(self):
        self.service.summary.return_value = {"ativos": 4, "limite": 22}
        status, body = await self.call("DELETE", f"{BASE}/8")
        self.assertEqual(status, 200)
        self.assertEqual(
            body,
            {
                "mensagem": "Agendamento cancelado com sucesso",
                "estado_dia": "DISPONIVEL",
                "ativos": 4,
                "limite": 22,
            },
        )
        self.service.cancel.assert_called_once_with(7, 8)

    async def test_delete_de_data_passada_retorna_422(self):
        self.service.cancel.side_effect = AgendamentoError(
            "AGENDAMENTO_PASSADO", "Não é possível cancelar.", 422
        )
        status, body = await self.call("DELETE", f"{BASE}/8")
        self.assertEqual(status, 422)
        self.assertEqual(body["error"]["code"], "AGENDAMENTO_PASSADO")

    async def test_delete_inexistente_retorna_404(self):
        self.service.cancel.side_effect = AgendamentoError(
            "RESOURCE_NOT_FOUND", "Agendamento não encontrado.", 404
        )
        status, _ = await self.call("DELETE", f"{BASE}/99")
        self.assertEqual(status, 404)

    async def test_meus_nao_e_confundido_com_id(self):
        self.service.my_bookings.return_value = {
            "agendamentos": [], "ativos": 0, "limite": 22
        }
        status, body = await self.call("GET", f"{BASE}/meus")
        self.assertEqual(status, 200)
        self.assertEqual(body["ativos"], 0)

    async def test_calendario_expoe_agendamento_id_e_flags(self):
        self.service.calendar_view.return_value = {
            "mes": "2026-11",
            "dias": [{
                "data": date(2026, 11, 3), "estado": "AGENDADO",
                "pode_agendar": False, "agendamento_id": 5,
                "pode_remover": False, "pode_editar": False,
            }],
            "ativos": 1,
            "limite": 22,
        }
        status, body = await self.call("GET", f"{BASE}/calendario?mes=2026-11")
        self.assertEqual(status, 200)
        self.assertEqual(body["dias"][0]["agendamento_id"], 5)
        self.assertFalse(body["dias"][0]["pode_remover"])
        self.assertEqual(body["limite"], 22)

    async def test_calendario_exige_mes_valido(self):
        status, _ = await self.call("GET", f"{BASE}/calendario?mes=2026-1")
        self.assertEqual(status, 422)

    async def test_detalhe_retorna_flags(self):
        self.service.detail.return_value = DETALHE
        status, body = await self.call("GET", f"{BASE}/8")
        self.assertEqual(status, 200)
        self.assertTrue(body["pode_remover"])

    async def test_detalhes_por_data_nao_e_confundido_com_id(self):
        # /detalhes precisa estar declarada antes de /{agendamento_id} (HU-015).
        self.service.detail_by_date.return_value = DETALHE
        status, body = await self.call("GET", f"{BASE}/detalhes?data=2026-11-10")
        self.assertEqual(status, 200)
        self.assertTrue(body["pode_remover"])
        self.service.detail_by_date.assert_called_once_with(7, "2026-11-10")
        self.service.detail.assert_not_called()

    async def test_detalhes_por_data_exige_data_no_formato_esperado(self):
        self.service.detail_by_date.side_effect = AgendamentoError(
            "VALIDATION_ERROR", "Data deve estar no formato YYYY-MM-DD.", 422
        )
        status, body = await self.call("GET", f"{BASE}/detalhes?data=10-11-2026")
        self.assertEqual(status, 422)
        self.assertEqual(body["error"]["code"], "VALIDATION_ERROR")
        self.assertEqual(
            body["error"]["message"], "Data deve estar no formato YYYY-MM-DD."
        )
        self.service.detail_by_date.assert_called_once_with(7, "10-11-2026")

    async def test_detalhes_por_data_ausente_retorna_422(self):
        status, _ = await self.call("GET", f"{BASE}/detalhes")
        self.assertEqual(status, 422)
        self.service.detail_by_date.assert_not_called()

    async def test_detalhes_por_data_propaga_erro_do_use_case(self):
        self.service.detail_by_date.side_effect = AgendamentoError(
            "RESOURCE_NOT_FOUND", "Nenhum agendamento ativo para esta data.", 404
        )
        status, body = await self.call("GET", f"{BASE}/detalhes?data=2026-11-10")
        self.assertEqual(status, 404)
        self.assertEqual(body["error"]["code"], "RESOURCE_NOT_FOUND")

    # ---- HU-015: ônibus/motorista provisoriamente null na rota principal ----

    def _assert_onibus_e_motorista_null(self, rota_principal):
        self.assertIsNone(rota_principal["onibus"])
        self.assertIsNone(rota_principal["motorista"])

    async def test_detalhe_traz_onibus_e_motorista_null_na_rota_principal(self):
        self.service.detail.return_value = DETALHE_COM_ROTA_PRINCIPAL
        status, body = await self.call("GET", f"{BASE}/8")
        self.assertEqual(status, 200)
        self._assert_onibus_e_motorista_null(body["rota_principal_ida"])
        self._assert_onibus_e_motorista_null(body["rota_principal_volta"])

    async def test_detalhe_trajeto_direto_tambem_traz_onibus_e_motorista_null(self):
        self.service.detail.return_value = DETALHE_TRAJETO_DIRETO
        status, body = await self.call("GET", f"{BASE}/8")
        self.assertEqual(status, 200)
        self._assert_onibus_e_motorista_null(body["rota_principal_ida"])
        self.assertIsNone(body["rota_principal_volta"])

    async def test_detalhes_por_data_traz_onibus_e_motorista_null_na_rota_principal(self):
        self.service.detail_by_date.return_value = DETALHE_COM_ROTA_PRINCIPAL
        status, body = await self.call("GET", f"{BASE}/detalhes?data=2026-11-10")
        self.assertEqual(status, 200)
        self._assert_onibus_e_motorista_null(body["rota_principal_ida"])
        self._assert_onibus_e_motorista_null(body["rota_principal_volta"])

    async def test_meus_traz_onibus_e_motorista_null_na_rota_principal(self):
        self.service.my_bookings.return_value = {
            "agendamentos": [DETALHE_COM_ROTA_PRINCIPAL], "ativos": 1, "limite": 22,
        }
        status, body = await self.call("GET", f"{BASE}/meus")
        self.assertEqual(status, 200)
        agendamento = body["agendamentos"][0]
        self._assert_onibus_e_motorista_null(agendamento["rota_principal_ida"])
        self._assert_onibus_e_motorista_null(agendamento["rota_principal_volta"])

    async def test_put_sem_trechos_responde_cancelamento(self):
        self.service.update.return_value = SimpleNamespace(
            id=8, aluno_id=7, data=date(2026, 11, 10), usa_ida=True,
            usa_volta=False, status="CANCELADO", ponto_embarque_id=None,
            ies_destino_id=None, rota_complementar_ida_id=None,
            ies_origem_id=None, ponto_desembarque_id=None,
            rota_complementar_volta_id=None,
        )
        status, body = await self.call(
            "PUT", f"{BASE}/8",
            {"data": "2026-11-10", "usa_ida": False, "usa_volta": False},
        )
        self.assertEqual(status, 200)
        self.assertEqual(body["mensagem"], "Agendamento cancelado com sucesso")
        self.assertEqual(body["estado_dia"], "DISPONIVEL")


if __name__ == "__main__":
    unittest.main()
