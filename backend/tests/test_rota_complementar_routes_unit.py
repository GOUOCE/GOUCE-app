"""Testes unitários puros da camada HTTP de rotas complementares: use case simulado, sem banco.

Verifica o mapeamento de cada exceção para status/código/mensagem, as mensagens
de sucesso e as mensagens de validação por campo.
"""

import unittest
from datetime import time
from unittest.mock import MagicMock

from tests.rota_complementar_support import ADMIN_ID, asgi_request, dados_complementar

from fastapi import FastAPI

from src.modulos.rotas.application.use_cases.gerenciar_rotas_complementares_use_case import (
    MENSAGEM_ROTA_COM_AGENDAMENTOS,
    RotaComplementarComAgendamentosPendentesError,
    RotaComplementarNaoEncontradaError,
    RotaComplementarStatusInalteradoError,
    RotaComplementarValidationError,
)
from src.modulos.rotas.infrastructure.repositories.rota_complementar_repository import (
    MENSAGEM_PRINCIPAL_INATIVA_REATIVACAO,
    RotaComplementarComPrincipalInativaError,
    RotaComplementarNomeEmUsoError,
    RotaComplementarReferenciaInvalidaError,
)
from src.modulos.rotas.interface.http import rota_complementar_routes as rotas
from src.shared.auth.dependencies import get_current_user
from src.shared.enums.cargo_enum import CargoEnum

MENSAGEM_SUCESSO = "Operação realizada com sucesso"
ROTA = {
    "id": 1, "nome": "Van 2", "horario_saida": "06:00", "horario_retorno": "17:40",
    "ponto_conexao": "Trevo", "ativo": True,
    "rota_principal": {"id": 1, "nome": "Rota Centro - UFC", "ativo": True},
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

    def listar(self, incluir_inativos=False, nome=None, rota_principal_id=None):
        return self._executar("listar", incluir_inativos, nome, rota_principal_id, retorno=[ROTA])

    def listar_opcoes(self):
        return self._executar("opcoes", retorno={"rotas_principais": []})

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
            ("POST", "/rotas-complementares", dados_complementar(), 201),
            ("PATCH", "/rotas-complementares/1", {"nome": "Nova"}, 200),
            ("PATCH", "/rotas-complementares/1/inativar", None, 200),
            ("PATCH", "/rotas-complementares/1/reativar", None, 200),
        ]
        for metodo, caminho, corpo, esperado in casos:
            with self.subTest(operacao=f"{metodo} {caminho}"):
                status, resposta = await self.chamar(metodo, caminho, corpo)
                self.assertEqual(status, esperado)
                self.assertEqual(resposta["message"], MENSAGEM_SUCESSO)
                self.assertIs(resposta["success"], True)
                self.assertEqual(resposta["data"], ROTA)

    async def test_criar_repassa_dados_convertidos_e_o_usuario_autenticado(self):
        await self.chamar(
            "POST", "/rotas-complementares",
            dados_complementar(nome="  Van X ", ponto_conexao=" Posto ", horario_saida="05:45",
                               horario_retorno="18:10", rota_principal_id=2),
        )

        self.assertEqual(
            self.use_case.chamadas, [("criar", "Van X", time(5, 45), time(18, 10), "Posto", 2, ADMIN_ID)]
        )

    async def test_patch_repassa_somente_os_campos_enviados(self):
        await self.chamar("PATCH", "/rotas-complementares/5", {"horario_saida": "06:00", "rota_principal_id": 3})
        await self.chamar("PATCH", "/rotas-complementares/5", {"nome": None})
        await self.chamar("PATCH", "/rotas-complementares/5", {"horario_retorno": "17:45"})

        self.assertEqual(
            self.use_case.chamadas,
            [("atualizar", 5, {"horario_saida": time(6, 0), "rota_principal_id": 3}, ADMIN_ID),
             ("atualizar", 5, {"nome": None}, ADMIN_ID),
             ("atualizar", 5, {"horario_retorno": time(17, 45)}, ADMIN_ID)],
        )

    async def test_inativar_e_reativar_repassam_o_id_e_o_usuario(self):
        await self.chamar("PATCH", "/rotas-complementares/8/inativar")
        await self.chamar("PATCH", "/rotas-complementares/8/reativar")

        self.assertEqual(self.use_case.chamadas, [("inativar", 8, ADMIN_ID), ("reativar", 8, ADMIN_ID)])

    async def test_listagem_repassa_filtros_com_padrao_somente_ativas(self):
        await self.chamar("GET", "/rotas-complementares")
        await self.chamar("GET", "/rotas-complementares?incluir_inativos=true&nome=van&rota_principal_id=2")

        self.assertEqual(
            self.use_case.chamadas, [("listar", False, None, None), ("listar", True, "van", 2)]
        )

    async def test_opcoes_nao_e_confundida_com_id_de_rota(self):
        status, corpo = await self.chamar("GET", "/rotas-complementares/opcoes")

        self.assertEqual((status, corpo), (200, {"rotas_principais": []}))
        self.assertEqual(self.use_case.chamadas, [("opcoes",)])

    async def test_consulta_por_id_devolve_a_rota(self):
        status, corpo = await self.chamar("GET", "/rotas-complementares/1")

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
            ("GET", "/rotas-complementares/9", None),
            ("PATCH", "/rotas-complementares/9", {"nome": "X"}),
            ("PATCH", "/rotas-complementares/9/inativar", None),
            ("PATCH", "/rotas-complementares/9/reativar", None),
        ]
        for metodo, caminho, corpo in operacoes:
            with self.subTest(operacao=f"{metodo} {caminho}"):
                await self.assert_erro(
                    metodo, caminho, corpo, RotaComplementarNaoEncontradaError("x"),
                    404, "RESOURCE_NOT_FOUND", "Rota complementar não encontrada.",
                )

    async def test_nome_em_uso_vira_409_na_criacao_e_na_edicao(self):
        for metodo, caminho, corpo in (
            ("POST", "/rotas-complementares", dados_complementar()),
            ("PATCH", "/rotas-complementares/1", {"nome": "X"}),
        ):
            with self.subTest(operacao=f"{metodo} {caminho}"):
                await self.assert_erro(
                    metodo, caminho, corpo, RotaComplementarNomeEmUsoError("qualquer"),
                    409, "CONFLICT", "Já existe uma rota com este nome.",
                )

    async def test_agendamentos_pendentes_vira_409_com_a_mensagem_exata(self):
        await self.assert_erro(
            "PATCH", "/rotas-complementares/1/inativar", None,
            RotaComplementarComAgendamentosPendentesError(MENSAGEM_ROTA_COM_AGENDAMENTOS),
            409, "CONFLICT",
            "Esta rota possui agendamentos pendentes e não pode ser inativada no momento.",
        )

    async def test_principal_inativa_vira_409_com_a_mensagem_exata_na_reativacao(self):
        await self.assert_erro(
            "PATCH", "/rotas-complementares/1/reativar", None,
            RotaComplementarComPrincipalInativaError(MENSAGEM_PRINCIPAL_INATIVA_REATIVACAO),
            409, "CONFLICT",
            "Não é possível reativar esta rota complementar pois a rota principal vinculada está inativa.",
        )

    async def test_estado_inalterado_vira_409(self):
        await self.assert_erro(
            "PATCH", "/rotas-complementares/1/inativar", None,
            RotaComplementarStatusInalteradoError("Rota complementar já está inativa."),
            409, "CONFLICT", "Rota complementar já está inativa.",
        )
        await self.assert_erro(
            "PATCH", "/rotas-complementares/1/reativar", None,
            RotaComplementarStatusInalteradoError("Rota complementar já está ativa."),
            409, "CONFLICT", "Rota complementar já está ativa.",
        )

    async def test_erro_de_validacao_do_use_case_vira_422_por_campo(self):
        operacoes = [
            ("POST", "/rotas-complementares", dados_complementar()),
            ("PATCH", "/rotas-complementares/1", {"nome": "X"}),
            ("GET", "/rotas-complementares?nome=x", None),
        ]
        for metodo, caminho, corpo in operacoes:
            with self.subTest(operacao=f"{metodo} {caminho}"):
                await self.assert_erro(
                    metodo, caminho, corpo,
                    RotaComplementarValidationError("horario_saida", "Horário de saída é obrigatório."),
                    422, "REQUEST_VALIDATION_ERROR", "Requisição inválida",
                    [{"field": "horario_saida", "message": "Horário de saída é obrigatório."}],
                )

    async def test_principal_invalida_vira_422_no_campo_rota_principal_id(self):
        for metodo, caminho, corpo in (
            ("POST", "/rotas-complementares", dados_complementar()),
            ("PATCH", "/rotas-complementares/1", {"rota_principal_id": 3}),
        ):
            with self.subTest(operacao=f"{metodo} {caminho}"):
                await self.assert_erro(
                    metodo, caminho, corpo,
                    RotaComplementarReferenciaInvalidaError(
                        "rota_principal_id", "Rota principal inativa ou inexistente."
                    ),
                    422, "REQUEST_VALIDATION_ERROR", "Requisição inválida",
                    [{"field": "rota_principal_id", "message": "Rota principal inativa ou inexistente."}],
                )

    async def test_http_exception_de_outro_status_usa_codigo_generico(self):
        from fastapi import HTTPException

        for status, codigo in ((400, "VALIDATION_ERROR"), (418, "REQUEST_ERROR")):
            with self.subTest(status=status):
                await self.assert_erro(
                    "GET", "/rotas-complementares/1", None,
                    HTTPException(status_code=status, detail=""), status, codigo, "Requisição inválida",
                )


class MensagensDeValidacaoDoCorpoTest(RotasHttpUnitBase):
    async def mensagens(self, corpo, metodo="POST", caminho="/rotas-complementares"):
        status, resposta = await self.chamar(metodo, caminho, corpo)
        self.assertEqual(status, 422, resposta)
        self.assertEqual(self.use_case.chamadas, [])
        self.assertEqual(resposta["error"]["code"], "REQUEST_VALIDATION_ERROR")
        self.assertEqual(resposta["error"]["message"], "Requisição inválida")
        return {d["field"]: d["message"] for d in resposta["error"]["details"]}

    async def test_campos_vazios_ou_ausentes_na_criacao(self):
        self.assertEqual(
            await self.mensagens({}),
            {
                "nome": "Nome da rota complementar é obrigatório.",
                "horario_saida": "Horário de saída é obrigatório.",
                "horario_retorno": "Horário de retorno é obrigatório.",
                "ponto_conexao": "Ponto de conexão é obrigatório.",
                "rota_principal_id": "Rota principal vinculada é obrigatória.",
            },
        )
        self.assertEqual(
            await self.mensagens(dados_complementar(nome="   ", ponto_conexao="", horario_saida=None,
                                                    horario_retorno=None, rota_principal_id=None)),
            {
                "nome": "Nome da rota complementar é obrigatório.",
                "horario_saida": "Horário de saída é obrigatório.",
                "horario_retorno": "Horário de retorno é obrigatório.",
                "ponto_conexao": "Ponto de conexão é obrigatório.",
                "rota_principal_id": "Rota principal vinculada é obrigatória.",
            },
        )

    async def test_nulos_em_nome_e_ponto(self):
        self.assertEqual(
            await self.mensagens(dados_complementar(nome=None, ponto_conexao=None)),
            {
                "nome": "Nome da rota complementar é obrigatório.",
                "ponto_conexao": "Ponto de conexão é obrigatório.",
            },
        )

    async def test_textos_longos_demais_e_de_tipo_errado(self):
        self.assertEqual(
            await self.mensagens(dados_complementar(nome="x" * 151, ponto_conexao="y" * 151)),
            {
                "nome": "Nome da rota complementar deve ter no máximo 150 caracteres.",
                "ponto_conexao": "Ponto de conexão deve ter no máximo 150 caracteres.",
            },
        )
        self.assertEqual(
            await self.mensagens(dados_complementar(nome=123, ponto_conexao=[1])),
            {
                "nome": "Nome da rota complementar deve ser um texto válido.",
                "ponto_conexao": "Ponto de conexão deve ser um texto válido.",
            },
        )

    async def test_nul_em_nome_e_ponto_vira_texto_invalido_no_post_e_no_patch(self):
        esperado = {
            "nome": "Nome da rota complementar deve ser um texto válido.",
            "ponto_conexao": "Ponto de conexão deve ser um texto válido.",
        }
        for campo, mensagem in esperado.items():
            with self.subTest(operacao="POST", campo=campo):
                self.assertEqual(
                    await self.mensagens(dados_complementar(**{campo: "a\x00b"})), {campo: mensagem}
                )
            with self.subTest(operacao="PATCH", campo=campo):
                self.assertEqual(
                    await self.mensagens({campo: "a\x00b"}, "PATCH", "/rotas-complementares/1"),
                    {campo: mensagem},
                )

    async def test_horario_em_formato_invalido(self):
        for campo in ("horario_saida", "horario_retorno"):
            for invalido in ("24:00", "6:30", "06:60", "", "０６:３０", 630):
                with self.subTest(campo=campo, horario=invalido):
                    self.assertEqual(
                        await self.mensagens(dados_complementar(**{campo: invalido})),
                        {campo: "Horário deve estar no formato HH:MM."},
                    )

    async def test_rota_principal_id_invalido(self):
        for invalido in (0, -1, True, "1", "abc", 1.5):
            with self.subTest(id=invalido):
                self.assertEqual(
                    await self.mensagens(dados_complementar(rota_principal_id=invalido)),
                    {"rota_principal_id": "Informe um ID de rota principal válido."},
                )

    async def test_campo_extra_e_mensagem_unica(self):
        self.assertEqual(
            await self.mensagens(dados_complementar(id=9, ativo=False)),
            {"id": "Campo não permitido.", "ativo": "Campo não permitido."},
        )

    async def test_patch_valida_o_corpo_e_o_id_da_url(self):
        self.assertEqual(
            await self.mensagens({"ponto_conexao": ""}, "PATCH", "/rotas-complementares/1"),
            {"ponto_conexao": "Ponto de conexão é obrigatório."},
        )
        self.assertEqual(
            await self.mensagens({"nome": "ok"}, "PATCH", "/rotas-complementares/abc"),
            {"rota_id": "Informe um número válido."},
        )

    async def test_filtro_de_listagem_invalido(self):
        self.assertEqual(
            await self.mensagens(None, "GET", "/rotas-complementares?rota_principal_id=abc"),
            {"rota_principal_id": "Informe um ID de rota principal válido."},
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
        status, resposta = await self.chamar("GET", "/rotas-complementares?nome=a%00b")

        self.assertEqual(status, 422, resposta)
        self.assertEqual(resposta["error"]["code"], "REQUEST_VALIDATION_ERROR")
        self.assertEqual(
            resposta["error"]["details"],
            [{"field": "nome", "message": "Nome deve ser um texto válido."}],
        )
        self.repository.listar.assert_not_called()

    async def test_nome_comum_continua_chegando_ao_repository(self):
        status, resposta = await self.chamar("GET", "/rotas-complementares?nome=van")

        self.assertEqual((status, resposta), (200, []))
        self.repository.listar.assert_called_once_with(ativo=True, nome="van", rota_principal_id=None)


class ProvedoresDeDependenciaTest(unittest.TestCase):
    def test_get_repository_e_get_use_case_encadeiam_a_sessao(self):
        session = MagicMock()

        repository = rotas.get_repository(session)
        use_case = rotas.get_use_case(repository)

        self.assertIs(repository.session, session)
        self.assertIs(use_case.repository, repository)
        self.assertFalse(repository.possui_agendamentos_futuros(1))  # falhar aberto por padrão


class MensagemPorCampoFuncaoTest(unittest.TestCase):
    def test_tipos_de_erro_sem_mensagem_propria_usam_a_padrao(self):
        self.assertIsNone(rotas._mensagem_campo_complementar({"type": "qualquer"}, "nome"))
        self.assertIsNone(rotas._mensagem_campo_complementar({"type": "missing"}, "rota_id"))
        self.assertIsNone(rotas._mensagem_campo_complementar({"type": "qualquer", "input": "x"}, "ponto_conexao"))
