"""Apoio compartilhado pelos testes da HU-011 (não é coletado como teste)."""

import json
import os
from urllib.parse import urlsplit

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://test:test@localhost:5432/test",
)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
from src.modulos.crud_basicos.domain.entities.ponto_de_parada import PontoDeParadaORM
from src.modulos.rotas.model.entities.rota_principal import (
    RotaPrincipalORM,
    rota_principal_bairro,
    rota_principal_faculdade_ida,
    rota_principal_faculdade_volta,
)
from src.shared.infrastructure.audit_model import LogAuditoriaORM
from src.shared.infrastructure.db import Base

TABELAS = [
    BairroORM.__table__,
    PontoDeParadaORM.__table__,
    FaculdadeORM.__table__,
    LogAuditoriaORM.__table__,
    RotaPrincipalORM.__table__,
    rota_principal_bairro,
    rota_principal_faculdade_ida,
    rota_principal_faculdade_volta,
]

# IDs da massa: bairros 1 e 2 ativos, 3 inativo; faculdades 1 a 3 ativas, 4 inativa.
BAIRRO_CENTRO, BAIRRO_CAMPO_VELHO, BAIRRO_INATIVO = 1, 2, 3
UFC, IFCE, UECE, FACULDADE_INATIVA = 1, 2, 3, 4
ADMIN_ID = 42


def criar_engine():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine, tables=TABELAS)
    return engine


def semear_base(session):
    session.add_all(
        [
            BairroORM(bairro_id=1, nome="Centro", ativo=True),
            BairroORM(bairro_id=2, nome="Campo Velho", ativo=True),
            BairroORM(bairro_id=3, nome="Alto São Francisco", ativo=False),
            PontoDeParadaORM(ponto_id=1, nome="Praça Matriz", bairro_id=1, ativo=True),
            FaculdadeORM(id_faculdade=1, nome_faculdade="UFC", campus_faculdade="Quixadá", ativo=True),
            FaculdadeORM(id_faculdade=2, nome_faculdade="IFCE", campus_faculdade="Quixadá", ativo=True),
            FaculdadeORM(id_faculdade=3, nome_faculdade="UECE", campus_faculdade="Quixadá", ativo=True),
            FaculdadeORM(id_faculdade=4, nome_faculdade="Unicatólica", campus_faculdade="Quixadá", ativo=False),
        ]
    )
    session.commit()


def novo_session(engine):
    return sessionmaker(bind=engine)()


def dados_rota(**alteracoes):
    """Payload JSON válido de uma rota (Rota Centro - UFC)."""
    dados = {
        "nome": "Rota Centro - UFC",
        "horario_saida": "06:30",
        "horario_retorno": "17:30",
        "bairros_ids": [BAIRRO_CENTRO],
        "faculdades_ida_ids": [UFC],
        "faculdades_volta_ids": [UFC],
    }
    dados.update(alteracoes)
    return dados


async def asgi_request(app, metodo, caminho, corpo=None):
    """Chama o app ASGI sem rede nem servidor; devolve ``(status, json)``."""
    partes = urlsplit(caminho)
    corpo_bruto = b"" if corpo is None else json.dumps(corpo).encode("utf-8")
    mensagens = []
    enviado = False

    async def receive():
        nonlocal enviado
        if enviado:
            return {"type": "http.disconnect"}
        enviado = True
        return {"type": "http.request", "body": corpo_bruto, "more_body": False}

    async def send(mensagem):
        mensagens.append(mensagem)

    escopo = {
        "type": "http", "asgi": {"version": "3.0", "spec_version": "2.3"},
        "http_version": "1.1", "method": metodo, "scheme": "http",
        "path": partes.path, "raw_path": partes.path.encode(),
        "query_string": partes.query.encode(),
        "headers": [
            (b"content-type", b"application/json"),
            (b"content-length", str(len(corpo_bruto)).encode()),
        ],
        "client": ("testclient", 50000), "server": ("testserver", 80),
        "root_path": "", "state": {},
    }
    await app(escopo, receive, send)
    inicio = next(m for m in mensagens if m["type"] == "http.response.start")
    resposta = b"".join(m.get("body", b"") for m in mensagens if m["type"] == "http.response.body")
    return inicio["status"], json.loads(resposta)
