from enum import Enum

class IdentidadeSexualEnum(str, Enum):
    HETEROSSEXUAL = "Heterossexual"
    HOMOSSEXUAL = "Homossexual (Gay/Lésbica)"
    BISSEXUAL = "Bissexual"
    ASSEXUAL = "Assexual"
    OUTRA = "Outra"
    PREFIRO_NAO_DIZER = "Prefiro não dizer"

class RacaEnum(str, Enum):
    BRANCO = "Branco"
    PARDO = "Pardo"
    PRETO = "Preto"
    AMARELO = "Amarelo"
    INDIGENA = "Indígena"
    PREFIRO_NAO_DIZER = "Prefiro não dizer"

class IdentificacaoGeneroEnum(str, Enum):
    MULHER = "Mulher"
    HOMEM = "Homem"
    NAO_BINARIO = "Não-binário"
    OUTRO = "Outro"
    PREFIRO_NAO_DIZER = "Prefiro não dizer"

class SimNaoPrefiroEnum(str, Enum):
    SIM = "Sim"
    NAO = "Não"
    PREFIRO_NAO_DIZER = "Prefiro não dizer"
