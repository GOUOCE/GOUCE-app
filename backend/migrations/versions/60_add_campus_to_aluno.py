"""add campus to aluno

Revision ID: 60_add_campus_to_aluno
Revises: 59_expand_transgenero_length
Create Date: 2026-09-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "60_add_campus_to_aluno"
down_revision: Union[str, None] = "59_expand_transgenero_length"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE aluno ADD COLUMN IF NOT EXISTS campus VARCHAR(150)"
    )


def downgrade() -> None:
    op.drop_column("aluno", "campus")