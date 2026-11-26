"""add daily attendance to transport bookings

Revision ID: 86_registrar_presenca_hu021
Revises: 85_repair_orm_timestamp_columns
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "86_registrar_presenca_hu021"
down_revision: Union[str, None] = "85_repair_orm_timestamp_columns"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "agendamento",
        sa.Column(
            "presenca_status",
            sa.String(length=10),
            nullable=False,
            server_default="PENDENTE",
        ),
    )
    op.add_column(
        "agendamento",
        sa.Column("presenca_registrada_em", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "agendamento",
        sa.Column(
            "presenca_registrada_por",
            sa.Integer(),
            sa.ForeignKey("usuario.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_check_constraint(
        "ck_agendamento_presenca_status",
        "agendamento",
        "presenca_status IN ('PENDENTE', 'PRESENTE', 'FALTA')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_agendamento_presenca_status", "agendamento", type_="check")
    op.drop_column("agendamento", "presenca_registrada_por")
    op.drop_column("agendamento", "presenca_registrada_em")
    op.drop_column("agendamento", "presenca_status")
