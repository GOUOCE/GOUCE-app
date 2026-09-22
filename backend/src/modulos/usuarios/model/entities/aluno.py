from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Enum as SQLEnum
from src.shared.infrastructure.db import Base
from src.shared.security.lgpd_encryption import EncryptedString
from src.shared.enums.turno_curso_enum import TurnoCursoEnum
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AlunoORM(Base):
    """Tabela de aluno com dados específicos do estudante"""
    __tablename__ = "aluno"
    
    aluno_id = Column(
        Integer, 
        ForeignKey("usuario.id", ondelete="CASCADE"), 
        nullable=False,
        primary_key=True
    )
    status_cadastro = Column(String(150), nullable=False)
    faculdade_id = Column(String(150), nullable=False)
    bairro_id = Column(String(20), nullable=True)
    id_comprovante_matricula = Column(String(36), ForeignKey("arquivos.id"), nullable=False)
    id_comprovante_residencia = Column(String(36), ForeignKey("arquivos.id"), nullable=False)
    data_nascimento = Column(Integer, default=0, nullable=False)
    identificacao_genero = Column(EncryptedString(500), nullable=True)
    tem_filhos = Column(Boolean, nullable=True)
    curso = Column(String(150), nullable=False)
    semestre_atual = Column(Integer, nullable=True)
    periodo_ingresso = Column(String(20), nullable=True)
    turno_curso = Column(SQLEnum("Matutino", "Vespertino", "Noturno", "Integral", name="turno_curso_enum"), nullable=True)
    raca = Column(EncryptedString(500), nullable=True)
    validade_acesso = Column(DateTime(timezone=True), nullable=True)
    id_foto_aluno = Column(String(36), ForeignKey("arquivos.id"), nullable=True)
    identificacao_sexual = Column(EncryptedString(500), nullable=True)
    motivo_reprovacao = Column(String(255), nullable=True)
    termos_de_uso = Column(Boolean, nullable=False, default=False)
    consentimento_lgpd_em = Column(DateTime(timezone=True), nullable=True)
    versao_termos = Column(String(20), default="1.0", nullable=True)

class Aluno(BaseModel):
    """DTO para usuário"""
    model_config = {"from_attributes": True}
    
    id: Optional[int] = None
    nome: str
    email: str
    telefone: Optional[str] = None
    senha: str
    tentativas_falhas: int = 0
    limite_de_bloqueio: Optional[datetime] = None
