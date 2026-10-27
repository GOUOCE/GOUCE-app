"""Testes unitários puros da camada HTTP de rotas: use case simulado, sem banco.

Verifica o mapeamento de cada exceção para status/código/mensagem, as mensagens
de sucesso e as mensagens de validação por campo.
"""

import unittest
from datetime import time
from unittest.mock import MagicMock

from tests.rota_principal_support import ADMIN_ID, asgi_request, dados_rota

from fastapi import FastAPI

from src.modulos.rotas.application.use_cases.gerenciar_rotas_principais_use_case import (
    MENSAGEM_ROTA_COM_AGENDAMENTOS,
    MENSAGEM_ROTA_COM_COMPLEMENTARES_ATIVAS,
    MENSAGEM_ROTA_COM_VINCULO_INATIVO,
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
from src.modulos.rotas.interface.http import rota_principal_routes as rotas
from src.shared.auth.dependencies import get_current_user
from src.shared.enums.cargo_enum import CargoEnum

MENSAGEM_SUCESSO = "Operação realizada com sucesso"
ROTA = {
    "id": 1, "nome": "Rota A", "horario_saida": "06:30", "horario_retorno": "17:30",
    "ativo": True, "bairros": [], "faculdades_ida": [], "faculdades_volta": [],
}


class FakeUseCase:
    def __init__(self):
        self.chamadas = []
        self.erro = None

    def _executar(self, nome, *argumentos, retorno=ROTA):
        self.chamadas.append((nome, *argumentos))
        if self.erro is not None:
            raise self.erro
        return retorno

    def listar(self, incluir_inativos=False, nome=None):
        return self._executar("listar", incluir_inativos, nome, retorno=[ROTA])

    def listar_opcoes(self):
        return self._executar("opcoes", retorno={"bairros": [], "faculdades": []})

    def buscar(self, rota_id):
        return self._executar("buscar", rota_id)

    def criar(self, *argumentos):
        return self._executar("criar", *argumentos)

    def atualizar(self, rota_id, campos, usuario_executor_id):
        return self._executar("atualizar", rota_id, campos, usuario_executor_id)

    def inativar(self, rota_id, usuario_executor_id):
        return self._executar("inativar", rota_id, usuario_executor_id)

    def reativar(self, rota_id, usuario_executor_id):
        return self._executar("reativar", rota_id, usuario_executor_id)


class RotasHttpUnitBase(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.use_case = FakeUseCase()
        self.app = FastAPI()
        self.app.include_router(rotas.router)
        self.app.dependency_overrides[rotas.get_use_case] = lambda: self.use_case
        self.app.dependency_overrides[get_current_user] = lambda: {
            "sub": str(ADMIN_ID), "type": "access", "role": CargoEnum.ADMINISTRADOR.value,
            "current_role": CargoEnum.ADMINISTRADOR.value,
            "current_roles": [CargoEnum.ADMINISTRADOR.value], "current_user_id": ADMIN_ID,
        }

    async def chamar(self, metodo, caminho, corpo=None):
        return await asgi_request(self.app, metodo, caminho, corpo)


class SucessoTest(RotasHttpUnitBase):
    async def test_mensagem_e_status_de_cada_operacao_de_escrita(self):
        casos = [
            ("POST", "/rotas-principais", dados_rota(), 201),
            ("PATCH", "/rotas-principais/1", {"nome": "Nova"}, 200),
            ("PATCH", "/rotas-principais/1/inativar", None, 200),
            ("PATCH", "/rotas-principais/1/reativar", None, 200),
        ]
        for metodo, caminho, corpo, esperado in casos:
            with self.subTest(operacao=f"{metodo} {caminho}"):
                status, resposta = await self.chamar(metodo, caminho, corpo)
                self.assertEqual(status, esperado)
                self.assertEqual(resposta["message"], MENSAGEM_SUCESSO)
                self.assertIs(resposta["success"], True)
                self.assertEqual(resposta["data"], ROTA)

    async def test_criar_repassa_dados_convertidos_e_o_usuario_autenticado(self):
        await self.chamar("POST", "/rotas-principais", dados_rota(nome="  Rota X ", bairros_ids=[2, 1]))

        self.assertEqual(
            self.use_case.chamadas,
            [("criar", "Rota X", time(6, 30), time(17, 30), [2, 1], [1], [1], ADMIN_ID)],
        )

    async def test_patch_repassa_somente_os_campos_enviados(self):
        await self.chamar("PATCH", "/rotas-principais/5", {"horario_saida": "06:00", "bairros_ids": [3]})
        await self.chamar("PATCH", "/rotas-principais/5", {"nome": None})

        self.assertEqual(
            self.use_case.chamadas,
            [("atualizar", 5, {"horario_saida": time(6, 0), "bairros_ids": [3]}, ADMIN_ID),
             ("atualizar", 5, {"nome": None}, ADMIN_ID)],
        )

    async def test_inativar_e_reativar_repassam_o_id_e_o_usuario(self):
        await self.chamar("PATCH", "/rotas-principais/8/inativar")
        await self.chamar("PATCH", "/rotas-principais/8/reativar")

        self.assertEqual(self.use_case.chamadas, [("inativar", 8, ADMIN_ID), ("reativar", 8, ADMIN_ID)])

    async def test_listagem_repassa_filtros_com_padrao_somente_ativas(self):
        await self.chamar("GET", "/rotas-principais")
        await self.chamar("GET", "/rotas-principais?incluir_inativos=true&nome=cen")

        self.assertEqual(self.use_case.chamadas, [("listar", False, None), ("listar", True, "cen")])

    async def test_opcoes_nao_e_confundida_com_id_de_rota(self):
        status, corpo = await self.chamar("GET", "/rotas-principais/opcoes")

        self.assertEqual((status, corpo), (200, {"bairros": [], "faculdades": []}))
        self.assertEqual(self.use_case.chamadas, [("opcoes",)])

    async def test_consulta_por_id_devolve_a_rota(self):
        status, corpo = await self.chamar("GET", "/rotas-principais/1")

        self.assertEqual((status, corpo), (200, ROTA))


class MapeamentoDeErrosTest(RotasHttpUnitBase):
    async def assert_erro(self, metodo, caminho, corpo, erro, status, codigo, mensagem=None, detalhes=None):
        self.use_case.erro = erro
        status_obtido, resposta = await self.chamar(metodo, caminho, corpo)
        self.assertEqual(status_obtido, status, (metodo, caminho, resposta))
        self.assertIs(resposta["success"], False)
        self.assertEqual(resposta["error"]["code"], codigo)
        if mensagem is not None:
            self.assertEqual(resposta["error"]["message"], mensagem)
        if detalhes is not None:
            self.assertEqual(resposta["error"]["details"], detalhes)

    async def test_rota_nao_encontrada_vira_404_em_todas_as_operacoes(self):
        operacoes = [
            ("GET", "/rotas-principais/9", None),
            ("PATCH", "/rotas-principais/9", {"nome": "X"}),
            ("PATCH", "/rotas-principais/9/inativar", None),
            ("PATCH", "/rotas-principais/9/reativar", None),
        ]
        for metodo, caminho, corpo in operacoes:
            with self.subTest(operacao=f"{metodo} {caminho}"):
                await self.assert_erro(
                    metodo, caminho, corpo, RotaPrincipalNaoEncontradaError("x"),
                    404, "RESOURCE_NOT_FOUND", "Rota não encontrada.",
                )

    async def test_nome_em_uso_vira_409_na_criacao_e_na_edicao(self):
        for metodo, caminho, corpo in (
            ("POST", "/rotas-principais", dados_rota()),
            ("PATCH", "/rotas-principais/1", {"nome": "X"}),
        ):
            with self.subTest(operacao=f"{metodo} {caminho}"):
                await self.assert_erro(
                    metodo, caminho, corpo, RotaPrincipalNomeEmUsoError("qualquer"),
                    409, "CONFLICT", "Já existe uma rota com este nome.",
                )

    async def test_agendamentos_pendentes_vira_409_com_a_mensagem_exata(self):
        await self.assert_erro(
            "PATCH", "/rotas-principais/1/inativar", None,
            RotaComAgendamentosPendentesError(MENSAGEM_ROTA_COM_AGENDAMENTOS),
            409, "CONFLICT",
            "Esta rota possui agendamentos pendentes e não pode ser inativada no momento.",
        )

    async def test_complementares_ativas_vira_409_com_a_mensagem_exata_na_inativacao(self):
        await self.assert_erro(
            "PATCH", "/rotas-principais/1/inativar", None,
            RotaComComplementaresAtivasError(MENSAGEM_ROTA_COM_COMPLEMENTARES_ATIVAS),
            409, "CONFLICT",
            "Esta rota possui rotas complementares ativas e não pode ser inativada. "
            "Inative ou reassocie as complementares antes.",
        )

    async def test_vinculo_inativo_vira_409_com_a_mensagem_exata_na_reativacao(self):
        await self.assert_erro(
            "PATCH", "/rotas-principais/1/reativar", None,
            RotaComVinculoInativoError(MENSAGEM_ROTA_COM_VINCULO_INATIVO),
            409, "CONFLICT",
            "Esta rota possui bairro ou faculdade inativo e não pode ser reativada. "
            "Atualize os vínculos antes.",
        )

    async def test_estado_repetido_vira_409_com_a_mensagem_do_use_case(self):
        await self.assert_erro(
            "PATCH", "/rotas-principais/1/inativar", None,
            RotaPrincipalStatusInalteradoError("Rota já está inativa."),
            409, "CONFLICT", "Rota já está inativa.",
        )
        await self.assert_erro(
            "PATCH", "/rotas-principais/1/reativar", None,
            RotaPrincipalStatusInalteradoError("Rota já está ativa."),
            409, "CONFLICT", "Rota já está ativa.",
        )

    async def test_validacao_do_use_case_e_referencia_invalida_viram_422_por_campo(self):
        operacoes = [
            ("POST", "/rotas-principais", dados_rota()),
            ("PATCH", "/rotas-principais/1", {"nome": "X"}),
            ("GET", "/rotas-principais?nome=x", None),
            ("GET", "/rotas-principais/1", None),
            ("PATCH", "/rotas-principais/1/inativar", None),
            ("PATCH", "/rotas-principais/1/reativar", None),
        ]
        for metodo, caminho, corpo in operacoes:
            with self.subTest(operacao=f"{metodo} {caminho}"):
                await self.assert_erro(
                    metodo, caminho, corpo, RotaPrincipalValidationError("rota_id", "ID inválido."),
                    422, "REQUEST_VALIDATION_ERROR", "Requisição inválida",
                    [{"field": "rota_id", "message": "ID inválido."}],
                )
        for metodo, caminho, corpo in operacoes[:2]:
            with self.subTest(referencia=f"{metodo} {caminho}"):
                await self.assert_erro(
                    metodo, caminho, corpo,
                    RotaReferenciaInvalidaError("faculdades_ida_ids", "Faculdade inativa ou inexistente (ids: 4)."),
                    422, "REQUEST_VALIDATION_ERROR", "Requisição inválida",
                    [{"field": "faculdades_ida_ids", "message": "Faculdade inativa ou inexistente (ids: 4)."}],
                )


class MensagensDeValidacaoDoCorpoTest(RotasHttpUnitBase):
    async def mensagens(self, corpo, metodo="POST", caminho="/rotas-principais"):
        status, resposta = await self.chamar(metodo, caminho, corpo)
        self.assertEqual(status, 422, resposta)
        self.assertEqual(self.use_case.chamadas, [])
        self.assertEqual(resposta["error"]["code"], "REQUEST_VALIDATION_ERROR")
        self.assertEqual(resposta["error"]["message"], "Requisição inválida")
        return {d["field"]: d["message"] for d in resposta["error"]["details"]}

    async def test_nome_longo_demais_e_de_tipo_errado(self):
        self.assertEqual(
            await self.mensagens(dados_rota(nome="x" * 151)),
            {"nome": "Nome da rota deve ter no máximo 150 caracteres."},
        )
        self.assertEqual(
            await self.mensagens(dados_rota(nome=123)),
            {"nome": "Nome da rota deve ser um texto válido."},
        )

    async def test_horarios_ausentes_e_em_formato_invalido(self):
        corpo = dados_rota(horario_saida="25:00")
        del corpo["horario_retorno"]
        self.assertEqual(
            await self.mensagens(corpo),
            {"horario_saida": "Horário deve estar no formato HH:MM.", "horario_retorno": "Horário de retorno é obrigatório."},
        )

    async def test_lista_de_tipo_errado_ou_com_itens_invalidos_gera_uma_mensagem_por_campo(self):
        mensagens = await self.mensagens(dados_rota(bairros_ids="1", faculdades_ida_ids=[True, 0, "a"]))

        self.assertEqual(
            mensagens,
            {
                "bairros_ids": "Informe IDs válidos (números inteiros positivos).",
                "faculdades_ida_ids": "Informe IDs válidos (números inteiros positivos).",
            },
        )

    async def test_listas_nulas_ou_ausentes_pedem_ao_menos_um_item(self):
        corpo = dados_rota(bairros_ids=None)
        del corpo["faculdades_volta_ids"]
        self.assertEqual(
            await self.mensagens(corpo),
            {"bairros_ids": "Vincule ao menos um bairro.", "faculdades_volta_ids": "Informe ao menos uma faculdade na volta."},
        )

    async def test_nul_no_nome_vira_texto_invalido_no_post_e_no_patch(self):
        mensagem = {"nome": "Nome da rota deve ser um texto válido."}

        self.assertEqual(await self.mensagens(dados_rota(nome="a\x00b")), mensagem)
        self.assertEqual(
            await self.mensagens({"nome": "a\x00b"}, "PATCH", "/rotas-principais/1"), mensagem
        )

    async def test_campo_extra_e_mensagem_unica(self):
        self.assertEqual(await self.mensagens(dados_rota(ativo=False)), {"ativo": "Campo não permitido."})

    async def test_patch_valida_o_corpo_e_o_id_da_url(self):
        self.assertEqual(
            await self.mensagens({"nome": "x" * 151}, "PATCH", "/rotas-principais/1"),
            {"nome": "Nome da rota deve ter no máximo 150 caracteres."},
        )
        self.assertEqual(
            await self.mensagens({"nome": "ok"}, "PATCH", "/rotas-principais/abc"),
            {"rota_id": "Informe um número válido."},
        )


class FiltroDeNomeComUseCaseRealTest(RotasHttpUnitBase):
    """Listagem com o caso de uso real e o repository simulado (sem banco)."""

    def setUp(self):
        super().setUp()
        self.repository = MagicMock()
        self.repository.listar.return_value = []
        self.app.dependency_overrides.pop(rotas.get_use_case)
        self.app.dependency_overrides[rotas.get_repository] = lambda: self.repository

    async def test_nome_com_nul_vira_422_no_campo_nome_sem_consultar_o_repository(self):
        status, resposta = await self.chamar("GET", "/rotas-principais?nome=a%00b")

        self.assertEqual(status, 422, resposta)
        self.assertEqual(resposta["error"]["code"], "REQUEST_VALIDATION_ERROR")
        self.assertEqual(
            resposta["error"]["details"],
            [{"field": "nome", "message": "Nome deve ser um texto válido."}],
        )
        self.repository.listar.assert_not_called()

    async def test_nome_comum_continua_chegando_ao_repository(self):
        status, resposta = await self.chamar("GET", "/rotas-principais?nome=rota")

        self.assertEqual((status, resposta), (200, []))
        self.repository.listar.assert_called_once_with(ativo=True, nome="rota")


class ProvedoresDeDependenciaTest(unittest.TestCase):
    def test_get_repository_e_get_use_case_encadeiam_a_sessao(self):
        from unittest.mock import MagicMock

        session = MagicMock()

        repository = rotas.get_repository(session)
        use_case = rotas.get_use_case(repository)

        self.assertIs(repository.session, session)
        self.assertIs(use_case.repository, repository)
        self.assertFalse(repository.possui_agendamentos_futuros(1))  # falhar aberto por padrão


class MensagemPorCampoFuncaoTest(unittest.TestCase):
    def test_tipos_de_erro_sem_mensagem_propria_usam_a_padrao(self):
        self.assertIsNone(rotas._mensagem_campo_rota({"type": "qualquer"}, "nome"))
        self.assertIsNone(rotas._mensagem_campo_rota({"type": "missing"}, "rota_id"))

    def test_mensagens_de_texto_por_tipo_de_erro(self):
        self.assertEqual(
            rotas._mensagem_campo_rota({"type": "string_too_long", "ctx": {"max_length": 150}}, "nome"),
            "Nome da rota deve ter no máximo 150 caracteres.",
        )
        self.assertEqual(
            rotas._mensagem_campo_rota({"type": "string_type", "input": 1}, "nome"),
            "Nome da rota deve ser um texto válido.",
        )
        self.assertEqual(
            rotas._mensagem_campo_rota({"type": "string_type", "input": None}, "nome"),
            "Nome da rota é obrigatório.",
        )


if __name__ == "__main__":
    unittest.main()
