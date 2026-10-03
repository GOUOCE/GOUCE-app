from sqlalchemy import Boolean, Column, Integer, String, Enum, text
from src.shared.infrastructure.db import Base
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.security.lgpd_encryption import EncryptedString
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import DateTime
from datetime import datetime, timezone


class UsuarioORM(Base):
    """Tabela de usuário centralizada com dados comuns"""
    __tablename__ = "usuario"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    nome_completo = Column(EncryptedString(500), nullable=False)
    email = Column(EncryptedString(500), nullable=False)
    email_hash = Column(String(64), index=True, nullable=True)
    ativo = Column(Boolean, default=True, nullable=False)
    telefone = Column(EncryptedString(500), nullable=True)
    senha = Column(String(255), nullable=False)
    tentativas_falhas = Column(Integer, default=0, nullable=False)
    limite_de_bloqueio = Column(DateTime(timezone=True), nullable=True)
    data_criacao = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=text("CURRENT_TIMESTAMP"),
    )

    


class Usuario(BaseModel):
    """DTO para usuário"""
    model_config = {"from_attributes": True}
    
    id: Optional[int] = None
    nome: str
    email: str
    telefone: Optional[str] = None
    senha: str
    tentativas_falhas: int = 0
    limite_de_bloqueio: Optional[datetime] = None
    data_criacao: datetime
