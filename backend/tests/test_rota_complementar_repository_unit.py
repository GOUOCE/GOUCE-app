"""Testes unitários puros do repository de rotas complementares: sem banco, rede ou relógio.

A sessão é um ``MagicMock``; as consultas SQL (cobertas com SQLite/Postgres nos
demais arquivos) são substituídas por ``patch.object`` nos métodos privados.
"""

import json
import unittest
from datetime import time
from unittest.mock import MagicMock, patch

from tests.rota_complementar_support import ADMIN_ID

from sqlalchemy.exc import IntegrityError

from src.modulos.rotas.infrastructure.repositories.rota_complementar_repository import (
    RotaComplementarComPrincipalInativaError,
    RotaComplementarNomeEmUsoError,
    RotaComplementarReferenciaInvalidaError,
    RotaComplementarRepository,
)
from src.modulos.rotas.model.entities.rota_complementar import RotaComplementarORM
from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM
from src.shared.infrastructure.audit_model import LogAuditoriaORM

MENSAGEM_NOME_EM_USO = "Já existe uma rota com este nome."


def principal(principal_id=1, nome="Rota Centro - UFC", ativo=True):
    return RotaPrincipalORM(
        id=principal_id, nome=nome, horario_saida=time(6, 30),
        horario_retorno=time(17, 30), ativo=ativo,
    )


def complementar_em_memoria(ativo=True, nome="Van 2", principal_ativa=True):
    rota = RotaComplementarORM(
        id=1, rota_principal_id=1, nome=nome, horario_saida=time(6, 0),
        horario_retorno=time(17, 40), ponto_conexao="Trevo", ativo=ativo,
    )
    rota.rota_principal = principal(ativo=principal_ativa)
    return rota


def logs_adicionados(session):
    objetos = [chamada.args[0] for chamada in session.add.call_args_list]
    return [o for o in objetos if isinstance(o, LogAuditoriaORM)]


class RepositoryUnitBase(unittest.TestCase):
    def setUp(self):
        self.session = MagicMock()
        self.repository = RotaComplementarRepository(self.session)

    def patch_repo(self, nome, **kwargs):
        patcher = patch.object(RotaComplementarRepository, nome, **kwargs)
        mock = patcher.start()
        self.addCleanup(patcher.stop)
        return mock


class AgendamentosFuturosTest(RepositoryUnitBase):
    def test_sem_checker_falha_aberto_e_nao_consulta_o_banco(self):
        self.assertIs(self.repository.possui_agendamentos_futuros(1), False)
        self.session.query.assert_not_called()
        self.session.execute.assert_not_called()

    def test_com_checker_usa_o_resultado_convertido_para_bool(self):
        for retorno, esperado in ((True, True), (False, False), (1, True), (0, False), ([], False)):
            with self.subTest(retorno=retorno):
                repository = RotaComplementarRepository(
                    self.session, agendamentos_futuros_checker=lambda _id, r=retorno: r
                )
                self.assertIs(repository.possui_agendamentos_futuros(1), esperado)

    def test_checker_recebe_o_id_da_rota(self):
        consultados = []
        repository = RotaComplementarRepository(
            self.session, agendamentos_futuros_checker=lambda rota_id: consultados.append(rota_id)
        )

        repository.possui_agendamentos_futuros(7)

        self.assertEqual(consultados, [7])


class PrincipalInativaTest(RepositoryUnitBase):
    def test_rota_inexistente_nao_tem_principal_inativa(self):
        self.patch_repo("_buscar_orm", return_value=None)

        self.assertFalse(self.repository.principal_inativa(1))

    def test_reflete_o_estado_da_principal(self):
        for principal_ativa in (True, False):
            with self.subTest(principal_ativa=principal_ativa):
                self.patch_repo(
                    "_buscar_orm", return_value=complementar_em_memoria(principal_ativa=principal_ativa)
                )
                self.assertIs(self.repository.principal_inativa(1), not principal_ativa)


class NomeEmUsoTest(RepositoryUnitBase):
    """A consulta nos dois tipos de rota é testada com SQLite em test_nome_rota.py."""

    def test_delega_aos_dois_tipos_ignorando_so_a_propria_complementar(self):
        modulo = "src.modulos.rotas.infrastructure.repositories.rota_complementar_repository"
        for ignorar, resultado in ((None, True), (1, False)):
            with self.subTest(ignorar=ignorar), patch(
                f"{modulo}.nome_rota_em_uso", return_value=resultado
            ) as consulta:
                self.assertIs(self.repository.nome_em_uso("Van", ignorar_rota_id=ignorar), resultado)
                consulta.assert_called_once_with(
                    self.session, "Van", ignorar_complementar_id=ignorar
                )


class CriarTest(RepositoryUnitBase):
    def setUp(self):
        super().setUp()
        self.nome_em_uso = self.patch_repo("nome_em_uso", return_value=False)
        self.carregar = self.patch_repo("_carregar_principal_ativa", return_value=principal())
        self.serializar = self.patch_repo("_serializar", return_value={"id": 1})

    def criar(self, **alteracoes):
        argumentos = dict(
            nome="  Van 2 ", horario_saida=time(6, 0), horario_retorno=time(17, 40),
            ponto_conexao=" Trevo ",
            rota_principal_id=1, usuario_executor_id=ADMIN_ID,
        )
        argumentos.update(alteracoes)
        return self.repository.criar(**argumentos)

    def test_normaliza_nome_e_ponto_e_grava_exatamente_um_log_criar(self):
        def atribuir_id(rota):
            rota.id = 5

        self.session.add.side_effect = atribuir_id
        self.session.flush.side_effect = lambda: None

        with patch.object(RotaComplementarRepository, "_snapshot", return_value="{}"):
            self.assertEqual(self.criar(), {"id": 1})

        rotas = [c.args[0] for c in self.session.add.call_args_list if isinstance(c.args[0], RotaComplementarORM)]
        self.assertEqual((rotas[0].nome, rotas[0].ponto_conexao, rotas[0].ativo), ("Van 2", "Trevo", True))
        logs = logs_adicionados(self.session)
        self.assertEqual(len(logs), 1)
        self.assertEqual((logs[0].acao, logs[0].entidade, logs[0].usuario_id), ("CRIAR", "rota_complementar", ADMIN_ID))
        self.assertIsNone(logs[0].valor_anterior)
        self.session.commit.assert_called_once()

    def test_flush_antecede_o_log_para_ter_o_id(self):
        ordem = []
        self.session.flush.side_effect = lambda: ordem.append("flush")
        self.session.add.side_effect = lambda o: ordem.append(type(o).__name__)
        with patch.object(RotaComplementarRepository, "_snapshot", return_value="{}"):
            self.criar()

        self.assertEqual(ordem, ["RotaComplementarORM", "flush", "LogAuditoriaORM"])

    def test_nome_em_uso_nao_grava_rota_nem_log(self):
        self.nome_em_uso.return_value = True

        with self.assertRaises(RotaComplementarNomeEmUsoError) as ctx:
            self.criar()

        self.assertEqual(str(ctx.exception), MENSAGEM_NOME_EM_USO)
        self.session.add.assert_not_called()
        self.session.commit.assert_not_called()
        self.session.rollback.assert_called_once()

    def test_principal_invalida_nao_grava_nada(self):
        self.carregar.side_effect = RotaComplementarReferenciaInvalidaError(
            "rota_principal_id", "Rota principal inativa ou inexistente."
        )

        with self.assertRaises(RotaComplementarReferenciaInvalidaError):
            self.criar()

        self.session.add.assert_not_called()
        self.session.commit.assert_not_called()

    def test_violacao_de_unicidade_no_commit_vira_nome_em_uso(self):
        self.session.commit.side_effect = IntegrityError("i", {}, Exception("dup"))
        self.nome_em_uso.side_effect = [False, True]
        with patch.object(RotaComplementarRepository, "_snapshot", return_value="{}"):
            with self.assertRaises(RotaComplementarNomeEmUsoError):
                self.criar()

        self.session.rollback.assert_called()

    def test_violacao_de_integridade_que_nao_e_de_nome_e_repassada(self):
        self.session.commit.side_effect = IntegrityError("i", {}, Exception("fk"))
        self.nome_em_uso.side_effect = [False, False]
        with patch.object(RotaComplementarRepository, "_snapshot", return_value="{}"):
            with self.assertRaises(IntegrityError):
                self.criar()

    def test_falha_inesperada_desfaz_a_transacao(self):
        self.session.commit.side_effect = RuntimeError("falha")
        with patch.object(RotaComplementarRepository, "_snapshot", return_value="{}"):
            with self.assertRaises(RuntimeError):
                self.criar()

        self.session.rollback.assert_called_once()


class AtualizarTest(RepositoryUnitBase):
    def setUp(self):
        super().setUp()
        self.rota = complementar_em_memoria()
        self.patch_repo("_buscar_orm", return_value=self.rota)
        self.nome_em_uso = self.patch_repo("nome_em_uso", return_value=False)
        self.carregar = self.patch_repo("_carregar_principal_ativa")

    def test_rota_inexistente_devolve_none_sem_escrever(self):
        self.patch_repo("_buscar_orm", return_value=None)

        self.assertIsNone(self.repository.atualizar(1, {"nome": "X"}, ADMIN_ID))

        self.session.add.assert_not_called()
        self.session.commit.assert_not_called()

    def test_mudanca_grava_um_unico_log_editar_com_antes_e_depois(self):
        self.repository.atualizar(
            1, {"nome": " Van 3 ", "horario_saida": time(5, 45), "horario_retorno": time(18, 10),
                "ponto_conexao": " Posto "}, ADMIN_ID
        )

        logs = logs_adicionados(self.session)
        self.assertEqual([l.acao for l in logs], ["EDITAR"])
        antes, depois = json.loads(logs[0].valor_anterior), json.loads(logs[0].valor_novo)
        self.assertEqual(antes["nome"], "Van 2")
        self.assertEqual(
            (depois["nome"], depois["horario_saida"], depois["horario_retorno"], depois["ponto_conexao"]),
            ("Van 3", "05:45", "18:10", "Posto"),
        )
        self.session.commit.assert_called_once()

    def test_edicao_sem_mudanca_efetiva_nao_grava_log_mas_confirma(self):
        self.repository.atualizar(1, {"nome": "Van 2", "rota_principal_id": 1}, ADMIN_ID)

        self.assertEqual(logs_adicionados(self.session), [])
        self.carregar.assert_not_called()
        self.session.commit.assert_called_once()

    def test_mesma_principal_inativa_e_mantida_sem_consultar(self):
        self.patch_repo("_buscar_orm", return_value=complementar_em_memoria(principal_ativa=False))

        self.repository.atualizar(1, {"rota_principal_id": 1}, ADMIN_ID)

        self.carregar.assert_not_called()

    def test_nova_principal_e_carregada_e_trocada(self):
        self.carregar.return_value = principal(2, "Rota Integrada")

        self.repository.atualizar(1, {"rota_principal_id": 2}, ADMIN_ID)

        self.carregar.assert_called_once_with(2)
        self.assertEqual(self.rota.rota_principal.id, 2)
        self.assertEqual(json.loads(logs_adicionados(self.session)[0].valor_novo)["rota_principal_id"], 2)

    def test_campos_nao_enviados_ficam_intactos(self):
        self.repository.atualizar(1, {"nome": "Van 9"}, ADMIN_ID)

        self.assertEqual(
            (self.rota.horario_saida, self.rota.horario_retorno, self.rota.ponto_conexao,
             self.rota.rota_principal.id),
            (time(6, 0), time(17, 40), "Trevo", 1),
        )

    def test_nome_de_outra_rota_nao_grava_e_desfaz(self):
        self.nome_em_uso.return_value = True

        with self.assertRaises(RotaComplementarNomeEmUsoError):
            self.repository.atualizar(1, {"nome": "Van 1"}, ADMIN_ID)

        self.nome_em_uso.assert_called_once_with("Van 1", ignorar_rota_id=1)
        self.assertEqual(logs_adicionados(self.session), [])
        self.session.commit.assert_not_called()
        self.session.rollback.assert_called_once()

    def test_principal_invalida_nao_altera_a_rota_nem_grava_log(self):
        self.carregar.side_effect = RotaComplementarReferenciaInvalidaError("rota_principal_id", "m")

        with self.assertRaises(RotaComplementarReferenciaInvalidaError):
            self.repository.atualizar(1, {"nome": "Van 9", "rota_principal_id": 3}, ADMIN_ID)

        self.assertEqual(self.rota.nome, "Van 2")
        self.assertEqual(logs_adicionados(self.session), [])

    def test_violacao_de_unicidade_no_commit_vira_nome_em_uso(self):
        self.session.commit.side_effect = IntegrityError("i", {}, Exception("dup"))
        self.nome_em_uso.side_effect = [False, True]

        with self.assertRaises(RotaComplementarNomeEmUsoError):
            self.repository.atualizar(1, {"nome": "Van 9"}, ADMIN_ID)

    def test_integridade_sem_nome_ou_sem_conflito_de_nome_e_repassada(self):
        self.session.commit.side_effect = IntegrityError("i", {}, Exception("x"))
        with self.assertRaises(IntegrityError):
            self.repository.atualizar(1, {"ponto_conexao": "Posto"}, ADMIN_ID)

        self.nome_em_uso.side_effect = [False, False]
        with self.assertRaises(IntegrityError):
            self.repository.atualizar(1, {"nome": "Van 9"}, ADMIN_ID)

    def test_falha_inesperada_desfaz_e_repassa(self):
        self.session.commit.side_effect = RuntimeError("falha")

        with self.assertRaises(RuntimeError):
            self.repository.atualizar(1, {"nome": "Van 9"}, ADMIN_ID)

        self.session.rollback.assert_called_once()


class AlterarStatusTest(RepositoryUnitBase):
    def setUp(self):
        super().setUp()
        self.patch_repo("_serializar", return_value={"ok": True})

    def test_inativar_grava_um_log_e_altera_o_estado(self):
        rota = complementar_em_memoria(ativo=True)
        self.patch_repo("_buscar_orm", return_value=rota)

        self.assertEqual(self.repository.inativar(1, ADMIN_ID), {"ok": True})

        self.assertFalse(rota.ativo)
        (log,) = logs_adicionados(self.session)
        self.assertEqual(
            (log.acao, log.valor_anterior, log.valor_novo, log.entidade, log.entidade_id),
            ("INATIVAR", "ativo", "inativo", "rota_complementar", 1),
        )
        self.session.commit.assert_called_once()

    def test_reativar_grava_um_log_e_altera_o_estado(self):
        rota = complementar_em_memoria(ativo=False)
        self.patch_repo("_buscar_orm", return_value=rota)
        self.patch_repo("_ler_principal_para_atualizar", return_value=rota.rota_principal)

        self.repository.reativar(1, ADMIN_ID)

        self.assertTrue(rota.ativo)
        (log,) = logs_adicionados(self.session)
        self.assertEqual((log.acao, log.valor_anterior, log.valor_novo), ("REATIVAR", "inativo", "ativo"))

    def test_reativar_com_principal_inativa_na_leitura_travada_nao_altera_nem_grava(self):
        rota = complementar_em_memoria(ativo=False, principal_ativa=True)
        self.patch_repo("_buscar_orm", return_value=rota)
        self.patch_repo("_ler_principal_para_atualizar", return_value=principal(ativo=False))

        with self.assertRaises(RotaComplementarComPrincipalInativaError) as ctx:
            self.repository.reativar(1, ADMIN_ID)

        self.assertEqual(
            str(ctx.exception),
            "Não é possível reativar esta rota complementar pois a rota principal vinculada está inativa.",
        )
        self.assertFalse(rota.ativo)
        self.assertEqual(logs_adicionados(self.session), [])
        self.session.commit.assert_not_called()
        self.session.rollback.assert_called_once()

    def test_repetir_o_estado_nao_grava_log_nem_confirma(self):
        for ativo, operacao in ((False, "inativar"), (True, "reativar")):
            with self.subTest(operacao=operacao):
                self.session.reset_mock()
                self.patch_repo("_buscar_orm", return_value=complementar_em_memoria(ativo=ativo))
                getattr(self.repository, operacao)(1, ADMIN_ID)
                self.assertEqual(logs_adicionados(self.session), [])
                self.session.commit.assert_not_called()

    def test_rota_inexistente_devolve_none_sem_log(self):
        self.patch_repo("_buscar_orm", return_value=None)

        self.assertIsNone(self.repository.inativar(1, ADMIN_ID))
        self.assertIsNone(self.repository.reativar(1, ADMIN_ID))
        self.session.add.assert_not_called()

    def test_falha_no_commit_desfaz_e_repassa(self):
        self.patch_repo("_buscar_orm", return_value=complementar_em_memoria())
        self.session.commit.side_effect = RuntimeError("falha")

        with self.assertRaises(RuntimeError):
            self.repository.inativar(1, ADMIN_ID)

        self.session.rollback.assert_called_once()


class SerializacaoTest(unittest.TestCase):
    def test_serializa_horario_hh_mm_e_principal_resumida(self):
        rota = complementar_em_memoria(principal_ativa=False)

        self.assertEqual(
            RotaComplementarRepository._serializar(rota),
            {
                "id": 1, "nome": "Van 2", "horario_saida": "06:00", "horario_retorno": "17:40",
                "ponto_conexao": "Trevo", "ativo": True,
                "rota_principal": {"id": 1, "nome": "Rota Centro - UFC", "ativo": False},
            },
        )

    def test_snapshot_e_json_estavel_e_completo(self):
        rota = complementar_em_memoria()

        primeiro = RotaComplementarRepository._snapshot(rota)

        self.assertEqual(primeiro, RotaComplementarRepository._snapshot(rota))
        self.assertEqual(
            json.loads(primeiro),
            {"nome": "Van 2", "horario_saida": "06:00", "horario_retorno": "17:40",
             "ponto_conexao": "Trevo", "rota_principal_id": 1, "ativo": True},
        )
