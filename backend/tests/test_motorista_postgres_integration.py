"""Testes de integração da HU-010 contra um PostgreSQL explicitamente isolado.

O módulo só é executado quando ``HU010_INTEGRATION_DATABASE_URL`` é definido.
Isso evita que a suíte aponte acidentalmente para o banco de desenvolvimento.
As migrations devem ser aplicadas separadamente no banco efêmero antes da
execução deste arquivo.
"""

from __future__ import annotations

import os
import unittest
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse
from uuid import uuid4

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session, sessionmaker


INTEGRATION_DATABASE_URL = os.getenv("HU010_INTEGRATION_DATABASE_URL")


def _is_isolated_database_url(url: str) -> bool:
    parsed = urlparse(url)
    database_name = parsed.path.lstrip("/")
    return parsed.scheme.startswith("postgresql") and database_name == "hu010_integration"


if INTEGRATION_DATABASE_URL and not _is_isolated_database_url(INTEGRATION_DATABASE_URL):
    raise RuntimeError(
        "HU010_INTEGRATION_DATABASE_URL deve apontar somente para o banco "
        "PostgreSQL isolado chamado hu010_integration."
    )

if INTEGRATION_DATABASE_URL:
    # db.py valida DATABASE_URL no import e cria o engine global a partir dela.
    os.environ["DATABASE_URL"] = INTEGRATION_DATABASE_URL
    os.environ.setdefault("SECRET_KEY_JWT", "hu010-integration-only-secret")

    from src.modulos.motoristas.infrastructure.repositories.motorista_repository import (
        AlocacoesFuturasNaoVerificadasError,
        MotoristaTelefoneEmUsoError,
        MotoristaRepository,
    )
    from src.modulos.motoristas.model.entities.motorista import MotoristaORM
    from src.shared.infrastructure.audit_model import LogAuditoriaORM
    from src.shared.infrastructure.db import engine
    from src.shared.security.lgpd_encryption import hash_telefone


class FailingCommitSession(Session):
    """Sessão de teste que permite simular uma falha no commit."""

    fail_next_commit = False

    def commit(self):
        if self.fail_next_commit:
            self.fail_next_commit = False
            raise RuntimeError("falha de persistência controlada")
        return super().commit()


@unittest.skipUnless(
    INTEGRATION_DATABASE_URL,
    "defina HU010_INTEGRATION_DATABASE_URL para executar a integração PostgreSQL",
)
class MotoristaPostgreSQLIntegrationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.session_factory = sessionmaker(bind=engine)
        cls.created_ids: set[int] = set()

    def setUp(self):
        self.session = self.session_factory()
        self.repository = MotoristaRepository(self.session)
        self.prefix = f"HU010 {uuid4().hex[:10]}"

    def tearDown(self):
        self.session.rollback()
        self.session.close()

        if not self.created_ids:
            return

        cleanup_session = self.session_factory()
        try:
            cleanup_session.query(LogAuditoriaORM).filter(
                LogAuditoriaORM.entidade == "motorista",
                LogAuditoriaORM.entidade_id.in_(self.created_ids),
            ).delete(synchronize_session=False)
            cleanup_session.query(MotoristaORM).filter(
                MotoristaORM.id.in_(self.created_ids),
            ).delete(synchronize_session=False)
            cleanup_session.commit()
        finally:
            cleanup_session.close()

        self.created_ids.clear()

    def _criar(self, sufixo: str, telefone: str = "85999990000") -> dict:
        resultado = self.repository.criar(f"{self.prefix} {sufixo}", telefone)
        self.created_ids.add(resultado["id"])
        return resultado

    def _executor_id(self) -> int:
        executor_id = self.session.execute(
            text("SELECT id FROM usuario ORDER BY id LIMIT 1")
        ).scalar_one_or_none()
        self.assertIsNotNone(executor_id)
        return int(executor_id)

    def test_migration_criou_schema_e_revision_68(self):
        inspector = inspect(engine)

        self.assertIn("motorista", inspector.get_table_names())
        self.assertEqual(
            {
                "id",
                "nome_completo",
                "telefone",
                "telefone_hash",
                "ativo",
                "data_criacao",
            },
            {column["name"] for column in inspector.get_columns("motorista")},
        )
        self.assertIn(
            "ix_motorista_ativo",
            {index["name"] for index in inspector.get_indexes("motorista")},
        )
        telefone_hash_index = next(
            index
            for index in inspector.get_indexes("motorista")
            if index["name"] == "ix_motorista_telefone_hash"
        )
        self.assertTrue(telefone_hash_index["unique"])
        revision = self.session.execute(
            text("SELECT version_num FROM alembic_version")
        ).scalar_one()
        self.assertEqual(revision, "68_create_motorista")

    def test_crud_criptografia_busca_edicao_e_telefone_unico_normalizado(self):
        primeiro = self._criar("Primeiro", "(85) 99999-0000")

        with self.assertRaises(MotoristaTelefoneEmUsoError):
            self.repository.criar("Segundo", "85999990000")

        dados_crus = self.session.execute(
            text(
                "SELECT nome_completo, telefone, telefone_hash "
                "FROM motorista WHERE id = :motorista_id"
            ),
            {"motorista_id": primeiro["id"]},
        ).one()
        self.assertNotEqual(dados_crus.nome_completo, primeiro["nome"])
        self.assertNotEqual(dados_crus.telefone, primeiro["telefone"])
        self.assertEqual(dados_crus.telefone_hash, hash_telefone("85999990000"))

        encontrados = self.repository.listar(nome=self.prefix.casefold())
        self.assertEqual({item["id"] for item in encontrados}, {primeiro["id"]})

        atualizado = self.repository.atualizar(
            primeiro["id"],
            nome=f"{self.prefix} Atualizado",
        )
        self.assertEqual(atualizado["nome"], f"{self.prefix} Atualizado")
        self.assertEqual(atualizado["telefone"], primeiro["telefone"])

        recuperado = self.repository.buscar(primeiro["id"])
        self.assertEqual(recuperado["nome"], f"{self.prefix} Atualizado")

        executor_id = self._executor_id()
        self.repository.inativar(
            primeiro["id"],
            executor_id,
            alocacoes_futuras_verificadas=True,
        )
        with self.assertRaises(MotoristaTelefoneEmUsoError):
            self.repository.criar("Terceiro", "(85) 99999-0000")

    def test_edicao_permite_proprio_telefone_e_rejeita_outro(self):
        primeiro = self._criar("Primeiro", "85911112222")
        segundo = self._criar("Segundo", "85922223333")

        proprio = self.repository.atualizar(
            primeiro["id"],
            telefone="(85) 91111-2222",
        )
        self.assertEqual(proprio["telefone"], "(85) 91111-2222")

        with self.assertRaises(MotoristaTelefoneEmUsoError):
            self.repository.atualizar(
                primeiro["id"],
                telefone="85 92222-3333",
            )
        self.assertEqual(
            self.repository.buscar(segundo["id"])["telefone"],
            "85922223333",
        )

    def test_concorrencia_preserva_unicidade_do_telefone(self):
        telefone = f"859{uuid4().int % 100_000_000:08d}"

        def criar_em_sessao(sufixo: str):
            session = self.session_factory()
            try:
                resultado = MotoristaRepository(session).criar(
                    f"{self.prefix} {sufixo}",
                    telefone,
                )
                return "sucesso", resultado["id"]
            except Exception as error:
                return "falha", type(error).__name__
            finally:
                session.close()

        with ThreadPoolExecutor(max_workers=2) as executor:
            resultados = list(
                executor.map(criar_em_sessao, ("Concorrente A", "Concorrente B"))
            )

        sucessos = [resultado for resultado in resultados if resultado[0] == "sucesso"]
        falhas = [resultado for resultado in resultados if resultado[0] == "falha"]
        self.assertEqual(len(sucessos), 1)
        self.assertEqual(len(falhas), 1)
        self.created_ids.add(sucessos[0][1])

        quantidade = self.session.query(MotoristaORM).filter(
            MotoristaORM.telefone_hash == hash_telefone(telefone)
        ).count()
        self.assertEqual(quantidade, 1)

    def test_inativacao_bloqueada_e_status_auditado_em_cenario_controlado(self):
        motorista = self._criar("Status")
        executor_id = self._executor_id()

        with self.assertRaises(AlocacoesFuturasNaoVerificadasError):
            self.repository.inativar(motorista["id"], executor_id)

        self.assertTrue(self.repository.buscar(motorista["id"])["ativo"])

        # Este é um cenário interno de persistência. A rota de produção não
        # fornece essa autorização enquanto a verificação de alocações não
        # estiver integrada.
        inativado = self.repository.inativar(
            motorista["id"],
            executor_id,
            alocacoes_futuras_verificadas=True,
        )
        self.assertFalse(inativado["ativo"])

        log_inativacao = self.session.query(LogAuditoriaORM).filter_by(
            entidade="motorista",
            entidade_id=motorista["id"],
            acao="INATIVAR",
        ).one()
        self.assertEqual(log_inativacao.usuario_id, executor_id)
        self.assertEqual(log_inativacao.valor_anterior, "ativo")
        self.assertEqual(log_inativacao.valor_novo, "inativo")

        inativos = self.repository.listar(ativo=False, nome=self.prefix)
        self.assertEqual([item["id"] for item in inativos], [motorista["id"]])

        reativado = self.repository.reativar(motorista["id"], executor_id)
        self.assertTrue(reativado["ativo"])
        log_reativacao = self.session.query(LogAuditoriaORM).filter_by(
            entidade="motorista",
            entidade_id=motorista["id"],
            acao="REATIVAR",
        ).one()
        self.assertEqual(log_reativacao.usuario_id, executor_id)

    def test_rollback_de_falha_de_persistencia_preserva_dado(self):
        motorista = self._criar("Rollback")
        failing_factory = sessionmaker(bind=engine, class_=FailingCommitSession)
        failing_session = failing_factory()
        try:
            failing_repository = MotoristaRepository(failing_session)
            failing_session.fail_next_commit = True
            with self.assertRaisesRegex(RuntimeError, "falha de persistência"):
                failing_repository.atualizar(
                    motorista["id"],
                    nome=f"{self.prefix} Não Persistido",
                )
        finally:
            failing_session.close()

        recuperacao_session = self.session_factory()
        try:
            recuperado = MotoristaRepository(recuperacao_session).buscar(
                motorista["id"]
            )
        finally:
            recuperacao_session.close()

        self.assertEqual(recuperado["nome"], motorista["nome"])


if __name__ == "__main__":
    unittest.main()
