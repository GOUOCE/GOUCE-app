from datetime import date
from typing import Any, Literal, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from src.modulos.relatorios.application.services.relatorio_exportacao_service import (
    RelatorioExportacaoService,
)
from src.modulos.relatorios.application.services.relatorio_service import (
    RelatorioService,
    RelatorioValidationError,
)
from src.shared.auth.dependencies import require_roles
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.infrastructure.db import get_session

admin_required = require_roles(CargoEnum.ADMINISTRADOR.value)

router = APIRouter(prefix="/transporte/relatorios", tags=["Relatórios"])


def _erro_validacao(exc: RelatorioValidationError) -> HTTPException:
    return HTTPException(
        status_code=422,
        detail=[
            {
                "loc": ["query", campo],
                "msg": exc.mensagem,
                "type": "value_error",
            }
            for campo in exc.campos
        ]
        or exc.mensagem,
    )


@router.get("")
async def gerar_relatorio(
    tipo: Literal["geral", "agendamentos", "motoristas"] = Query(
        default="agendamentos"
    ),
    data_inicio: date = Query(...),
    data_fim: date = Query(...),
    faculdade_id: Optional[int] = Query(default=None),
    bairro_id: Optional[int] = Query(default=None),
    session: Session = Depends(get_session),
    usuario: dict = Depends(admin_required),
) -> dict:
    del usuario
    try:
        return RelatorioService(session).gerar(
            tipo=tipo,
            data_inicio=data_inicio,
            data_fim=data_fim,
            faculdade_id=faculdade_id,
            bairro_id=bairro_id,
        )
    except RelatorioValidationError as exc:
        raise _erro_validacao(exc) from exc


@router.post("/exportar")
async def exportar_relatorio(
    relatorio: dict[str, Any] = Body(...),
    formato: Literal["pdf", "csv"] = Query(...),
    usuario: dict = Depends(admin_required),
) -> Response:
    del usuario
    try:
        conteudo, nome_arquivo, mensagem = RelatorioExportacaoService().exportar(
            relatorio, formato
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    tipo_midia = (
        "application/pdf" if formato == "pdf" else "text/csv; charset=utf-8"
    )
    return Response(
        content=conteudo,
        media_type=tipo_midia,
        headers={
            "Content-Disposition": f'attachment; filename="{nome_arquivo}"',
            "X-Mensagem-Relatorio": mensagem,
        },
    )
