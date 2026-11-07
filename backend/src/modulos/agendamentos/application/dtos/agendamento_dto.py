from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class AgendamentoInputDTO(BaseModel):
    model_config = ConfigDict(extra="forbid")

    data: date
    usa_ida: bool
    usa_volta: bool
    ponto_embarque_id: int | None = Field(default=None, gt=0)
    ies_destino_id: int | None = Field(default=None, gt=0)
    rota_complementar_ida_id: int | None = Field(default=None, gt=0)
    ies_origem_id: int | None = Field(default=None, gt=0)
    ponto_desembarque_id: int | None = Field(default=None, gt=0)
    rota_complementar_volta_id: int | None = Field(default=None, gt=0)

class AgendamentoResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    aluno_id: int
    data: date
    usa_ida: bool
    usa_volta: bool
    ponto_embarque_id: int | None = None
    ies_destino_id: int | None = None
    rota_complementar_ida_id: int | None = None
    ies_origem_id: int | None = None
    ponto_desembarque_id: int | None = None
    rota_complementar_volta_id: int | None = None
    status: str


class OperacaoAgendamentoDTO(BaseModel):
    mensagem: str
    agendamento_criado: bool = True
    agendamento: AgendamentoResponseDTO | None = None
    estado_dia: str
