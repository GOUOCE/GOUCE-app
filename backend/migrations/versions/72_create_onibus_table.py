"""create onibus table with id_foto_onibus FK to arquivos

Revision ID: 72_create_onibus_table
Revises: 71_add_tipo_representante
Create Date: 2026-10-23

"""
from typing import Sequence, Union

from alembic import context, op
import sqlalchemy as sa


revision: str = "72_create_onibus_table"
down_revision: Union[str, None] = "71_add_tipo_representante"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing_tables = (
        set()
        if context.is_offline_mode()
        else set(sa.inspect(bind).get_table_names())
    )

    # Permitir que log_auditoria armazene identificadores alfanuméricos como placas
    if not context.is_offline_mode() and bind.dialect.name == "postgresql":
        try:
            op.execute(sa.text("ALTER TABLE log_auditoria ALTER COLUMN entidade_id TYPE VARCHAR(80);"))
        except Exception:
            pass

    if "onibus" not in existing_tables:
        op.create_table(
            "onibus",
            sa.Column(
                "placa_onibus",
                sa.String(length=20),
                primary_key=True,
                nullable=False,
            ),
            sa.Column("qtd_assentos", sa.Integer(), nullable=False),
            sa.Column("capacidade_maxima", sa.Integer(), nullable=False),
            sa.Column("apelido_onibus", sa.String(length=100), nullable=True),
            sa.Column(
                "ativo",
                sa.Boolean(),
                nullable=False,
                server_default=sa.true(),
            ),
            sa.Column(
                "id_foto_onibus",
                sa.String(length=36),
                sa.ForeignKey("arquivos.id", ondelete="SET NULL"),
                nullable=True,
            ),
        )
    else:
        existing_columns = {
            col["name"] for col in sa.inspect(bind).get_columns("onibus")
        }
        if "id_foto_onibus" not in existing_columns and "foto_onibus" not in existing_columns:
            op.add_column(
                "onibus",
                sa.Column(
                    "id_foto_onibus",
                    sa.String(length=36),
                    sa.ForeignKey("arquivos.id", ondelete="SET NULL"),
                    nullable=True,
                ),
            )
        if "ativo" not in existing_columns:
            op.add_column(
                "onibus",
                sa.Column(
                    "ativo",
                    sa.Boolean(),
                    nullable=False,
                    server_default=sa.true(),
                ),
            )


def downgrade() -> None:
    op.drop_table("onibus")
