from sqlalchemy import Column, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from src.shared.infrastructure.db import Base
from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RepresentanteORM(Base):
    __tablename__ = "representante"
    
    administrador_id = Column(
        Integer, 
        ForeignKey("usuario.id", ondelete="CASCADE"), 
        nullable=False,
        primary_key=True
    )
    is_representante_ativo = Column(Boolean, default=True, nullable=False)
    id_faculdade_responsavel = Column(
        Integer,
        ForeignKey("faculdade.id_faculdade"),
        nullable=True,
    )
    faculdade = relationship("FaculdadeORM", foreign_keys=[id_faculdade_responsavel], lazy="joined")


class Representante(BaseModel):
    model_config = {"from_attributes": True}
    
    id: Optional[int] = None
    nome: str
    email: str
    telefone: Optional[str] = None
    senha: str
    tentativas_falhas: int = 0
    limite_de_bloqueio: Optional[datetime] = None
