import json
import os
import unittest
from urllib.parse import urlsplit

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://test:test@localhost:5432/test",
)

from fastapi import FastAPI

from src.modulos.motoristas.application.use_cases.gerenciar_motoristas_use_case import (
    MotoristaComAlocacoesPendentesError,
    MotoristaNaoEncontradoError,
    MotoristaValidationError,
)
from src.modulos.motoristas.infrastructure.repositories.motorista_repository import (
    MotoristaTelefoneEmUsoError,
)
from src.modulos.motoristas.interface.http import motorista_routes
from src.shared.auth.dependencies import get_current_user
from src.shared.enums.cargo_enum import CargoEnum


class FakeMotoristaUseCase:
    def __init__(self):
        self.motoristas = {
            1: {
                "id": 1,
                "nome": "Maria da Silva",
                "telefone": "85999990000",
                "ativo": True,
            },
            2: {
                "id": 2,
                "nome": "João de Souza",
                "telefone": "85888880000",
                "ativo": False,
            },
        }
        self.criar_chamadas = []
        self.listar_chamadas = []
        self.buscar_chamadas = []
        self.atualizar_chamadas = []
        self.inativar_chamadas = []
        self.reativar_chamadas = []
        self.criar_error = None
        self.atualizar_error = None
        self.inativar_error = None

    def criar(self, nome, telefone):
        self.criar_chamadas.append((nome, telefone))
        if self.criar_error is not None:
            raise self.criar_error
        return {
            "id": 3,
            "nome": nome,
            "telefone": telefone,
            "ativo": True,
        }

    def listar(self, incluir_inativos=False, nome=None):
        self.listar_chamadas.append((incluir_inativos, nome))
        resultados = list(self.motoristas.values())
        if not incluir_inativos:
            resultados = [item for item in resultados if item["ativo"]]
        if nome:
            termo = nome.casefold()
            resultados = [item for item in resultados if termo in item["nome"].casefold()]
        return resultados

    def buscar(self, motorista_id):
        self.buscar_chamadas.append(motorista_id)
        resultado = self.motoristas.get(motorista_id)
        if resultado is None:
            raise MotoristaNaoEncontradoError("Motorista não encontrado.")
        return resultado

    def atualizar(self, motorista_id, nome, telefone):
        self.atualizar_chamadas.append((motorista_id, nome, telefone))
        if self.atualizar_error is not None:
            raise self.atualizar_error
        if nome is None and telefone is None:
            raise MotoristaValidationError(
                "motorista",
                "Informe ao menos um campo para atualização.",
            )
        resultado = self.motoristas.get(motorista_id)
        if resultado is None:
            raise MotoristaNaoEncontradoError("Motorista não encontrado.")
        if nome is not None:
            resultado["nome"] = nome
        if telefone is not None:
            resultado["telefone"] = telefone
        return resultado

    def inativar(self, motorista_id, usuario_executor_id):
        self.inativar_chamadas.append((motorista_id, usuario_executor_id))
        if self.inativar_error is not None:
            raise self.inativar_error
        resultado = self.motoristas.get(motorista_id)
        if resultado is None:
            raise MotoristaNaoEncontradoError("Motorista não encontrado.")
        resultado["ativo"] = False
        return resultado

    def reativar(self, motorista_id, usuario_executor_id):
        self.reativar_chamadas.append((motorista_id, usuario_executor_id))
        resultado = self.motoristas.get(motorista_id)
        if resultado is None:
            raise MotoristaNaoEncontradoError("Motorista não encontrado.")
        resultado["ativo"] = True
        return resultado


class ASGIResponse:
    def __init__(self, status_code, body):
        self.status_code = status_code
        self._body = body

    def json(self):
        return json.loads(self._body.decode("utf-8"))


async def asgi_request(app, method, path, body=None):
    parsed_path = urlsplit(path)
    request_body = b"" if body is None else json.dumps(body).encode("utf-8")
    request_headers = [
        (b"content-type", b"application/json"),
        (b"content-length", str(len(request_body)).encode("ascii")),
    ]
    messages = []
    request_sent = False

    async def receive():
        nonlocal request_sent
        if request_sent:
            return {"type": "http.disconnect"}
        request_sent = True
        return {
            "type": "http.request",
            "body": request_body,
            "more_body": False,
        }

    async def send(message):
        messages.append(message)

    scope = {
        "type": "http",
        "asgi": {"version": "3.0", "spec_version": "2.3"},
        "http_version": "1.1",
        "method": method,
        "scheme": "http",
        "path": parsed_path.path,
        "raw_path": parsed_path.path.encode("utf-8"),
        "query_string": parsed_path.query.encode("ascii"),
        "headers": request_headers,
        "client": ("testclient", 50000),
        "server": ("testserver", 80),
        "root_path": "",
        "state": {},
    }

    await app(scope, receive, send)

    start = next(message for message in messages if message["type"] == "http.response.start")
    response_body = b"".join(
        message.get("body", b"")
        for message in messages
        if message["type"] == "http.response.body"
    )
    return ASGIResponse(start["status"], response_body)


class MotoristaRoutesTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(motorista_routes.router)
        self.use_case = FakeMotoristaUseCase()
        self.app.dependency_overrides[motorista_routes.get_use_case] = (
            lambda: self.use_case
        )
        self.app.dependency_overrides[get_current_user] = self._admin_context

    def tearDown(self):
        self.app.dependency_overrides.clear()

    @staticmethod
    def _admin_context():
        return {
            "sub": "42",
            "type": "access",
            "role": CargoEnum.ADMINISTRADOR.value,
            "current_role": CargoEnum.ADMINISTRADOR.value,
            "current_roles": [CargoEnum.ADMINISTRADOR.value],
            "current_user_id": 42,
        }

    @staticmethod
    def _student_context():
        return {
            "sub": "7",
            "type": "access",
            "role": CargoEnum.ALUNO.value,
            "current_role": CargoEnum.ALUNO.value,
            "current_roles": [CargoEnum.ALUNO.value],
            "current_user_id": 7,
        }

    @staticmethod
    def assert_error_response(test_case, body, code):
        test_case.assertIs(body["success"], False)
        test_case.assertEqual(body["error"]["code"], code)
        test_case.assertTrue(body["error"]["message"])

    async def test_cadastro_com_administrador_retorna_201_e_contrato_publico(self):
        response = await asgi_request(
            self.app,
            "POST",
            "/motoristas",
            {"nome": "Ana Lima", "telefone": "85977770000"},
        )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertIs(body["success"], True)
        self.assertEqual(body["message"], "Motorista cadastrado com sucesso.")
        self.assertEqual(
            set(body["data"]),
            {"id", "nome", "telefone", "ativo"},
        )
        self.assertEqual(
            self.use_case.criar_chamadas,
            [("Ana Lima", "85977770000")],
        )

    async def test_cadastro_com_telefone_duplicado_retorna_409_e_mensagem_exata(self):
        self.use_case.criar_error = MotoristaTelefoneEmUsoError(
            "Este profissional já está registrado."
        )

        response = await asgi_request(
            self.app,
            "POST",
            "/motoristas",
            {"nome": "Ana Lima", "telefone": "85977770000"},
        )

        self.assertEqual(response.status_code, 409)
        body = response.json()
        self.assert_error_response(self, body, "CONFLICT")
        self.assertEqual(
            body["error"]["message"],
            "Este profissional já está registrado.",
        )

    async def test_listagem_por_padrao_retorna_somente_ativos(self):
        response = await asgi_request(self.app, "GET", "/motoristas")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            [
                {
                    "id": 1,
                    "nome": "Maria da Silva",
                    "telefone": "85999990000",
                    "ativo": True,
                }
            ],
        )
        self.assertEqual(self.use_case.listar_chamadas, [(False, None)])

    async def test_listagem_com_incluir_inativos_retorna_status_de_cada_item(self):
        response = await asgi_request(
            self.app,
            "GET",
            "/motoristas?incluir_inativos=true",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [(item["id"], item["ativo"]) for item in response.json()],
            [(1, True), (2, False)],
        )
        self.assertEqual(self.use_case.listar_chamadas, [(True, None)])

    async def test_listagem_aplica_busca_por_nome_com_inativos(self):
        response = await asgi_request(
            self.app,
            "GET",
            "/motoristas?incluir_inativos=true&nome=jo%C3%A3o",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.json()], [2])
        self.assertEqual(self.use_case.listar_chamadas, [(True, "joão")])

    async def test_listagem_com_incluir_inativos_invalido_retorna_422(self):
        response = await asgi_request(
            self.app,
            "GET",
            "/motoristas?incluir_inativos=talvez",
        )

        self.assertEqual(response.status_code, 422)
        self.assert_error_response(self, response.json(), "REQUEST_VALIDATION_ERROR")
        self.assertEqual(self.use_case.listar_chamadas, [])

    async def test_consulta_por_id_retorna_200(self):
        response = await asgi_request(self.app, "GET", "/motoristas/1")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["nome"], "Maria da Silva")
        self.assertNotIn("data_criacao", response.json())
        self.assertNotIn("nome_completo", response.json())

    async def test_consulta_de_motorista_inexistente_retorna_404(self):
        response = await asgi_request(self.app, "GET", "/motoristas/99")

        self.assertEqual(response.status_code, 404)
        self.assert_error_response(self, response.json(), "RESOURCE_NOT_FOUND")

    async def test_edicao_parcial_retorna_200(self):
        response = await asgi_request(
            self.app,
            "PATCH",
            "/motoristas/1",
            {"telefone": "85911112222"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Motorista alterado com sucesso.")
        self.assertEqual(response.json()["data"]["telefone"], "85911112222")
        self.assertEqual(
            self.use_case.atualizar_chamadas,
            [(1, None, "85911112222")],
        )

    async def test_edicao_com_telefone_duplicado_retorna_409_e_mensagem_exata(self):
        self.use_case.atualizar_error = MotoristaTelefoneEmUsoError(
            "Este profissional já está registrado."
        )

        response = await asgi_request(
            self.app,
            "PATCH",
            "/motoristas/1",
            {"telefone": "(85) 99999-0000"},
        )

        self.assertEqual(response.status_code, 409)
        body = response.json()
        self.assert_error_response(self, body, "CONFLICT")
        self.assertEqual(
            body["error"]["message"],
            "Este profissional já está registrado.",
        )

    async def test_edicao_sem_campo_retorna_422(self):
        response = await asgi_request(self.app, "PATCH", "/motoristas/1", {})

        self.assertEqual(response.status_code, 422)
        body = response.json()
        self.assert_error_response(self, body, "REQUEST_VALIDATION_ERROR")
        self.assertEqual(
            body["error"]["details"],
            [
                {
                    "field": "motorista",
                    "message": "Informe ao menos um campo para atualização.",
                }
            ],
        )

    async def test_cadastro_com_campos_vazios_retorna_erro_por_campo(self):
        esperado = [
            {"field": "nome", "message": "Nome Completo é obrigatório."},
            {"field": "telefone", "message": "Telefone é obrigatório."},
        ]
        for payload in (
            {"nome": "", "telefone": ""},
            {"nome": "   ", "telefone": "   "},
            {},
            {"nome": None, "telefone": None},
        ):
            with self.subTest(payload=payload):
                response = await asgi_request(
                    self.app,
                    "POST",
                    "/motoristas",
                    payload,
                )

                self.assertEqual(response.status_code, 422)
                body = response.json()
                self.assert_error_response(self, body, "REQUEST_VALIDATION_ERROR")
                self.assertEqual(body["error"]["details"], esperado)

        self.assertEqual(self.use_case.criar_chamadas, [])

    async def test_edicao_com_campos_vazios_retorna_erro_por_campo(self):
        response = await asgi_request(
            self.app,
            "PATCH",
            "/motoristas/1",
            {"nome": " ", "telefone": ""},
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(
            response.json()["error"]["details"],
            [
                {"field": "nome", "message": "Nome Completo é obrigatório."},
                {"field": "telefone", "message": "Telefone é obrigatório."},
            ],
        )
        self.assertEqual(self.use_case.atualizar_chamadas, [])

    async def test_cadastro_com_tamanho_e_tipo_invalidos_retorna_erro_por_campo(self):
        response = await asgi_request(
            self.app,
            "POST",
            "/motoristas",
            {"nome": "A" * 151, "telefone": 85999990000},
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(
            response.json()["error"]["details"],
            [
                {
                    "field": "nome",
                    "message": "Nome Completo deve ter no máximo 150 caracteres.",
                },
                {"field": "telefone", "message": "Telefone deve ser um texto válido."},
            ],
        )

    async def test_payload_invalido_retorna_422_padronizado(self):
        response = await asgi_request(
            self.app,
            "POST",
            "/motoristas",
            {"nome": "Ana Lima", "cpf": "12345678909"},
        )

        self.assertEqual(response.status_code, 422)
        body = response.json()
        self.assert_error_response(self, body, "REQUEST_VALIDATION_ERROR")
        self.assertEqual(
            body["error"]["details"],
            [
                {"field": "telefone", "message": "Telefone é obrigatório."},
                {"field": "cpf", "message": "Campo não permitido."},
            ],
        )
        self.assertEqual(self.use_case.criar_chamadas, [])

    async def test_cadastro_com_telefone_sem_digitos_retorna_422(self):
        response = await asgi_request(
            self.app,
            "POST",
            "/motoristas",
            {"nome": "Ana Lima", "telefone": "abc"},
        )

        self.assertEqual(response.status_code, 422)
        self.assert_error_response(
            self,
            response.json(),
            "REQUEST_VALIDATION_ERROR",
        )
        self.assertEqual(
            response.json()["error"]["details"],
            [
                {
                    "field": "telefone",
                    "message": "Telefone deve conter ao menos um dígito.",
                }
            ],
        )
        self.assertEqual(self.use_case.criar_chamadas, [])

    async def test_edicao_com_telefone_sem_digitos_retorna_422(self):
        response = await asgi_request(
            self.app,
            "PATCH",
            "/motoristas/1",
            {"telefone": "abc"},
        )

        self.assertEqual(response.status_code, 422)
        self.assert_error_response(
            self,
            response.json(),
            "REQUEST_VALIDATION_ERROR",
        )
        self.assertEqual(
            response.json()["error"]["details"],
            [
                {
                    "field": "telefone",
                    "message": "Telefone deve conter ao menos um dígito.",
                }
            ],
        )
        self.assertEqual(self.use_case.atualizar_chamadas, [])

    async def test_id_invalido_retorna_422_padronizado(self):
        response = await asgi_request(self.app, "GET", "/motoristas/invalido")

        self.assertEqual(response.status_code, 422)
        self.assert_error_response(self, response.json(), "REQUEST_VALIDATION_ERROR")

    async def test_reativacao_retorna_200_e_usa_executor_autenticado(self):
        response = await asgi_request(self.app, "PATCH", "/motoristas/2/reativar")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Motorista reativado com sucesso.")
        self.assertTrue(response.json()["data"]["ativo"])
        self.assertEqual(self.use_case.reativar_chamadas, [(2, 42)])

    async def test_inativacao_retorna_200_e_usa_executor_autenticado(self):
        response = await asgi_request(
            self.app,
            "PATCH",
            "/motoristas/1/inativar",
            {"usuario_executor_id": 999},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Motorista inativado com sucesso.")
        self.assertFalse(response.json()["data"]["ativo"])
        self.assertEqual(self.use_case.inativar_chamadas, [(1, 42)])

    async def test_inativacao_com_alocacoes_futuras_retorna_409_e_mensagem_exata(self):
        mensagem = (
            "Este profissional possui alocações pendentes e não pode ser "
            "inativado no momento."
        )
        self.use_case.inativar_error = MotoristaComAlocacoesPendentesError(mensagem)

        response = await asgi_request(self.app, "PATCH", "/motoristas/1/inativar")

        self.assertEqual(response.status_code, 409)
        body = response.json()
        self.assert_error_response(self, body, "CONFLICT")
        self.assertEqual(body["error"]["message"], mensagem)
        self.assertTrue(self.use_case.motoristas[1]["ativo"])

    async def test_inativacao_de_motorista_inexistente_retorna_404(self):
        response = await asgi_request(self.app, "PATCH", "/motoristas/99/inativar")

        self.assertEqual(response.status_code, 404)
        self.assert_error_response(self, response.json(), "RESOURCE_NOT_FOUND")

    async def test_reativacao_de_motorista_inexistente_retorna_404(self):
        response = await asgi_request(self.app, "PATCH", "/motoristas/99/reativar")

        self.assertEqual(response.status_code, 404)
        self.assert_error_response(self, response.json(), "RESOURCE_NOT_FOUND")

    async def test_sem_autenticacao_retorna_401_padronizado(self):
        self.app.dependency_overrides.pop(get_current_user, None)

        response = await asgi_request(self.app, "GET", "/motoristas")

        self.assertEqual(response.status_code, 401)
        self.assert_error_response(self, response.json(), "UNAUTHORIZED")

    async def test_perfil_nao_administrativo_retorna_403(self):
        self.app.dependency_overrides[get_current_user] = self._student_context

        response = await asgi_request(self.app, "GET", "/motoristas")

        self.assertEqual(response.status_code, 403)
        self.assert_error_response(self, response.json(), "FORBIDDEN")


if __name__ == "__main__":
    unittest.main()
