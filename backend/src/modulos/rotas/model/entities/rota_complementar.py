from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Time,
    func,
    text,
)
from sqlalchemy.orm import relationship

from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM
from src.shared.infrastructure.db import Base


class RotaComplementarORM(Base):
    """Rota complementar: um horário de saída, um de retorno e o ponto de conexão com uma principal."""

    __tablename__ = "rota_complementar"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rota_principal_id = Column(
        Integer,
        ForeignKey("rota_principal.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    nome = Column(String(150), nullable=False)
    horario_saida = Column(Time, nullable=False)
    horario_retorno = Column(Time, nullable=False)
    ponto_conexao = Column(String(150), nullable=False)
    ativo = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("TRUE"),
        index=True,
    )
    data_criacao = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=text("CURRENT_TIMESTAMP"),
    )

    rota_principal = relationship(RotaPrincipalORM)


# Nome único sem diferenciar maiúsculas e espaços nas pontas (ativas e inativas).
# Entre principais e complementares, a unicidade é conferida em nome_rota.py.
Index(
    "uq_rota_complementar_nome_lower",
    func.lower(func.trim(RotaComplementarORM.nome)),
    unique=True,
)
