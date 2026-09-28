import hashlib
from datetime import datetime, timezone

from src.modulos.auth.application.dtos.recuperacao_senha_dto import (
    RedefinirSenhaDTO,
    RedefinirSenhaResponseDTO,
)
from src.modulos.auth.application.exceptions import (
    InvalidPasswordError,
    RecuperacaoInternalError,
    TokenAlreadyUsedError,
    TokenExpiredError,
    TokenInvalidError,
)
from src.shared.validators.senha_validator import SenhaValidator


class RedefinirSenhaUseCase:
    def __init__(self, usuario_repository, token_repository, hasher, senha_validator=None, clock=None):
        self.usuario_repository = usuario_repository
        self.token_repository = token_repository
        self.hasher = hasher
        self.senha_validator = senha_validator or SenhaValidator()
        self.clock = clock or (lambda: datetime.now(timezone.utc))

    def execute(self, dto: RedefinirSenhaDTO) -> RedefinirSenhaResponseDTO:
        raw_token = (dto.token or "").strip()
        nova_senha = dto.nova_senha or ""

        if not raw_token:
            raise TokenInvalidError()

        senha_valida, mensagem_senha = self.senha_validator.validar_senha(nova_senha)
        if not senha_valida:
            raise InvalidPasswordError(
                details=[{"field": "nova_senha", "message": mensagem_senha}]
            )

        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        session = self.token_repository.session

        try:
            # O lock permanece ativo até o commit/rollback desta transação.
            token_orm = self.token_repository.find_by_hash_for_update(token_hash)
            if not token_orm:
                raise TokenInvalidError()

            if token_orm.used_at is not None:
                raise TokenAlreadyUsedError()

            agora = self.clock()
            expires_at = token_orm.expires_at
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)

            if agora >= expires_at:
                raise TokenExpiredError()

            usuario = token_orm.usuario
            if not usuario:
                raise RecuperacaoInternalError()

            senha_hash = self.hasher.hash(nova_senha)
            usuario.senha = senha_hash
            usuario.tentativas_falhas = 0
            usuario.limite_de_bloqueio = None

            if not self.token_repository.mark_as_used(token_orm.id, agora):
                raise TokenAlreadyUsedError()
            token_orm.used_at = agora

            self.token_repository.deactivate_active_tokens_for_user(usuario.id)
            session.commit()
        except Exception:
            session.rollback()
            raise

        return RedefinirSenhaResponseDTO(message="Senha alterada com sucesso.")
