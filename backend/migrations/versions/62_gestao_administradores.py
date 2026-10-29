"""add administrator management and audit log

Revision ID: 62_gestao_administradores
Revises: 61_add_data_criacao_usuario
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "62_gestao_administradores"
down_revision: Union[str, None] = "61_add_data_criacao_usuario"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "administrador",
        sa.Column("administrador_id", sa.Integer(), sa.ForeignKey("usuario.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("is_administrador_ativo", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.create_table(
        "log_auditoria",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuario.id", ondelete="SET NULL"), nullable=True),
        sa.Column("acao", sa.String(length=80), nullable=False),
        sa.Column("entidade", sa.String(length=80), nullable=False),
        sa.Column("entidade_id", sa.Integer(), nullable=False),
        sa.Column("valor_anterior", sa.Text(), nullable=True),
        sa.Column("valor_novo", sa.Text(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_unique_constraint("uq_usuario_email_hash", "usuario", ["email_hash"])


def downgrade() -> None:
    op.drop_constraint("uq_usuario_email_hash", "usuario", type_="unique")
    op.drop_table("log_auditoria")
    op.drop_table("administrador")
