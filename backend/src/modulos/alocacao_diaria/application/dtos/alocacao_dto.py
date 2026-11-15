from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class AlunoAlocacaoDTO(BaseModel):
    model_config = ConfigDict(extra="ignore")

    agendamento_id: int = Field(gt=0)
    tipo_lugar: Literal["sentado", "em_pe"]


class AlocacaoDTO(BaseModel):
    model_config = ConfigDict(extra="ignore")

    rota_id: int = Field(gt=0)
    onibus_id: str = Field(min_length=1, max_length=20)
    motorista_id: int = Field(gt=0)
    turno: Literal["ida", "volta"] = "ida"
    alunos: list[AlunoAlocacaoDTO] = Field(default_factory=list)


class DistribuicaoRequestDTO(BaseModel):
    model_config = ConfigDict(extra="ignore")

    data: date
    modo: Literal["automatico", "manual"] = "manual"
    alocacoes: list[AlocacaoDTO] = Field(default_factory=list)
