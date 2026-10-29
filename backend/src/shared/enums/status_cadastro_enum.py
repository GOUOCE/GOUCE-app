from enum import Enum


class StatusCadastroEnum(str, Enum):
    """
    Estados do cadastro do aluno no sistema.
    - ATIVADO: Cadastro aprovado e com acesso liberado.
    - PENDENTE: Aguardando aprovação da coordenação/administração.
    - INATIVADO: Acesso revogado/desativado.
    - ANALISE_RENOVACAO: Renovação de vínculo em análise.
    - REJEITADO: Cadastro ou documentação rejeitada, aguardando reenvio.
    """
    ATIVADO = "ativado"
    PENDENTE = "pendente"
    INATIVADO = "inativado"
    ANALISE_RENOVACAO = "analise_renovacao"
    REJEITADO = "rejeitado"
