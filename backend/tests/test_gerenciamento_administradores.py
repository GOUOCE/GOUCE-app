import unittest
from types import SimpleNamespace

from src.modulos.usuarios.application.dtos.administrador_dto import CriarAdministradorDTO
from src.modulos.usuarios.application.use_cases.gerenciar_administradores_use_case import (
    AdministradorEmailEnvioError,
    AdministradorValidationError,
    AdministradorNaoEncontradoError,
    GerenciarAdministradoresUseCase,
)
from src.shared.validators.senha_validator import SenhaValidator


class FakeHasher:
    def hash(self, senha):
        return f"hash:{senha}"


class FakeRepository:
    def __init__(self):
        self.criacao = None
        self.atualizacao = None
        self.remocao = None

    def email_em_uso(self, email, ignorar_usuario_id=None):
        return False

    def criar(self, nome, email, senha_hash):
        self.criacao = (nome, email, senha_hash)
        return (SimpleNamespace(id=1, nome_completo=nome, email=email, data_criacao=None), SimpleNamespace(is_administrador_ativo=True))

    def atualizar(self, administrador_id, nome, email):
        self.atualizacao = (administrador_id, nome, email)
        return None

    def inativar(self, administrador_id, usuario_executor_id):
        return None

    def remover_criacao(self, administrador_id):
        self.remocao = administrador_id


class FakeEmailService:
    def __init__(self, resultado=True):
        self.resultado = resultado
        self.envio = None

    def enviar_senha_temporaria(self, email_destino, nome_usuario, senha):
        self.envio = (email_destino, nome_usuario, senha)
        return self.resultado


class GerenciamentoAdministradoresTest(unittest.TestCase):
    def test_criacao_gera_senha_automaticamente(self):
        repository = FakeRepository()
        use_case = GerenciarAdministradoresUseCase(repository, FakeHasher())
        email_service = FakeEmailService()

        use_case.criar("Admin Sistema", "ADMIN@EXEMPLO.COM", email_service=email_service)

        self.assertEqual(repository.criacao[0:2], ("Admin Sistema", "admin@exemplo.com"))
        self.assertTrue(repository.criacao[2].startswith("hash:"))
        self.assertTrue(SenhaValidator().validar_senha(email_service.envio[2])[0])

    def test_dto_de_criacao_nao_possui_campo_senha(self):
        dto = CriarAdministradorDTO(nome="Admin Sistema", email="admin@example.com")

        self.assertFalse(hasattr(dto, "senha"))

    def test_falha_no_envio_remove_administrador_criado(self):
        repository = FakeRepository()
        use_case = GerenciarAdministradoresUseCase(repository, FakeHasher())

        with self.assertRaises(AdministradorEmailEnvioError):
            use_case.criar(
                "Admin Sistema",
                "admin@example.com",
                email_service=FakeEmailService(resultado=False),
            )

        self.assertEqual(repository.remocao, 1)

    def test_atualizacao_de_administrador_inexistente_falha(self):
        use_case = GerenciarAdministradoresUseCase(FakeRepository(), FakeHasher())

        with self.assertRaises(AdministradorNaoEncontradoError):
            use_case.atualizar(99, "Novo Nome", None)

    def test_criacao_rejeita_nome_com_numero(self):
        use_case = GerenciarAdministradoresUseCase(FakeRepository(), FakeHasher())

        with self.assertRaises(AdministradorValidationError):
            use_case.criar("Admin 123", "admin@example.com", None)

    def test_criacao_rejeita_primeiro_nome_com_menos_de_tres_letras(self):
        use_case = GerenciarAdministradoresUseCase(FakeRepository(), FakeHasher())

        with self.assertRaises(AdministradorValidationError):
            use_case.criar("A B", "admin@example.com")

    def test_atualizacao_exige_campo(self):
        use_case = GerenciarAdministradoresUseCase(FakeRepository(), FakeHasher())

        with self.assertRaises(AdministradorValidationError):
            use_case.atualizar(1, None, None)

    def test_inativacao_bloqueia_propria_conta_antes_do_repository(self):
        repository = FakeRepository()
        use_case = GerenciarAdministradoresUseCase(repository, FakeHasher())

        with self.assertRaises(AdministradorValidationError):
            use_case.inativar(1, 1)

    def test_inativacao_de_administrador_inexistente_falha(self):
        use_case = GerenciarAdministradoresUseCase(FakeRepository(), FakeHasher())

        with self.assertRaises(AdministradorNaoEncontradoError):
            use_case.inativar(2, 1)


if __name__ == "__main__":
    unittest.main()
