"""add sigla to faculdade table

Revision ID: 75_add_sigla_to_faculdade
Revises: 74_bairro_fk_in_aluno
Create Date: 2026-10-24

"""
from typing import Sequence, Union

from alembic import context, op
import sqlalchemy as sa


revision: str = "75_add_sigla_to_faculdade"
down_revision: Union[str, None] = "74_bairro_fk_in_aluno"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing_tables = (
        set()
        if context.is_offline_mode()
        else set(sa.inspect(bind).get_table_names())
    )

    if "faculdade" in existing_tables:
        existing_columns = {
            col["name"] for col in sa.inspect(bind).get_columns("faculdade")
        }
        if "sigla" not in existing_columns:
            op.add_column("faculdade", sa.Column("sigla", sa.String(length=50), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    existing_tables = (
        set()
        if context.is_offline_mode()
        else set(sa.inspect(bind).get_table_names())
    )

    if "faculdade" in existing_tables:
        existing_columns = {
            col["name"] for col in sa.inspect(bind).get_columns("faculdade")
        }
        if "sigla" in existing_columns:
            op.drop_column("faculdade", "sigla")
