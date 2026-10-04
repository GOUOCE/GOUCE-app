"""seed default administrator

Revision ID: 65_seed_administrador_padrao
Revises: 64_remove_id_usuario_tipo
"""
import os
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from argon2 import PasswordHasher

from src.shared.security.lgpd_encryption import encrypt_val, hash_email


revision: str = "65_seed_administrador_padrao"
down_revision: Union[str, None] = "64_remove_id_usuario_tipo"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEFAULT_ADMIN_NAME = "Administrador Padrao"
DEFAULT_ADMIN_EMAIL = "admin@gouce.app"
DEFAULT_ADMIN_PASSWORD = "GouceAdmin!2026#X7vQ"


def upgrade() -> None:
    connection = op.get_bind()
    nome = os.getenv("DEFAULT_ADMIN_NAME", DEFAULT_ADMIN_NAME)
    email = os.getenv("DEFAULT_ADMIN_EMAIL", DEFAULT_ADMIN_EMAIL).strip().lower()
    senha = os.getenv("DEFAULT_ADMIN_PASSWORD", DEFAULT_ADMIN_PASSWORD)
    email_hash = hash_email(email)

    usuario_id = connection.execute(
        sa.text("SELECT id FROM usuario WHERE email_hash = :email_hash"),
        {"email_hash": email_hash},
    ).scalar_one_or_none()

    if usuario_id is None:
        usuario_id = connection.execute(
            sa.text(
                """
                INSERT INTO usuario (
                    nome_completo, email, email_hash, senha, ativo,
                    tentativas_falhas
                ) VALUES (
                    :nome_completo, :email, :email_hash, :senha, TRUE,
                    0
                )
                RETURNING id
                """
            ),
            {
                "nome_completo": encrypt_val(nome),
                "email": encrypt_val(email),
                "email_hash": email_hash,
                "senha": PasswordHasher().hash(senha),
            },
        ).scalar_one()

    tipo_id = connection.execute(
        sa.text("SELECT id FROM tipo WHERE tipo_usuario = 'administrador'")
    ).scalar_one()

    connection.execute(
        sa.text(
            """
            INSERT INTO administrador (administrador_id, is_administrador_ativo)
            VALUES (:usuario_id, TRUE)
            ON CONFLICT (administrador_id) DO NOTHING
            """
        ),
        {"usuario_id": usuario_id},
    )
    connection.execute(
        sa.text(
            """
            INSERT INTO usuario_tipo (id_usuario, id_tipo)
            VALUES (:usuario_id, :tipo_id)
            ON CONFLICT (id_usuario, id_tipo) DO NOTHING
            """
        ),
        {"usuario_id": usuario_id, "tipo_id": tipo_id},
    )


def downgrade() -> None:
    # Dados de autenticação não são removidos automaticamente no downgrade.
    pass
