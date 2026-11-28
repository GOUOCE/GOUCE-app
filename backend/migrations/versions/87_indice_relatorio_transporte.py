"""index active bookings by travel date for reporting"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "87_indice_relatorio_transporte"
down_revision: Union[str, None] = "86_registrar_presenca_hu021"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_agendamento_data_status",
        "agendamento",
        ["data", "status"],
    )


def downgrade() -> None:
    op.drop_index("ix_agendamento_data_status", table_name="agendamento")
