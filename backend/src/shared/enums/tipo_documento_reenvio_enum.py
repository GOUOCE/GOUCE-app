from enum import Enum


class TipoDocumentoReenvioEnum(str, Enum):
    COMPROVANTE_MATRICULA = "comprovante_matricula"
    COMPROVANTE_RESIDENCIA = "comprovante_residencia"
    FOTO_PERFIL = "foto_perfil"
