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
from datetime import date, datetime, time, timedelta, timezone
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
    from src.modulos.crud_basicos.domain.entities.ponto_de_parada import PontoDeParadaORM
    from src.modulos.crud_basicos.infrastructure.repositories.bairro_repository import (
        BairroRepository,
    )
    from src.modulos.crud_basicos.infrastructure.repositories.faculdade_repository import (
        FaculdadeRepository,
    )
    from src.modulos.agendamentos.model.entities.agendamento import AgendamentoORM
    from src.modulos.usuarios.model.entities.aluno import AlunoORM
    from src.modulos.usuarios.model.entities.usuario import UsuarioORM
    from src.modulos.arquivos.model.entities.arquivo import ArquivoORM
    from src.shared.security.lgpd_encryption import hash_email
    from src.shared.infrastructure.db import engine
    from sqlalchemy import inspect, text
    from alembic import command
    from alembic.config import Config
    from alembic.script import ScriptDirectory

    MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), "..", "migrations")


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


@unittest.skipUnless(
    INTEGRATION_DATABASE_URL,
    "defina HU015_INTEGRATION_DATABASE_URL para executar a integração PostgreSQL",
)
class AgendamentoHu015DetalheIntegrationTest(unittest.TestCase):
    """Cobre a issue #404: PATCH de faculdades_ida/volta_ids, ponto de parada e
    nome de faculdade devem renovar ``atualizado_em`` do detalhe quando o dado
    muda de fato, e mantê-lo estável quando o PATCH reenvia o mesmo valor."""

    @classmethod
    def setUpClass(cls):
        cls.session_factory = sessionmaker(bind=engine)

    def setUp(self):
        self.session = self.session_factory()
        self.prefix = f"HU015D {uuid4().hex[:8]}"
        self.executor = self._executor_id()

        bairro = BairroORM(nome=f"{self.prefix} Bairro", ativo=True)
        self.session.add(bairro)
        self.session.flush()
        self.bairro_id = bairro.bairro_id

        ponto_emb = PontoDeParadaORM(
            nome=f"{self.prefix} Ponto Embarque", bairro_id=self.bairro_id, ativo=True
        )
        ponto_desemb = PontoDeParadaORM(
            nome=f"{self.prefix} Ponto Desembarque", bairro_id=self.bairro_id, ativo=True
        )
        fac_a = FaculdadeORM(
            nome_faculdade=f"{self.prefix} Fac A", campus_faculdade="Quixadá", ativo=True
        )
        fac_b = FaculdadeORM(
            nome_faculdade=f"{self.prefix} Fac B", campus_faculdade="Quixadá", ativo=True
        )
        fac_c = FaculdadeORM(
            nome_faculdade=f"{self.prefix} Fac C", campus_faculdade="Quixadá", ativo=True
        )
        fac_d = FaculdadeORM(
            nome_faculdade=f"{self.prefix} Fac D", campus_faculdade="Quixadá", ativo=True
        )
        fac_e = FaculdadeORM(
            nome_faculdade=f"{self.prefix} Fac E", campus_faculdade="Quixadá", ativo=True
        )
        self.session.add_all([ponto_emb, ponto_desemb, fac_a, fac_b, fac_c, fac_d, fac_e])
        self.session.flush()
        self.ponto_emb_id = ponto_emb.ponto_id
        self.ponto_desemb_id = ponto_desemb.ponto_id
        self.fac_a_id = fac_a.id_faculdade
        self.fac_b_id = fac_b.id_faculdade
        self.fac_c_id = fac_c.id_faculdade
        self.fac_d_id = fac_d.id_faculdade
        self.fac_e_id = fac_e.id_faculdade

        self.principais = RotaPrincipalRepository(self.session)
        self.uc_principal = GerenciarRotasPrincipaisUseCase(self.principais)
        self.bairros_repo = BairroRepository(self.session)
        self.faculdades_repo = FaculdadeRepository(self.session)

        rota = self.uc_principal.criar(
            nome=f"{self.prefix} Principal",
            horario_saida=time(6, 30),
            horario_retorno=time(17, 30),
            bairros_ids=[self.bairro_id],
            # fac_c só é membro da lista de resumo da ida (não é ies_destino).
            faculdades_ida_ids=[self.fac_a_id, self.fac_c_id],
            faculdades_volta_ids=[self.fac_b_id],
            usuario_executor_id=self.executor,
        )
        self.rota_id = rota["id"]

        self.aluno_id = self._criar_aluno()

        agendamento = AgendamentoORM(
            aluno_id=self.aluno_id,
            data=date.today() + timedelta(days=5),
            usa_ida=True,
            usa_volta=True,
            ponto_embarque_id=self.ponto_emb_id,
            ies_destino_id=self.fac_a_id,
            rota_complementar_ida_id=None,
            ies_origem_id=self.fac_b_id,
            ponto_desembarque_id=self.ponto_desemb_id,
            rota_complementar_volta_id=None,
            status="ATIVO",
        )
        self.session.add(agendamento)
        self.session.commit()
        self.agendamento_id = agendamento.id

        self.use_case = GerenciarAgendamentosUseCase(AgendamentoRepository(self.session))

    def tearDown(self):
        self.session.rollback()
        self.session.close()

        cleanup = self.session_factory()
        try:
            cleanup.query(AgendamentoORM).filter(
                AgendamentoORM.id == self.agendamento_id
            ).delete(synchronize_session=False)
            cleanup.query(AlunoORM).filter(
                AlunoORM.aluno_id == self.aluno_id
            ).delete(synchronize_session=False)
            cleanup.query(UsuarioORM).filter(
                UsuarioORM.id == self.aluno_id
            ).delete(synchronize_session=False)
            cleanup.query(ArquivoORM).filter(
                ArquivoORM.id == self.arquivo_id
            ).delete(synchronize_session=False)
            for entidade, ids in (
                ("rota_principal", [self.rota_id]),
                ("faculdade", [self.fac_a_id, self.fac_b_id, self.fac_c_id, self.fac_d_id, self.fac_e_id]),
                ("bairro", [self.bairro_id]),
            ):
                cleanup.execute(
                    text(
                        "DELETE FROM log_auditoria WHERE entidade = :entidade "
                        "AND entidade_id::text = ANY(:ids)"
                    ),
                    {"entidade": entidade, "ids": [str(i) for i in ids]},
                )
            cleanup.query(RotaPrincipalORM).filter(
                RotaPrincipalORM.id == self.rota_id
            ).delete(synchronize_session=False)
            cleanup.query(PontoDeParadaORM).filter(
                PontoDeParadaORM.ponto_id.in_([self.ponto_emb_id, self.ponto_desemb_id])
            ).delete(synchronize_session=False)
            cleanup.query(FaculdadeORM).filter(
                FaculdadeORM.id_faculdade.in_(
                    [self.fac_a_id, self.fac_b_id, self.fac_c_id, self.fac_d_id, self.fac_e_id]
                )
            ).delete(synchronize_session=False)
            cleanup.query(BairroORM).filter(
                BairroORM.bairro_id == self.bairro_id
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

    def _criar_aluno(self) -> int:
        """Usuário + arquivo + aluno mínimos só para satisfazer a FK de
        agendamento.aluno_id; nenhum dado aqui é lido por ``.detail()``."""
        email = f"{uuid4().hex[:12]}@hu015.teste"
        usuario = UsuarioORM(
            nome_completo=f"{self.prefix} Aluno",
            email=email,
            email_hash=hash_email(email),
            senha="x" * 20,
            ativo=True,
        )
        self.session.add(usuario)
        self.session.flush()

        arquivo = ArquivoORM(
            nome=f"{self.prefix} comprovante",
            url="http://minio/comprovante.pdf",
        )
        self.session.add(arquivo)
        self.session.flush()
        self.arquivo_id = arquivo.id

        aluno = AlunoORM(
            aluno_id=usuario.id,
            status_cadastro="ATIVADO",
            faculdade_id=self.fac_a_id,
            id_comprovante_matricula=arquivo.id,
            id_comprovante_residencia=arquivo.id,
            data_nascimento=20000101,
            identificacao_genero="Prefere não informar",
            tem_filhos=False,
            curso="Engenharia de Software",
            raca="Parda",
            transgenero="Não",
            termos_de_uso=True,
        )
        self.session.add(aluno)
        self.session.commit()
        return usuario.id

    # ------------------------------------------------------------ helpers
    def _detail(self):
        return self.use_case.detail(self.aluno_id, self.agendamento_id)

    def _rota_updated_at(self):
        self.session.expire_all()
        return self.session.get(RotaPrincipalORM, self.rota_id).updated_at

    def _ponto_updated_at(self, ponto_id):
        self.session.expire_all()
        return self.session.get(PontoDeParadaORM, ponto_id).updated_at

    def _faculdade_updated_at(self, faculdade_id):
        self.session.expire_all()
        return self.session.get(FaculdadeORM, faculdade_id).updated_at

    # ------------------------------------------------------------ (a)/(b)/(c): M2M
    def test_patch_faculdades_ida_ids_com_conjunto_novo_renova_rota_e_atualizado_em(self):
        antes_rota = self._rota_updated_at()
        antes_detalhe = self._detail()["atualizado_em"]

        self.principais.atualizar(
            self.rota_id,
            {"faculdades_ida_ids": [self.fac_a_id, self.fac_c_id, self.fac_d_id]},
            self.executor,
        )

        depois_rota = self._rota_updated_at()
        depois_detalhe = self._detail()["atualizado_em"]
        self.assertGreater(depois_rota, antes_rota)
        self.assertGreaterEqual(depois_detalhe, antes_detalhe)
        self.assertEqual(depois_detalhe, depois_rota)

    def test_patch_faculdades_ida_ids_com_mesmo_conjunto_reordenado_nao_renova(self):
        antes_rota = self._rota_updated_at()
        antes_detalhe = self._detail()["atualizado_em"]

        self.principais.atualizar(
            self.rota_id,
            {"faculdades_ida_ids": [self.fac_c_id, self.fac_a_id]},
            self.executor,
        )

        depois_rota = self._rota_updated_at()
        depois_detalhe = self._detail()["atualizado_em"]
        self.assertEqual(depois_rota, antes_rota)
        self.assertEqual(depois_detalhe, antes_detalhe)

    def test_patch_faculdades_volta_ids_com_conjunto_novo_renova_rota_e_atualizado_em(self):
        antes_rota = self._rota_updated_at()
        antes_detalhe = self._detail()["atualizado_em"]

        self.principais.atualizar(
            self.rota_id,
            {"faculdades_volta_ids": [self.fac_b_id, self.fac_e_id]},
            self.executor,
        )

        depois_rota = self._rota_updated_at()
        depois_detalhe = self._detail()["atualizado_em"]
        self.assertGreater(depois_rota, antes_rota)
        self.assertGreaterEqual(depois_detalhe, antes_detalhe)
        self.assertEqual(depois_detalhe, depois_rota)

    def test_patch_faculdades_volta_ids_com_mesmo_conjunto_nao_renova(self):
        antes_rota = self._rota_updated_at()
        antes_detalhe = self._detail()["atualizado_em"]

        self.principais.atualizar(
            self.rota_id, {"faculdades_volta_ids": [self.fac_b_id]}, self.executor
        )

        depois_rota = self._rota_updated_at()
        depois_detalhe = self._detail()["atualizado_em"]
        self.assertEqual(depois_rota, antes_rota)
        self.assertEqual(depois_detalhe, antes_detalhe)

    # ------------------------------------------------------------ (e): ponto
    def test_patch_ponto_so_com_capitalizacao_diferente_renova_mesmo_id(self):
        antes_ponto = self._ponto_updated_at(self.ponto_emb_id)
        antes_detalhe = self._detail()["atualizado_em"]
        novo_nome = f"{self.prefix} PONTO EMBARQUE"  # mesmo texto, caixa diferente

        self.bairros_repo.atualizar(
            self.bairro_id,
            pontos_de_parada=[novo_nome, f"{self.prefix} Ponto Desembarque"],
            usuario_executor_id=self.executor,
        )
        self.session.expire_all()
        ponto = self.session.get(PontoDeParadaORM, self.ponto_emb_id)

        self.assertEqual(ponto.ponto_id, self.ponto_emb_id)  # mesmo id: não é delete+insert
        self.assertEqual(ponto.nome, novo_nome)
        depois_ponto = self._ponto_updated_at(self.ponto_emb_id)
        depois_detalhe = self._detail()["atualizado_em"]
        self.assertGreater(depois_ponto, antes_ponto)
        self.assertEqual(depois_detalhe, depois_ponto)
        self.assertEqual(self._detail()["ponto_embarque_nome"], novo_nome)

    def test_patch_ponto_com_mesmo_nome_nao_renova(self):
        antes_ponto = self._ponto_updated_at(self.ponto_emb_id)
        antes_detalhe = self._detail()["atualizado_em"]

        self.bairros_repo.atualizar(
            self.bairro_id,
            pontos_de_parada=[
                f"{self.prefix} Ponto Embarque", f"{self.prefix} Ponto Desembarque"
            ],
            usuario_executor_id=self.executor,
        )

        depois_ponto = self._ponto_updated_at(self.ponto_emb_id)
        depois_detalhe = self._detail()["atualizado_em"]
        self.assertEqual(depois_ponto, antes_ponto)
        self.assertEqual(depois_detalhe, antes_detalhe)

    # ------------------------------------------------------------ (f): faculdade
    def test_patch_nome_da_faculdade_ies_destino_renova_atualizado_em(self):
        antes_fac = self._faculdade_updated_at(self.fac_a_id)
        antes_detalhe = self._detail()["atualizado_em"]
        novo_nome = f"{self.prefix} Fac A Renomeada"

        self.faculdades_repo.atualizar(self.fac_a_id, self.executor, nome=novo_nome)

        depois_fac = self._faculdade_updated_at(self.fac_a_id)
        detalhe = self._detail()
        self.assertGreater(depois_fac, antes_fac)
        self.assertGreater(detalhe["atualizado_em"], antes_detalhe)
        self.assertEqual(detalhe["ies_destino_nome"], novo_nome)

    def test_patch_nome_da_faculdade_so_membro_do_resumo_tambem_renova_atualizado_em(self):
        """fac_c não é ies_destino/ies_origem: só aparece na lista ``faculdades``
        do resumo da rota principal de ida. Sem o novo candidato em ``_version``,
        este teste falharia."""
        antes_fac = self._faculdade_updated_at(self.fac_c_id)
        antes_detalhe = self._detail()["atualizado_em"]
        novo_nome = f"{self.prefix} Fac C Renomeada"

        self.faculdades_repo.atualizar(self.fac_c_id, self.executor, nome=novo_nome)

        depois_fac = self._faculdade_updated_at(self.fac_c_id)
        detalhe = self._detail()
        self.assertGreater(depois_fac, antes_fac)
        self.assertGreater(detalhe["atualizado_em"], antes_detalhe)
        nomes = {f["nome"] for f in detalhe["rota_principal_ida"]["faculdades"]}
        self.assertIn(novo_nome, nomes)

    def test_patch_nome_da_faculdade_com_mesmo_nome_nao_renova(self):
        antes_fac = self._faculdade_updated_at(self.fac_a_id)
        antes_detalhe = self._detail()["atualizado_em"]

        self.faculdades_repo.atualizar(
            self.fac_a_id, self.executor, nome=f"{self.prefix} Fac A"
        )

        depois_fac = self._faculdade_updated_at(self.fac_a_id)
        depois_detalhe = self._detail()["atualizado_em"]
        self.assertEqual(depois_fac, antes_fac)
        self.assertEqual(depois_detalhe, antes_detalhe)

    # ------------------------------------------------------------ (g)/(h): leitura
    def test_dois_gets_seguidos_sem_patch_mantem_corpo_e_versao_estaveis(self):
        primeiro = self._detail()
        segundo = self._detail()
        self.assertEqual(primeiro, segundo)

    def test_get_nao_escreve_nenhuma_linha_envolvida(self):
        antes = {
            "agendamento": self.session.get(AgendamentoORM, self.agendamento_id).updated_at,
            "rota": self._rota_updated_at(),
            "ponto_emb": self._ponto_updated_at(self.ponto_emb_id),
            "ponto_desemb": self._ponto_updated_at(self.ponto_desemb_id),
            "fac_a": self._faculdade_updated_at(self.fac_a_id),
            "fac_b": self._faculdade_updated_at(self.fac_b_id),
            "fac_c": self._faculdade_updated_at(self.fac_c_id),
        }

        for _ in range(3):
            self._detail()

        fresh = self.session_factory()
        try:
            depois = {
                "agendamento": fresh.get(AgendamentoORM, self.agendamento_id).updated_at,
                "rota": fresh.get(RotaPrincipalORM, self.rota_id).updated_at,
                "ponto_emb": fresh.get(PontoDeParadaORM, self.ponto_emb_id).updated_at,
                "ponto_desemb": fresh.get(PontoDeParadaORM, self.ponto_desemb_id).updated_at,
                "fac_a": fresh.get(FaculdadeORM, self.fac_a_id).updated_at,
                "fac_b": fresh.get(FaculdadeORM, self.fac_b_id).updated_at,
                "fac_c": fresh.get(FaculdadeORM, self.fac_c_id).updated_at,
            }
        finally:
            fresh.close()
        self.assertEqual(depois, antes)


@unittest.skipUnless(
    INTEGRATION_DATABASE_URL,
    "defina HU015_INTEGRATION_DATABASE_URL para executar a integração PostgreSQL",
)
class Migration82PostgreSQLTest(unittest.TestCase):
    """Roda downgrade e upgrade isolado da migration 82 (updated_at em
    faculdade/ponto_de_parada) e restaura o estado original do banco."""

    def setUp(self):
        self.config = Config()
        self.config.set_main_option("script_location", os.path.abspath(MIGRATIONS_DIR))
        self.head = ScriptDirectory(os.path.abspath(MIGRATIONS_DIR)).get_heads()[0]

    def versoes(self) -> set[str]:
        with engine.connect() as conn:
            return set(conn.execute(text("SELECT version_num FROM alembic_version")).scalars())

    def test_downgrade_remove_colunas_e_upgrade_as_recria_com_server_default_e_onupdate(self):
        engine.dispose()
        try:
            command.downgrade(self.config, "81_add_updated_at_rotas")
            self.assertEqual(self.versoes(), {"81_add_updated_at_rotas"})
            inspector = inspect(engine)
            for tabela in ("faculdade", "ponto_de_parada"):
                colunas = {c["name"] for c in inspector.get_columns(tabela)}
                self.assertNotIn("updated_at", colunas)
        finally:
            command.upgrade(self.config, "head")

        self.assertEqual(self.versoes(), {self.head})
        inspector = inspect(engine)
        for tabela in ("faculdade", "ponto_de_parada"):
            coluna = next(
                c for c in inspector.get_columns(tabela) if c["name"] == "updated_at"
            )
            self.assertFalse(coluna["nullable"])

        # server_default no INSERT e onupdate no UPDATE (via ORM: onupdate só
        # dispara em statements compilados pelo SQLAlchemy, não em SQL puro).
        import time as _time

        prefixo = f"HU015 M82 {uuid4().hex[:8]}"
        session = sessionmaker(bind=engine)()
        try:
            faculdade = FaculdadeORM(
                nome_faculdade=f"{prefixo} Faculdade", campus_faculdade="Quixadá", ativo=True
            )
            session.add(faculdade)
            session.commit()
            session.refresh(faculdade)
            criado_em = faculdade.updated_at
            self.assertIsNotNone(criado_em)

            _time.sleep(1.1)
            faculdade.nome_faculdade = f"{prefixo} Faculdade Editada"
            session.commit()
            session.refresh(faculdade)
            atualizado_em = faculdade.updated_at
            self.assertGreater(atualizado_em, criado_em)
        finally:
            session.query(FaculdadeORM).filter(
                FaculdadeORM.nome_faculdade.like(f"{prefixo}%")
            ).delete(synchronize_session=False)
            session.commit()
            session.close()


if __name__ == "__main__":
    unittest.main()
