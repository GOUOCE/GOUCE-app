import json
import unittest
from datetime import date
from types import SimpleNamespace
from unittest.mock import MagicMock

from src.modulos.alocacao_diaria.application.dtos.alocacao_dto import (
    DistribuicaoRequestDTO,
)
from src.modulos.alocacao_diaria.application.services.alocacao_service import (
    AlocacaoService,
    DistribuicaoError,
)
from src.modulos.alocacao_diaria.model.entities.alocacao import AlocacaoDiariaORM
from src.shared.infrastructure.audit_model import LogAuditoriaORM


class _Query:
    def __init__(self, items):
        self.items = items

    def filter(self, *args):
        return self

    def all(self):
        return self.items

    def __iter__(self):
        return iter(self.items)


class AlocacaoHu017Test(unittest.TestCase):
    def test_confirmacao_manual_retorna_mensagem_de_escala(self):
        service = AlocacaoService(MagicMock())
        service._demanda = MagicMock()
        service._validar_payload = MagicMock()
        service._persistir = MagicMock()
        payload = DistribuicaoRequestDTO(
            data=date(2026, 11, 18),
            modo="manual",
            alocacoes=[
                {
                    "rota_id": 1,
                    "onibus_id": "ABC1D23",
                    "motorista_id": 1,
                    "alunos": [],
                }
            ],
        )

        resultado = service.persist(payload)

        self.assertEqual(resultado["mensagem"], "Escala de motoristas confirmada com sucesso")

    def test_conflito_de_motorista_retorna_mensagem_do_requisito(self):
        session = MagicMock()
        session.query.side_effect = lambda model: _Query(
            {
                "AgendamentoORM": [],
                "RotaPrincipalORM": [SimpleNamespace(id=1)],
                "RotaComplementarORM": [],
                "OnibusORM": [
                    SimpleNamespace(placa_onibus="V1", qtd_assentos=3, capacidade_maxima=2),
                    SimpleNamespace(placa_onibus="V2", qtd_assentos=3, capacidade_maxima=2),
                ],
                "MotoristaORM": [SimpleNamespace(id=1, ativo=True)],
            }[model.__name__]
        )
        service = AlocacaoService(session)
        alocacoes = [
            {
                "rota_id": 1,
                "onibus_id": "V1",
                "motorista_id": 1,
                "turno": "ida",
                "alunos": [],
            },
            {
                "rota_id": 1,
                "onibus_id": "V2",
                "motorista_id": 1,
                "turno": "ida",
                "alunos": [],
            },
        ]

        with self.assertRaisesRegex(
            DistribuicaoError,
            "Este motorista já está escalado para outra rota neste horário",
        ) as raised:
            service._validar_payload(date(2026, 11, 18), alocacoes)

        self.assertEqual(raised.exception.status_code, 409)

    def test_confirmacao_registra_auditoria_da_escala(self):
        session = MagicMock()
        session.query.return_value.filter.return_value.all.return_value = []
        added = []

        def add(entity):
            added.append(entity)
            if isinstance(entity, AlocacaoDiariaORM):
                entity.id = 42

        session.add.side_effect = add
        service = AlocacaoService(session)

        service._persistir(
            date(2026, 11, 18),
            [
                {
                    "rota_id": 1,
                    "onibus_id": "ABC1D23",
                    "motorista_id": 1,
                    "turno": "ida",
                    "alunos": [],
                }
            ],
            usuario_executor_id=7,
        )

        logs = [entity for entity in added if isinstance(entity, LogAuditoriaORM)]
        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0].usuario_id, 7)
        self.assertEqual(logs[0].acao, "CONFIRMAR")
        self.assertEqual(logs[0].entidade, "alocacao_diaria")
        self.assertEqual(logs[0].entidade_id, 42)
        self.assertEqual(json.loads(logs[0].valor_novo)["onibus_id"], "ABC1D23")


if __name__ == "__main__":
    unittest.main()
