from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, field_validator


class FiltrosRelatorioTransporteDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    tipo: Literal["geral", "agendamentos_embarques", "motoristas"] = "geral"
    data_inicio: date
    data_fim: date
    faculdade_id: Optional[int] = None
    bairro_id: Optional[int] = None
    faculdade_nome: Optional[str] = None
    bairro_nome: Optional[str] = None

    @field_validator("tipo", mode="before")
    @classmethod
    def normalizar_tipo(cls, valor: str) -> str:
        return {
            "Agendamentos e embarques": "agendamentos_embarques",
            "Motoristas": "motoristas",
        }.get(valor, valor)


class LinhaRelatorioTransporteDTO(BaseModel):
    data: date
    rota: str
    localidades: list[str]
    faculdades_destino: list[str]
    agendados: int
    embarques: int
    faltas: int
    pendentes: int
    taxa_presenca: float


class MotoristaRelatorioTransporteDTO(BaseModel):
    nome: str
    dias_trabalhados: int
    rotas_alocadas: str
    escala: str


class TotalPorCategoriaRelatorioDTO(BaseModel):
    nome: str
    agendamentos: int
    embarques: int
    faltas: int
    pendentes: int


class RelatorioTransporteDTO(BaseModel):
    filtros: FiltrosRelatorioTransporteDTO
    mensagem: Optional[str] = None
    emitido_por: str
    emitido_em: date
    total_agendamentos: int
    total_embarques: int
    total_faltas: int
    total_pendentes: int
    taxa_comparecimento: float
    taxa_faltas: float
    rota_maior_demanda: str
    linhas: list[LinhaRelatorioTransporteDTO]
    motoristas: list[MotoristaRelatorioTransporteDTO]
    por_faculdade: list[TotalPorCategoriaRelatorioDTO]
    por_bairro: list[TotalPorCategoriaRelatorioDTO]
