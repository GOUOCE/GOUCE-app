import os
import unittest

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://test:test@localhost:5432/test",
)

from src.modulos.motoristas.application.dtos.motorista_dto import AtualizarMotoristaDTO
from src.modulos.motoristas.application.use_cases.gerenciar_motoristas_use_case import (
    GerenciarMotoristasUseCase,
    MotoristaComAlocacoesPendentesError,
    MotoristaNaoEncontradoError,
    MotoristaValidationError,
)
from src.modulos.motoristas.infrastructure.repositories.motorista_repository import (
    MotoristaTelefoneEmUsoError,
)


class FakeRepository:
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
        self.motoristas_com_alocacoes_futuras = set()
        self.alocacoes_chamadas = []

    def criar(self, nome, telefone):
        self.criar_chamadas.append((nome, telefone))
        if self.criar_error is not None:
            raise self.criar_error
        motorista = {
            "id": 3,
            "nome": nome,
            "telefone": telefone,
            "ativo": True,
        }
        self.motoristas[motorista["id"]] = motorista
        return motorista

    def listar(self, ativo=None, nome=None):
        self.listar_chamadas.append((ativo, nome))
        resultados = list(self.motoristas.values())
        if ativo is not None:
            resultados = [item for item in resultados if item["ativo"] == ativo]
        if nome:
            termo = nome.casefold()
            resultados = [item for item in resultados if termo in item["nome"].casefold()]
        return resultados

    def buscar(self, motorista_id):
        self.buscar_chamadas.append(motorista_id)
        return self.motoristas.get(motorista_id)

    def atualizar(self, motorista_id, nome, telefone):
        self.atualizar_chamadas.append((motorista_id, nome, telefone))
        if self.atualizar_error is not None:
            raise self.atualizar_error
        motorista = self.motoristas.get(motorista_id)
        if motorista is None:
            return None
        if nome is not None:
            motorista["nome"] = nome
        if telefone is not None:
            motorista["telefone"] = telefone
        return motorista

    def possui_alocacoes_futuras(self, motorista_id):
        self.alocacoes_chamadas.append(motorista_id)
        return motorista_id in self.motoristas_com_alocacoes_futuras

    def inativar(self, motorista_id, usuario_executor_id):
        self.inativar_chamadas.append((motorista_id, usuario_executor_id))
        motorista = self.motoristas.get(motorista_id)
        if motorista is None:
            return None
        motorista["ativo"] = False
        return motorista

    def reativar(self, motorista_id, usuario_executor_id):
        self.reativar_chamadas.append((motorista_id, usuario_executor_id))
        motorista = self.motoristas.get(motorista_id)
        if motorista is None:
            return None
        motorista["ativo"] = True
        return motorista


class GerenciarMotoristasUseCaseTest(unittest.TestCase):
    def setUp(self):
        self.repository = FakeRepository()
        self.use_case = GerenciarMotoristasUseCase(self.repository)

    def test_criar_normaliza_dados_e_delega_ao_repository(self):
        resultado = self.use_case.criar("  Ana Lima  ", " 85977770000 ")

        self.assertEqual(resultado["nome"], "Ana Lima")
        self.assertEqual(resultado["telefone"], "85977770000")
        self.assertEqual(
            self.repository.criar_chamadas,
            [("Ana Lima", "85977770000")],
        )

    def test_criar_exige_nome_e_telefone_nao_vazios(self):
        with self.subTest(campo="nome ausente"):
            with self.assertRaises(MotoristaValidationError):
                self.use_case.criar(None, "85999990000")

        with self.subTest(campo="nome vazio"):
            with self.assertRaises(MotoristaValidationError):
                self.use_case.criar("   ", "85999990000")

        with self.subTest(campo="telefone ausente"):
            with self.assertRaises(MotoristaValidationError):
                self.use_case.criar("Maria da Silva", None)

        with self.subTest(campo="telefone vazio"):
            with self.assertRaises(MotoristaValidationError):
                self.use_case.criar("Maria da Silva", "   ")

        self.assertEqual(self.repository.criar_chamadas, [])

    def test_criar_rejeita_telefone_sem_digitos(self):
        with self.assertRaisesRegex(
            MotoristaValidationError,
            "Telefone deve conter ao menos um dígito",
        ):
            self.use_case.criar("Maria da Silva", "abc")

        self.assertEqual(self.repository.criar_chamadas, [])

    def test_criar_rejeita_tipos_nao_textuais(self):
        with self.assertRaises(MotoristaValidationError):
            self.use_case.criar(123, "85999990000")

        with self.assertRaises(MotoristaValidationError):
            self.use_case.criar("Maria da Silva", 85999990000)

    def test_criar_propagada_conflito_de_telefone_do_repository(self):
        self.repository.criar_error = MotoristaTelefoneEmUsoError(
            "Este profissional já está registrado."
        )

        with self.assertRaisesRegex(
            MotoristaTelefoneEmUsoError,
            "Este profissional já está registrado\\.",
        ):
            self.use_case.criar("Maria da Silva", "85999990000")

    def test_listar_por_padrao_retorna_somente_ativos(self):
        resultado = self.use_case.listar()

        self.assertEqual([item["id"] for item in resultado], [1])
        self.assertTrue(all(item["ativo"] for item in resultado))
        self.assertEqual(self.repository.listar_chamadas, [(True, None)])

    def test_listar_com_incluir_inativos_retorna_todos_com_status(self):
        resultado = self.use_case.listar(incluir_inativos=True)

        self.assertEqual(
            [(item["id"], item["ativo"]) for item in resultado],
            [(1, True), (2, False)],
        )
        self.assertEqual(self.repository.listar_chamadas, [(None, None)])

    def test_listar_busca_parcial_por_nome_sem_diferenciar_caixa(self):
        with self.subTest(caso="inativo oculto por padrão"):
            self.assertEqual(self.use_case.listar(nome="  JOÃO "), [])

        with self.subTest(caso="inativo incluído"):
            resultado = self.use_case.listar(incluir_inativos=True, nome="  joão ")
            self.assertEqual([item["id"] for item in resultado], [2])

        with self.subTest(caso="trecho do nome"):
            resultado = self.use_case.listar(nome="silv")
            self.assertEqual([item["id"] for item in resultado], [1])

        self.assertEqual(
            self.repository.listar_chamadas,
            [(True, "JOÃO"), (None, "joão"), (True, "silv")],
        )

    def test_listar_aceita_busca_vazia_sem_criar_regra_extra(self):
        self.use_case.listar(nome="   ")

        self.assertEqual(self.repository.listar_chamadas, [(True, "")])

    def test_listar_rejeita_nome_nao_textual(self):
        with self.assertRaises(MotoristaValidationError):
            self.use_case.listar(nome=123)

        self.assertEqual(self.repository.listar_chamadas, [])

    def test_buscar_retorna_motorista_existente(self):
        resultado = self.use_case.buscar(1)

        self.assertEqual(resultado["nome"], "Maria da Silva")
        self.assertEqual(self.repository.buscar_chamadas, [1])

    def test_buscar_trata_motorista_inexistente(self):
        with self.assertRaises(MotoristaNaoEncontradoError):
            self.use_case.buscar(99)

    def test_operacoes_rejeitam_ids_invalidos(self):
        for valor in (None, 0, -1, True, "1"):
            with self.subTest(valor=valor):
                with self.assertRaises(MotoristaValidationError):
                    self.use_case.buscar(valor)

    def test_atualizar_exige_pelo_menos_um_campo_no_use_case(self):
        dto = AtualizarMotoristaDTO()
        self.assertIsNone(dto.nome)
        self.assertIsNone(dto.telefone)

        with self.assertRaisesRegex(
            MotoristaValidationError,
            "Informe ao menos um campo",
        ):
            self.use_case.atualizar(1)

        self.assertEqual(self.repository.atualizar_chamadas, [])

    def test_atualizar_rejeita_campos_enviados_vazios(self):
        with self.assertRaises(MotoristaValidationError):
            self.use_case.atualizar(1, nome="   ")

        with self.assertRaises(MotoristaValidationError):
            self.use_case.atualizar(1, telefone="   ")

        self.assertEqual(self.repository.atualizar_chamadas, [])

    def test_atualizar_rejeita_telefone_sem_digitos(self):
        with self.assertRaisesRegex(
            MotoristaValidationError,
            "Telefone deve conter ao menos um dígito",
        ):
            self.use_case.atualizar(1, telefone="abc")

        self.assertEqual(self.repository.atualizar_chamadas, [])

    def test_atualizar_parcialmente_nome_e_telefone(self):
        resultado = self.use_case.atualizar(
            1,
            nome="  Maria Oliveira ",
        )

        self.assertEqual(resultado["nome"], "Maria Oliveira")
        self.assertEqual(resultado["telefone"], "85999990000")
        self.assertEqual(
            self.repository.atualizar_chamadas,
            [(1, "Maria Oliveira", None)],
        )

    def test_atualizar_trata_motorista_inexistente(self):
        with self.assertRaises(MotoristaNaoEncontradoError):
            self.use_case.atualizar(99, nome="Novo Nome")

    def test_atualizar_propagada_conflito_de_telefone_do_repository(self):
        self.repository.atualizar_error = MotoristaTelefoneEmUsoError(
            "Este profissional já está registrado."
        )

        with self.assertRaises(MotoristaTelefoneEmUsoError):
            self.use_case.atualizar(1, telefone="85988880000")

    def test_reativar_delega_id_do_motorista_e_executor(self):
        resultado = self.use_case.reativar(2, usuario_executor_id=10)

        self.assertTrue(resultado["ativo"])
        self.assertEqual(self.repository.reativar_chamadas, [(2, 10)])

    def test_reativar_trata_motorista_inexistente(self):
        with self.assertRaises(MotoristaNaoEncontradoError):
            self.use_case.reativar(99, usuario_executor_id=10)

    def test_inativar_bloqueia_motorista_com_alocacoes_futuras(self):
        self.repository.motoristas_com_alocacoes_futuras.add(1)

        with self.assertRaises(MotoristaComAlocacoesPendentesError) as contexto:
            self.use_case.inativar(1, usuario_executor_id=10)

        self.assertEqual(
            str(contexto.exception),
            "Este profissional possui alocações pendentes e não pode ser "
            "inativado no momento.",
        )
        self.assertEqual(self.repository.alocacoes_chamadas, [1])
        self.assertEqual(self.repository.inativar_chamadas, [])
        self.assertTrue(self.repository.motoristas[1]["ativo"])

    def test_inativar_motorista_sem_alocacoes_futuras(self):
        resultado = self.use_case.inativar(1, usuario_executor_id=10)

        self.assertFalse(resultado["ativo"])
        self.assertEqual(self.repository.alocacoes_chamadas, [1])
        self.assertEqual(self.repository.inativar_chamadas, [(1, 10)])

    def test_inativar_motorista_inexistente_nao_chama_repository_de_status(self):
        with self.assertRaises(MotoristaNaoEncontradoError):
            self.use_case.inativar(99, usuario_executor_id=10)

        self.assertEqual(self.repository.alocacoes_chamadas, [])
        self.assertEqual(self.repository.inativar_chamadas, [])


if __name__ == "__main__":
    unittest.main()
