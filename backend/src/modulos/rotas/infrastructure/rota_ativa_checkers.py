"""Consultas "pertence a uma rota principal ativa?" para bairro, ponto e faculdade.

Cada função devolve o ``Callable[[int], bool]`` esperado pelo parâmetro
``rota_ativa_checker`` dos repositories de ``crud_basicos``. Como a rota vincula
bairros (e não pontos), um ponto de parada pertence a uma rota ativa quando o
bairro dele está vinculado a uma.
"""

from typing import Callable

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.modulos.crud_basicos.domain.entities.ponto_de_parada import (
    PontoDeParadaORM,
)
from src.modulos.rotas.model.entities.rota_principal import (
    RotaPrincipalORM,
    rota_principal_bairro,
    rota_principal_faculdade_ida,
    rota_principal_faculdade_volta,
)


def _existe_rota_ativa(session: Session, consulta) -> bool:
    return session.execute(consulta.limit(1)).first() is not None


def bairro_em_rota_ativa(session: Session) -> Callable[[int], bool]:
    def checker(bairro_id: int) -> bool:
        return _existe_rota_ativa(
            session,
            select(RotaPrincipalORM.id)
            .join(
                rota_principal_bairro,
                rota_principal_bairro.c.rota_id == RotaPrincipalORM.id,
            )
            .where(
                RotaPrincipalORM.ativo.is_(True),
                rota_principal_bairro.c.bairro_id == bairro_id,
            ),
        )

    return checker


def ponto_em_rota_ativa(session: Session) -> Callable[[int], bool]:
    def checker(ponto_id: int) -> bool:
        return _existe_rota_ativa(
            session,
            select(RotaPrincipalORM.id)
            .join(
                rota_principal_bairro,
                rota_principal_bairro.c.rota_id == RotaPrincipalORM.id,
            )
            .join(
                PontoDeParadaORM,
                PontoDeParadaORM.bairro_id == rota_principal_bairro.c.bairro_id,
            )
            .where(
                RotaPrincipalORM.ativo.is_(True),
                PontoDeParadaORM.ponto_id == ponto_id,
            ),
        )

    return checker


def faculdade_em_rota_ativa(session: Session) -> Callable[[int], bool]:
    def checker(faculdade_id: int) -> bool:
        for vinculo in (
            rota_principal_faculdade_ida,
            rota_principal_faculdade_volta,
        ):
            if _existe_rota_ativa(
                session,
                select(RotaPrincipalORM.id)
                .join(vinculo, vinculo.c.rota_id == RotaPrincipalORM.id)
                .where(
                    RotaPrincipalORM.ativo.is_(True),
                    vinculo.c.faculdade_id == faculdade_id,
                ),
            ):
                return True
        return False

    return checker
