"""Apoio compartilhado pelos testes da HU-012 (não é coletado como teste)."""

from datetime import time

from tests.rota_principal_support import (  # noqa: F401
    ADMIN_ID,
    TABELAS,
    asgi_request,
    novo_session,
)

from sqlalchemy import create_engine

from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM
from src.shared.infrastructure.db import Base

# IDs da massa: principais 1 e 2 ativas, 3 inativa.
PRINCIPAL_CENTRO, PRINCIPAL_INTEGRADA, PRINCIPAL_INATIVA = 1, 2, 3


def criar_engine():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine, tables=TABELAS)
    return engine


def semear_principais(session):
    session.add_all(
        [
            RotaPrincipalORM(
                id=1, nome="Rota Centro - UFC", horario_saida=time(6, 30),
                horario_retorno=time(17, 30), ativo=True,
            ),
            RotaPrincipalORM(
                id=2, nome="Rota Integrada", horario_saida=time(7, 0),
                horario_retorno=time(18, 0), ativo=True,
            ),
            RotaPrincipalORM(
                id=3, nome="Rota Antiga", horario_saida=time(5, 30),
                horario_retorno=time(12, 0), ativo=False,
            ),
        ]
    )
    session.commit()


def dados_complementar(**alteracoes):
    """Payload JSON válido de uma rota complementar (Van 2 - Bairro Novo)."""
    dados = {
        "nome": "Van 2 - Bairro Novo",
        "horario_saida": "06:00",
        "horario_retorno": "17:40",
        "ponto_conexao": "Trevo do Bairro Novo",
        "rota_principal_id": PRINCIPAL_CENTRO,
    }
    dados.update(alteracoes)
    return dados
