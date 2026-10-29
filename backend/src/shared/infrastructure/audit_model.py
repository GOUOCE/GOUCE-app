from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String, Text, ForeignKey

from src.shared.infrastructure.db import Base


class LogAuditoriaORM(Base):
    __tablename__ = "log_auditoria"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuario.id", ondelete="SET NULL"), nullable=True)
    acao = Column(String(80), nullable=False)
    entidade = Column(String(80), nullable=False)
    entidade_id = Column(Integer, nullable=False)
    valor_anterior = Column(Text, nullable=True)
    valor_novo = Column(Text, nullable=True)
    criado_em = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
