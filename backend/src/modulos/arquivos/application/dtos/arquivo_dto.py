from pydantic import BaseModel, ConfigDict
from typing import Optional


class ArquivoResponseDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    nome: str
    url: str
    content_type: Optional[str] = None
    tamanho_bytes: Optional[int] = None


class ArquivoPresignedUrlDTO(BaseModel):
    id: str
    nome: str
    url_assinada: str
    expira_em_segundos: int

