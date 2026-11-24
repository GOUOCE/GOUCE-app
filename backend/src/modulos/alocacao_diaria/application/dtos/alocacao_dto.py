from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


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

    @field_validator("onibus_id", mode="before")
    @classmethod
    def normalizar_onibus_id(cls, valor: object) -> str:
        return str(valor).strip().upper().replace("-", "")


class DistribuicaoRequestDTO(BaseModel):
    model_config = ConfigDict(extra="ignore")

    data: date
    modo: Literal["automatico", "manual"] = "manual"
    alocacoes: list[AlocacaoDTO] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# DTOs de resposta — HU-018 (Visualização da Lista de Embarque)
# ---------------------------------------------------------------------------


class PontoResumoDTO(BaseModel):
    """Ponto de embarque ou desembarque simplificado."""

    ponto_id: int
    nome: str
    bairro: str | None = None


class FaculdadeResumoDTO(BaseModel):
    """IES simplificada para exibição na lista de embarque."""

    id: int
    nome: str
    sigla: str | None = None
    campus: str


class VeiculoEscaladoDTO(BaseModel):
    """Ônibus e motorista escalados para um turno/rota/dia."""

    alocacao_id: int
    turno: Literal["ida", "volta"]
    onibus_placa: str
    motorista_nome: str
    total_sentados: int
    total_em_pe: int


class AlunoListaEmbarqueDTO(BaseModel):
    """Dados consolidados de um aluno na lista de embarque.

    Um mesmo agendamento cobre ida e/ou volta, por isso os campos de
    ponto/lugar/ônibus são separados por turno e podem ser ``None``.
    """

    aluno_id: int
    agendamento_id: int
    nome_aluno: str
    ponto_embarque: PontoResumoDTO | None = None
    ponto_desembarque: PontoResumoDTO | None = None
    ies_ida: FaculdadeResumoDTO | None = None
    ies_volta: FaculdadeResumoDTO | None = None
    indicacao_turno: Literal[
        "APENAS_IDA",
        "APENAS_VOLTA",
        "IDA_E_VOLTA_MESMA_IES",
        "IDA_E_VOLTA_IES_DISTINTAS",
    ]
    tipo_lugar_ida: Literal["sentado", "em_pe"] | None = None
    tipo_lugar_volta: Literal["sentado", "em_pe"] | None = None
    onibus_ida: str | None = None
    onibus_volta: str | None = None
    motorista_ida: str | None = None
    motorista_volta: str | None = None


class ListaEmbarqueResponseDTO(BaseModel):
    """Resposta completa do endpoint GET /alocacao-diaria/lista-embarque."""

    data: str  # ISO 8601
    rota_id: int
    nome_rota: str
    horario_saida: str | None = None
    horario_retorno: str | None = None
    veiculos_escalados: list[VeiculoEscaladoDTO] = Field(default_factory=list)
    total_alunos_alocados: int
    texto_contador: str
    permite_imprimir: bool
    mensagem: str | None = None
    ultima_sincronizacao: str  # ISO 8601 UTC
    indicador_sincronizacao: str = "Atualizado agora"
    alunos: list[AlunoListaEmbarqueDTO] = Field(default_factory=list)


class RotaDoDiaDTO(BaseModel):
    """Rota com alocação existente para uma data, usada no seletor da UI."""

    rota_id: int
    nome_rota: str
    horario_saida: str


class RotasDoDiaResponseDTO(BaseModel):
    """Resposta do endpoint GET /alocacao-diaria/rotas-do-dia."""

    data: str
    rotas: list[RotaDoDiaDTO] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# DTOs de resposta — HU-019 (Consulta de Alocação Diária / Minha Viagem)
# ---------------------------------------------------------------------------


class RotaComplementarResumoDTO(BaseModel):
    id: int
    nome: str
    horario_saida: str | None = None
    horario_retorno: str | None = None
    ponto_conexao: str | None = None


class TurnoViagemDTO(BaseModel):
    """Dados de um turno (ida ou volta) da viagem do aluno."""

    turno: Literal["ida", "volta"]
    status_alocacao: Literal["ALOCADO", "AGUARDANDO_ALOCACAO"]
    mensagem_status: str
    ponto: PontoResumoDTO | None = None
    faculdade: FaculdadeResumoDTO | None = None
    rota_complementar: RotaComplementarResumoDTO | None = None
    rota_id: int | None = None
    nome_rota: str | None = None
    horario: str | None = None
    onibus_id: str | None = None
    placa: str | None = None
    apelido_onibus: str | None = None
    motorista_id: int | None = None
    nome_motorista: str | None = None
    tipo_lugar: Literal["sentado", "em_pe"] | None = None
    foi_realocado: bool = False
    aviso_realocacao: str | None = None


class MinhaViagemResponseDTO(BaseModel):
    """Resposta do endpoint GET /alocacao-diaria/minha-viagem."""

    data: str
    possui_agendamento: bool
    agendamento_id: int | None = None
    status_geral: Literal["SEM_AGENDAMENTO", "AGUARDANDO_ALOCACAO", "PARCIALMENTE_ALOCADO", "ALOCADO"]
    mensagem: str | None = None
    foi_realocado: bool = False
    aviso_realocacao: str | None = None
    ida: TurnoViagemDTO | None = None
    volta: TurnoViagemDTO | None = None
    consultado_em: str
