"""create rota_complementar linked to rota_principal

Revision ID: 77_create_rota_complementar
Revises: 76_create_rota_principal
Create Date: 2026-10-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "77_create_rota_complementar"
down_revision: Union[str, None] = "76_create_rota_principal"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "rota_complementar",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "rota_principal_id",
            sa.Integer(),
            sa.ForeignKey("rota_principal.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("nome", sa.String(length=150), nullable=False),
        sa.Column("horario_saida", sa.Time(), nullable=False),
        sa.Column("ponto_conexao", sa.String(length=150), nullable=False),
        sa.Column(
            "ativo",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column(
            "data_criacao",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index("ix_rota_complementar_ativo", "rota_complementar", ["ativo"])
    op.create_index(
        "ix_rota_complementar_rota_principal_id",
        "rota_complementar",
        ["rota_principal_id"],
    )
    op.create_index(
        "uq_rota_complementar_nome_lower",
        "rota_complementar",
        [sa.text("lower(trim(nome))")],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_rota_complementar_nome_lower", table_name="rota_complementar")
    op.drop_index("ix_rota_complementar_rota_principal_id", table_name="rota_complementar")
    op.drop_index("ix_rota_complementar_ativo", table_name="rota_complementar")
    op.drop_table("rota_complementar")
