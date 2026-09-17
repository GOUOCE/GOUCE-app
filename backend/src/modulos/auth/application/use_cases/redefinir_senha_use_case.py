import hashlib
from datetime import datetime, timezone

from src.modulos.auth.application.dtos.recuperacao_senha_dto import (
    RedefinirSenhaDTO,
    RedefinirSenhaResponseDTO,
)


class RedefinirSenhaUseCase:
    def __init__(self, usuario_repository, token_repository, hasher):
        self.usuario_repository = usuario_repository
        self.token_repository = token_repository
        self.hasher = hasher

    def execute(self, dto: RedefinirSenhaDTO) -> RedefinirSenhaResponseDTO:
        raw_token = (dto.token or "").strip()
        nova_senha = (dto.nova_senha or "").strip()

        if not raw_token:
            raise ValueError("Token/Código de recuperação é obrigatório")

        if not nova_senha or len(nova_senha) < 6:
            raise ValueError("A nova senha deve possuir no mínimo 6 caracteres")

        # 1. Validar token recebido
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        token_orm = self.token_repository.find_by_hash(token_hash)

        # Bloquear token inválido
        if not token_orm:
            raise ValueError("Token de recuperação inválido")

        # Bloquear token já utilizado
        if token_orm.used_at is not None:
            raise ValueError("Token de recuperação já utilizado")

        # Bloquear token expirado
        agora = datetime.now(timezone.utc)
        expires_at = token_orm.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if agora > expires_at:
            raise ValueError("Token de recuperação expirado")

        # Buscar usuário associado ao token
        session = self.token_repository.session
        usuario = token_orm.usuario
        if not usuario:
            raise ValueError("Usuário associado ao token não encontrado")

        # 2. Hash da nova senha
        senha_hash = self.hasher.hash(nova_senha)

        # 3. Atualizar usuário
        usuario.senha = senha_hash
        usuario.tentativas_falhas = 0
        usuario.limite_de_bloqueio = None

        # 4. Invalidar token após utilização
        token_orm.used_at = agora

        # Invalidar quaisquer outros tokens pendentes deste usuário
        self.token_repository.deactivate_active_tokens_for_user(usuario.id)

        session.commit()

        return RedefinirSenhaResponseDTO(
            mensagem="Senha alterada com sucesso."
        )
