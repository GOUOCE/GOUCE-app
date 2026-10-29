"""expand transgenero for encrypted values

Revision ID: 59_expand_transgenero_length
Revises: 58_required_demographic_fields
Create Date: 2026-09-26

"""
from typing import Sequence, Union

from alembic import op


revision: str = "59_expand_transgenero_length"
down_revision: Union[str, None] = "58_required_demographic_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE aluno ALTER COLUMN transgenero TYPE VARCHAR(500)"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE aluno ALTER COLUMN transgenero TYPE VARCHAR(30)"
    )