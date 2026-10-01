from sqlalchemy import Column, ForeignKey, Integer

from src.shared.infrastructure.db import Base


class UsuarioTipoORM(Base):
    __tablename__ = "usuario_tipo"

    id_usuario = Column(
        Integer,
        ForeignKey("usuario.id", ondelete="CASCADE"),
        primary_key=True,
    )
    id_tipo = Column(
        Integer,
        ForeignKey("tipo.id", ondelete="CASCADE"),
        primary_key=True,
    )
