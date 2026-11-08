from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, text

from src.shared.infrastructure.db import Base


class AvisoORM(Base):
    """Comunicado publicado por um administrador no Mural de Avisos (HU-023)."""

    __tablename__ = "aviso"

    id = Column(Integer, primary_key=True, autoincrement=True)
    titulo = Column(String(150), nullable=False)
    descricao = Column(Text, nullable=False)
    autor_id = Column(
        Integer,
        ForeignKey("usuario.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    data_criacao = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=text("CURRENT_TIMESTAMP"),
        index=True,
    )
