import json
import unittest

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
    dados_rota,
    novo_session,
    semear_base,
)

from datetime import time

from fastapi import FastAPI

from src.modulos.crud_basicos.interface.http import bairro_routes, faculdade_routes
from src.modulos.rotas.infrastructure.repositories.rota_principal_repository import (
    RotaPrincipalRepository,
)
from src.modulos.rotas.interface.http import rota_principal_routes
from src.modulos.rotas.model.entities.rota_complementar import RotaComplementarORM
from src.shared.auth.dependencies import get_current_user
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.infrastructure.audit_model import LogAuditoriaORM
from src.shared.infrastructure.db import get_session

MENSAGEM_SUCESSO = "Operação realizada com sucesso"
MENSAGEM_AGENDAMENTOS = (
    "Esta rota possui agendamentos pendentes e não pode ser inativada no momento."
)


def contexto(perfil: str, user_id: int = ADMIN_ID) -> dict:
    return {
        "sub": str(user_id),
        "type": "access",
        "role": perfil,
        "current_role": perfil,
        "current_roles": [perfil],
        "current_user_id": user_id,
    }


class RotaPrincipalHttpTestBase(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.engine = criar_engine()
        self.session = novo_session(self.engine)
        semear_base(self.session)

        self.app = FastAPI()
        self.app.include_router(rota_principal_routes.router)
        self.app.include_router(bairro_routes.router)
        self.app.include_router(faculdade_routes.router)
        self.app.dependency_overrides[get_session] = lambda: self.session
        self.usar_perfil(CargoEnum.ADMINISTRADOR.value)

    def tearDown(self):
        self.app.dependency_overrides.clear()
        self.session.close()

    def usar_perfil(self, perfil):
        self.app.dependency_overrides[get_current_user] = lambda: contexto(perfil)

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

    async def criar_rota(self, **alteracoes):
        status, corpo = await self.requisitar("POST", "/rotas-principais", dados_rota(**alteracoes))
        self.assertEqual(status, 201, corpo)
        return corpo["data"]

    def logs(self):
        self.session.expire_all()
        return self.session.query(LogAuditoriaORM).order_by(LogAuditoriaORM.id).all()

    def assert_erro_por_campo(self, corpo, campo, codigo="REQUEST_VALIDATION_ERROR"):
        self.assertIs(corpo["success"], False)
        self.assertEqual(corpo["error"]["code"], codigo)
        campos = {d["field"]: d["message"] for d in corpo["error"]["details"]}
        self.assertIn(campo, campos, corpo)
        return campos[campo]


class AcessoTest(RotaPrincipalHttpTestBase):
    async def test_sem_token_retorna_401_em_todas_as_operacoes(self):
        self.app.dependency_overrides.pop(get_current_user)
        operacoes = [
            ("GET", "/rotas-principais", None),
            ("GET", "/rotas-principais/opcoes", None),
            ("GET", "/rotas-principais/1", None),
            ("POST", "/rotas-principais", dados_rota()),
            ("PATCH", "/rotas-principais/1", {"nome": "X"}),
            ("PATCH", "/rotas-principais/1/inativar", None),
            ("PATCH", "/rotas-principais/1/reativar", None),
        ]
        for metodo, caminho, corpo in operacoes:
            with self.subTest(operacao=f"{metodo} {caminho}"):
                status, resposta = await self.requisitar(metodo, caminho, corpo)
                self.assertEqual(status, 401)
                self.assertEqual(resposta["error"]["code"], "UNAUTHORIZED")

    async def test_aluno_e_representante_recebem_403_e_nada_e_gravado(self):
        for perfil in (CargoEnum.ALUNO.value, CargoEnum.REPRESENTANTE.value):
            self.usar_perfil(perfil)
            for metodo, caminho, corpo in [
                ("GET", "/rotas-principais", None),
                ("GET", "/rotas-principais/opcoes", None),
                ("POST", "/rotas-principais", dados_rota()),
                ("PATCH", "/rotas-principais/1", {"nome": "X"}),
                ("PATCH", "/rotas-principais/1/inativar", None),
                ("PATCH", "/rotas-principais/1/reativar", None),
            ]:
                with self.subTest(perfil=perfil, operacao=f"{metodo} {caminho}"):
                    status, resposta = await self.requisitar(metodo, caminho, corpo)
                    self.assertEqual(status, 403)
                    self.assertEqual(resposta["error"]["code"], "FORBIDDEN")
        self.usar_perfil(CargoEnum.ADMINISTRADOR.value)
        _, lista = await self.requisitar("GET", "/rotas-principais?incluir_inativos=true")
        self.assertEqual(lista, [])
        self.assertEqual(self.logs(), [])


class CadastroTest(RotaPrincipalHttpTestBase):
    async def test_criterio_10_cria_rota_e_responde_201_com_mensagem(self):
        status, corpo = await self.requisitar(
            "POST", "/rotas-principais",
            dados_rota(bairros_ids=[BAIRRO_CENTRO, BAIRRO_CAMPO_VELHO],
                       faculdades_ida_ids=[UFC, IFCE], faculdades_volta_ids=[UFC]),
        )

        self.assertEqual(status, 201)
        self.assertIs(corpo["success"], True)
        self.assertEqual(corpo["message"], MENSAGEM_SUCESSO)
        rota = corpo["data"]
        self.assertTrue(rota["ativo"])
        self.assertEqual((rota["horario_saida"], rota["horario_retorno"]), ("06:30", "17:30"))
        self.assertEqual(len(rota["bairros"]), 2)
        self.assertEqual({f["id"] for f in rota["faculdades_ida"]}, {UFC, IFCE})
        self.assertEqual({f["id"] for f in rota["faculdades_volta"]}, {UFC})

    async def test_criterio_1_volta_diferente_da_ida(self):
        rota = await self.criar_rota(faculdades_ida_ids=[UFC], faculdades_volta_ids=[UECE])

        self.assertEqual([f["id"] for f in rota["faculdades_ida"]], [UFC])
        self.assertEqual([f["id"] for f in rota["faculdades_volta"]], [UECE])

    async def test_criterio_7_campos_obrigatorios_ausentes_destacam_cada_campo(self):
        status, corpo = await self.requisitar("POST", "/rotas-principais", {})

        self.assertEqual(status, 422)
        mensagens = {d["field"]: d["message"] for d in corpo["error"]["details"]}
        self.assertEqual(
            mensagens,
            {
                "nome": "Nome da rota é obrigatório.",
                "horario_saida": "Horário de saída é obrigatório.",
                "horario_retorno": "Horário de retorno é obrigatório.",
                "bairros_ids": "Vincule ao menos um bairro.",
                "faculdades_ida_ids": "Informe ao menos uma faculdade na ida.",
                "faculdades_volta_ids": "Informe ao menos uma faculdade na volta.",
            },
        )

    async def test_criterio_7_cada_campo_vazio_bloqueia_o_cadastro(self):
        vazios = {
            "nome": "   ",
            "horario_saida": "",
            "horario_retorno": "",
            "bairros_ids": [],
            "faculdades_ida_ids": [],
            "faculdades_volta_ids": [],
        }
        for campo, valor in vazios.items():
            with self.subTest(campo=campo):
                status, corpo = await self.requisitar(
                    "POST", "/rotas-principais", dados_rota(**{campo: valor})
                )
                self.assertEqual(status, 422)
                self.assert_erro_por_campo(corpo, campo)
        _, lista = await self.requisitar("GET", "/rotas-principais?incluir_inativos=true")
        self.assertEqual(lista, [])
        self.assertEqual(self.logs(), [])

    async def test_campo_nulo_e_item_de_lista_invalido(self):
        status, corpo = await self.requisitar(
            "POST", "/rotas-principais", dados_rota(nome=None, bairros_ids=["a", 0])
        )

        self.assertEqual(status, 422)
        self.assertEqual(self.assert_erro_por_campo(corpo, "nome"), "Nome da rota é obrigatório.")
        self.assertEqual(
            self.assert_erro_por_campo(corpo, "bairros_ids"),
            "Informe IDs válidos (números inteiros positivos).",
        )
        campos = [d["field"] for d in corpo["error"]["details"]]
        self.assertEqual(campos.count("bairros_ids"), 1)

    async def test_horario_em_formato_invalido_ou_fora_da_ordem(self):
        status, corpo = await self.requisitar(
            "POST", "/rotas-principais", dados_rota(horario_saida="25:00")
        )
        self.assertEqual(status, 422)
        self.assertEqual(
            self.assert_erro_por_campo(corpo, "horario_saida"), "Horário deve estar no formato HH:MM."
        )

        status, corpo = await self.requisitar(
            "POST", "/rotas-principais", dados_rota(horario_saida="17:30", horario_retorno="06:30")
        )
        self.assertEqual(status, 422)
        self.assertEqual(
            self.assert_erro_por_campo(corpo, "horario_retorno"),
            "Horário de retorno deve ser maior que o horário de saída.",
        )

    async def test_horarios_com_digitos_nao_ascii_dao_422_com_mensagem_de_formato(self):
        invalidos = ("0٦:30", "0६:30", "0６:30", "０６：３０")
        for campo in ("horario_saida", "horario_retorno"):
            for invalido in invalidos:
                with self.subTest(campo=campo, valor=invalido):
                    status, corpo = await self.requisitar(
                        "POST", "/rotas-principais", dados_rota(**{campo: invalido})
                    )
                    self.assertEqual(status, 422)
                    self.assertEqual(
                        self.assert_erro_por_campo(corpo, campo),
                        "Horário deve estar no formato HH:MM.",
                    )
        _, lista = await self.requisitar("GET", "/rotas-principais?incluir_inativos=true")
        self.assertEqual(lista, [])

    async def test_patch_com_horario_de_digitos_nao_ascii_da_422_sem_alterar(self):
        rota = await self.criar_rota()

        status, corpo = await self.requisitar(
            "PATCH", f"/rotas-principais/{rota['id']}", {"horario_saida": "0٦:00"}
        )

        self.assertEqual(status, 422)
        self.assertEqual(
            self.assert_erro_por_campo(corpo, "horario_saida"),
            "Horário deve estar no formato HH:MM.",
        )
        _, depois = await self.requisitar("GET", f"/rotas-principais/{rota['id']}")
        self.assertEqual(depois, rota)

    async def test_duplicados_na_mesma_lista_dao_422_por_campo(self):
        for campo in ("bairros_ids", "faculdades_ida_ids", "faculdades_volta_ids"):
            with self.subTest(campo=campo):
                status, corpo = await self.requisitar(
                    "POST", "/rotas-principais", dados_rota(**{campo: [1, 1]})
                )
                self.assertEqual(status, 422)
                self.assert_erro_por_campo(corpo, campo)

    async def test_criterio_2_referencias_inativas_ou_inexistentes_dao_422_sem_gravar(self):
        casos = [
            ("bairros_ids", [BAIRRO_CENTRO, BAIRRO_INATIVO]),
            ("bairros_ids", [999]),
            ("faculdades_ida_ids", [UFC, FACULDADE_INATIVA]),
            ("faculdades_volta_ids", [FACULDADE_INATIVA]),
            ("faculdades_volta_ids", [999]),
        ]
        for campo, ids in casos:
            with self.subTest(campo=campo, ids=ids):
                status, corpo = await self.requisitar(
                    "POST", "/rotas-principais", dados_rota(**{campo: ids})
                )
                self.assertEqual(status, 422)
                self.assert_erro_por_campo(corpo, campo)
        _, lista = await self.requisitar("GET", "/rotas-principais?incluir_inativos=true")
        self.assertEqual(lista, [])
        self.assertEqual(self.logs(), [])

    async def test_nome_duplicado_sem_diferenciar_caixa_e_espacos_retorna_409(self):
        await self.criar_rota()

        status, corpo = await self.requisitar(
            "POST", "/rotas-principais", dados_rota(nome="  ROTA centro - ufc ")
        )

        self.assertEqual(status, 409)
        self.assertEqual(corpo["error"]["code"], "CONFLICT")
        self.assertEqual(corpo["error"]["message"], "Já existe uma rota com este nome.")

    async def test_nao_aceita_campo_extra_como_ativo(self):
        status, corpo = await self.requisitar(
            "POST", "/rotas-principais", dados_rota(ativo=False)
        )

        self.assertEqual(status, 422)
        self.assertEqual(self.assert_erro_por_campo(corpo, "ativo"), "Campo não permitido.")


class ListagemEOpcoesTest(RotaPrincipalHttpTestBase):
    async def test_criterios_8_e_9_lista_so_ativas_por_padrao_e_todas_com_incluir_inativos(self):
        ativa = await self.criar_rota(nome="Rota Centro - UFC")
        inativa = await self.criar_rota(nome="Rota Antiga")
        await self.requisitar("PATCH", f"/rotas-principais/{inativa['id']}/inativar")

        status, padrao = await self.requisitar("GET", "/rotas-principais")
        _, todas = await self.requisitar("GET", "/rotas-principais?incluir_inativos=true")

        self.assertEqual(status, 200)
        self.assertEqual([r["id"] for r in padrao], [ativa["id"]])
        self.assertEqual((padrao[0]["horario_saida"], padrao[0]["horario_retorno"]), ("06:30", "17:30"))
        self.assertEqual({r["id"]: r["ativo"] for r in todas}, {ativa["id"]: True, inativa["id"]: False})

    async def test_busca_por_nome_parcial_sem_diferenciar_maiusculas(self):
        await self.criar_rota(nome="Rota Centro - UFC")
        await self.criar_rota(nome="Rota Integrada")

        _, achadas = await self.requisitar("GET", "/rotas-principais?nome=CENTRO")

        self.assertEqual([r["nome"] for r in achadas], ["Rota Centro - UFC"])

    async def test_incluir_inativos_invalido_retorna_422(self):
        status, corpo = await self.requisitar("GET", "/rotas-principais?incluir_inativos=talvez")

        self.assertEqual(status, 422)
        self.assert_erro_por_campo(corpo, "incluir_inativos")

    async def test_consulta_por_id_e_inexistente(self):
        rota = await self.criar_rota()

        status, corpo = await self.requisitar("GET", f"/rotas-principais/{rota['id']}")
        self.assertEqual((status, corpo), (200, rota))

        status, corpo = await self.requisitar("GET", "/rotas-principais/999")
        self.assertEqual(status, 404)
        self.assertEqual(corpo["error"]["code"], "RESOURCE_NOT_FOUND")
        self.assertEqual(corpo["error"]["message"], "Rota não encontrada.")

        status, corpo = await self.requisitar("GET", "/rotas-principais/abc")
        self.assertEqual(status, 422)
        self.assert_erro_por_campo(corpo, "rota_id")

    async def test_criterio_2_opcoes_trazem_somente_ativos_e_nao_conflitam_com_id(self):
        status, corpo = await self.requisitar("GET", "/rotas-principais/opcoes")

        self.assertEqual(status, 200)
        self.assertEqual({b["id"] for b in corpo["bairros"]}, {BAIRRO_CENTRO, BAIRRO_CAMPO_VELHO})
        self.assertEqual({f["id"] for f in corpo["faculdades"]}, {UFC, IFCE, UECE})
        self.assertNotIn(BAIRRO_INATIVO, {b["id"] for b in corpo["bairros"]})
        self.assertNotIn(FACULDADE_INATIVA, {f["id"] for f in corpo["faculdades"]})
        self.assertEqual(set(corpo["bairros"][0]), {"id", "nome"})


class EdicaoTest(RotaPrincipalHttpTestBase):
    async def test_criterio_3_patch_parcial_altera_so_o_enviado(self):
        rota = await self.criar_rota(faculdades_ida_ids=[UFC, IFCE])

        status, corpo = await self.requisitar(
            "PATCH", f"/rotas-principais/{rota['id']}",
            {"nome": "Rota Centro e Campo Velho - UFC", "horario_saida": "06:00",
             "horario_retorno": "18:00", "bairros_ids": [BAIRRO_CENTRO, BAIRRO_CAMPO_VELHO],
             "faculdades_volta_ids": [UECE]},
        )

        self.assertEqual(status, 200)
        self.assertEqual(corpo["message"], MENSAGEM_SUCESSO)
        editada = corpo["data"]
        self.assertEqual(editada["id"], rota["id"])
        self.assertEqual((editada["horario_saida"], editada["horario_retorno"]), ("06:00", "18:00"))
        self.assertEqual(len(editada["bairros"]), 2)
        self.assertEqual({f["id"] for f in editada["faculdades_ida"]}, {UFC, IFCE})
        self.assertEqual([f["id"] for f in editada["faculdades_volta"]], [UECE])

    async def test_criterio_7_edicao_com_campo_vazio_e_recusada_sem_alterar(self):
        rota = await self.criar_rota()
        for corpo_patch, campo in [
            ({"nome": ""}, "nome"),
            ({"nome": None}, "nome"),
            ({"horario_saida": ""}, "horario_saida"),
            ({"horario_retorno": None}, "horario_retorno"),
            ({"bairros_ids": []}, "bairros_ids"),
            ({"faculdades_ida_ids": []}, "faculdades_ida_ids"),
            ({"faculdades_volta_ids": []}, "faculdades_volta_ids"),
        ]:
            with self.subTest(campo=campo, corpo=corpo_patch):
                status, corpo = await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}", corpo_patch)
                self.assertEqual(status, 422)
                self.assert_erro_por_campo(corpo, campo)
        _, depois = await self.requisitar("GET", f"/rotas-principais/{rota['id']}")
        self.assertEqual(depois, rota)

    async def test_patch_sem_campos_retorna_422(self):
        rota = await self.criar_rota()

        status, corpo = await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}", {})

        self.assertEqual(status, 422)
        self.assertEqual(
            self.assert_erro_por_campo(corpo, "rota"), "Informe ao menos um campo para atualização."
        )

    async def test_patch_valida_ordem_dos_horarios_com_o_valor_gravado(self):
        rota = await self.criar_rota()

        status, corpo = await self.requisitar(
            "PATCH", f"/rotas-principais/{rota['id']}", {"horario_saida": "18:00"}
        )

        self.assertEqual(status, 422)
        self.assert_erro_por_campo(corpo, "horario_retorno")

    async def test_criterio_2_patch_rejeita_vinculo_novo_inativo_sem_gravar_parcial(self):
        rota = await self.criar_rota()

        status, corpo = await self.requisitar(
            "PATCH", f"/rotas-principais/{rota['id']}",
            {"nome": "Outro nome", "faculdades_ida_ids": [FACULDADE_INATIVA]},
        )

        self.assertEqual(status, 422)
        self.assert_erro_por_campo(corpo, "faculdades_ida_ids")
        _, depois = await self.requisitar("GET", f"/rotas-principais/{rota['id']}")
        self.assertEqual(depois, rota)

    async def test_patch_rota_inexistente_e_nome_em_uso(self):
        a = await self.criar_rota(nome="Rota A")
        await self.criar_rota(nome="Rota B")

        status, _ = await self.requisitar("PATCH", "/rotas-principais/999", {"nome": "X"})
        self.assertEqual(status, 404)
        status, corpo = await self.requisitar("PATCH", f"/rotas-principais/{a['id']}", {"nome": "rota b"})
        self.assertEqual(status, 409)
        self.assertEqual(corpo["error"]["message"], "Já existe uma rota com este nome.")


class InativacaoEReativacaoTest(RotaPrincipalHttpTestBase):
    async def test_criterios_4_e_6_inativa_e_reativa_com_mensagem_e_sem_apagar(self):
        rota = await self.criar_rota()

        status, corpo = await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}/inativar")
        self.assertEqual(status, 200)
        self.assertEqual(corpo["message"], MENSAGEM_SUCESSO)
        self.assertFalse(corpo["data"]["ativo"])
        _, ativas = await self.requisitar("GET", "/rotas-principais")
        self.assertEqual(ativas, [])
        _, todas = await self.requisitar("GET", "/rotas-principais?incluir_inativos=true")
        self.assertEqual([r["id"] for r in todas], [rota["id"]])

        status, corpo = await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}/reativar")
        self.assertEqual(status, 200)
        self.assertEqual(corpo["message"], MENSAGEM_SUCESSO)
        self.assertTrue(corpo["data"]["ativo"])

    async def test_criterio_4_auditoria_dos_quatro_eventos_com_usuario(self):
        rota = await self.criar_rota()
        await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}", {"nome": "Novo nome"})
        await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}/inativar")
        await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}/reativar")

        logs = self.logs()

        self.assertEqual([l.acao for l in logs], ["CRIAR", "EDITAR", "INATIVAR", "REATIVAR"])
        self.assertTrue(all(l.usuario_id == ADMIN_ID for l in logs))
        self.assertTrue(all(l.entidade == "rota_principal" and l.criado_em for l in logs))

    async def test_estado_repetido_e_inexistente(self):
        rota = await self.criar_rota()

        status, corpo = await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}/reativar")
        self.assertEqual((status, corpo["error"]["code"]), (409, "CONFLICT"))
        await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}/inativar")
        status, corpo = await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}/inativar")
        self.assertEqual((status, corpo["error"]["code"]), (409, "CONFLICT"))
        for acao in ("inativar", "reativar"):
            status, _ = await self.requisitar("PATCH", f"/rotas-principais/999/{acao}")
            self.assertEqual(status, 404)

    async def test_reativar_com_vinculo_inativo_retorna_409_sem_alterar_nem_logar(self):
        from src.modulos.crud_basicos.domain.entities.bairro import BairroORM

        rota = await self.criar_rota()
        await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}/inativar")
        self.session.query(BairroORM).filter_by(bairro_id=BAIRRO_CENTRO).update({"ativo": False})
        self.session.commit()
        logs_antes = len(self.logs())

        status, corpo = await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}/reativar")

        self.assertEqual(status, 409)
        self.assertEqual(corpo["error"]["code"], "CONFLICT")
        self.assertEqual(
            corpo["error"]["message"],
            "Esta rota possui bairro ou faculdade inativo e não pode ser reativada. "
            "Atualize os vínculos antes.",
        )
        _, depois = await self.requisitar("GET", f"/rotas-principais/{rota['id']}")
        self.assertFalse(depois["ativo"])
        self.assertEqual(len(self.logs()), logs_antes)

    async def test_fluxo_bairro_inativado_reativar_409_patch_em_rota_inativa_reativar_200(self):
        from src.modulos.crud_basicos.domain.entities.bairro import BairroORM

        rota = await self.criar_rota()
        await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}/inativar")
        self.session.query(BairroORM).filter_by(bairro_id=BAIRRO_CENTRO).update({"ativo": False})
        self.session.commit()

        status, _ = await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}/reativar")
        self.assertEqual(status, 409)

        status, corpo = await self.requisitar(
            "PATCH", f"/rotas-principais/{rota['id']}", {"bairros_ids": [BAIRRO_CAMPO_VELHO]}
        )
        self.assertEqual(status, 200)
        self.assertFalse(corpo["data"]["ativo"])  # a edição não reativa a rota
        self.assertEqual([b["id"] for b in corpo["data"]["bairros"]], [BAIRRO_CAMPO_VELHO])

        status, corpo = await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}/reativar")
        self.assertEqual(status, 200)
        self.assertTrue(corpo["data"]["ativo"])
        self.assertEqual(
            [l.acao for l in self.logs()], ["CRIAR", "INATIVAR", "EDITAR", "REATIVAR"]
        )

    async def test_criterio_5_agendamento_futuro_bloqueia_com_409_sem_alterar_nem_logar(self):
        rota = await self.criar_rota()
        self.app.dependency_overrides[rota_principal_routes.get_repository] = (
            lambda: RotaPrincipalRepository(self.session, agendamentos_futuros_checker=lambda _: True)
        )
        logs_antes = len(self.logs())

        status, corpo = await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}/inativar")

        self.assertEqual(status, 409)
        self.assertEqual(corpo["error"]["code"], "CONFLICT")
        self.assertEqual(corpo["error"]["message"], MENSAGEM_AGENDAMENTOS)
        _, depois = await self.requisitar("GET", f"/rotas-principais/{rota['id']}")
        self.assertTrue(depois["ativo"])
        self.assertEqual(len(self.logs()), logs_antes)

    async def test_criterio_5_sem_agendamento_futuro_inativa_e_grava_log(self):
        rota = await self.criar_rota()
        self.app.dependency_overrides[rota_principal_routes.get_repository] = (
            lambda: RotaPrincipalRepository(self.session, agendamentos_futuros_checker=lambda _: False)
        )

        status, corpo = await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}/inativar")

        self.assertEqual(status, 200)
        self.assertFalse(corpo["data"]["ativo"])
        self.assertEqual([l.acao for l in self.logs()][-1], "INATIVAR")

    async def test_falhar_aberto_sem_checker_injetado_nao_bloqueia(self):
        rota = await self.criar_rota()

        status, _ = await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}/inativar")

        self.assertEqual(status, 200)


class BloqueioPorComplementaresAtivasTest(RotaPrincipalHttpTestBase):
    def inserir_complementar(self, rota_id, ativo=True):
        self.session.add(
            RotaComplementarORM(
                rota_principal_id=rota_id, nome="Van 2 - Bairro Novo",
                horario_saida=time(6, 0), ponto_conexao="Trevo do Bairro Novo", ativo=ativo,
            )
        )
        self.session.commit()

    async def test_complementar_ativa_bloqueia_a_inativacao_com_409_sem_alterar_nem_logar(self):
        rota = await self.criar_rota()
        self.inserir_complementar(rota["id"])
        logs_antes = len(self.logs())

        status, corpo = await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}/inativar")

        self.assertEqual(status, 409)
        self.assertEqual(corpo["error"]["code"], "CONFLICT")
        self.assertEqual(
            corpo["error"]["message"],
            "Esta rota possui rotas complementares ativas e não pode ser inativada. "
            "Inative ou reassocie as complementares antes.",
        )
        _, depois = await self.requisitar("GET", f"/rotas-principais/{rota['id']}")
        self.assertTrue(depois["ativo"])
        self.assertEqual(len(self.logs()), logs_antes)

    async def test_complementar_inativa_nao_impede_a_inativacao(self):
        rota = await self.criar_rota()
        self.inserir_complementar(rota["id"], ativo=False)

        status, corpo = await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}/inativar")

        self.assertEqual(status, 200)
        self.assertFalse(corpo["data"]["ativo"])
        self.assertEqual([l.acao for l in self.logs()][-1], "INATIVAR")


class BloqueioDeBaseVinculadaTest(RotaPrincipalHttpTestBase):
    async def test_bairro_de_rota_ativa_nao_pode_ser_inativado_via_http(self):
        rota = await self.criar_rota()

        status, corpo = await self.requisitar("PATCH", f"/bairros/{BAIRRO_CENTRO}/inativar")
        self.assertEqual(status, 409)
        self.assertIn("pertence a uma rota ativa", corpo["error"]["message"])

        await self.requisitar("PATCH", f"/rotas-principais/{rota['id']}/inativar")
        status, _ = await self.requisitar("PATCH", f"/bairros/{BAIRRO_CENTRO}/inativar")
        self.assertEqual(status, 200)

    async def test_faculdade_da_ida_ou_da_volta_de_rota_ativa_nao_pode_ser_inativada_via_http(self):
        await self.criar_rota(faculdades_ida_ids=[UFC], faculdades_volta_ids=[IFCE])

        for faculdade_id in (UFC, IFCE):
            with self.subTest(faculdade_id=faculdade_id):
                status, corpo = await self.requisitar("PATCH", f"/faculdades/{faculdade_id}/inativar")
                self.assertEqual(status, 409)
                self.assertIn("pertence a uma rota ativa", corpo["error"]["message"])
                status, corpo = await self.requisitar(
                    "PATCH", f"/faculdades/{faculdade_id}", {"ativo": False}
                )
                self.assertEqual(status, 409)

        status, _ = await self.requisitar("PATCH", f"/faculdades/{UECE}/inativar")
        self.assertEqual(status, 200)


if __name__ == "__main__":
    unittest.main()
