"""create weekly fleet rotation"""

from typing import Sequence, Union

from alembic import context, op
import sqlalchemy as sa


revision: str = "83_create_rodizio_frota"
down_revision: Union[str, None] = "58e0f0dca595"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set() if context.is_offline_mode() else set(inspector.get_table_names())

    if "rodizio_frota" not in tables:
        op.create_table(
            "rodizio_frota",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("data_inicio", sa.Date(), nullable=False),
            sa.Column("semanas", sa.Integer(), nullable=False, server_default="4"),
            sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
            sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuario.id", ondelete="RESTRICT"), nullable=True),
            sa.Column("criado_em", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.CheckConstraint("semanas >= 1 AND semanas <= 52", name="ck_rodizio_frota_semanas"),
        )
        op.create_index("ix_rodizio_frota_ativo", "rodizio_frota", ["ativo"])

    if "rodizio_frota_item" not in tables:
        op.create_table(
            "rodizio_frota_item",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("rodizio_id", sa.Integer(), sa.ForeignKey("rodizio_frota.id", ondelete="CASCADE"), nullable=False),
            sa.Column("rota_id", sa.Integer(), sa.ForeignKey("rota_principal.id", ondelete="RESTRICT"), nullable=False),
            sa.Column("onibus_id", sa.String(20), sa.ForeignKey("onibus.placa_onibus", ondelete="RESTRICT"), nullable=False),
            sa.Column("turno", sa.String(10), nullable=False, server_default="ida"),
            sa.UniqueConstraint("rodizio_id", "rota_id", "turno", name="uq_rodizio_rota_turno"),
            sa.UniqueConstraint("rodizio_id", "onibus_id", "turno", name="uq_rodizio_onibus_turno"),
            sa.CheckConstraint("turno IN ('ida', 'volta')", name="ck_rodizio_frota_turno"),
        )


def downgrade() -> None:
    op.drop_table("rodizio_frota_item")
    op.drop_index("ix_rodizio_frota_ativo", table_name="rodizio_frota")
    op.drop_table("rodizio_frota")
