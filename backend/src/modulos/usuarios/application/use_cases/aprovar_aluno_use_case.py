from src.shared.enums.status_cadastro_enum import StatusCadastroEnum
from src.modulos.usuarios.application.dtos.usuario_dto import AprovacaoAlunoResponseDTO


class AprovarAlunoUseCase:
    """
    Caso de uso para aprovação ou alteração do status de cadastro de um aluno.
    Estados permitidos:
    - ATIVADO ("ativado"): Cadastro aprovado.
    - INATIVADO ("inativado"): Cadastro reprovado/inativado.
    - PENDENTE ("pendente"): Cadastro em análise.
    - REJEITADO ("rejeitado"): Cadastro/documentação rejeitada com reenvio.
    """

    def __init__(self, repository):
        self.repository = repository

    def execute(
        self,
        aluno_id: int,
        novo_status: StatusCadastroEnum | str = StatusCadastroEnum.ATIVADO,
        motivo_reprovacao: str | None = None,
        documentos_reenvio: dict | list | None = None,
    ) -> AprovacaoAlunoResponseDTO:
        if not aluno_id or not isinstance(aluno_id, int) or aluno_id <= 0:
            raise ValueError("ID do aluno é obrigatório e deve ser um número inteiro positivo")

        status_str = str(novo_status.value if hasattr(novo_status, "value") else novo_status).lower().strip()

        status_permitidos = {
            StatusCadastroEnum.ATIVADO.value,
            StatusCadastroEnum.PENDENTE.value,
            StatusCadastroEnum.INATIVADO.value,
            StatusCadastroEnum.ANALISE_RENOVACAO.value,
            StatusCadastroEnum.REJEITADO.value,
        }

        if status_str not in status_permitidos:
            raise ValueError(
                f"Status '{status_str}' inválido. Opções permitidas: "
                "ativado, pendente, inativado, analise_renovacao, rejeitado"
            )

        aluno_existente = self.repository.buscar_aluno_por_id(aluno_id)
        if not aluno_existente:
            raise ValueError(f"Aluno com ID {aluno_id} não encontrado")

        if status_str == StatusCadastroEnum.REJEITADO.value:
            documentos = self.repository.normalizar_documentos_reenvio(documentos_reenvio)
            if not documentos and not motivo_reprovacao:
                raise ValueError("É necessário informar ao menos um documento para reenvio ou o motivo da rejeição.")
        else:
            documentos = None

        aluno_atualizado = self.repository.atualizar_status_aluno(
            aluno_id=aluno_id,
            novo_status=status_str,
            motivo_reprovacao=motivo_reprovacao,
            documentos_reenvio=documentos,
        )

        mensagens = {
            StatusCadastroEnum.ATIVADO.value: "Cadastro do aluno aprovado com sucesso!",
            StatusCadastroEnum.INATIVADO.value: "Cadastro do aluno inativado/reprovado com sucesso.",
            StatusCadastroEnum.PENDENTE.value: "Status do cadastro alterado para pendente.",
            StatusCadastroEnum.ANALISE_RENOVACAO.value: "A renovação do vínculo foi enviada para análise.",
            StatusCadastroEnum.REJEITADO.value: "Documentos rejeitados e marcados para reenvio.",
        }

        msg = mensagens.get(status_str, "Status atualizado com sucesso.")
        documentos_resposta = self.repository.normalizar_documentos_reenvio(getattr(aluno_atualizado, "documentos_reenvio", None))

        return AprovacaoAlunoResponseDTO(
            aluno_id=aluno_id,
            status_cadastro=aluno_atualizado.status_cadastro,
            motivo_reprovacao=aluno_atualizado.motivo_reprovacao,
            documentos_reenvio=documentos_resposta,
            mensagem=msg,
        )
