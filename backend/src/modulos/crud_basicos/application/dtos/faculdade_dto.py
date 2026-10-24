from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator


class CriarFaculdadeDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nome: str = Field(..., alias="nome_faculdade", min_length=1, max_length=255)
    sigla: Optional[str] = Field(default=None, max_length=50)
    campus: str = Field(..., alias="campus_faculdade", min_length=1, max_length=255)

    @field_validator("nome", "campus", mode="before")
    def normalizar_strip(cls, valor: object) -> str:
        if valor is None:
            raise ValueError("Campo obrigatório não pode ser nulo.")
        valor_str = str(valor).strip()
        if not valor_str:
            raise ValueError("Campo obrigatório não pode ser vazio.")
        return valor_str

    @field_validator("sigla", mode="before")
    def normalizar_strip_sigla(cls, valor: object) -> Optional[str]:
        if valor is None:
            return None
        valor_str = str(valor).strip()
        return valor_str if valor_str else None


class AtualizarFaculdadeDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nome: Optional[str] = Field(default=None, alias="nome_faculdade", max_length=255)
    sigla: Optional[str] = Field(default=None, max_length=50)
    campus: Optional[str] = Field(default=None, alias="campus_faculdade", max_length=255)
    ativo: Optional[bool] = None

    @field_validator("nome", "campus", mode="before")
    def normalizar_strip_opcional(cls, valor: object) -> Optional[str]:
        if valor is None:
            return None
        valor_str = str(valor).strip()
        if not valor_str:
            raise ValueError("Campo não pode ser vazio.")
        return valor_str

    @field_validator("sigla", mode="before")
    def normalizar_strip_sigla_opcional(cls, valor: object) -> Optional[str]:
        if valor is None:
            return None
        valor_str = str(valor).strip()
        return valor_str if valor_str else None


class FaculdadeResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_faculdade: int
    nome_faculdade: str
    sigla: Optional[str] = None
    campus_faculdade: str
    ativo: bool


class OperacaoFaculdadeResponseDTO(BaseModel):
    success: bool = True
    message: str = "Operação realizada com sucesso"
    data: Optional[FaculdadeResponseDTO] = None
