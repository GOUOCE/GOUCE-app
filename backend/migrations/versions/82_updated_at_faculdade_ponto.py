"""add updated_at to faculdade and ponto_de_parada (HU-015)

Revision ID: 82_updated_at_faculdade_ponto
Revises: 81_add_updated_at_rotas
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "82_updated_at_faculdade_ponto"
down_revision: Union[str, None] = "81_add_updated_at_rotas"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    for table in ("faculdade", "ponto_de_parada"):
        if table not in inspector.get_table_names():
            continue

        columns = {column["name"] for column in inspector.get_columns(table)}
        if "updated_at" in columns:
            continue

        op.add_column(
            table,
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.text("CURRENT_TIMESTAMP"),
            ),
        )


def downgrade() -> None:
    for table in ("faculdade", "ponto_de_parada"):
        op.drop_column(table, "updated_at")
