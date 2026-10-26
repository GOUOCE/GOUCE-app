"""Testes de integração da HU-011 contra um PostgreSQL explicitamente isolado.

O módulo só é executado quando ``HU011_INTEGRATION_DATABASE_URL`` é definido e
aponta para o banco chamado ``hu011_integration``. Isso evita que a suíte
atinja acidentalmente o banco de desenvolvimento. As migrations devem ser
aplicadas separadamente no banco efêmero antes da execução deste arquivo.
"""

from __future__ import annotations

import os
import unittest
from datetime import time
from urllib.parse import urlparse
from uuid import uuid4

from alembic.script import ScriptDirectory
from sqlalchemy import bindparam, inspect, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker


INTEGRATION_DATABASE_URL = os.getenv("HU011_INTEGRATION_DATABASE_URL")


def _is_isolated_database_url(url: str) -> bool:
    parsed = urlparse(url)
    database_name = parsed.path.lstrip("/")
    return parsed.scheme.startswith("postgresql") and database_name == "hu011_integration"


if INTEGRATION_DATABASE_URL and not _is_isolated_database_url(INTEGRATION_DATABASE_URL):
    raise RuntimeError(
        "HU011_INTEGRATION_DATABASE_URL deve apontar somente para o banco "
        "PostgreSQL isolado chamado hu011_integration."
    )

if INTEGRATION_DATABASE_URL:
    # db.py valida DATABASE_URL no import e cria o engine global a partir dela.
    os.environ["DATABASE_URL"] = INTEGRATION_DATABASE_URL
    os.environ.setdefault("SECRET_KEY_JWT", "hu011-integration-only-secret")

    from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
    from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
    from src.modulos.crud_basicos.infrastructure.repositories.bairro_repository import (
        BairroComRotaAtivaError,
        BairroRepository,
    )
    from src.modulos.crud_basicos.infrastructure.repositories.faculdade_repository import (
        FaculdadeComRotaAtivaError,
        FaculdadeRepository,
    )
    from src.modulos.rotas.application.use_cases.gerenciar_rotas_principais_use_case import (
        GerenciarRotasPrincipaisUseCase,
        RotaComAgendamentosPendentesError,
        RotaComVinculoInativoError,
    )
    from src.modulos.rotas.infrastructure.repositories.rota_principal_repository import (
        RotaPrincipalNomeEmUsoError,
        RotaPrincipalRepository,
        RotaReferenciaInvalidaError,
    )
    from src.modulos.rotas.infrastructure.rota_ativa_checkers import (
        bairro_em_rota_ativa,
        faculdade_em_rota_ativa,
    )
    from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM
    from src.shared.infrastructure.db import engine


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
    "defina HU011_INTEGRATION_DATABASE_URL para executar a integração PostgreSQL",
)
class RotaPrincipalPostgreSQLIntegrationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.session_factory = sessionmaker(bind=engine, class_=FailingCommitSession)

    def setUp(self):
        self.session = self.session_factory()
        self.repository = RotaPrincipalRepository(self.session)
        self.prefix = f"HU011 {uuid4().hex[:10]}"
        self.rotas_ids: set[int] = set()
        self.bairros_ids: set[int] = set()
        self.faculdades_ids: set[int] = set()

        self.bairro = self._criar_bairro("Centro")
        self.bairro_2 = self._criar_bairro("Campo Velho")
        self.bairro_inativo = self._criar_bairro("Inativo", ativo=False)
        self.ufc = self._criar_faculdade("UFC")
        self.ifce = self._criar_faculdade("IFCE")
        self.faculdade_inativa = self._criar_faculdade("Inativa", ativo=False)

    def tearDown(self):
        self.session.rollback()
        self.session.close()

        cleanup = self.session_factory()
        try:
            if self.rotas_ids:
                cleanup.execute(
                    text(
                        "DELETE FROM log_auditoria WHERE entidade = 'rota_principal' "
                        "AND entidade_id::text IN :ids"
                    ).bindparams(bindparam("ids", expanding=True)),
                    {"ids": [str(i) for i in self.rotas_ids]},
                )
                cleanup.query(RotaPrincipalORM).filter(
                    RotaPrincipalORM.id.in_(self.rotas_ids)
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
    def _criar_bairro(self, nome: str, ativo: bool = True) -> int:
        bairro = BairroORM(nome=f"{self.prefix} {nome}", ativo=ativo)
        self.session.add(bairro)
        self.session.commit()
        self.bairros_ids.add(bairro.bairro_id)
        return bairro.bairro_id

    def _criar_faculdade(self, nome: str, ativo: bool = True) -> int:
        faculdade = FaculdadeORM(
            nome_faculdade=f"{self.prefix} {nome}", campus_faculdade="Quixadá", ativo=ativo
        )
        self.session.add(faculdade)
        self.session.commit()
        self.faculdades_ids.add(faculdade.id_faculdade)
        return faculdade.id_faculdade

    def _executor_id(self) -> int:
        executor_id = self.session.execute(
            text("SELECT id FROM usuario ORDER BY id LIMIT 1")
        ).scalar_one_or_none()
        self.assertIsNotNone(executor_id)
        return int(executor_id)

    def _criar(self, sufixo: str = "A", **alteracoes) -> dict:
        argumentos = dict(
            nome=f"{self.prefix} {sufixo}",
            horario_saida=time(6, 30),
            horario_retorno=time(17, 30),
            bairros_ids=[self.bairro],
            faculdades_ida_ids=[self.ufc],
            faculdades_volta_ids=[self.ufc],
            usuario_executor_id=self._executor_id(),
        )
        argumentos.update(alteracoes)
        rota = self.repository.criar(**argumentos)
        self.rotas_ids.add(rota["id"])
        return rota

    def _acoes_de_auditoria(self, rota_id: int) -> list[str]:
        return list(
            self.session.execute(
                text(
                    "SELECT acao FROM log_auditoria WHERE entidade = 'rota_principal' "
                    "AND entidade_id::text = :id ORDER BY id"
                ),
                {"id": str(rota_id)},
            ).scalars()
        )

    # ------------------------------------------------------------ testes
    def test_migration_criou_schema_e_revision_76(self):
        inspector = inspect(engine)

        for tabela in (
            "rota_principal",
            "rota_principal_bairro",
            "rota_principal_faculdade_ida",
            "rota_principal_faculdade_volta",
        ):
            self.assertIn(tabela, inspector.get_table_names())
        self.assertEqual(
            {"id", "nome", "horario_saida", "horario_retorno", "ativo", "data_criacao"},
            {c["name"] for c in inspector.get_columns("rota_principal")},
        )
        indice_nome = next(
            i for i in inspector.get_indexes("rota_principal")
            if i["name"] == "uq_rota_principal_nome_lower"
        )
        self.assertTrue(indice_nome["unique"])
        revision = self.session.execute(text("SELECT version_num FROM alembic_version")).scalar_one()
        script = ScriptDirectory(os.path.join(os.path.dirname(__file__), "..", "migrations"))
        aplicadas = {r.revision for r in script.walk_revisions(base="base", head=revision)}
        self.assertIn("76_create_rota_principal", aplicadas)
        self.assertEqual(len(script.get_heads()), 1)

    def test_cria_le_e_persiste_horario_como_time(self):
        rota = self._criar(faculdades_ida_ids=[self.ufc, self.ifce], faculdades_volta_ids=[self.ifce])

        self.session.expire_all()
        relida = self.repository.buscar(rota["id"])
        horario = self.session.execute(
            text("SELECT horario_saida, horario_retorno FROM rota_principal WHERE id = :id"),
            {"id": rota["id"]},
        ).one()

        self.assertEqual(relida, rota)
        self.assertEqual((horario.horario_saida, horario.horario_retorno), (time(6, 30), time(17, 30)))
        self.assertEqual({f["id"] for f in relida["faculdades_ida"]}, {self.ufc, self.ifce})
        self.assertEqual({f["id"] for f in relida["faculdades_volta"]}, {self.ifce})

    def test_nome_unico_sem_diferenciar_caixa_e_espacos_inclusive_inativa(self):
        rota = self._criar("Unica")
        self.repository.inativar(rota["id"], self._executor_id())

        with self.assertRaises(RotaPrincipalNomeEmUsoError):
            self._criar("Outra", nome=f"  {self.prefix.lower()} UNICA ")

    def test_indice_unico_e_check_de_horario_protegem_o_banco(self):
        self._criar("Base")
        with self.assertRaises(IntegrityError):
            self.session.execute(
                text(
                    "INSERT INTO rota_principal (nome, horario_saida, horario_retorno) "
                    "VALUES (:nome, '06:00', '07:00')"
                ),
                {"nome": f" {self.prefix.upper()} BASE "},
            )
        self.session.rollback()
        with self.assertRaises(IntegrityError):
            self.session.execute(
                text(
                    "INSERT INTO rota_principal (nome, horario_saida, horario_retorno) "
                    "VALUES (:nome, '08:00', '08:00')"
                ),
                {"nome": f"{self.prefix} horario"},
            )
        self.session.rollback()

    def test_rejeita_bairro_e_faculdade_inativos_sem_gravar_nada(self):
        antes = self.session.query(RotaPrincipalORM).count()

        with self.assertRaises(RotaReferenciaInvalidaError):
            self._criar("X", bairros_ids=[self.bairro, self.bairro_inativo])
        with self.assertRaises(RotaReferenciaInvalidaError):
            self._criar("Y", faculdades_volta_ids=[self.faculdade_inativa])

        self.assertEqual(self.session.query(RotaPrincipalORM).count(), antes)

    def test_auditoria_dos_quatro_eventos_com_usuario_e_timestamp(self):
        executor_id = self._executor_id()
        rota = self._criar("Auditada")
        self.repository.atualizar(rota["id"], {"horario_saida": time(6, 0)}, executor_id)
        self.repository.inativar(rota["id"], executor_id)
        self.repository.reativar(rota["id"], executor_id)

        self.assertEqual(
            self._acoes_de_auditoria(rota["id"]), ["CRIAR", "EDITAR", "INATIVAR", "REATIVAR"]
        )
        linhas = self.session.execute(
            text(
                "SELECT usuario_id, criado_em FROM log_auditoria "
                "WHERE entidade = 'rota_principal' AND entidade_id::text = :id"
            ),
            {"id": str(rota["id"])},
        ).all()
        self.assertTrue(all(l.usuario_id == executor_id and l.criado_em for l in linhas))

    def test_falha_no_commit_desfaz_rota_e_log(self):
        antes = self.session.query(RotaPrincipalORM).count()
        self.session.fail_next_commit = True

        with self.assertRaises(RuntimeError):
            self._criar("Falha")

        self.session.rollback()
        self.assertEqual(self.session.query(RotaPrincipalORM).count(), antes)

    def test_falha_na_inativacao_mantem_rota_ativa_e_sem_log(self):
        rota = self._criar("Atomica")
        self.session.fail_next_commit = True

        with self.assertRaises(RuntimeError):
            self.repository.inativar(rota["id"], self._executor_id())

        self.session.rollback()
        self.assertTrue(self.repository.buscar(rota["id"])["ativo"])
        self.assertEqual(self._acoes_de_auditoria(rota["id"]), ["CRIAR"])

    def test_bloqueio_por_agendamento_simulado_nao_altera_nem_loga(self):
        repository = RotaPrincipalRepository(
            self.session, agendamentos_futuros_checker=lambda _: True
        )
        use_case = GerenciarRotasPrincipaisUseCase(repository)
        rota = self._criar("Agendada")

        with self.assertRaises(RotaComAgendamentosPendentesError):
            use_case.inativar(rota["id"], self._executor_id())

        self.assertTrue(repository.buscar(rota["id"])["ativo"])
        self.assertEqual(self._acoes_de_auditoria(rota["id"]), ["CRIAR"])

    def test_fluxo_vinculo_inativado_reativar_bloqueia_edicao_em_rota_inativa_e_reativar_libera(self):
        executor_id = self._executor_id()
        use_case = GerenciarRotasPrincipaisUseCase(self.repository)
        rota = self._criar("Fluxo")
        use_case.inativar(rota["id"], executor_id)
        self.session.query(BairroORM).filter_by(bairro_id=self.bairro).update({"ativo": False})
        self.session.commit()

        with self.assertRaises(RotaComVinculoInativoError):
            use_case.reativar(rota["id"], executor_id)
        self.assertFalse(self.repository.buscar(rota["id"])["ativo"])

        editada = use_case.atualizar(rota["id"], {"bairros_ids": [self.bairro_2]}, executor_id)
        self.assertFalse(editada["ativo"])
        self.assertEqual([b["id"] for b in editada["bairros"]], [self.bairro_2])

        self.assertTrue(use_case.reativar(rota["id"], executor_id)["ativo"])
        self.assertEqual(
            self._acoes_de_auditoria(rota["id"]), ["CRIAR", "INATIVAR", "EDITAR", "REATIVAR"]
        )

    def test_checkers_bloqueiam_inativacao_de_bairro_e_faculdade_em_rota_ativa(self):
        executor_id = self._executor_id()
        rota = self._criar("Vinculada", faculdades_ida_ids=[self.ufc], faculdades_volta_ids=[self.ifce])
        bairros = BairroRepository(self.session, rota_ativa_checker=bairro_em_rota_ativa(self.session))
        faculdades = FaculdadeRepository(self.session, rota_ativa_checker=faculdade_em_rota_ativa(self.session))

        with self.assertRaises(BairroComRotaAtivaError):
            bairros.inativar(self.bairro, usuario_executor_id=executor_id)
        for faculdade_id in (self.ufc, self.ifce):
            with self.assertRaises(FaculdadeComRotaAtivaError):
                faculdades.inativar(faculdade_id, usuario_executor_id=executor_id)

        self.repository.inativar(rota["id"], executor_id)
        self.assertFalse(bairros.inativar(self.bairro, usuario_executor_id=executor_id).ativo)
        self.assertFalse(faculdades.inativar(self.ufc, usuario_executor_id=executor_id).ativo)

    def test_fk_restrict_impede_apagar_bairro_vinculado_e_cascade_remove_vinculos(self):
        rota = self._criar("Fk")

        with self.assertRaises(IntegrityError):
            self.session.execute(
                text("DELETE FROM bairro WHERE bairro_id = :id"), {"id": self.bairro}
            )
        self.session.rollback()

        self.session.execute(
            text("DELETE FROM rota_principal WHERE id = :id"), {"id": rota["id"]}
        )
        self.session.commit()
        restantes = self.session.execute(
            text("SELECT count(*) FROM rota_principal_bairro WHERE rota_id = :id"),
            {"id": rota["id"]},
        ).scalar_one()
        self.assertEqual(restantes, 0)

    def test_busca_por_nome_parcial_sem_diferenciar_caixa(self):
        self._criar("Centro Norte")

        achadas = self.repository.listar(nome=f"{self.prefix.upper()} centro")

        self.assertEqual(len(achadas), 1)


if __name__ == "__main__":
    unittest.main()
