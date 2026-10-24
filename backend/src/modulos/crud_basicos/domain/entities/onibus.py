from typing import Optional

from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey

from src.shared.infrastructure.db import Base


class OnibusORM(Base):
    __tablename__ = "onibus"

    placa_onibus = Column(
        String(20),
        primary_key=True,
        nullable=False,
    )
    qtd_assentos = Column(Integer, nullable=False)
    apelido_onibus = Column(String(100), nullable=True)
    capacidade_maxima = Column(Integer, nullable=False)
    ativo = Column(Boolean, default=True, nullable=False)
    id_foto_onibus = Column(String(36), ForeignKey("arquivos.id", ondelete="SET NULL"), nullable=True)

    @property
    def placa(self) -> str:
        return self.placa_onibus

    @property
    def assentos(self) -> int:
        return self.qtd_assentos

    @property
    def capacidade_em_pe(self) -> int:
        return self.capacidade_maxima

    @property
    def apelido(self) -> Optional[str]:
        return self.apelido_onibus

    @property
    def foto_onibus(self) -> Optional[str]:
        return self.id_foto_onibus


class Onibus(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    placa_onibus: str
    qtd_assentos: int
    capacidade_maxima: int
    apelido_onibus: Optional[str] = None
    ativo: bool = True
    id_foto_onibus: Optional[str] = None

    @property
    def placa(self) -> str:
        return self.placa_onibus

    @property
    def assentos(self) -> int:
        return self.qtd_assentos

    @property
    def capacidade_em_pe(self) -> int:
        return self.capacidade_maxima

    @property
    def apelido(self) -> Optional[str]:
        return self.apelido_onibus

    @property
    def foto_onibus(self) -> Optional[str]:
        return self.id_foto_onibus
