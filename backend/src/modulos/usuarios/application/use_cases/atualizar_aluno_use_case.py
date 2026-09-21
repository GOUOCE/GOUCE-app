from src.modulos.usuarios.application.dtos.usuario_dto import AtualizarAlunoDTO
from src.modulos.usuarios.infrastructure.repositories.usuario_repository import SQLAlchemyUsuarioRepository


class AtualizarAlunoUseCase:
    """
    Caso de uso responsável por atualizar dados parciais do aluno (como telefone e bairro).
    """

    def __init__(self, repository: SQLAlchemyUsuarioRepository):
        self.repository = repository

    def execute(self, user_id: int, dto: AtualizarAlunoDTO) -> AtualizarAlunoDTO:
        if not user_id or not isinstance(user_id, int) or user_id <= 0:
            raise ValueError("ID de usuário inválido")

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
