"""Testes da HU-019: Consulta de Alocação Diária / Minha Viagem.

Cobertura:
  CA-01  Aluno com ida+volta alocados vê todos os dados de frota.
  CA-01  Aluno com apenas 1 turno recebe dados daquele turno e None no outro.
  CA-02 / FA-001  Agendamento ativo mas sem distribuição → AGUARDANDO_ALOCACAO.
  CA-03 / FA-002  Aluno realocado em rota diferente → foi_realocado=True.
  CA-04  Atualização em tempo real após redistribuição.
  Controle de acesso e isolamento.
"""

import asyncio
import unittest
from datetime import date, time
from unittest.mock import MagicMock, patch

from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from tests.rota_principal_support import asgi_request
from src.modulos.alocacao_diaria.interface.http import alocacao_routes as routes
from src.modulos.alocacao_diaria.application.services.minha_viagem_service import (
    MinhaViagemService,
)
from src.shared.auth.dependencies import require_roles
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.infrastructure.db import Base

# ---------------------------------------------------------------------------
# Helpers — cliente HTTP com override de auth
# ---------------------------------------------------------------------------


def _build_app(session_override=None, user_override=None):
    """Monta uma instância de FastAPI com as dependências mockadas."""
    from src.shared.infrastructure.db import get_session

    app = FastAPI()
    app.include_router(routes.router)

    if session_override:
        app.dependency_overrides[get_session] = lambda: session_override

    if user_override is not None:
        # Sobrescreve TODAS as dependências de require_roles
        for cargo in CargoEnum:
            dep = require_roles(cargo.value)
            app.dependency_overrides[dep] = lambda u=user_override: u

    return app


def _aluno_user(aluno_id: int) -> dict:
    return {"current_user_id": str(aluno_id), "current_roles": ["aluno"]}


def _admin_user() -> dict:
    return {"current_user_id": "999", "current_roles": ["administrador"]}


# ---------------------------------------------------------------------------
# Testes unitários (mock do service)
# ---------------------------------------------------------------------------


class TestMinhaViagemUnit(unittest.TestCase):
    """Testes do endpoint /minha-viagem com service mockado."""

    def _request(self, app, path: str, method: str = "GET"):
        return asyncio.run(asgi_request(app, method, path))

    def _client_with_service(self, service_mock, aluno_id: int = 1):
        from src.shared.infrastructure.db import get_session
        from src.modulos.alocacao_diaria.application.services.minha_viagem_service import MinhaViagemService

        app = FastAPI()
        app.include_router(routes.router)

        # Injeta o mock no lugar do MinhaViagemService
        app.dependency_overrides[get_session] = lambda: MagicMock()
        # Precisa sobrescrever a factory
        app.dependency_overrides[routes._minha_viagem_service] = lambda: service_mock

        # Auth: aluno
        for dep in list(app.dependency_overrides):
            pass
        app.dependency_overrides[routes._aluno_required] = lambda: _aluno_user(aluno_id)
        # Bloqueia leitura por outros perfis
        app.dependency_overrides[routes._leitura_required] = lambda: _admin_user()

        return app

    # --- CA-01: sem agendamento ---
    def test_sem_agendamento_200(self):
        svc = MagicMock()
        svc.consultar.return_value = {
            "data": "2026-11-25",
            "possui_agendamento": False,
            "agendamento_id": None,
            "status_geral": "SEM_AGENDAMENTO",
            "mensagem": "Você não possui agendamento confirmado para esta data.",
            "foi_realocado": False,
            "aviso_realocacao": None,
            "ida": None,
            "volta": None,
            "consultado_em": "2026-11-15T22:00:00+00:00",
        }
        app = self._client_with_service(svc, aluno_id=5)
        status, body = self._request(app, "/alocacao-diaria/minha-viagem?data=2026-11-25")
        self.assertEqual(status, 200)
        self.assertFalse(body["possui_agendamento"])
        self.assertEqual(body["status_geral"], "SEM_AGENDAMENTO")
        self.assertIsNone(body["ida"])
        self.assertIsNone(body["volta"])
        # Garante que o aluno_id correto foi passado ao service
        svc.consultar.assert_called_once_with(5, date(2026, 11, 25))

    # --- CA-01: ida e volta alocados ---
    def test_ida_e_volta_alocados_200(self):
        TURNO_IDA = {
            "turno": "ida",
            "status_alocacao": "ALOCADO",
            "mensagem_status": "Alocado",
            "ponto": {"ponto_id": 1, "nome": "Praça Central", "bairro": "Centro"},
            "faculdade": {"id": 1, "nome": "UFC", "sigla": "UFC", "campus": "Quixadá"},
            "rota_complementar": None,
            "rota_id": 10,
            "nome_rota": "Rota Norte",
            "horario": "06:30",
            "onibus_id": "ABC1D23",
            "placa": "ABC1D23",
            "apelido_onibus": "Busão Norte",
            "motorista_id": 7,
            "nome_motorista": "João Silva",
            "tipo_lugar": "sentado",
            "foi_realocado": False,
            "aviso_realocacao": None,
        }
        TURNO_VOLTA = {**TURNO_IDA, "turno": "volta", "horario": "17:30",
                       "ponto": {"ponto_id": 2, "nome": "IFCE", "bairro": "Centro"}}
        svc = MagicMock()
        svc.consultar.return_value = {
            "data": "2026-11-25",
            "possui_agendamento": True,
            "agendamento_id": 42,
            "status_geral": "ALOCADO",
            "mensagem": None,
            "foi_realocado": False,
            "aviso_realocacao": None,
            "ida": TURNO_IDA,
            "volta": TURNO_VOLTA,
            "consultado_em": "2026-11-15T22:00:00+00:00",
        }
        app = self._client_with_service(svc, aluno_id=1)
        status, body = self._request(app, "/alocacao-diaria/minha-viagem?data=2026-11-25")
        self.assertEqual(status, 200)
        self.assertTrue(body["possui_agendamento"])
        self.assertEqual(body["status_geral"], "ALOCADO")
        self.assertEqual(body["ida"]["status_alocacao"], "ALOCADO")
        self.assertEqual(body["ida"]["nome_rota"], "Rota Norte")
        self.assertEqual(body["ida"]["nome_motorista"], "João Silva")
        self.assertEqual(body["ida"]["horario"], "06:30")
        self.assertIsNotNone(body["volta"])
        self.assertEqual(body["volta"]["horario"], "17:30")

    # --- CA-01: apenas um turno ---
    def test_apenas_ida_sem_volta(self):
        TURNO_IDA = {
            "turno": "ida", "status_alocacao": "ALOCADO", "mensagem_status": "Alocado",
            "ponto": None, "faculdade": None, "rota_complementar": None,
            "rota_id": 10, "nome_rota": "R", "horario": "06:30",
            "onibus_id": "X", "placa": "X", "apelido_onibus": None,
            "motorista_id": 1, "nome_motorista": "M", "tipo_lugar": "sentado",
            "foi_realocado": False, "aviso_realocacao": None,
        }
        svc = MagicMock()
        svc.consultar.return_value = {
            "data": "2026-11-25", "possui_agendamento": True, "agendamento_id": 1,
            "status_geral": "ALOCADO", "mensagem": None,
            "foi_realocado": False, "aviso_realocacao": None,
            "ida": TURNO_IDA, "volta": None,
            "consultado_em": "2026-11-15T22:00:00+00:00",
        }
        app = self._client_with_service(svc)
        status, body = self._request(app, "/alocacao-diaria/minha-viagem?data=2026-11-25")
        self.assertEqual(status, 200)
        self.assertIsNotNone(body["ida"])
        self.assertIsNone(body["volta"])

    # --- CA-02 / FA-001: aguardando alocação ---
    def test_aguardando_alocacao(self):
        TURNO_IDA = {
            "turno": "ida", "status_alocacao": "AGUARDANDO_ALOCACAO",
            "mensagem_status": "Aguardando alocação do veículo",
            "ponto": {"ponto_id": 1, "nome": "P", "bairro": "B"},
            "faculdade": {"id": 1, "nome": "UFC", "sigla": "UFC", "campus": "Q"},
            "rota_complementar": None,
            "rota_id": None, "nome_rota": None, "horario": None,
            "onibus_id": None, "placa": None, "apelido_onibus": None,
            "motorista_id": None, "nome_motorista": None, "tipo_lugar": None,
            "foi_realocado": False, "aviso_realocacao": None,
        }
        svc = MagicMock()
        svc.consultar.return_value = {
            "data": "2026-11-25", "possui_agendamento": True, "agendamento_id": 1,
            "status_geral": "AGUARDANDO_ALOCACAO", "mensagem": None,
            "foi_realocado": False, "aviso_realocacao": None,
            "ida": TURNO_IDA, "volta": None,
            "consultado_em": "2026-11-15T22:00:00+00:00",
        }
        app = self._client_with_service(svc)
        status, body = self._request(app, "/alocacao-diaria/minha-viagem?data=2026-11-25")
        self.assertEqual(status, 200)
        self.assertEqual(body["status_geral"], "AGUARDANDO_ALOCACAO")
        self.assertEqual(body["ida"]["status_alocacao"], "AGUARDANDO_ALOCACAO")
        self.assertEqual(body["ida"]["mensagem_status"], "Aguardando alocação do veículo")
        for campo in ("onibus_id", "placa", "motorista_id", "nome_motorista", "tipo_lugar"):
            self.assertIsNone(body["ida"][campo], f"esperado None em {campo}")

    # --- CA-03 / FA-002: realocado ---
    def test_foi_realocado(self):
        PLACA = "LSN4I49"
        svc = MagicMock()
        svc.consultar.return_value = {
            "data": "2026-11-25", "possui_agendamento": True, "agendamento_id": 7,
            "status_geral": "ALOCADO", "mensagem": None,
            "foi_realocado": True,
            "aviso_realocacao": f"Atenção: Você foi realocado. Seu ônibus para hoje é o veículo {PLACA}",
            "ida": {
                "turno": "ida", "status_alocacao": "ALOCADO", "mensagem_status": "Alocado",
                "ponto": None, "faculdade": None, "rota_complementar": None,
                "rota_id": 20, "nome_rota": "Rota Alternativa", "horario": "06:00",
                "onibus_id": PLACA, "placa": PLACA, "apelido_onibus": None,
                "motorista_id": 2, "nome_motorista": "Pedro", "tipo_lugar": "em_pe",
                "foi_realocado": True,
                "aviso_realocacao": f"Atenção: Você foi realocado. Seu ônibus para hoje é o veículo {PLACA}",
            },
            "volta": None,
            "consultado_em": "2026-11-15T22:00:00+00:00",
        }
        app = self._client_with_service(svc)
        status, body = self._request(app, "/alocacao-diaria/minha-viagem?data=2026-11-25")
        self.assertEqual(status, 200)
        self.assertTrue(body["foi_realocado"])
        self.assertIn(PLACA, body["aviso_realocacao"])
        self.assertTrue(body["ida"]["foi_realocado"])
        self.assertIn(PLACA, body["ida"]["aviso_realocacao"])

    # --- Isolamento: aluno A não vê dados de aluno B ---
    def test_isolamento_por_token(self):
        """O service recebe o aluno_id do token, não de um parâmetro externo."""
        svc = MagicMock()
        svc.consultar.return_value = {
            "data": "2026-11-25", "possui_agendamento": False,
            "agendamento_id": None, "status_geral": "SEM_AGENDAMENTO",
            "mensagem": "Você não possui agendamento confirmado para esta data.",
            "foi_realocado": False, "aviso_realocacao": None,
            "ida": None, "volta": None,
            "consultado_em": "2026-11-15T22:00:00+00:00",
        }
        # Token do aluno 42
        app = self._client_with_service(svc, aluno_id=42)
        self._request(app, "/alocacao-diaria/minha-viagem?data=2026-11-25")
        args, _ = svc.consultar.call_args
        self.assertEqual(args[0], 42, "aluno_id deve vir do token, não de query param")

    # --- data padrão = hoje ---
    def test_sem_data_usa_hoje(self):
        svc = MagicMock()
        svc.consultar.return_value = {
            "data": date.today().isoformat(), "possui_agendamento": False,
            "agendamento_id": None, "status_geral": "SEM_AGENDAMENTO",
            "mensagem": "Você não possui agendamento confirmado para esta data.",
            "foi_realocado": False, "aviso_realocacao": None,
            "ida": None, "volta": None,
            "consultado_em": "2026-11-15T22:00:00+00:00",
        }
        app = self._client_with_service(svc, aluno_id=1)
        status, body = self._request(app, "/alocacao-diaria/minha-viagem")
        self.assertEqual(status, 200)
        args, _ = svc.consultar.call_args
        # segundo argumento é a data
        self.assertEqual(args[1], date.today())

    # --- Acesso negado: admin tenta acessar /minha-viagem ---
    def test_admin_nao_acessa_minha_viagem(self):
        from src.shared.infrastructure.db import get_session
        app = FastAPI()
        app.include_router(routes.router)
        app.dependency_overrides[get_session] = lambda: MagicMock()
        app.dependency_overrides[routes._minha_viagem_service] = lambda: MagicMock()
        # Não sobrescreve _aluno_required — mantém o guard original
        status, body = self._request(app, "/alocacao-diaria/minha-viagem?data=2026-11-25")
        self.assertIn(status, (401, 403, 422))


# ---------------------------------------------------------------------------
# Testes de integração SQLite in-memory — MinhaViagemService
# ---------------------------------------------------------------------------


class TestMinhaViagemIntegracao(unittest.TestCase):
    """Testa o MinhaViagemService contra banco SQLite em memória."""

    @classmethod
    def setUpClass(cls):
        from src.modulos.alocacao_diaria.model.entities.alocacao import (
            AlocacaoDiariaORM,
            AlocacaoAlunoORM,
        )
        from src.modulos.agendamentos.model.entities.agendamento import AgendamentoORM
        from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
        from src.modulos.crud_basicos.domain.entities.onibus import OnibusORM
        from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
        from src.modulos.crud_basicos.domain.entities.ponto_de_parada import PontoDeParadaORM
        from src.modulos.motoristas.model.entities.motorista import MotoristaORM
        from src.modulos.rotas.model.entities.rota_principal import (
            RotaPrincipalORM,
            rota_principal_faculdade_ida,
            rota_principal_faculdade_volta,
            rota_principal_bairro,
        )
        from src.modulos.rotas.model.entities.rota_complementar import RotaComplementarORM
        from src.modulos.usuarios.model.entities.usuario import UsuarioORM
        from src.modulos.usuarios.model.entities.aluno import AlunoORM
        from src.modulos.arquivos.model.entities.arquivo import ArquivoORM
        from src.shared.infrastructure.audit_model import LogAuditoriaORM

        cls.AlocacaoDiariaORM = AlocacaoDiariaORM
        cls.AlocacaoAlunoORM = AlocacaoAlunoORM
        cls.AgendamentoORM = AgendamentoORM

        tabelas = [
            ArquivoORM.__table__,
            UsuarioORM.__table__,
            AlunoORM.__table__,
            FaculdadeORM.__table__,
            BairroORM.__table__,
            PontoDeParadaORM.__table__,
            MotoristaORM.__table__,
            OnibusORM.__table__,
            RotaPrincipalORM.__table__,
            rota_principal_bairro,
            rota_principal_faculdade_ida,
            rota_principal_faculdade_volta,
            RotaComplementarORM.__table__,
            AgendamentoORM.__table__,
            AlocacaoDiariaORM.__table__,
            AlocacaoAlunoORM.__table__,
            LogAuditoriaORM.__table__,
        ]
        cls.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(cls.engine, tables=tabelas)
        cls.Session = sessionmaker(bind=cls.engine)

    def setUp(self):
        self.session = self.Session()
        self._popular_banco()

    def tearDown(self):
        self.session.rollback()
        for table in reversed(Base.metadata.sorted_tables):
            try:
                self.session.execute(table.delete())
            except Exception:
                pass
        self.session.commit()
        self.session.close()

    def _popular_banco(self):
        from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
        from src.modulos.crud_basicos.domain.entities.onibus import OnibusORM
        from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
        from src.modulos.crud_basicos.domain.entities.ponto_de_parada import PontoDeParadaORM
        from src.modulos.motoristas.model.entities.motorista import MotoristaORM
        from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM
        from src.modulos.usuarios.model.entities.usuario import UsuarioORM
        from src.modulos.usuarios.model.entities.aluno import AlunoORM

        # Faculdades
        self.ies_a = FaculdadeORM(id_faculdade=1, nome_faculdade="IES_A", campus_faculdade="Quixadá", ativo=True)
        self.ies_b = FaculdadeORM(id_faculdade=2, nome_faculdade="IES_B", campus_faculdade="Ocara", ativo=True)
        self.session.add_all([self.ies_a, self.ies_b])

        # Bairro + Ponto
        bairro = BairroORM(bairro_id=1, nome="Centro", ativo=True)
        self.session.add(bairro)
        self.ponto = PontoDeParadaORM(ponto_id=1, nome="Praça Central", bairro_id=1, ativo=True)
        self.session.add(self.ponto)

        # Ônibus
        self.session.add(OnibusORM(placa_onibus="ORIG001", qtd_assentos=40, capacidade_maxima=10, ativo=True))
        self.session.add(OnibusORM(placa_onibus="ALOC002", qtd_assentos=40, capacidade_maxima=10, ativo=True))

        # Motoristas
        self.session.add(MotoristaORM(id=1, nome_completo="Motorista Teste", telefone="8599990001", telefone_hash="h1", ativo=True))
        self.session.add(MotoristaORM(id=2, nome_completo="Motorista Reserva", telefone="8599990003", telefone_hash="h3", ativo=True))

        # Rotas
        self.rota1 = RotaPrincipalORM(id=1, nome="Rota Original", horario_saida=time(6, 30), horario_retorno=time(17, 30), ativo=True)
        self.rota2 = RotaPrincipalORM(id=2, nome="Rota Alternativa", horario_saida=time(7, 0), horario_retorno=time(18, 0), ativo=True)
        self.rota1.faculdades_ida = [self.ies_a]
        self.rota1.faculdades_volta = [self.ies_a]
        self.rota2.faculdades_ida = [self.ies_b]
        self.rota2.faculdades_volta = [self.ies_b]
        self.session.add_all([self.rota1, self.rota2])

        # Usuário + Aluno
        self.session.add(UsuarioORM(id=10, nome_completo="Aluno HU019", email="hu019@test.com", telefone="8599990002", senha="hash"))
        self.session.add(AlunoORM(
            aluno_id=10, status_cadastro="ativado", faculdade_id=1,
            id_comprovante_matricula="uuid1", id_comprovante_residencia="uuid2",
            data_nascimento=19900101, identificacao_genero="M",
            tem_filhos=False, curso="Sistemas", raca="B", transgenero="N",
        ))
        self.session.flush()

    # --- CA-02 / FA-001: sem distribuição ---
    def test_sem_distribuicao_aguardando(self):
        self.session.add(self.AgendamentoORM(
            id=200, aluno_id=10, data=date(2026, 12, 1),
            usa_ida=True, usa_volta=False,
            ponto_embarque_id=1, ies_destino_id=1, status="ATIVO",
        ))
        self.session.commit()

        svc = MinhaViagemService(self.session)
        result = svc.consultar(10, date(2026, 12, 1))

        self.assertTrue(result["possui_agendamento"])
        self.assertEqual(result["status_geral"], "AGUARDANDO_ALOCACAO")
        self.assertIsNotNone(result["ida"])
        self.assertEqual(result["ida"]["status_alocacao"], "AGUARDANDO_ALOCACAO")
        self.assertEqual(result["ida"]["mensagem_status"], "Aguardando alocação do veículo")
        for campo in ("onibus_id", "placa", "motorista_id", "nome_motorista", "tipo_lugar"):
            self.assertIsNone(result["ida"][campo], f"esperado None em {campo}")
        self.assertIsNone(result["volta"])

    # --- CA-01: ida e volta alocados ---
    def test_ida_e_volta_alocados(self):
        ag = self.AgendamentoORM(
            id=201, aluno_id=10, data=date(2026, 12, 2),
            usa_ida=True, usa_volta=True,
            ponto_embarque_id=1, ies_destino_id=1,
            ponto_desembarque_id=1, ies_origem_id=1, status="ATIVO",
        )
        self.session.add(ag)
        self.session.flush()

        aloc_dia_ida = self.AlocacaoDiariaORM(
            id=1, rota_id=1, onibus_id="ORIG001", motorista_id=1,
            data=date(2026, 12, 2), turno="ida",
        )
        aloc_dia_volta = self.AlocacaoDiariaORM(
            id=2, rota_id=1, onibus_id="ORIG001", motorista_id=1,
            data=date(2026, 12, 2), turno="volta",
        )
        self.session.add_all([aloc_dia_ida, aloc_dia_volta])
        self.session.flush()

        self.session.add(self.AlocacaoAlunoORM(
            id=1, alocacao_diaria_id=1, agendamento_id=201,
            turno="ida", tipo_lugar="sentado", status="ALOCADO",
        ))
        self.session.add(self.AlocacaoAlunoORM(
            id=2, alocacao_diaria_id=2, agendamento_id=201,
            turno="volta", tipo_lugar="sentado", status="ALOCADO",
        ))
        self.session.commit()

        svc = MinhaViagemService(self.session)
        result = svc.consultar(10, date(2026, 12, 2))

        self.assertTrue(result["possui_agendamento"])
        self.assertEqual(result["status_geral"], "ALOCADO")
        # Ida
        self.assertEqual(result["ida"]["status_alocacao"], "ALOCADO")
        self.assertEqual(result["ida"]["placa"], "ORIG001")
        self.assertEqual(result["ida"]["nome_rota"], "Rota Original")
        self.assertEqual(result["ida"]["horario"], "06:30")
        self.assertEqual(result["ida"]["tipo_lugar"], "sentado")
        self.assertFalse(result["ida"]["foi_realocado"])
        # Volta
        self.assertEqual(result["volta"]["status_alocacao"], "ALOCADO")
        self.assertEqual(result["volta"]["horario"], "17:30")
        self.assertFalse(result["volta"]["foi_realocado"])

    # --- CA-03 / FA-002: realocado ---
    def test_realocado_em_rota_alternativa(self):
        """Aluno cujo agendamento é para a Rota 1 (IES_A), mas é alocado na Rota 2 (IES_B)."""
        ag = self.AgendamentoORM(
            id=202, aluno_id=10, data=date(2026, 12, 3),
            usa_ida=True, usa_volta=False,
            ponto_embarque_id=1, ies_destino_id=1, status="ATIVO",  # IES_A → Rota 1
        )
        self.session.add(ag)
        self.session.flush()

        # Alocado na Rota 2 (alternativa)
        aloc_dia = self.AlocacaoDiariaORM(
            id=10, rota_id=2, onibus_id="ALOC002", motorista_id=1,
            data=date(2026, 12, 3), turno="ida",
        )
        self.session.add(aloc_dia)
        self.session.flush()
        self.session.add(self.AlocacaoAlunoORM(
            id=10, alocacao_diaria_id=10, agendamento_id=202,
            turno="ida", tipo_lugar="em_pe", status="ALOCADO",
        ))
        self.session.commit()

        svc = MinhaViagemService(self.session)
        result = svc.consultar(10, date(2026, 12, 3))

        self.assertTrue(result["foi_realocado"])
        self.assertIn("ALOC002", result["aviso_realocacao"])
        self.assertIn("Atenção: Você foi realocado", result["aviso_realocacao"])
        self.assertTrue(result["ida"]["foi_realocado"])
        self.assertEqual(result["ida"]["tipo_lugar"], "em_pe")
        self.assertEqual(result["ida"]["nome_rota"], "Rota Alternativa")

    # --- CA-04: atualização em tempo real ---
    def test_atualizacao_em_tempo_real(self):
        """Admin refaz a distribuição — service sempre lê o estado atual."""
        ag = self.AgendamentoORM(
            id=203, aluno_id=10, data=date(2026, 12, 4),
            usa_ida=True, usa_volta=False,
            ponto_embarque_id=1, ies_destino_id=1, status="ATIVO",
        )
        self.session.add(ag)
        self.session.flush()

        # Primeira distribuição: Rota 1
        aloc_dia = self.AlocacaoDiariaORM(
            id=20, rota_id=1, onibus_id="ORIG001", motorista_id=1,
            data=date(2026, 12, 4), turno="ida",
        )
        self.session.add(aloc_dia)
        self.session.flush()
        aloc_aluno = self.AlocacaoAlunoORM(
            id=20, alocacao_diaria_id=20, agendamento_id=203,
            turno="ida", tipo_lugar="sentado", status="ALOCADO",
        )
        self.session.add(aloc_aluno)
        self.session.commit()

        svc = MinhaViagemService(self.session)
        result1 = svc.consultar(10, date(2026, 12, 4))
        self.assertEqual(result1["ida"]["placa"], "ORIG001")
        self.assertEqual(result1["ida"]["nome_rota"], "Rota Original")

        # Admin refaz distribuição: deleta o registro cancelado e insere novo
        self.session.delete(aloc_aluno)
        self.session.flush()
        aloc_dia2 = self.AlocacaoDiariaORM(
            id=21, rota_id=2, onibus_id="ALOC002", motorista_id=2,
            data=date(2026, 12, 4), turno="ida",
        )
        self.session.add(aloc_dia2)
        self.session.flush()
        self.session.add(self.AlocacaoAlunoORM(
            id=21, alocacao_diaria_id=21, agendamento_id=203,
            turno="ida", tipo_lugar="sentado", status="ALOCADO",
        ))
        self.session.commit()

        result2 = svc.consultar(10, date(2026, 12, 4))
        self.assertEqual(result2["ida"]["placa"], "ALOC002")
        self.assertEqual(result2["ida"]["nome_rota"], "Rota Alternativa")
        self.assertNotEqual(result1["ida"]["placa"], result2["ida"]["placa"])

    # --- Sem agendamento ---
    def test_sem_agendamento(self):
        svc = MinhaViagemService(self.session)
        result = svc.consultar(10, date(2030, 1, 1))

        self.assertFalse(result["possui_agendamento"])
        self.assertEqual(result["status_geral"], "SEM_AGENDAMENTO")
        self.assertIsNone(result["ida"])
        self.assertIsNone(result["volta"])

    # --- Agendamento cancelado não aparece ---
    def test_agendamento_cancelado_ignorado(self):
        self.session.add(self.AgendamentoORM(
            id=204, aluno_id=10, data=date(2026, 12, 5),
            usa_ida=True, usa_volta=False,
            ponto_embarque_id=1, ies_destino_id=1, status="CANCELADO",
        ))
        self.session.commit()

        svc = MinhaViagemService(self.session)
        result = svc.consultar(10, date(2026, 12, 5))
        self.assertFalse(result["possui_agendamento"])
        self.assertEqual(result["status_geral"], "SEM_AGENDAMENTO")

    # --- Isolamento: aluno 99 não vê dados do aluno 10 ---
    def test_isolamento_entre_alunos(self):
        self.session.add(self.AgendamentoORM(
            id=205, aluno_id=10, data=date(2026, 12, 6),
            usa_ida=True, usa_volta=False,
            ponto_embarque_id=1, ies_destino_id=1, status="ATIVO",
        ))
        self.session.commit()

        svc = MinhaViagemService(self.session)
        result = svc.consultar(99, date(2026, 12, 6))
        self.assertFalse(result["possui_agendamento"])

    # --- CA-01: parcialmente alocado ---
    def test_parcialmente_alocado(self):
        ag = self.AgendamentoORM(
            id=206, aluno_id=10, data=date(2026, 12, 7),
            usa_ida=True, usa_volta=True,
            ponto_embarque_id=1, ies_destino_id=1,
            ponto_desembarque_id=1, ies_origem_id=1, status="ATIVO",
        )
        self.session.add(ag)
        self.session.flush()

        # Apenas ida alocada
        aloc_dia = self.AlocacaoDiariaORM(
            id=30, rota_id=1, onibus_id="ORIG001", motorista_id=1,
            data=date(2026, 12, 7), turno="ida",
        )
        self.session.add(aloc_dia)
        self.session.flush()
        self.session.add(self.AlocacaoAlunoORM(
            id=30, alocacao_diaria_id=30, agendamento_id=206,
            turno="ida", tipo_lugar="sentado", status="ALOCADO",
        ))
        self.session.commit()

        svc = MinhaViagemService(self.session)
        result = svc.consultar(10, date(2026, 12, 7))

        self.assertEqual(result["status_geral"], "PARCIALMENTE_ALOCADO")
        self.assertEqual(result["ida"]["status_alocacao"], "ALOCADO")
        self.assertEqual(result["volta"]["status_alocacao"], "AGUARDANDO_ALOCACAO")


if __name__ == "__main__":
    unittest.main()
