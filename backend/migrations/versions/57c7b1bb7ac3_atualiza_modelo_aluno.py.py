"""teste

Revision ID: 57c7b1bb7ac3
Revises: 004_encrypt_email_and_files
Create Date: 2026-09-22 03:45:29.015638

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '57c7b1bb7ac3'
down_revision: Union[str, None] = '004_encrypt_email_and_files'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Enum usado em aluno.turno_curso — precisa ser criado explicitamente no Postgres
turno_curso_enum = postgresql.ENUM(
    'Matutino', 'Vespertino', 'Noturno', 'Integral',
    name='turno_curso_enum',
)

# Nomes explícitos para as FKs novas, para poder dropar de volta no downgrade
FK_COMPROVANTE_MATRICULA = 'fk_aluno_id_comprovante_matricula_arquivos'
FK_COMPROVANTE_RESIDENCIA = 'fk_aluno_id_comprovante_residencia_arquivos'
FK_FOTO_ALUNO = 'fk_aluno_id_foto_aluno_arquivos'


def upgrade() -> None:
    op.drop_index('ix_password_reset_token_token_hash', table_name='password_reset_token')
    op.drop_table('password_reset_token')

    op.alter_column('aluno', 'id_comprovante_matricula',
               existing_type=sa.VARCHAR(length=255),
               type_=sa.String(length=36),
               existing_nullable=False)
    op.alter_column('aluno', 'id_comprovante_residencia',
               existing_type=sa.VARCHAR(length=36),
               nullable=False)

    # Cria o tipo Enum no banco antes de usá-lo na coluna
    turno_curso_enum.create(op.get_bind(), checkfirst=True)
    op.alter_column('aluno', 'turno_curso',
               existing_type=sa.VARCHAR(length=30),
               type_=turno_curso_enum,
               postgresql_using='turno_curso::turno_curso_enum',
               existing_nullable=True)

    op.alter_column('aluno', 'id_foto_aluno',
               existing_type=sa.VARCHAR(length=255),
               type_=sa.String(length=36),
               existing_nullable=True)

    op.drop_constraint('aluno_bairro_id_key', 'aluno', type_='unique')
    op.drop_constraint('aluno_faculdade_id_key', 'aluno', type_='unique')

    op.create_foreign_key(FK_COMPROVANTE_RESIDENCIA, 'aluno', 'arquivos', ['id_comprovante_residencia'], ['id'])
    op.create_foreign_key(FK_FOTO_ALUNO, 'aluno', 'arquivos', ['id_foto_aluno'], ['id'])
    op.create_foreign_key(FK_COMPROVANTE_MATRICULA, 'aluno', 'arquivos', ['id_comprovante_matricula'], ['id'])

    op.drop_constraint('usuario_email_key', 'usuario', type_='unique')
    op.drop_constraint('usuario_telefone_key', 'usuario', type_='unique')

    # ix_usuario_email_hash já é criado na migration 004_encrypt_email_and_files — removido daqui para não duplicar


def downgrade() -> None:
    op.create_unique_constraint('usuario_telefone_key', 'usuario', ['telefone'])
    op.create_unique_constraint('usuario_email_key', 'usuario', ['email'])

    op.drop_constraint(FK_COMPROVANTE_MATRICULA, 'aluno', type_='foreignkey')
    op.drop_constraint(FK_FOTO_ALUNO, 'aluno', type_='foreignkey')
    op.drop_constraint(FK_COMPROVANTE_RESIDENCIA, 'aluno', type_='foreignkey')

    op.create_unique_constraint('aluno_faculdade_id_key', 'aluno', ['faculdade_id'])
    op.create_unique_constraint('aluno_bairro_id_key', 'aluno', ['bairro_id'])

    op.alter_column('aluno', 'id_foto_aluno',
               existing_type=sa.String(length=36),
               type_=sa.VARCHAR(length=255),
               existing_nullable=True)

    op.alter_column('aluno', 'turno_curso',
               existing_type=turno_curso_enum,
               type_=sa.VARCHAR(length=30),
               postgresql_using='turno_curso::varchar',
               existing_nullable=True)
    turno_curso_enum.drop(op.get_bind(), checkfirst=True)

    op.alter_column('aluno', 'id_comprovante_residencia',
               existing_type=sa.VARCHAR(length=36),
               nullable=True)
    op.alter_column('aluno', 'id_comprovante_matricula',
               existing_type=sa.String(length=36),
               type_=sa.VARCHAR(length=255),
               existing_nullable=False)

    op.create_table('password_reset_token',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('usuario_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('token_hash', sa.VARCHAR(length=64), autoincrement=False, nullable=False),
    sa.Column('expires_at', postgresql.TIMESTAMP(timezone=True), autoincrement=False, nullable=False),
    sa.Column('used_at', postgresql.TIMESTAMP(timezone=True), autoincrement=False, nullable=True),
    sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), autoincrement=False, nullable=False),
    sa.ForeignKeyConstraint(['usuario_id'], ['usuario.id'], name='password_reset_token_usuario_id_fkey', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name='password_reset_token_pkey')
    )
    op.create_index('ix_password_reset_token_token_hash', 'password_reset_token', ['token_hash'], unique=True)