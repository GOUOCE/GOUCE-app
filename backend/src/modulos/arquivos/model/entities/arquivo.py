import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime
from src.shared.infrastructure.db import Base


class ArquivoORM(Base):
    """Tabela de arquivos armazenados no MinIO"""
    __tablename__ = "arquivos"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    content_type = Column(String(100), nullable=True)
    tamanho_bytes = Column(Integer, nullable=True)
    criado_em = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
