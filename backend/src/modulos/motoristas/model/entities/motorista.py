from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String, text

from src.shared.infrastructure.db import Base
from src.shared.security.lgpd_encryption import EncryptedString


class MotoristaORM(Base):
    """Cadastro operacional de motoristas, sem credenciais de acesso.

    Nome e telefone são dados pessoais e seguem o mesmo tipo criptografado
    utilizado pelo modelo central de usuários.
    """

    __tablename__ = "motorista"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome_completo = Column(EncryptedString(500), nullable=False)
    telefone = Column(EncryptedString(500), nullable=False)
    telefone_hash = Column(String(64), nullable=False, unique=True, index=True)
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
