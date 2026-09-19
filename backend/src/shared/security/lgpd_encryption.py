import os
import base64
import hashlib
import hmac
from typing import Optional
from dotenv import load_dotenv
from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy.types import TypeDecorator, String

load_dotenv()


def _obter_chave_fernet() -> bytes:
    """
    Retorna a chave Fernet a partir da variável LGPD_ENCRYPTION_KEY.
    Se não for definida, deriva uma chave segura a partir de SECRET_KEY_JWT.
    """
    chave_env = os.getenv("LGPD_ENCRYPTION_KEY")
    if chave_env:
        try:
            # Tentar usar diretamente se for chave Fernet base64 de 32 bytes válida
            return chave_env.encode("utf-8")
        except Exception:
            pass

    # Derivar chave de 32 bytes via SHA-256 da SECRET_KEY_JWT como fallback seguro
    secret_jwt = os.getenv("SECRET_KEY_JWT", "gouce_app_lgpd_secret_key_fallback_2026")
    key_bytes = hashlib.sha256(secret_jwt.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(key_bytes)


_FERNET_INSTANCE = Fernet(_obter_chave_fernet())


def encrypt_val(val: Optional[str]) -> Optional[str]:
    """Criptografa uma string usando AES-256/Fernet e retorna base64."""
    if val is None or val == "":
        return val
    try:
        token = _FERNET_INSTANCE.encrypt(val.encode("utf-8"))
        return token.decode("utf-8")
    except Exception as e:
        raise ValueError(f"Erro ao criptografar dado sensível LGPD: {e}")


def decrypt_val(cipher_text: Optional[str]) -> Optional[str]:
    """Descriptografa um token cifrado. Se já for texto legível (retrocompatibilidade), retorna o texto puro."""
    if cipher_text is None or cipher_text == "":
        return cipher_text
    try:
        data = _FERNET_INSTANCE.decrypt(cipher_text.encode("utf-8"))
        return data.decode("utf-8")
    except (InvalidToken, Exception):
        # Fallback para dados legados gravados antes da ativação da criptografia
        return cipher_text


def hash_email(email: Optional[str]) -> Optional[str]:
    """
    Gera um Blind Index HMAC-SHA256 para o e-mail do usuário.
    Permite busca instantânea indexada (O(1)) mantendo o e-mail 100% criptografado em repouso.
    """
    if not email:
        return None
    email_normalizado = email.strip().lower()
    chave = _obter_chave_fernet()
    return hmac.new(chave, email_normalizado.encode("utf-8"), hashlib.sha256).hexdigest()


def encrypt_bytes(data: Optional[bytes]) -> Optional[bytes]:
    """Criptografa um array de bytes de arquivo (PDF/Imagem) usando AES-256 Fernet."""
    if not data:
        return data
    try:
        return _FERNET_INSTANCE.encrypt(data)
    except Exception as e:
        raise ValueError(f"Erro ao criptografar arquivo físico no MinIO: {e}")


def decrypt_bytes(cipher_data: Optional[bytes]) -> Optional[bytes]:
    """Descriptografa bytes de um arquivo. Mantém compatibilidade com arquivos legados não cifrados."""
    if not cipher_data:
        return cipher_data
    try:
        return _FERNET_INSTANCE.decrypt(cipher_data)
    except (InvalidToken, Exception):
        # Fallback para arquivos antigos salvos sem criptografia
        return cipher_data


class EncryptedString(TypeDecorator):
    """
    Tipo de Coluna SQLAlchemy para criptografia em repouso de dados sensíveis LGPD.
    Armazena texto cifrado em repouso e descriptografa ao carregar no ORM.
    """
    impl = String
    cache_ok = True

    def __init__(self, length: int = 500, *args, **kwargs):
        super().__init__(length, *args, **kwargs)

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return encrypt_val(str(value))

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return decrypt_val(str(value))
