from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class PromoverRepresentanteDTO(BaseModel):
    aluno_id: int = Field(..., gt=0, description="ID do aluno a ser promovido a representante")
    faculdade_id: int = Field(..., gt=0, description="ID da faculdade de atuação do representante")


class FaculdadeResumoDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_faculdade: int
    nome_faculdade: str
    sigla: str | None = None
    campus_faculdade: str
    ativo: bool


class RepresentanteResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    aluno_id: int
    nome: str
    email: str
    ativo: bool
    faculdade_id: int | None = None
    faculdade: FaculdadeResumoDTO | None = None
    instituicao: str | None = None
    campus: str | None = None
    curso: str | None = None
    periodo_ingresso: str | None = None
    id_foto_aluno: str | None = None
    criado_em: datetime | None = None


class OperacaoRepresentanteResponseDTO(BaseModel):
    success: bool = True
    message: str
    data: RepresentanteResponseDTO | None = None
