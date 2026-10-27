import re
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, AliasChoices, field_validator

# Validação estrita conforme Critério 12 - HU-008
REGEX_TEXTO_LIVRE = re.compile(r"^[A-Za-z0-9À-ÖØ-öø-ÿ'’\-. ]+$")
REGEX_SIGLA = re.compile(r"^[A-Za-z0-9]+$")


class CriarFaculdadeDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nome: str = Field(
        ...,
        validation_alias=AliasChoices("nome", "nome_faculdade"),
        serialization_alias="nome_faculdade",
        min_length=1,
        max_length=255,
    )
    sigla: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("sigla", "sigla_faculdade"),
        serialization_alias="sigla",
        max_length=50,
    )
    campus: str = Field(
        ...,
        validation_alias=AliasChoices("campus", "campus_faculdade"),
        serialization_alias="campus_faculdade",
        min_length=1,
        max_length=255,
    )

    @field_validator("nome", mode="before")
    @classmethod
    def validar_nome(cls, valor: object) -> str:
        if valor is None:
            raise ValueError("Informe o nome da instituição")
        valor_str = str(valor).strip()
        if not valor_str:
            raise ValueError("Informe o nome da instituição")
        if not REGEX_TEXTO_LIVRE.match(valor_str):
            raise ValueError("Use apenas letras, números, espaços, hífen, apóstrofo ou ponto")
        return valor_str

    @field_validator("sigla", mode="before")
    @classmethod
    def validar_sigla(cls, valor: object) -> Optional[str]:
        if valor is None or str(valor).strip() == "":
            return None
        valor_str = str(valor).strip()
        if not REGEX_SIGLA.match(valor_str):
            raise ValueError("Use apenas letras e números na sigla, sem espaços")
        return valor_str

    @field_validator("campus", mode="before")
    @classmethod
    def validar_campus(cls, valor: object) -> str:
        if valor is None:
            raise ValueError("Informe o campus da instituição")
        valor_str = str(valor).strip()
        if not valor_str:
            raise ValueError("Informe o campus da instituição")
        if not REGEX_TEXTO_LIVRE.match(valor_str):
            raise ValueError("Use apenas letras, números, espaços, hífen, apóstrofo ou ponto")
        return valor_str


class AtualizarFaculdadeDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nome: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("nome", "nome_faculdade"),
        serialization_alias="nome_faculdade",
        max_length=255,
    )
    sigla: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("sigla", "sigla_faculdade"),
        serialization_alias="sigla",
        max_length=50,
    )
    campus: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("campus", "campus_faculdade"),
        serialization_alias="campus_faculdade",
        max_length=255,
    )
    ativo: Optional[bool] = None

    @field_validator("nome", mode="before")
    @classmethod
    def validar_nome_opcional(cls, valor: object) -> Optional[str]:
        if valor is None:
            return None
        valor_str = str(valor).strip()
        if not valor_str:
            raise ValueError("Informe o nome da instituição")
        if not REGEX_TEXTO_LIVRE.match(valor_str):
            raise ValueError("Use apenas letras, números, espaços, hífen, apóstrofo ou ponto")
        return valor_str

    @field_validator("sigla", mode="before")
    @classmethod
    def validar_sigla_opcional(cls, valor: object) -> Optional[str]:
        if valor is None or str(valor).strip() == "":
            return None
        valor_str = str(valor).strip()
        if not REGEX_SIGLA.match(valor_str):
            raise ValueError("Use apenas letras e números na sigla, sem espaços")
        return valor_str

    @field_validator("campus", mode="before")
    @classmethod
    def validar_campus_opcional(cls, valor: object) -> Optional[str]:
        if valor is None:
            return None
        valor_str = str(valor).strip()
        if not valor_str:
            raise ValueError("Informe o campus da instituição")
        if not REGEX_TEXTO_LIVRE.match(valor_str):
            raise ValueError("Use apenas letras, números, espaços, hífen, apóstrofo ou ponto")
        return valor_str


class FaculdadeResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id_faculdade: int
    nome_faculdade: str
    sigla: Optional[str] = Field(default=None, validation_alias="sigla", serialization_alias="sigla")
    campus_faculdade: str
    ativo: bool


class OperacaoFaculdadeResponseDTO(BaseModel):
    success: bool = True
    message: str = "Operação realizada com sucesso"
    data: Optional[FaculdadeResponseDTO] = None
