from src.modulos.usuarios.application.dtos.usuario_dto import RedefinirEmailDTO, UsuarioResponseDTO
from src.modulos.usuarios.infrastructure.repositories.usuario_repository import SQLAlchemyUsuarioRepository


class RedefinirEmailValidationError(ValueError):
    def __init__(
        self,
        field: str,
        message: str,
        *,
        status_code: int = 400,
        code: str = "VALIDATION_ERROR",
    ):
        self.field = field
        self.status_code = status_code
        self.code = code
        super().__init__(message)


class RedefinirEmailUseCase:
    """
    Caso de uso responsável por alterar o email do aluno autenticado.
    Requer que a senha atual seja fornecida corretamente.
    """

    def __init__(self, repository: SQLAlchemyUsuarioRepository, hasher):
        self.repository = repository
        self.hasher = hasher

    def execute(self, user_id: int, dto: RedefinirEmailDTO) -> UsuarioResponseDTO:
        if not user_id or not isinstance(user_id, int) or user_id <= 0:
            raise ValueError("ID de usuário inválido")

        usuario, _ = self.repository.buscar_com_detalhes_por_id(user_id)
        if not usuario:
            raise ValueError(f"Usuário com ID {user_id} não encontrado")

        # Verificar senha
        if not self.hasher.verify(dto.senha, usuario.senha):
            raise RedefinirEmailValidationError(
                "senha",
                "Senha incorreta. Não é possível alterar o e-mail.",
            )

        email_limpo = dto.novo_email.lower().strip()

        # Verificar se o novo e-mail é igual ao atual
        if usuario.email == email_limpo:
            raise RedefinirEmailValidationError(
                "novo_email",
                "O novo e-mail não pode ser igual ao atual.",
            )

        # Verificar se o novo e-mail já está em uso por outro usuário
        usuario_existente = self.repository.buscar_por_email(email_limpo)
        if usuario_existente and usuario_existente.id != user_id:
            raise RedefinirEmailValidationError(
                "novo_email",
                "Este e-mail já está sendo utilizado por outra conta.",
                status_code=409,
                code="EMAIL_ALREADY_REGISTERED",
            )

        # Atualizar no repositório
        usuario_atualizado = self.repository.atualizar_email(user_id, email_limpo)

        return UsuarioResponseDTO(
            id=usuario_atualizado.id,
            nome_completo=usuario_atualizado.nome_completo,
            email=usuario_atualizado.email,
            telefone=usuario_atualizado.telefone,
        )
