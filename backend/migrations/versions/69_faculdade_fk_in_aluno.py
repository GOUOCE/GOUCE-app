"""replace faculdade_id string and campus with FK to faculdade table

Revision ID: 69_faculdade_fk_in_aluno
Revises: 68_create_faculdade_table
Create Date: 2026-10-19
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "69_faculdade_fk_in_aluno"
down_revision: Union[str, None] = "68_create_faculdade_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # 1. Remover UNIQUE antiga, se existir
    existing_constraints = [
        c["name"]
        for c in inspector.get_unique_constraints("aluno")
    ]

    if "aluno_faculdade_id_key" in existing_constraints:
        op.drop_constraint(
            "aluno_faculdade_id_key",
            "aluno",
            type_="unique"
        )

    # 2. Verificar se existem valores inválidos
    invalidos = bind.execute(sa.text("""
        SELECT aluno_id, faculdade_id
        FROM aluno
        WHERE faculdade_id IS NULL
           OR faculdade_id !~ '^[0-9]+$'
           OR NOT EXISTS (
               SELECT 1
               FROM faculdade f
               WHERE f.id_faculdade::varchar = aluno.faculdade_id
           )
    """)).fetchall()

    if invalidos:
        raise RuntimeError(
            "Existem alunos com faculdade_id inválido: "
            + str(invalidos)
        )

    # 3. Converter VARCHAR para INTEGER
    op.execute("""
        ALTER TABLE aluno
        ALTER COLUMN faculdade_id TYPE INTEGER
        USING faculdade_id::INTEGER;
    """)

    # 4. Garantir NOT NULL
    op.alter_column(
        "aluno",
        "faculdade_id",
        nullable=False
    )

    # 5. Criar chave estrangeira
    op.create_foreign_key(
        "fk_aluno_faculdade_id",
        "aluno",
        "faculdade",
        ["faculdade_id"],
        ["id_faculdade"]
    )

    # 6. Remover coluna campus, se existir
    existing_columns = {
        col["name"]
        for col in inspector.get_columns("aluno")
    }

    if "campus" in existing_columns:
        op.drop_column("aluno", "campus")


def downgrade() -> None:

    # 1. Remover chave estrangeira
    op.drop_constraint(
        "fk_aluno_faculdade_id",
        "aluno",
        type_="foreignkey"
    )

    # 2. Converter INTEGER para VARCHAR
    op.execute("""
        ALTER TABLE aluno
        ALTER COLUMN faculdade_id TYPE VARCHAR(150)
        USING faculdade_id::VARCHAR;
    """)

    # 3. Restaurar coluna campus
    op.add_column(
        "aluno",
        sa.Column(
            "campus",
            sa.String(150),
            nullable=True
        )
    )