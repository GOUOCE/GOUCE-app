from pydantic import BaseModel, ConfigDict, Field

from src.shared.enums.demograficos_enum import (
    IdentidadeSexualEnum,
    IdentificacaoGeneroEnum,
    RacaEnum,
    SimNaoPrefiroEnum,
)
from src.shared.enums.status_cadastro_enum import StatusCadastroEnum
from src.shared.enums.turno_curso_enum import TurnoCursoEnum


class RenovacaoVinculoDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    nome: str = Field(min_length=3, max_length=150)
    raca: RacaEnum
    identificacao_sexual: IdentidadeSexualEnum
    identificacao_genero: IdentificacaoGeneroEnum
    transgenero: SimNaoPrefiroEnum
    tem_filhos: bool
    telefone: str = Field(min_length=1, max_length=20)
    bairro_id: str = Field(min_length=1, max_length=20)
    faculdade_id: str = Field(min_length=1, max_length=150)
    curso: str = Field(min_length=1, max_length=150)
    campus: str = Field(min_length=1, max_length=150)
    periodo_ingresso: str = Field(min_length=1, max_length=20)
    turno_curso: TurnoCursoEnum | str
    semestre_atual: int


class RenovacaoVinculoRespostaDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    success: bool = True
    message: str = "Renovação de vínculo enviada para análise"
    aluno_id: int
    status_cadastro: StatusCadastroEnum
