"""Testes unitários puros dos checkers "pertence a uma rota ativa?" e da ligação deles
aos repositories e rotas de bairro, ponto de parada e faculdade (sessão simulada)."""

import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from tests.rota_principal_support import ADMIN_ID, asgi_request

from fastapi import FastAPI

from src.modulos.crud_basicos.infrastructure.repositories.bairro_repository import (
    BairroComRotaAtivaError,
    BairroJaDesativadoError,
    BairroRepository,
)
from src.modulos.crud_basicos.infrastructure.repositories.faculdade_repository import (
    FaculdadeComRotaAtivaError,
    FaculdadeJaDesativadaError,
    FaculdadeRepository,
)
from src.modulos.crud_basicos.infrastructure.repositories.ponto_parada_repository import (
    PontoDeParadaComRotaAtivaError,
    PontoDeParadaRepository,
)
from src.modulos.crud_basicos.interface.http import bairro_routes, faculdade_routes
from src.modulos.rotas.infrastructure.rota_ativa_checkers import (
    bairro_em_rota_ativa,
    faculdade_em_rota_ativa,
    ponto_em_rota_ativa,
)
from src.shared.auth.dependencies import get_current_user
from src.shared.infrastructure.audit_model import LogAuditoriaORM

MENSAGEM_BAIRRO = (
    "Este bairro não pode ser inativado pois pertence a uma rota ativa. "
    "Remova-o da rota antes de continuar."
)
MENSAGEM_PONTO = "Este ponto pertence a uma rota ativa. Remova-o da rota antes de continuar."
MENSAGEM_FACULDADE = (
    "Esta faculdade não pode ser inativada pois pertence a uma rota ativa. "
    "Remova-a da rota antes de continuar."
)


def sql_de(session, indice=-1):
    """SQL (com literais) da consulta enviada a ``session.execute``."""
    comando = session.execute.call_args_list[indice].args[0]
    return str(comando.compile(compile_kwargs={"literal_binds": True}))


def sessao_com_resultados(*linhas):
    session = MagicMock()
    session.execute.return_value.first.side_effect = list(linhas)
    return session


class CheckersTest(unittest.TestCase):
    def test_bairro_em_rota_ativa_true_e_false(self):
        self.assertTrue(bairro_em_rota_ativa(sessao_com_resultados((1,)))(7))
        self.assertFalse(bairro_em_rota_ativa(sessao_com_resultados(None))(7))

    def test_bairro_consulta_o_vinculo_de_bairro_apenas_de_rotas_ativas(self):
        session = sessao_com_resultados(None)

        bairro_em_rota_ativa(session)(7)

        sql = sql_de(session)
        self.assertIn("rota_principal_bairro", sql)
        self.assertIn("rota_principal.ativo IS true", sql)
        self.assertIn("rota_principal_bairro.bairro_id = 7", sql)

    def test_ponto_em_rota_ativa_true_e_false(self):
        self.assertTrue(ponto_em_rota_ativa(sessao_com_resultados((1,)))(5))
        self.assertFalse(ponto_em_rota_ativa(sessao_com_resultados(None))(5))

    def test_ponto_consulta_o_bairro_do_ponto_em_rotas_ativas(self):
        session = sessao_com_resultados(None)

        ponto_em_rota_ativa(session)(5)

        sql = sql_de(session)
        self.assertIn("ponto_de_parada.bairro_id = rota_principal_bairro.bairro_id", sql)
        self.assertIn("ponto_de_parada.ponto_id = 5", sql)
        self.assertIn("rota_principal.ativo IS true", sql)

    def test_faculdade_so_na_ida_e_detectada_sem_consultar_a_volta(self):
        session = sessao_com_resultados((1,))

        self.assertTrue(faculdade_em_rota_ativa(session)(3))

        self.assertEqual(session.execute.call_count, 1)
        self.assertIn("rota_principal_faculdade_ida.faculdade_id = 3", sql_de(session))

    def test_faculdade_so_na_volta_e_detectada_apos_consultar_a_ida(self):
        session = sessao_com_resultados(None, (1,))

        self.assertTrue(faculdade_em_rota_ativa(session)(3))

        self.assertEqual(session.execute.call_count, 2)
        self.assertIn("rota_principal_faculdade_ida", sql_de(session, 0))
        self.assertIn("rota_principal_faculdade_volta.faculdade_id = 3", sql_de(session, 1))
        self.assertIn("rota_principal.ativo IS true", sql_de(session, 1))

    def test_faculdade_fora_de_rotas_ativas_e_false(self):
        session = sessao_com_resultados(None, None)

        self.assertFalse(faculdade_em_rota_ativa(session)(3))
        self.assertEqual(session.execute.call_count, 2)


class LigacaoAosRepositoriesTest(unittest.TestCase):
    def test_bairro_bloqueado_nao_altera_nem_grava_log(self):
        session = MagicMock()
        repo = BairroRepository(session, rota_ativa_checker=lambda _id: True)
        entidade = SimpleNamespace(bairro_id=1, ativo=True)

        with patch.object(repo, "buscar_por_id", return_value=entidade):
            with self.assertRaises(BairroComRotaAtivaError) as ctx:
                repo.inativar(1, usuario_executor_id=ADMIN_ID)

        self.assertEqual(str(ctx.exception), MENSAGEM_BAIRRO)
        self.assertTrue(entidade.ativo)
        session.add.assert_not_called()
        session.commit.assert_not_called()

    def test_bairro_liberado_inativa_e_grava_um_log(self):
        session = MagicMock()
        consultados = []
        repo = BairroRepository(session, rota_ativa_checker=lambda i: consultados.append(i) or False)
        entidade = SimpleNamespace(bairro_id=1, ativo=True)

        with patch.object(repo, "buscar_por_id", return_value=entidade):
            repo.inativar(1, usuario_executor_id=ADMIN_ID)

        self.assertEqual(consultados, [1])
        self.assertFalse(entidade.ativo)
        (log,) = [c.args[0] for c in session.add.call_args_list]
        self.assertEqual((log.acao, log.entidade, log.usuario_id), ("INATIVAR", "bairro", ADMIN_ID))

    def test_bairro_ja_inativo_nao_consulta_o_checker(self):
        checker = MagicMock(return_value=True)
        repo = BairroRepository(MagicMock(), rota_ativa_checker=checker)

        with patch.object(repo, "buscar_por_id", return_value=SimpleNamespace(ativo=False)):
            with self.assertRaises(BairroJaDesativadoError):
                repo.inativar(1)

        checker.assert_not_called()

    def test_ponto_bloqueado_nao_altera_nem_grava_log(self):
        session = MagicMock()
        repo = PontoDeParadaRepository(session, rota_ativa_checker=lambda _id: True)
        entidade = SimpleNamespace(ponto_id=1, ativo=True)

        with patch.object(repo, "buscar_por_id", return_value=entidade):
            with self.assertRaises(PontoDeParadaComRotaAtivaError) as ctx:
                repo.inativar(1, usuario_executor_id=ADMIN_ID)

        self.assertEqual(str(ctx.exception), MENSAGEM_PONTO)
        self.assertTrue(entidade.ativo)
        session.add.assert_not_called()

    def test_ponto_liberado_inativa_e_grava_um_log(self):
        session = MagicMock()
        repo = PontoDeParadaRepository(session, rota_ativa_checker=lambda _id: False)
        entidade = SimpleNamespace(ponto_id=1, ativo=True)

        with patch.object(repo, "buscar_por_id", return_value=entidade):
            repo.inativar(1, usuario_executor_id=ADMIN_ID)

        self.assertFalse(entidade.ativo)
        (log,) = [c.args[0] for c in session.add.call_args_list]
        self.assertEqual((log.acao, log.entidade), ("INATIVAR", "ponto_de_parada"))

    def test_sem_checker_bairro_ponto_e_faculdade_falham_abertos(self):
        self.assertFalse(BairroRepository(MagicMock()).possui_rota_ativa(1))
        self.assertFalse(PontoDeParadaRepository(MagicMock()).possui_rota_ativa(1))
        self.assertFalse(FaculdadeRepository(MagicMock()).possui_rota_ativa(1))


class FaculdadeComCheckerTest(unittest.TestCase):
    def setUp(self):
        self.session = MagicMock()
        self.entidade = SimpleNamespace(
            id_faculdade=1, nome_faculdade="UFC", campus_faculdade="Quixadá", sigla=None, ativo=True
        )

    def repositorio(self, resultado_do_checker):
        self.checker = MagicMock(return_value=resultado_do_checker)
        repo = FaculdadeRepository(self.session, rota_ativa_checker=self.checker)
        for nome, retorno in (("buscar_por_id", self.entidade), ("existe_por_nome_e_campus", False)):
            patcher = patch.object(repo, nome, return_value=retorno)
            self.addCleanup(patcher.stop)
            patcher.start()
        return repo

    def logs(self):
        return [c.args[0] for c in self.session.add.call_args_list if isinstance(c.args[0], LogAuditoriaORM)]

    def test_inativar_bloqueada_nao_altera_nem_grava_log(self):
        repo = self.repositorio(True)

        with self.assertRaises(FaculdadeComRotaAtivaError) as ctx:
            repo.inativar(1, ADMIN_ID)

        self.assertEqual(str(ctx.exception), MENSAGEM_FACULDADE)
        self.checker.assert_called_once_with(1)
        self.assertTrue(self.entidade.ativo)
        self.session.add.assert_not_called()
        self.session.commit.assert_not_called()

    def test_inativar_liberada_inativa_e_grava_um_log(self):
        repo = self.repositorio(False)

        repo.inativar(1, ADMIN_ID)

        self.assertFalse(self.entidade.ativo)
        (log,) = self.logs()
        self.assertEqual((log.acao, log.entidade, log.valor_anterior, log.valor_novo), ("INATIVAR", "faculdade", "ativo", "inativo"))

    def test_inativar_faculdade_ja_inativa_nao_consulta_o_checker(self):
        self.entidade.ativo = False
        repo = self.repositorio(True)

        with self.assertRaises(FaculdadeJaDesativadaError):
            repo.inativar(1, ADMIN_ID)

        self.checker.assert_not_called()

    def test_atualizar_para_inativa_com_rota_ativa_e_bloqueado_antes_de_qualquer_escrita(self):
        repo = self.repositorio(True)

        with self.assertRaises(FaculdadeComRotaAtivaError) as ctx:
            repo.atualizar(1, ADMIN_ID, nome="Outra", ativo=False)

        self.assertEqual(str(ctx.exception), MENSAGEM_FACULDADE)
        self.assertEqual(self.entidade.nome_faculdade, "UFC")
        self.assertTrue(self.entidade.ativo)
        self.session.add.assert_not_called()
        self.session.commit.assert_not_called()

    def test_atualizar_para_inativa_liberada_grava_um_log(self):
        repo = self.repositorio(False)

        repo.atualizar(1, ADMIN_ID, ativo=False)

        self.assertFalse(self.entidade.ativo)
        self.assertEqual([l.acao for l in self.logs()], ["INATIVAR"])

    def test_checker_so_e_consultado_na_transicao_ativa_para_inativa(self):
        casos = [
            ("ativar uma ativa", True, dict(ativo=True)),
            ("sem alterar status", True, dict(nome="Outra")),
            ("inativar uma inativa", False, dict(ativo=False)),
            ("reativar uma inativa", False, dict(ativo=True)),
        ]
        for descricao, estado_inicial, argumentos in casos:
            with self.subTest(caso=descricao):
                self.session.reset_mock()
                self.entidade.ativo = estado_inicial
                repo = self.repositorio(True)
                repo.atualizar(1, ADMIN_ID, **argumentos)
                self.checker.assert_not_called()


class LigacaoNasRotasHttpTest(unittest.IsolatedAsyncioTestCase):
    def test_get_repository_de_bairro_e_faculdade_injetam_um_checker_funcional(self):
        for modulo in (bairro_routes, faculdade_routes):
            with self.subTest(modulo=modulo.__name__):
                session = sessao_com_resultados((1,))
                repo = modulo.get_repository(session)
                self.assertIsNotNone(repo._rota_ativa_checker)
                self.assertTrue(repo.possui_rota_ativa(1))
                session.execute.assert_called()

    def montar_app(self, modulo, servico):
        app = FastAPI()
        app.include_router(modulo.router)
        app.dependency_overrides[modulo.get_service] = lambda: servico
        app.dependency_overrides[get_current_user] = lambda: {
            "sub": "1", "type": "access", "role": "administrador",
            "current_roles": ["administrador"], "current_user_id": 1,
        }
        return app

    async def test_bairro_inativar_com_rota_ativa_responde_409_com_mensagem_exata(self):
        servico = MagicMock()
        servico.inativar.side_effect = BairroComRotaAtivaError(MENSAGEM_BAIRRO)

        status, corpo = await asgi_request(self.montar_app(bairro_routes, servico), "PATCH", "/bairros/1/inativar")

        self.assertEqual(status, 409)
        self.assertEqual(corpo["error"], {"code": "CONFLICT", "message": MENSAGEM_BAIRRO})

    async def test_faculdade_inativar_e_atualizar_com_rota_ativa_respondem_409(self):
        servico = MagicMock()
        servico.inativar.side_effect = FaculdadeComRotaAtivaError(MENSAGEM_FACULDADE)
        servico.atualizar.side_effect = FaculdadeComRotaAtivaError(MENSAGEM_FACULDADE)
        app = self.montar_app(faculdade_routes, servico)

        for metodo, caminho, corpo in (
            ("PATCH", "/faculdades/1/inativar", None),
            ("PATCH", "/faculdades/1", {"ativo": False}),
        ):
            with self.subTest(caminho=caminho):
                status, resposta = await asgi_request(app, metodo, caminho, corpo)
                self.assertEqual(status, 409)
                self.assertEqual(resposta["error"], {"code": "CONFLICT", "message": MENSAGEM_FACULDADE})


if __name__ == "__main__":
    unittest.main()
