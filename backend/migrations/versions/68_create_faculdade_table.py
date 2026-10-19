"""create faculdade table with ativo and unique constraint

Revision ID: 68_create_faculdade_table
Revises: 67_add_password_reset_token
Create Date: 2026-10-16

"""
from typing import Sequence, Union

from alembic import context, op
import sqlalchemy as sa


revision: str = "68_create_faculdade_table"
down_revision: Union[str, None] = "67_add_password_reset_token"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing_tables = (
        set()
        if context.is_offline_mode()
        else set(sa.inspect(bind).get_table_names())
    )

    if "faculdade" not in existing_tables:
        op.create_table(
            "faculdade",
            sa.Column(
                "id_faculdade",
                sa.Integer(),
                primary_key=True,
                autoincrement=True,
                nullable=False,
            ),
            sa.Column("nome_faculdade", sa.String(length=255), nullable=False),
            sa.Column("campus_faculdade", sa.String(length=255), nullable=False),
            sa.Column(
                "ativo",
                sa.Boolean(),
                nullable=False,
                server_default=sa.true(),
            ),
            sa.UniqueConstraint(
                "nome_faculdade",
                "campus_faculdade",
                name="uq_faculdade_nome_campus",
            ),
        )
    else:
        existing_columns = {
            col["name"] for col in sa.inspect(bind).get_columns("faculdade")
        }
        if "ativo" not in existing_columns:
            op.add_column(
                "faculdade",
                sa.Column(
                    "ativo",
                    sa.Boolean(),
                    nullable=False,
                    server_default=sa.true(),
                ),
            )


def downgrade() -> None:
    op.drop_table("faculdade")
