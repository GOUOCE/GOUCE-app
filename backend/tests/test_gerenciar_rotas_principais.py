import unittest
from datetime import time

from tests.rota_principal_support import ADMIN_ID

from src.modulos.rotas.application.use_cases.gerenciar_rotas_principais_use_case import (
    GerenciarRotasPrincipaisUseCase,
    MENSAGEM_ROTA_COM_COMPLEMENTARES_ATIVAS,
    RotaComAgendamentosPendentesError,
    RotaComComplementaresAtivasError,
    RotaComVinculoInativoError,
    RotaPrincipalNaoEncontradaError,
    RotaPrincipalStatusInalteradoError,
    RotaPrincipalValidationError,
)
from src.modulos.rotas.infrastructure.repositories.rota_principal_repository import (
    RotaPrincipalNomeEmUsoError,
    RotaReferenciaInvalidaError,
)


class FakeRepository:
    def __init__(self):
        self.rotas = {
            1: {
                "id": 1, "nome": "Rota Centro - UFC", "horario_saida": "06:30",
                "horario_retorno": "17:30", "ativo": True, "bairros": [],
                "faculdades_ida": [], "faculdades_volta": [],
            },
            2: {
                "id": 2, "nome": "Rota Antiga", "horario_saida": "07:00",
                "horario_retorno": "12:00", "ativo": False, "bairros": [],
                "faculdades_ida": [], "faculdades_volta": [],
            },
        }
        self.com_agendamentos = set()
        self.com_vinculo_inativo = set()
        self.com_complementares_ativas = set()
        self.chamadas = []

    def listar(self, ativo=None, nome=None):
        self.chamadas.append(("listar", ativo, nome))
        return [r for r in self.rotas.values() if ativo is None or r["ativo"] == ativo]

    def listar_opcoes(self):
        return {"bairros": [], "faculdades": []}

    def buscar(self, rota_id):
        self.chamadas.append(("buscar", rota_id))
        return self.rotas.get(rota_id)

    def criar(self, *argumentos):
        self.chamadas.append(("criar", argumentos))
        return {"id": 3}

    def atualizar(self, rota_id, campos, usuario_executor_id):
        self.chamadas.append(("atualizar", rota_id, campos, usuario_executor_id))
        return self.rotas.get(rota_id)

    def possui_agendamentos_futuros(self, rota_id):
        self.chamadas.append(("possui_agendamentos_futuros", rota_id))
        return rota_id in self.com_agendamentos

    def possui_complementares_ativas(self, rota_id):
        self.chamadas.append(("possui_complementares_ativas", rota_id))
        return rota_id in self.com_complementares_ativas

    def possui_vinculo_inativo(self, rota_id):
        self.chamadas.append(("possui_vinculo_inativo", rota_id))
        return rota_id in self.com_vinculo_inativo

    def inativar(self, rota_id, usuario_executor_id):
        self.chamadas.append(("inativar", rota_id, usuario_executor_id))
        self.rotas[rota_id]["ativo"] = False
        return self.rotas[rota_id]

    def reativar(self, rota_id, usuario_executor_id):
        self.chamadas.append(("reativar", rota_id, usuario_executor_id))
        self.rotas[rota_id]["ativo"] = True
        return self.rotas[rota_id]


def argumentos(**alteracoes):
    dados = dict(
        nome="Rota Nova", horario_saida=time(6, 30), horario_retorno=time(17, 30),
        bairros_ids=[1], faculdades_ida_ids=[1], faculdades_volta_ids=[1],
        usuario_executor_id=ADMIN_ID,
    )
    dados.update(alteracoes)
    return dados


class GerenciarRotasPrincipaisUseCaseTest(unittest.TestCase):
    def setUp(self):
        self.repository = FakeRepository()
        self.use_case = GerenciarRotasPrincipaisUseCase(self.repository)

    def assert_erro_de_campo(self, campo, mensagem, funcao, *args, **kwargs):
        with self.assertRaises(RotaPrincipalValidationError) as ctx:
            funcao(*args, **kwargs)
        self.assertEqual(ctx.exception.field, campo)
        if mensagem is not None:
            self.assertEqual(str(ctx.exception), mensagem)

    def test_listar_por_padrao_somente_ativas(self):
        resultado = self.use_case.listar()

        self.assertEqual([r["id"] for r in resultado], [1])
        self.assertEqual(self.repository.chamadas[-1], ("listar", True, None))

    def test_listar_com_incluir_inativos_remove_filtro_e_normaliza_nome(self):
        resultado = self.use_case.listar(incluir_inativos=True, nome="  centro ")

        self.assertEqual({r["id"] for r in resultado}, {1, 2})
        self.assertEqual(self.repository.chamadas[-1], ("listar", None, "centro"))

    def test_listar_com_nome_em_branco_ignora_o_filtro(self):
        self.use_case.listar(nome="   ")

        self.assertEqual(self.repository.chamadas[-1], ("listar", True, None))

    def test_buscar_inexistente_e_id_invalido(self):
        with self.assertRaises(RotaPrincipalNaoEncontradaError):
            self.use_case.buscar(99)
        self.assert_erro_de_campo("rota_id", None, self.use_case.buscar, 0)

    def test_criar_normaliza_nome_e_delega(self):
        self.use_case.criar(**argumentos(nome="  Rota Nova  "))

        self.assertEqual(self.repository.chamadas[-1][1][0], "Rota Nova")

    def test_criterio_7_campos_obrigatorios(self):
        casos = [
            ("nome", "Nome da rota é obrigatório.", {"nome": "   "}),
            ("nome", "Nome da rota é obrigatório.", {"nome": None}),
            ("horario_saida", "Horário de saída é obrigatório.", {"horario_saida": None}),
            ("horario_retorno", "Horário de retorno é obrigatório.", {"horario_retorno": None}),
            ("bairros_ids", "Vincule ao menos um bairro.", {"bairros_ids": []}),
            ("faculdades_ida_ids", "Informe ao menos uma faculdade na ida.", {"faculdades_ida_ids": []}),
            ("faculdades_volta_ids", "Informe ao menos uma faculdade na volta.", {"faculdades_volta_ids": []}),
        ]
        for campo, mensagem, alteracao in casos:
            with self.subTest(campo=campo, alteracao=alteracao):
                self.assert_erro_de_campo(campo, mensagem, self.use_case.criar, **argumentos(**alteracao))
        self.assertFalse([c for c in self.repository.chamadas if c[0] == "criar"])

    def test_horario_de_retorno_deve_ser_maior_que_o_de_saida(self):
        for saida, retorno in ((time(6, 30), time(6, 30)), (time(23, 0), time(1, 0))):
            with self.subTest(saida=saida, retorno=retorno):
                self.assert_erro_de_campo(
                    "horario_retorno",
                    "Horário de retorno deve ser maior que o horário de saída.",
                    self.use_case.criar,
                    **argumentos(horario_saida=saida, horario_retorno=retorno),
                )

    def test_duplicados_na_mesma_lista_dao_erro_por_campo(self):
        for campo in ("bairros_ids", "faculdades_ida_ids", "faculdades_volta_ids"):
            with self.subTest(campo=campo):
                self.assert_erro_de_campo(campo, None, self.use_case.criar, **argumentos(**{campo: [1, 1]}))

    def test_mesma_faculdade_na_ida_e_na_volta_e_permitida(self):
        self.use_case.criar(**argumentos(faculdades_ida_ids=[1, 2], faculdades_volta_ids=[2]))

        self.assertEqual(self.repository.chamadas[-1][0], "criar")

    def test_atualizar_valida_ordem_contra_o_horario_ja_gravado(self):
        # Rota 1: saída 06:30 / retorno 17:30.
        self.assert_erro_de_campo(
            "horario_retorno", None, self.use_case.atualizar, 1, {"horario_saida": time(18, 0)}, ADMIN_ID
        )
        self.assert_erro_de_campo(
            "horario_retorno", None, self.use_case.atualizar, 1, {"horario_retorno": time(6, 0)}, ADMIN_ID
        )
        self.use_case.atualizar(1, {"horario_saida": time(6, 0)}, ADMIN_ID)

    def test_atualizar_inexistente_lanca_nao_encontrada(self):
        with self.assertRaises(RotaPrincipalNaoEncontradaError):
            self.use_case.atualizar(99, {"nome": "X"}, ADMIN_ID)

    def test_criterio_5_inativar_com_agendamento_futuro_bloqueia(self):
        self.repository.com_agendamentos.add(1)

        with self.assertRaises(RotaComAgendamentosPendentesError) as ctx:
            self.use_case.inativar(1, ADMIN_ID)

        self.assertEqual(
            str(ctx.exception),
            "Esta rota possui agendamentos pendentes e não pode ser inativada no momento.",
        )
        self.assertTrue(self.repository.rotas[1]["ativo"])
        self.assertNotIn("inativar", [c[0] for c in self.repository.chamadas])

    def test_criterio_4_inativar_sem_agendamento_inativa_com_executor(self):
        resultado = self.use_case.inativar(1, ADMIN_ID)

        self.assertFalse(resultado["ativo"])
        self.assertIn(("inativar", 1, ADMIN_ID), self.repository.chamadas)

    def test_reativar_rota_inativa_e_recusar_rota_ativa(self):
        self.assertTrue(self.use_case.reativar(2, ADMIN_ID)["ativo"])
        with self.assertRaises(RotaPrincipalStatusInalteradoError):
            self.use_case.reativar(1, ADMIN_ID)

    def test_reativar_com_vinculo_inativo_bloqueia_sem_alterar(self):
        self.repository.com_vinculo_inativo.add(2)

        with self.assertRaises(RotaComVinculoInativoError) as ctx:
            self.use_case.reativar(2, ADMIN_ID)

        self.assertEqual(
            str(ctx.exception),
            "Esta rota possui bairro ou faculdade inativo e não pode ser reativada. "
            "Atualize os vínculos antes.",
        )
        self.assertFalse(self.repository.rotas[2]["ativo"])
        self.assertNotIn("reativar", [c[0] for c in self.repository.chamadas])

    def test_inativar_e_reativar_rota_inexistente(self):
        with self.assertRaises(RotaPrincipalNaoEncontradaError):
            self.use_case.inativar(99, ADMIN_ID)
        with self.assertRaises(RotaPrincipalNaoEncontradaError):
            self.use_case.reativar(99, ADMIN_ID)

    def test_executor_invalido_e_recusado(self):
        self.assert_erro_de_campo("usuario_executor_id", None, self.use_case.inativar, 1, 0)


ESCRITAS = {"criar", "atualizar", "inativar", "reativar"}


class RepositoryProgramavel(FakeRepository):
    """Fake que lança erros configurados, como o repository real faria."""

    def __init__(self):
        super().__init__()
        self.erro_criar = None
        self.erro_atualizar = None
        self.atualizar_devolve_none = False
        self.inativar_devolve_none = False
        self.reativar_devolve_none = False

    def criar(self, *argumentos):
        super().criar(*argumentos)
        if self.erro_criar is not None:
            raise self.erro_criar
        return {"id": 3}

    def atualizar(self, rota_id, campos, usuario_executor_id):
        resultado = super().atualizar(rota_id, campos, usuario_executor_id)
        if self.erro_atualizar is not None:
            raise self.erro_atualizar
        return None if self.atualizar_devolve_none else resultado

    def inativar(self, rota_id, usuario_executor_id):
        resultado = super().inativar(rota_id, usuario_executor_id)
        return None if self.inativar_devolve_none else resultado

    def reativar(self, rota_id, usuario_executor_id):
        resultado = super().reativar(rota_id, usuario_executor_id)
        return None if self.reativar_devolve_none else resultado


class CasoDeUsoTestBase(unittest.TestCase):
    def setUp(self):
        self.repository = RepositoryProgramavel()
        self.use_case = GerenciarRotasPrincipaisUseCase(self.repository)

    def nomes_das_chamadas(self):
        return [c[0] for c in self.repository.chamadas]

    def escritas(self):
        return [n for n in self.nomes_das_chamadas() if n in ESCRITAS]

    def assert_validacao(self, campo, mensagem, funcao, *args, **kwargs):
        with self.assertRaises(RotaPrincipalValidationError) as ctx:
            funcao(*args, **kwargs)
        self.assertEqual(ctx.exception.field, campo)
        self.assertEqual(str(ctx.exception), mensagem)


class MensagensDeValidacaoTest(CasoDeUsoTestBase):
    def test_mensagens_exatas_de_nome(self):
        casos = [
            ({"nome": "x" * 151}, "Nome da rota deve ter no máximo 150 caracteres."),
            ({"nome": 123}, "Nome da rota deve ser um texto válido."),
            ({"nome": "\t \n"}, "Nome da rota é obrigatório."),
        ]
        for alteracao, mensagem in casos:
            with self.subTest(alteracao=alteracao):
                self.assert_validacao("nome", mensagem, self.use_case.criar, **argumentos(**alteracao))

    def test_nul_no_nome_e_recusado_como_texto_invalido_na_criacao_e_na_edicao(self):
        self.assert_validacao(
            "nome", "Nome da rota deve ser um texto válido.",
            self.use_case.criar, **argumentos(nome="a\x00b"),
        )
        self.assert_validacao(
            "nome", "Nome da rota deve ser um texto válido.",
            self.use_case.atualizar, 1, {"nome": "a\x00b"}, ADMIN_ID,
        )
        self.assertEqual([c for c in self.repository.chamadas if c[0] in ("criar", "atualizar")], [])

    def test_nome_com_simbolos_e_recusado_na_criacao_e_na_edicao(self):
        mensagem = "Nome da rota deve conter apenas letras, números, espaços, hífen, apóstrofo ou barra."
        for nome in ("wwww@@@2", "Rota #1", "Rota (Manhã)", "Rota_Centro"):
            with self.subTest(nome=nome):
                self.assert_validacao("nome", mensagem, self.use_case.criar, **argumentos(nome=nome))
                self.assert_validacao("nome", mensagem, self.use_case.atualizar, 1, {"nome": nome}, ADMIN_ID)
        self.assertEqual(self.escritas(), [])

    def test_nome_com_letras_acentos_numeros_hifen_apostrofo_e_barra_e_aceito(self):
        for nome in ("Rota Centro - UFC", "Linha 01/02", "Rota D'Ávila", "Rota São João"):
            with self.subTest(nome=nome):
                self.use_case.criar(**argumentos(nome=nome))

        self.assertEqual(self.escritas(), ["criar"] * 4)

    def test_nome_no_limite_de_150_e_aceito(self):
        self.use_case.criar(**argumentos(nome="x" * 150))

        self.assertEqual(self.escritas(), ["criar"])

    def test_horario_como_texto_invalido_ou_tipo_errado(self):
        for campo in ("horario_saida", "horario_retorno"):
            for invalido in ("25:00", "6:30", "", 630):
                with self.subTest(campo=campo, valor=invalido):
                    self.assert_validacao(
                        campo, "Horário deve estar no formato HH:MM.",
                        self.use_case.criar, **argumentos(**{campo: invalido}),
                    )

    def test_horario_como_texto_valido_e_convertido(self):
        self.use_case.criar(**argumentos(horario_saida="06:30", horario_retorno=" 17:30 "))

        _, (_, saida, retorno, *_) = self.repository.chamadas[-1]
        self.assertEqual((saida, retorno), (time(6, 30), time(17, 30)))

    def test_itens_de_lista_invalidos(self):
        for campo in ("bairros_ids", "faculdades_ida_ids", "faculdades_volta_ids"):
            for invalido in ([0], [-1], [True], ["1"], [1.5], [None], [1, 0]):
                with self.subTest(campo=campo, valor=invalido):
                    self.assert_validacao(
                        campo, "Informe IDs válidos (números inteiros positivos).",
                        self.use_case.criar, **argumentos(**{campo: invalido}),
                    )

    def test_lista_que_nao_e_lista_ou_nula_conta_como_vazia(self):
        mensagens = {
            "bairros_ids": "Vincule ao menos um bairro.",
            "faculdades_ida_ids": "Informe ao menos uma faculdade na ida.",
            "faculdades_volta_ids": "Informe ao menos uma faculdade na volta.",
        }
        for campo, mensagem in mensagens.items():
            for invalido in (None, "1", 1, (1,)):
                with self.subTest(campo=campo, valor=invalido):
                    self.assert_validacao(campo, mensagem, self.use_case.criar, **argumentos(**{campo: invalido}))

    def test_mensagens_exatas_de_duplicidade(self):
        mensagens = {
            "bairros_ids": "Bairros duplicados: cada bairro só pode ser vinculado uma vez.",
            "faculdades_ida_ids": "Faculdades da ida duplicadas: informe cada faculdade uma vez.",
            "faculdades_volta_ids": "Faculdades da volta duplicadas: informe cada faculdade uma vez.",
        }
        for campo, mensagem in mensagens.items():
            with self.subTest(campo=campo):
                self.assert_validacao(campo, mensagem, self.use_case.criar, **argumentos(**{campo: [2, 3, 2]}))

    def test_mensagem_de_ordem_dos_horarios_na_criacao(self):
        self.assert_validacao(
            "horario_retorno", "Horário de retorno deve ser maior que o horário de saída.",
            self.use_case.criar, **argumentos(horario_saida=time(10, 0), horario_retorno=time(9, 59)),
        )

    def test_horarios_validos_nas_fronteiras_do_dia(self):
        self.use_case.criar(**argumentos(horario_saida=time(0, 0), horario_retorno=time(23, 59)))

        self.assertEqual(self.escritas(), ["criar"])

    def test_mensagem_de_id_invalido(self):
        for invalido in (0, -1, True, "1", None, 1.0):
            with self.subTest(valor=invalido):
                self.assert_validacao("rota_id", "ID deve ser um número inteiro positivo.", self.use_case.buscar, invalido)
                self.assert_validacao(
                    "usuario_executor_id", "ID deve ser um número inteiro positivo.",
                    self.use_case.criar, **argumentos(usuario_executor_id=invalido),
                )

    def test_mensagem_de_listagem_com_nome_que_nao_e_texto(self):
        self.assert_validacao("nome", "Nome deve ser um texto válido.", self.use_case.listar, nome=10)

    def test_nome_com_nul_na_listagem_e_recusado_sem_consultar_o_repository(self):
        self.repository.chamadas.clear()

        self.assert_validacao("nome", "Nome deve ser um texto válido.", self.use_case.listar, nome="a\x00b")

        self.assertEqual(self.repository.chamadas, [])

    def test_mensagem_de_edicao_sem_campos_e_de_campos_nulos(self):
        self.assert_validacao("rota", "Informe ao menos um campo para atualização.", self.use_case.atualizar, 1, {}, ADMIN_ID)
        casos = {
            "nome": ("Nome da rota é obrigatório.", None),
            "horario_saida": ("Horário de saída é obrigatório.", None),
            "horario_retorno": ("Horário de retorno é obrigatório.", None),
            "bairros_ids": ("Vincule ao menos um bairro.", None),
            "faculdades_ida_ids": ("Informe ao menos uma faculdade na ida.", []),
            "faculdades_volta_ids": ("Informe ao menos uma faculdade na volta.", []),
        }
        for campo, (mensagem, valor) in casos.items():
            with self.subTest(campo=campo):
                self.assert_validacao(campo, mensagem, self.use_case.atualizar, 1, {campo: valor}, ADMIN_ID)
        self.assertEqual(self.escritas(), [])

    def test_mensagens_exatas_de_nao_encontrada_e_de_estado_repetido(self):
        with self.assertRaises(RotaPrincipalNaoEncontradaError) as ctx:
            self.use_case.buscar(99)
        self.assertEqual(str(ctx.exception), "Rota não encontrada.")
        with self.assertRaises(RotaPrincipalStatusInalteradoError) as ctx:
            self.use_case.inativar(2, ADMIN_ID)
        self.assertEqual(str(ctx.exception), "Rota já está inativa.")
        with self.assertRaises(RotaPrincipalStatusInalteradoError) as ctx:
            self.use_case.reativar(1, ADMIN_ID)
        self.assertEqual(str(ctx.exception), "Rota já está ativa.")


class ErrosDoRepositoryTest(CasoDeUsoTestBase):
    def test_nome_em_uso_na_criacao_chega_inalterado_ao_chamador(self):
        erro = RotaPrincipalNomeEmUsoError("Já existe uma rota com este nome.")
        self.repository.erro_criar = erro

        with self.assertRaises(RotaPrincipalNomeEmUsoError) as ctx:
            self.use_case.criar(**argumentos())

        self.assertIs(ctx.exception, erro)

    def test_nome_em_uso_na_edicao_chega_inalterado_ao_chamador(self):
        erro = RotaPrincipalNomeEmUsoError("Já existe uma rota com este nome.")
        self.repository.erro_atualizar = erro

        with self.assertRaises(RotaPrincipalNomeEmUsoError) as ctx:
            self.use_case.atualizar(1, {"nome": "Outra"}, ADMIN_ID)

        self.assertIs(ctx.exception, erro)

    def test_referencia_invalida_preserva_campo_e_mensagem(self):
        for operacao in ("criar", "atualizar"):
            with self.subTest(operacao=operacao):
                erro = RotaReferenciaInvalidaError("bairros_ids", "Bairro inativo ou inexistente (ids: 3).")
                self.repository.erro_criar = self.repository.erro_atualizar = erro
                with self.assertRaises(RotaReferenciaInvalidaError) as ctx:
                    if operacao == "criar":
                        self.use_case.criar(**argumentos())
                    else:
                        self.use_case.atualizar(1, {"bairros_ids": [3]}, ADMIN_ID)
                self.assertEqual(ctx.exception.field, "bairros_ids")
                self.assertEqual(str(ctx.exception), "Bairro inativo ou inexistente (ids: 3).")

    def test_rota_removida_entre_a_consulta_e_a_escrita_vira_nao_encontrada(self):
        self.repository.atualizar_devolve_none = True
        with self.assertRaises(RotaPrincipalNaoEncontradaError):
            self.use_case.atualizar(1, {"nome": "Outra"}, ADMIN_ID)

        self.repository.inativar_devolve_none = True
        with self.assertRaises(RotaPrincipalNaoEncontradaError):
            self.use_case.inativar(1, ADMIN_ID)

        self.repository.reativar_devolve_none = True
        with self.assertRaises(RotaPrincipalNaoEncontradaError):
            self.use_case.reativar(2, ADMIN_ID)


class OrdemDasRegrasTest(CasoDeUsoTestBase):
    """validação de entrada -> existência -> bloqueios -> escrita."""

    def test_criar_com_qualquer_erro_de_validacao_nao_toca_no_repository(self):
        invalidos = [
            {"nome": " "}, {"horario_saida": "x"}, {"horario_retorno": None},
            {"horario_saida": time(9, 0), "horario_retorno": time(9, 0)},
            {"bairros_ids": []}, {"faculdades_ida_ids": [1, 1]}, {"faculdades_volta_ids": [0]},
            {"usuario_executor_id": 0},
        ]
        for alteracao in invalidos:
            with self.subTest(alteracao=alteracao):
                with self.assertRaises(RotaPrincipalValidationError):
                    self.use_case.criar(**argumentos(**alteracao))
        self.assertEqual(self.repository.chamadas, [])

    def test_atualizar_com_id_ou_executor_invalido_ou_sem_campos_nao_consulta_nada(self):
        for rota_id, campos, executor in ((0, {"nome": "X"}, ADMIN_ID), (1, {"nome": "X"}, 0), (1, {}, ADMIN_ID)):
            with self.subTest(rota_id=rota_id, campos=campos, executor=executor):
                with self.assertRaises(RotaPrincipalValidationError):
                    self.use_case.atualizar(rota_id, campos, executor)
        self.assertEqual(self.repository.chamadas, [])

    def test_atualizar_rota_inexistente_consulta_so_a_existencia_e_nao_escreve(self):
        with self.assertRaises(RotaPrincipalNaoEncontradaError):
            self.use_case.atualizar(99, {"nome": "Nova"}, ADMIN_ID)

        self.assertEqual(self.repository.chamadas, [("buscar", 99)])

    def test_atualizar_com_campo_invalido_em_rota_existente_nao_escreve(self):
        invalidos = [
            {"nome": " "}, {"horario_saida": "x"}, {"bairros_ids": [1, 1]},
            {"faculdades_ida_ids": [0]}, {"horario_saida": time(18, 0)},
        ]
        for campos in invalidos:
            with self.subTest(campos=campos):
                with self.assertRaises(RotaPrincipalValidationError):
                    self.use_case.atualizar(1, campos, ADMIN_ID)
        self.assertEqual(self.escritas(), [])
        self.assertEqual(set(self.repository.chamadas), {("buscar", 1)})

    def test_atualizar_valido_consulta_antes_de_escrever_com_somente_os_campos_enviados(self):
        self.use_case.atualizar(1, {"nome": "  Nova  "}, ADMIN_ID)

        self.assertEqual(
            self.repository.chamadas,
            [("buscar", 1), ("atualizar", 1, {"nome": "Nova"}, ADMIN_ID)],
        )

    def test_atualizar_em_rota_inativa_e_permitido_e_nao_reativa(self):
        self.use_case.atualizar(2, {"nome": "Rota Antiga 2"}, ADMIN_ID)

        self.assertEqual(self.escritas(), ["atualizar"])
        self.assertFalse(self.repository.rotas[2]["ativo"])

    def test_inativar_ordem_executor_existencia_estado_agendamento_escrita(self):
        with self.assertRaises(RotaPrincipalValidationError):
            self.use_case.inativar(1, 0)
        self.assertEqual(self.repository.chamadas, [])

        with self.assertRaises(RotaPrincipalNaoEncontradaError):
            self.use_case.inativar(99, ADMIN_ID)
        self.assertEqual(self.repository.chamadas, [("buscar", 99)])

        self.repository.chamadas.clear()
        with self.assertRaises(RotaPrincipalStatusInalteradoError):
            self.use_case.inativar(2, ADMIN_ID)
        self.assertEqual(self.repository.chamadas, [("buscar", 2)])

        self.repository.chamadas.clear()
        self.repository.com_agendamentos.add(1)
        with self.assertRaises(RotaComAgendamentosPendentesError):
            self.use_case.inativar(1, ADMIN_ID)
        self.assertEqual(
            self.repository.chamadas,
            [("buscar", 1), ("possui_complementares_ativas", 1), ("possui_agendamentos_futuros", 1)],
        )

        self.repository.chamadas.clear()
        self.repository.com_agendamentos.clear()
        self.use_case.inativar(1, ADMIN_ID)
        self.assertEqual(
            self.repository.chamadas,
            [
                ("buscar", 1),
                ("possui_complementares_ativas", 1),
                ("possui_agendamentos_futuros", 1),
                ("inativar", 1, ADMIN_ID),
            ],
        )

    def test_inativar_com_complementares_ativas_bloqueia_antes_dos_agendamentos(self):
        self.repository.com_complementares_ativas.add(1)
        self.repository.com_agendamentos.add(1)

        with self.assertRaises(RotaComComplementaresAtivasError) as contexto:
            self.use_case.inativar(1, ADMIN_ID)

        self.assertEqual(str(contexto.exception), MENSAGEM_ROTA_COM_COMPLEMENTARES_ATIVAS)
        self.assertEqual(
            self.repository.chamadas, [("buscar", 1), ("possui_complementares_ativas", 1)]
        )
        self.assertEqual(self.escritas(), [])
        self.assertTrue(self.repository.rotas[1]["ativo"])

    def test_rota_ja_inativa_responde_estado_inalterado_sem_consultar_complementares(self):
        self.repository.com_complementares_ativas.add(2)

        with self.assertRaises(RotaPrincipalStatusInalteradoError):
            self.use_case.inativar(2, ADMIN_ID)

        self.assertNotIn(("possui_complementares_ativas", 2), self.repository.chamadas)

    def test_reativar_ordem_executor_existencia_estado_vinculo_escrita(self):
        with self.assertRaises(RotaPrincipalValidationError):
            self.use_case.reativar(2, 0)
        self.assertEqual(self.repository.chamadas, [])

        with self.assertRaises(RotaPrincipalNaoEncontradaError):
            self.use_case.reativar(99, ADMIN_ID)
        self.assertEqual(self.repository.chamadas, [("buscar", 99)])

        # Rota já ativa: o estado é checado antes de olhar os vínculos.
        self.repository.chamadas.clear()
        self.repository.com_vinculo_inativo.add(1)
        with self.assertRaises(RotaPrincipalStatusInalteradoError):
            self.use_case.reativar(1, ADMIN_ID)
        self.assertEqual(self.repository.chamadas, [("buscar", 1)])

        self.repository.chamadas.clear()
        self.repository.com_vinculo_inativo.add(2)
        with self.assertRaises(RotaComVinculoInativoError):
            self.use_case.reativar(2, ADMIN_ID)
        self.assertEqual(self.repository.chamadas, [("buscar", 2), ("possui_vinculo_inativo", 2)])

        self.repository.chamadas.clear()
        self.repository.com_vinculo_inativo.clear()
        self.use_case.reativar(2, ADMIN_ID)
        self.assertEqual(
            self.repository.chamadas,
            [("buscar", 2), ("possui_vinculo_inativo", 2), ("reativar", 2, ADMIN_ID)],
        )

    def test_inativar_nunca_escreve_quando_ha_bloqueio_de_agendamento(self):
        self.repository.com_agendamentos.add(1)

        with self.assertRaises(RotaComAgendamentosPendentesError):
            self.use_case.inativar(1, ADMIN_ID)

        self.assertEqual(self.escritas(), [])
        self.assertTrue(self.repository.rotas[1]["ativo"])

    def test_reativar_nunca_escreve_quando_ha_vinculo_inativo(self):
        self.repository.com_vinculo_inativo.add(2)

        with self.assertRaises(RotaComVinculoInativoError):
            self.use_case.reativar(2, ADMIN_ID)

        self.assertEqual(self.escritas(), [])
        self.assertFalse(self.repository.rotas[2]["ativo"])

    def test_listar_nao_escreve_e_buscar_nao_consulta_bloqueios(self):
        self.use_case.listar(incluir_inativos=True)
        self.use_case.buscar(1)
        self.use_case.listar_opcoes()

        self.assertEqual(self.escritas(), [])
        self.assertNotIn("possui_agendamentos_futuros", self.nomes_das_chamadas())


if __name__ == "__main__":
    unittest.main()
