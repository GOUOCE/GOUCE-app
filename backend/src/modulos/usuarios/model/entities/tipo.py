from sqlalchemy import Column, Integer, String

from src.shared.infrastructure.db import Base


class TipoORM(Base):
    __tablename__ = "tipo"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tipo_usuario = Column(String(50), nullable=False, unique=True)
