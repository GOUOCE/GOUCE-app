"""repair timestamp columns queried by existing endpoints

Revision ID: 85_repair_orm_timestamp_columns
Revises: 84_repair_faculdade_updated_at
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "85_repair_orm_timestamp_columns"
down_revision: Union[str, None] = "84_repair_faculdade_updated_at"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TIMESTAMP_COLUMNS = {
    "faculdade": ("updated_at",),
    "ponto_de_parada": ("updated_at",),
    "rota_principal": ("updated_at",),
    "rota_complementar": ("updated_at",),
    "agendamento": ("created_at", "updated_at"),
    "rodizio_frota": ("criado_em", "atualizado_em"),
}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    table_names = set(inspector.get_table_names())

    for table, columns_names in TIMESTAMP_COLUMNS.items():
        if table not in table_names:
            continue

        existing = {column["name"] for column in inspector.get_columns(table)}
        for column_name in columns_names:
            if column_name in existing:
                continue

            op.add_column(
                table,
                sa.Column(
                    column_name,
                    sa.DateTime(timezone=True),
                    nullable=False,
                    server_default=sa.text("CURRENT_TIMESTAMP"),
                ),
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    table_names = set(inspector.get_table_names())

    for table, column_names in TIMESTAMP_COLUMNS.items():
        if table not in table_names:
            continue

        existing = {column["name"] for column in inspector.get_columns(table)}
        for column_name in reversed(column_names):
            if column_name in existing:
                op.drop_column(table, column_name)
