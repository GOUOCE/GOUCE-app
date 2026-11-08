import re
from datetime import datetime
from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator

TITULO_MIN, TITULO_MAX = 3, 150
DESCRICAO_MIN, DESCRICAO_MAX = 3, 2000


class CriarAvisoDTO(BaseModel):
    """Dados necessários para publicar um novo aviso no mural (HU-023)."""

    model_config = ConfigDict(
        extra="forbid",
        populate_by_name=True,
        str_strip_whitespace=True,
    )

    titulo: str = Field(min_length=TITULO_MIN, max_length=TITULO_MAX)
    descricao: str = Field(
        min_length=DESCRICAO_MIN,
        max_length=DESCRICAO_MAX,
        validation_alias=AliasChoices("descricao", "conteudo"),
    )

    @field_validator("titulo", mode="before")
    @classmethod
    def normalizar_titulo(cls, value: object) -> object:
        if isinstance(value, str):
            return re.sub(r"\s+", " ", value.strip())
        return value

    @field_validator("descricao", mode="before")
    @classmethod
    def normalizar_descricao(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class AvisoResponseDTO(BaseModel):
    """Representação pública de um aviso publicado no mural."""

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
    )

    id: int
    titulo: str
    descricao: str
    conteudo: str
    autor_id: int
    data_criacao: datetime


class OperacaoAvisoResponseDTO(BaseModel):
    """Envelope padrão de resposta para operações de escrita de avisos."""

    success: bool = True
    message: str
    data: AvisoResponseDTO | None = None


class NotificacaoAvisoResponseDTO(BaseModel):
    """Representação de uma notificação push de aviso ou realocação (HU-024)."""

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
    )

    id: int
    tipo: str
    app_nome: str
    titulo: str
    mensagem: str
    aviso_id: int | None = None
    data_criacao: datetime

