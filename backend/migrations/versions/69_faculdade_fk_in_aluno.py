"""replace faculdade_id string and campus with FK to faculdade table

Revision ID: 69_faculdade_fk_in_aluno
Revises: 68_create_faculdade_table
Create Date: 2026-10-19

"""
from typing import Sequence, Union

from alembic import context, op
import sqlalchemy as sa


revision: str = "69_faculdade_fk_in_aluno"
down_revision: Union[str, None] = "68_create_faculdade_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # 1. Drop the old unique constraint on faculdade_id if it exists
    existing_constraints = [
        c["name"] for c in inspector.get_unique_constraints("aluno")
    ]
    if "aluno_faculdade_id_key" in existing_constraints:
        op.drop_constraint("aluno_faculdade_id_key", "aluno", type_="unique")

    # 2. Make faculdade_id nullable FIRST so that rows can be updated safely
    op.alter_column("aluno", "faculdade_id", nullable=True)

    # 3. For any existing rows where faculdade_id is text (e.g. 'UFC', 'qxd'),
    # map them to an existing faculdade or insert a default faculdade if none exists.
    # First, let's see if there are faculdades in the table. If not, insert a default one.
    op.execute(
        """
        INSERT INTO faculdade (nome_faculdade, campus_faculdade, ativo)
        SELECT 'UFC', 'Campus Quixadá', true
        WHERE NOT EXISTS (SELECT 1 FROM faculdade);
        """
    )

    # Try to map existing aluno records by matching nome_faculdade or sigla or substring
    op.execute(
        """
        UPDATE aluno a
        SET faculdade_id = f.id_faculdade::varchar
        FROM faculdade f
        WHERE a.faculdade_id !~ '^[0-9]+$'
          AND (
            LOWER(TRIM(a.faculdade_id)) = LOWER(TRIM(f.nome_faculdade))
            OR (f.sigla IS NOT NULL AND LOWER(TRIM(a.faculdade_id)) = LOWER(TRIM(f.sigla)))
            OR LOWER(TRIM(f.nome_faculdade)) LIKE '%' || LOWER(TRIM(a.faculdade_id)) || '%'
          );
        """
    )

    # Log/notice before assigning default fallback for any remaining non-numeric faculdade_id
    op.execute(
        """
        DO $$
        DECLARE
            r RECORD;
        BEGIN
            FOR r IN SELECT aluno_id, faculdade_id FROM aluno WHERE faculdade_id !~ '^[0-9]+$' OR faculdade_id IS NULL LOOP
                RAISE NOTICE 'Aviso: Aluno id % com faculdade_id texto "%" não coincidiu com faculdade cadastrada e foi mapeado para a faculdade padrão.', r.aluno_id, r.faculdade_id;
            END LOOP;
        END $$;
        """
    )

    # For any remaining non-numeric faculdade_id, assign the first available faculdade id as fallback
    op.execute(
        """
        UPDATE aluno
        SET faculdade_id = (SELECT id_faculdade::varchar FROM faculdade ORDER BY id_faculdade ASC LIMIT 1)
        WHERE faculdade_id !~ '^[0-9]+$' OR faculdade_id IS NULL;
        """
    )

    # 4. Now all rows have valid integer strings, safely cast column to INTEGER
    op.execute(
        """
        ALTER TABLE aluno
        ALTER COLUMN faculdade_id TYPE INTEGER
        USING faculdade_id::INTEGER;
        """
    )

    # 5. Restore NOT NULL constraint now that every row has a valid integer id
    op.alter_column("aluno", "faculdade_id", nullable=False)

    # 6. Add foreign key constraint
    op.create_foreign_key(
        "fk_aluno_faculdade_id",
        "aluno",
        "faculdade",
        ["faculdade_id"],
        ["id_faculdade"],
    )

    # 7. Drop campus column if it exists
    existing_columns = {col["name"] for col in inspector.get_columns("aluno")}
    if "campus" in existing_columns:
        op.drop_column("aluno", "campus")


def downgrade() -> None:
    # Drop FK constraint
    op.drop_constraint("fk_aluno_faculdade_id", "aluno", type_="foreignkey")

    # Change faculdade_id back to VARCHAR
    op.execute(
        """
        ALTER TABLE aluno
        ALTER COLUMN faculdade_id TYPE VARCHAR(150)
        USING faculdade_id::VARCHAR
        """
    )

    # Re-add campus column
    op.add_column(
        "aluno",
        sa.Column("campus", sa.String(150), nullable=True),
    )
