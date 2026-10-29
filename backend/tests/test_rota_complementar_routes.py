"""Testes HTTP (ASGI em processo) das rotas complementares sobre SQLite em memória.

Cada teste indica o cenário de ``bdd/features/epico-03/HU-012.feature`` e o
critério de aceite que cobre. Cenários exclusivamente de interface (menu,
destaque visual de campo) são cobertos pelo contrato da API: erro 422 por campo.
"""

import json
import unittest

from tests.rota_complementar_support import (
    ADMIN_ID,
    PRINCIPAL_CENTRO,
    PRINCIPAL_INATIVA,
    PRINCIPAL_INTEGRADA,
    criar_engine,
    dados_complementar,
    novo_session,
    semear_principais,
)

from fastapi import FastAPI

from src.modulos.rotas.infrastructure.repositories.rota_complementar_repository import (
    RotaComplementarRepository,
)
from src.modulos.rotas.interface.http import rota_complementar_routes, rota_principal_routes
from src.modulos.rotas.model.entities.rota_complementar import RotaComplementarORM
from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM
from src.shared.auth.dependencies import get_current_user
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.infrastructure.audit_model import LogAuditoriaORM
from src.shared.infrastructure.db import get_session

MENSAGEM_SUCESSO = "Operação realizada com sucesso"
MENSAGEM_AGENDAMENTOS = (
    "Esta rota possui agendamentos pendentes e não pode ser inativada no momento."
)
BASE = "/rotas-complementares"


def contexto(perfil: str, user_id: int = ADMIN_ID) -> dict:
    return {
        "sub": str(user_id), "type": "access", "role": perfil, "current_role": perfil,
        "current_roles": [perfil], "current_user_id": user_id,
    }


class RotaComplementarHttpTestBase(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.engine = criar_engine()
        self.session = novo_session(self.engine)
        semear_principais(self.session)

        self.app = FastAPI()
        self.app.include_router(rota_complementar_routes.router)
        self.app.include_router(rota_principal_routes.router)
        self.app.dependency_overrides[get_session] = lambda: self.session
        self.usar_perfil(CargoEnum.ADMINISTRADOR.value)

    def tearDown(self):
        self.app.dependency_overrides.clear()
        self.session.close()

    def usar_perfil(self, perfil, user_id=ADMIN_ID):
        self.app.dependency_overrides[get_current_user] = lambda: contexto(perfil, user_id)

    async def requisitar(self, metodo, caminho, corpo=None):
        caminho_puro, _, query = caminho.partition("?")
        corpo_bruto = b"" if corpo is None else json.dumps(corpo).encode("utf-8")
        mensagens = []
        enviado = False

        async def receive():
            nonlocal enviado
            if enviado:
                return {"type": "http.disconnect"}
            enviado = True
            return {"type": "http.request", "body": corpo_bruto, "more_body": False}

        async def send(mensagem):
            mensagens.append(mensagem)

        escopo = {
            "type": "http", "asgi": {"version": "3.0", "spec_version": "2.3"},
            "http_version": "1.1", "method": metodo, "scheme": "http",
            "path": caminho_puro, "raw_path": caminho_puro.encode(),
            "query_string": query.encode(),
            "headers": [
                (b"content-type", b"application/json"),
                (b"content-length", str(len(corpo_bruto)).encode()),
            ],
            "client": ("testclient", 50000), "server": ("testserver", 80),
            "root_path": "", "state": {},
        }
        await self.app(escopo, receive, send)
        inicio = next(m for m in mensagens if m["type"] == "http.response.start")
        resposta = b"".join(m.get("body", b"") for m in mensagens if m["type"] == "http.response.body")
        return inicio["status"], json.loads(resposta)

    async def criar(self, **alteracoes):
        status, corpo = await self.requisitar("POST", BASE, dados_complementar(**alteracoes))
        self.assertEqual(status, 201, corpo)
        return corpo["data"]

    def logs(self):
        self.session.expire_all()
        return self.session.query(LogAuditoriaORM).order_by(LogAuditoriaORM.id).all()

    def usar_checker(self, retorno):
        self.app.dependency_overrides[rota_complementar_routes.get_repository] = (
            lambda: RotaComplementarRepository(self.session, agendamentos_futuros_checker=lambda _: retorno)
        )

    def inativar_principal_direto(self, principal_id):
        """Inativa a principal sem passar pela API (a regra D3 impediria com complementar ativa)."""
        self.session.query(RotaPrincipalORM).filter_by(id=principal_id).update({"ativo": False})
        self.session.commit()

    def erro_por_campo(self, corpo):
        self.assertIs(corpo["success"], False)
        self.assertEqual(corpo["error"]["code"], "REQUEST_VALIDATION_ERROR")
        return {d["field"]: d["message"] for d in corpo["error"]["details"]}


class AcessoTest(RotaComplementarHttpTestBase):
    # BDD: "Somente o administrador gerencia rotas complementares (RN-006)"
    OPERACOES = [
        ("GET", BASE, None),
        ("GET", f"{BASE}/opcoes", None),
        ("GET", f"{BASE}/1", None),
        ("POST", BASE, dados_complementar()),
        ("PATCH", f"{BASE}/1", {"nome": "X"}),
        ("PATCH", f"{BASE}/1/inativar", None),
        ("PATCH", f"{BASE}/1/reativar", None),
    ]

    async def test_sem_token_retorna_401_em_todas_as_operacoes(self):
        self.app.dependency_overrides.pop(get_current_user)
        for metodo, caminho, corpo in self.OPERACOES:
            with self.subTest(operacao=f"{metodo} {caminho}"):
                status, resposta = await self.requisitar(metodo, caminho, corpo)
                self.assertEqual(status, 401)
                self.assertEqual(resposta["error"]["code"], "UNAUTHORIZED")

    async def test_bdd_api_nega_gestao_para_aluno_e_representante_com_403(self):
        for perfil in (CargoEnum.ALUNO.value, CargoEnum.REPRESENTANTE.value):
            self.usar_perfil(perfil)
            for metodo, caminho, corpo in self.OPERACOES:
                with self.subTest(perfil=perfil, operacao=f"{metodo} {caminho}"):
                    status, resposta = await self.requisitar(metodo, caminho, corpo)
                    self.assertEqual(status, 403)
                    self.assertEqual(resposta["error"]["code"], "FORBIDDEN")
        self.usar_perfil(CargoEnum.ADMINISTRADOR.value)
        _, lista = await self.requisitar("GET", f"{BASE}?incluir_inativos=true")
        self.assertEqual(lista, [])
        self.assertEqual(self.logs(), [])

    async def test_acesso_negado_em_cada_endpoint_nao_altera_uma_rota_existente(self):
        # RN-006 com uma rota real: o 401/403 de cada endpoint não pode ter efeito colateral
        # (os testes acima apontam para um id inexistente, onde um bypass só daria 404).
        rota = await self.criar()
        rota_id = rota["id"]
        endpoints = [
            ("GET", BASE, None),
            ("GET", f"{BASE}/opcoes", None),
            ("GET", f"{BASE}/{rota_id}", None),
            ("POST", BASE, dados_complementar(nome="Van Intrusa")),
            ("PATCH", f"{BASE}/{rota_id}", {"nome": "Van Alterada"}),
            ("PATCH", f"{BASE}/{rota_id}/inativar", None),
            ("PATCH", f"{BASE}/{rota_id}/reativar", None),
        ]
        negados = [
            ("sem token", None, 401, "UNAUTHORIZED"),
            (CargoEnum.ALUNO.value, CargoEnum.ALUNO.value, 403, "FORBIDDEN"),
            (CargoEnum.REPRESENTANTE.value, CargoEnum.REPRESENTANTE.value, 403, "FORBIDDEN"),
        ]
        for metodo, caminho, corpo in endpoints:
            for descricao, perfil, esperado, codigo in negados:
                with self.subTest(operacao=f"{metodo} {caminho}", acesso=descricao):
                    self.app.dependency_overrides.pop(get_current_user, None)
                    if perfil is not None:
                        self.usar_perfil(perfil)
                    status, resposta = await self.requisitar(metodo, caminho, corpo)
                    self.assertEqual(status, esperado, resposta)
                    self.assertEqual(resposta["error"]["code"], codigo)

        self.usar_perfil(CargoEnum.ADMINISTRADOR.value)
        _, lista = await self.requisitar("GET", f"{BASE}?incluir_inativos=true")
        self.assertEqual(lista, [rota])
        self.assertEqual([l.acao for l in self.logs()], ["CRIAR"])


class CadastroTest(RotaComplementarHttpTestBase):
    async def test_bdd_cadastra_rota_complementar_com_sucesso(self):
        # AC-02 / critérios 4 e 3: cria vinculada a uma principal existente
        status, corpo = await self.requisitar("POST", BASE, dados_complementar())

        self.assertEqual(status, 201)
        self.assertEqual(corpo["message"], MENSAGEM_SUCESSO)
        self.assertIs(corpo["success"], True)
        self.assertEqual(
            corpo["data"],
            {
                "id": corpo["data"]["id"], "nome": "Van 2 - Bairro Novo", "horario_saida": "06:00",
                "horario_retorno": "17:40", "ponto_conexao": "Trevo do Bairro Novo", "ativo": True,
                "rota_principal": {"id": PRINCIPAL_CENTRO, "nome": "Rota Centro - UFC", "ativo": True},
            },
        )
        _, lista = await self.requisitar("GET", BASE)
        self.assertEqual([r["nome"] for r in lista], ["Van 2 - Bairro Novo"])
        self.assertEqual(lista[0]["rota_principal"]["nome"], "Rota Centro - UFC")

    async def test_bdd_campo_obrigatorio_vazio_bloqueia_o_cadastro(self):
        # FA-003 (esquema do cenário): Nome, Horário de saída, Ponto de Conexão, Rota Principal
        casos = [
            ("nome", "", "Nome da rota complementar é obrigatório."),
            ("nome", "   ", "Nome da rota complementar é obrigatório."),
            ("horario_saida", "", "Horário deve estar no formato HH:MM."),
            ("horario_saida", None, "Horário de saída é obrigatório."),
            ("ponto_conexao", "", "Ponto de conexão é obrigatório."),
            ("ponto_conexao", "  ", "Ponto de conexão é obrigatório."),
            ("rota_principal_id", None, "Rota principal vinculada é obrigatória."),
        ]
        for campo, valor, mensagem in casos:
            with self.subTest(campo=campo, valor=valor):
                status, corpo = await self.requisitar("POST", BASE, dados_complementar(**{campo: valor}))
                self.assertEqual(status, 422)
                self.assertEqual(self.erro_por_campo(corpo)[campo], mensagem)
        for campo in ("nome", "horario_saida", "ponto_conexao", "rota_principal_id"):
            with self.subTest(ausente=campo):
                dados = dados_complementar()
                del dados[campo]
                status, corpo = await self.requisitar("POST", BASE, dados)
                self.assertEqual(status, 422)
                self.assertIn(campo, self.erro_por_campo(corpo))
        _, lista = await self.requisitar("GET", f"{BASE}?incluir_inativos=true")
        self.assertEqual(lista, [])
        self.assertEqual(self.logs(), [])

    async def test_principal_inativa_ou_inexistente_e_recusada_no_cadastro(self):
        # FA-002 / critério 5: vínculo inválido impedido também no servidor
        for principal_id in (PRINCIPAL_INATIVA, 999):
            with self.subTest(principal=principal_id):
                status, corpo = await self.requisitar(
                    "POST", BASE, dados_complementar(rota_principal_id=principal_id)
                )
                self.assertEqual(status, 422)
                self.assertEqual(
                    self.erro_por_campo(corpo), {"rota_principal_id": "Rota principal inativa ou inexistente."}
                )
        self.assertEqual(self.logs(), [])

    async def test_nome_duplicado_sem_diferenciar_caixa_e_espacos_retorna_409(self):
        await self.criar()

        for nome in ("van 2 - bairro novo", "  VAN 2 - BAIRRO NOVO "):
            with self.subTest(nome=nome):
                status, corpo = await self.requisitar("POST", BASE, dados_complementar(nome=nome))
                self.assertEqual(status, 409)
                self.assertEqual(corpo["error"]["code"], "CONFLICT")
                self.assertEqual(corpo["error"]["message"], "Já existe uma rota com este nome.")
        self.assertEqual(len(self.logs()), 1)

    async def test_campos_extras_sao_rejeitados(self):
        status, corpo = await self.requisitar("POST", BASE, dados_complementar(ativo=False))

        self.assertEqual(status, 422)
        self.assertEqual(self.erro_por_campo(corpo), {"ativo": "Campo não permitido."})

    async def test_ct_hu012_api_003_retorno_valido_e_gravado_e_devolvido(self):
        # #310 / #208, item 2: horário de retorno no cadastro, na edição e na consulta
        rota = await self.criar(nome="Van Retorno 17:40", horario_saida="06:00", horario_retorno="17:40")
        self.assertEqual(rota["horario_retorno"], "17:40")

        status, corpo = await self.requisitar("PATCH", f"{BASE}/{rota['id']}", {"horario_retorno": "17:45"})
        self.assertEqual(status, 200, corpo)

        status, consulta = await self.requisitar("GET", f"{BASE}/{rota['id']}")
        self.assertEqual((status, consulta["horario_saida"], consulta["horario_retorno"]), (200, "06:00", "17:45"))
        self.assertEqual(json.loads(self.logs()[-1].valor_novo)["horario_retorno"], "17:45")

    async def test_ct_hu012_api_003_retorno_igual_ou_anterior_a_saida_e_recusado(self):
        for retorno in ("06:00", "05:30"):
            with self.subTest(retorno=retorno):
                status, corpo = await self.requisitar(
                    "POST", BASE,
                    dados_complementar(nome=f"Van Retorno {retorno}", horario_saida="06:00", horario_retorno=retorno),
                )
                self.assertEqual(status, 422)
                self.assertEqual(
                    self.erro_por_campo(corpo),
                    {"horario_retorno": "Horário de retorno deve ser maior que o horário de saída."},
                )
        self.assertEqual(self.logs(), [])

    async def test_ct_hu012_api_004_nome_de_rota_principal_retorna_409(self):
        # #309: o nome é único entre principais e complementares, ativas ou inativas
        for nome in ("Rota Centro - UFC", " rota antiga "):
            with self.subTest(nome=nome):
                status, corpo = await self.requisitar("POST", BASE, dados_complementar(nome=nome))
                self.assertEqual(status, 409)
                self.assertEqual(
                    (corpo["error"]["code"], corpo["error"]["message"]),
                    ("CONFLICT", "Já existe uma rota com este nome."),
                )
        self.assertEqual(self.logs(), [])


class OpcoesDeRotaPrincipalTest(RotaComplementarHttpTestBase):
    async def test_bdd_selecao_nao_oferece_rotas_principais_inativas(self):
        # FA-002 / critério 5
        status, corpo = await self.requisitar("GET", f"{BASE}/opcoes")

        self.assertEqual(status, 200)
        self.assertEqual(
            corpo,
            {
                "rotas_principais": [
                    {"id": PRINCIPAL_CENTRO, "nome": "Rota Centro - UFC", "horario_saida": "06:30", "horario_retorno": "17:30"},
                    {"id": PRINCIPAL_INTEGRADA, "nome": "Rota Integrada", "horario_saida": "07:00", "horario_retorno": "18:00"},
                ]
            },
        )
        self.assertNotIn("Rota Antiga", [p["nome"] for p in corpo["rotas_principais"]])

    async def test_principal_inativada_pela_api_sai_das_opcoes(self):
        status, _ = await self.requisitar("PATCH", f"/rotas-principais/{PRINCIPAL_INTEGRADA}/inativar")
        self.assertEqual(status, 200)

        _, corpo = await self.requisitar("GET", f"{BASE}/opcoes")

        self.assertEqual([p["id"] for p in corpo["rotas_principais"]], [PRINCIPAL_CENTRO])

    async def test_contrato_de_rotas_principais_opcoes_nao_foi_alterado(self):
        _, corpo = await self.requisitar("GET", "/rotas-principais/opcoes")

        self.assertEqual(set(corpo), {"bairros", "faculdades"})


class ListagemTest(RotaComplementarHttpTestBase):
    async def asserir_nomes(self, caminho, esperado):
        status, lista = await self.requisitar("GET", caminho)
        self.assertEqual(status, 200)
        self.assertEqual([r["nome"] for r in lista], esperado)
        return lista

    async def test_bdd_lista_somente_ativas_por_padrao_com_horario_ponto_e_principal(self):
        # AC-01 / critérios 9 e 1 (listagem) + RN-010 (inativa fora das opções de agendamento)
        await self.criar()
        inativa = await self.criar(nome="Van Antiga", horario_saida="07:00")
        await self.requisitar("PATCH", f"{BASE}/{inativa['id']}/inativar")

        lista = await self.asserir_nomes(BASE, ["Van 2 - Bairro Novo"])

        self.assertEqual(
            lista[0],
            {
                "id": lista[0]["id"], "nome": "Van 2 - Bairro Novo", "horario_saida": "06:00",
                "horario_retorno": "17:40", "ponto_conexao": "Trevo do Bairro Novo", "ativo": True,
                "rota_principal": {"id": PRINCIPAL_CENTRO, "nome": "Rota Centro - UFC", "ativo": True},
            },
        )

    async def test_bdd_mostrar_inativos_traz_todas_identificadas_como_inativas(self):
        # critérios 8 e 9: ?incluir_inativos=true
        await self.criar()
        inativa = await self.criar(nome="Van Antiga")
        await self.requisitar("PATCH", f"{BASE}/{inativa['id']}/inativar")

        lista = await self.asserir_nomes(f"{BASE}?incluir_inativos=true", ["Van 2 - Bairro Novo", "Van Antiga"])

        self.assertEqual({r["nome"]: r["ativo"] for r in lista}, {"Van 2 - Bairro Novo": True, "Van Antiga": False})

    async def test_busca_por_nome_e_por_rota_principal(self):
        await self.criar(nome="Van Alfa")
        await self.criar(nome="Micro Beta", rota_principal_id=PRINCIPAL_INTEGRADA)

        await self.asserir_nomes(f"{BASE}?nome=ALFA", ["Van Alfa"])
        await self.asserir_nomes(f"{BASE}?nome=a", ["Micro Beta", "Van Alfa"])
        await self.asserir_nomes(f"{BASE}?rota_principal_id={PRINCIPAL_INTEGRADA}", ["Micro Beta"])
        await self.asserir_nomes(f"{BASE}?nome=%25", [])

    async def test_consulta_por_id(self):
        rota = await self.criar()

        status, corpo = await self.requisitar("GET", f"{BASE}/{rota['id']}")
        self.assertEqual((status, corpo), (200, rota))
        status, corpo = await self.requisitar("GET", f"{BASE}/999")
        self.assertEqual((status, corpo["error"]["code"]), (404, "RESOURCE_NOT_FOUND"))
        self.assertEqual(corpo["error"]["message"], "Rota complementar não encontrada.")

    async def test_filtro_de_principal_invalido_retorna_422(self):
        status, corpo = await self.requisitar("GET", f"{BASE}?rota_principal_id=0")

        self.assertEqual(status, 422)
        self.assertEqual(self.erro_por_campo(corpo), {"rota_principal_id": "Informe um ID de rota principal válido."})


class EdicaoTest(RotaComplementarHttpTestBase):
    async def test_bdd_edita_nome_horario_ponto_e_rota_principal(self):
        # AC-04 / critério 6
        rota = await self.criar()

        status, corpo = await self.requisitar(
            "PATCH", f"{BASE}/{rota['id']}",
            {"nome": "Van 3 - Bairro Novo", "horario_saida": "05:45", "horario_retorno": "18:10",
             "ponto_conexao": "Posto Central", "rota_principal_id": PRINCIPAL_INTEGRADA},
        )

        self.assertEqual(status, 200)
        self.assertEqual(corpo["message"], MENSAGEM_SUCESSO)
        self.assertEqual(
            corpo["data"],
            {
                "id": rota["id"], "nome": "Van 3 - Bairro Novo", "horario_saida": "05:45",
                "horario_retorno": "18:10", "ponto_conexao": "Posto Central", "ativo": True,
                "rota_principal": {"id": PRINCIPAL_INTEGRADA, "nome": "Rota Integrada", "ativo": True},
            },
        )
        _, lista = await self.requisitar("GET", BASE)
        self.assertEqual(lista[0]["nome"], "Van 3 - Bairro Novo")

    async def test_bdd_esvaziar_campo_obrigatorio_bloqueia_e_mantem_dados_originais(self):
        # FA-003 na edição (esquema do cenário)
        rota = await self.criar()
        casos = [
            ("nome", ""), ("nome", None), ("horario_saida", ""), ("horario_saida", None),
            ("ponto_conexao", ""), ("ponto_conexao", None), ("rota_principal_id", None),
        ]
        for campo, valor in casos:
            with self.subTest(campo=campo, valor=valor):
                status, corpo = await self.requisitar("PATCH", f"{BASE}/{rota['id']}", {campo: valor})
                self.assertEqual(status, 422)
                self.assertIn(campo, self.erro_por_campo(corpo))
        _, depois = await self.requisitar("GET", f"{BASE}/{rota['id']}")
        self.assertEqual(depois, rota)
        self.assertEqual([l.acao for l in self.logs()], ["CRIAR"])

    async def test_patch_vazio_retorna_422_no_padrao_da_hu_011(self):
        rota = await self.criar()

        status, corpo = await self.requisitar("PATCH", f"{BASE}/{rota['id']}", {})

        self.assertEqual(status, 422)
        self.assertEqual(self.erro_por_campo(corpo), {"rota": "Informe ao menos um campo para atualização."})

    async def test_trocar_para_principal_inativa_ou_inexistente_retorna_422_sem_alterar(self):
        rota = await self.criar()
        for principal_id in (PRINCIPAL_INATIVA, 999):
            with self.subTest(principal=principal_id):
                status, corpo = await self.requisitar(
                    "PATCH", f"{BASE}/{rota['id']}", {"nome": "Outra", "rota_principal_id": principal_id}
                )
                self.assertEqual(status, 422)
                self.assertEqual(
                    self.erro_por_campo(corpo), {"rota_principal_id": "Rota principal inativa ou inexistente."}
                )
        _, depois = await self.requisitar("GET", f"{BASE}/{rota['id']}")
        self.assertEqual(depois, rota)

    async def test_manter_principal_atual_inativada_depois_e_permitido(self):
        rota = await self.criar()
        self.inativar_principal_direto(PRINCIPAL_CENTRO)

        status, corpo = await self.requisitar(
            "PATCH", f"{BASE}/{rota['id']}", {"rota_principal_id": PRINCIPAL_CENTRO, "ponto_conexao": "Posto"}
        )

        self.assertEqual(status, 200, corpo)
        self.assertEqual(corpo["data"]["ponto_conexao"], "Posto")
        self.assertFalse(corpo["data"]["rota_principal"]["ativo"])

    async def test_nome_de_outra_rota_retorna_409(self):
        await self.criar(nome="Van 1")
        rota = await self.criar(nome="Van 2")

        status, corpo = await self.requisitar("PATCH", f"{BASE}/{rota['id']}", {"nome": " VAN 1 "})

        self.assertEqual(status, 409)
        self.assertEqual(corpo["error"]["message"], "Já existe uma rota com este nome.")

    async def test_nome_de_rota_principal_na_edicao_retorna_409(self):
        rota = await self.criar()

        status, corpo = await self.requisitar("PATCH", f"{BASE}/{rota['id']}", {"nome": "Rota Integrada"})

        self.assertEqual((status, corpo["error"]["message"]), (409, "Já existe uma rota com este nome."))
        _, consulta = await self.requisitar("GET", f"{BASE}/{rota['id']}")
        self.assertEqual(consulta["nome"], "Van 2 - Bairro Novo")

    async def test_edicao_parcial_do_horario_compara_com_o_salvo(self):
        rota = await self.criar()  # saída 06:00, retorno 17:40

        for campos in ({"horario_retorno": "06:00"}, {"horario_saida": "18:00"}):
            with self.subTest(campos=campos):
                status, corpo = await self.requisitar("PATCH", f"{BASE}/{rota['id']}", campos)
                self.assertEqual(status, 422)
                self.assertEqual(
                    self.erro_por_campo(corpo),
                    {"horario_retorno": "Horário de retorno deve ser maior que o horário de saída."},
                )
        self.assertEqual(len(self.logs()), 1)

    async def test_edicao_de_inexistente_retorna_404(self):
        status, corpo = await self.requisitar("PATCH", f"{BASE}/999", {"nome": "X"})

        self.assertEqual((status, corpo["error"]["code"]), (404, "RESOURCE_NOT_FOUND"))

    async def test_edita_registro_inativo(self):
        rota = await self.criar()
        await self.requisitar("PATCH", f"{BASE}/{rota['id']}/inativar")

        status, corpo = await self.requisitar("PATCH", f"{BASE}/{rota['id']}", {"ponto_conexao": "Posto"})

        self.assertEqual(status, 200)
        self.assertFalse(corpo["data"]["ativo"])


class InativacaoEReativacaoTest(RotaComplementarHttpTestBase):
    async def test_bdd_inativa_sem_agendamentos_e_sai_da_listagem_de_ativas(self):
        # AC-05 / critérios 1 e 3
        rota = await self.criar()

        status, corpo = await self.requisitar("PATCH", f"{BASE}/{rota['id']}/inativar")

        self.assertEqual(status, 200)
        self.assertEqual(corpo["message"], MENSAGEM_SUCESSO)
        self.assertFalse(corpo["data"]["ativo"])
        _, ativas = await self.requisitar("GET", BASE)
        self.assertEqual(ativas, [])

    async def test_bdd_soft_delete_mantem_o_registro_no_banco(self):
        # RF-014 (teste de API): registro permanece com status inativo
        rota = await self.criar()
        await self.requisitar("PATCH", f"{BASE}/{rota['id']}/inativar")

        self.session.expire_all()
        registro = self.session.get(RotaComplementarORM, rota["id"])
        self.assertIsNotNone(registro)
        self.assertFalse(registro.ativo)

    async def test_bdd_registros_historicos_ficam_inalterados_apos_a_inativacao(self):
        # RN-004: nada além do status muda; a rota principal e as demais complementares permanecem
        rota = await self.criar()
        outra = await self.criar(nome="Van 3")

        await self.requisitar("PATCH", f"{BASE}/{rota['id']}/inativar")

        _, depois = await self.requisitar("GET", f"{BASE}/{rota['id']}")
        self.assertEqual(depois, {**rota, "ativo": False})
        _, intacta = await self.requisitar("GET", f"{BASE}/{outra['id']}")
        self.assertEqual(intacta, outra)
        _, principal = await self.requisitar("GET", f"/rotas-principais/{PRINCIPAL_CENTRO}")
        self.assertEqual((principal["nome"], principal["ativo"]), ("Rota Centro - UFC", True))

    async def test_bdd_reativa_rota_inativa_com_principal_ativa(self):
        # critério 1 (reativação) e 3
        rota = await self.criar()
        await self.requisitar("PATCH", f"{BASE}/{rota['id']}/inativar")

        status, corpo = await self.requisitar("PATCH", f"{BASE}/{rota['id']}/reativar")

        self.assertEqual(status, 200)
        self.assertEqual(corpo["message"], MENSAGEM_SUCESSO)
        self.assertTrue(corpo["data"]["ativo"])
        _, ativas = await self.requisitar("GET", BASE)
        self.assertEqual([r["id"] for r in ativas], [rota["id"]])

    async def test_bdd_agendamento_futuro_bloqueia_a_inativacao_sem_alterar_nem_logar(self):
        # FA-001 / critério 2 (depende da HU-013: checker injetado)
        rota = await self.criar()
        self.usar_checker(True)
        logs_antes = len(self.logs())

        status, corpo = await self.requisitar("PATCH", f"{BASE}/{rota['id']}/inativar")

        self.assertEqual(status, 409)
        self.assertEqual(corpo["error"]["code"], "CONFLICT")
        self.assertEqual(corpo["error"]["message"], MENSAGEM_AGENDAMENTOS)
        _, depois = await self.requisitar("GET", f"{BASE}/{rota['id']}")
        self.assertTrue(depois["ativo"])
        self.assertEqual(len(self.logs()), logs_antes)

    async def test_sem_agendamento_futuro_inativa_e_grava_log(self):
        rota = await self.criar()
        self.usar_checker(False)

        status, corpo = await self.requisitar("PATCH", f"{BASE}/{rota['id']}/inativar")

        self.assertEqual(status, 200)
        self.assertFalse(corpo["data"]["ativo"])
        self.assertEqual(self.logs()[-1].acao, "INATIVAR")

    async def test_falhar_aberto_sem_checker_injetado_nao_bloqueia(self):
        rota = await self.criar()

        status, _ = await self.requisitar("PATCH", f"{BASE}/{rota['id']}/inativar")

        self.assertEqual(status, 200)

    async def test_estado_repetido_retorna_409_sem_log(self):
        rota = await self.criar()

        status, corpo = await self.requisitar("PATCH", f"{BASE}/{rota['id']}/reativar")
        self.assertEqual((status, corpo["error"]["message"]), (409, "Rota complementar já está ativa."))
        await self.requisitar("PATCH", f"{BASE}/{rota['id']}/inativar")
        status, corpo = await self.requisitar("PATCH", f"{BASE}/{rota['id']}/inativar")
        self.assertEqual((status, corpo["error"]["message"]), (409, "Rota complementar já está inativa."))

        self.assertEqual([l.acao for l in self.logs()], ["CRIAR", "INATIVAR"])

    async def test_inexistente_retorna_404(self):
        for acao in ("inativar", "reativar"):
            status, corpo = await self.requisitar("PATCH", f"{BASE}/999/{acao}")
            self.assertEqual((status, corpo["error"]["code"]), (404, "RESOURCE_NOT_FOUND"))

    async def test_reativar_com_principal_inativa_retorna_409_sem_alterar_nem_logar(self):
        # D8: complementar inativa, principal inativada depois
        rota = await self.criar()
        await self.requisitar("PATCH", f"{BASE}/{rota['id']}/inativar")
        status, _ = await self.requisitar("PATCH", f"/rotas-principais/{PRINCIPAL_CENTRO}/inativar")
        self.assertEqual(status, 200)
        logs_antes = len(self.logs())

        status, corpo = await self.requisitar("PATCH", f"{BASE}/{rota['id']}/reativar")

        self.assertEqual(status, 409)
        self.assertEqual(
            corpo["error"]["message"],
            "Não é possível reativar esta rota complementar pois a rota principal vinculada está inativa.",
        )
        _, depois = await self.requisitar("GET", f"{BASE}/{rota['id']}")
        self.assertFalse(depois["ativo"])
        self.assertEqual(len(self.logs()), logs_antes)

    async def test_inativar_e_permitido_com_principal_inativa(self):
        rota = await self.criar()
        self.inativar_principal_direto(PRINCIPAL_CENTRO)

        status, corpo = await self.requisitar("PATCH", f"{BASE}/{rota['id']}/inativar")

        self.assertEqual(status, 200, corpo)


class InteracaoComRotaPrincipalTest(RotaComplementarHttpTestBase):
    async def test_d3_principal_com_complementar_ativa_nao_pode_ser_inativada(self):
        rota = await self.criar()
        logs_antes = len(self.logs())

        status, corpo = await self.requisitar("PATCH", f"/rotas-principais/{PRINCIPAL_CENTRO}/inativar")

        self.assertEqual(status, 409)
        self.assertEqual(
            corpo["error"]["message"],
            "Esta rota possui rotas complementares ativas vinculadas. "
            "Inative ou desvincule as rotas complementares antes de continuar.",
        )
        self.assertEqual(len(self.logs()), logs_antes)

        await self.requisitar("PATCH", f"{BASE}/{rota['id']}/inativar")
        status, _ = await self.requisitar("PATCH", f"/rotas-principais/{PRINCIPAL_CENTRO}/inativar")
        self.assertEqual(status, 200)

    async def test_d8_reassociar_a_complementar_libera_a_inativacao_da_principal(self):
        rota = await self.criar()
        await self.requisitar("PATCH", f"{BASE}/{rota['id']}", {"rota_principal_id": PRINCIPAL_INTEGRADA})

        status, _ = await self.requisitar("PATCH", f"/rotas-principais/{PRINCIPAL_CENTRO}/inativar")

        self.assertEqual(status, 200)


class AuditoriaTest(RotaComplementarHttpTestBase):
    async def test_bdd_cada_operacao_de_escrita_gera_uma_entrada_com_usuario_e_timestamp(self):
        # RNF-013 (esquema do cenário): cadastro, edição, inativação, reativação
        self.usar_perfil(CargoEnum.ADMINISTRADOR.value, user_id=77)
        rota = await self.criar()
        await self.requisitar("PATCH", f"{BASE}/{rota['id']}", {"nome": "Van 3"})
        await self.requisitar("PATCH", f"{BASE}/{rota['id']}/inativar")
        await self.requisitar("PATCH", f"{BASE}/{rota['id']}/reativar")

        logs = self.logs()

        self.assertEqual([l.acao for l in logs], ["CRIAR", "EDITAR", "INATIVAR", "REATIVAR"])
        for log in logs:
            self.assertEqual((log.usuario_id, log.entidade, log.entidade_id), (77, "rota_complementar", rota["id"]))
            self.assertIsNotNone(log.criado_em)
        self.assertIsNone(logs[0].valor_anterior)
        self.assertEqual(json.loads(logs[1].valor_anterior)["nome"], "Van 2 - Bairro Novo")
        self.assertEqual(json.loads(logs[1].valor_novo)["nome"], "Van 3")
        self.assertEqual((logs[2].valor_anterior, logs[2].valor_novo), ("ativo", "inativo"))
        self.assertEqual((logs[3].valor_anterior, logs[3].valor_novo), ("inativo", "ativo"))

    async def test_edicao_sem_mudanca_e_operacoes_bloqueadas_nao_geram_log(self):
        rota = await self.criar()
        await self.requisitar("PATCH", f"{BASE}/{rota['id']}", {"nome": "Van 2 - Bairro Novo"})
        await self.requisitar("PATCH", f"{BASE}/{rota['id']}", {"nome": ""})
        await self.requisitar("POST", BASE, dados_complementar())

        self.assertEqual([l.acao for l in self.logs()], ["CRIAR"])
