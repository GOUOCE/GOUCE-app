from src.shared.enums.status_cadastro_enum import StatusCadastroEnum
from src.modulos.usuarios.application.dtos.usuario_dto import AprovacaoAlunoResponseDTO


class AprovarAlunoUseCase:
    """
    Caso de uso para aprovação ou alteração do status de cadastro de um aluno.
    Estados permitidos:
    - ATIVADO ("ativado"): Cadastro aprovado.
    - INATIVADO ("inativado"): Cadastro reprovado/inativado.
    - PENDENTE ("pendente"): Cadastro em análise.
    """

    def __init__(self, repository):
        self.repository = repository

    def execute(
        self,
        aluno_id: int,
        novo_status: StatusCadastroEnum | str = StatusCadastroEnum.ATIVADO,
        motivo_reprovacao: str | None = None
    ) -> AprovacaoAlunoResponseDTO:
        if not aluno_id or not isinstance(aluno_id, int) or aluno_id <= 0:
            raise ValueError("ID do aluno é obrigatório e deve ser um número inteiro positivo")

        status_str = str(novo_status.value if hasattr(novo_status, "value") else novo_status).lower().strip()

        status_permitidos = {
            StatusCadastroEnum.ATIVADO.value,
            StatusCadastroEnum.PENDENTE.value,
            StatusCadastroEnum.INATIVADO.value,
        }

        if status_str not in status_permitidos:
            raise ValueError(f"Status '{status_str}' inválido. Opções permitidas: ativado, pendente, inativado")

        aluno_existente = self.repository.buscar_aluno_por_id(aluno_id)
        if not aluno_existente:
            raise ValueError(f"Aluno com ID {aluno_id} não encontrado")

        aluno_atualizado = self.repository.atualizar_status_aluno(
            aluno_id=aluno_id,
            novo_status=status_str,
            motivo_reprovacao=motivo_reprovacao
        )

        mensagens = {
            StatusCadastroEnum.ATIVADO.value: "Cadastro do aluno aprovado com sucesso!",
            StatusCadastroEnum.INATIVADO.value: "Cadastro do aluno inativado/reprovado com sucesso.",
            StatusCadastroEnum.PENDENTE.value: "Status do cadastro alterado para pendente.",
        }

        msg = mensagens.get(status_str, "Status atualizado com sucesso.")

        return AprovacaoAlunoResponseDTO(
            aluno_id=aluno_id,
            status_cadastro=aluno_atualizado.status_cadastro,
            motivo_reprovacao=aluno_atualizado.motivo_reprovacao,
            mensagem=msg,
        )
