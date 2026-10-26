"""Testes unitários puros do repository de rotas: sem banco, rede ou relógio real.

A sessão é um ``MagicMock``; as consultas SQL (cobertas com SQLite/Postgres nos
demais arquivos) são substituídas por ``patch.object`` nos métodos privados.
"""

import json
import unittest
from datetime import time
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from tests.rota_principal_support import ADMIN_ID

from sqlalchemy.exc import IntegrityError

from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
from src.modulos.rotas.infrastructure.repositories.rota_principal_repository import (
    RotaPrincipalNomeEmUsoError,
    RotaPrincipalRepository,
    RotaReferenciaInvalidaError,
)
from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM
from src.shared.infrastructure.audit_model import LogAuditoriaORM

MENSAGEM_NOME_EM_USO = "Já existe uma rota com este nome."


def bairro(bairro_id=1, nome="Centro", ativo=True):
    return BairroORM(bairro_id=bairro_id, nome=nome, ativo=ativo)


def faculdade(faculdade_id=1, nome="UFC", ativo=True):
    return FaculdadeORM(
        id_faculdade=faculdade_id, nome_faculdade=nome, campus_faculdade="Quixadá", ativo=ativo
    )


def rota_em_memoria(ativo=True, nome="Rota A"):
    rota = RotaPrincipalORM(
        id=1, nome=nome, horario_saida=time(6, 30), horario_retorno=time(17, 30), ativo=ativo
    )
    rota.bairros = [bairro(1)]
    rota.faculdades_ida = [faculdade(1)]
    rota.faculdades_volta = [faculdade(1)]
    return rota


def logs_adicionados(session):
    objetos = [chamada.args[0] for chamada in session.add.call_args_list]
    return [o for o in objetos if isinstance(o, LogAuditoriaORM)]


class RepositoryUnitBase(unittest.TestCase):
    def setUp(self):
        self.session = MagicMock()
        self.repository = RotaPrincipalRepository(self.session)

    def patch_repo(self, nome, **kwargs):
        patcher = patch.object(self.repository, nome, **kwargs)
        self.addCleanup(patcher.stop)
        return patcher.start()


class AgendamentosFuturosTest(RepositoryUnitBase):
    def test_sem_checker_falha_aberto_e_nao_consulta_o_banco(self):
        self.assertFalse(self.repository.possui_agendamentos_futuros(1))
        self.assertEqual(self.session.mock_calls, [])

    def test_com_checker_usa_o_resultado_convertido_para_bool(self):
        for devolvido, esperado in ((True, True), (False, False), (1, True), (0, False), (None, False)):
            with self.subTest(devolvido=devolvido):
                repository = RotaPrincipalRepository(
                    self.session, agendamentos_futuros_checker=lambda _id, d=devolvido: d
                )
                self.assertIs(repository.possui_agendamentos_futuros(1), esperado)

    def test_checker_recebe_o_id_da_rota(self):
        checker = MagicMock(return_value=False)
        repository = RotaPrincipalRepository(self.session, agendamentos_futuros_checker=checker)

        repository.possui_agendamentos_futuros(77)

        checker.assert_called_once_with(77)


class VinculoInativoTest(RepositoryUnitBase):
    def rota_falsa(self, bairros=(True,), ida=(True,), volta=(True,)):
        def itens(estados):
            return [SimpleNamespace(ativo=estado) for estado in estados]

        return SimpleNamespace(bairros=itens(bairros), faculdades_ida=itens(ida), faculdades_volta=itens(volta))

    def test_todos_ativos_nao_tem_vinculo_inativo(self):
        self.patch_repo("_buscar_orm", return_value=self.rota_falsa((True, True), (True,), (True, True)))

        self.assertFalse(self.repository.possui_vinculo_inativo(1))

    def test_um_inativo_em_cada_tipo_de_vinculo_e_detectado(self):
        casos = {
            "bairro": dict(bairros=(True, False)),
            "faculdade da ida": dict(ida=(False,)),
            "faculdade da volta": dict(volta=(True, False)),
        }
        for descricao, estados in casos.items():
            with self.subTest(vinculo=descricao):
                self.patch_repo("_buscar_orm", return_value=self.rota_falsa(**estados))
                self.assertTrue(self.repository.possui_vinculo_inativo(1))

    def test_rota_inexistente_nao_tem_vinculo_inativo(self):
        self.patch_repo("_buscar_orm", return_value=None)

        self.assertFalse(self.repository.possui_vinculo_inativo(1))


class NomeEmUsoTest(RepositoryUnitBase):
    def filtros_compilados(self):
        filtros = self.session.query.return_value.filter.call_args_list
        return [str(f.args[0].compile(compile_kwargs={"literal_binds": True})) for f in filtros]

    def test_compara_sem_diferenciar_caixa_e_espacos_nos_dois_lados(self):
        self.session.query.return_value.filter.return_value.first.return_value = None

        self.repository.nome_em_uso("  Rota CENTRO ")

        sql = self.filtros_compilados()[0]
        self.assertIn("lower(trim(rota_principal.nome))", sql)
        self.assertIn("lower(trim('  Rota CENTRO '))", sql)

    def test_resultado_reflete_a_existencia_de_linha(self):
        primeiro = self.session.query.return_value.filter.return_value.first
        primeiro.return_value = (5,)
        self.assertTrue(self.repository.nome_em_uso("Rota"))
        primeiro.return_value = None
        self.assertFalse(self.repository.nome_em_uso("Rota"))

    def test_ignora_a_propria_rota_na_edicao(self):
        self.session.query.return_value.filter.return_value.filter.return_value.first.return_value = None

        self.repository.nome_em_uso("Rota", ignorar_rota_id=9)

        segundo = self.session.query.return_value.filter.return_value.filter.call_args.args[0]
        sql = str(segundo.compile(compile_kwargs={"literal_binds": True}))
        self.assertIn("rota_principal.id != 9", sql)


class CriarTest(RepositoryUnitBase):
    def setUp(self):
        super().setUp()
        self.patch_repo("nome_em_uso", return_value=False)
        self.carregar_bairros = self.patch_repo("_carregar_bairros", return_value=[bairro(1)])
        self.carregar_faculdades = self.patch_repo("_carregar_faculdades", return_value=[faculdade(1)])
        self.session.flush.side_effect = self.atribuir_id

    def atribuir_id(self):
        for chamada in self.session.add.call_args_list:
            if isinstance(chamada.args[0], RotaPrincipalORM):
                chamada.args[0].id = 7

    def criar(self, **alteracoes):
        argumentos = dict(
            nome="  Rota A ", horario_saida=time(6, 30), horario_retorno=time(17, 30),
            bairros_ids=[1], faculdades_ida_ids=[1], faculdades_volta_ids=[1],
            usuario_executor_id=ADMIN_ID,
        )
        argumentos.update(alteracoes)
        return self.repository.criar(**argumentos)

    def test_grava_rota_normalizada_e_exatamente_um_log_criar(self):
        resultado = self.criar()

        rota = self.session.add.call_args_list[0].args[0]
        self.assertIsInstance(rota, RotaPrincipalORM)
        self.assertEqual((rota.nome, rota.ativo), ("Rota A", True))
        (log,) = logs_adicionados(self.session)
        self.assertEqual(
            (log.usuario_id, log.acao, log.entidade, log.entidade_id, log.valor_anterior),
            (ADMIN_ID, "CRIAR", "rota_principal", 7, None),
        )
        novo = json.loads(log.valor_novo)
        self.assertEqual(
            (novo["nome"], novo["horario_saida"], novo["horario_retorno"], novo["ativo"]),
            ("Rota A", "06:30", "17:30", True),
        )
        self.session.commit.assert_called_once_with()
        self.assertEqual(resultado["id"], 7)

    def test_flush_antecede_o_log_para_ter_o_id_e_o_commit_e_unico(self):
        self.criar()

        nomes = [c[0] for c in self.session.method_calls if c[0] in {"add", "flush", "commit", "refresh"}]
        self.assertEqual(nomes, ["add", "flush", "add", "commit", "refresh"])

    def test_carrega_cada_lista_no_campo_correto_sem_vinculos_previos(self):
        self.criar(bairros_ids=[3, 1], faculdades_ida_ids=[2], faculdades_volta_ids=[4, 5])

        self.carregar_bairros.assert_called_once_with([3, 1], set())
        self.assertEqual(
            self.carregar_faculdades.call_args_list,
            [unittest.mock.call("faculdades_ida_ids", [2], set()),
             unittest.mock.call("faculdades_volta_ids", [4, 5], set())],
        )

    def test_nome_em_uso_nao_grava_rota_nem_log(self):
        self.repository.nome_em_uso.return_value = True

        with self.assertRaises(RotaPrincipalNomeEmUsoError) as ctx:
            self.criar()

        self.assertEqual(str(ctx.exception), MENSAGEM_NOME_EM_USO)
        self.session.add.assert_not_called()
        self.session.commit.assert_not_called()
        self.session.rollback.assert_called_once_with()

    def test_referencia_invalida_nao_grava_nada(self):
        self.carregar_bairros.side_effect = RotaReferenciaInvalidaError("bairros_ids", "Bairro inativo ou inexistente (ids: 9).")

        with self.assertRaises(RotaReferenciaInvalidaError) as ctx:
            self.criar()

        self.assertEqual(ctx.exception.field, "bairros_ids")
        self.session.add.assert_not_called()
        self.session.rollback.assert_called_once_with()

    def test_violacao_de_unicidade_no_commit_vira_nome_em_uso(self):
        self.session.commit.side_effect = IntegrityError("insert", {}, Exception("duplicada"))
        self.repository.nome_em_uso.side_effect = [False, True]

        with self.assertRaises(RotaPrincipalNomeEmUsoError) as ctx:
            self.criar()

        self.assertEqual(str(ctx.exception), MENSAGEM_NOME_EM_USO)
        self.session.rollback.assert_called_once_with()

    def test_violacao_de_integridade_que_nao_e_de_nome_e_repassada(self):
        self.session.commit.side_effect = IntegrityError("insert", {}, Exception("fk"))
        self.repository.nome_em_uso.side_effect = [False, False]

        with self.assertRaises(IntegrityError):
            self.criar()

        self.session.rollback.assert_called_once_with()

    def test_falha_inesperada_desfaz_a_transacao(self):
        self.session.commit.side_effect = RuntimeError("falha")

        with self.assertRaises(RuntimeError):
            self.criar()

        self.session.rollback.assert_called_once_with()


class AtualizarTest(RepositoryUnitBase):
    def setUp(self):
        super().setUp()
        self.rota = rota_em_memoria()
        self.patch_repo("_buscar_orm", return_value=self.rota)
        self.patch_repo("nome_em_uso", return_value=False)

    def test_rota_inexistente_devolve_none_sem_escrever(self):
        self.repository._buscar_orm.return_value = None

        self.assertIsNone(self.repository.atualizar(9, {"nome": "X"}, ADMIN_ID))
        self.session.add.assert_not_called()
        self.session.commit.assert_not_called()

    def test_mudanca_grava_um_unico_log_editar_com_antes_e_depois(self):
        self.repository.atualizar(1, {"nome": "  Rota B ", "horario_saida": time(6, 0)}, ADMIN_ID)

        (log,) = logs_adicionados(self.session)
        self.assertEqual((log.usuario_id, log.acao, log.entidade, log.entidade_id), (ADMIN_ID, "EDITAR", "rota_principal", 1))
        antes, depois = json.loads(log.valor_anterior), json.loads(log.valor_novo)
        self.assertEqual((antes["nome"], antes["horario_saida"]), ("Rota A", "06:30"))
        self.assertEqual((depois["nome"], depois["horario_saida"]), ("Rota B", "06:00"))
        self.session.commit.assert_called_once_with()

    def test_edicao_sem_mudanca_efetiva_nao_grava_log_mas_confirma(self):
        self.repository.atualizar(1, {"nome": "Rota A", "horario_saida": time(6, 30)}, ADMIN_ID)

        self.assertEqual(logs_adicionados(self.session), [])
        self.session.commit.assert_called_once_with()

    def test_substituir_lista_pelos_mesmos_itens_nao_e_mudanca(self):
        with patch.object(self.repository, "_carregar_bairros", return_value=[self.rota.bairros[0]]):
            self.repository.atualizar(1, {"bairros_ids": [1]}, ADMIN_ID)

        self.assertEqual(logs_adicionados(self.session), [])

    def test_vinculos_atuais_sao_repassados_para_manter_base_inativada_depois(self):
        self.rota.bairros = [bairro(1), bairro(2, "Inativo", ativo=False)]
        carregar = self.patch_repo("_carregar_bairros", return_value=[bairro(1)])

        self.repository.atualizar(1, {"bairros_ids": [1, 2]}, ADMIN_ID)

        carregar.assert_called_once_with([1, 2], {1, 2})

    def test_cada_lista_e_carregada_com_seus_proprios_vinculos_atuais(self):
        self.rota.faculdades_ida = [faculdade(1)]
        self.rota.faculdades_volta = [faculdade(2)]
        carregar = self.patch_repo("_carregar_faculdades", return_value=[faculdade(3)])

        self.repository.atualizar(1, {"faculdades_ida_ids": [3], "faculdades_volta_ids": [3]}, ADMIN_ID)

        self.assertEqual(
            carregar.call_args_list,
            [unittest.mock.call("faculdades_ida_ids", [3], {1}),
             unittest.mock.call("faculdades_volta_ids", [3], {2})],
        )
        self.assertEqual([f.id_faculdade for f in self.rota.faculdades_ida], [3])

    def test_campos_nao_enviados_ficam_intactos(self):
        self.repository.atualizar(1, {"horario_retorno": time(18, 0)}, ADMIN_ID)

        self.assertEqual(self.rota.nome, "Rota A")
        self.assertEqual(self.rota.horario_saida, time(6, 30))
        self.assertEqual(self.rota.horario_retorno, time(18, 0))

    def test_nome_de_outra_rota_nao_grava_e_desfaz(self):
        self.repository.nome_em_uso.return_value = True

        with self.assertRaises(RotaPrincipalNomeEmUsoError) as ctx:
            self.repository.atualizar(1, {"nome": "Rota B"}, ADMIN_ID)

        self.assertEqual(str(ctx.exception), MENSAGEM_NOME_EM_USO)
        self.repository.nome_em_uso.assert_called_once_with("Rota B", ignorar_rota_id=1)
        self.assertEqual(self.rota.nome, "Rota A")
        self.session.add.assert_not_called()
        self.session.rollback.assert_called_once_with()

    def test_violacao_de_unicidade_no_commit_vira_nome_em_uso(self):
        self.repository.nome_em_uso.side_effect = [False, True]
        self.session.commit.side_effect = IntegrityError("update", {}, Exception("duplicada"))

        with self.assertRaises(RotaPrincipalNomeEmUsoError):
            self.repository.atualizar(1, {"nome": "Rota B"}, ADMIN_ID)

        self.session.rollback.assert_called_once_with()

    def test_integridade_sem_nome_ou_sem_conflito_de_nome_e_repassada(self):
        self.session.commit.side_effect = IntegrityError("update", {}, Exception("fk"))

        with self.assertRaises(IntegrityError):
            self.repository.atualizar(1, {"horario_saida": time(6, 0)}, ADMIN_ID)

        self.repository.nome_em_uso.side_effect = [False, False]
        with self.assertRaises(IntegrityError):
            self.repository.atualizar(1, {"nome": "Rota C"}, ADMIN_ID)

    def test_referencia_invalida_nao_altera_a_rota_nem_grava_log(self):
        self.patch_repo(
            "_carregar_faculdades",
            side_effect=RotaReferenciaInvalidaError("faculdades_volta_ids", "Faculdade inativa ou inexistente (ids: 4)."),
        )

        with self.assertRaises(RotaReferenciaInvalidaError):
            self.repository.atualizar(1, {"nome": "Rota B", "faculdades_volta_ids": [4]}, ADMIN_ID)

        self.assertEqual(self.rota.nome, "Rota A")
        self.session.add.assert_not_called()
        self.session.rollback.assert_called_once_with()


class StatusEAuditoriaTest(RepositoryUnitBase):
    def test_inativar_grava_um_log_e_altera_o_estado(self):
        rota = rota_em_memoria(ativo=True)
        self.patch_repo("_buscar_orm", return_value=rota)

        resultado = self.repository.inativar(1, ADMIN_ID)

        (log,) = logs_adicionados(self.session)
        self.assertEqual(
            (log.usuario_id, log.acao, log.entidade, log.entidade_id, log.valor_anterior, log.valor_novo),
            (ADMIN_ID, "INATIVAR", "rota_principal", 1, "ativo", "inativo"),
        )
        self.assertFalse(rota.ativo)
        self.assertFalse(resultado["ativo"])
        self.session.commit.assert_called_once_with()

    def test_reativar_grava_um_log_e_altera_o_estado(self):
        rota = rota_em_memoria(ativo=False)
        self.patch_repo("_buscar_orm", return_value=rota)

        resultado = self.repository.reativar(1, ADMIN_ID)

        (log,) = logs_adicionados(self.session)
        self.assertEqual(
            (log.usuario_id, log.acao, log.valor_anterior, log.valor_novo),
            (ADMIN_ID, "REATIVAR", "inativo", "ativo"),
        )
        self.assertTrue(rota.ativo)
        self.assertTrue(resultado["ativo"])

    def test_repetir_o_estado_nao_grava_log_nem_confirma(self):
        for ativo, operacao in ((False, "inativar"), (True, "reativar")):
            with self.subTest(operacao=operacao):
                self.session.reset_mock()
                self.patch_repo("_buscar_orm", return_value=rota_em_memoria(ativo=ativo))
                getattr(self.repository, operacao)(1, ADMIN_ID)
                self.session.add.assert_not_called()
                self.session.commit.assert_not_called()

    def test_rota_inexistente_devolve_none_sem_log(self):
        self.patch_repo("_buscar_orm", return_value=None)

        self.assertIsNone(self.repository.inativar(1, ADMIN_ID))
        self.assertIsNone(self.repository.reativar(1, ADMIN_ID))
        self.session.add.assert_not_called()

    def test_falha_no_commit_desfaz_e_repassa(self):
        self.patch_repo("_buscar_orm", return_value=rota_em_memoria())
        self.session.commit.side_effect = RuntimeError("falha")

        with self.assertRaises(RuntimeError):
            self.repository.inativar(1, ADMIN_ID)

        self.session.rollback.assert_called_once_with()


class ResolucaoDeVinculosTest(RepositoryUnitBase):
    def consulta_devolve(self, *registros):
        self.session.query.return_value.filter.return_value.all.return_value = list(registros)

    def test_bairros_ativos_voltam_na_ordem_pedida(self):
        self.consulta_devolve(bairro(1), bairro(2), bairro(3))

        resultado = self.repository._carregar_bairros([3, 1, 2], set())

        self.assertEqual([b.bairro_id for b in resultado], [3, 1, 2])

    def test_bairro_inativo_ou_inexistente_gera_erro_com_ids_na_ordem_pedida(self):
        self.consulta_devolve(bairro(1), bairro(2, ativo=False))

        with self.assertRaises(RotaReferenciaInvalidaError) as ctx:
            self.repository._carregar_bairros([9, 1, 2], set())

        self.assertEqual(ctx.exception.field, "bairros_ids")
        self.assertEqual(str(ctx.exception), "Bairro inativo ou inexistente (ids: 9, 2).")

    def test_bairro_inativo_ja_vinculado_e_mantido_mas_inexistente_nunca(self):
        self.consulta_devolve(bairro(1), bairro(2, ativo=False))

        resultado = self.repository._carregar_bairros([1, 2], {2})
        self.assertEqual([b.bairro_id for b in resultado], [1, 2])

        with self.assertRaises(RotaReferenciaInvalidaError):
            self.repository._carregar_bairros([1, 2, 7], {2, 7})

    def test_faculdades_ativas_voltam_na_ordem_pedida(self):
        self.consulta_devolve(faculdade(1), faculdade(2))

        resultado = self.repository._carregar_faculdades("faculdades_ida_ids", [2, 1], set())

        self.assertEqual([f.id_faculdade for f in resultado], [2, 1])

    def test_faculdade_invalida_usa_o_campo_e_a_mensagem_do_sentido_informado(self):
        self.consulta_devolve(faculdade(1, ativo=False))
        for campo in ("faculdades_ida_ids", "faculdades_volta_ids"):
            with self.subTest(campo=campo):
                with self.assertRaises(RotaReferenciaInvalidaError) as ctx:
                    self.repository._carregar_faculdades(campo, [1, 5], set())
                self.assertEqual(ctx.exception.field, campo)
                self.assertEqual(str(ctx.exception), "Faculdade inativa ou inexistente (ids: 1, 5).")

    def test_faculdade_inativa_ja_vinculada_e_mantida(self):
        self.consulta_devolve(faculdade(1, ativo=False))

        resultado = self.repository._carregar_faculdades("faculdades_volta_ids", [1], {1})

        self.assertEqual([f.id_faculdade for f in resultado], [1])


class SerializacaoTest(RepositoryUnitBase):
    def test_serializa_horarios_hh_mm_e_ordena_vinculos_por_nome_sem_caixa(self):
        rota = rota_em_memoria()
        rota.horario_saida, rota.horario_retorno = time(5, 5), time(23, 59, 30)
        rota.bairros = [bairro(2, "campo velho"), bairro(1, "Centro"), bairro(3, "Alto")]
        rota.faculdades_ida = [faculdade(2, "UECE"), faculdade(1, "ifce")]

        dados = self.repository._serializar(rota)

        self.assertEqual((dados["horario_saida"], dados["horario_retorno"]), ("05:05", "23:59"))
        self.assertEqual([b["nome"] for b in dados["bairros"]], ["Alto", "campo velho", "Centro"])
        self.assertEqual([f["nome"] for f in dados["faculdades_ida"]], ["ifce", "UECE"])
        self.assertEqual(dados["faculdades_ida"][0], {"id": 1, "nome": "ifce", "campus": "Quixadá"})
        self.assertIs(dados["ativo"], True)

    def test_snapshot_e_json_estavel_com_ids_ordenados(self):
        rota = rota_em_memoria()
        rota.bairros = [bairro(5), bairro(2)]
        rota.faculdades_volta = [faculdade(4), faculdade(3)]

        self.assertEqual(
            json.loads(self.repository._snapshot(rota)),
            {
                "nome": "Rota A", "horario_saida": "06:30", "horario_retorno": "17:30",
                "bairros_ids": [2, 5], "faculdades_ida_ids": [1],
                "faculdades_volta_ids": [3, 4], "ativo": True,
            },
        )


if __name__ == "__main__":
    unittest.main()
