"""create motorista table

Revision ID: 68_create_motorista
Revises: 72_create_onibus_table
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "68_create_motorista"
down_revision: Union[str, None] = "72_create_onibus_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "motorista",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("nome_completo", sa.String(length=500), nullable=False),
        sa.Column("telefone", sa.String(length=500), nullable=False),
        sa.Column("telefone_hash", sa.String(length=64), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "data_criacao",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index("ix_motorista_ativo", "motorista", ["ativo"])
    op.create_index(
        "ix_motorista_telefone_hash",
        "motorista",
        ["telefone_hash"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_motorista_telefone_hash", table_name="motorista")
    op.drop_index("ix_motorista_ativo", table_name="motorista")
    op.drop_table("motorista")
