from datetime import date
from typing import Annotated, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from src.modulos.relatorios.application.dtos.relatorio_transporte_dto import (
    FiltrosRelatorioTransporteDTO,
    RelatorioTransporteDTO,
)
from src.modulos.relatorios.application.services.relatorio_transporte_service import (
    RelatorioTransporteService,
)
from src.modulos.relatorios.infrastructure.repositories.relatorio_transporte_repository import (
    RelatorioTransporteRepository,
)
from src.modulos.relatorios.infrastructure.services.gerador_relatorio_transporte_pdf import (
    gerar_pdf,
)
from src.modulos.relatorios.infrastructure.services.gerador_relatorio_transporte_planilha import (
    gerar_planilha,
)
from src.shared.auth.dependencies import require_roles
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.infrastructure.db import get_session

router = APIRouter(prefix="/relatorios", tags=["Relatórios"])
admin_required = require_roles(CargoEnum.ADMINISTRADOR.value)
TIPOS_RELATORIO = Literal[
    "geral",
    "agendamentos_embarques",
    "motoristas",
    "Agendamentos e embarques",
    "Motoristas",
]


def _service(session: Annotated[Session, Depends(get_session)]) -> RelatorioTransporteService:
    return RelatorioTransporteService(RelatorioTransporteRepository(session))


def _relatorio(
    data_inicio: date,
    data_fim: date,
    tipo: TIPOS_RELATORIO,
    faculdade_id: Optional[int],
    localidade_id: Optional[int],
    bairro_id: Optional[int],
    service: RelatorioTransporteService,
    user: dict,
) -> RelatorioTransporteDTO:
    if data_inicio > data_fim:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "A data final deve ser igual ou posterior à data inicial.",
                "fields": ["dataInicio", "dataFim"],
            },
        )
    if localidade_id is not None and bairro_id is not None and localidade_id != bairro_id:
        raise HTTPException(
            status_code=422,
            detail="Informe apenas um valor para localidadeId/bairroId.",
        )

    filtros = FiltrosRelatorioTransporteDTO(
        tipo=tipo,
        data_inicio=data_inicio,
        data_fim=data_fim,
        faculdade_id=faculdade_id,
        bairro_id=localidade_id if localidade_id is not None else bairro_id,
    )
    return service.gerar(filtros, int(user["current_user_id"]))


@router.get(
    "/transporte-universitario",
    response_model=RelatorioTransporteDTO,
    summary="Consultar relatório quantitativo de transporte",
)
def consultar_relatorio_transporte(
    data_inicio: Annotated[date, Query(alias="dataInicio")],
    data_fim: Annotated[date, Query(alias="dataFim")],
    tipo: Annotated[TIPOS_RELATORIO, Query()] = "geral",
    faculdade_id: Annotated[Optional[int], Query(alias="faculdadeId", gt=0)] = None,
    localidade_id: Annotated[Optional[int], Query(alias="localidadeId", gt=0)] = None,
    bairro_id: Annotated[Optional[int], Query(alias="bairroId", gt=0)] = None,
    service: Annotated[RelatorioTransporteService, Depends(_service)] = None,
    user: dict = Depends(admin_required),
) -> RelatorioTransporteDTO:
    return _relatorio(
        data_inicio,
        data_fim,
        tipo,
        faculdade_id,
        localidade_id,
        bairro_id,
        service,
        user,
    )


@router.get(
    "/transporte-universitario/exportacao",
    response_class=Response,
    summary="Exportar relatório quantitativo de transporte",
)
def exportar_relatorio_transporte(
    data_inicio: Annotated[date, Query(alias="dataInicio")],
    data_fim: Annotated[date, Query(alias="dataFim")],
    formato: Annotated[Literal["pdf", "planilha"], Query()],
    tipo: Annotated[TIPOS_RELATORIO, Query()] = "geral",
    faculdade_id: Annotated[Optional[int], Query(alias="faculdadeId", gt=0)] = None,
    localidade_id: Annotated[Optional[int], Query(alias="localidadeId", gt=0)] = None,
    bairro_id: Annotated[Optional[int], Query(alias="bairroId", gt=0)] = None,
    service: Annotated[RelatorioTransporteService, Depends(_service)] = None,
    user: dict = Depends(admin_required),
) -> Response:
    relatorio = _relatorio(
        data_inicio,
        data_fim,
        tipo,
        faculdade_id,
        localidade_id,
        bairro_id,
        service,
        user,
    )
    if formato == "pdf":
        conteudo = gerar_pdf(relatorio)
        media_type = "application/pdf"
        extensao = "pdf"
    else:
        conteudo = gerar_planilha(relatorio)
        media_type = (
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        extensao = "xlsx"
    nome_arquivo = (
        f"relatorio-transporte-universitario_{data_inicio.isoformat()}_"
        f"{data_fim.isoformat()}.{extensao}"
    )
    return Response(
        content=conteudo,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{nome_arquivo}"'},
    )
