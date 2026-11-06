from datetime import date, datetime, timezone

from sqlalchemy import Boolean, CheckConstraint, Column, Date, DateTime, ForeignKey
from sqlalchemy import Index, Integer, String, text

from src.shared.infrastructure.db import Base


class AgendamentoORM(Base):
    __tablename__ = "agendamento"
    __table_args__ = (
        CheckConstraint(
            "(usa_ida OR usa_volta)",
            name="ck_agendamento_um_trecho",
        ),
        Index(
            "ix_agendamento_aluno_data_status",
            "aluno_id",
            "data",
            "status",
        ),
        Index(
            "uq_agendamento_aluno_data_ativo",
            "aluno_id",
            "data",
            unique=True,
            postgresql_where=text("status = 'ATIVO'"),
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    aluno_id = Column(
        Integer,
        ForeignKey("aluno.aluno_id", ondelete="CASCADE"),
        nullable=False,
    )
    data = Column(Date, nullable=False)
    usa_ida = Column(Boolean, nullable=False)
    usa_volta = Column(Boolean, nullable=False)
    ponto_embarque_id = Column(
        Integer, ForeignKey("ponto_de_parada.ponto_id", ondelete="RESTRICT"), nullable=True
    )
    ies_destino_id = Column(
        Integer, ForeignKey("faculdade.id_faculdade", ondelete="RESTRICT"), nullable=True
    )
    rota_complementar_ida_id = Column(
        Integer, ForeignKey("rota_complementar.id", ondelete="RESTRICT"), nullable=True
    )
    ies_origem_id = Column(
        Integer, ForeignKey("faculdade.id_faculdade", ondelete="RESTRICT"), nullable=True
    )
    ponto_desembarque_id = Column(
        Integer, ForeignKey("ponto_de_parada.ponto_id", ondelete="RESTRICT"), nullable=True
    )
    rota_complementar_volta_id = Column(
        Integer, ForeignKey("rota_complementar.id", ondelete="RESTRICT"), nullable=True
    )
    status = Column(
        String(15), nullable=False, default="ATIVO", server_default=text("'ATIVO'")
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=text("CURRENT_TIMESTAMP"),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=text("CURRENT_TIMESTAMP"),
    )
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    @property
    def data_agendamento(self) -> date:
        return self.data
