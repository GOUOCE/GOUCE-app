"""add user types and user type association

Revision ID: 63_add_tipos_usuario
Revises: 62_gestao_administradores
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "63_add_tipos_usuario"
down_revision: Union[str, None] = "62_gestao_administradores"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TIPOS_USUARIO = ("administrador", "aluno", "supervisor")


def upgrade() -> None:
    op.create_table(
        "tipo",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tipo_usuario", sa.String(length=50), nullable=False, unique=True),
    )
    op.create_table(
        "usuario_tipo",
        sa.Column("id_usuario", sa.Integer(), sa.ForeignKey("usuario.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("id_tipo", sa.Integer(), sa.ForeignKey("tipo.id", ondelete="CASCADE"), primary_key=True),
    )
    op.add_column(
        "usuario",
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    for tipo in TIPOS_USUARIO:
        op.execute(
            sa.text(
                "INSERT INTO tipo (tipo_usuario) VALUES (:tipo) "
                "ON CONFLICT (tipo_usuario) DO NOTHING"
            ).bindparams(tipo=tipo)
        )

    op.execute(sa.text("""
        INSERT INTO usuario_tipo (id_usuario, id_tipo)
        SELECT a.administrador_id, t.id
        FROM administrador a
        JOIN tipo t ON t.tipo_usuario = 'administrador'
        ON CONFLICT (id_usuario, id_tipo) DO NOTHING
    """))

def downgrade() -> None:
    op.drop_table("usuario_tipo")
    op.drop_table("tipo")
