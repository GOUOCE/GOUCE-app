import re
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

REGEX_BAIRRO = re.compile(r"^[A-Za-zÀ-ÖØ-öø-ÿ'’\-. ]+$")
REGEX_PONTO = re.compile(r"^[A-Za-z0-9À-ÖØ-öø-ÿ'’\-. ]+$")


class PontoDeParadaResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    ponto_id: Optional[int] = None
    id: Optional[int] = Field(None, alias="ponto_id")
    nome: str
    bairro_id: int
    ativo: bool


class CriarBairroDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nome: str = Field(..., alias="nome_bairro", max_length=100)
    pontos_de_parada: list[str] = Field(..., min_length=1)

    @field_validator("nome", mode="before")
    @classmethod
    def normalizar_nome(cls, valor: object) -> str:
        if valor is None:
            raise ValueError("O nome do bairro é obrigatório.")

        valor_str = str(valor).strip()

        if not valor_str or len(valor_str) < 3:
            raise ValueError(
                "Informe o nome do bairro com pelo menos 3 caracteres."
            )

        if len(valor_str) > 100:
            raise ValueError(
                "O nome do bairro deve ter no máximo 100 caracteres."
            )

        if not REGEX_BAIRRO.match(valor_str):
            raise ValueError(
                "Use apenas letras, espaços, hífen ou apóstrofo."
            )

        return valor_str

    @field_validator("pontos_de_parada", mode="before")
    @classmethod
    def normalizar_pontos(cls, valor: object) -> list[str]:
        if not valor or not isinstance(valor, list):
            raise ValueError("Ao menos um ponto de parada é obrigatório.")
        pontos_limpos = []
        for p in valor:
            if p is None:
                raise ValueError("O nome do ponto de parada não pode ser vazio.")
            p_str = str(p).strip()
            if len(p_str) < 2:
                raise ValueError("Informe um nome de ponto com pelo menos 2 caracteres")
            if len(p_str) > 100:
                raise ValueError("O ponto de parada deve ter no máximo 100 caracteres")
            if not REGEX_PONTO.match(p_str):
                raise ValueError("Use apenas letras, números, espaços, hífen, apóstrofo ou ponto")
            pontos_limpos.append(p_str)
        if not pontos_limpos:
            raise ValueError("Ao menos um ponto de parada é obrigatório.")
        return pontos_limpos


class AtualizarBairroDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nome: Optional[str] = Field(default=None, alias="nome_bairro", max_length=100)
    pontos_de_parada: Optional[list[str]] = Field(default=None)
    ativo: Optional[bool] = None

    @field_validator("nome", mode="before")
    @classmethod
    def normalizar_nome_opcional(cls, valor: object) -> Optional[str]:
        if valor is None:
            return None
        valor_str = str(valor).strip()
        if not valor_str or len(valor_str) < 3:
            raise ValueError("Informe o nome do bairro com pelo menos 3 caracteres")
        if not REGEX_BAIRRO.match(valor_str):
            raise ValueError("Use apenas letras, espaços, hífen ou apóstrofo")
        return valor_str

    @field_validator("pontos_de_parada", mode="before")
    @classmethod
    def normalizar_pontos_opcional(cls, valor: object) -> Optional[list[str]]:
        if valor is None:
            return None
        if not isinstance(valor, list) or len(valor) == 0:
            raise ValueError("Ao menos um ponto de parada deve ser informado.")
        pontos_limpos = []
        for p in valor:
            if p is None:
                raise ValueError("O nome do ponto de parada não pode ser vazio.")
            p_str = str(p).strip()
            if len(p_str) < 2:
                raise ValueError("Informe um nome de ponto com pelo menos 2 caracteres")
            if len(p_str) > 100:
                raise ValueError("O ponto de parada deve ter no máximo 100 caracteres")
            if not REGEX_PONTO.match(p_str):
                raise ValueError("Use apenas letras, números, espaços, hífen, apóstrofo ou ponto")
            pontos_limpos.append(p_str)
        if not pontos_limpos:
            raise ValueError("Ao menos um ponto de parada deve ser informado.")
        return pontos_limpos


class BairroResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    bairro_id: Optional[int] = None
    id: Optional[int] = Field(None, alias="bairro_id")
    nome: str
    ativo: bool
    pontos_de_parada: list[PontoDeParadaResponseDTO] = []


class OperacaoBairroResponseDTO(BaseModel):
    success: bool = True
    message: str = "Operação realizada com sucesso"
    data: Optional[BairroResponseDTO] = None
