"""add tipo representante to tipo table

Revision ID: 71_add_tipo_representante
Revises: 70_representante_faculdade_fk
Create Date: 2026-10-21

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "71_add_tipo_representante"
down_revision: Union[str, None] = "70_representante_faculdade_fk"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        sa.text(
            "INSERT INTO tipo (tipo_usuario) VALUES ('representante') "
            "ON CONFLICT (tipo_usuario) DO NOTHING"
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            "DELETE FROM tipo WHERE tipo_usuario = 'representante'"
        )
    )
