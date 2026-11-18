import unittest
from datetime import date
from types import SimpleNamespace

from src.modulos.agendamentos.model.entities.agendamento import AgendamentoORM
from src.modulos.alocacao_diaria.application.services.alocacao_service import (
    AlocacaoService,
    DistribuicaoError,
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

    def test_automatico_rejeita_aluno_em_rota_diferente(self):
        with self.assertRaises(DistribuicaoError) as contexto:
            self.service._validar_payload(self.data, [self._alocacao(rota_id=2)])

        self.assertIn("Rota Bairro", str(contexto.exception))

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


if __name__ == "__main__":
    unittest.main()
