from sqlalchemy import Column, String, Enum
from src.shared.enums.uf_enum import UFEnum
from sqlalchemy import Column, Integer, Boolean
from sqlalchemy import ForeignKey
from sqlalchemy import DateTime
from sqlalchemy.orm import relationship
from src.shared.infrastructure.db import Base
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone


class AdministradorORM(Base):
    __tablename__ = "administrador"
    
    administrador_id = Column(
        Integer, 
        ForeignKey("usuario.id", ondelete="CASCADE"), 
        nullable=False,
        primary_key=True
    )
    is_administrador_ativo  = Column(Boolean, default=True, nullable=False)
    


class Administrador(BaseModel):
    """DTO para adm"""
    model_config = {"from_attributes": True}
    
    id: Optional[int] = None
    nome: str
    email: str
    telefone: Optional[str] = None
    senha: str
    tentativas_falhas: int = 0
    limite_de_bloqueio: Optional[datetime] = None
