"""recreate password reset token table when it is missing

Revision ID: 67_add_password_reset_token
Revises: 66_add_reenvio_datas_aluno
Create Date: 2026-10-03

"""
from typing import Sequence, Union

from alembic import op


revision: str = "67_add_password_reset_token"
down_revision: Union[str, None] = "66_add_reenvio_datas_aluno"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS password_reset_token (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER NOT NULL
                REFERENCES usuario(id) ON DELETE CASCADE,
            token_hash VARCHAR(64) NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            used_at TIMESTAMP WITH TIME ZONE NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL
        )
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS ix_password_reset_token_token_hash
        ON password_reset_token (token_hash)
        """
    )


def downgrade() -> None:
    op.execute(
        "DROP INDEX IF EXISTS ix_password_reset_token_token_hash"
    )
    op.execute(
        "DROP TABLE IF EXISTS password_reset_token"
    )
