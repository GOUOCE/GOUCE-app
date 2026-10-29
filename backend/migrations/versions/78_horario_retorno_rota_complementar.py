"""add horario_retorno to rota_complementar and merge heads

Une as duas heads da develop (76_ponto_unico_por_bairro e
77_create_rota_complementar), que impediam ``alembic upgrade head`` em banco
vazio (#318), e adiciona o horário de retorno da rota complementar (#310).

Registros existentes recebem o retorno da rota principal vinculada, quando ele
é posterior à saída da complementar; senão, 23:59, para manter a regra
"retorno maior que a saída" (#208, item 2).

Revision ID: 78_horario_retorno_rota_compl
Revises: 76_ponto_unico_por_bairro, 77_create_rota_complementar
Create Date: 2026-10-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "78_horario_retorno_rota_compl"
down_revision: Union[str, Sequence[str], None] = (
    "76_ponto_unico_por_bairro",
    "77_create_rota_complementar",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "rota_complementar",
        sa.Column("horario_retorno", sa.Time(), nullable=True),
    )
    op.execute(
        """
        UPDATE rota_complementar AS rc
        SET horario_retorno = CASE
            WHEN rp.horario_retorno > rc.horario_saida THEN rp.horario_retorno
            ELSE TIME '23:59'
        END
        FROM rota_principal AS rp
        WHERE rp.id = rc.rota_principal_id
        """
    )
    op.alter_column("rota_complementar", "horario_retorno", nullable=False)


def downgrade() -> None:
    op.drop_column("rota_complementar", "horario_retorno")
