from sqlalchemy import Column, Integer, String, Enum
from src.shared.infrastructure.db import Base
from src.shared.enums.cargo_enum import CargoEnum
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import DateTime
from datetime import datetime, timezone


class UsuarioORM(Base):
    """Tabela de usuário centralizada com dados comuns"""
    __tablename__ = "usuario"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    nome_completo = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    telefone = Column(String(20), unique=True, nullable=True)
    senha = Column(String(255), nullable=False)
    tentativas_falhas = Column(Integer, default=0, nullable=False)
    limite_de_bloqueio = Column(DateTime(timezone=True), nullable=True)
    


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
