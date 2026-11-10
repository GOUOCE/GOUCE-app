from datetime import date, datetime

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


class RotaComplementarResumoDTO(BaseModel):
    """Dados da rota complementar necessários para a transferência (HU-015)."""

    id: int
    nome: str
    horario_saida: str
    horario_retorno: str
    ponto_conexao: str


class FaculdadeResumoDTO(BaseModel):
    """Faculdade atendida pela rota principal no trecho (HU-015)."""

    id: int
    nome: str


class RotaPrincipalResumoDTO(BaseModel):
    """Dados da rota principal correspondente ao trecho (HU-015)."""

    id: int
    nome: str
    horario_saida: str
    horario_retorno: str
    faculdades: list[FaculdadeResumoDTO] = Field(default_factory=list)
    # Provisório: alocação de ônibus/motorista será implementada no EP-005.
    onibus: dict | None = None
    motorista: dict | None = None


class AgendamentoDetalheDTO(AgendamentoResponseDTO):
    ponto_embarque_nome: str | None = None
    ies_destino_nome: str | None = None
    rota_complementar_ida_nome: str | None = None
    ies_origem_nome: str | None = None
    ponto_desembarque_nome: str | None = None
    rota_complementar_volta_nome: str | None = None
    rota_complementar_ida: RotaComplementarResumoDTO | None = None
    rota_complementar_volta: RotaComplementarResumoDTO | None = None
    rota_principal_ida: RotaPrincipalResumoDTO | None = None
    rota_principal_volta: RotaPrincipalResumoDTO | None = None
    atualizado_em: datetime
    pode_remover: bool
    pode_editar: bool


class CalendarioDiaDTO(BaseModel):
    data: date
    estado: str
    descricao: str | None = None
    pode_agendar: bool
    agendamento_id: int | None = None
    pode_remover: bool = False
    pode_editar: bool = False


class CalendarioResponseDTO(BaseModel):
    mes: str
    dias: list[CalendarioDiaDTO]
    ativos: int
    limite: int


class MeusAgendamentosDTO(BaseModel):
    agendamentos: list[AgendamentoDetalheDTO]
    ativos: int
    limite: int


class CancelamentoAgendamentoDTO(BaseModel):
    mensagem: str
    estado_dia: str
    ativos: int
    limite: int
