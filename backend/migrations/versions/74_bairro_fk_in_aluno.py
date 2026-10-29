"""add foreign key bairro_id to aluno

Revision ID: 74_bairro_fk_in_aluno
Revises: 73_bairro_e_ponto
Create Date: 2026-10-24

"""
from typing import Sequence, Union

from alembic import context, op
import sqlalchemy as sa


revision: str = "74_bairro_fk_in_aluno"
down_revision: Union[str, None] = "73_bairro_e_ponto"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # 1. Drop old unique constraint on bairro_id if it exists
    existing_constraints = [
        c["name"] for c in inspector.get_unique_constraints("aluno")
    ]
    if "aluno_bairro_id_key" in existing_constraints:
        op.drop_constraint("aluno_bairro_id_key", "aluno", type_="unique")

    # 2. Make bairro_id nullable FIRST so that rows can be updated safely
    op.alter_column("aluno", "bairro_id", nullable=True)

    # 3. For any existing rows where bairro_id is text (e.g. 'Centro', 'Aldeota'),
    # map them to an existing bairro or insert a default bairro if none exists.
    op.execute(
        """
        INSERT INTO bairro (nome, ativo)
        SELECT 'Centro', true
        WHERE NOT EXISTS (SELECT 1 FROM bairro);
        """
    )

    # Try to map existing aluno records by matching nome
    op.execute(
        """
        UPDATE aluno a
        SET bairro_id = b.bairro_id::varchar
        FROM bairro b
        WHERE a.bairro_id !~ '^[0-9]+$'
          AND LOWER(TRIM(a.bairro_id)) = LOWER(TRIM(b.nome));
        """
    )

    # For any remaining non-numeric bairro_id, assign the first available bairro id
    op.execute(
        """
        UPDATE aluno
        SET bairro_id = (SELECT bairro_id::varchar FROM bairro ORDER BY bairro_id ASC LIMIT 1)
        WHERE bairro_id !~ '^[0-9]+$' AND bairro_id IS NOT NULL;
        """
    )

    # 4. Now safely cast column to INTEGER
    op.execute(
        """
        ALTER TABLE aluno
        ALTER COLUMN bairro_id TYPE INTEGER
        USING (CASE WHEN bairro_id IS NULL THEN NULL ELSE bairro_id::INTEGER END);
        """
    )

    # 5. Add foreign key constraint
    op.create_foreign_key(
        "fk_aluno_bairro_id",
        "aluno",
        "bairro",
        ["bairro_id"],
        ["bairro_id"],
    )


def downgrade() -> None:
    # Drop FK constraint
    op.drop_constraint("fk_aluno_bairro_id", "aluno", type_="foreignkey")

    # Change bairro_id back to VARCHAR(20)
    op.execute(
        """
        ALTER TABLE aluno
        ALTER COLUMN bairro_id TYPE VARCHAR(20)
        USING (CASE WHEN bairro_id IS NULL THEN NULL ELSE bairro_id::VARCHAR END);
        """
    )
