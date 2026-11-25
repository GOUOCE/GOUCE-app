import unittest
from datetime import date
from types import SimpleNamespace

from src.modulos.agendamentos.model.entities.agendamento import AgendamentoORM
from src.modulos.alocacao_diaria.application.services.alocacao_service import (
    AlocacaoService,
    DistribuicaoError,
)
from src.modulos.alocacao_diaria.model.entities.rodizio_frota import (
    RodizioFrotaItemORM,
    RodizioFrotaORM,
)
from src.modulos.crud_basicos.domain.entities.onibus import OnibusORM
from src.modulos.motoristas.model.entities.motorista import MotoristaORM
from src.modulos.rotas.model.entities.rota_complementar import RotaComplementarORM
from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM


class _FakeQuery:
    def __init__(self, itens):
        self._itens = itens

    def filter(self, *args, **kwargs):
        return self

    def order_by(self, *args, **kwargs):
        return self

    def first(self):
        return self._itens[0] if self._itens else None

    def all(self):
        return self._itens

    def __iter__(self):
        return iter(self._itens)


class _FakeSession:
    def __init__(self, itens_por_modelo):
        self._itens_por_modelo = itens_por_modelo

    def query(self, modelo):
        return _FakeQuery(self._itens_por_modelo.get(modelo, []))


class AlocacaoServiceValidacaoTest(unittest.TestCase):
    def setUp(self):
        self.data = date(2026, 11, 18)
        self.rota_centro = SimpleNamespace(
            id=1,
            nome="Rota Centro",
            ativo=True,
            faculdades_ida=[SimpleNamespace(id_faculdade=10)],
            faculdades_volta=[],
        )
        self.rota_bairro = SimpleNamespace(
            id=2,
            nome="Rota Bairro",
            ativo=True,
            faculdades_ida=[],
            faculdades_volta=[],
        )
        self.agendamento = SimpleNamespace(
            id=1,
            aluno_id=7,
            usa_ida=True,
            usa_volta=False,
            ies_destino_id=10,
            ies_origem_id=None,
            rota_complementar_ida_id=None,
            rota_complementar_volta_id=None,
            status="ATIVO",
        )
        self.onibus = SimpleNamespace(
            placa_onibus="ABC1D23",
            apelido_onibus="Ônibus Azul",
            qtd_assentos=40,
            capacidade_maxima=10,
            ativo=True,
        )
        self.motorista = SimpleNamespace(
            id=10,
            nome_completo="Carlos Silva",
            ativo=True,
        )
        self.service = AlocacaoService(
            _FakeSession(
                {
                    AgendamentoORM: [self.agendamento],
                    RotaPrincipalORM: [self.rota_centro, self.rota_bairro],
                    RotaComplementarORM: [],
                    OnibusORM: [self.onibus],
                    MotoristaORM: [self.motorista],
                }
            )
        )

    def _alocacao(self, rota_id=1, alunos=None):
        return {
            "rota_id": rota_id,
            "onibus_id": "ABC1D23",
            "motorista_id": 10,
            "turno": "ida",
            "alunos": alunos
            if alunos is not None
            else [{"agendamento_id": 1, "tipo_lugar": "sentado"}],
        }

    def test_manual_permite_realocar_aluno_entre_rotas(self):
        self.service._validar_payload(
            self.data,
            [self._alocacao(rota_id=2)],
            permitir_realocacao=True,
        )

    def test_conflito_de_onibus_indica_rota_e_veiculo(self):
        with self.assertRaises(DistribuicaoError) as contexto:
            self.service._validar_payload(
                self.data,
                [self._alocacao(rota_id=1), self._alocacao(rota_id=2, alunos=[])],
            )

        self.assertEqual(
            str(contexto.exception),
            "Rota Bairro: o ônibus Ônibus Azul já está alocado na rota Rota Centro no turno ida.",
        )

    def test_motorista_inativo_e_citado_pelo_nome_na_recusa(self):
        self.motorista.ativo = False

        with self.assertRaises(DistribuicaoError) as contexto:
            self.service._validar_payload(self.data, [self._alocacao(rota_id=1)])

        self.assertEqual(
            str(contexto.exception),
            "Rota Centro: o motorista Carlos Silva está inativo e não pode ser escalado.",
        )

    def test_motorista_inexistente_recebe_mensagem_generica(self):
        alocacao = self._alocacao(rota_id=1)
        alocacao["motorista_id"] = 999

        with self.assertRaises(DistribuicaoError) as contexto:
            self.service._validar_payload(self.data, [alocacao])

        self.assertEqual(
            str(contexto.exception),
            "Rota Centro: motorista inexistente ou inativo.",
        )

    def test_normaliza_placa_com_hifen(self):
        self.onibus.placa_onibus = "CMA4J33"
        alocacao = self._alocacao(rota_id=1)
        alocacao["onibus_id"] = "CMA-4J33"

        self.service._validar_payload(
            self.data,
            [alocacao],
            permitir_realocacao=True,
        )

        self.assertEqual(alocacao["onibus_id"], "CMA4J33")

    def test_realocacao_rejeita_onibus_fora_do_rodizio_da_semana(self):
        configuracao = SimpleNamespace(
            id=1,
            data_inicio=date(2026, 11, 23),
            semanas=4,
            ativo=True,
        )
        item = SimpleNamespace(
            rodizio_id=1,
            rota_id=1,
            onibus_id="LSN4I49",
            turno="ida",
        )
        self.service = AlocacaoService(
            _FakeSession(
                {
                    AgendamentoORM: [self.agendamento],
                    RotaPrincipalORM: [self.rota_centro, self.rota_bairro],
                    RotaComplementarORM: [],
                    OnibusORM: [self.onibus],
                    MotoristaORM: [self.motorista],
                    RodizioFrotaORM: [configuracao],
                    RodizioFrotaItemORM: [item],
                }
            )
        )
        alocacao = self._alocacao(rota_id=1)

        with self.assertRaisesRegex(
            DistribuicaoError,
            "não está cadastrado no rodízio desta semana",
        ):
            self.service._validar_payload(
                date(2026, 11, 24),
                [alocacao],
                permitir_realocacao=True,
            )

    def test_preview_sinaliza_onibus_fora_do_rodizio_da_semana(self):
        configuracao = SimpleNamespace(
            id=1,
            data_inicio=date(2026, 11, 23),
            semanas=4,
            ativo=True,
        )
        item = SimpleNamespace(
            rodizio_id=1,
            rota_id=1,
            onibus_id="LSN4I49",
            turno="ida",
        )
        self.service = AlocacaoService(
            _FakeSession(
                {
                    RodizioFrotaORM: [configuracao],
                    RodizioFrotaItemORM: [item],
                }
            )
        )

        alertas = self.service._alertas_fora_do_rodizio(
            date(2026, 11, 24),
            [{
                "rota_id": 1,
                "onibus_id": "CMA-4J33",
                "turno": "ida",
            }],
        )

        self.assertEqual(len(alertas), 1)
        self.assertEqual(
            alertas[0]["tipo"],
            "ONIBUS_DIFERENTE_DO_RODIZIO",
        )

    def test_distribuicao_de_dia_passado_e_recusada_sem_gravar(self):
        # Issue #542 (RN-004): o histórico de dias anteriores a hoje não pode ser alterado.
        self.service._hoje = lambda: date(2026, 11, 19)
        payload = SimpleNamespace(
            data=date(2026, 11, 18),
            modo="manual",
            alocacoes=[SimpleNamespace(model_dump=lambda: self._alocacao())],
        )

        with self.assertRaises(DistribuicaoError) as contexto:
            self.service.persist(payload)

        self.assertEqual(
            str(contexto.exception),
            "Não é possível alterar a distribuição de um dia que já passou.",
        )
        self.assertEqual(contexto.exception.status_code, 422)

    def test_distribuicao_de_hoje_nao_e_recusada_pela_regra_de_data(self):
        self.service._hoje = lambda: date(2026, 11, 18)
        payload = SimpleNamespace(data=date(2026, 11, 18), modo="manual", alocacoes=[])

        with self.assertRaises(DistribuicaoError) as contexto:
            self.service.persist(payload)

        # Cai na validação seguinte (lista vazia), não na regra de dia passado.
        self.assertEqual(str(contexto.exception), "A lista de alocações não pode ser vazia.")


if __name__ == "__main__":
    unittest.main()
