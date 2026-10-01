import secrets

from src.shared.security.argon2_hasher import Argon2PasswordHasher
from src.shared.validators.email_validator import EmailValidator
from src.shared.validators.senha_validator import SenhaValidator
from src.shared.validators.string_sem_numero_validator import StringSemNumeroValidator
from src.modulos.usuarios.infrastructure.repositories.administrador_repository import (
    AdministradorJaExistenteError,
    AdministradorEmailEmUsoError,
    AlunoNaoEncontradoError,
    AdministradorRepository,
)


class AdministradorValidationError(ValueError):
    def __init__(self, field: str, message: str):
        self.field = field
        super().__init__(message)


class AdministradorNaoEncontradoError(ValueError):
    pass


class GerenciarAdministradoresUseCase:
    def __init__(
        self,
        repository: AdministradorRepository,
        hasher=None,
        email_validator=None,
        string_validator=None,
        senha_validator=None,
    ):
        self.repository = repository
        self.hasher = hasher or Argon2PasswordHasher()
        self.email_validator = email_validator or EmailValidator()
        self.string_validator = string_validator or StringSemNumeroValidator()
        self.senha_validator = senha_validator or SenhaValidator()

    def criar(self, nome: str, email: str, senha: str | None):
        nome = self._validar_nome(nome)
        email = self._validar_email(email)
        if senha is not None:
            self._validar_senha(senha)
        if self.repository.email_em_uso(email):
            raise AdministradorEmailEmUsoError

        senha = senha or secrets.token_urlsafe(18)
        try:
            return self.repository.criar(nome, email, self.hasher.hash(senha))
        except AdministradorEmailEmUsoError:
            raise

    def atualizar(self, administrador_id: int, nome: str | None, email: str | None):
        self._validar_id(administrador_id, "administrador_id")
        if nome is None and email is None:
            raise AdministradorValidationError(
                "administrador",
                "Informe ao menos um campo para atualização.",
            )
        if nome is not None:
            nome = self._validar_nome(nome)
        if email is not None:
            email = self._validar_email(email)
            if self.repository.email_em_uso(email, ignorar_usuario_id=administrador_id):
                raise AdministradorEmailEmUsoError

        resultado = self.repository.atualizar(administrador_id, nome, email)
        if not resultado:
            raise AdministradorNaoEncontradoError
        return resultado

    def promover(self, aluno_id: int | None, email: str | None):
        if aluno_id is None and email is None:
            raise AdministradorValidationError(
                "aluno_id",
                "Informe aluno_id ou email para promover um aluno.",
            )
        if aluno_id is not None and email is not None:
            raise AdministradorValidationError(
                "aluno_id",
                "Informe apenas aluno_id ou email, não os dois.",
            )
        if aluno_id is not None:
            self._validar_id(aluno_id, "aluno_id")
        if email is not None:
            email = self._validar_email(email)

        return self.repository.promover(aluno_id=aluno_id, email=email)

    def inativar(self, administrador_id: int, usuario_executor_id: int):
        self._validar_id(administrador_id, "administrador_id")
        self._validar_id(usuario_executor_id, "usuario_executor_id")
        if administrador_id == usuario_executor_id:
            raise AdministradorValidationError(
                "administrador_id",
                "Não é possível inativar a conta atualmente em uso.",
            )

        resultado = self.repository.inativar(administrador_id, usuario_executor_id)
        if not resultado:
            raise AdministradorNaoEncontradoError
        return resultado

    def _validar_nome(self, nome: str) -> str:
        nome_normalizado = self.string_validator.formatar_string_sem_numero(str(nome or ""))
        if not nome_normalizado or len(nome_normalizado) < 3:
            raise AdministradorValidationError(
                "nome",
                "Nome deve ter pelo menos 3 caracteres.",
            )
        if not self.string_validator.validar_string_sem_numero(nome_normalizado):
            raise AdministradorValidationError(
                "nome",
                "O nome deve conter apenas letras, espaços e hífen.",
            )
        return nome_normalizado

    def _validar_email(self, email: str) -> str:
        email_normalizado = str(email or "").lower().strip()
        if not self.email_validator.validar_email(email_normalizado):
            raise AdministradorValidationError("email", "Formato de e-mail inválido.")
        return email_normalizado

    def _validar_senha(self, senha: str) -> None:
        senha_valida, mensagem = self.senha_validator.validar_senha(senha)
        if not senha_valida:
            raise AdministradorValidationError("senha", mensagem)

    @staticmethod
    def _validar_id(valor: int, campo: str) -> None:
        if isinstance(valor, bool) or not isinstance(valor, int) or valor <= 0:
            raise AdministradorValidationError(campo, "ID deve ser um número inteiro positivo.")
