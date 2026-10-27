from pydantic import BaseModel, ConfigDict, Field, field_validator

from src.modulos.motoristas.application.validators.telefone_validator import (
    validar_telefone_br,
)


class _MotoristaCamposDTO(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    nome: str = Field(min_length=1, max_length=150)
    telefone: str = Field(min_length=1)

    @field_validator("telefone")
    @classmethod
    def telefone_deve_ser_valido(cls, value: str) -> str:
        return validar_telefone_br(value)


class CriarMotoristaDTO(_MotoristaCamposDTO):
    """Dados necessários para cadastrar um motorista."""


class AtualizarMotoristaDTO(BaseModel):
    """Campos editáveis do cadastro de motorista."""

    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    nome: str | None = Field(default=None, min_length=1, max_length=150)
    telefone: str | None = Field(default=None, min_length=1)

    @field_validator("telefone")
    @classmethod
    def telefone_deve_ser_valido(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return validar_telefone_br(value)


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
