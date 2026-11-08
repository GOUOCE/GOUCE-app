"""remove redundant schedules from agendamento

Revision ID: 80_remove_horarios_agendamento
Revises: 79_create_agendamentos
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "80_remove_horarios_agendamento"
down_revision: Union[str, None] = "79_create_agendamentos"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col["name"] for col in inspector.get_columns("agendamento")]
    if "horario_volta" in columns:
        op.drop_column("agendamento", "horario_volta")
    if "horario_ida" in columns:
        op.drop_column("agendamento", "horario_ida")


def downgrade() -> None:
    op.add_column("agendamento", sa.Column("horario_ida", sa.String(length=5), nullable=True))
    op.add_column("agendamento", sa.Column("horario_volta", sa.String(length=5), nullable=True))
