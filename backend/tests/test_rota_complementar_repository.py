"""Testes do repository de rotas complementares com SQLite em memória."""

import json
import unittest
from datetime import time
from unittest.mock import patch

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from tests.rota_complementar_support import (
    ADMIN_ID,
    PRINCIPAL_CENTRO,
    PRINCIPAL_INATIVA,
    PRINCIPAL_INTEGRADA,
    criar_engine,
    novo_session,
    semear_principais,
)

from src.modulos.rotas.application.use_cases.gerenciar_rotas_complementares_use_case import (
    GerenciarRotasComplementaresUseCase,
    RotaComplementarComAgendamentosPendentesError,
)
from src.modulos.rotas.application.use_cases.gerenciar_rotas_principais_use_case import (
    GerenciarRotasPrincipaisUseCase,
)
from src.modulos.rotas.infrastructure.repositories.rota_complementar_repository import (
    RotaComplementarComPrincipalInativaError,
    RotaComplementarNomeEmUsoError,
    RotaComplementarReferenciaInvalidaError,
    RotaComplementarRepository,
)
from src.modulos.rotas.infrastructure.repositories.rota_principal_repository import (
    MENSAGEM_ROTA_COM_COMPLEMENTARES_ATIVAS,
    RotaComComplementaresAtivasError,
    RotaPrincipalRepository,
)
from src.modulos.rotas.model.entities.rota_complementar import RotaComplementarORM
from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM
from src.shared.infrastructure.audit_model import LogAuditoriaORM


class RepositoryTestBase(unittest.TestCase):
    def setUp(self):
        self.engine = criar_engine()
        self.session = novo_session(self.engine)
        semear_principais(self.session)
        self.repository = RotaComplementarRepository(self.session)

    def tearDown(self):
        self.session.close()

    def criar(self, **alteracoes):
        argumentos = dict(
            nome="Van 2 - Bairro Novo", horario_saida=time(6, 0), horario_retorno=time(17, 40),
            ponto_conexao="Trevo do Bairro Novo", rota_principal_id=PRINCIPAL_CENTRO,
            usuario_executor_id=ADMIN_ID,
        )
        argumentos.update(alteracoes)
        return self.repository.criar(**argumentos)

    def logs(self):
        self.session.expire_all()
        return self.session.query(LogAuditoriaORM).order_by(LogAuditoriaORM.id).all()

    def definir_principal_ativa(self, principal_id, ativo):
        self.session.query(RotaPrincipalORM).filter_by(id=principal_id).update({"ativo": ativo})
        self.session.commit()


class CadastroTest(RepositoryTestBase):
    def test_cria_rota_normalizada_com_principal_resumida(self):
        rota = self.criar(nome="  Van 2 - Bairro Novo ", ponto_conexao="  Trevo do Bairro Novo ")

        self.assertEqual(
            rota,
            {
                "id": rota["id"], "nome": "Van 2 - Bairro Novo", "horario_saida": "06:00",
                "horario_retorno": "17:40", "ponto_conexao": "Trevo do Bairro Novo", "ativo": True,
                "rota_principal": {"id": PRINCIPAL_CENTRO, "nome": "Rota Centro - UFC", "ativo": True},
            },
        )
        self.assertEqual(self.repository.buscar(rota["id"]), rota)

    def test_horario_persiste_como_time(self):
        rota = self.criar(horario_saida=time(0, 0), horario_retorno=time(23, 59))

        orm = self.session.get(RotaComplementarORM, rota["id"])
        self.assertEqual(orm.horario_saida, time(0, 0))
        self.assertEqual(orm.horario_retorno, time(23, 59))

    def test_grava_exatamente_um_log_criar_com_json(self):
        rota = self.criar()

        (log,) = self.logs()
        self.assertEqual(
            (log.acao, log.entidade, log.entidade_id, log.usuario_id), ("CRIAR", "rota_complementar", rota["id"], ADMIN_ID)
        )
        self.assertIsNone(log.valor_anterior)
        self.assertEqual(
            json.loads(log.valor_novo),
            {"nome": "Van 2 - Bairro Novo", "horario_saida": "06:00", "horario_retorno": "17:40",
             "ponto_conexao": "Trevo do Bairro Novo", "rota_principal_id": PRINCIPAL_CENTRO, "ativo": True},
        )
        self.assertIsNotNone(log.criado_em)

    def test_nome_repetido_sem_diferenciar_caixa_e_espacos_e_recusado(self):
        self.criar(nome="Van 2 - Bairro Novo")

        for repetido in ("van 2 - bairro novo", "  VAN 2 - BAIRRO NOVO  "):
            with self.subTest(nome=repetido):
                with self.assertRaises(RotaComplementarNomeEmUsoError):
                    self.criar(nome=repetido)

        self.assertEqual(len(self.repository.listar()), 1)
        self.assertEqual(len(self.logs()), 1)

    def test_nome_de_rota_inativa_tambem_conta_como_em_uso(self):
        rota = self.criar()
        self.repository.inativar(rota["id"], ADMIN_ID)

        with self.assertRaises(RotaComplementarNomeEmUsoError):
            self.criar()

    def test_nome_de_rota_principal_ativa_ou_inativa_e_recusado(self):
        # O nome é único entre principais e complementares (#208, item 1; #309)
        for nome in ("Rota Centro - UFC", "  rota centro - ufc ", "ROTA ANTIGA"):
            with self.subTest(nome=nome):
                with self.assertRaises(RotaComplementarNomeEmUsoError) as ctx:
                    self.criar(nome=nome)
                self.assertEqual(str(ctx.exception), "Já existe uma rota com este nome.")

        self.assertEqual(self.repository.listar(ativo=None), [])
        self.assertEqual(self.logs(), [])

    def test_principal_inativa_ou_inexistente_e_recusada_sem_gravar(self):
        for principal_id in (PRINCIPAL_INATIVA, 999):
            with self.subTest(principal=principal_id):
                with self.assertRaises(RotaComplementarReferenciaInvalidaError) as ctx:
                    self.criar(rota_principal_id=principal_id)
                self.assertEqual(ctx.exception.field, "rota_principal_id")
                self.assertEqual(str(ctx.exception), "Rota principal inativa ou inexistente.")

        self.assertEqual(self.repository.listar(ativo=None), [])
        self.assertEqual(self.logs(), [])

    def test_indice_unico_do_banco_impede_duplicata_mesmo_fora_do_repository(self):
        self.criar(nome="Van A")
        self.session.add(
            RotaComplementarORM(
                rota_principal_id=PRINCIPAL_CENTRO, nome="  van a ", horario_saida=time(7, 0),
                horario_retorno=time(18, 0), ponto_conexao="X",
            )
        )

        with self.assertRaises(IntegrityError):
            self.session.commit()
        self.session.rollback()

    def test_fk_restrict_impede_apagar_principal_com_complementar(self):
        self.criar()

        with self.assertRaises(IntegrityError):
            self.session.execute(text("PRAGMA foreign_keys=ON"))
            self.session.query(RotaPrincipalORM).filter_by(id=PRINCIPAL_CENTRO).delete()
            self.session.commit()
        self.session.rollback()


class ListagemTest(RepositoryTestBase):
    def setUp(self):
        super().setUp()
        self.ativa = self.criar(nome="Van B")
        self.outra = self.criar(nome="Van a", rota_principal_id=PRINCIPAL_INTEGRADA)
        self.inativa = self.criar(nome="Van Antiga")
        self.repository.inativar(self.inativa["id"], ADMIN_ID)

    def test_padrao_do_repository_sem_filtro_traz_todas_ordenadas_sem_diferenciar_caixa(self):
        nomes = [r["nome"] for r in self.repository.listar()]

        self.assertEqual(nomes, ["Van a", "Van Antiga", "Van B"])

    def test_filtro_por_status(self):
        self.assertEqual([r["nome"] for r in self.repository.listar(ativo=True)], ["Van a", "Van B"])
        self.assertEqual([r["nome"] for r in self.repository.listar(ativo=False)], ["Van Antiga"])

    def test_busca_parcial_por_nome_sem_diferenciar_caixa(self):
        self.assertEqual([r["nome"] for r in self.repository.listar(nome="ANT")], ["Van Antiga"])
        self.assertEqual(len(self.repository.listar(nome="van")), 3)

    def test_curingas_do_like_sao_tratados_como_texto(self):
        self.assertEqual(self.repository.listar(nome="%"), [])
        self.assertEqual(self.repository.listar(nome="_"), [])

    def test_filtro_por_rota_principal(self):
        resultado = self.repository.listar(rota_principal_id=PRINCIPAL_INTEGRADA)

        self.assertEqual([r["nome"] for r in resultado], ["Van a"])
        self.assertEqual(self.repository.listar(rota_principal_id=999), [])

    def test_filtros_combinados(self):
        self.assertEqual(
            [r["nome"] for r in self.repository.listar(ativo=True, nome="van", rota_principal_id=PRINCIPAL_CENTRO)],
            ["Van B"],
        )

    def test_buscar_inexistente_devolve_none(self):
        self.assertIsNone(self.repository.buscar(999))

    def test_opcoes_so_com_principais_ativas_ordenadas_por_nome(self):
        opcoes = self.repository.listar_opcoes()

        self.assertEqual(
            opcoes,
            {
                "rotas_principais": [
                    {"id": PRINCIPAL_CENTRO, "nome": "Rota Centro - UFC", "horario_saida": "06:30", "horario_retorno": "17:30"},
                    {"id": PRINCIPAL_INTEGRADA, "nome": "Rota Integrada", "horario_saida": "07:00", "horario_retorno": "18:00"},
                ]
            },
        )

    def test_principal_inativada_depois_sai_das_opcoes_e_complementar_mostra_ativo_false(self):
        self.definir_principal_ativa(PRINCIPAL_INTEGRADA, False)

        ids = [p["id"] for p in self.repository.listar_opcoes()["rotas_principais"]]
        self.assertEqual(ids, [PRINCIPAL_CENTRO])
        self.assertFalse(self.repository.buscar(self.outra["id"])["rota_principal"]["ativo"])


class EdicaoTest(RepositoryTestBase):
    def setUp(self):
        super().setUp()
        self.rota = self.criar()

    def atualizar(self, campos, rota_id=None):
        return self.repository.atualizar(rota_id or self.rota["id"], campos, ADMIN_ID)

    def test_inexistente_devolve_none_sem_log(self):
        self.assertIsNone(self.atualizar({"nome": "X"}, rota_id=999))
        self.assertEqual(len(self.logs()), 1)

    def test_edita_todos_os_campos_e_grava_um_log_editar_com_antes_e_depois(self):
        resultado = self.atualizar(
            {"nome": " Van 3 - Bairro Novo ", "horario_saida": time(5, 45), "horario_retorno": time(18, 10),
             "ponto_conexao": " Posto Central ", "rota_principal_id": PRINCIPAL_INTEGRADA}
        )

        self.assertEqual(
            (resultado["nome"], resultado["horario_saida"], resultado["horario_retorno"],
             resultado["ponto_conexao"], resultado["rota_principal"]["id"]),
            ("Van 3 - Bairro Novo", "05:45", "18:10", "Posto Central", PRINCIPAL_INTEGRADA),
        )
        criar, editar = self.logs()
        self.assertEqual(editar.acao, "EDITAR")
        self.assertEqual(json.loads(editar.valor_anterior)["nome"], "Van 2 - Bairro Novo")
        self.assertEqual(json.loads(editar.valor_anterior)["rota_principal_id"], PRINCIPAL_CENTRO)
        self.assertEqual(json.loads(editar.valor_novo)["rota_principal_id"], PRINCIPAL_INTEGRADA)
        self.assertEqual(editar.valor_anterior, criar.valor_novo)

    def test_campos_nao_enviados_ficam_intactos(self):
        resultado = self.atualizar({"ponto_conexao": "Posto"})

        self.assertEqual(resultado["nome"], "Van 2 - Bairro Novo")
        self.assertEqual(resultado["horario_saida"], "06:00")
        self.assertEqual(resultado["horario_retorno"], "17:40")
        self.assertEqual(resultado["rota_principal"]["id"], PRINCIPAL_CENTRO)

    def test_edicao_sem_mudanca_nao_grava_log(self):
        self.atualizar({"nome": "Van 2 - Bairro Novo", "rota_principal_id": PRINCIPAL_CENTRO})
        self.atualizar({"nome": "Van 2 - Bairro Novo  "})

        self.assertEqual([l.acao for l in self.logs()], ["CRIAR"])

    def test_mudar_so_a_caixa_do_proprio_nome_e_permitido(self):
        resultado = self.atualizar({"nome": "VAN 2 - BAIRRO NOVO"})

        self.assertEqual(resultado["nome"], "VAN 2 - BAIRRO NOVO")
        self.assertEqual([l.acao for l in self.logs()], ["CRIAR", "EDITAR"])

    def test_nome_de_outra_rota_e_recusado_sem_alterar_nem_logar(self):
        self.criar(nome="Van 1")

        with self.assertRaises(RotaComplementarNomeEmUsoError):
            self.atualizar({"nome": " VAN 1 ", "ponto_conexao": "Outro"})

        self.assertEqual(self.repository.buscar(self.rota["id"])["ponto_conexao"], "Trevo do Bairro Novo")
        self.assertEqual(len(self.logs()), 2)

    def test_nome_de_rota_principal_e_recusado_na_edicao_sem_alterar_nem_logar(self):
        # #309: a edição também confere o nome nas rotas principais (ativas e inativas)
        for nome in ("Rota Integrada", " rota antiga "):
            with self.subTest(nome=nome):
                with self.assertRaises(RotaComplementarNomeEmUsoError):
                    self.atualizar({"nome": nome})

        self.assertEqual(self.repository.buscar(self.rota["id"])["nome"], "Van 2 - Bairro Novo")
        self.assertEqual(len(self.logs()), 1)

    def test_trocar_para_principal_inativa_ou_inexistente_e_recusado_sem_alterar_nem_logar(self):
        for principal_id in (PRINCIPAL_INATIVA, 999):
            with self.subTest(principal=principal_id):
                with self.assertRaises(RotaComplementarReferenciaInvalidaError) as ctx:
                    self.atualizar({"nome": "Outro", "rota_principal_id": principal_id})
                self.assertEqual(ctx.exception.field, "rota_principal_id")

        atual = self.repository.buscar(self.rota["id"])
        self.assertEqual((atual["nome"], atual["rota_principal"]["id"]), ("Van 2 - Bairro Novo", PRINCIPAL_CENTRO))
        self.assertEqual(len(self.logs()), 1)

    def test_manter_a_principal_atual_inativada_depois_e_permitido(self):
        self.definir_principal_ativa(PRINCIPAL_CENTRO, False)

        resultado = self.atualizar({"rota_principal_id": PRINCIPAL_CENTRO, "ponto_conexao": "Posto"})

        self.assertEqual(resultado["ponto_conexao"], "Posto")
        self.assertFalse(resultado["rota_principal"]["ativo"])

    def test_edita_registro_inativo(self):
        self.repository.inativar(self.rota["id"], ADMIN_ID)

        resultado = self.atualizar({"nome": "Van Renomeada"})

        self.assertEqual((resultado["nome"], resultado["ativo"]), ("Van Renomeada", False))


class SoftDeleteEAuditoriaTest(RepositoryTestBase):
    def setUp(self):
        super().setUp()
        self.rota = self.criar()

    def test_inativar_mantem_o_registro_e_grava_um_log(self):
        resultado = self.repository.inativar(self.rota["id"], ADMIN_ID)

        self.assertFalse(resultado["ativo"])
        self.assertEqual(self.session.query(RotaComplementarORM).count(), 1)
        log = self.logs()[-1]
        self.assertEqual((log.acao, log.valor_anterior, log.valor_novo), ("INATIVAR", "ativo", "inativo"))
        self.assertEqual(log.usuario_id, ADMIN_ID)

    def test_reativar_grava_um_log(self):
        self.repository.inativar(self.rota["id"], ADMIN_ID)

        resultado = self.repository.reativar(self.rota["id"], ADMIN_ID + 1)

        self.assertTrue(resultado["ativo"])
        log = self.logs()[-1]
        self.assertEqual((log.acao, log.valor_anterior, log.valor_novo, log.usuario_id), ("REATIVAR", "inativo", "ativo", ADMIN_ID + 1))

    def test_uma_entrada_por_operacao_na_ordem(self):
        self.repository.atualizar(self.rota["id"], {"nome": "Van 3"}, ADMIN_ID)
        self.repository.inativar(self.rota["id"], ADMIN_ID)
        self.repository.reativar(self.rota["id"], ADMIN_ID)

        self.assertEqual([l.acao for l in self.logs()], ["CRIAR", "EDITAR", "INATIVAR", "REATIVAR"])
        self.assertTrue(all(l.entidade == "rota_complementar" and l.entidade_id == self.rota["id"] for l in self.logs()))

    def test_repetir_o_estado_nao_grava_log(self):
        self.repository.reativar(self.rota["id"], ADMIN_ID)
        self.repository.inativar(self.rota["id"], ADMIN_ID)
        self.repository.inativar(self.rota["id"], ADMIN_ID)

        self.assertEqual([l.acao for l in self.logs()], ["CRIAR", "INATIVAR"])

    def test_inexistente_devolve_none_sem_log(self):
        self.assertIsNone(self.repository.inativar(999, ADMIN_ID))
        self.assertIsNone(self.repository.reativar(999, ADMIN_ID))
        self.assertEqual(len(self.logs()), 1)

    def test_inativar_nao_depende_do_estado_da_principal(self):
        self.definir_principal_ativa(PRINCIPAL_CENTRO, False)

        self.assertFalse(self.repository.inativar(self.rota["id"], ADMIN_ID)["ativo"])

    def test_reativar_com_principal_inativa_nao_altera_nem_grava_log(self):
        self.repository.inativar(self.rota["id"], ADMIN_ID)
        self.definir_principal_ativa(PRINCIPAL_CENTRO, False)

        with self.assertRaises(RotaComplementarComPrincipalInativaError):
            self.repository.reativar(self.rota["id"], ADMIN_ID)

        self.assertFalse(self.repository.buscar(self.rota["id"])["ativo"])
        self.assertEqual([l.acao for l in self.logs()], ["CRIAR", "INATIVAR"])

    def test_inativacao_preserva_os_demais_dados_do_registro(self):
        antes = self.repository.buscar(self.rota["id"])

        depois = self.repository.inativar(self.rota["id"], ADMIN_ID)

        self.assertEqual({**antes, "ativo": False}, depois)
        self.assertEqual(self.session.query(RotaPrincipalORM).count(), 3)

    def test_principal_inativa_fica_visivel_na_complementar_inativa(self):
        self.repository.inativar(self.rota["id"], ADMIN_ID)
        self.definir_principal_ativa(PRINCIPAL_CENTRO, False)

        self.assertTrue(self.repository.principal_inativa(self.rota["id"]))
        self.assertFalse(self.repository.principal_inativa(999))


class BloqueioPorAgendamentoTest(RepositoryTestBase):
    def test_falhar_aberto_por_padrao_nao_bloqueia(self):
        rota = self.criar()

        self.assertFalse(self.repository.possui_agendamentos_futuros(rota["id"]))
        use_case = GerenciarRotasComplementaresUseCase(self.repository)
        self.assertFalse(use_case.inativar(rota["id"], ADMIN_ID)["ativo"])

    def test_com_agendamento_futuro_bloqueia_sem_alterar_nem_logar(self):
        repository = RotaComplementarRepository(
            self.session, agendamentos_futuros_checker=lambda rota_id: True
        )
        use_case = GerenciarRotasComplementaresUseCase(repository)
        rota = self.criar()

        with self.assertRaises(RotaComplementarComAgendamentosPendentesError) as ctx:
            use_case.inativar(rota["id"], ADMIN_ID)

        self.assertEqual(
            str(ctx.exception),
            "Esta rota possui agendamentos pendentes e não pode ser inativada no momento.",
        )
        self.assertTrue(repository.buscar(rota["id"])["ativo"])
        self.assertEqual([l.acao for l in self.logs()], ["CRIAR"])

    def test_checker_recebe_o_id_e_false_permite_inativar(self):
        consultados = []
        repository = RotaComplementarRepository(
            self.session,
            agendamentos_futuros_checker=lambda rota_id: consultados.append(rota_id) or False,
        )
        rota = self.criar()

        resultado = GerenciarRotasComplementaresUseCase(repository).inativar(rota["id"], ADMIN_ID)

        self.assertEqual(consultados, [rota["id"]])
        self.assertFalse(resultado["ativo"])


class InativacaoDaPrincipalTest(RepositoryTestBase):
    """A inativação da principal recheca as complementares ativas dentro da transação (D3)."""

    def setUp(self):
        super().setUp()
        self.principais = RotaPrincipalRepository(self.session)

    def assert_principal_intacta(self):
        self.session.expire_all()
        self.assertTrue(self.principais.buscar(PRINCIPAL_CENTRO)["ativo"])
        self.assertEqual(
            [(l.entidade, l.acao) for l in self.logs()], [("rota_complementar", "CRIAR")]
        )

    def test_repository_recusa_inativar_com_complementar_ativa_sem_depender_do_use_case(self):
        self.criar()

        with self.assertRaises(RotaComComplementaresAtivasError) as ctx:
            self.principais.inativar(PRINCIPAL_CENTRO, ADMIN_ID)

        self.assertEqual(str(ctx.exception), MENSAGEM_ROTA_COM_COMPLEMENTARES_ATIVAS)
        self.assert_principal_intacta()

    def test_complementar_criada_depois_da_checagem_antecipada_bloqueia_a_inativacao(self):
        use_case = GerenciarRotasPrincipaisUseCase(self.principais)
        verificacao_real = self.principais.possui_complementares_ativas
        consultas = []

        def antecipada_sem_complementar_e_depois_a_real(rota_id):
            consultas.append(rota_id)
            if len(consultas) == 1:
                self.criar()  # outra requisição confirma a complementar após a checagem do use case
                return False
            return verificacao_real(rota_id)

        with patch.object(
            self.principais, "possui_complementares_ativas",
            side_effect=antecipada_sem_complementar_e_depois_a_real,
        ):
            with self.assertRaises(RotaComComplementaresAtivasError):
                use_case.inativar(PRINCIPAL_CENTRO, ADMIN_ID)

        self.assertEqual(len(consultas), 2)  # antecipada (use case) + recheca (repository)
        self.assert_principal_intacta()

    def test_complementar_inativa_nao_bloqueia_a_inativacao(self):
        rota = self.criar()
        self.repository.inativar(rota["id"], ADMIN_ID)

        self.assertFalse(self.principais.inativar(PRINCIPAL_CENTRO, ADMIN_ID)["ativo"])

        self.assertEqual(
            [(l.entidade, l.acao) for l in self.logs()],
            [("rota_complementar", "CRIAR"), ("rota_complementar", "INATIVAR"), ("rota_principal", "INATIVAR")],
        )
