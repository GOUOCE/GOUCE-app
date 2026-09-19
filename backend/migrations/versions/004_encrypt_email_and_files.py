"""encrypt email with blind index, nome_completo, and arquivos.nome for LGPD

Revision ID: 004_encrypt_email_and_files
Revises: 003_lgpd_security
Create Date: 2026-09-18 12:26:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '004_encrypt_email_and_files'
down_revision: Union[str, None] = '003_lgpd_security'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Alterar colunas para VARCHAR(500) para suportar texto cifrado
    op.execute("ALTER TABLE usuario ALTER COLUMN email TYPE VARCHAR(500);")
    op.execute("ALTER TABLE usuario ALTER COLUMN nome_completo TYPE VARCHAR(500);")
    op.execute("ALTER TABLE arquivos ALTER COLUMN nome TYPE VARCHAR(500);")

    # 2. Adicionar coluna email_hash (Blind Index) com índice na tabela usuario
    op.execute("""
    DO $$ 
    BEGIN 
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'usuario' AND column_name = 'email_hash'
        ) THEN 
            ALTER TABLE usuario ADD COLUMN email_hash VARCHAR(64) NULL;
            CREATE INDEX IF NOT EXISTS ix_usuario_email_hash ON usuario (email_hash);
        END IF;
    END $$;
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_usuario_email_hash;")
    op.execute("ALTER TABLE usuario DROP COLUMN IF EXISTS email_hash;")
