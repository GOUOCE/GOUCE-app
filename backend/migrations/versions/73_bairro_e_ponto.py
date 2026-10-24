"""create bairro and ponto_de_parada tables

Revision ID: 73_bairro_e_ponto
Revises: 68_create_motorista
Create Date: 2026-10-24

"""
from typing import Sequence, Union

from alembic import context, op
import sqlalchemy as sa


revision: str = "73_bairro_e_ponto"
down_revision: Union[str, None] = "68_create_motorista"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing_tables = (
        set()
        if context.is_offline_mode()
        else set(sa.inspect(bind).get_table_names())
    )

    if "bairro" not in existing_tables:
        op.create_table(
            "bairro",
            sa.Column(
                "bairro_id",
                sa.Integer(),
                primary_key=True,
                autoincrement=True,
                nullable=False,
            ),
            sa.Column("nome", sa.String(length=100), nullable=False),
            sa.Column(
                "ativo",
                sa.Boolean(),
                nullable=False,
                server_default=sa.true(),
            ),
        )
        op.create_index("ix_bairro_ativo", "bairro", ["ativo"])

    if "ponto_de_parada" not in existing_tables:
        op.create_table(
            "ponto_de_parada",
            sa.Column(
                "ponto_id",
                sa.Integer(),
                primary_key=True,
                autoincrement=True,
                nullable=False,
            ),
            sa.Column("nome", sa.String(length=150), nullable=False),
            sa.Column(
                "bairro_id",
                sa.Integer(),
                sa.ForeignKey("bairro.bairro_id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "ativo",
                sa.Boolean(),
                nullable=False,
                server_default=sa.true(),
            ),
        )
        op.create_index("ix_ponto_de_parada_ativo", "ponto_de_parada", ["ativo"])
        op.create_index("ix_ponto_de_parada_bairro_id", "ponto_de_parada", ["bairro_id"])


def downgrade() -> None:
    op.drop_table("ponto_de_parada")
    op.drop_table("bairro")
