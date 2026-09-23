from src.modulos.usuarios.application.dtos.usuario_dto import AtualizarAlunoDTO
from src.modulos.usuarios.infrastructure.repositories.usuario_repository import SQLAlchemyUsuarioRepository
from src.shared.validators.telefone_validator import TelefoneValidator


class AtualizarAlunoValidationError(ValueError):
    def __init__(self, field: str, message: str):
        self.field = field
        super().__init__(message)


class AtualizarAlunoUseCase:
    """
    Caso de uso responsável por atualizar dados parciais do aluno (como telefone e bairro).
    """

    def __init__(self, repository: SQLAlchemyUsuarioRepository):
        self.repository = repository
        self.telefone_validator = TelefoneValidator()

    def execute(self, user_id: int, dto: AtualizarAlunoDTO) -> AtualizarAlunoDTO:
        if not user_id or not isinstance(user_id, int) or user_id <= 0:
            raise ValueError("ID de usuário inválido")

        if dto.telefone is not None:
            if not self.telefone_validator.validar_telefone(dto.telefone):
                raise AtualizarAlunoValidationError(
                    "telefone",
                    "Telefone celular inválido. Informe um número celular válido com DDD (ex: 11987654321)",
                )

        if dto.bairro_id is not None and not dto.bairro_id.strip():
            raise AtualizarAlunoValidationError(
                "bairro_id",
                "Bairro inválido. Informe um bairro não vazio.",
            )

        usuario, aluno = self.repository.atualizar_dados_parciais(
            user_id=user_id,
            telefone=dto.telefone,
            bairro_id=dto.bairro_id
        )

        if not usuario:
            raise ValueError(f"Usuário com ID {user_id} não encontrado")

        return AtualizarAlunoDTO(
            telefone=usuario.telefone,
            bairro_id=aluno.bairro_id if aluno else None
        )
