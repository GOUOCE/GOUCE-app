from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from src.modulos.auth.domain.entities.password_reset_token import PasswordResetTokenORM
from src.modulos.auth.domain.repositories.i_password_reset_token_repository import (
    IPasswordResetTokenRepository,
)


class SQLAlchemyPasswordResetTokenRepository(IPasswordResetTokenRepository):
    def __init__(self, session: Session):
        self.session = session

    def create_token(self, usuario_id: int, token_hash: str, expires_at: datetime) -> PasswordResetTokenORM:
        token_orm = PasswordResetTokenORM(
            usuario_id=usuario_id,
            token_hash=token_hash,
            expires_at=expires_at,
            created_at=datetime.now(timezone.utc),
        )
        self.session.add(token_orm)
        self.session.commit()
        self.session.refresh(token_orm)
        return token_orm

    def find_by_hash(self, token_hash: str) -> Optional[PasswordResetTokenORM]:
        return (
            self.session.query(PasswordResetTokenORM)
            .filter(PasswordResetTokenORM.token_hash == token_hash)
            .first()
        )

    def deactivate_active_tokens_for_user(self, usuario_id: int) -> None:
        agora = datetime.now(timezone.utc)
        self.session.query(PasswordResetTokenORM).filter(
            PasswordResetTokenORM.usuario_id == usuario_id,
            PasswordResetTokenORM.used_at.is_(None),
        ).update({"used_at": agora}, synchronize_session=False)
        self.session.commit()

    def mark_as_used(self, token_id: int, used_at: Optional[datetime] = None) -> None:
        data_uso = used_at or datetime.now(timezone.utc)
        self.session.query(PasswordResetTokenORM).filter(
            PasswordResetTokenORM.id == token_id
        ).update({"used_at": data_uso}, synchronize_session=False)
        self.session.commit()
