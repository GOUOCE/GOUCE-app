"""create transport bookings and holidays

Revision ID: 79_create_agendamentos
Revises: 78_horario_retorno_rota_compl
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "79_create_agendamentos"
down_revision: Union[str, None] = "78_horario_retorno_rota_compl"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "feriado_recesso",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("data", sa.Date(), nullable=False),
        sa.Column("tipo", sa.String(10), nullable=False),
        sa.Column("descricao", sa.String(255), nullable=False),
        sa.UniqueConstraint("data", name="uq_feriado_recesso_data"),
    )
    op.create_index("ix_feriado_recesso_data", "feriado_recesso", ["data"])
    op.create_table(
        "agendamento",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("aluno_id", sa.Integer(), sa.ForeignKey("aluno.aluno_id", ondelete="CASCADE"), nullable=False),
        sa.Column("data", sa.Date(), nullable=False),
        sa.Column("usa_ida", sa.Boolean(), nullable=False),
        sa.Column("usa_volta", sa.Boolean(), nullable=False),
        sa.Column("ponto_embarque_id", sa.Integer(), sa.ForeignKey("ponto_de_parada.ponto_id", ondelete="RESTRICT")),
        sa.Column("ies_destino_id", sa.Integer(), sa.ForeignKey("faculdade.id_faculdade", ondelete="RESTRICT")),
        sa.Column("rota_complementar_ida_id", sa.Integer(), sa.ForeignKey("rota_complementar.id", ondelete="RESTRICT")),
        sa.Column("ies_origem_id", sa.Integer(), sa.ForeignKey("faculdade.id_faculdade", ondelete="RESTRICT")),
        sa.Column("ponto_desembarque_id", sa.Integer(), sa.ForeignKey("ponto_de_parada.ponto_id", ondelete="RESTRICT")),
        sa.Column("rota_complementar_volta_id", sa.Integer(), sa.ForeignKey("rota_complementar.id", ondelete="RESTRICT")),
        sa.Column("status", sa.String(15), nullable=False, server_default="ATIVO"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("cancelled_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("(usa_ida OR usa_volta)", name="ck_agendamento_um_trecho"),
    )
    op.create_index("ix_agendamento_aluno_data_status", "agendamento", ["aluno_id", "data", "status"])
    op.create_index(
        "uq_agendamento_aluno_data_ativo", "agendamento", ["aluno_id", "data"],
        unique=True, postgresql_where=sa.text("status = 'ATIVO'"),
    )


def downgrade() -> None:
    op.drop_index("uq_agendamento_aluno_data_ativo", table_name="agendamento")
    op.drop_index("ix_agendamento_aluno_data_status", table_name="agendamento")
    op.drop_table("agendamento")
    op.drop_index("ix_feriado_recesso_data", table_name="feriado_recesso")
    op.drop_table("feriado_recesso")
