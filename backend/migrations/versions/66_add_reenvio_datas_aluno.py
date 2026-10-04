"""add rejected document resend metadata and lifecycle dates

Revision ID: 66_add_reenvio_datas_aluno
Revises: 65_seed_administrador_padrao
Create Date: 2026-10-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "66_add_reenvio_datas_aluno"
down_revision: Union[str, None] = "65_seed_administrador_padrao"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE aluno "
        "ADD COLUMN IF NOT EXISTS documentos_reenvio JSON"
    )
    op.execute(
        "ALTER TABLE aluno "
        "ADD COLUMN IF NOT EXISTS data_hora_envio_analise TIMESTAMP WITH TIME ZONE"
    )
    op.execute(
        "ALTER TABLE aluno "
        "ADD COLUMN IF NOT EXISTS data_hora_ultima_renovacao_matricula "
        "TIMESTAMP WITH TIME ZONE"
    )


def downgrade() -> None:
    op.drop_column("aluno", "data_hora_ultima_renovacao_matricula")
    op.drop_column("aluno", "data_hora_envio_analise")
    op.drop_column("aluno", "documentos_reenvio")
