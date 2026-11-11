import unittest
from datetime import date, datetime, time, timedelta, timezone
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

    def test_fim_de_semana_e_rejeitado(self):
        for target in (date(2026, 11, 7), date(2026, 11, 8)):
            with self.subTest(target=target), self.assertRaises(AgendamentoError) as context:
                self.service.validate_date(target)
            self.assertEqual(context.exception.code, "DATA_INDISPONIVEL")
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

    def test_edicao_sem_trechos_efetiva_o_cancelamento(self):
        item = SimpleNamespace(
            id=8, aluno_id=7, data=date(2026, 11, 10), usa_ida=True,
            usa_volta=False, status="ATIVO", cancelled_at=None,
        )
        self.session.query.return_value = FakeQuery(first_value=item)
        result = self.service.update(7, 8, payload(usa_ida=False, usa_volta=False))
        self.assertIs(result, item)
        self.assertEqual(item.status, "CANCELADO")
        self.session.commit.assert_called_once()

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
        booking = SimpleNamespace(id=5, data=self.today + timedelta(days=1))
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
                ("INDISPONIVEL", False),
                ("DISPONIVEL", True),
            ],
        )
        self.assertEqual(result[0]["descricao"], "Municipal")
        self.assertEqual(result[2]["descricao"], "Fim de semana")

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

    # ---- HU-014: cancelamento, listagem e calendário ----

    def _booking(self, **overrides):
        values = dict(
            id=8, aluno_id=7, data=self.today + timedelta(days=4), usa_ida=True,
            usa_volta=True, ponto_embarque_id=None, ies_destino_id=None,
            rota_complementar_ida_id=None, ies_origem_id=None,
            ponto_desembarque_id=None, rota_complementar_volta_id=None,
            status="ATIVO", cancelled_at=None,
            updated_at=datetime(2026, 11, 6, 8, 0, tzinfo=timezone.utc),
        )
        values.update(overrides)
        return SimpleNamespace(**values)

    def test_cancelar_agendamento_futuro_faz_cancelamento_logico_com_auditoria(self):
        item = self._booking()
        self.session.query.return_value = FakeQuery(first_value=item)
        self.service.cancel(7, 8)
        self.assertEqual(item.status, "CANCELADO")
        self.assertIsNotNone(item.cancelled_at)
        log = self.session.add.call_args.args[0]
        self.assertEqual(log.acao, "CANCELAR")
        self.assertEqual(log.entidade_id, 8)
        self.assertEqual(log.usuario_id, 7)
        self.assertIn("ATIVO", log.valor_anterior)
        self.session.commit.assert_called_once()

    def test_cancelar_agendamento_de_hoje_e_permitido_sem_prazo_minimo(self):
        item = self._booking(data=self.today)
        self.session.query.return_value = FakeQuery(first_value=item)
        self.service.cancel(7, 8)
        self.assertEqual(item.status, "CANCELADO")

    def test_cancelar_agendamento_passado_retorna_422_sem_alterar(self):
        item = self._booking(data=self.today - timedelta(days=1))
        self.session.query.return_value = FakeQuery(first_value=item)
        with self.assertRaises(AgendamentoError) as context:
            self.service.cancel(7, 8)
        self.assertEqual(context.exception.code, "AGENDAMENTO_PASSADO")
        self.assertEqual(context.exception.status_code, 422)
        self.assertEqual(item.status, "ATIVO")
        self.session.commit.assert_not_called()

    def test_cancelar_agendamento_inexistente_de_outro_aluno_ou_ja_cancelado_retorna_404(self):
        self.session.query.return_value = FakeQuery(first_value=None)
        with self.assertRaises(AgendamentoError) as context:
            self.service.cancel(7, 99)
        self.assertEqual(context.exception.code, "RESOURCE_NOT_FOUND")
        self.assertEqual(context.exception.status_code, 404)

    def test_falha_no_commit_faz_rollback_e_nao_cancela_parcialmente(self):
        item = self._booking()
        self.session.query.return_value = FakeQuery(first_value=item)
        self.session.commit.side_effect = RuntimeError("db fora do ar")
        with self.assertRaises(RuntimeError):
            self.service.cancel(7, 8)
        self.session.rollback.assert_called_once()

    def test_gancho_de_alocacao_e_chamado_antes_do_cancelamento(self):
        item = self._booking()
        self.session.query.return_value = FakeQuery(first_value=item)
        self.service.repository.remove_allocations = MagicMock()
        self.service.cancel(7, 8)
        self.service.repository.remove_allocations.assert_called_once_with(item)

    def test_falha_na_alocacao_impede_cancelamento(self):
        item = self._booking()
        self.session.query.return_value = FakeQuery(first_value=item)
        self.service.repository.remove_allocations = MagicMock(
            side_effect=RuntimeError("falha")
        )
        with self.assertRaises(RuntimeError):
            self.service.cancel(7, 8)
        self.assertEqual(item.status, "ATIVO")
        self.session.rollback.assert_called_once()

    def test_dia_cancelado_fica_livre_para_novo_agendamento(self):
        # active_for_day só considera status ATIVO; o índice único é parcial.
        self.session.query.return_value = FakeQuery(first_value=None)
        self.assertIsNone(self.service.active_for_day(7, self.today))
        index = {i.name: i for i in AgendamentoORM.__table__.indexes}[
            "uq_agendamento_aluno_data_ativo"
        ]
        self.assertIn("ATIVO", str(index.dialect_options["postgresql"]["where"]))

    def test_resumo_conta_ativos_futuros_e_informa_limite(self):
        self.session.query.return_value = FakeQuery(rows=[object()] * 3)
        self.assertEqual(self.service.summary(7), {"ativos": 3, "limite": 22})

    def test_meus_agendamentos_vazio_retorna_zero_ativos(self):
        self.session.query.return_value = FakeQuery()
        result = self.service.my_bookings(7)
        self.assertEqual(result, {"agendamentos": [], "ativos": 0, "limite": 22})

    def test_detalhe_futuro_permite_remover_e_editar(self):
        self.session.query.return_value = FakeQuery(first_value=self._booking())
        self.session.get.return_value = None
        result = self.service.detail(7, 8)
        self.assertTrue(result["pode_remover"])
        self.assertTrue(result["pode_editar"])

    def test_detalhe_passado_nao_permite_remover_nem_editar(self):
        item = self._booking(data=self.today - timedelta(days=2))
        self.session.query.return_value = FakeQuery(first_value=item)
        self.session.get.return_value = None
        result = self.service.detail(7, 8)
        self.assertFalse(result["pode_remover"])
        self.assertFalse(result["pode_editar"])

    def test_detalhe_de_agendamento_inexistente_retorna_404(self):
        self.session.query.return_value = FakeQuery()
        with self.assertRaises(AgendamentoError) as context:
            self.service.detail(7, 1)
        self.assertEqual(context.exception.status_code, 404)

    # ---- HU-015: resumo de rota complementar/principal e consulta por data ----

    def test_detalhe_completo_traz_resumo_das_rotas_complementar_e_principal(self):
        item = self._booking(
            ponto_embarque_id=1, ies_destino_id=2, rota_complementar_ida_id=10,
            ponto_desembarque_id=3, ies_origem_id=4, rota_complementar_volta_id=20,
            updated_at=datetime(2026, 11, 1, tzinfo=timezone.utc),
        )
        self.session.query.return_value = FakeQuery(first_value=item)

        complementar_ida = SimpleNamespace(
            id=10, nome="Van Bairro Novo", horario_saida=time(6, 0),
            horario_retorno=time(17, 40), ponto_conexao="Trevo do Bairro Novo",
            rota_principal_id=100, updated_at=datetime(2026, 11, 5, tzinfo=timezone.utc),
        )
        complementar_volta = SimpleNamespace(
            id=20, nome="Van Centro", horario_saida=time(6, 30),
            horario_retorno=time(18, 10), ponto_conexao="Praça Central",
            rota_principal_id=200, updated_at=datetime(2026, 11, 2, tzinfo=timezone.utc),
        )
        principal_ida = SimpleNamespace(
            id=100, nome="Rota Centro", horario_saida=time(6, 30),
            horario_retorno=time(17, 30), updated_at=datetime(2026, 11, 3, tzinfo=timezone.utc),
            # Fora de ordem de propósito: espera-se saída ordenada por nome (RF da HU-015).
            faculdades_ida=[
                SimpleNamespace(id_faculdade=3, nome_faculdade="UFC",
                                 updated_at=datetime(2026, 10, 1, tzinfo=timezone.utc)),
                SimpleNamespace(id_faculdade=1, nome_faculdade="Católica",
                                 updated_at=datetime(2026, 10, 1, tzinfo=timezone.utc)),
                SimpleNamespace(id_faculdade=2, nome_faculdade="UECE",
                                 updated_at=datetime(2026, 10, 1, tzinfo=timezone.utc)),
            ],
        )
        principal_volta = SimpleNamespace(
            id=200, nome="Rota Integrada", horario_saida=time(7, 0),
            horario_retorno=time(18, 0), updated_at=datetime(2026, 11, 7, tzinfo=timezone.utc),
            # Rota de volta sem faculdades cadastradas: lista deve vir vazia, nunca null.
            faculdades_volta=[],
        )
        ponto_embarque = SimpleNamespace(
            nome="Ponto Embarque", updated_at=datetime(2026, 10, 1, tzinfo=timezone.utc)
        )
        ies_destino = SimpleNamespace(
            nome_faculdade="IES Destino", updated_at=datetime(2026, 10, 1, tzinfo=timezone.utc)
        )
        ponto_desembarque = SimpleNamespace(
            nome="Ponto Desembarque", updated_at=datetime(2026, 10, 1, tzinfo=timezone.utc)
        )
        ies_origem = SimpleNamespace(
            nome_faculdade="IES Origem", updated_at=datetime(2026, 10, 1, tzinfo=timezone.utc)
        )
        referencias = {
            1: ponto_embarque, 2: ies_destino, 3: ponto_desembarque, 4: ies_origem,
            10: complementar_ida, 20: complementar_volta,
        }
        self.service.repository.reference = MagicMock(
            side_effect=lambda model, value: referencias.get(value)
        )
        self.service.repository.route_for = MagicMock(
            side_effect=lambda point, faculty, direction, route_id: (
                principal_ida if direction == "ida" else principal_volta
            )
        )

        result = self.service.detail(7, 8)

        self.assertEqual(result["rota_complementar_ida"], {
            "id": 10, "nome": "Van Bairro Novo", "horario_saida": "06:00",
            "horario_retorno": "17:40", "ponto_conexao": "Trevo do Bairro Novo",
        })
        self.assertEqual(result["rota_complementar_volta"], {
            "id": 20, "nome": "Van Centro", "horario_saida": "06:30",
            "horario_retorno": "18:10", "ponto_conexao": "Praça Central",
        })
        self.assertEqual(result["rota_principal_ida"], {
            "id": 100, "nome": "Rota Centro", "horario_saida": "06:30",
            "horario_retorno": "17:30",
            "faculdades": [
                {"id": 1, "nome": "Católica"},
                {"id": 2, "nome": "UECE"},
                {"id": 3, "nome": "UFC"},
            ],
        })
        self.assertEqual(result["rota_principal_volta"], {
            "id": 200, "nome": "Rota Integrada", "horario_saida": "07:00",
            "horario_retorno": "18:00", "faculdades": [],
        })
        # Maior updated_at entre agendamento, rotas, ponto/IES e faculdades resolvidas.
        self.assertEqual(result["atualizado_em"], datetime(2026, 11, 7, tzinfo=timezone.utc))

        chamadas = self.service.repository.route_for.call_args_list
        self.assertEqual(chamadas[0].args[2:], ("ida", 100))
        self.assertEqual(chamadas[1].args[2:], ("volta", 200))

        # Sem duplicidade: 1 fetch por ponto/IES/complementar, não 2 (ids 1,2,3,4,10,20).
        self.assertEqual(self.service.repository.reference.call_count, 6)

    def test_detalhe_trajeto_direto_oculta_complementar_mas_mantem_principal(self):
        item = self._booking(
            ponto_embarque_id=1, ies_destino_id=2, rota_complementar_ida_id=None,
            usa_volta=False, ponto_desembarque_id=None, ies_origem_id=None,
            rota_complementar_volta_id=None,
        )
        self.session.query.return_value = FakeQuery(first_value=item)

        principal_ida = SimpleNamespace(
            id=5, nome="Rota Direta", horario_saida=time(6, 0),
            horario_retorno=time(17, 0), updated_at=item.updated_at,
            faculdades_ida=[
                SimpleNamespace(
                    id_faculdade=9, nome_faculdade="IES Qualquer", updated_at=item.updated_at
                )
            ],
        )
        self.service.repository.reference = MagicMock(
            return_value=SimpleNamespace(
                nome="Ponto Qualquer", nome_faculdade="IES Qualquer", updated_at=item.updated_at
            )
        )
        self.service.repository.route_for = MagicMock(return_value=principal_ida)

        result = self.service.detail(7, 8)

        self.assertIsNone(result["rota_complementar_ida"])
        self.assertIsNone(result["rota_complementar_volta"])
        self.assertEqual(result["rota_principal_ida"]["id"], 5)
        self.assertEqual(
            result["rota_principal_ida"]["faculdades"],
            [{"id": 9, "nome": "IES Qualquer"}],
        )
        self.assertIsNone(result["rota_principal_volta"])
        # Sem complementar, route_for é chamado sem vínculo fixo a uma rota (FA-001).
        self.service.repository.route_for.assert_called_once()
        self.assertIsNone(self.service.repository.route_for.call_args.args[3])

    # ---- HU-015 (issue #404): _version considera ponto/IES/faculdades ----

    def test_version_usa_updated_at_do_ponto_ou_ies_quando_mais_recente_que_as_rotas(self):
        item = self._booking(updated_at=datetime(2026, 11, 1, tzinfo=timezone.utc))
        rota = SimpleNamespace(updated_at=datetime(2026, 11, 2, tzinfo=timezone.utc))
        ponto_mais_recente = SimpleNamespace(
            nome="Ponto Renomeado", updated_at=datetime(2026, 11, 9, tzinfo=timezone.utc)
        )

        resultado = self.service._version(item, rota, ponto_mais_recente)

        self.assertEqual(resultado, datetime(2026, 11, 9, tzinfo=timezone.utc))

    def test_version_ignora_entidades_com_updated_at_none_sem_quebrar(self):
        item = self._booking(updated_at=datetime(2026, 11, 1, tzinfo=timezone.utc))
        sem_timestamp = SimpleNamespace(nome="Sem timestamp", updated_at=None)
        rota = SimpleNamespace(updated_at=datetime(2026, 11, 2, tzinfo=timezone.utc))

        resultado = self.service._version(item, None, sem_timestamp, rota)

        self.assertEqual(resultado, datetime(2026, 11, 2, tzinfo=timezone.utc))

    def test_version_nao_mistura_datetime_naive_com_aware(self):
        item = self._booking(updated_at=datetime(2026, 11, 1, tzinfo=timezone.utc))
        with self.assertRaises(TypeError):
            self.service._version(item, SimpleNamespace(updated_at=datetime(2026, 11, 2)))

    def test_detalhe_usa_faculdades_ida_na_ida_e_faculdades_volta_na_volta(self):
        """Garante que _version não troca as listas: ida usa faculdades_ida,
        volta usa faculdades_volta, nunca a lista do outro sentido."""
        item = self._booking(
            ponto_embarque_id=1, ies_destino_id=2, rota_complementar_ida_id=None,
            ponto_desembarque_id=3, ies_origem_id=4, rota_complementar_volta_id=None,
            updated_at=datetime(2026, 11, 1, tzinfo=timezone.utc),
        )
        self.session.query.return_value = FakeQuery(first_value=item)

        faculdade_ida_recente = SimpleNamespace(
            id_faculdade=1, nome_faculdade="Faculdade Ida",
            updated_at=datetime(2026, 11, 20, tzinfo=timezone.utc),
        )
        faculdade_volta_antiga = SimpleNamespace(
            id_faculdade=2, nome_faculdade="Faculdade Volta",
            updated_at=datetime(2026, 10, 1, tzinfo=timezone.utc),
        )
        principal_ida = SimpleNamespace(
            id=100, nome="Rota Ida", horario_saida=time(6, 0), horario_retorno=time(17, 0),
            updated_at=datetime(2026, 11, 1, tzinfo=timezone.utc),
            faculdades_ida=[faculdade_ida_recente],
            faculdades_volta=[SimpleNamespace(
                id_faculdade=99, nome_faculdade="Nao deveria entrar na ida",
                updated_at=datetime(2026, 11, 25, tzinfo=timezone.utc),
            )],
        )
        principal_volta = SimpleNamespace(
            id=200, nome="Rota Volta", horario_saida=time(7, 0), horario_retorno=time(18, 0),
            updated_at=datetime(2026, 11, 1, tzinfo=timezone.utc),
            faculdades_volta=[faculdade_volta_antiga],
            faculdades_ida=[SimpleNamespace(
                id_faculdade=98, nome_faculdade="Nao deveria entrar na volta",
                updated_at=datetime(2026, 11, 25, tzinfo=timezone.utc),
            )],
        )
        pontos_e_ies = SimpleNamespace(
            nome="Ref", nome_faculdade="Ref",
            updated_at=datetime(2026, 11, 1, tzinfo=timezone.utc),
        )
        self.service.repository.reference = MagicMock(return_value=pontos_e_ies)
        self.service.repository.route_for = MagicMock(
            side_effect=lambda point, faculty, direction, route_id: (
                principal_ida if direction == "ida" else principal_volta
            )
        )

        result = self.service.detail(7, 8)

        # A faculdade "não deveria entrar" (de 11-25) tem o maior updated_at de
        # todos, mas pertence ao sentido errado do resumo de cada rota: se
        # _version a incluísse por engano, o resultado seria 2026-11-25.
        self.assertEqual(result["atualizado_em"], datetime(2026, 11, 20, tzinfo=timezone.utc))

    def test_faculdades_da_rota_principal_sao_ordenadas_de_forma_estavel_por_nome_e_id(self):
        # Nomes iguais ignorando caixa: desempate estável pelo id (mesmo critério
        # usado em rota_principal_repository._ref_faculdade/por_nome).
        rota = SimpleNamespace(
            id=1, nome="Rota Teste", horario_saida=time(6, 0), horario_retorno=time(17, 0),
            faculdades_ida=[
                SimpleNamespace(id_faculdade=20, nome_faculdade="ufc"),
                SimpleNamespace(id_faculdade=5, nome_faculdade="UFC"),
                SimpleNamespace(id_faculdade=1, nome_faculdade="Alfa"),
            ],
        )

        resumo = self.service._principal_summary(rota, "ida")

        self.assertEqual(resumo["faculdades"], [
            {"id": 1, "nome": "Alfa"},
            {"id": 5, "nome": "UFC"},
            {"id": 20, "nome": "ufc"},
        ])

    def test_detail_by_date_retorna_detalhe_do_dia(self):
        item = self._booking()
        self.service.repository.get_active_by_date = MagicMock(return_value=item)
        self.service._detail = MagicMock(return_value={"id": 8})

        result = self.service.detail_by_date(7, "2026-11-10")

        self.service.repository.get_active_by_date.assert_called_once_with(
            7, date(2026, 11, 10)
        )
        self.assertEqual(result, {"id": 8})

    def test_detail_by_date_sem_agendamento_ativo_retorna_404(self):
        self.service.repository.get_active_by_date = MagicMock(return_value=None)
        with self.assertRaises(AgendamentoError) as context:
            self.service.detail_by_date(7, "2026-11-10")
        self.assertEqual(context.exception.code, "RESOURCE_NOT_FOUND")
        self.assertEqual(context.exception.status_code, 404)

    def test_detail_by_date_rejeita_data_com_calendario_invalido(self):
        with self.assertRaises(AgendamentoError) as context:
            self.service.detail_by_date(7, "2026-02-30")
        self.assertEqual(context.exception.code, "VALIDATION_ERROR")
        self.assertEqual(context.exception.status_code, 422)

    def test_detail_by_date_rejeita_formatos_invalidos(self):
        casos = [
            "10-11-2026",
            "20261110",
            "2026-W46-2",
            "2026-1-5",
            "2026-11-10T00:00",
            " 2026-11-10",
            "2026-11-10 ",
            "2026-11-10\n",
            "２０２６-11-10",
            "",
        ]
        for data in casos:
            with self.subTest(data=data):
                with self.assertRaises(AgendamentoError) as context:
                    self.service.detail_by_date(7, data)
                self.assertEqual(context.exception.code, "VALIDATION_ERROR")
                self.assertEqual(context.exception.status_code, 422)
                self.assertEqual(
                    context.exception.message,
                    "Data deve estar no formato YYYY-MM-DD.",
                )

    def test_get_active_by_date_retorna_no_maximo_um_agendamento(self):
        # uq_agendamento_aluno_data_ativo garante um único ATIVO por (aluno, data).
        query = MagicMock()
        query.filter_by.return_value = query
        query.first.return_value = SimpleNamespace(id=9)
        self.session.query.return_value = query

        resultado = self.service.repository.get_active_by_date(7, self.today)

        self.assertEqual(resultado.id, 9)
        query.filter_by.assert_called_once_with(
            aluno_id=7, data=self.today, status="ATIVO"
        )

    def test_calendario_inclui_dias_passados_com_agendamento_somente_leitura(self):
        self.service._bounds = MagicMock(
            return_value=(self.today, self.today + timedelta(days=1))
        )
        past = SimpleNamespace(id=3, data=self.today - timedelta(days=2))
        future = SimpleNamespace(id=4, data=self.today + timedelta(days=1))
        self.session.query.side_effect = [
            FakeQuery(rows=[past, future]),
            FakeQuery(first_value=SimpleNamespace(id=1)),
            FakeQuery(),
            FakeQuery(),
        ]

        result = self.service.calendar(7, "2026-11")

        by_date = {item["data"]: item for item in result}
        past_day = by_date[past.data]
        self.assertEqual(past_day["estado"], "AGENDADO")
        self.assertEqual(past_day["agendamento_id"], 3)
        self.assertFalse(past_day["pode_remover"])
        self.assertFalse(past_day["pode_editar"])
        future_day = by_date[future.data]
        self.assertEqual(future_day["agendamento_id"], 4)
        self.assertTrue(future_day["pode_remover"])
        self.assertTrue(future_day["pode_editar"])
        self.assertEqual(len(result), 3)
        free_day = by_date[self.today]
        self.assertIsNone(free_day["agendamento_id"])
        self.assertFalse(free_day["pode_remover"])

    def test_calendario_nao_lista_dias_passados_sem_agendamento(self):
        self.service._bounds = MagicMock(return_value=(self.today, self.today))
        self.session.query.side_effect = [FakeQuery(), FakeQuery(), FakeQuery()]
        result = self.service.calendar(7, "2026-11")
        self.assertEqual([item["data"] for item in result], [self.today])

    def test_calendario_view_inclui_contador_e_limite(self):
        self.service.calendar = MagicMock(return_value=[])
        self.session.query.return_value = FakeQuery(rows=[object()] * 2)
        result = self.service.calendar_view(7, "2026-11")
        self.assertEqual(
            result, {"mes": "2026-11", "dias": [], "ativos": 2, "limite": 22}
        )

    def test_modelo_tem_campos_de_cancelamento(self):
        self.assertIn("cancelled_at", AgendamentoORM.__table__.columns)
        self.assertIn("status", AgendamentoORM.__table__.columns)


if __name__ == "__main__":
    unittest.main()
