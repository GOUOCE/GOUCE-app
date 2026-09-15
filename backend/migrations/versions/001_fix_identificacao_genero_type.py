"""fix identificacao_genero column type to varchar(100)

Revision ID: 001_fix_identificacao_genero
Revises: 
Create Date: 2026-09-14 20:33:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_fix_identificacao_genero'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE aluno ALTER COLUMN identificacao_genero TYPE VARCHAR(100) USING NULL;")


def downgrade() -> None:
    op.execute("ALTER TABLE aluno ALTER COLUMN identificacao_genero TYPE TIMESTAMP WITH TIME ZONE USING NULL;")
