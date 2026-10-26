"""Casos de uso para o gerenciamento administrativo de motoristas."""

from src.modulos.motoristas.infrastructure.repositories.motorista_repository import (
    MotoristaRepository,
)
from src.shared.security.lgpd_encryption import normalizar_telefone


class MotoristaValidationError(ValueError):
    """Erro de validação de uma entrada do gerenciamento de motoristas."""

    def __init__(self, field: str, message: str):
        self.field = field
        super().__init__(message)


class MotoristaNaoEncontradoError(ValueError):
    """Indica que o motorista solicitado não existe."""


class MotoristaComAlocacoesPendentesError(ValueError):
    """Impede a inativação de motorista escalado para rotas em dias futuros."""


class GerenciarMotoristasUseCase:
    """Coordena validações de negócio e operações do repository de motoristas."""

    def __init__(self, repository: MotoristaRepository):
        self.repository = repository

    def criar(self, nome: str, telefone: str) -> dict:
        nome = self._validar_texto_obrigatorio(nome, "nome", "Nome")
        telefone = self._validar_texto_obrigatorio(
            telefone,
            "telefone",
            "Telefone",
        )
        telefone = self._validar_telefone(telefone)
        return self.repository.criar(nome, telefone)

    def listar(
        self,
        incluir_inativos: bool = False,
        nome: str | None = None,
    ) -> list[dict]:
        if nome is not None:
            if not isinstance(nome, str):
                raise MotoristaValidationError(
                    "nome",
                    "Nome deve ser um texto válido.",
                )
            nome = nome.strip()

        # Por padrão somente motoristas ativos; com ``incluir_inativos`` o
        # filtro de status é removido e cada item mantém o campo ``ativo``.
        ativo = None if incluir_inativos else True
        return self.repository.listar(ativo=ativo, nome=nome)

    def buscar(self, motorista_id: int) -> dict:
        self._validar_id(motorista_id, "motorista_id")
        resultado = self.repository.buscar(motorista_id)
        if not resultado:
            raise MotoristaNaoEncontradoError("Motorista não encontrado.")
        return resultado

    def atualizar(
        self,
        motorista_id: int,
        nome: str | None = None,
        telefone: str | None = None,
    ) -> dict:
        self._validar_id(motorista_id, "motorista_id")
        if nome is None and telefone is None:
            raise MotoristaValidationError(
                "motorista",
                "Informe ao menos um campo para atualização.",
            )

        if nome is not None:
            nome = self._validar_texto_obrigatorio(nome, "nome", "Nome")
        if telefone is not None:
            telefone = self._validar_texto_obrigatorio(
                telefone,
                "telefone",
                "Telefone",
            )
            telefone = self._validar_telefone(telefone)

        resultado = self.repository.atualizar(motorista_id, nome, telefone)
        if not resultado:
            raise MotoristaNaoEncontradoError("Motorista não encontrado.")
        return resultado

    def inativar(self, motorista_id: int, usuario_executor_id: int) -> dict:
        self._validar_id(motorista_id, "motorista_id")
        self._validar_id(usuario_executor_id, "usuario_executor_id")

        # A consulta prévia diferencia inexistência da regra de alocações.
        self.buscar(motorista_id)
        if self.repository.possui_alocacoes_futuras(motorista_id):
            raise MotoristaComAlocacoesPendentesError(
                "Este profissional possui alocações pendentes e não pode "
                "ser inativado no momento."
            )
        resultado = self.repository.inativar(motorista_id, usuario_executor_id)
        if not resultado:
            raise MotoristaNaoEncontradoError("Motorista não encontrado.")
        return resultado

    def reativar(self, motorista_id: int, usuario_executor_id: int) -> dict:
        self._validar_id(motorista_id, "motorista_id")
        self._validar_id(usuario_executor_id, "usuario_executor_id")

        resultado = self.repository.reativar(motorista_id, usuario_executor_id)
        if not resultado:
            raise MotoristaNaoEncontradoError("Motorista não encontrado.")
        return resultado

    @staticmethod
    def _validar_texto_obrigatorio(
        valor: str,
        campo: str,
        nome_campo: str,
    ) -> str:
        if not isinstance(valor, str):
            raise MotoristaValidationError(
                campo,
                f"{nome_campo} deve ser um texto válido.",
            )

        valor_normalizado = valor.strip()
        if not valor_normalizado:
            raise MotoristaValidationError(
                campo,
                f"{nome_campo} é obrigatório e não pode ser vazio.",
            )
        return valor_normalizado

    @staticmethod
    def _validar_telefone(telefone: str) -> str:
        if not normalizar_telefone(telefone):
            raise MotoristaValidationError(
                "telefone",
                "Telefone deve conter ao menos um dígito.",
            )
        return telefone

    @staticmethod
    def _validar_id(valor: int, campo: str) -> None:
        if isinstance(valor, bool) or not isinstance(valor, int) or valor <= 0:
            raise MotoristaValidationError(
                campo,
                "ID deve ser um número inteiro positivo.",
            )
