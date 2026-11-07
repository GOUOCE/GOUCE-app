import unittest
from datetime import date, timedelta
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

from src.modulos.agendamentos.application.dtos.agendamento_dto import AgendamentoInputDTO
from src.modulos.agendamentos.application.errors import AgendamentoError
from src.modulos.agendamentos.application.use_cases.gerenciar_agendamentos_use_case import (
    GerenciarAgendamentosUseCase,
)
from src.modulos.agendamentos.infrastructure.repositories.agendamento_repository import (
    AgendamentoRepository,
)
from src.modulos.agendamentos.model.entities.agendamento import AgendamentoORM


class FakeQuery:
    def __init__(self, rows=None, first_value=None):
        self.rows = list(rows or [])
        self.first_value = first_value

    def filter(self, *args):
        return self

    def filter_by(self, **kwargs):
        return self

    def join(self, *args, **kwargs):
        return self

    def order_by(self, *args):
        return self

    def with_for_update(self):
        return self

    def first(self):
        return self.first_value

    def all(self):
        return self.rows

    def __iter__(self):
        return iter(self.rows)


def payload(**overrides):
    values = {
        "data": date(2026, 11, 10),
        "usa_ida": True,
        "usa_volta": False,
        "ponto_embarque_id": 1,
        "ies_destino_id": 2,
        "rota_complementar_ida_id": None,
        "ies_origem_id": None,
        "ponto_desembarque_id": None,
        "rota_complementar_volta_id": None,
    }
    values.update(overrides)
    return SimpleNamespace(**values, model_dump=lambda: values.copy())


class GerenciarAgendamentosUseCaseTest(unittest.TestCase):
    def setUp(self):
        self.session = MagicMock()
        self.service = GerenciarAgendamentosUseCase(AgendamentoRepository(self.session))
        self.today = date(2026, 11, 6)
        self.service._bounds = MagicMock(return_value=(self.today, self.today + timedelta(days=29)))

    def test_bounds_usa_janela_configurada(self):
        service = GerenciarAgendamentosUseCase(AgendamentoRepository(MagicMock()))
        with patch(
            "src.modulos.agendamentos.application.use_cases.gerenciar_agendamentos_use_case.datetime"
        ) as mocked_datetime:
            mocked_datetime.now.return_value.astimezone.return_value.date.return_value = self.today
            service.window_days = 30
            self.assertEqual(service._bounds(), (self.today, date(2026, 12, 5)))

    def test_data_fora_da_janela_e_rejeitada(self):
        for target in (self.today - timedelta(days=1), self.today + timedelta(days=30)):
            with self.subTest(target=target), self.assertRaises(AgendamentoError) as context:
                self.service.validate_date(target)
            self.assertEqual(context.exception.code, "DATA_FORA_DA_JANELA")
            self.assertEqual(context.exception.status_code, 422)

    def test_feriado_e_rejeitado_com_descricao(self):
        holiday = SimpleNamespace(descricao="Feriado municipal")
        self.session.query.return_value = FakeQuery(first_value=holiday)

        with self.assertRaises(AgendamentoError) as context:
            self.service.validate_date(self.today)

        self.assertEqual(context.exception.code, "DATA_INDISPONIVEL")
        self.assertIn("Feriado municipal", context.exception.message)

    def test_data_valida_nao_gera_erro(self):
        self.session.query.return_value = FakeQuery()
        self.service.validate_date(self.today)

    def test_active_for_day_exclui_registro_em_edicao(self):
        query = MagicMock()
        query.filter.return_value = query
        query.first.return_value = None
        self.session.query.return_value = query

        self.assertIsNone(
            self.service.repository.active_for_day(7, self.today, exclude_id=8)
        )
        self.assertEqual(query.filter.call_count, 2)

    def test_referencia_inexistente_ou_inativa_e_rejeitada(self):
        for item in (None, SimpleNamespace(ativo=False)):
            self.session.get.return_value = item
            with self.subTest(item=item), self.assertRaises(AgendamentoError) as context:
                self.service._validate_reference(9, "ponto_embarque_id", object)
            self.assertEqual(context.exception.code, "ITEM_INATIVO_OU_INEXISTENTE")
            self.assertEqual(context.exception.fields, ["ponto_embarque_id"])

    def test_referencia_ativa_e_retornada(self):
        item = SimpleNamespace(ativo=True)
        self.session.get.return_value = item
        self.assertIs(self.service._validate_reference(9, "campo", object), item)

    def test_rota_principal_inexistente_e_rejeitada(self):
        point = SimpleNamespace(ativo=True, bairro_id=3, nome="Ponto")
        faculty = SimpleNamespace(ativo=True, id_faculdade=4, nome_faculdade="IES")
        self.session.get.side_effect = [point, faculty]
        self.session.query.return_value = FakeQuery()

        with self.assertRaises(AgendamentoError) as context:
            self.service._validate_route(1, 2, "ida", None)

        self.assertEqual(context.exception.code, "FA-002")
        self.assertEqual(context.exception.fields, ["ponto_embarque_id", "ies_destino_id"])

    def test_rota_complementar_inexistente_e_rejeitada(self):
        point = SimpleNamespace(ativo=True, bairro_id=3, nome="Ponto")
        faculty = SimpleNamespace(ativo=True, id_faculdade=4, nome_faculdade="IES")
        route = SimpleNamespace(id=20)
        self.session.get.side_effect = [point, faculty, None]
        self.session.query.return_value = FakeQuery(first_value=route)

        with self.assertRaises(AgendamentoError) as context:
            self.service._validate_route(1, 2, "ida", 99)

        self.assertEqual(context.exception.code, "ITEM_INATIVO_OU_INEXISTENTE")
        self.assertEqual(context.exception.fields, ["rota_complementar_ida_id"])

    def test_rota_complementar_inativa_e_rejeitada(self):
        point = SimpleNamespace(ativo=True, bairro_id=3, nome="Ponto")
        faculty = SimpleNamespace(ativo=True, id_faculdade=4, nome_faculdade="IES")
        route = SimpleNamespace(id=20)
        complementary = SimpleNamespace(ativo=False, nome="Van")
        self.session.get.side_effect = [point, faculty, complementary]
        self.session.query.return_value = FakeQuery(first_value=route)

        with self.assertRaises(AgendamentoError) as context:
            self.service._validate_route(1, 2, "ida", 99)

        self.assertEqual(context.exception.code, "ITEM_INATIVO_OU_INEXISTENTE")
        self.assertIn("inativa", context.exception.message)

    def test_rota_complementar_de_outra_rota_e_rejeitada(self):
        point = SimpleNamespace(ativo=True, bairro_id=3, nome="Ponto")
        faculty = SimpleNamespace(ativo=True, id_faculdade=4, nome_faculdade="IES")
        complementary = SimpleNamespace(ativo=True, nome="Van", rota_principal_id=21)
        self.session.get.side_effect = [point, faculty, complementary]
        self.service.repository.route_for = MagicMock(return_value=None)

        with self.assertRaises(AgendamentoError) as context:
            self.service._validate_route(1, 2, "ida", 99)

        self.assertEqual(context.exception.code, "FA-002")

    def test_rota_complementar_seleciona_rota_principal_correta_entre_rotas_compativeis(self):
        point = SimpleNamespace(ativo=True, bairro_id=3, nome="Posto")
        faculty = SimpleNamespace(
            ativo=True, id_faculdade=1, nome_faculdade="Universidade Federal CE"
        )
        complementary = SimpleNamespace(
            ativo=True, nome="Serragem", rota_principal_id=3
        )
        matching_route = SimpleNamespace(id=3)
        self.session.get.side_effect = [point, faculty, complementary]
        self.service.repository.route_for = MagicMock(return_value=matching_route)

        self.service._validate_route(4, 1, "volta", 2)

        self.service.repository.route_for.assert_called_once_with(
            point, faculty, "volta", 3
        )

    def test_payload_rejeita_nenhum_trecho(self):
        with self.assertRaises(AgendamentoError) as context:
            self.service._validate_payload(7, payload(usa_ida=False, usa_volta=False))
        self.assertEqual(context.exception.code, "FA-003")
        self.assertEqual(context.exception.fields, ["usa_ida", "usa_volta"])

    def test_payload_rejeita_campos_obrigatorios_da_ida(self):
        self.service.validate_date = MagicMock()
        with self.assertRaises(AgendamentoError) as context:
            self.service._validate_payload(7, payload(ponto_embarque_id=None, ies_destino_id=None))
        self.assertEqual(context.exception.code, "FA-003")
        self.assertEqual(context.exception.fields, ["ponto_embarque_id", "ies_destino_id"])

    def test_payload_rejeita_campos_obrigatorios_da_volta(self):
        self.service.validate_date = MagicMock()
        with self.assertRaises(AgendamentoError) as context:
            self.service._validate_payload(
                7,
                payload(
                    usa_ida=False,
                    usa_volta=True,
                    ies_origem_id=None,
                    ponto_desembarque_id=None,
                ),
            )
        self.assertEqual(context.exception.code, "FA-003")
        self.assertEqual(context.exception.fields, ["ies_origem_id", "ponto_desembarque_id"])

    def test_payload_rejeita_agendamento_ativo_no_mesmo_dia(self):
        self.service.validate_date = MagicMock()
        self.session.query.return_value = FakeQuery(first_value=SimpleNamespace(id=11))
        with self.assertRaises(AgendamentoError) as context:
            self.service._validate_payload(7, payload())
        self.assertEqual(context.exception.code, "FA-001")
        self.assertEqual(context.exception.status_code, 409)

    def test_payload_permite_editar_o_mesmo_agendamento(self):
        self.service.validate_date = MagicMock()
        self.session.query.side_effect = [
            FakeQuery(first_value=None),
            FakeQuery(rows=[]),
        ]
        self.service._validate_route = MagicMock()
        self.service._validate_payload(7, payload(), exclude_id=11)
        self.service._validate_route.assert_called_once()

    def test_limite_conta_somente_ativos_a_partir_de_hoje(self):
        self.service.validate_date = MagicMock()
        self.session.query.side_effect = [
            FakeQuery(first_value=None),
            FakeQuery(rows=[SimpleNamespace(id=i) for i in range(22)]),
        ]
        with self.assertRaises(AgendamentoError) as context:
            self.service._validate_payload(7, payload())
        self.assertEqual(context.exception.code, "LIMITE_AGENDAMENTOS")

    def test_agendamentos_passados_nao_atingem_limite(self):
        self.service.validate_date = MagicMock()
        self.session.query.side_effect = [
            FakeQuery(first_value=None),
            FakeQuery(rows=[SimpleNamespace(id=i) for i in range(21)]),
        ]
        self.service._validate_route = MagicMock()
        self.service._validate_payload(7, payload())
        self.assertEqual(self.session.query.call_count, 2)

    def test_limite_nao_e_aplicado_na_edicao(self):
        self.service.validate_date = MagicMock()
        self.session.query.return_value = FakeQuery(first_value=None, rows=[object()] * 22)
        self.service._validate_route = MagicMock()
        self.service._validate_payload(7, payload(), exclude_id=11)
        self.assertEqual(self.session.query.call_count, 1)

    def test_criacao_registra_auditoria_e_faz_commit(self):
        self.service._validate_payload = MagicMock()
        self.session.query.return_value = FakeQuery()
        item = self.service.create(7, payload())

        self.assertIsInstance(item, AgendamentoORM)
        self.session.add.assert_called()
        self.session.commit.assert_called_once()
        self.assertEqual(self.session.add.call_count, 2)

    def test_integrity_error_na_criacao_faz_rollback_e_retorna_conflito(self):
        self.service._validate_payload = MagicMock()
        self.session.flush.side_effect = IntegrityError("insert", {}, Exception("duplicate"))

        with self.assertRaises(AgendamentoError) as context:
            self.service.create(7, payload())

        self.assertEqual(context.exception.code, "FA-001")
        self.session.rollback.assert_called_once()

    def test_edicao_de_agendamento_inexistente_e_rejeitada(self):
        self.session.query.return_value = FakeQuery()
        with self.assertRaises(AgendamentoError) as context:
            self.service.update(7, 8, payload())
        self.assertEqual(context.exception.code, "RESOURCE_NOT_FOUND")
        self.assertEqual(context.exception.status_code, 404)

    def test_edicao_sem_trechos_remete_ao_cancelamento(self):
        item = SimpleNamespace(id=8)
        self.session.query.return_value = FakeQuery(first_value=item)
        with self.assertRaises(AgendamentoError) as context:
            self.service.update(7, 8, payload(usa_ida=False, usa_volta=False))
        self.assertEqual(context.exception.code, "CANCELAMENTO_PENDENTE")
        self.assertEqual(context.exception.status_code, 409)

    def test_edicao_registra_valores_anterior_e_novo(self):
        item = SimpleNamespace(
            id=8,
            data=date(2026, 11, 10),
            usa_ida=True,
            usa_volta=False,
            ponto_embarque_id=1,
            ies_destino_id=2,
            rota_complementar_ida_id=None,
            ies_origem_id=None,
            ponto_desembarque_id=None,
            rota_complementar_volta_id=None,
        )
        self.session.query.return_value = FakeQuery(first_value=item)
        self.service._validate_payload = MagicMock()

        self.service.update(7, 8, payload(data=date(2026, 11, 11)))

        self.assertEqual(item.data, date(2026, 11, 11))
        self.session.commit.assert_called_once()
        self.assertEqual(self.session.add.call_count, 1)
        audit = self.session.add.call_args.args[0]
        self.assertEqual(audit.acao, "EDITAR")
        self.assertIn("2026-11-10", audit.valor_anterior)

    def test_edicao_reutiliza_todas_as_validacoes_do_payload_de_criacao(self):
        item = SimpleNamespace(id=8)
        self.service.repository.get_active = MagicMock(return_value=item)
        self.service.repository.update = MagicMock(return_value=item)
        self.service._validate_payload = MagicMock()
        data = payload()

        self.service.update(7, 8, data)

        self.service._validate_payload.assert_called_once_with(7, data, 8)

    def test_calendario_rejeita_mes_invalido(self):
        with self.assertRaises(AgendamentoError) as context:
            self.service.calendar(7, "2026-13")
        self.assertEqual(context.exception.code, "VALIDATION_ERROR")

    def test_calendario_retorna_vazio_fora_da_janela(self):
        self.assertEqual(self.service.calendar(7, "2026-10"), [])

    def test_calendario_classifica_feriado_agendado_disponivel_e_indisponivel(self):
        self.service._bounds = MagicMock(
            return_value=(self.today, self.today + timedelta(days=3))
        )
        holiday = SimpleNamespace(tipo="FERIADO", descricao="Municipal")
        booking = SimpleNamespace(data=self.today + timedelta(days=1))
        active_route = SimpleNamespace(id=1)
        self.session.query.side_effect = [
            FakeQuery(rows=[booking]),
            FakeQuery(first_value=active_route),
            FakeQuery(first_value=holiday),
            FakeQuery(),
            FakeQuery(),
            FakeQuery(),
        ]

        result = self.service.calendar(7, "2026-11")

        self.assertEqual(
            [(item["estado"], item["pode_agendar"]) for item in result],
            [
                ("FERIADO", False),
                ("AGENDADO", False),
                ("DISPONIVEL", True),
                ("DISPONIVEL", True),
            ],
        )
        self.assertEqual(result[0]["descricao"], "Municipal")

    def test_calendario_marca_dia_com_agendamento_sem_rota_como_indisponivel(self):
        self.service._bounds = MagicMock(return_value=(self.today, self.today))
        self.session.query.side_effect = [FakeQuery(), FakeQuery(), FakeQuery()]

        result = self.service.calendar(7, "2026-11")

        self.assertEqual(result[0]["estado"], "INDISPONIVEL")
        self.assertFalse(result[0]["pode_agendar"])

    def test_opcoes_consideram_somente_pontos_e_instituicoes_ativos(self):
        point_active = SimpleNamespace(
            ponto_id=1, nome="Ponto ativo", bairro_id=10, ativo=True
        )
        point_inactive = SimpleNamespace(
            ponto_id=2, nome="Ponto inativo", bairro_id=10, ativo=False
        )
        bairro = SimpleNamespace(
            pontos_de_parada=[point_active, point_inactive],
        )
        faculty_active = SimpleNamespace(
            id_faculdade=3, nome_faculdade="IES ativa", campus_faculdade="Centro", ativo=True
        )
        faculty_inactive = SimpleNamespace(
            id_faculdade=4, nome_faculdade="IES inativa", campus_faculdade="Sul", ativo=False
        )
        route = SimpleNamespace(
            horario_saida=date(2026, 11, 6),
            horario_retorno=date(2026, 11, 6),
            bairros=[bairro],
            faculdades_ida=[faculty_active, faculty_inactive],
            faculdades_volta=[faculty_active, faculty_inactive],
        )
        route.horario_saida = SimpleNamespace(strftime=lambda pattern: "06:00")
        route.horario_retorno = SimpleNamespace(strftime=lambda pattern: "18:00")
        self.session.query.return_value = FakeQuery(rows=[route])

        result = self.service.options(self.today)

        self.assertEqual(result["horarios_ida"], ["06:00"])
        self.assertEqual(result["horarios_volta"], ["18:00"])
        self.assertEqual(result["pontos"], [{"id": 1, "nome": "Ponto ativo", "bairro_id": 10}])
        self.assertEqual(len(result["ies_ida"]), 1)
        self.assertEqual(result["ies_ida"][0]["id"], 3)
        self.assertEqual(len(result["ies_volta"]), 1)

    def test_dto_rejeita_ids_nao_positivos_e_campos_extras(self):
        with self.assertRaises(ValidationError):
            AgendamentoInputDTO(
                data=self.today,
                usa_ida=True,
                usa_volta=False,
                ponto_embarque_id=0,
            )
        with self.assertRaises(ValidationError):
            AgendamentoInputDTO(
                data=self.today,
                usa_ida=True,
                usa_volta=False,
                ponto_embarque_id=1,
                campo_extra=True,
            )

    def test_dto_exige_data_e_flags_de_trecho(self):
        with self.assertRaises(ValidationError) as context:
            AgendamentoInputDTO()
        campos = {str(error["loc"][0]) for error in context.exception.errors()}
        self.assertEqual(campos, {"data", "usa_ida", "usa_volta"})

    def test_regras_de_integridade_do_modelo_estao_declaradas(self):
        checks = {constraint.name for constraint in AgendamentoORM.__table__.constraints}
        self.assertIn("ck_agendamento_um_trecho", checks)
        indexes = {index.name: index for index in AgendamentoORM.__table__.indexes}
        self.assertIn("uq_agendamento_aluno_data_ativo", indexes)
        self.assertIn("ix_agendamento_aluno_data_status", indexes)
        self.assertIsNotNone(AgendamentoORM.status.default)

    def test_modelo_tem_campos_de_cancelamento(self):
        self.assertIn("cancelled_at", AgendamentoORM.__table__.columns)
        self.assertIn("status", AgendamentoORM.__table__.columns)


if __name__ == "__main__":
    unittest.main()
