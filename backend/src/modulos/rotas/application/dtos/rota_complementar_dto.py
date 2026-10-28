from datetime import time

from pydantic import BaseModel, ConfigDict, Field, field_validator

from src.modulos.rotas.application.dtos.rota_principal_dto import (
    IdPositivo,
    interpretar_horario,
    recusar_nul,
)


class _RotaComplementarBaseDTO(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    @field_validator("horario_saida", "horario_retorno", mode="before", check_fields=False)
    @classmethod
    def validar_horario(cls, valor: object) -> object:
        if valor is None:
            return valor
        return interpretar_horario(valor)

    @field_validator("nome", "ponto_conexao", mode="before", check_fields=False)
    @classmethod
    def validar_texto(cls, valor: object) -> object:
        return recusar_nul(valor)


class CriarRotaComplementarDTO(_RotaComplementarBaseDTO):
    nome: str = Field(min_length=1, max_length=150)
    horario_saida: time
    horario_retorno: time
    ponto_conexao: str = Field(min_length=1, max_length=150)
    rota_principal_id: IdPositivo


class AtualizarRotaComplementarDTO(_RotaComplementarBaseDTO):
    """Edição parcial: só os campos enviados são alterados."""

    nome: str | None = Field(default=None, min_length=1, max_length=150)
    horario_saida: time | None = None
    horario_retorno: time | None = None
    ponto_conexao: str | None = Field(default=None, min_length=1, max_length=150)
    rota_principal_id: IdPositivo | None = None


class RotaPrincipalVinculadaDTO(BaseModel):
    id: int
    nome: str
    ativo: bool


class RotaComplementarResponseDTO(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int
    nome: str
    horario_saida: str
    horario_retorno: str
    ponto_conexao: str
    ativo: bool
    rota_principal: RotaPrincipalVinculadaDTO


class OperacaoRotaComplementarResponseDTO(BaseModel):
    success: bool = True
    message: str
    data: RotaComplementarResponseDTO | None = None


class OpcaoRotaPrincipalDTO(BaseModel):
    id: int
    nome: str
    horario_saida: str
    horario_retorno: str


class OpcoesRotaComplementarResponseDTO(BaseModel):
    rotas_principais: list[OpcaoRotaPrincipalDTO]
