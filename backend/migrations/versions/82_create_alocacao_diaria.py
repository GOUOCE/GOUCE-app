"""create daily bus allocation and student links"""

from typing import Sequence, Union

from alembic import context, op
import sqlalchemy as sa

revision: str = "82_create_alocacao_diaria"
down_revision: Union[str, None] = "82_updated_at_faculdade_ponto"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set() if context.is_offline_mode() else set(inspector.get_table_names())
    if "alocacao_diaria" not in tables:
        op.create_table(
            "alocacao_diaria",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("rota_id", sa.Integer(), sa.ForeignKey("rota_principal.id", ondelete="RESTRICT"), nullable=False),
            sa.Column("onibus_id", sa.String(20), sa.ForeignKey("onibus.placa_onibus", ondelete="RESTRICT"), nullable=False),
            sa.Column("data", sa.Date(), nullable=False),
            sa.Column("motorista_id", sa.Integer(), sa.ForeignKey("motorista.id", ondelete="RESTRICT"), nullable=False),
            sa.Column("turno", sa.String(10), nullable=False, server_default="ida"),
            sa.UniqueConstraint("data", "onibus_id", "turno", name="uq_alocacao_diaria_onibus"),
            sa.UniqueConstraint("data", "motorista_id", "turno", name="uq_alocacao_diaria_motorista"),
            sa.CheckConstraint("turno IN ('ida', 'volta')", name="ck_alocacao_diaria_turno"),
        )
    else:
        columns = {column["name"] for column in inspector.get_columns("alocacao_diaria")}
        if "turno" not in columns:
            op.add_column(
                "alocacao_diaria",
                sa.Column("turno", sa.String(10), nullable=False, server_default="ida"),
            )
        unique_names = {item["name"] for item in inspector.get_unique_constraints("alocacao_diaria")}
        if "uq_alocacao_diaria_onibus" not in unique_names:
            op.create_unique_constraint(
                "uq_alocacao_diaria_onibus", "alocacao_diaria", ["data", "onibus_id", "turno"]
            )
        if "uq_alocacao_diaria_motorista" not in unique_names:
            op.create_unique_constraint(
                "uq_alocacao_diaria_motorista", "alocacao_diaria", ["data", "motorista_id", "turno"]
            )

    if "alocacao_aluno" not in tables:
        op.create_table(
            "alocacao_aluno",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("alocacao_diaria_id", sa.Integer(), sa.ForeignKey("alocacao_diaria.id", ondelete="CASCADE"), nullable=False),
            sa.Column("agendamento_id", sa.Integer(), sa.ForeignKey("agendamento.id", ondelete="RESTRICT"), nullable=False),
            sa.Column("turno", sa.String(10), nullable=False),
            sa.Column("tipo_lugar", sa.String(10), nullable=False),
            sa.Column("status", sa.String(15), nullable=False, server_default="ALOCADO"),
            sa.UniqueConstraint("agendamento_id", "turno", name="uq_alocacao_aluno_agendamento_turno"),
            sa.CheckConstraint("turno IN ('ida', 'volta')", name="ck_alocacao_aluno_turno"),
            sa.CheckConstraint("tipo_lugar IN ('sentado', 'em_pe')", name="ck_alocacao_aluno_tipo_lugar"),
            sa.CheckConstraint("status IN ('ALOCADO', 'CANCELADO')", name="ck_alocacao_aluno_status"),
        )


def downgrade() -> None:
    op.drop_table("alocacao_aluno")
    op.drop_table("alocacao_diaria")
