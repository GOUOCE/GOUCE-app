"""add transgenero and require demographic fields

Revision ID: 58_required_demographic_fields
Revises: 57c7b1bb7ac3
Create Date: 2026-09-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "58_required_demographic_fields"
down_revision: Union[str, None] = "57c7b1bb7ac3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE aluno ADD COLUMN IF NOT EXISTS transgenero VARCHAR(500)"
    )

    # Existing rows need valid values before the NOT NULL constraints are applied.
    op.execute(
        "UPDATE aluno SET identificacao_genero = 'Prefiro não dizer' "
        "WHERE identificacao_genero IS NULL"
    )
    op.execute(
        "UPDATE aluno SET tem_filhos = FALSE WHERE tem_filhos IS NULL"
    )
    op.execute(
        "UPDATE aluno SET raca = 'Prefiro não dizer' WHERE raca IS NULL"
    )
    op.execute(
        "UPDATE aluno SET transgenero = 'Prefiro não dizer' "
        "WHERE transgenero IS NULL"
    )

    for column_name in (
        "identificacao_genero",
        "tem_filhos",
        "raca",
        "transgenero",
    ):
        op.alter_column(
            "aluno",
            column_name,
            existing_nullable=True,
            nullable=False,
        )


def downgrade() -> None:
    for column_name in ("identificacao_genero", "tem_filhos", "raca"):
        op.alter_column(
            "aluno",
            column_name,
            existing_nullable=False,
            nullable=True,
        )

    op.drop_column("aluno", "transgenero")