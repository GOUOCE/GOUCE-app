from datetime import datetime, timezone

from sqlalchemy import Boolean, CheckConstraint, Column, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint, text
from sqlalchemy.orm import relationship

from src.shared.infrastructure.db import Base


class RodizioFrotaORM(Base):
    __tablename__ = "rodizio_frota"
    __table_args__ = (
        CheckConstraint("semanas >= 1 AND semanas <= 52", name="ck_rodizio_frota_semanas"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    data_inicio = Column(Date, nullable=False)
    semanas = Column(Integer, nullable=False, default=4, server_default="4")
    ativo = Column(Boolean, nullable=False, default=True, server_default=text("TRUE"))
    usuario_id = Column(Integer, ForeignKey("usuario.id", ondelete="RESTRICT"), nullable=True)
    criado_em = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=text("CURRENT_TIMESTAMP"))
    atualizado_em = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=text("CURRENT_TIMESTAMP"))
    itens = relationship("RodizioFrotaItemORM", cascade="all, delete-orphan", back_populates="rodizio")


class RodizioFrotaItemORM(Base):
    __tablename__ = "rodizio_frota_item"
    __table_args__ = (
        UniqueConstraint("rodizio_id", "rota_id", "turno", name="uq_rodizio_rota_turno"),
        UniqueConstraint("rodizio_id", "onibus_id", "turno", name="uq_rodizio_onibus_turno"),
        CheckConstraint("turno IN ('ida', 'volta')", name="ck_rodizio_frota_turno"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    rodizio_id = Column(Integer, ForeignKey("rodizio_frota.id", ondelete="CASCADE"), nullable=False)
    rota_id = Column(Integer, ForeignKey("rota_principal.id", ondelete="RESTRICT"), nullable=False)
    onibus_id = Column(String(20), ForeignKey("onibus.placa_onibus", ondelete="RESTRICT"), nullable=False)
    turno = Column(String(10), nullable=False, server_default="ida")
    rodizio = relationship("RodizioFrotaORM", back_populates="itens")
