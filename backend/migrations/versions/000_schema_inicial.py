"""create the schema that existed before Alembic migrations

Revision ID: 000_schema_inicial
Revises:
"""
from typing import Sequence, Union

from alembic import context, op
import sqlalchemy as sa


revision: str = "000_schema_inicial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing_tables = (
        set()
        if context.is_offline_mode()
        else set(sa.inspect(bind).get_table_names())
    )

    if "usuario" not in existing_tables:
        op.create_table(
            "usuario",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("nome_completo", sa.String(length=150), nullable=False),
            sa.Column("email", sa.String(length=150), nullable=False),
            sa.Column("telefone", sa.String(length=20), nullable=True),
            sa.Column("senha", sa.String(length=255), nullable=False),
            sa.Column("tentativas_falhas", sa.Integer(), nullable=False, server_default=sa.text("0")),
            sa.Column("limite_de_bloqueio", sa.DateTime(timezone=True), nullable=True),
            sa.UniqueConstraint("email", name="usuario_email_key"),
            sa.UniqueConstraint("telefone", name="usuario_telefone_key"),
        )

    if "arquivos" not in existing_tables:
        op.create_table(
            "arquivos",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("nome", sa.String(length=255), nullable=False),
            sa.Column("url", sa.String(length=500), nullable=False),
            sa.Column("content_type", sa.String(length=100), nullable=True),
            sa.Column("tamanho_bytes", sa.Integer(), nullable=True),
            sa.Column("criado_em", sa.DateTime(timezone=True), nullable=True, server_default=sa.text("CURRENT_TIMESTAMP")),
        )

    if "aluno" not in existing_tables:
        op.create_table(
            "aluno",
            sa.Column("aluno_id", sa.Integer(), sa.ForeignKey("usuario.id", ondelete="CASCADE"), primary_key=True),
            sa.Column("status_cadastro", sa.String(length=150), nullable=False),
            sa.Column("faculdade_id", sa.String(length=150), nullable=False),
            sa.Column("bairro_id", sa.String(length=20), nullable=True),
            sa.Column("id_comprovante_matricula", sa.String(length=36), sa.ForeignKey("arquivos.id"), nullable=False),
            sa.Column("id_comprovante_residencia", sa.String(length=36), sa.ForeignKey("arquivos.id"), nullable=False),
            sa.Column("data_nascimento", sa.Integer(), nullable=False, server_default=sa.text("0")),
            sa.Column("identificacao_genero", sa.String(length=100), nullable=True),
            sa.Column("tem_filhos", sa.Boolean(), nullable=True),
            sa.Column("curso", sa.String(length=150), nullable=False),
            sa.Column("semestre_atual", sa.Integer(), nullable=True),
            sa.Column("periodo_ingresso", sa.String(length=20), nullable=True),
            sa.Column("turno_curso", sa.String(length=30), nullable=True),
            sa.Column("raca", sa.String(length=50), nullable=True),
            sa.Column("validade_acesso", sa.DateTime(timezone=True), nullable=True),
            sa.Column("id_foto_aluno", sa.String(length=255), nullable=True),
            sa.Column("identificacao_sexual", sa.String(length=100), nullable=True),
            sa.Column("motivo_reprovacao", sa.String(length=255), nullable=True),
            sa.Column("termos_de_uso", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.UniqueConstraint("faculdade_id", name="aluno_faculdade_id_key"),
            sa.UniqueConstraint("bairro_id", name="aluno_bairro_id_key"),
        )

    if "password_reset_token" not in existing_tables:
        op.create_table(
            "password_reset_token",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuario.id", ondelete="CASCADE"), nullable=False),
            sa.Column("token_hash", sa.String(length=64), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        )
        op.create_index(
            "ix_password_reset_token_token_hash",
            "password_reset_token",
            ["token_hash"],
            unique=True,
        )


def downgrade() -> None:
    op.drop_table("password_reset_token")
    op.drop_table("aluno")
    op.drop_table("arquivos")
    op.drop_table("usuario")