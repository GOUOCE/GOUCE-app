"""Testes da HU-018: Visualização da Lista de Embarque.

Cobertura:
  CA-01 / CA-02  Controle de acesso e rota_id obrigatória para admin.
  CA-03          Consolidação por aluno, indicacao_turno, ordenação alfabética.
  CA-04 / CA-05  Lista vazia: mensagem, permite_imprimir=False.
  CA-06          Cancelamento de agendamento remove aluno da lista.
  CA-07 / RNF-010 Perfil aluno recebe 403.

Estratégia:
  - TestListaEmbarqueAcesso / TestListaEmbarqueAdmin / TestListaEmbarqueRepresentante:
      Testes HTTP da camada de rota via asgi_request com dependency_overrides.
      O ListaEmbarqueService é totalmente mockado (MagicMock).
  - TestListaEmbarqueCancelamento:
      Testes de integração de serviço com banco SQLite in-memory.
      Verifica que remove_allocations define status=CANCELADO e que
      a consulta listar() exclui corretamente os registros cancelados.
"""

import os
import unittest
from datetime import date, datetime, timezone
from unittest.mock import MagicMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test")

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from tests.rota_principal_support import asgi_request
from src.modulos.alocacao_diaria.interface.http import alocacao_routes as routes
from src.modulos.alocacao_diaria.application.services.lista_embarque_service import (
    ListaEmbarqueService,
)
from src.shared.auth.dependencies import require_roles
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.infrastructure.db import Base

BASE = "/alocacao-diaria"

# ---------------------------------------------------------------------------
# Dados de fixture para testes de rota
# ---------------------------------------------------------------------------

_DATA = "2026-11-20"

_ALUNO_ANA = {
    "aluno_id": 1,
    "agendamento_id": 10,
    "nome_aluno": "Ana Beatriz",
    "ponto_embarque": {"ponto_id": 1, "nome": "Praça Matriz", "bairro": "Centro"},
    "ponto_desembarque": {"ponto_id": 2, "nome": "IFCE", "bairro": "Centro"},
    "ies_ida": {"id": 1, "nome": "UFC", "sigla": "UFC", "campus": "Quixadá"},
    "ies_volta": {"id": 1, "nome": "UFC", "sigla": "UFC", "campus": "Quixadá"},
    "indicacao_turno": "IDA_E_VOLTA_MESMA_IES",
    "tipo_lugar_ida": "sentado",
    "tipo_lugar_volta": "sentado",
    "onibus_ida": "BRE-1234",
    "onibus_volta": "BRE-1234",
    "motorista_ida": "João Silva",
    "motorista_volta": "João Silva",
}

_ALUNO_CARLOS = {
    "aluno_id": 2,
    "agendamento_id": 11,
    "nome_aluno": "Carlos Eduardo",
    "ponto_embarque": {"ponto_id": 1, "nome": "Praça Matriz", "bairro": "Centro"},
    "ponto_desembarque": None,
    "ies_ida": {"id": 1, "nome": "UFC", "sigla": "UFC", "campus": "Quixadá"},
    "ies_volta": None,
    "indicacao_turno": "APENAS_IDA",
    "tipo_lugar_ida": "em_pe",
    "tipo_lugar_volta": None,
    "onibus_ida": "BRE-1234",
    "onibus_volta": None,
    "motorista_ida": "João Silva",
    "motorista_volta": None,
}

_ALUNO_MARIA_VOLTA = {
    "aluno_id": 3,
    "agendamento_id": 12,
    "nome_aluno": "Maria Clara",
    "ponto_embarque": None,
    "ponto_desembarque": {"ponto_id": 2, "nome": "IFCE", "bairro": "Centro"},
    "ies_ida": None,
    "ies_volta": {"id": 1, "nome": "UFC", "sigla": "UFC", "campus": "Quixadá"},
    "indicacao_turno": "APENAS_VOLTA",
    "tipo_lugar_ida": None,
    "tipo_lugar_volta": "sentado",
    "onibus_ida": None,
    "onibus_volta": "BRE-1234",
    "motorista_ida": None,
    "motorista_volta": "João Silva",
}

_ALUNO_PEDRO_IES_DISTINTAS = {
    "aluno_id": 4,
    "agendamento_id": 13,
    "nome_aluno": "Pedro Henrique",
    "ponto_embarque": {"ponto_id": 1, "nome": "Praça Matriz", "bairro": "Centro"},
    "ponto_desembarque": {"ponto_id": 3, "nome": "UECE", "bairro": "Centro"},
    "ies_ida": {"id": 1, "nome": "UFC", "sigla": "UFC", "campus": "Quixadá"},
    "ies_volta": {"id": 2, "nome": "IFCE", "sigla": "IFCE", "campus": "Quixadá"},
    "indicacao_turno": "IDA_E_VOLTA_IES_DISTINTAS",
    "tipo_lugar_ida": "sentado",
    "tipo_lugar_volta": "em_pe",
    "onibus_ida": "BRE-1234",
    "onibus_volta": "BRE-5678",
    "motorista_ida": "João Silva",
    "motorista_volta": "Pedro Lima",
}

_VEICULO = {
    "alocacao_id": 1,
    "turno": "ida",
    "onibus_placa": "BRE-1234",
    "motorista_nome": "João Silva",
    "total_sentados": 2,
    "total_em_pe": 1,
}


def _resposta_lista(alunos: list, total: int | None = None) -> dict:
    """Monta uma resposta válida de lista-embarque para uso em mocks."""
    total = total if total is not None else len(alunos)
    texto = f"{total} aluno{'s' if total != 1 else ''} alocado{'s' if total != 1 else ''}"
    return {
        "data": _DATA,
        "rota_id": 1,
        "nome_rota": "Rota Centro - UFC",
        "horario_saida": "06:30",
        "horario_retorno": "17:30",
        "veiculos_escalados": [_VEICULO],
        "total_alunos_alocados": total,
        "texto_contador": texto,
        "permite_imprimir": total > 0,
        "mensagem": None if total > 0 else "Essa rota não possui nenhum aluno alocado para este dia.",
        "ultima_sincronizacao": datetime.now(timezone.utc).isoformat(),
        "indicador_sincronizacao": "Atualizado agora",
        "alunos": alunos,
    }


# ---------------------------------------------------------------------------
# Base de testes de rota HTTP
# ---------------------------------------------------------------------------


class _BaseRouteTest(unittest.IsolatedAsyncioTestCase):
    """Monta um app FastAPI isolado sobrescrevendo o serviço e autenticação."""

    _ROLE: str = CargoEnum.ADMINISTRADOR.value
    _USER_ID: int = 99

    def setUp(self):
        self.mock_service = MagicMock(spec=ListaEmbarqueService)
        self.app = FastAPI()
        self.app.include_router(routes.router)
        self.app.dependency_overrides[routes._lista_service] = lambda: self.mock_service
        self._set_auth(self._ROLE, self._USER_ID)

    def _set_auth(self, role: str, user_id: int):
        fake_user = {
            "current_user_id": user_id,
            "current_role": role,
            "current_roles": [role],
        }
        # Sobrescreve a verificação combinada de roles
        self.app.dependency_overrides[routes._leitura_required] = lambda: fake_user
        self._current_user = fake_user

    async def call(self, path: str, method: str = "GET"):
        return await asgi_request(self.app, method, path)


# ---------------------------------------------------------------------------
# CA-01 / CA-02 / CA-07 — Controle de Acesso
# ---------------------------------------------------------------------------


class TestListaEmbarqueAcesso(_BaseRouteTest):
    """Testa bloqueio de aluno (403) e rota_id obrigatória para admin (422)."""

    def setUp(self):
        super().setUp()

    async def test_aluno_recebe_403(self):
        """CA-07 / RNF-010: perfil aluno não tem acesso à lista de embarque."""
        # Sobrescreve a dependência para simular que `_leitura_required` bloqueou
        from fastapi import HTTPException as FastAPIHTTPException

        def _aluno_bloqueado():
            raise FastAPIHTTPException(status_code=403, detail="Acesso negado.")

        self.app.dependency_overrides[routes._leitura_required] = _aluno_bloqueado
        status, body = await self.call(f"{BASE}/lista-embarque?data={_DATA}&rota_id=1")
        self.assertEqual(status, 403)

    async def test_admin_sem_rota_id_recebe_422(self):
        """CA-02: administrador sem rota_id recebe 422 com código ROTA_ID_OBRIGATORIO."""
        # Garante que o usuário é admin
        self._set_auth(CargoEnum.ADMINISTRADOR.value, 99)
        status, body = await self.call(f"{BASE}/lista-embarque?data={_DATA}")
        self.assertEqual(status, 422)
        self.assertEqual(body["detail"]["code"], "ROTA_ID_OBRIGATORIO")

    async def test_admin_com_rota_id_retorna_200(self):
        """CA-01: administrador com rota_id recebe a lista normalmente."""
        self._set_auth(CargoEnum.ADMINISTRADOR.value, 99)
        self.mock_service.listar.return_value = _resposta_lista([_ALUNO_ANA])
        status, body = await self.call(f"{BASE}/lista-embarque?data={_DATA}&rota_id=1")
        self.assertEqual(status, 200)
        self.mock_service.listar.assert_called_once_with(
            date.fromisoformat(_DATA), 1, None, faculdade_id=None
        )


# ---------------------------------------------------------------------------
# CA-03 / CA-04 / CA-05 — Admin consultando a lista
# ---------------------------------------------------------------------------


class TestListaEmbarqueAdmin(_BaseRouteTest):
    """Testa o fluxo do administrador consultando a lista de embarque."""

    _ROLE = CargoEnum.ADMINISTRADOR.value

    def setUp(self):
        super().setUp()
        self._set_auth(CargoEnum.ADMINISTRADOR.value, 99)

    async def test_lista_com_alunos_retorna_contadores_e_flags(self):
        """CA-03 / CA-05: com alunos, total correto e permite_imprimir=True."""
        alunos = [_ALUNO_ANA, _ALUNO_CARLOS, _ALUNO_MARIA_VOLTA, _ALUNO_PEDRO_IES_DISTINTAS]
        self.mock_service.listar.return_value = _resposta_lista(alunos)
        status, body = await self.call(f"{BASE}/lista-embarque?data={_DATA}&rota_id=1")
        self.assertEqual(status, 200)
        self.assertEqual(body["total_alunos_alocados"], 4)
        self.assertEqual(body["texto_contador"], "4 alunos alocados")
        self.assertTrue(body["permite_imprimir"])
        self.assertIsNone(body["mensagem"])

    async def test_lista_vazia_retorna_mensagem_e_sem_impressao(self):
        """CA-04: rota sem alunos retorna mensagem específica e permite_imprimir=False."""
        self.mock_service.listar.return_value = _resposta_lista([], total=0)
        status, body = await self.call(f"{BASE}/lista-embarque?data={_DATA}&rota_id=1")
        self.assertEqual(status, 200)
        self.assertEqual(body["total_alunos_alocados"], 0)
        self.assertEqual(body["texto_contador"], "0 alunos alocados")
        self.assertFalse(body["permite_imprimir"])
        self.assertEqual(
            body["mensagem"],
            "Essa rota não possui nenhum aluno alocado para este dia.",
        )

    async def test_singular_um_aluno_alocado(self):
        """CA-03: texto_contador no singular quando há exatamente 1 aluno."""
        self.mock_service.listar.return_value = _resposta_lista([_ALUNO_ANA], total=1)
        status, body = await self.call(f"{BASE}/lista-embarque?data={_DATA}&rota_id=1")
        self.assertEqual(status, 200)
        self.assertEqual(body["texto_contador"], "1 aluno alocado")

    async def test_indicacao_turno_ida_e_volta_mesma_ies(self):
        """CA-03: aluno com ida e volta para a mesma IES."""
        self.mock_service.listar.return_value = _resposta_lista([_ALUNO_ANA])
        _, body = await self.call(f"{BASE}/lista-embarque?data={_DATA}&rota_id=1")
        self.assertEqual(body["alunos"][0]["indicacao_turno"], "IDA_E_VOLTA_MESMA_IES")

    async def test_indicacao_turno_apenas_ida(self):
        """CA-03: aluno com apenas ida."""
        self.mock_service.listar.return_value = _resposta_lista([_ALUNO_CARLOS])
        _, body = await self.call(f"{BASE}/lista-embarque?data={_DATA}&rota_id=1")
        self.assertEqual(body["alunos"][0]["indicacao_turno"], "APENAS_IDA")

    async def test_indicacao_turno_apenas_volta(self):
        """CA-03: aluno com apenas volta."""
        self.mock_service.listar.return_value = _resposta_lista([_ALUNO_MARIA_VOLTA])
        _, body = await self.call(f"{BASE}/lista-embarque?data={_DATA}&rota_id=1")
        self.assertEqual(body["alunos"][0]["indicacao_turno"], "APENAS_VOLTA")

    async def test_indicacao_turno_ida_e_volta_ies_distintas(self):
        """CA-03: aluno com ida e volta para IES diferentes."""
        self.mock_service.listar.return_value = _resposta_lista([_ALUNO_PEDRO_IES_DISTINTAS])
        _, body = await self.call(f"{BASE}/lista-embarque?data={_DATA}&rota_id=1")
        self.assertEqual(body["alunos"][0]["indicacao_turno"], "IDA_E_VOLTA_IES_DISTINTAS")

    async def test_ordenacao_alfabetica_nome(self):
        """CA-03: alunos ordenados alfabeticamente pelo nome."""
        # Ordem esperada: Ana < Carlos < Maria < Pedro (serviço retorna já ordenado)
        alunos = [_ALUNO_ANA, _ALUNO_CARLOS, _ALUNO_MARIA_VOLTA, _ALUNO_PEDRO_IES_DISTINTAS]
        self.mock_service.listar.return_value = _resposta_lista(alunos)
        _, body = await self.call(f"{BASE}/lista-embarque?data={_DATA}&rota_id=1")
        nomes = [a["nome_aluno"] for a in body["alunos"]]
        self.assertEqual(nomes, ["Ana Beatriz", "Carlos Eduardo", "Maria Clara", "Pedro Henrique"])

    async def test_sincronizacao_presente_na_resposta(self):
        """CA-06: campos ultima_sincronizacao e indicador_sincronizacao presentes."""
        self.mock_service.listar.return_value = _resposta_lista([_ALUNO_ANA])
        _, body = await self.call(f"{BASE}/lista-embarque?data={_DATA}&rota_id=1")
        self.assertIn("ultima_sincronizacao", body)
        self.assertEqual(body["indicador_sincronizacao"], "Atualizado agora")

    async def test_filtro_turno_repassado_ao_service(self):
        """CA-03: parâmetro turno é repassado corretamente ao serviço."""
        self.mock_service.listar.return_value = _resposta_lista([_ALUNO_CARLOS])
        await self.call(f"{BASE}/lista-embarque?data={_DATA}&rota_id=1&turno=ida")
        self.mock_service.listar.assert_called_once_with(
            date.fromisoformat(_DATA), 1, "ida", faculdade_id=None
        )


# ---------------------------------------------------------------------------
# RN-015 — Representante vê apenas alunos da sua IES
# ---------------------------------------------------------------------------


class TestListaEmbarqueRepresentante(_BaseRouteTest):
    """Testa o fluxo do representante com filtro por faculdade responsável."""

    _ROLE = CargoEnum.REPRESENTANTE.value
    _USER_ID = 50
    _IES_ID = 1

    def setUp(self):
        super().setUp()
        self._set_auth(CargoEnum.REPRESENTANTE.value, self._USER_ID)
        self.mock_service.obter_representante.return_value = {
            "administrador_id": self._USER_ID,
            "id_faculdade_responsavel": self._IES_ID,
        }

    async def test_representante_ve_apenas_alunos_da_sua_ies(self):
        """RN-015: representante recebe apenas alunos vinculados à sua faculdade."""
        # Simula: dois alunos na rota, apenas 1 é da IES do representante
        self.mock_service.rotas_do_dia.return_value = [
            {"rota_id": 1, "nome_rota": "Rota Centro - UFC", "horario_saida": "06:30"}
        ]
        self.mock_service.listar.return_value = _resposta_lista([_ALUNO_ANA])
        status, body = await self.call(f"{BASE}/lista-embarque?data={_DATA}")
        self.assertEqual(status, 200)
        # Deve ter chamado listar com o faculdade_id correto
        self.mock_service.listar.assert_called_once_with(
            date.fromisoformat(_DATA), 1, None, faculdade_id=self._IES_ID
        )
        self.assertEqual(len(body["alunos"]), 1)
        self.assertEqual(body["alunos"][0]["nome_aluno"], "Ana Beatriz")

    async def test_representante_sem_vinculo_ativo_recebe_403(self):
        """CA-07: representante sem vínculo ativo recebe 403."""
        self.mock_service.obter_representante.return_value = None
        status, body = await self.call(f"{BASE}/lista-embarque?data={_DATA}&rota_id=1")
        self.assertEqual(status, 403)

    async def test_representante_sem_faculdade_recebe_403(self):
        """CA-07: representante sem faculdade_responsavel recebe 403."""
        self.mock_service.obter_representante.return_value = {
            "administrador_id": self._USER_ID,
            "id_faculdade_responsavel": None,
        }
        status, body = await self.call(f"{BASE}/lista-embarque?data={_DATA}&rota_id=1")
        self.assertEqual(status, 403)

    async def test_representante_auto_descobre_rota_unica(self):
        """CA-01: representante sem rota_id usa a rota descoberta automaticamente."""
        self.mock_service.rotas_do_dia.return_value = [
            {"rota_id": 7, "nome_rota": "Rota Integrada", "horario_saida": "07:00"}
        ]
        self.mock_service.listar.return_value = _resposta_lista([_ALUNO_ANA])
        status, body = await self.call(f"{BASE}/lista-embarque?data={_DATA}")
        self.assertEqual(status, 200)
        # Deve ter chamado listar com o rota_id descoberto
        self.mock_service.listar.assert_called_once_with(
            date.fromisoformat(_DATA), 7, None, faculdade_id=self._IES_ID
        )

    async def test_representante_multiplas_rotas_recebe_422(self):
        """CA-01: múltiplas rotas sem rota_id retorna 422 com lista de rotas."""
        self.mock_service.rotas_do_dia.return_value = [
            {"rota_id": 1, "nome_rota": "Rota A", "horario_saida": "06:30"},
            {"rota_id": 2, "nome_rota": "Rota B", "horario_saida": "07:00"},
        ]
        status, body = await self.call(f"{BASE}/lista-embarque?data={_DATA}")
        self.assertEqual(status, 422)
        self.assertEqual(body["detail"]["code"], "MULTIPLAS_ROTAS")
        self.assertEqual(len(body["detail"]["rotas_disponiveis"]), 2)

    async def test_representante_sem_rota_no_dia_recebe_404(self):
        """CA-01: nenhuma rota disponível para o representante retorna 404."""
        self.mock_service.rotas_do_dia.return_value = []
        status, _ = await self.call(f"{BASE}/lista-embarque?data={_DATA}")
        self.assertEqual(status, 404)

    async def test_representante_com_rota_id_explicita_usa_filtro_ies(self):
        """RN-015: mesmo com rota_id explícito, filtro da IES é aplicado."""
        self.mock_service.listar.return_value = _resposta_lista([_ALUNO_ANA])
        status, body = await self.call(f"{BASE}/lista-embarque?data={_DATA}&rota_id=1")
        self.assertEqual(status, 200)
        self.mock_service.listar.assert_called_once_with(
            date.fromisoformat(_DATA), 1, None, faculdade_id=self._IES_ID
        )


# ---------------------------------------------------------------------------
# CA-01 — Endpoint rotas-do-dia
# ---------------------------------------------------------------------------


class TestRotasDoDia(_BaseRouteTest):
    """Testa o endpoint auxiliar GET /rotas-do-dia."""

    def setUp(self):
        super().setUp()

    async def test_admin_recebe_todas_as_rotas(self):
        """CA-01: administrador recebe todas as rotas com alocação na data."""
        self._set_auth(CargoEnum.ADMINISTRADOR.value, 99)
        self.mock_service.rotas_do_dia.return_value = [
            {"rota_id": 1, "nome_rota": "Rota A", "horario_saida": "06:30"},
            {"rota_id": 2, "nome_rota": "Rota B", "horario_saida": "07:00"},
        ]
        status, body = await self.call(f"{BASE}/rotas-do-dia?data={_DATA}")
        self.assertEqual(status, 200)
        self.assertEqual(len(body["rotas"]), 2)
        self.mock_service.rotas_do_dia.assert_called_once_with(
            date.fromisoformat(_DATA), faculdade_id=None
        )

    async def test_representante_recebe_rotas_filtradas_por_ies(self):
        """CA-01: representante recebe apenas rotas vinculadas à sua IES."""
        self._set_auth(CargoEnum.REPRESENTANTE.value, 50)
        self.mock_service.obter_representante.return_value = {
            "administrador_id": 50,
            "id_faculdade_responsavel": 1,
        }
        self.mock_service.rotas_do_dia.return_value = [
            {"rota_id": 1, "nome_rota": "Rota A", "horario_saida": "06:30"},
        ]
        status, body = await self.call(f"{BASE}/rotas-do-dia?data={_DATA}")
        self.assertEqual(status, 200)
        self.assertEqual(len(body["rotas"]), 1)
        self.mock_service.rotas_do_dia.assert_called_once_with(
            date.fromisoformat(_DATA), faculdade_id=1
        )

    async def test_aluno_bloqueado_no_rotas_do_dia(self):
        """CA-07: perfil aluno não acessa rotas-do-dia."""
        from fastapi import HTTPException as FastAPIHTTPException

        def _bloqueado():
            raise FastAPIHTTPException(status_code=403, detail="Acesso negado.")

        self.app.dependency_overrides[routes._leitura_required] = _bloqueado
        status, _ = await self.call(f"{BASE}/rotas-do-dia?data={_DATA}")
        self.assertEqual(status, 403)


# ---------------------------------------------------------------------------
# CA-06 — Cancelamento de agendamento remove aluno da lista (nível de serviço)
# ---------------------------------------------------------------------------


class TestListaEmbarqueCancelamento(unittest.TestCase):
    """Verifica que remove_allocations seta status=CANCELADO e que listar()
    ignora os registros cancelados (integração com SQLite in-memory)."""

    @classmethod
    def setUpClass(cls):
        """Monta banco SQLite in-memory com as tabelas necessárias."""
        from src.modulos.alocacao_diaria.model.entities.alocacao import (
            AlocacaoDiariaORM,
            AlocacaoAlunoORM,
        )
        from src.modulos.agendamentos.model.entities.agendamento import AgendamentoORM
        from src.modulos.agendamentos.infrastructure.repositories.agendamento_repository import (
            AgendamentoRepository,
        )
        from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
        from src.modulos.crud_basicos.domain.entities.onibus import OnibusORM
        from src.modulos.motoristas.model.entities.motorista import MotoristaORM
        from src.modulos.rotas.model.entities.rota_principal import (
            RotaPrincipalORM,
            rota_principal_faculdade_ida,
            rota_principal_faculdade_volta,
        )
        from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
        from src.modulos.rotas.model.entities.rota_principal import rota_principal_bairro
        from src.modulos.usuarios.model.entities.usuario import UsuarioORM
        from src.modulos.usuarios.model.entities.aluno import AlunoORM
        from src.shared.infrastructure.audit_model import LogAuditoriaORM
        from src.modulos.arquivos.model.entities.arquivo import ArquivoORM

        cls.AlocacaoDiariaORM = AlocacaoDiariaORM
        cls.AlocacaoAlunoORM = AlocacaoAlunoORM
        cls.AgendamentoORM = AgendamentoORM
        cls.AgendamentoRepository = AgendamentoRepository

        tabelas = [
            ArquivoORM.__table__,
            UsuarioORM.__table__,
            AlunoORM.__table__,
            BairroORM.__table__,
            FaculdadeORM.__table__,
            MotoristaORM.__table__,
            OnibusORM.__table__,
            RotaPrincipalORM.__table__,
            rota_principal_bairro,
            rota_principal_faculdade_ida,
            rota_principal_faculdade_volta,
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
        # Limpa todas as tabelas para o próximo teste
        for table in reversed(Base.metadata.sorted_tables):
            try:
                self.session.execute(table.delete())
            except Exception:
                pass
        self.session.commit()
        self.session.close()

    def _popular_banco(self):
        """Insere massa de dados mínima para testar cancelamento + lista."""
        from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
        from src.modulos.crud_basicos.domain.entities.onibus import OnibusORM
        from src.modulos.motoristas.model.entities.motorista import MotoristaORM
        from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM
        from src.modulos.usuarios.model.entities.usuario import UsuarioORM
        from src.modulos.usuarios.model.entities.aluno import AlunoORM
        from datetime import time

        # Faculdade
        self.session.add(FaculdadeORM(id_faculdade=1, nome_faculdade="UFC", campus_faculdade="Quixadá", ativo=True))
        # Usuário + Aluno
        self.session.add(UsuarioORM(id=10, nome_completo="Aluno Teste", email="aluno@test.com", telefone="88999999999", senha="hash"))
        self.session.add(AlunoORM(
            aluno_id=10, status_cadastro="ativado",
            faculdade_id=1, id_comprovante_matricula="uuid1",
            id_comprovante_residencia="uuid2",
            data_nascimento=19900101, identificacao_genero="M",
            tem_filhos=False, curso="Sistemas", raca="B", transgenero="N",
        ))
        # Ônibus
        self.session.add(OnibusORM(placa_onibus="BRE-0001", qtd_assentos=10, capacidade_maxima=5, ativo=True))
        # Motorista
        self.session.add(MotoristaORM(id=1, nome_completo="Motorista X", telefone="88988888888", telefone_hash="hash1", ativo=True))
        # Rota
        self.session.add(RotaPrincipalORM(id=1, nome="Rota Teste", horario_saida=time(6, 30), horario_retorno=time(17, 30), ativo=True))
        self.session.flush()

        # Agendamento ativo
        self.session.add(self.AgendamentoORM(
            id=100, aluno_id=10, data=date(2026, 11, 20),
            usa_ida=True, usa_volta=False,
            ies_destino_id=1, status="ATIVO",
        ))
        # Alocação diária
        self.session.add(self.AlocacaoDiariaORM(
            id=200, rota_id=1, onibus_id="BRE-0001",
            motorista_id=1, data=date(2026, 11, 20), turno="ida",
        ))
        self.session.flush()

        # Aluno alocado
        self.session.add(self.AlocacaoAlunoORM(
            id=300, alocacao_diaria_id=200, agendamento_id=100,
            turno="ida", tipo_lugar="sentado", status="ALOCADO",
        ))
        self.session.commit()

    def test_remove_allocations_define_status_cancelado(self):
        """CA-06: remove_allocations atualiza status para CANCELADO (não deleta)."""
        repo = self.AgendamentoRepository(self.session)
        agendamento = self.session.get(self.AgendamentoORM, 100)
        repo.remove_allocations(agendamento)
        self.session.flush()

        alocacao_aluno = self.session.get(self.AlocacaoAlunoORM, 300)
        self.assertIsNotNone(alocacao_aluno, "O registro não deve ser deletado")
        self.assertEqual(alocacao_aluno.status, "CANCELADO")

    def test_listar_ignora_alocacao_cancelada(self):
        """CA-06: aluno com alocacao_aluno CANCELADA não aparece na lista de embarque."""
        # Cancela a alocação manualmente (simula o que remove_allocations faz)
        self.session.query(self.AlocacaoAlunoORM).filter_by(id=300).update(
            {"status": "CANCELADO"}
        )
        self.session.commit()

        service = ListaEmbarqueService(self.session)
        result = service.listar(date(2026, 11, 20), rota_id=1)
        self.assertEqual(result["total_alunos_alocados"], 0)
        self.assertFalse(result["permite_imprimir"])
        self.assertEqual(
            result["mensagem"],
            "Essa rota não possui nenhum aluno alocado para este dia.",
        )

    def test_listar_exibe_aluno_com_alocacao_ativa(self):
        """CA-03: aluno com alocacao_aluno ALOCADA aparece na lista de embarque."""
        service = ListaEmbarqueService(self.session)
        result = service.listar(date(2026, 11, 20), rota_id=1)
        self.assertEqual(result["total_alunos_alocados"], 1)
        self.assertTrue(result["permite_imprimir"])
        self.assertIsNone(result["mensagem"])
        self.assertEqual(result["alunos"][0]["agendamento_id"], 100)

    def test_listar_ignora_agendamento_cancelado(self):
        """CA-06: agendamento com status CANCELADO é ignorado na lista."""
        self.session.query(self.AgendamentoORM).filter_by(id=100).update(
            {"status": "CANCELADO"}
        )
        self.session.commit()

        service = ListaEmbarqueService(self.session)
        result = service.listar(date(2026, 11, 20), rota_id=1)
        self.assertEqual(result["total_alunos_alocados"], 0)

    def test_cancel_completo_remove_da_lista(self):
        """CA-06: cancel() do repositório (que chama remove_allocations) faz o aluno
        desaparecer da lista de embarque imediatamente."""
        repo = self.AgendamentoRepository(self.session)
        agendamento = self.session.get(self.AgendamentoORM, 100)

        # Executa o cancelamento completo
        repo.cancel(aluno_id=10, item=agendamento)

        # Verifica na mesma sessão (após commit interno do cancel)
        service = ListaEmbarqueService(self.session)
        result = service.listar(date(2026, 11, 20), rota_id=1)
        self.assertEqual(result["total_alunos_alocados"], 0)
        self.assertFalse(result["permite_imprimir"])

    def test_indicacao_turno_apenas_ida(self):
        """CA-03: agendamento com apenas ida → indicacao_turno = APENAS_IDA."""
        service = ListaEmbarqueService(self.session)
        result = service.listar(date(2026, 11, 20), rota_id=1)
        self.assertEqual(result["alunos"][0]["indicacao_turno"], "APENAS_IDA")

    def test_rota_inexistente_levanta_erro_404(self):
        """CA-01: rota_id inexistente levanta ListaEmbarqueError com status 404."""
        from src.modulos.alocacao_diaria.application.services.lista_embarque_service import (
            ListaEmbarqueError,
        )
        service = ListaEmbarqueService(self.session)
        with self.assertRaises(ListaEmbarqueError) as ctx:
            service.listar(date(2026, 11, 20), rota_id=999)
        self.assertEqual(ctx.exception.status_code, 404)

    def test_rotas_do_dia_inclui_rotas_ativas_sem_alocacao_para_admin_e_fallback_ies(self):
        """CA-01 / FA-002: admin enxerga rotas ativas sem alocação e representante recebe fallback por IES."""
        from datetime import time
        from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
        from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM

        ufc = self.session.get(FaculdadeORM, 1)
        ifce = FaculdadeORM(id_faculdade=2, nome_faculdade="IFCE", campus_faculdade="Quixadá", ativo=True)
        self.session.add(ifce)

        rota_vazia_ufc = RotaPrincipalORM(
            id=2,
            nome="Rota Vazia UFC",
            horario_saida=time(7, 0),
            horario_retorno=time(18, 0),
            ativo=True,
            faculdades_ida=[ufc],
            faculdades_volta=[ufc],
        )
        rota_inativa = RotaPrincipalORM(
            id=3,
            nome="Rota Inativa",
            horario_saida=time(8, 0),
            horario_retorno=time(19, 0),
            ativo=False,
            faculdades_ida=[ufc],
            faculdades_volta=[ufc],
        )
        self.session.add_all([rota_vazia_ufc, rota_inativa])
        self.session.commit()

        service = ListaEmbarqueService(self.session)

        # Data sem alocação: admin vê rotas ativas (ids 1 e 2)
        rotas_admin = service.rotas_do_dia(date(2026, 11, 25), faculdade_id=None)
        self.assertEqual([r["rota_id"] for r in rotas_admin], [1, 2])

        # Data sem alocação: representante da UFC vê apenas rota ativa vinculada à UFC (id 2)
        rotas_rep_ufc = service.rotas_do_dia(date(2026, 11, 25), faculdade_id=1)
        self.assertEqual([r["rota_id"] for r in rotas_rep_ufc], [2])

        # Data sem alocação: representante do IFCE não recebe rota da UFC
        rotas_rep_ifce = service.rotas_do_dia(date(2026, 11, 25), faculdade_id=2)
        self.assertEqual(rotas_rep_ifce, [])

    # ------------------------------------------------------------------
    # Issue #481 — isolamento de IES por trecho em reservas mistas
    # (CT-HU018-API-006 / regressão CT-HU018-API-009)
    # ------------------------------------------------------------------

    def _popular_reserva_mista(self):
        """Aluno 11: ida na UFC (id 1) e volta no IFCE (id 2), mesma rota."""
        from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
        from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
        from src.modulos.crud_basicos.domain.entities.ponto_de_parada import PontoDeParadaORM
        from src.modulos.usuarios.model.entities.usuario import UsuarioORM

        PontoDeParadaORM.__table__.create(self.engine, checkfirst=True)

        self.session.add(FaculdadeORM(id_faculdade=2, nome_faculdade="IFCE", campus_faculdade="Quixadá", ativo=True))
        self.session.add(UsuarioORM(id=11, nome_completo="Aluno Misto", email="misto@test.com", telefone="88977777777", senha="hash"))
        self.session.add(BairroORM(bairro_id=1, nome="Centro", ativo=True))
        self.session.flush()
        self.session.add(PontoDeParadaORM(ponto_id=1, nome="Ponto Embarque", bairro_id=1, ativo=True))
        self.session.add(PontoDeParadaORM(ponto_id=2, nome="Ponto Desembarque", bairro_id=1, ativo=True))
        self.session.flush()

        self.session.add(self.AgendamentoORM(
            id=101, aluno_id=11, data=date(2026, 11, 20),
            usa_ida=True, usa_volta=True,
            ies_destino_id=1, ies_origem_id=2,
            ponto_embarque_id=1, ponto_desembarque_id=2,
            status="ATIVO",
        ))
        self.session.add(self.AlocacaoDiariaORM(
            id=201, rota_id=1, onibus_id="BRE-0001",
            motorista_id=1, data=date(2026, 11, 20), turno="volta",
        ))
        self.session.flush()
        self.session.add(self.AlocacaoAlunoORM(
            id=301, alocacao_diaria_id=200, agendamento_id=101,
            turno="ida", tipo_lugar="sentado", status="ALOCADO",
        ))
        self.session.add(self.AlocacaoAlunoORM(
            id=302, alocacao_diaria_id=201, agendamento_id=101,
            turno="volta", tipo_lugar="em_pe", status="ALOCADO",
        ))
        self.session.commit()

    def _aluno_misto(self, faculdade_id):
        service = ListaEmbarqueService(self.session)
        result = service.listar(date(2026, 11, 20), rota_id=1, faculdade_id=faculdade_id)
        encontrados = [a for a in result["alunos"] if a["agendamento_id"] == 101]
        self.assertEqual(len(encontrados), 1)
        return encontrados[0]

    def test_reserva_mista_representante_ufc_ve_apenas_ida(self):
        """#481 / CT-HU018-API-006: R1 (UFC) não recebe dados do trecho do IFCE."""
        self._popular_reserva_mista()
        aluno = self._aluno_misto(faculdade_id=1)
        self.assertEqual(aluno["ies_ida"]["id"], 1)
        self.assertIsNotNone(aluno["ponto_embarque"])
        self.assertEqual(aluno["tipo_lugar_ida"], "sentado")
        self.assertIsNone(aluno["ies_volta"])
        self.assertIsNone(aluno["ponto_desembarque"])
        self.assertIsNone(aluno["tipo_lugar_volta"])
        self.assertIsNone(aluno["onibus_volta"])
        self.assertIsNone(aluno["motorista_volta"])
        self.assertEqual(aluno["indicacao_turno"], "APENAS_IDA")

    def test_reserva_mista_representante_ifce_ve_apenas_volta(self):
        """#481 / CT-HU018-API-006: R2 (IFCE) não recebe dados do trecho da UFC."""
        self._popular_reserva_mista()
        aluno = self._aluno_misto(faculdade_id=2)
        self.assertEqual(aluno["ies_volta"]["id"], 2)
        self.assertIsNotNone(aluno["ponto_desembarque"])
        self.assertEqual(aluno["tipo_lugar_volta"], "em_pe")
        self.assertIsNone(aluno["ies_ida"])
        self.assertIsNone(aluno["ponto_embarque"])
        self.assertIsNone(aluno["tipo_lugar_ida"])
        self.assertIsNone(aluno["onibus_ida"])
        self.assertIsNone(aluno["motorista_ida"])
        self.assertEqual(aluno["indicacao_turno"], "APENAS_VOLTA")

    def test_reserva_mista_administrador_ve_visao_completa(self):
        """#481 / regressão CT-HU018-API-009: admin mantém ambos os trechos."""
        self._popular_reserva_mista()
        aluno = self._aluno_misto(faculdade_id=None)
        self.assertEqual(aluno["ies_ida"]["id"], 1)
        self.assertEqual(aluno["ies_volta"]["id"], 2)
        self.assertIsNotNone(aluno["ponto_embarque"])
        self.assertIsNotNone(aluno["ponto_desembarque"])
        self.assertEqual(aluno["indicacao_turno"], "IDA_E_VOLTA_IES_DISTINTAS")


if __name__ == "__main__":
    unittest.main()
