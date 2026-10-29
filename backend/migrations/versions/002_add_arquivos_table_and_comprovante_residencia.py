"""add arquivos table and comprovante residencia column

Revision ID: 002_add_arquivos_table
Revises: 001_fix_identificacao_genero
Create Date: 2026-09-14 21:18:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_add_arquivos_table'
down_revision: Union[str, None] = '001_fix_identificacao_genero'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Criar tabela arquivos com id UUID
    op.execute("""
    CREATE TABLE IF NOT EXISTS arquivos (
        id VARCHAR(36) PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        content_type VARCHAR(100) NULL,
        tamanho_bytes INTEGER NULL,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Adicionar coluna id_comprovante_residencia na tabela aluno se não existir
    op.execute("""
    DO $$ 
    BEGIN 
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'aluno' AND column_name = 'id_comprovante_residencia'
        ) THEN 
            ALTER TABLE aluno ADD COLUMN id_comprovante_residencia VARCHAR(36) NULL;
        END IF;
    END $$;
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE aluno DROP COLUMN IF EXISTS id_comprovante_residencia;")
    op.execute("DROP TABLE IF EXISTS arquivos;")
