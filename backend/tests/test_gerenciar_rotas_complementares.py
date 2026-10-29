"""Testes unitários puros do caso de uso de rotas complementares (repository falso)."""

import unittest
from datetime import time

from tests.rota_complementar_support import ADMIN_ID

from src.modulos.rotas.application.use_cases.gerenciar_rotas_complementares_use_case import (
    MENSAGEM_ROTA_COM_AGENDAMENTOS,
    GerenciarRotasComplementaresUseCase,
    RotaComplementarComAgendamentosPendentesError,
    RotaComplementarNaoEncontradaError,
    RotaComplementarStatusInalteradoError,
    RotaComplementarValidationError,
)
from src.modulos.rotas.infrastructure.repositories.rota_complementar_repository import (
    RotaComplementarComPrincipalInativaError,
    RotaComplementarNomeEmUsoError,
    RotaComplementarReferenciaInvalidaError,
)

ESCRITAS = {"criar", "atualizar", "inativar", "reativar"}


def rota(rota_id, nome, ativo):
    return {
        "id": rota_id, "nome": nome, "horario_saida": "06:00", "horario_retorno": "17:40",
        "ponto_conexao": "Trevo", "ativo": ativo,
        "rota_principal": {"id": 1, "nome": "Rota Centro - UFC", "ativo": True},
    }


class FakeRepository:
    def __init__(self):
        self.rotas = {1: rota(1, "Van 2", True), 2: rota(2, "Van Antiga", False)}
        self.com_agendamentos = set()
        self.principal_inativa_ids = set()
        self.chamadas = []
        self.erro_na_escrita = None
        self.devolve_none = set()

    def _escrita(self, nome, *argumentos):
        self.chamadas.append((nome, *argumentos))
        if self.erro_na_escrita is not None:
            raise self.erro_na_escrita
        if nome in self.devolve_none:
            return None
        return {"id": argumentos[0] if nome != "criar" else 3}

    def listar(self, ativo=None, nome=None, rota_principal_id=None):
        self.chamadas.append(("listar", ativo, nome, rota_principal_id))
        return [r for r in self.rotas.values() if ativo is None or r["ativo"] == ativo]

    def listar_opcoes(self):
        self.chamadas.append(("listar_opcoes",))
        return {"rotas_principais": []}

    def buscar(self, rota_id):
        self.chamadas.append(("buscar", rota_id))
        return self.rotas.get(rota_id)

    def criar(self, *argumentos):
        return self._escrita("criar", *argumentos)

    def atualizar(self, rota_id, campos, usuario_executor_id):
        return self._escrita("atualizar", rota_id, campos, usuario_executor_id)

    def possui_agendamentos_futuros(self, rota_id):
        self.chamadas.append(("possui_agendamentos_futuros", rota_id))
        return rota_id in self.com_agendamentos

    def principal_inativa(self, rota_id):
        self.chamadas.append(("principal_inativa", rota_id))
        return rota_id in self.principal_inativa_ids

    def inativar(self, rota_id, usuario_executor_id):
        return self._escrita("inativar", rota_id, usuario_executor_id)

    def reativar(self, rota_id, usuario_executor_id):
        return self._escrita("reativar", rota_id, usuario_executor_id)


class CasoDeUsoTestBase(unittest.TestCase):
    def setUp(self):
        self.repository = FakeRepository()
        self.use_case = GerenciarRotasComplementaresUseCase(self.repository)

    def nomes(self):
        return [c[0] for c in self.repository.chamadas]

    def escritas(self):
        return [n for n in self.nomes() if n in ESCRITAS]

    def assert_validacao(self, campo, mensagem, funcao, *args, **kwargs):
        with self.assertRaises(RotaComplementarValidationError) as ctx:
            funcao(*args, **kwargs)
        self.assertEqual(ctx.exception.field, campo)
        self.assertEqual(str(ctx.exception), mensagem)
        self.assertEqual(self.escritas(), [])


def criar_args(**alteracoes):
    dados = dict(
        nome="  Van 2 - Bairro Novo ", horario_saida=time(6, 0), horario_retorno=time(17, 40),
        ponto_conexao=" Trevo do Bairro Novo ", rota_principal_id=1,
        usuario_executor_id=ADMIN_ID,
    )
    dados.update(alteracoes)
    return dados


class CriarTest(CasoDeUsoTestBase):
    def test_normaliza_e_repassa_ao_repository(self):
        resultado = self.use_case.criar(**criar_args())

        self.assertEqual(resultado, {"id": 3})
        self.assertEqual(
            self.repository.chamadas,
            [("criar", "Van 2 - Bairro Novo", time(6, 0), time(17, 40), "Trevo do Bairro Novo", 1, ADMIN_ID)],
        )

    def test_horario_em_texto_e_convertido(self):
        self.use_case.criar(**criar_args(horario_saida="05:45", horario_retorno="18:10"))

        self.assertEqual(self.repository.chamadas[0][2], time(5, 45))
        self.assertEqual(self.repository.chamadas[0][3], time(18, 10))

    def test_nome_obrigatorio_texto_e_tamanho(self):
        self.assert_validacao(
            "nome", "Nome da rota complementar é obrigatório.",
            self.use_case.criar, **criar_args(nome=None),
        )
        self.assert_validacao(
            "nome", "Nome da rota complementar é obrigatório.",
            self.use_case.criar, **criar_args(nome="   "),
        )
        self.assert_validacao(
            "nome", "Nome da rota complementar deve ser um texto válido.",
            self.use_case.criar, **criar_args(nome=10),
        )
        self.assert_validacao(
            "nome", "Nome da rota complementar deve ter no máximo 150 caracteres.",
            self.use_case.criar, **criar_args(nome="a" * 151),
        )
        self.use_case.criar(**criar_args(nome="a" * 150))

    def test_nul_em_nome_e_ponto_e_recusado_como_texto_invalido(self):
        for campo, rotulo in (("nome", "Nome da rota complementar"), ("ponto_conexao", "Ponto de conexão")):
            with self.subTest(campo=campo):
                self.assert_validacao(
                    campo, f"{rotulo} deve ser um texto válido.",
                    self.use_case.criar, **criar_args(**{campo: "a\x00b"}),
                )
        self.assertEqual(self.repository.chamadas, [])

    def test_horario_obrigatorio_e_formato(self):
        for campo, rotulo in (("horario_saida", "Horário de saída"), ("horario_retorno", "Horário de retorno")):
            self.assert_validacao(
                campo, f"{rotulo} é obrigatório.",
                self.use_case.criar, **criar_args(**{campo: None}),
            )
            for invalido in ("24:00", "6:30", "06:60", "", 630, "０６:３０"):
                with self.subTest(campo=campo, horario=invalido):
                    self.assert_validacao(
                        campo, "Horário deve estar no formato HH:MM.",
                        self.use_case.criar, **criar_args(**{campo: invalido}),
                    )

    def test_retorno_igual_ou_anterior_a_saida_e_recusado(self):
        # #208, item 2: o retorno precisa ser estritamente posterior à saída
        for saida, retorno in (("06:00", "06:00"), ("06:00", "05:59"), ("23:59", "00:00")):
            with self.subTest(saida=saida, retorno=retorno):
                self.assert_validacao(
                    "horario_retorno", "Horário de retorno deve ser maior que o horário de saída.",
                    self.use_case.criar, **criar_args(horario_saida=saida, horario_retorno=retorno),
                )
        self.use_case.criar(**criar_args(horario_saida="06:00", horario_retorno="06:01"))
        self.assertEqual(self.escritas(), ["criar"])

    def test_ponto_de_conexao_obrigatorio_texto_e_tamanho(self):
        self.assert_validacao(
            "ponto_conexao", "Ponto de conexão é obrigatório.",
            self.use_case.criar, **criar_args(ponto_conexao=None),
        )
        self.assert_validacao(
            "ponto_conexao", "Ponto de conexão é obrigatório.",
            self.use_case.criar, **criar_args(ponto_conexao=" "),
        )
        self.assert_validacao(
            "ponto_conexao", "Ponto de conexão deve ser um texto válido.",
            self.use_case.criar, **criar_args(ponto_conexao=["x"]),
        )
        self.assert_validacao(
            "ponto_conexao", "Ponto de conexão deve ter no máximo 150 caracteres.",
            self.use_case.criar, **criar_args(ponto_conexao="a" * 151),
        )

    def test_nome_e_ponto_com_simbolos_sao_recusados_na_criacao_e_na_edicao(self):
        # #356: mesma regra do nome da rota principal (#339); o ponto aceita também . , º e ª
        casos = (
            ("nome", "Nome da rota deve conter apenas letras, números, espaços, hífen, apóstrofo ou barra.",
             ("wwww@@@2", "Van #1", "Van (Manhã)", "Van_Sitio", "Van 2.0")),
            ("ponto_conexao", "Ponto de conexão deve conter apenas letras, números, espaços, hífen, "
             "apóstrofo, barra, ponto, vírgula, º ou ª.",
             ("Trevo @@", "Posto #2", "Praça (Centro)", "Rua_1")),
        )
        for campo, mensagem, valores in casos:
            for valor in valores:
                with self.subTest(campo=campo, valor=valor):
                    self.assert_validacao(campo, mensagem, self.use_case.criar, **criar_args(**{campo: valor}))
                    self.assert_validacao(campo, mensagem, self.use_case.atualizar, 1, {campo: valor}, ADMIN_ID)
        self.assertEqual(self.escritas(), [])

    def test_nome_e_ponto_com_acentos_numeros_e_pontuacao_permitida_sao_aceitos(self):
        for nome, ponto in (
            ("Van 2 - Bairro Novo", "Trevo do Bairro Novo"),
            ("Van Sítio D'Água 2/3", "Av. Plácido Castelo, Nº 120"),
            ("Van São João", "Rua 1º de Maio, 45-A"),
        ):
            with self.subTest(nome=nome, ponto=ponto):
                self.use_case.criar(**criar_args(nome=nome, ponto_conexao=ponto))

        self.assertEqual(self.escritas(), ["criar"] * 3)

    def test_rota_principal_obrigatoria_e_id_valido(self):
        self.assert_validacao(
            "rota_principal_id", "Rota principal vinculada é obrigatória.",
            self.use_case.criar, **criar_args(rota_principal_id=None),
        )
        for invalido in (0, -1, True, "1", 1.5):
            with self.subTest(id=invalido):
                self.assert_validacao(
                    "rota_principal_id", "Informe um ID de rota principal válido.",
                    self.use_case.criar, **criar_args(rota_principal_id=invalido),
                )

    def test_executor_invalido_e_validado_primeiro(self):
        for invalido in (0, -1, None, True, "1"):
            with self.subTest(executor=invalido):
                self.assert_validacao(
                    "usuario_executor_id", "ID deve ser um número inteiro positivo.",
                    self.use_case.criar, **criar_args(usuario_executor_id=invalido, nome=None),
                )
        self.assertEqual(self.repository.chamadas, [])

    def test_ordem_das_validacoes_nome_horario_ponto_principal(self):
        with self.assertRaises(RotaComplementarValidationError) as ctx:
            self.use_case.criar(**criar_args(nome=None, horario_saida=None, ponto_conexao=None, rota_principal_id=None))
        self.assertEqual(ctx.exception.field, "nome")
        with self.assertRaises(RotaComplementarValidationError) as ctx:
            self.use_case.criar(**criar_args(horario_saida=None, ponto_conexao=None, rota_principal_id=None))
        self.assertEqual(ctx.exception.field, "horario_saida")
        with self.assertRaises(RotaComplementarValidationError) as ctx:
            self.use_case.criar(**criar_args(horario_retorno=None, ponto_conexao=None, rota_principal_id=None))
        self.assertEqual(ctx.exception.field, "horario_retorno")
        with self.assertRaises(RotaComplementarValidationError) as ctx:
            self.use_case.criar(**criar_args(ponto_conexao=None, rota_principal_id=None))
        self.assertEqual(ctx.exception.field, "ponto_conexao")

    def test_erros_do_repository_sao_propagados_sem_mapeamento_extra(self):
        casos = [
            RotaComplementarNomeEmUsoError("x"),
            RotaComplementarReferenciaInvalidaError(
                "rota_principal_id", "Rota principal inativa ou inexistente."
            ),
        ]
        for erro in casos:
            with self.subTest(erro=type(erro).__name__):
                self.repository.erro_na_escrita = erro
                with self.assertRaises(type(erro)) as ctx:
                    self.use_case.criar(**criar_args())
                self.assertIs(ctx.exception, erro)


class AtualizarTest(CasoDeUsoTestBase):
    def test_patch_vazio_e_recusado_sem_consultar_o_banco(self):
        self.assert_validacao(
            "rota", "Informe ao menos um campo para atualização.",
            self.use_case.atualizar, 1, {}, ADMIN_ID,
        )
        self.assertEqual(self.repository.chamadas, [])

    def test_ids_invalidos(self):
        self.assert_validacao(
            "rota_id", "ID deve ser um número inteiro positivo.",
            self.use_case.atualizar, 0, {"nome": "X"}, ADMIN_ID,
        )
        self.assert_validacao(
            "usuario_executor_id", "ID deve ser um número inteiro positivo.",
            self.use_case.atualizar, 1, {"nome": "X"}, 0,
        )
        self.assertEqual(self.repository.chamadas, [])

    def test_rota_inexistente_vira_nao_encontrada_sem_escrever(self):
        with self.assertRaises(RotaComplementarNaoEncontradaError):
            self.use_case.atualizar(99, {"nome": "X"}, ADMIN_ID)

        self.assertEqual(self.repository.chamadas, [("buscar", 99)])

    def test_repassa_somente_os_campos_enviados_ja_normalizados(self):
        self.use_case.atualizar(
            1,
            {"nome": " Van 3 ", "horario_saida": "05:45", "horario_retorno": "18:10",
             "ponto_conexao": " Posto ", "rota_principal_id": 2},
            ADMIN_ID,
        )

        self.assertEqual(
            self.repository.chamadas[-1],
            ("atualizar", 1,
             {"nome": "Van 3", "horario_saida": time(5, 45), "horario_retorno": time(18, 10),
              "ponto_conexao": "Posto", "rota_principal_id": 2},
             ADMIN_ID),
        )

    def test_cada_campo_isolado_e_aceito(self):
        for campo, valor in (("nome", "Van 3"), ("horario_saida", time(7, 0)),
                             ("horario_retorno", time(18, 0)),
                             ("ponto_conexao", "Posto"), ("rota_principal_id", 2)):
            with self.subTest(campo=campo):
                self.use_case.atualizar(1, {campo: valor}, ADMIN_ID)
                self.assertEqual(list(self.repository.chamadas[-1][2]), [campo])

    def test_campos_nulos_ou_vazios_sao_obrigatorios(self):
        casos = [
            ("nome", None, "Nome da rota complementar é obrigatório."),
            ("nome", "  ", "Nome da rota complementar é obrigatório."),
            ("horario_saida", None, "Horário de saída é obrigatório."),
            ("horario_saida", "25:00", "Horário deve estar no formato HH:MM."),
            ("horario_retorno", None, "Horário de retorno é obrigatório."),
            ("horario_retorno", "17h45", "Horário deve estar no formato HH:MM."),
            ("ponto_conexao", None, "Ponto de conexão é obrigatório."),
            ("ponto_conexao", "", "Ponto de conexão é obrigatório."),
            ("rota_principal_id", None, "Rota principal vinculada é obrigatória."),
            ("rota_principal_id", 0, "Informe um ID de rota principal válido."),
        ]
        for campo, valor, mensagem in casos:
            with self.subTest(campo=campo, valor=valor):
                self.assert_validacao(
                    campo, mensagem, self.use_case.atualizar, 1, {campo: valor}, ADMIN_ID
                )

    def test_edicao_parcial_compara_com_o_horario_salvo(self):
        # Rota salva: saída 06:00 e retorno 17:40
        casos = [
            ({"horario_retorno": "06:00"}, False),
            ({"horario_retorno": "05:30"}, False),
            ({"horario_saida": "17:40"}, False),
            ({"horario_saida": "18:00"}, False),
            ({"horario_saida": "18:00", "horario_retorno": "19:00"}, True),
            ({"horario_retorno": "17:45"}, True),
            ({"horario_saida": "17:39"}, True),
        ]
        for campos, aceito in casos:
            with self.subTest(campos=campos):
                self.repository.chamadas.clear()
                if aceito:
                    self.use_case.atualizar(1, campos, ADMIN_ID)
                    self.assertEqual(self.escritas(), ["atualizar"])
                else:
                    self.assert_validacao(
                        "horario_retorno",
                        "Horário de retorno deve ser maior que o horário de saída.",
                        self.use_case.atualizar, 1, campos, ADMIN_ID,
                    )

    def test_nul_em_nome_e_ponto_e_recusado_na_edicao_sem_escrever(self):
        for campo, rotulo in (("nome", "Nome da rota complementar"), ("ponto_conexao", "Ponto de conexão")):
            with self.subTest(campo=campo):
                self.assert_validacao(
                    campo, f"{rotulo} deve ser um texto válido.",
                    self.use_case.atualizar, 1, {campo: "a\x00b"}, ADMIN_ID,
                )

    def test_registro_inativo_pode_ser_editado(self):
        self.use_case.atualizar(2, {"nome": "Van Nova"}, ADMIN_ID)

        self.assertEqual(self.escritas(), ["atualizar"])

    def test_repository_devolvendo_none_vira_nao_encontrada(self):
        self.repository.devolve_none.add("atualizar")

        with self.assertRaises(RotaComplementarNaoEncontradaError):
            self.use_case.atualizar(1, {"nome": "X"}, ADMIN_ID)

    def test_erros_do_repository_sao_propagados(self):
        for erro in (
            RotaComplementarNomeEmUsoError("x"),
            RotaComplementarReferenciaInvalidaError("rota_principal_id", "m"),
        ):
            with self.subTest(erro=type(erro).__name__):
                self.repository.erro_na_escrita = erro
                with self.assertRaises(type(erro)):
                    self.use_case.atualizar(1, {"nome": "X"}, ADMIN_ID)


class InativarReativarTest(CasoDeUsoTestBase):
    def test_inativar_sem_agendamentos_futuros(self):
        resultado = self.use_case.inativar(1, ADMIN_ID)

        self.assertEqual(resultado, {"id": 1})
        self.assertEqual(
            self.repository.chamadas,
            [("buscar", 1), ("possui_agendamentos_futuros", 1), ("inativar", 1, ADMIN_ID)],
        )

    def test_inativar_com_agendamentos_futuros_bloqueia_sem_escrever(self):
        self.repository.com_agendamentos.add(1)

        with self.assertRaises(RotaComplementarComAgendamentosPendentesError) as ctx:
            self.use_case.inativar(1, ADMIN_ID)

        self.assertEqual(
            str(ctx.exception),
            "Esta rota possui agendamentos pendentes e não pode ser inativada no momento.",
        )
        self.assertEqual(str(ctx.exception), MENSAGEM_ROTA_COM_AGENDAMENTOS)
        self.assertEqual(self.escritas(), [])

    def test_inativar_ja_inativa_e_estado_inalterado_sem_consultar_agendamentos(self):
        with self.assertRaises(RotaComplementarStatusInalteradoError) as ctx:
            self.use_case.inativar(2, ADMIN_ID)

        self.assertEqual(str(ctx.exception), "Rota complementar já está inativa.")
        self.assertEqual(self.repository.chamadas, [("buscar", 2)])

    def test_inativar_ordem_executor_existencia_estado_agendamento_escrita(self):
        with self.assertRaises(RotaComplementarValidationError):
            self.use_case.inativar(1, 0)
        self.assertEqual(self.repository.chamadas, [])
        with self.assertRaises(RotaComplementarNaoEncontradaError):
            self.use_case.inativar(99, ADMIN_ID)
        self.assertEqual(self.repository.chamadas, [("buscar", 99)])

    def test_inativar_permitido_independentemente_da_rota_principal(self):
        self.repository.principal_inativa_ids.add(1)

        self.use_case.inativar(1, ADMIN_ID)

        self.assertNotIn("principal_inativa", self.nomes())
        self.assertEqual(self.escritas(), ["inativar"])

    def test_reativar_com_principal_ativa(self):
        resultado = self.use_case.reativar(2, ADMIN_ID)

        self.assertEqual(resultado, {"id": 2})
        self.assertEqual(
            self.repository.chamadas,
            [("buscar", 2), ("principal_inativa", 2), ("reativar", 2, ADMIN_ID)],
        )

    def test_reativar_com_principal_inativa_bloqueia_sem_escrever(self):
        self.repository.principal_inativa_ids.add(2)

        with self.assertRaises(RotaComplementarComPrincipalInativaError) as ctx:
            self.use_case.reativar(2, ADMIN_ID)

        self.assertEqual(
            str(ctx.exception),
            "Não é possível reativar esta rota complementar pois a rota principal vinculada está inativa.",
        )
        self.assertEqual(self.escritas(), [])

    def test_reativar_ja_ativa_e_estado_inalterado(self):
        with self.assertRaises(RotaComplementarStatusInalteradoError) as ctx:
            self.use_case.reativar(1, ADMIN_ID)

        self.assertEqual(str(ctx.exception), "Rota complementar já está ativa.")
        self.assertEqual(self.repository.chamadas, [("buscar", 1)])

    def test_reativar_valida_executor_e_existencia(self):
        with self.assertRaises(RotaComplementarValidationError):
            self.use_case.reativar(2, 0)
        with self.assertRaises(RotaComplementarNaoEncontradaError):
            self.use_case.reativar(99, ADMIN_ID)
        self.assertEqual(self.escritas(), [])

    def test_rota_removida_entre_a_consulta_e_a_escrita_vira_nao_encontrada(self):
        self.repository.devolve_none.add("inativar")
        with self.assertRaises(RotaComplementarNaoEncontradaError):
            self.use_case.inativar(1, ADMIN_ID)

        self.repository.devolve_none.add("reativar")
        with self.assertRaises(RotaComplementarNaoEncontradaError):
            self.use_case.reativar(2, ADMIN_ID)

    def test_erro_do_repository_na_reativacao_e_propagado(self):
        self.repository.erro_na_escrita = RotaComplementarComPrincipalInativaError("corrida")

        with self.assertRaises(RotaComplementarComPrincipalInativaError):
            self.use_case.reativar(2, ADMIN_ID)


class LeituraTest(CasoDeUsoTestBase):
    def test_listagem_padrao_so_ativas(self):
        resultado = self.use_case.listar()

        self.assertEqual([r["id"] for r in resultado], [1])
        self.assertEqual(self.repository.chamadas, [("listar", True, None, None)])

    def test_incluir_inativos_remove_o_filtro_de_status(self):
        resultado = self.use_case.listar(incluir_inativos=True)

        self.assertEqual({r["id"] for r in resultado}, {1, 2})
        self.assertEqual(self.repository.chamadas, [("listar", None, None, None)])

    def test_nome_e_normalizado_e_vazio_vira_sem_filtro(self):
        self.use_case.listar(nome="  van ")
        self.use_case.listar(nome="   ")

        self.assertEqual(
            self.repository.chamadas,
            [("listar", True, "van", None), ("listar", True, None, None)],
        )

    def test_nome_que_nao_e_texto_e_recusado(self):
        with self.assertRaises(RotaComplementarValidationError) as ctx:
            self.use_case.listar(nome=10)
        self.assertEqual(ctx.exception.field, "nome")

    def test_nome_com_nul_e_recusado_sem_consultar_o_repository(self):
        with self.assertRaises(RotaComplementarValidationError) as ctx:
            self.use_case.listar(nome="a\x00b")

        self.assertEqual(ctx.exception.field, "nome")
        self.assertEqual(str(ctx.exception), "Nome deve ser um texto válido.")
        self.assertEqual(self.repository.chamadas, [])

    def test_filtro_por_rota_principal_valido_e_invalido(self):
        self.use_case.listar(rota_principal_id=2)
        self.assertEqual(self.repository.chamadas, [("listar", True, None, 2)])
        for invalido in (0, -1, True, "1"):
            with self.subTest(id=invalido):
                with self.assertRaises(RotaComplementarValidationError) as ctx:
                    self.use_case.listar(rota_principal_id=invalido)
                self.assertEqual(ctx.exception.field, "rota_principal_id")

    def test_opcoes_delegam_ao_repository(self):
        self.assertEqual(self.use_case.listar_opcoes(), {"rotas_principais": []})

    def test_buscar_existente_inexistente_e_id_invalido(self):
        self.assertEqual(self.use_case.buscar(1)["id"], 1)
        with self.assertRaises(RotaComplementarNaoEncontradaError) as ctx:
            self.use_case.buscar(99)
        self.assertEqual(str(ctx.exception), "Rota complementar não encontrada.")
        with self.assertRaises(RotaComplementarValidationError):
            self.use_case.buscar(0)
