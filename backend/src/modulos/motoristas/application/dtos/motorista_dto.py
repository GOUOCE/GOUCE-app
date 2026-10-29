import re
from pydantic import BaseModel, ConfigDict, Field, field_validator

from src.modulos.motoristas.application.validators.telefone_validator import (
    validar_telefone_br,
)

REGEX_NOME_PESSOA = re.compile(r"^[A-Za-zÀ-ÖØ-öø-ÿ'’\- ]+$")


def _validar_nome_pessoa(valor: str) -> str:
    if not valor:
        raise ValueError("O motorista é obrigatório.")
    valor_str = re.sub(r"\s+", " ", str(valor).strip())
    if len(valor_str) < 3 or len(valor_str) > 150:
        raise ValueError("O nome deve ter entre 3 e 150 caracteres.")
    if not REGEX_NOME_PESSOA.match(valor_str):
        raise ValueError("Use apenas letras, espaços, hífen ou apóstrofo")
    partes = valor_str.split()
    if len(partes) < 2 or any(len(re.sub(r"[^A-Za-zÀ-ÖØ-öø-ÿ]", "", p)) < 2 for p in (partes[0], partes[-1])):
        raise ValueError("Informe nome e sobrenome completos")
    return valor_str


class _MotoristaCamposDTO(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    nome: str = Field(min_length=3, max_length=150)
    telefone: str = Field(min_length=1)

    @field_validator("nome", mode="before")
    @classmethod
    def normalizar_espacos_nome(cls, value):
        return re.sub(r"\s+", " ", value.strip()) if isinstance(value, str) else value

    @field_validator("nome")
    @classmethod
    def nome_deve_ser_valido(cls, value: str) -> str:
        return _validar_nome_pessoa(value)

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

    nome: str | None = Field(default=None, min_length=3, max_length=150)
    telefone: str | None = Field(default=None, min_length=1)

    @field_validator("nome", mode="before")
    @classmethod
    def normalizar_espacos_nome(cls, value):
        return re.sub(r"\s+", " ", value.strip()) if isinstance(value, str) else value

    @field_validator("nome")
    @classmethod
    def nome_deve_ser_valido(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return _validar_nome_pessoa(value)

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
