from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Time,
    func,
    text,
)
from sqlalchemy.orm import relationship

from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
from src.shared.infrastructure.db import Base

rota_principal_bairro = Table(
    "rota_principal_bairro",
    Base.metadata,
    Column(
        "rota_id",
        Integer,
        ForeignKey("rota_principal.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "bairro_id",
        Integer,
        ForeignKey("bairro.bairro_id", ondelete="RESTRICT"),
        primary_key=True,
    ),
)

rota_principal_faculdade_ida = Table(
    "rota_principal_faculdade_ida",
    Base.metadata,
    Column(
        "rota_id",
        Integer,
        ForeignKey("rota_principal.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "faculdade_id",
        Integer,
        ForeignKey("faculdade.id_faculdade", ondelete="RESTRICT"),
        primary_key=True,
    ),
)

rota_principal_faculdade_volta = Table(
    "rota_principal_faculdade_volta",
    Base.metadata,
    Column(
        "rota_id",
        Integer,
        ForeignKey("rota_principal.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "faculdade_id",
        Integer,
        ForeignKey("faculdade.id_faculdade", ondelete="RESTRICT"),
        primary_key=True,
    ),
)


class RotaPrincipalORM(Base):
    """Rota principal com horários e vínculos independentes de ida e volta."""

    __tablename__ = "rota_principal"
    __table_args__ = (
        CheckConstraint(
            "horario_retorno > horario_saida",
            name="ck_rota_principal_retorno_apos_saida",
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(150), nullable=False)
    horario_saida = Column(Time, nullable=False)
    horario_retorno = Column(Time, nullable=False)
    ativo = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("TRUE"),
        index=True,
    )
    data_criacao = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=text("CURRENT_TIMESTAMP"),
    )

    bairros = relationship(BairroORM, secondary=rota_principal_bairro)
    faculdades_ida = relationship(
        FaculdadeORM, secondary=rota_principal_faculdade_ida
    )
    faculdades_volta = relationship(
        FaculdadeORM, secondary=rota_principal_faculdade_volta
    )


# Nome único sem diferenciar maiúsculas e espaços nas pontas (ativas e inativas).
Index(
    "uq_rota_principal_nome_lower",
    func.lower(func.trim(RotaPrincipalORM.nome)),
    unique=True,
)
