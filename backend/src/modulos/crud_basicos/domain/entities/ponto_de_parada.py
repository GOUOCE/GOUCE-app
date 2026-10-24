from typing import Optional

from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from src.shared.infrastructure.db import Base


class PontoDeParadaORM(Base):
    __tablename__ = "ponto_de_parada"

    ponto_id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        nullable=False
    )

    nome = Column(
        String(150),
        nullable=False
    )

    bairro_id = Column(
        Integer,
        ForeignKey("bairro.bairro_id"),
        nullable=False
    )

    bairro = relationship(
        "BairroORM",
        back_populates="pontos_de_parada"
    )

    ativo = Column(Boolean, default=True, nullable=False)

    @property
    def id(self) -> int:
        return self.ponto_id

    @property
    def nome_ponto(self) -> str:
        return self.nome


class PontoDeParada(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )

    ponto_id: Optional[int] = None
    nome: str
    bairro_id: int
    ativo: bool

    @property
    def id(self) -> Optional[int]:
        return self.ponto_id

    @property
    def nome_ponto(self) -> str:
        return self.nome

    @property
    def is_ativo(self) -> bool:
        return self.ativo
