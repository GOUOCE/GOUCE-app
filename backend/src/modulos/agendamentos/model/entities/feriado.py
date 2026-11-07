from datetime import date

from sqlalchemy import Column, Date, Integer, String

from src.shared.infrastructure.db import Base


class FeriadoORM(Base):
    __tablename__ = "feriado_recesso"

    id = Column(Integer, primary_key=True, autoincrement=True)
    data = Column(Date, nullable=False, unique=True, index=True)
    tipo = Column(String(10), nullable=False)
    descricao = Column(String(255), nullable=False)
