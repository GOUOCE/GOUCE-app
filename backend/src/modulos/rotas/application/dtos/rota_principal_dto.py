import re
from datetime import time
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic_core import PydanticCustomError

_PADRAO_HORARIO = re.compile(r"^([01][0-9]|2[0-3]):([0-5][0-9])$")

IdPositivo = Annotated[int, Field(gt=0, strict=True)]


def contem_nul(valor: object) -> bool:
    """O PostgreSQL recusa NUL (``\\x00``) em texto e a consulta falharia com erro 500."""
    return isinstance(valor, str) and "\x00" in valor


def recusar_nul(valor: object) -> object:
    """Validador "before" dos textos livres: NUL é tratado como texto inválido."""
    if contem_nul(valor):
        # Mesmo código de "não é um texto válido": reaproveita a mensagem de campo.
        raise PydanticCustomError("string_type", "Texto não pode conter o caractere NUL.")
    return valor


def interpretar_horario(valor: object) -> time:
    """Converte ``"HH:MM"`` em ``time``; qualquer outro formato é recusado."""
    if isinstance(valor, time):
        return valor.replace(second=0, microsecond=0)
    if not isinstance(valor, str):
        raise ValueError("Horário deve estar no formato HH:MM.")
    correspondencia = _PADRAO_HORARIO.match(valor.strip())
    if not correspondencia:
        raise ValueError("Horário deve estar no formato HH:MM.")
    return time(int(correspondencia.group(1)), int(correspondencia.group(2)))


def formatar_horario(valor: time) -> str:
    return valor.strftime("%H:%M")


class _RotaPrincipalBaseDTO(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    @field_validator("horario_saida", "horario_retorno", mode="before", check_fields=False)
    @classmethod
    def validar_horario(cls, valor: object) -> object:
        if valor is None:
            return valor
        return interpretar_horario(valor)

    @field_validator("nome", mode="before", check_fields=False)
    @classmethod
    def validar_nome(cls, valor: object) -> object:
        return recusar_nul(valor)


class CriarRotaPrincipalDTO(_RotaPrincipalBaseDTO):
    nome: str = Field(min_length=1, max_length=150)
    horario_saida: time
    horario_retorno: time
    bairros_ids: list[IdPositivo] = Field(min_length=1)
    faculdades_ida_ids: list[IdPositivo] = Field(min_length=1)
    faculdades_volta_ids: list[IdPositivo] = Field(min_length=1)


class AtualizarRotaPrincipalDTO(_RotaPrincipalBaseDTO):
    """Edição parcial: listas enviadas substituem as atuais e não podem ser vazias."""

    nome: str | None = Field(default=None, min_length=1, max_length=150)
    horario_saida: time | None = None
    horario_retorno: time | None = None
    bairros_ids: list[IdPositivo] | None = Field(default=None, min_length=1)
    faculdades_ida_ids: list[IdPositivo] | None = Field(default=None, min_length=1)
    faculdades_volta_ids: list[IdPositivo] | None = Field(default=None, min_length=1)


class BairroRotaDTO(BaseModel):
    id: int
    nome: str


class FaculdadeRotaDTO(BaseModel):
    id: int
    nome: str
    campus: str


class RotaPrincipalResponseDTO(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int
    nome: str
    horario_saida: str
    horario_retorno: str
    ativo: bool
    bairros: list[BairroRotaDTO]
    faculdades_ida: list[FaculdadeRotaDTO]
    faculdades_volta: list[FaculdadeRotaDTO]


class OperacaoRotaPrincipalResponseDTO(BaseModel):
    success: bool = True
    message: str
    data: RotaPrincipalResponseDTO | None = None


class OpcoesRotaPrincipalResponseDTO(BaseModel):
    bairros: list[BairroRotaDTO]
    faculdades: list[FaculdadeRotaDTO]
