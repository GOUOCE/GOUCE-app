import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from src.modulos.auth.application.dtos.recuperacao_senha_dto import (
    SolicitarRecuperacaoSenhaDTO,
    SolicitarRecuperacaoSenhaResponseDTO,
)
from src.shared.validators.email_validator import EmailValidator
from src.shared.domain.interfaces.i_email_service import IEmailService

MSG_GENERICA_RESPOSTA = (
    "Se o e-mail estiver cadastrado no sistema, você receberá as instruções para redefinição de senha."
)


class SolicitarRecuperacaoSenhaUseCase:
    def __init__(
        self,
        usuario_repository,
        token_repository,
        email_validator: Optional[EmailValidator] = None,
        email_service: Optional[IEmailService] = None,
    ):
        self.usuario_repository = usuario_repository
        self.token_repository = token_repository
        self.email_validator = email_validator or EmailValidator()
        self.email_service = email_service

    def execute(self, dto: SolicitarRecuperacaoSenhaDTO) -> SolicitarRecuperacaoSenhaResponseDTO:
        email_limpo = (dto.email or "").strip().lower()

        # 1. Validar formato do e-mail recebido
        if not self.email_validator.validar_email(email_limpo):
            raise ValueError("Formato de e-mail inválido")

        # 2. Verificar existência da conta
        usuario = self.usuario_repository.buscar_por_email(email_limpo)

        # 3. Evitar exposição da existência ou não da conta
        token_dev: Optional[str] = None
        if usuario:
            # Desativar tokens ativos anteriores do usuário
            self.token_repository.deactivate_active_tokens_for_user(usuario.id)

            # Gerar token seguro
            raw_token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

            # Definir tempo de expiração do token (15 minutos)
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

            # Armazenar referência do token de forma segura
            self.token_repository.create_token(
                usuario_id=usuario.id,
                token_hash=token_hash,
                expires_at=expires_at,
            )

            # Enviar e-mail de recuperação
            if self.email_service:
                nome_usuario = getattr(usuario, "nome_completo", "Usuário")
                self.email_service.enviar_email_recuperacao_senha(
                    email_destino=usuario.email,
                    nome_usuario=nome_usuario,
                    token_recuperacao=raw_token,
                )

        # 4. Retornar mensagem genérica para e-mails cadastrados e não cadastrados
        return SolicitarRecuperacaoSenhaResponseDTO(
            mensagem=MSG_GENERICA_RESPOSTA
        )
