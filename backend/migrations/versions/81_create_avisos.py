"""create aviso table for mural de avisos (HU-023)

Revision ID: 81_create_avisos
Revises: 80_remove_horarios_agendamento
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "81_create_avisos"
down_revision: Union[str, None] = "80_remove_horarios_agendamento"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "aviso",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("titulo", sa.String(length=150), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=False),
        sa.Column(
            "autor_id",
            sa.Integer(),
            sa.ForeignKey("usuario.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "data_criacao",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index("ix_aviso_autor_id", "aviso", ["autor_id"])
    op.create_index("ix_aviso_data_criacao", "aviso", ["data_criacao"])


def downgrade() -> None:
    op.drop_index("ix_aviso_data_criacao", table_name="aviso")
    op.drop_index("ix_aviso_autor_id", table_name="aviso")
    op.drop_table("aviso")
