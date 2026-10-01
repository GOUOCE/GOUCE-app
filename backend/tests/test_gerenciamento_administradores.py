import unittest
from types import SimpleNamespace

from src.modulos.usuarios.application.use_cases.gerenciar_administradores_use_case import (
    AdministradorValidationError,
    AdministradorNaoEncontradoError,
    GerenciarAdministradoresUseCase,
)


class FakeHasher:
    def hash(self, senha):
        return f"hash:{senha}"


class FakeRepository:
    def __init__(self):
        self.criacao = None
        self.atualizacao = None

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


class GerenciamentoAdministradoresTest(unittest.TestCase):
    def test_criacao_gera_senha_quando_nao_informada(self):
        repository = FakeRepository()
        use_case = GerenciarAdministradoresUseCase(repository, FakeHasher())

        use_case.criar("Admin Sistema", "ADMIN@EXEMPLO.COM", None)

        self.assertEqual(repository.criacao[0:2], ("Admin Sistema", "admin@exemplo.com"))
        self.assertTrue(repository.criacao[2].startswith("hash:"))

    def test_atualizacao_de_administrador_inexistente_falha(self):
        use_case = GerenciarAdministradoresUseCase(FakeRepository(), FakeHasher())

        with self.assertRaises(AdministradorNaoEncontradoError):
            use_case.atualizar(99, "Novo Nome", None)

    def test_criacao_rejeita_nome_com_numero(self):
        use_case = GerenciarAdministradoresUseCase(FakeRepository(), FakeHasher())

        with self.assertRaises(AdministradorValidationError):
            use_case.criar("Admin 123", "admin@example.com", None)

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
