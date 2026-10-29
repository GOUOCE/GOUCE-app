"""lgpd security enhancements and consent tracking

Revision ID: 003_lgpd_security
Revises: 002_add_arquivos_table
Create Date: 2026-09-18 11:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003_lgpd_security'
down_revision: Union[str, None] = '002_add_arquivos_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Expandir tamanho das colunas para dados criptografados (base64 Fernet/AES)
    op.execute("ALTER TABLE usuario ALTER COLUMN telefone TYPE VARCHAR(500);")
    op.execute("ALTER TABLE aluno ALTER COLUMN identificacao_genero TYPE VARCHAR(500);")
    op.execute("ALTER TABLE aluno ALTER COLUMN identificacao_sexual TYPE VARCHAR(500);")
    op.execute("ALTER TABLE aluno ALTER COLUMN raca TYPE VARCHAR(500);")

    # 2. Adicionar colunas de consentimento LGPD na tabela aluno
    op.execute("""
    DO $$ 
    BEGIN 
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'aluno' AND column_name = 'consentimento_lgpd_em'
        ) THEN 
            ALTER TABLE aluno ADD COLUMN consentimento_lgpd_em TIMESTAMP WITH TIME ZONE NULL;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'aluno' AND column_name = 'versao_termos'
        ) THEN 
            ALTER TABLE aluno ADD COLUMN versao_termos VARCHAR(20) DEFAULT '1.0' NULL;
        END IF;
    END $$;
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE aluno DROP COLUMN IF EXISTS consentimento_lgpd_em;")
    op.execute("ALTER TABLE aluno DROP COLUMN IF EXISTS versao_termos;")
