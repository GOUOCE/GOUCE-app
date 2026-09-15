from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime
from src.shared.infrastructure.db import Base
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
    faculdade_id = Column(String(150), unique=True, nullable=False)
    bairro_id = Column(String(20), unique=True, nullable=True)
    id_comprovante_matricula = Column(String(36), ForeignKey("arquivos.id"), nullable=False)
    id_comprovante_residencia = Column(String(36), ForeignKey("arquivos.id"), nullable=False)
    data_nascimento = Column(Integer, default=0, nullable=False)
    identificacao_genero = Column(String(100), nullable=True)
    tem_filhos = Column(Boolean, nullable=True)
    curso = Column(String(150), nullable=False)
    semestre_atual = Column(Integer, nullable=True)
    periodo_ingresso = Column(String(20), nullable=True)
    turno_curso = Column(String(30), nullable=True)
    raca = Column(String(50), nullable=True)
    validade_acesso = Column(DateTime(timezone=True), nullable=True)
    id_foto_aluno = Column(String(255), nullable=True)
    identificacao_sexual = Column(String(100), nullable=True)
    motivo_reprovacao = Column(String(255), nullable=True)
    termos_de_uso = Column(Boolean, nullable=False, default=False)


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
