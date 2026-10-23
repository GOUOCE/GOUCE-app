from pydantic import BaseModel, ConfigDict, Field, field_validator

from src.shared.security.lgpd_encryption import normalizar_telefone


def _validar_telefone_com_digitos(valor: str) -> str:
    if not normalizar_telefone(valor):
        raise ValueError("Telefone deve conter ao menos um dígito.")
    return valor


class _MotoristaCamposDTO(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    nome: str = Field(min_length=1, max_length=150)
    telefone: str = Field(min_length=1, max_length=20)

    @field_validator("telefone")
    @classmethod
    def telefone_deve_conter_digito(cls, value: str) -> str:
        return _validar_telefone_com_digitos(value)


class CriarMotoristaDTO(_MotoristaCamposDTO):
    """Dados necessários para cadastrar um motorista."""


class AtualizarMotoristaDTO(BaseModel):
    """Campos editáveis do cadastro de motorista."""

    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    nome: str | None = Field(default=None, min_length=1, max_length=150)
    telefone: str | None = Field(default=None, min_length=1, max_length=20)

    @field_validator("telefone")
    @classmethod
    def telefone_deve_conter_digito(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return _validar_telefone_com_digitos(value)


class MotoristaResponseDTO(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
    )

    id: int
    nome: str
    telefone: str
    ativo: bool


class OperacaoMotoristaResponseDTO(BaseModel):
    success: bool = True
    message: str
    data: MotoristaResponseDTO | None = None
