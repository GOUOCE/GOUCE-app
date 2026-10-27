"""Testes de integração da HU-012 contra um PostgreSQL explicitamente isolado.

O módulo só é executado quando ``HU012_INTEGRATION_DATABASE_URL`` é definido e
aponta para o banco chamado ``hu012_integration``. Isso evita que a suíte
atinja acidentalmente o banco de desenvolvimento. As migrations devem ser
aplicadas separadamente no banco efêmero (até a 77) antes da execução deste
arquivo. Os testes de serialização usam duas sessões em threads: a primeira
operação pausa antes do ``commit`` (segurando o ``FOR UPDATE`` da rota
principal) e a segunda só prossegue depois de observada, em ``pg_stat_activity``,
esperando o lock.
"""

from __future__ import annotations

import os
import threading
import unittest
from datetime import time
from time import monotonic, sleep
from urllib.parse import urlparse
from uuid import uuid4

from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import bindparam, inspect, text
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.orm import Session, sessionmaker


INTEGRATION_DATABASE_URL = os.getenv("HU012_INTEGRATION_DATABASE_URL")
MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), "..", "migrations")


def _is_isolated_database_url(url: str) -> bool:
    parsed = urlparse(url)
    database_name = parsed.path.lstrip("/")
    return parsed.scheme.startswith("postgresql") and database_name == "hu012_integration"


if INTEGRATION_DATABASE_URL and not _is_isolated_database_url(INTEGRATION_DATABASE_URL):
    raise RuntimeError(
        "HU012_INTEGRATION_DATABASE_URL deve apontar somente para o banco "
        "PostgreSQL isolado chamado hu012_integration."
    )

if INTEGRATION_DATABASE_URL:
    # db.py valida DATABASE_URL no import e cria o engine global a partir dela.
    os.environ["DATABASE_URL"] = INTEGRATION_DATABASE_URL
    os.environ.setdefault("SECRET_KEY_JWT", "hu012-integration-only-secret")

    from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
    from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
    from src.modulos.rotas.application.use_cases.gerenciar_rotas_complementares_use_case import (
        GerenciarRotasComplementaresUseCase,
        RotaComplementarComAgendamentosPendentesError,
    )
    from src.modulos.rotas.application.use_cases.gerenciar_rotas_principais_use_case import (
        GerenciarRotasPrincipaisUseCase,
        RotaComComplementaresAtivasError,
    )
    from src.modulos.rotas.infrastructure.repositories.rota_complementar_repository import (
        MENSAGEM_PRINCIPAL_INATIVA_OU_INEXISTENTE,
        MENSAGEM_PRINCIPAL_INATIVA_REATIVACAO,
        RotaComplementarComPrincipalInativaError,
        RotaComplementarNomeEmUsoError,
        RotaComplementarReferenciaInvalidaError,
        RotaComplementarRepository,
    )
    from src.modulos.rotas.infrastructure.repositories.rota_principal_repository import (
        MENSAGEM_ROTA_COM_COMPLEMENTARES_ATIVAS,
        RotaPrincipalRepository,
    )
    from src.modulos.rotas.model.entities.rota_complementar import RotaComplementarORM
    from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM
    from src.shared.infrastructure.db import engine


@unittest.skipUnless(
    INTEGRATION_DATABASE_URL,
    "defina HU012_INTEGRATION_DATABASE_URL para executar a integração PostgreSQL",
)
class RotaComplementarPostgreSQLIntegrationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.session_factory = sessionmaker(bind=engine)

    def setUp(self):
        self.session = self.session_factory()
        self.principais = RotaPrincipalRepository(self.session)
        self.complementares = RotaComplementarRepository(self.session)
        self.uc_principal = GerenciarRotasPrincipaisUseCase(self.principais)
        self.uc_complementar = GerenciarRotasComplementaresUseCase(self.complementares)
        self.prefix = f"HU012 {uuid4().hex[:10]}"
        self.principais_ids: set[int] = set()
        self.complementares_ids: set[int] = set()
        self.bairros_ids: set[int] = set()
        self.faculdades_ids: set[int] = set()

        bairro = BairroORM(nome=f"{self.prefix} Centro", ativo=True)
        faculdade = FaculdadeORM(
            nome_faculdade=f"{self.prefix} UFC", campus_faculdade="Quixadá", ativo=True
        )
        self.session.add_all([bairro, faculdade])
        self.session.commit()
        self.bairro, self.faculdade = bairro.bairro_id, faculdade.id_faculdade
        self.bairros_ids.add(self.bairro)
        self.faculdades_ids.add(self.faculdade)
        self.executor = self._executor_id()

    def tearDown(self):
        self.session.rollback()
        self.session.close()

        cleanup = self.session_factory()
        try:
            # inclui as criadas em threads, mesmo que o teste falhe antes de registrá-las
            self.complementares_ids.update(
                cleanup.execute(
                    text("SELECT id FROM rota_complementar WHERE nome LIKE :prefixo"),
                    {"prefixo": f"{self.prefix}%"},
                ).scalars()
            )
            for entidade, ids in (
                ("rota_complementar", self.complementares_ids),
                ("rota_principal", self.principais_ids),
            ):
                if ids:
                    cleanup.execute(
                        text(
                            "DELETE FROM log_auditoria WHERE entidade = :entidade "
                            "AND entidade_id::text IN :ids"
                        ).bindparams(bindparam("ids", expanding=True)),
                        {"entidade": entidade, "ids": [str(i) for i in ids]},
                    )
            if self.complementares_ids:
                cleanup.query(RotaComplementarORM).filter(
                    RotaComplementarORM.id.in_(self.complementares_ids)
                ).delete(synchronize_session=False)
            if self.principais_ids:
                cleanup.query(RotaPrincipalORM).filter(
                    RotaPrincipalORM.id.in_(self.principais_ids)
                ).delete(synchronize_session=False)
            cleanup.query(BairroORM).filter(
                BairroORM.bairro_id.in_(self.bairros_ids)
            ).delete(synchronize_session=False)
            cleanup.query(FaculdadeORM).filter(
                FaculdadeORM.id_faculdade.in_(self.faculdades_ids)
            ).delete(synchronize_session=False)
            cleanup.commit()
        finally:
            cleanup.close()

    # ------------------------------------------------------------ apoio
    def _executor_id(self) -> int:
        executor_id = self.session.execute(
            text("SELECT id FROM usuario ORDER BY id LIMIT 1")
        ).scalar_one_or_none()
        self.assertIsNotNone(executor_id)
        return int(executor_id)

    def _criar_principal(self, sufixo: str) -> dict:
        rota = self.principais.criar(
            nome=f"{self.prefix} Principal {sufixo}",
            horario_saida=time(6, 30),
            horario_retorno=time(17, 30),
            bairros_ids=[self.bairro],
            faculdades_ida_ids=[self.faculdade],
            faculdades_volta_ids=[self.faculdade],
            usuario_executor_id=self.executor,
        )
        self.principais_ids.add(rota["id"])
        return rota

    def _criar_complementar(self, principal_id: int, sufixo: str = "A", **alteracoes) -> dict:
        argumentos = dict(
            nome=f"{self.prefix} Van {sufixo}",
            horario_saida=time(6, 0),
            ponto_conexao="Trevo do Bairro Novo",
            rota_principal_id=principal_id,
            usuario_executor_id=self.executor,
        )
        argumentos.update(alteracoes)
        rota = self.complementares.criar(**argumentos)
        self.complementares_ids.add(rota["id"])
        return rota

    def _acoes(self, entidade: str, entidade_id: int) -> list[str]:
        return list(
            self.session.execute(
                text(
                    "SELECT acao FROM log_auditoria WHERE entidade = :entidade "
                    "AND entidade_id::text = :id ORDER BY id"
                ),
                {"entidade": entidade, "id": str(entidade_id)},
            ).scalars()
        )

    def _aguardar_sessao_bloqueada(self, timeout: float = 10.0) -> bool:
        """Espera até alguma sessão aguardar o lock de uma leitura ``FOR UPDATE``.

        Usa AUTOCOMMIT: dentro de uma transação o ``pg_stat_activity`` fica em
        cache e a espera nunca apareceria.
        """
        limite = monotonic() + timeout
        with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conexao:
            while monotonic() < limite:
                bloqueadas = conexao.execute(
                    text(
                        "SELECT count(*) FROM pg_stat_activity "
                        "WHERE datname = current_database() AND pid <> pg_backend_pid() "
                        "AND wait_event_type = 'Lock' AND query ILIKE '%FOR UPDATE%'"
                    )
                ).scalar_one()
                if bloqueadas:
                    return True
                sleep(0.05)
        return False

    def _atividade(self) -> list[tuple]:
        with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conexao:
            return [
                tuple(linha)
                for linha in conexao.execute(
                    text(
                        "SELECT pid, state, wait_event_type, wait_event, left(query, 120) "
                        "FROM pg_stat_activity WHERE datname = current_database() "
                        "AND pid <> pg_backend_pid() ORDER BY pid"
                    )
                )
            ]

    def _executar_serializadas(self, primeira, segunda):
        """Roda ``primeira`` e ``segunda`` em sessões e threads distintas.

        ``primeira`` é pausada logo antes do ``commit`` (com o lock da rota
        principal já segurado); ``segunda`` só é iniciada depois disso e o teste
        confirma que ela ficou esperando o lock antes de liberar a primeira.
        Devolve ``((resultado, erro), (resultado, erro))``.
        """
        travada, liberar = threading.Event(), threading.Event()
        saidas: dict[str, tuple] = {}
        sessoes: list[Session] = []

        def rodar(nome, operacao, pausar):
            sessao = self.session_factory()
            sessoes.append(sessao)
            sessao.execute(text("SET LOCAL lock_timeout = '15s'"))
            if pausar:
                commit_real = sessao.commit

                def commit_pausado():
                    travada.set()
                    if not liberar.wait(15):
                        raise RuntimeError("o teste não liberou o lock a tempo")
                    commit_real()

                sessao.commit = commit_pausado
            try:
                saidas[nome] = (operacao(sessao), None)
            except Exception as erro:  # o erro faz parte do que o teste verifica
                saidas[nome] = (None, erro)

        threads = [
            threading.Thread(target=rodar, args=("primeira", primeira, True)),
            threading.Thread(target=rodar, args=("segunda", segunda, False)),
        ]
        try:
            threads[0].start()
            self.assertTrue(travada.wait(10), f"a primeira operação não chegou ao commit: {saidas}")
            threads[1].start()
            self.assertTrue(
                self._aguardar_sessao_bloqueada(),
                f"a segunda operação não ficou esperando o lock: saídas={saidas} "
                f"atividade={self._atividade()}",
            )
            self.assertTrue(threads[1].is_alive())
            self.assertNotIn("segunda", saidas)
        finally:
            liberar.set()
            for thread in threads:
                if thread.ident is not None:
                    thread.join(20)
            for sessao in sessoes:
                sessao.rollback()
                sessao.close()
        self.assertFalse(any(thread.is_alive() for thread in threads))
        self.session.rollback()  # descarta o estado em cache da sessão principal
        return saidas["primeira"], saidas["segunda"]

    def _inativar_principal(self, principal_id):
        return lambda sessao: GerenciarRotasPrincipaisUseCase(
            RotaPrincipalRepository(sessao)
        ).inativar(principal_id, self.executor)

    def _criar_complementar_em(self, principal_id, sufixo):
        return lambda sessao: RotaComplementarRepository(sessao).criar(
            nome=f"{self.prefix} Van {sufixo}",
            horario_saida=time(6, 0),
            ponto_conexao="Trevo do Bairro Novo",
            rota_principal_id=principal_id,
            usuario_executor_id=self.executor,
        )

    def _reativar_complementar(self, rota_id):
        return lambda sessao: GerenciarRotasComplementaresUseCase(
            RotaComplementarRepository(sessao)
        ).reativar(rota_id, self.executor)

    # ------------------------------------------------------------ testes
    def test_schema_da_migration_77_e_cadeia_com_um_unico_head(self):
        inspector = inspect(engine)

        self.assertIn("rota_complementar", inspector.get_table_names())
        self.assertEqual(
            {"id", "rota_principal_id", "nome", "horario_saida", "ponto_conexao", "ativo", "data_criacao"},
            {c["name"] for c in inspector.get_columns("rota_complementar")},
        )
        indices = {i["name"]: i for i in inspector.get_indexes("rota_complementar")}
        self.assertTrue(indices["uq_rota_complementar_nome_lower"]["unique"])
        self.assertIn("ix_rota_complementar_ativo", indices)
        self.assertIn("ix_rota_complementar_rota_principal_id", indices)
        (fk,) = inspector.get_foreign_keys("rota_complementar")
        self.assertEqual(fk["referred_table"], "rota_principal")
        self.assertEqual(fk["options"].get("ondelete"), "RESTRICT")
        revision = self.session.execute(text("SELECT version_num FROM alembic_version")).scalar_one()
        script = ScriptDirectory(MIGRATIONS_DIR)
        aplicadas = {r.revision for r in script.walk_revisions(base="base", head=revision)}
        self.assertIn("77_create_rota_complementar", aplicadas)
        self.assertEqual(script.get_heads(), ["77_create_rota_complementar"])

    def test_fluxo_completo_criar_inativar_principal_reativar_e_trocar_vinculo(self):
        p1 = self._criar_principal("P1")
        p2 = self._criar_principal("P2")
        rota = self._criar_complementar(p1["id"])
        self.assertEqual(rota["rota_principal"], {"id": p1["id"], "nome": p1["nome"], "ativo": True})

        # D3: principal com complementar ativa não pode ser inativada
        with self.assertRaises(RotaComComplementaresAtivasError):
            self.uc_principal.inativar(p1["id"], self.executor)
        self.assertTrue(self.principais.buscar(p1["id"])["ativo"])
        self.assertEqual(self._acoes("rota_principal", p1["id"]), ["CRIAR"])

        # inativar a complementar e, só então, a principal
        self.assertFalse(self.uc_complementar.inativar(rota["id"], self.executor)["ativo"])
        self.assertFalse(self.uc_principal.inativar(p1["id"], self.executor)["ativo"])

        # D8: reativar com a principal inativa é bloqueado e nada é gravado
        with self.assertRaises(RotaComplementarComPrincipalInativaError):
            self.uc_complementar.reativar(rota["id"], self.executor)
        self.assertFalse(self.complementares.buscar(rota["id"])["ativo"])
        self.assertEqual(self._acoes("rota_complementar", rota["id"]), ["CRIAR", "INATIVAR"])

        # PATCH trocando para uma principal ativa (mesmo com a complementar inativa)
        editada = self.uc_complementar.atualizar(rota["id"], {"rota_principal_id": p2["id"]}, self.executor)
        self.assertEqual(editada["rota_principal"]["id"], p2["id"])
        self.assertFalse(editada["ativo"])

        # agora a reativação passa
        self.assertTrue(self.uc_complementar.reativar(rota["id"], self.executor)["ativo"])
        self.assertEqual(
            self._acoes("rota_complementar", rota["id"]),
            ["CRIAR", "INATIVAR", "EDITAR", "REATIVAR"],
        )

    def test_unicidade_de_nome_sem_caixa_e_espacos_inclui_inativas(self):
        p1 = self._criar_principal("P1")
        rota = self._criar_complementar(p1["id"], "U")
        self.complementares.inativar(rota["id"], self.executor)

        with self.assertRaises(RotaComplementarNomeEmUsoError):
            self._criar_complementar(p1["id"], "U", nome=f"  {self.prefix.lower()} van u ")

    def test_principal_inativa_e_recusada_na_criacao_e_na_troca(self):
        p1 = self._criar_principal("P1")
        p2 = self._criar_principal("P2")
        rota = self._criar_complementar(p1["id"])
        self.principais.inativar(p2["id"], self.executor)

        with self.assertRaises(RotaComplementarReferenciaInvalidaError):
            self._criar_complementar(p2["id"], "B")
        with self.assertRaises(RotaComplementarReferenciaInvalidaError):
            self.complementares.atualizar(rota["id"], {"rota_principal_id": p2["id"]}, self.executor)
        self.assertEqual(self.complementares.buscar(rota["id"])["rota_principal"]["id"], p1["id"])
        opcoes = {p["id"] for p in self.complementares.listar_opcoes()["rotas_principais"]}
        self.assertIn(p1["id"], opcoes)
        self.assertNotIn(p2["id"], opcoes)

    def test_fk_restrict_impede_apagar_principal_com_complementar(self):
        p1 = self._criar_principal("P1")
        self._criar_complementar(p1["id"])

        with self.assertRaises(IntegrityError):
            self.session.execute(text("DELETE FROM rota_principal WHERE id = :id"), {"id": p1["id"]})
        self.session.rollback()

    def test_bloqueio_por_agendamento_falha_aberto_e_com_checker(self):
        p1 = self._criar_principal("P1")
        rota = self._criar_complementar(p1["id"])
        bloqueado = RotaComplementarRepository(self.session, agendamentos_futuros_checker=lambda _: True)

        with self.assertRaises(RotaComplementarComAgendamentosPendentesError):
            GerenciarRotasComplementaresUseCase(bloqueado).inativar(rota["id"], self.executor)
        self.assertTrue(self.complementares.buscar(rota["id"])["ativo"])
        self.assertFalse(self.uc_complementar.inativar(rota["id"], self.executor)["ativo"])

    def test_listagem_com_filtros_e_horario_persistido_como_time(self):
        p1 = self._criar_principal("P1")
        p2 = self._criar_principal("P2")
        a = self._criar_complementar(p1["id"], "A", horario_saida=time(0, 0))
        b = self._criar_complementar(p2["id"], "B")
        self.complementares.inativar(b["id"], self.executor)

        meus = lambda **f: [r["id"] for r in self.complementares.listar(nome=self.prefix, **f)]
        self.assertEqual(meus(ativo=True), [a["id"]])
        self.assertEqual(sorted(meus(ativo=None)), sorted([a["id"], b["id"]]))
        self.assertEqual(meus(rota_principal_id=p2["id"]), [b["id"]])
        horario = self.session.execute(
            text("SELECT horario_saida FROM rota_complementar WHERE id = :id"), {"id": a["id"]}
        ).scalar_one()
        self.assertEqual(horario, time(0, 0))

    def test_principal_e_lida_com_for_update_na_criacao_e_na_reativacao(self):
        p1 = self._criar_principal("P1")
        outra = self.session_factory()
        try:
            self.complementares._ler_principal_para_atualizar(p1["id"])
            outra.execute(text("SET LOCAL lock_timeout = '300ms'"))
            with self.assertRaises(OperationalError):
                outra.execute(
                    text("UPDATE rota_principal SET ativo = ativo WHERE id = :id"), {"id": p1["id"]}
                )
        finally:
            outra.rollback()
            outra.close()
            self.session.rollback()

    def test_falha_no_commit_desfaz_rota_e_log(self):
        p1 = self._criar_principal("P1")
        antes = self.session.execute(
            text("SELECT count(*) FROM log_auditoria WHERE entidade = 'rota_complementar'")
        ).scalar_one()
        original = self.session.commit

        def falhar():
            raise RuntimeError("falha de persistência controlada")

        self.session.commit = falhar
        try:
            with self.assertRaises(RuntimeError):
                self._criar_complementar(p1["id"], "F")
        finally:
            self.session.commit = original

        self.assertEqual(self.complementares.listar(nome=f"{self.prefix} Van F"), [])
        depois = self.session.execute(
            text("SELECT count(*) FROM log_auditoria WHERE entidade = 'rota_complementar'")
        ).scalar_one()
        self.assertEqual(antes, depois)

    # ------------------------------------------------- serialização (D3 / D8)
    def test_inativacao_segurando_o_lock_faz_a_criacao_esperar_e_depois_falhar(self):
        p1 = self._criar_principal("P1")

        (inativada, erro_inativar), (criada, erro_criar) = self._executar_serializadas(
            self._inativar_principal(p1["id"]), self._criar_complementar_em(p1["id"], "Corrida"),
        )

        self.assertIsNone(erro_inativar)
        self.assertFalse(inativada["ativo"])
        self.assertIsNone(criada)
        self.assertIsInstance(erro_criar, RotaComplementarReferenciaInvalidaError)
        self.assertEqual(str(erro_criar), MENSAGEM_PRINCIPAL_INATIVA_OU_INEXISTENTE)
        self.assertEqual(erro_criar.field, "rota_principal_id")
        self.assertEqual(self.complementares.listar(nome=self.prefix), [])
        self.assertEqual(self._acoes("rota_principal", p1["id"]), ["CRIAR", "INATIVAR"])

    def test_criacao_segurando_o_lock_faz_a_inativacao_esperar_e_depois_falhar_com_409(self):
        p1 = self._criar_principal("P1")

        (criada, erro_criar), (inativada, erro_inativar) = self._executar_serializadas(
            self._criar_complementar_em(p1["id"], "Corrida"), self._inativar_principal(p1["id"]),
        )

        self.assertIsNone(erro_criar)
        self.assertIsNone(inativada)
        self.assertIsInstance(erro_inativar, RotaComComplementaresAtivasError)
        self.assertEqual(str(erro_inativar), MENSAGEM_ROTA_COM_COMPLEMENTARES_ATIVAS)
        self.assertTrue(self.principais.buscar(p1["id"])["ativo"])
        self.assertEqual(self._acoes("rota_principal", p1["id"]), ["CRIAR"])
        self.assertEqual(self._acoes("rota_complementar", criada["id"]), ["CRIAR"])

    def test_reativacao_segurando_o_lock_faz_a_inativacao_esperar_e_depois_falhar_com_409(self):
        p1 = self._criar_principal("P1")
        rota = self._criar_complementar(p1["id"])
        self.complementares.inativar(rota["id"], self.executor)

        (reativada, erro_reativar), (inativada, erro_inativar) = self._executar_serializadas(
            self._reativar_complementar(rota["id"]), self._inativar_principal(p1["id"]),
        )

        self.assertIsNone(erro_reativar)
        self.assertTrue(reativada["ativo"])
        self.assertIsNone(inativada)
        self.assertIsInstance(erro_inativar, RotaComComplementaresAtivasError)
        self.assertTrue(self.principais.buscar(p1["id"])["ativo"])
        self.assertEqual(self._acoes("rota_principal", p1["id"]), ["CRIAR"])
        self.assertEqual(
            self._acoes("rota_complementar", rota["id"]), ["CRIAR", "INATIVAR", "REATIVAR"]
        )

    def test_inativacao_segurando_o_lock_faz_a_reativacao_esperar_e_depois_falhar_com_409(self):
        p1 = self._criar_principal("P1")
        rota = self._criar_complementar(p1["id"])
        self.complementares.inativar(rota["id"], self.executor)

        (inativada, erro_inativar), (reativada, erro_reativar) = self._executar_serializadas(
            self._inativar_principal(p1["id"]), self._reativar_complementar(rota["id"]),
        )

        self.assertIsNone(erro_inativar)
        self.assertFalse(inativada["ativo"])
        self.assertIsNone(reativada)
        self.assertIsInstance(erro_reativar, RotaComplementarComPrincipalInativaError)
        self.assertEqual(str(erro_reativar), MENSAGEM_PRINCIPAL_INATIVA_REATIVACAO)
        self.assertFalse(self.complementares.buscar(rota["id"])["ativo"])
        self.assertEqual(self._acoes("rota_principal", p1["id"]), ["CRIAR", "INATIVAR"])
        self.assertEqual(self._acoes("rota_complementar", rota["id"]), ["CRIAR", "INATIVAR"])


@unittest.skipUnless(
    INTEGRATION_DATABASE_URL,
    "defina HU012_INTEGRATION_DATABASE_URL para executar a integração PostgreSQL",
)
class Migration77PostgreSQLTest(unittest.TestCase):
    """Roda downgrade e upgrade da 77 no banco isolado e restaura o estado original."""

    def test_downgrade_remove_a_tabela_e_upgrade_recria_com_os_indices(self):
        config = Config()
        config.set_main_option("script_location", os.path.abspath(MIGRATIONS_DIR))
        if "rota_complementar" not in inspect(engine).get_table_names():
            self.fail("aplique a migration 77 no banco isolado antes de executar este teste")
        engine.dispose()

        try:
            command.downgrade(config, "76_create_rota_principal")
            self.assertNotIn("rota_complementar", inspect(engine).get_table_names())
            with engine.connect() as conn:
                self.assertEqual(
                    conn.execute(text("SELECT version_num FROM alembic_version")).scalar_one(),
                    "76_create_rota_principal",
                )
        finally:
            command.upgrade(config, "head")

        inspector = inspect(engine)
        self.assertIn("rota_complementar", inspector.get_table_names())
        self.assertEqual(
            {"ix_rota_complementar_ativo", "ix_rota_complementar_rota_principal_id", "uq_rota_complementar_nome_lower"},
            {i["name"] for i in inspector.get_indexes("rota_complementar")},
        )
        with engine.connect() as conn:
            self.assertEqual(
                conn.execute(text("SELECT version_num FROM alembic_version")).scalar_one(),
                "77_create_rota_complementar",
            )
