import hashlib
from datetime import datetime, timezone

from src.modulos.auth.application.dtos.recuperacao_senha_dto import (
    ValidarTokenRecuperacaoDTO,
    ValidarTokenRecuperacaoResponseDTO,
)


class ValidarTokenRecuperacaoUseCase:
    def __init__(self, token_repository):
        self.token_repository = token_repository

    def execute(self, dto: ValidarTokenRecuperacaoDTO) -> ValidarTokenRecuperacaoResponseDTO:
        raw_token = (dto.token or "").strip()
        if not raw_token:
            raise ValueError("Token/Código de recuperação é obrigatório")

        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        token_orm = self.token_repository.find_by_hash(token_hash)

        # 1. Bloquear token inválido
        if not token_orm:
            raise ValueError("Token de recuperação inválido")

        # 2. Bloquear token já utilizado
        if token_orm.used_at is not None:
            raise ValueError("Token de recuperação já utilizado")

        # 3. Bloquear token expirado
        agora = datetime.now(timezone.utc)
        expires_at = token_orm.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if agora > expires_at:
            raise ValueError("Token de recuperação expirado")

        return ValidarTokenRecuperacaoResponseDTO(
            valido=True,
            mensagem="Token válido."
        )
