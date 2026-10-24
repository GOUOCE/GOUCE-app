from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from typing import Optional
from pydantic import BaseModel, ConfigDict
from .ponto_de_parada import PontoDeParada


from src.shared.infrastructure.db import Base


class BairroORM(Base):
    __tablename__ = "bairro"

    bairro_id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        nullable=False
    )

    nome = Column(
        String(100),
        nullable=False
    )

    pontos_de_parada = relationship(
        "PontoDeParadaORM",
        back_populates="bairro",
        cascade="all, delete-orphan"
    )

    ativo = Column(Boolean, default=True, nullable=False)


class Bairro(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )

    bairro_id: Optional[int] = None
    nome: str
    pontos_de_parada: list[PontoDeParada] = []
    ativo: bool

    @property
    def id(self) -> Optional[int]:
        return self.bairro_id

    @property
    def nome_bairro(self) -> str:
        return self.nome

    @property
    def is_ativo(self) -> bool:
        return self.ativo
