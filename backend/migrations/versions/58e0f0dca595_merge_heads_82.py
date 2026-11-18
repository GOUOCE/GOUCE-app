"""merge heads 82

Revision ID: 58e0f0dca595
Revises: ('82_create_alocacao_diaria', '82_updated_at_faculdade_ponto')
Create Date: 2026-11-15 13:51:28.979936

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '58e0f0dca595'
down_revision: Union[str, None] = ('82_create_alocacao_diaria', '82_updated_at_faculdade_ponto')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
