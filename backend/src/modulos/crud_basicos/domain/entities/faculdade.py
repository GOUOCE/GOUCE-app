from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, ConfigDict
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
    UniqueConstraint,
    text,
)

from src.shared.infrastructure.db import Base


class FaculdadeORM(Base):
    __tablename__ = "faculdade"
    __table_args__ = (
        UniqueConstraint(
            "nome_faculdade",
            "campus_faculdade",
            name="uq_faculdade_nome_campus",
        ),
    )

    id_faculdade = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        nullable=False,
    )
    nome_faculdade = Column(String(255), nullable=False)
    sigla = Column(String(50), nullable=True)
    campus_faculdade = Column(String(255), nullable=False)
    ativo = Column(Boolean, default=True, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=text("CURRENT_TIMESTAMP"),
    )

    @property
    def id(self) -> int:
        return self.id_faculdade

    @property
    def nome(self) -> str:
        return self.nome_faculdade

    @property
    def campus(self) -> str:
        return self.campus_faculdade


class Faculdade(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id_faculdade: Optional[int] = None
    nome_faculdade: str
    sigla: Optional[str] = None
    campus_faculdade: str
    ativo: bool = True

    @property
    def id(self) -> Optional[int]:
        return self.id_faculdade

    @property
    def nome(self) -> str:
        return self.nome_faculdade

    @property
    def campus(self) -> str:
        return self.campus_faculdade
