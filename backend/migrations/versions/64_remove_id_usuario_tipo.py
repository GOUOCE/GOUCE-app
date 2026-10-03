"""remove duplicated direct user type reference

Revision ID: 64_remove_id_usuario_tipo
Revises: 63_add_tipos_usuario
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "64_remove_id_usuario_tipo"
down_revision: Union[str, None] = "63_add_tipos_usuario"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("usuario")}
    if "id_usuario_tipo" not in columns:
        return

    foreign_keys = inspector.get_foreign_keys("usuario")
    for foreign_key in foreign_keys:
        if "id_usuario_tipo" in foreign_key.get("constrained_columns", []):
            if foreign_key.get("name"):
                op.drop_constraint(foreign_key["name"], "usuario", type_="foreignkey")
            break
    op.drop_column("usuario", "id_usuario_tipo")


def downgrade() -> None:
    op.add_column("usuario", sa.Column("id_usuario_tipo", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_usuario_id_usuario_tipo_tipo",
        "usuario",
        "tipo",
        ["id_usuario_tipo"],
        ["id"],
        ondelete="SET NULL",
    )