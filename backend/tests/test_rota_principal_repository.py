import json
import unittest
from datetime import time

from sqlalchemy.exc import IntegrityError

from tests.rota_principal_support import (
    ADMIN_ID,
    BAIRRO_CAMPO_VELHO,
    BAIRRO_CENTRO,
    BAIRRO_INATIVO,
    FACULDADE_INATIVA,
    IFCE,
    UECE,
    UFC,
    criar_engine,
    novo_session,
    semear_base,
)

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
from src.modulos.crud_basicos.infrastructure.repositories.ponto_parada_repository import (
    PontoDeParadaComRotaAtivaError,
    PontoDeParadaRepository,
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
    ponto_em_rota_ativa,
)
from src.shared.infrastructure.audit_model import LogAuditoriaORM


class RotaPrincipalRepositoryTestBase(unittest.TestCase):
    def setUp(self):
        self.engine = criar_engine()
        self.session = novo_session(self.engine)
        semear_base(self.session)
        self.repository = RotaPrincipalRepository(self.session)

    def tearDown(self):
        self.session.close()

    def criar(self, **alteracoes):
        argumentos = dict(
            nome="Rota Centro - UFC",
            horario_saida=time(6, 30),
            horario_retorno=time(17, 30),
            bairros_ids=[BAIRRO_CENTRO],
            faculdades_ida_ids=[UFC],
            faculdades_volta_ids=[UFC],
            usuario_executor_id=ADMIN_ID,
        )
        argumentos.update(alteracoes)
        return self.repository.criar(**argumentos)

    def logs(self):
        return self.session.query(LogAuditoriaORM).order_by(LogAuditoriaORM.id).all()


class CadastroDeRotaTest(RotaPrincipalRepositoryTestBase):
    def test_criterio_10_cria_rota_ativa_com_horarios_e_vinculos(self):
        rota = self.criar(
            bairros_ids=[BAIRRO_CENTRO, BAIRRO_CAMPO_VELHO],
            faculdades_ida_ids=[UFC, IFCE],
            faculdades_volta_ids=[UFC],
        )

        self.assertTrue(rota["ativo"])
        self.assertEqual(rota["horario_saida"], "06:30")
        self.assertEqual(rota["horario_retorno"], "17:30")
        self.assertEqual([b["id"] for b in rota["bairros"]], [BAIRRO_CAMPO_VELHO, BAIRRO_CENTRO])
        persistida = self.repository.buscar(rota["id"])
        self.assertEqual(persistida, rota)

    def test_criterio_1_ida_e_volta_sao_independentes(self):
        rota = self.criar(
            faculdades_ida_ids=[UFC, IFCE],
            faculdades_volta_ids=[UECE],
        )

        self.assertEqual({f["id"] for f in rota["faculdades_ida"]}, {UFC, IFCE})
        self.assertEqual({f["id"] for f in rota["faculdades_volta"]}, {UECE})

    def test_criterio_1_volta_pode_ser_subconjunto_da_ida(self):
        rota = self.criar(
            faculdades_ida_ids=[UFC, IFCE],
            faculdades_volta_ids=[UFC],
        )

        self.assertEqual([f["id"] for f in rota["faculdades_volta"]], [UFC])

    def test_criterio_2_rejeita_bairro_inativo_sem_gravar_nada(self):
        with self.assertRaises(RotaReferenciaInvalidaError) as ctx:
            self.criar(bairros_ids=[BAIRRO_CENTRO, BAIRRO_INATIVO])

        self.assertEqual(ctx.exception.field, "bairros_ids")
        self.assertEqual(self.repository.listar(), [])
        self.assertEqual(self.logs(), [])

    def test_criterio_2_rejeita_faculdade_inativa_na_ida_e_na_volta(self):
        for campo in ("faculdades_ida_ids", "faculdades_volta_ids"):
            with self.subTest(campo=campo):
                with self.assertRaises(RotaReferenciaInvalidaError) as ctx:
                    self.criar(**{campo: [UFC, FACULDADE_INATIVA]})
                self.assertEqual(ctx.exception.field, campo)
        self.assertEqual(self.repository.listar(), [])

    def test_criterio_2_rejeita_ids_inexistentes(self):
        with self.assertRaises(RotaReferenciaInvalidaError) as ctx:
            self.criar(bairros_ids=[999])
        self.assertEqual(ctx.exception.field, "bairros_ids")

        with self.assertRaises(RotaReferenciaInvalidaError) as ctx:
            self.criar(faculdades_volta_ids=[999])
        self.assertEqual(ctx.exception.field, "faculdades_volta_ids")

    def test_nome_unico_sem_diferenciar_maiusculas_e_espacos(self):
        self.criar(nome="Rota Centro - UFC")

        with self.assertRaises(RotaPrincipalNomeEmUsoError):
            self.criar(nome="  rota centro - ufc  ")

        self.assertEqual(len(self.repository.listar()), 1)
        self.assertEqual(len(self.logs()), 1)

    def test_nome_unico_vale_tambem_para_rota_inativa(self):
        rota = self.criar()
        self.repository.inativar(rota["id"], ADMIN_ID)

        with self.assertRaises(RotaPrincipalNomeEmUsoError):
            self.criar(nome="ROTA CENTRO - UFC")

    def test_indice_unico_do_banco_protege_contra_corrida(self):
        self.criar()
        from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM

        self.session.add(
            RotaPrincipalORM(
                nome=" rota centro - ufc ",
                horario_saida=time(7, 0),
                horario_retorno=time(8, 0),
            )
        )
        with self.assertRaises(IntegrityError):
            self.session.commit()
        self.session.rollback()

    def test_falha_no_commit_nao_deixa_rota_nem_log_parciais(self):
        original = self.session.commit

        def commit_com_falha():
            raise RuntimeError("falha de persistência controlada")

        self.session.commit = commit_com_falha
        with self.assertRaises(RuntimeError):
            self.criar()
        self.session.commit = original

        self.assertEqual(self.repository.listar(), [])
        self.assertEqual(self.logs(), [])


class ListagemTest(RotaPrincipalRepositoryTestBase):
    def test_criterios_8_e_9_listagem_filtra_por_status_e_traz_horarios(self):
        ativa = self.criar(nome="Rota Centro - UFC")
        inativa = self.criar(nome="Rota Antiga")
        self.repository.inativar(inativa["id"], ADMIN_ID)

        so_ativas = self.repository.listar(ativo=True)
        todas = self.repository.listar(ativo=None)

        self.assertEqual([r["id"] for r in so_ativas], [ativa["id"]])
        self.assertEqual(so_ativas[0]["horario_saida"], "06:30")
        self.assertEqual(so_ativas[0]["horario_retorno"], "17:30")
        self.assertEqual({r["id"]: r["ativo"] for r in todas}, {ativa["id"]: True, inativa["id"]: False})

    def test_busca_por_nome_parcial_sem_diferenciar_maiusculas(self):
        self.criar(nome="Rota Centro - UFC")
        self.criar(nome="Rota Integrada")

        self.assertEqual([r["nome"] for r in self.repository.listar(nome="CENTRO")], ["Rota Centro - UFC"])
        self.assertEqual(len(self.repository.listar(nome="rota")), 2)
        self.assertEqual(self.repository.listar(nome="inexistente"), [])

    def test_busca_por_nome_trata_coringas_como_texto(self):
        self.criar(nome="Rota Centro - UFC")

        self.assertEqual(self.repository.listar(nome="%"), [])
        self.assertEqual(self.repository.listar(nome="_"), [])

    def test_opcoes_trazem_somente_bairros_e_faculdades_ativos(self):
        opcoes = self.repository.listar_opcoes()

        self.assertEqual({b["id"] for b in opcoes["bairros"]}, {BAIRRO_CENTRO, BAIRRO_CAMPO_VELHO})
        self.assertEqual({f["id"] for f in opcoes["faculdades"]}, {UFC, IFCE, UECE})
        self.assertEqual(set(opcoes["bairros"][0]), {"id", "nome"})


class EdicaoDeRotaTest(RotaPrincipalRepositoryTestBase):
    def test_criterio_3_edita_dados_e_substitui_vinculos(self):
        rota = self.criar()

        editada = self.repository.atualizar(
            rota["id"],
            {
                "nome": "Rota Centro e Campo Velho - UFC",
                "horario_saida": time(6, 0),
                "horario_retorno": time(18, 0),
                "bairros_ids": [BAIRRO_CENTRO, BAIRRO_CAMPO_VELHO],
                "faculdades_ida_ids": [IFCE],
                "faculdades_volta_ids": [UECE],
            },
            ADMIN_ID,
        )

        self.assertEqual(editada["id"], rota["id"])
        self.assertEqual(editada["nome"], "Rota Centro e Campo Velho - UFC")
        self.assertEqual((editada["horario_saida"], editada["horario_retorno"]), ("06:00", "18:00"))
        self.assertEqual(len(editada["bairros"]), 2)
        self.assertEqual([f["id"] for f in editada["faculdades_ida"]], [IFCE])
        self.assertEqual([f["id"] for f in editada["faculdades_volta"]], [UECE])

    def test_edicao_parcial_preserva_o_que_nao_foi_enviado(self):
        rota = self.criar(faculdades_ida_ids=[UFC, IFCE])

        editada = self.repository.atualizar(rota["id"], {"horario_saida": time(6, 0)}, ADMIN_ID)

        self.assertEqual(editada["horario_saida"], "06:00")
        self.assertEqual(editada["horario_retorno"], "17:30")
        self.assertEqual(editada["nome"], rota["nome"])
        self.assertEqual({f["id"] for f in editada["faculdades_ida"]}, {UFC, IFCE})

    def test_edicao_de_rota_inexistente_retorna_none(self):
        self.assertIsNone(self.repository.atualizar(999, {"nome": "X"}, ADMIN_ID))

    def test_edicao_mantem_vinculo_existente_com_base_inativada_depois(self):
        rota = self.criar(bairros_ids=[BAIRRO_CENTRO, BAIRRO_CAMPO_VELHO])
        self.session.query(BairroORM).filter_by(bairro_id=BAIRRO_CAMPO_VELHO).update({"ativo": False})
        self.session.commit()

        editada = self.repository.atualizar(
            rota["id"],
            {"bairros_ids": [BAIRRO_CENTRO, BAIRRO_CAMPO_VELHO]},
            ADMIN_ID,
        )

        self.assertEqual(len(editada["bairros"]), 2)

    def test_edicao_rejeita_novo_vinculo_inativo_sem_alteracao_parcial(self):
        rota = self.criar()

        with self.assertRaises(RotaReferenciaInvalidaError) as ctx:
            self.repository.atualizar(
                rota["id"],
                {"nome": "Outro nome", "bairros_ids": [BAIRRO_CENTRO, BAIRRO_INATIVO]},
                ADMIN_ID,
            )

        self.assertEqual(ctx.exception.field, "bairros_ids")
        intacta = self.repository.buscar(rota["id"])
        self.assertEqual(intacta, rota)
        self.assertEqual(len(self.logs()), 1)

    def test_edicao_rejeita_nome_de_outra_rota_mas_aceita_o_proprio(self):
        primeira = self.criar(nome="Rota A")
        self.criar(nome="Rota B")

        with self.assertRaises(RotaPrincipalNomeEmUsoError):
            self.repository.atualizar(primeira["id"], {"nome": " rota b"}, ADMIN_ID)

        mesmo = self.repository.atualizar(primeira["id"], {"nome": "ROTA A"}, ADMIN_ID)
        self.assertEqual(mesmo["nome"], "ROTA A")


class AuditoriaTest(RotaPrincipalRepositoryTestBase):
    def test_criterio_4_registra_criar_editar_inativar_e_reativar(self):
        rota = self.criar()
        self.repository.atualizar(rota["id"], {"nome": "Novo nome"}, ADMIN_ID)
        self.repository.inativar(rota["id"], ADMIN_ID)
        self.repository.reativar(rota["id"], ADMIN_ID)

        logs = self.logs()
        self.assertEqual([l.acao for l in logs], ["CRIAR", "EDITAR", "INATIVAR", "REATIVAR"])
        for log in logs:
            self.assertEqual(log.usuario_id, ADMIN_ID)
            self.assertEqual(log.entidade, "rota_principal")
            self.assertEqual(log.entidade_id, rota["id"])
            self.assertIsNotNone(log.criado_em)

    def test_valores_anterior_e_novo_ficam_no_log(self):
        rota = self.criar()
        self.repository.atualizar(rota["id"], {"nome": "Novo nome"}, ADMIN_ID)
        self.repository.inativar(rota["id"], ADMIN_ID)
        self.repository.reativar(rota["id"], ADMIN_ID)

        criar, editar, inativar, reativar = self.logs()
        self.assertIsNone(criar.valor_anterior)
        self.assertEqual(json.loads(criar.valor_novo)["nome"], "Rota Centro - UFC")
        self.assertEqual(json.loads(editar.valor_anterior)["nome"], "Rota Centro - UFC")
        self.assertEqual(json.loads(editar.valor_novo)["nome"], "Novo nome")
        self.assertEqual((inativar.valor_anterior, inativar.valor_novo), ("ativo", "inativo"))
        self.assertEqual((reativar.valor_anterior, reativar.valor_novo), ("inativo", "ativo"))

    def test_edicao_sem_mudanca_efetiva_nao_gera_log(self):
        rota = self.criar()

        self.repository.atualizar(rota["id"], {"nome": rota["nome"]}, ADMIN_ID)

        self.assertEqual([l.acao for l in self.logs()], ["CRIAR"])

    def test_falha_ao_gravar_log_desfaz_a_inativacao(self):
        rota = self.criar()
        original = self.session.commit

        def commit_com_falha():
            raise RuntimeError("falha de persistência controlada")

        self.session.commit = commit_com_falha
        with self.assertRaises(RuntimeError):
            self.repository.inativar(rota["id"], ADMIN_ID)
        self.session.commit = original

        self.assertTrue(self.repository.buscar(rota["id"])["ativo"])
        self.assertEqual([l.acao for l in self.logs()], ["CRIAR"])


class SoftDeleteTest(RotaPrincipalRepositoryTestBase):
    def test_criterio_4_inativa_e_reativa_sem_apagar_o_registro(self):
        rota = self.criar()

        inativa = self.repository.inativar(rota["id"], ADMIN_ID)
        self.assertFalse(inativa["ativo"])
        self.assertEqual(self.repository.buscar(rota["id"])["nome"], rota["nome"])

        reativada = self.repository.reativar(rota["id"], ADMIN_ID)
        self.assertTrue(reativada["ativo"])
        self.assertEqual(reativada["bairros"], rota["bairros"])

    def test_inativar_rota_inexistente_retorna_none(self):
        self.assertIsNone(self.repository.inativar(999, ADMIN_ID))
        self.assertIsNone(self.repository.reativar(999, ADMIN_ID))


class ReativacaoComVinculoInativoTest(RotaPrincipalRepositoryTestBase):
    def inativar_base(self, modelo, campo_id, valor):
        self.session.query(modelo).filter(campo_id == valor).update({"ativo": False})
        self.session.commit()

    def test_vinculos_todos_ativos_reativa_e_grava_log(self):
        use_case = GerenciarRotasPrincipaisUseCase(self.repository)
        rota = self.criar()
        self.repository.inativar(rota["id"], ADMIN_ID)

        self.assertFalse(self.repository.possui_vinculo_inativo(rota["id"]))
        reativada = use_case.reativar(rota["id"], ADMIN_ID)

        self.assertTrue(reativada["ativo"])
        self.assertEqual([l.acao for l in self.logs()][-1], "REATIVAR")

    def test_algum_vinculo_inativo_bloqueia_sem_alterar_nem_logar(self):
        use_case = GerenciarRotasPrincipaisUseCase(self.repository)
        casos = [
            ("bairro", BairroORM, BairroORM.bairro_id, BAIRRO_CENTRO, {}),
            ("faculdade da ida", FaculdadeORM, FaculdadeORM.id_faculdade, IFCE,
             {"faculdades_ida_ids": [UFC, IFCE]}),
            ("faculdade da volta", FaculdadeORM, FaculdadeORM.id_faculdade, UECE,
             {"faculdades_volta_ids": [UFC, UECE]}),
        ]
        for indice, (descricao, modelo, campo_id, valor, extras) in enumerate(casos):
            with self.subTest(vinculo=descricao):
                rota = self.criar(nome=f"Rota {indice}", **extras)
                self.repository.inativar(rota["id"], ADMIN_ID)
                self.inativar_base(modelo, campo_id, valor)
                logs_antes = len(self.logs())

                self.assertTrue(self.repository.possui_vinculo_inativo(rota["id"]))
                with self.assertRaises(RotaComVinculoInativoError):
                    use_case.reativar(rota["id"], ADMIN_ID)

                self.assertFalse(self.repository.buscar(rota["id"])["ativo"])
                self.assertEqual(len(self.logs()), logs_antes)
                self.inativar_base(modelo, campo_id, valor)  # restaura para o próximo caso
                self.session.query(modelo).filter(campo_id == valor).update({"ativo": True})
                self.session.commit()


class BloqueioPorAgendamentoTest(RotaPrincipalRepositoryTestBase):
    def test_falhar_aberto_por_padrao_nao_bloqueia(self):
        rota = self.criar()

        self.assertFalse(self.repository.possui_agendamentos_futuros(rota["id"]))
        use_case = GerenciarRotasPrincipaisUseCase(self.repository)
        self.assertFalse(use_case.inativar(rota["id"], ADMIN_ID)["ativo"])

    def test_criterio_5_com_agendamento_futuro_bloqueia_sem_alterar_nem_logar(self):
        repository = RotaPrincipalRepository(
            self.session, agendamentos_futuros_checker=lambda rota_id: True
        )
        use_case = GerenciarRotasPrincipaisUseCase(repository)
        rota = self.criar()

        with self.assertRaises(RotaComAgendamentosPendentesError) as ctx:
            use_case.inativar(rota["id"], ADMIN_ID)

        self.assertEqual(
            str(ctx.exception),
            "Esta rota possui agendamentos pendentes e não pode ser inativada no momento.",
        )
        self.assertTrue(repository.buscar(rota["id"])["ativo"])
        self.assertEqual([l.acao for l in self.logs()], ["CRIAR"])

    def test_checker_recebe_o_id_da_rota_e_false_permite_inativar(self):
        consultados = []
        repository = RotaPrincipalRepository(
            self.session,
            agendamentos_futuros_checker=lambda rota_id: consultados.append(rota_id) or False,
        )
        use_case = GerenciarRotasPrincipaisUseCase(repository)
        rota = self.criar()

        resultado = use_case.inativar(rota["id"], ADMIN_ID)

        self.assertEqual(consultados, [rota["id"]])
        self.assertFalse(resultado["ativo"])
        self.assertEqual([l.acao for l in self.logs()], ["CRIAR", "INATIVAR"])


class LigacaoDosCheckersTest(RotaPrincipalRepositoryTestBase):
    def test_bairro_em_rota_ativa_nao_pode_ser_inativado(self):
        self.criar()
        repo = BairroRepository(self.session, rota_ativa_checker=bairro_em_rota_ativa(self.session))

        with self.assertRaises(BairroComRotaAtivaError):
            repo.inativar(BAIRRO_CENTRO, usuario_executor_id=ADMIN_ID)

        self.assertTrue(self.session.get(BairroORM, BAIRRO_CENTRO).ativo)

    def test_bairro_livre_ou_em_rota_inativa_pode_ser_inativado(self):
        rota = self.criar()
        self.repository.inativar(rota["id"], ADMIN_ID)
        repo = BairroRepository(self.session, rota_ativa_checker=bairro_em_rota_ativa(self.session))

        self.assertFalse(repo.inativar(BAIRRO_CENTRO, usuario_executor_id=ADMIN_ID).ativo)
        self.assertFalse(repo.inativar(BAIRRO_CAMPO_VELHO, usuario_executor_id=ADMIN_ID).ativo)

    def test_ponto_de_bairro_em_rota_ativa_nao_pode_ser_inativado(self):
        self.criar()
        repo = PontoDeParadaRepository(self.session, rota_ativa_checker=ponto_em_rota_ativa(self.session))

        with self.assertRaises(PontoDeParadaComRotaAtivaError):
            repo.inativar(1, usuario_executor_id=ADMIN_ID)

    def test_faculdade_na_ida_ou_na_volta_de_rota_ativa_nao_pode_ser_inativada(self):
        self.criar(faculdades_ida_ids=[UFC], faculdades_volta_ids=[IFCE])
        repo = FaculdadeRepository(self.session, rota_ativa_checker=faculdade_em_rota_ativa(self.session))

        for faculdade_id in (UFC, IFCE):
            with self.subTest(faculdade_id=faculdade_id):
                with self.assertRaises(FaculdadeComRotaAtivaError):
                    repo.inativar(faculdade_id, usuario_executor_id=ADMIN_ID)
                with self.assertRaises(FaculdadeComRotaAtivaError):
                    repo.atualizar(faculdade_id, ADMIN_ID, ativo=False)
                self.assertTrue(self.session.get(FaculdadeORM, faculdade_id).ativo)

    def test_faculdade_sem_rota_ativa_continua_inativavel(self):
        self.criar()
        repo = FaculdadeRepository(self.session, rota_ativa_checker=faculdade_em_rota_ativa(self.session))

        self.assertFalse(repo.inativar(UECE, usuario_executor_id=ADMIN_ID).ativo)

    def test_faculdade_sem_checker_mantem_o_comportamento_anterior(self):
        self.criar()

        self.assertFalse(FaculdadeRepository(self.session).inativar(UFC, ADMIN_ID).ativo)


if __name__ == "__main__":
    unittest.main()
