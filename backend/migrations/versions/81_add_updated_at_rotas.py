"""add updated_at to rota_principal and rota_complementar (HU-015)

Revision ID: 81_add_updated_at_rotas
Revises: 80_remove_horarios_agendamento
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "81_add_updated_at_rotas"
down_revision: Union[str, None] = "80_remove_horarios_agendamento"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    for table in ("rota_principal", "rota_complementar"):
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
    for table in ("rota_principal", "rota_complementar"):
        op.drop_column(table, "updated_at")
