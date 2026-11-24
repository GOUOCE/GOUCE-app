"""ensure faculdade and ponto_de_parada updated_at columns exist

Revision ID: 84_repair_faculdade_updated_at
Revises: 83_create_rodizio_frota
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "84_repair_faculdade_updated_at"
down_revision: Union[str, None] = "83_create_rodizio_frota"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    for table in ("faculdade", "ponto_de_parada"):
        if table not in inspector.get_table_names():
            continue

        columns = {column["name"] for column in inspector.get_columns(table)}
        if "updated_at" not in columns:
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
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    for table in ("faculdade", "ponto_de_parada"):
        if table not in inspector.get_table_names():
            continue

        columns = {column["name"] for column in inspector.get_columns(table)}
        if "updated_at" in columns:
            op.drop_column(table, "updated_at")
