"""add creation date to usuario

Revision ID: 61_add_data_criacao_usuario
Revises: 60_add_campus_to_aluno
Create Date: 2026-09-30

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "61_add_data_criacao_usuario"
down_revision: Union[str, None] = "60_add_campus_to_aluno"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "usuario",
        sa.Column(
            "data_criacao",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )


def downgrade() -> None:
    op.drop_column("usuario", "data_criacao")