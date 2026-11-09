"""Testes de integração da HU-015 contra um PostgreSQL explicitamente isolado.

O módulo só é executado quando ``HU015_INTEGRATION_DATABASE_URL`` é definido e
aponta para o banco chamado ``hu015_integration``. Isso evita que a suíte
atinja acidentalmente o banco de desenvolvimento. As migrations devem ser
aplicadas separadamente no banco efêmero (``alembic upgrade head``) antes da
execução deste arquivo.

Cobre o que a migration 81 (updated_at em rota_principal/rota_complementar)
e o cálculo de ``atualizado_em`` em ``GerenciarAgendamentosUseCase`` precisam
de um banco real: o server_default ao criar, o onupdate do SQLAlchemy ao
editar e a ausência de mistura de datetime naive/aware quando o valor vem do
driver do PostgreSQL em vez de ser construído em Python.
"""

from __future__ import annotations

import os
import unittest
from datetime import datetime, time, timezone
from types import SimpleNamespace
from urllib.parse import urlparse
from uuid import uuid4

from sqlalchemy.orm import sessionmaker

INTEGRATION_DATABASE_URL = os.getenv("HU015_INTEGRATION_DATABASE_URL")


def _is_isolated_database_url(url: str) -> bool:
    parsed = urlparse(url)
    database_name = parsed.path.lstrip("/")
    return parsed.scheme.startswith("postgresql") and database_name == "hu015_integration"


if INTEGRATION_DATABASE_URL and not _is_isolated_database_url(INTEGRATION_DATABASE_URL):
    raise RuntimeError(
        "HU015_INTEGRATION_DATABASE_URL deve apontar somente para o banco "
        "PostgreSQL isolado chamado hu015_integration."
    )

if INTEGRATION_DATABASE_URL:
    # db.py valida DATABASE_URL no import e cria o engine global a partir dela.
    os.environ["DATABASE_URL"] = INTEGRATION_DATABASE_URL
    os.environ.setdefault("SECRET_KEY_JWT", "hu015-integration-only-secret")

    from src.modulos.agendamentos.application.use_cases.gerenciar_agendamentos_use_case import (
        GerenciarAgendamentosUseCase,
    )
    from src.modulos.agendamentos.infrastructure.repositories.agendamento_repository import (
        AgendamentoRepository,
    )
    from src.modulos.rotas.application.use_cases.gerenciar_rotas_complementares_use_case import (
        GerenciarRotasComplementaresUseCase,
    )
    from src.modulos.rotas.application.use_cases.gerenciar_rotas_principais_use_case import (
        GerenciarRotasPrincipaisUseCase,
    )
    from src.modulos.rotas.infrastructure.repositories.rota_complementar_repository import (
        RotaComplementarRepository,
    )
    from src.modulos.rotas.infrastructure.repositories.rota_principal_repository import (
        RotaPrincipalRepository,
    )
    from src.modulos.rotas.model.entities.rota_complementar import RotaComplementarORM
    from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM
    from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
    from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
    from src.shared.infrastructure.db import engine
    from sqlalchemy import text


@unittest.skipUnless(
    INTEGRATION_DATABASE_URL,
    "defina HU015_INTEGRATION_DATABASE_URL para executar a integração PostgreSQL",
)
class AgendamentoHu015PostgreSQLIntegrationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.session_factory = sessionmaker(bind=engine)

    def setUp(self):
        self.session = self.session_factory()
        self.prefix = f"HU015 {uuid4().hex[:10]}"

        bairro = BairroORM(nome=f"{self.prefix} Centro", ativo=True)
        faculdade = FaculdadeORM(
            nome_faculdade=f"{self.prefix} UFC", campus_faculdade="Quixadá", ativo=True
        )
        self.session.add_all([bairro, faculdade])
        self.session.commit()
        self.bairro_id, self.faculdade_id = bairro.bairro_id, faculdade.id_faculdade
        self.executor = self._executor_id()

        self.principais = RotaPrincipalRepository(self.session)
        self.complementares = RotaComplementarRepository(self.session)
        self.uc_principal = GerenciarRotasPrincipaisUseCase(self.principais)
        self.uc_complementar = GerenciarRotasComplementaresUseCase(self.complementares)

    def tearDown(self):
        self.session.rollback()
        self.session.close()

        cleanup = self.session_factory()
        try:
            complementar_ids = list(
                cleanup.execute(
                    text("SELECT id FROM rota_complementar WHERE nome LIKE :prefixo"),
                    {"prefixo": f"{self.prefix}%"},
                ).scalars()
            )
            principal_ids = list(
                cleanup.execute(
                    text("SELECT id FROM rota_principal WHERE nome LIKE :prefixo"),
                    {"prefixo": f"{self.prefix}%"},
                ).scalars()
            )
            for entidade, ids in (
                ("rota_complementar", complementar_ids),
                ("rota_principal", principal_ids),
            ):
                if ids:
                    cleanup.execute(
                        text(
                            "DELETE FROM log_auditoria WHERE entidade = :entidade "
                            "AND entidade_id::text = ANY(:ids)"
                        ),
                        {"entidade": entidade, "ids": [str(i) for i in ids]},
                    )
            if complementar_ids:
                cleanup.query(RotaComplementarORM).filter(
                    RotaComplementarORM.id.in_(complementar_ids)
                ).delete(synchronize_session=False)
            if principal_ids:
                cleanup.query(RotaPrincipalORM).filter(
                    RotaPrincipalORM.id.in_(principal_ids)
                ).delete(synchronize_session=False)
            cleanup.query(BairroORM).filter(
                BairroORM.bairro_id == self.bairro_id
            ).delete(synchronize_session=False)
            cleanup.query(FaculdadeORM).filter(
                FaculdadeORM.id_faculdade == self.faculdade_id
            ).delete(synchronize_session=False)
            cleanup.commit()
        finally:
            cleanup.close()

    def _executor_id(self) -> int:
        executor_id = self.session.execute(
            text("SELECT id FROM usuario ORDER BY id LIMIT 1")
        ).scalar_one_or_none()
        self.assertIsNotNone(executor_id)
        return int(executor_id)

    def test_updated_at_e_preenchido_pelo_server_default_na_criacao(self):
        principal = self.uc_principal.criar(
            nome=f"{self.prefix} Principal",
            horario_saida=time(6, 30),
            horario_retorno=time(17, 30),
            bairros_ids=[self.bairro_id],
            faculdades_ida_ids=[self.faculdade_id],
            faculdades_volta_ids=[self.faculdade_id],
            usuario_executor_id=self.executor,
        )
        complementar = self.uc_complementar.criar(
            nome=f"{self.prefix} Van",
            horario_saida=time(6, 0),
            horario_retorno=time(17, 40),
            ponto_conexao="Trevo do Bairro Novo",
            rota_principal_id=principal["id"],
            usuario_executor_id=self.executor,
        )

        principal_orm = self.session.get(RotaPrincipalORM, principal["id"])
        complementar_orm = self.session.get(RotaComplementarORM, complementar["id"])

        for registro in (principal_orm, complementar_orm):
            self.assertIsNotNone(registro.updated_at)
            self.assertIsNotNone(registro.updated_at.tzinfo)

    def test_editar_rota_complementar_atualiza_updated_at(self):
        principal = self.uc_principal.criar(
            nome=f"{self.prefix} Principal",
            horario_saida=time(6, 30),
            horario_retorno=time(17, 30),
            bairros_ids=[self.bairro_id],
            faculdades_ida_ids=[self.faculdade_id],
            faculdades_volta_ids=[self.faculdade_id],
            usuario_executor_id=self.executor,
        )
        complementar = self.uc_complementar.criar(
            nome=f"{self.prefix} Van",
            horario_saida=time(6, 0),
            horario_retorno=time(17, 40),
            ponto_conexao="Trevo do Bairro Novo",
            rota_principal_id=principal["id"],
            usuario_executor_id=self.executor,
        )
        antes = self.session.get(RotaComplementarORM, complementar["id"]).updated_at

        self.uc_complementar.atualizar(
            complementar["id"],
            {"ponto_conexao": "Novo ponto de conexão"},
            self.executor,
        )
        self.session.expire_all()
        depois = self.session.get(RotaComplementarORM, complementar["id"]).updated_at

        self.assertGreaterEqual(depois, antes)
        self.assertIsNotNone(depois.tzinfo)

    def test_version_do_detalhe_usa_o_updated_at_mais_recente_sem_misturar_naive_e_aware(self):
        """``_version`` deve aceitar datetimes reais do driver junto com um valor
        construído em Python, escolhendo o mais recente sem levantar TypeError
        por misturar naive com aware (RNF do cache offline, item 4 do pedido)."""
        principal = self.uc_principal.criar(
            nome=f"{self.prefix} Principal",
            horario_saida=time(6, 30),
            horario_retorno=time(17, 30),
            bairros_ids=[self.bairro_id],
            faculdades_ida_ids=[self.faculdade_id],
            faculdades_volta_ids=[self.faculdade_id],
            usuario_executor_id=self.executor,
        )
        complementar = self.uc_complementar.criar(
            nome=f"{self.prefix} Van",
            horario_saida=time(6, 0),
            horario_retorno=time(17, 40),
            ponto_conexao="Trevo do Bairro Novo",
            rota_principal_id=principal["id"],
            usuario_executor_id=self.executor,
        )
        complementar_orm = self.session.get(RotaComplementarORM, complementar["id"])
        principal_orm = self.session.get(RotaPrincipalORM, principal["id"])

        item_antigo = SimpleNamespace(
            updated_at=datetime(2000, 1, 1, tzinfo=timezone.utc)
        )

        use_case = GerenciarAgendamentosUseCase(AgendamentoRepository(self.session))
        versao = use_case._version(item_antigo, complementar_orm, principal_orm)

        self.assertIsNotNone(versao.tzinfo)
        self.assertEqual(versao, max(complementar_orm.updated_at, principal_orm.updated_at))


if __name__ == "__main__":
    unittest.main()
