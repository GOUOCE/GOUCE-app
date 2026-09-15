from enum import Enum


class StatusCadastroEnum(str, Enum):
    """
    Enum para os 3 únicos estados permitidos de cadastro no sistema:
    - ATIVADO: Único estado que permite login e acesso.
    - PENDENTE: Aguardando aprovação da coordenação/administração.
    - INATIVADO: Acesso revogado/desativado.
    """
    ATIVADO = "ativado"
    PENDENTE = "pendente"
    INATIVADO = "inativado"
