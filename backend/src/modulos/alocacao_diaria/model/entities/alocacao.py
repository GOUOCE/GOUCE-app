from sqlalchemy import CheckConstraint, Column, Date, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from src.shared.infrastructure.db import Base


class AlocacaoDiariaORM(Base):
    __tablename__ = "alocacao_diaria"
    __table_args__ = (
        UniqueConstraint("data", "onibus_id", "turno", name="uq_alocacao_diaria_onibus"),
        UniqueConstraint("data", "motorista_id", "turno", name="uq_alocacao_diaria_motorista"),
        CheckConstraint("turno IN ('ida', 'volta')", name="ck_alocacao_diaria_turno"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    rota_id = Column(Integer, ForeignKey("rota_principal.id", ondelete="RESTRICT"), nullable=False)
    onibus_id = Column(String(20), ForeignKey("onibus.placa_onibus", ondelete="RESTRICT"), nullable=False)
    data = Column(Date, nullable=False)
    motorista_id = Column(Integer, ForeignKey("motorista.id", ondelete="RESTRICT"), nullable=False)
    turno = Column(String(10), nullable=False, server_default="ida")
    alunos = relationship("AlocacaoAlunoORM", cascade="all, delete-orphan", back_populates="alocacao")


class AlocacaoAlunoORM(Base):
    __tablename__ = "alocacao_aluno"
    __table_args__ = (
        UniqueConstraint("agendamento_id", "turno", name="uq_alocacao_aluno_agendamento_turno"),
        CheckConstraint("turno IN ('ida', 'volta')", name="ck_alocacao_aluno_turno"),
        CheckConstraint("tipo_lugar IN ('sentado', 'em_pe')", name="ck_alocacao_aluno_tipo_lugar"),
        CheckConstraint("status IN ('ALOCADO', 'CANCELADO')", name="ck_alocacao_aluno_status"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    alocacao_diaria_id = Column(Integer, ForeignKey("alocacao_diaria.id", ondelete="CASCADE"), nullable=False)
    agendamento_id = Column(Integer, ForeignKey("agendamento.id", ondelete="RESTRICT"), nullable=False)
    turno = Column(String(10), nullable=False)
    tipo_lugar = Column(String(10), nullable=False)
    status = Column(String(15), nullable=False, server_default="ALOCADO")
    alocacao = relationship("AlocacaoDiariaORM", back_populates="alunos")
