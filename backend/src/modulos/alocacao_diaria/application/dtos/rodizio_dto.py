from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RodizioItemDTO(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "rota_id": 1,
                "onibus_id": "ABC1D23",
                "turno": "ida",
            }
        }
    )

    rota_id: int = Field(gt=0, description="ID de uma rota principal ativa.")
    onibus_id: str = Field(
        min_length=1,
        max_length=20,
        description="Placa de um ônibus ativo.",
        examples=["ABC1D23"],
    )
    turno: Literal["ida", "volta"] = Field(
        default="ida",
        description="Turno da rota: ida ou volta.",
    )

    @field_validator("onibus_id", mode="before")
    @classmethod
    def normalizar_onibus_id(cls, valor: object) -> str:
        return str(valor).strip().upper().replace("-", "")


class RodizioRequestDTO(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "data_inicio": "2026-11-23",
                "semanas": 4,
                "itens": [
                    {
                        "rota_id": 1,
                        "onibus_id": "ABC1D23",
                        "turno": "ida",
                    },
                    {
                        "rota_id": 1,
                        "onibus_id": "ABC1D23",
                        "turno": "volta",
                    },
                    {
                        "rota_id": 2,
                        "onibus_id": "XYZ9K87",
                        "turno": "ida",
                    },
                ],
            }
        }
    )

    data_inicio: date = Field(
        description="Primeira data da escala. O sistema utiliza a segunda-feira da semana correspondente."
    )
    semanas: int = Field(
        default=4,
        ge=1,
        le=52,
        description="Quantidade de semanas geradas na prévia ou mantidas pelo rodízio.",
    )
    itens: list[RodizioItemDTO] = Field(
        default_factory=list,
        description=(
            "Vínculos entre rota, ônibus e turno. O mesmo ônibus pode ser usado em "
            "ida e volta, mas não pode ser usado em duas rotas no mesmo turno."
        ),
    )
