"""create rota_principal and its bairro/faculdade (ida/volta) links

Revision ID: 76_create_rota_principal
Revises: 75_add_sigla_to_faculdade
Create Date: 2026-10-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "76_create_rota_principal"
down_revision: Union[str, None] = "75_add_sigla_to_faculdade"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "rota_principal",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("nome", sa.String(length=150), nullable=False),
        sa.Column("horario_saida", sa.Time(), nullable=False),
        sa.Column("horario_retorno", sa.Time(), nullable=False),
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
        sa.CheckConstraint(
            "horario_retorno > horario_saida",
            name="ck_rota_principal_retorno_apos_saida",
        ),
    )
    op.create_index("ix_rota_principal_ativo", "rota_principal", ["ativo"])
    op.create_index(
        "uq_rota_principal_nome_lower",
        "rota_principal",
        [sa.text("lower(trim(nome))")],
        unique=True,
    )

    op.create_table(
        "rota_principal_bairro",
        sa.Column(
            "rota_id",
            sa.Integer(),
            sa.ForeignKey("rota_principal.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "bairro_id",
            sa.Integer(),
            sa.ForeignKey("bairro.bairro_id", ondelete="RESTRICT"),
            primary_key=True,
        ),
    )
    op.create_index(
        "ix_rota_principal_bairro_bairro_id",
        "rota_principal_bairro",
        ["bairro_id"],
    )

    for tabela in ("rota_principal_faculdade_ida", "rota_principal_faculdade_volta"):
        op.create_table(
            tabela,
            sa.Column(
                "rota_id",
                sa.Integer(),
                sa.ForeignKey("rota_principal.id", ondelete="CASCADE"),
                primary_key=True,
            ),
            sa.Column(
                "faculdade_id",
                sa.Integer(),
                sa.ForeignKey("faculdade.id_faculdade", ondelete="RESTRICT"),
                primary_key=True,
            ),
        )
        op.create_index(f"ix_{tabela}_faculdade_id", tabela, ["faculdade_id"])


def downgrade() -> None:
    op.drop_table("rota_principal_faculdade_volta")
    op.drop_table("rota_principal_faculdade_ida")
    op.drop_table("rota_principal_bairro")
    op.drop_index("uq_rota_principal_nome_lower", table_name="rota_principal")
    op.drop_index("ix_rota_principal_ativo", table_name="rota_principal")
    op.drop_table("rota_principal")
