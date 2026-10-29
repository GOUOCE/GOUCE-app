import calendar
from datetime import datetime, timezone

from src.shared.enums.status_cadastro_enum import StatusCadastroEnum
from src.modulos.usuarios.application.dtos.usuario_dto import AprovacaoAlunoResponseDTO

# RN-013: o vínculo aprovado vale por um período; enquanto a administração não puder
# configurá-lo, a validade é de 6 meses a partir da aprovação.
MESES_VALIDADE_VINCULO = 6


def somar_meses(data: datetime, meses: int) -> datetime:
    """Soma meses de calendário, ajustando o dia ao último do mês quando ele não existe (ex.: 31/08 + 6 = 28/02)."""
    total = data.month - 1 + meses
    ano = data.year + total // 12
    mes = total % 12 + 1
    dia = min(data.day, calendar.monthrange(ano, mes)[1])
    return data.replace(year=ano, month=mes, day=dia)


class AvaliacaoCadastroError(ValueError):
    """Recusa de regra de negócio na avaliação do cadastro; a mensagem já é própria para o administrador."""


class CadastroForaDaFilaError(AvaliacaoCadastroError):
    """Aprovar ou reprovar um cadastro que não está aguardando avaliação."""


# HU-027: só entra na avaliação quem está na fila de solicitações; a renovação (HU-028) chega como analise_renovacao.
STATUS_NA_FILA = {StatusCadastroEnum.PENDENTE.value, StatusCadastroEnum.ANALISE_RENOVACAO.value}
STATUS_AVALIACAO = {StatusCadastroEnum.ATIVADO.value, StatusCadastroEnum.REJEITADO.value}

SITUACAO_FORA_DA_FILA = {
    StatusCadastroEnum.ATIVADO.value: "Este aluno já está com o cadastro aprovado.",
    StatusCadastroEnum.REJEITADO.value: "Este aluno está com o cadastro rejeitado, aguardando o reenvio dos documentos.",
    StatusCadastroEnum.INATIVADO.value: "Este aluno está com o acesso inativado.",
}


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
        usuario_responsavel_id: int | None = None,
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

        if status_str in STATUS_AVALIACAO:
            status_atual = getattr(aluno_existente.status_cadastro, "value", aluno_existente.status_cadastro)
            status_atual = str(status_atual).lower().strip()
            if status_atual not in STATUS_NA_FILA:
                situacao = SITUACAO_FORA_DA_FILA.get(status_atual, "Este cadastro não está aguardando avaliação.")
                raise CadastroForaDaFilaError(
                    f"{situacao} Só é possível aprovar ou reprovar cadastros na fila de solicitações."
                )

        if status_str == StatusCadastroEnum.REJEITADO.value:
            # RN-012: o aluno rejeitado precisa ter ao menos um documento para corrigir e reenviar.
            documentos = self.repository.normalizar_documentos_reenvio(documentos_reenvio)
            if not documentos:
                raise AvaliacaoCadastroError("Informe ao menos um documento para o aluno reenviar, com o motivo.")
        else:
            documentos = None

        # Aprovar o cadastro ou a renovação abre um novo período de validade (HU-028);
        # sem isso o aluno renovado continuava com o vínculo vencido.
        validade_acesso = None
        if status_str == StatusCadastroEnum.ATIVADO.value:
            validade_acesso = somar_meses(datetime.now(timezone.utc), MESES_VALIDADE_VINCULO)

        aluno_atualizado = self.repository.atualizar_status_aluno(
            aluno_id=aluno_id,
            novo_status=status_str,
            motivo_reprovacao=motivo_reprovacao,
            documentos_reenvio=documentos,
            validade_acesso=validade_acesso,
            usuario_responsavel_id=usuario_responsavel_id,
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
