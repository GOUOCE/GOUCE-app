"""create or update representante table with id_faculdade_responsavel FK to faculdade

Revision ID: 70_representante_faculdade_fk
Revises: 69_faculdade_fk_in_aluno
Create Date: 2026-10-19

"""
from typing import Sequence, Union

from alembic import context, op
import sqlalchemy as sa


revision: str = "70_representante_faculdade_fk"
down_revision: Union[str, None] = "69_faculdade_fk_in_aluno"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing_tables = (
        set()
        if context.is_offline_mode()
        else set(sa.inspect(bind).get_table_names())
    )

    if "representante" not in existing_tables:
        op.create_table(
            "representante",
            sa.Column(
                "administrador_id",
                sa.Integer(),
                sa.ForeignKey("usuario.id", ondelete="CASCADE"),
                nullable=False,
                primary_key=True,
            ),
            sa.Column(
                "is_representante_ativo",
                sa.Boolean(),
                nullable=False,
                server_default=sa.true(),
            ),
            sa.Column(
                "id_faculdade_responsavel",
                sa.Integer(),
                sa.ForeignKey("faculdade.id_faculdade"),
                nullable=True,
            ),
        )
    else:
        existing_columns = {
            col["name"] for col in sa.inspect(bind).get_columns("representante")
        }
        if "id_faculdade_responsavel" not in existing_columns:
            op.add_column(
                "representante",
                sa.Column(
                    "id_faculdade_responsavel",
                    sa.Integer(),
                    sa.ForeignKey("faculdade.id_faculdade"),
                    nullable=True,
                ),
            )


def downgrade() -> None:
    op.drop_table("representante")
