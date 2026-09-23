from src.modulos.auth.application.dtos.login_dto import RefreshTokenResponseDTO
from jose import JWTError


class RefreshTokenUseCase:
    def __init__(self, token_service):
        self.token_service = token_service

    def execute(self, refresh_token_val: str, repository) -> RefreshTokenResponseDTO:
        if not refresh_token_val:
            raise ValueError("Token de atualização não fornecido")

        try:
            payload = self.token_service.decode(refresh_token_val)
        except JWTError:
            raise ValueError("Token de atualização inválido ou expirado")

        if payload.get("type") != "refresh":
            raise ValueError("Token de atualização inválido")

        subject = payload.get("sub")
        if isinstance(subject, bool):
            raise ValueError("Token de atualização inválido")

        if isinstance(subject, int):
            user_id = subject
        elif isinstance(subject, str) and subject.isdecimal():
            user_id = int(subject)
        else:
            raise ValueError("Token de atualização inválido")

        if user_id <= 0:
            raise ValueError("Token de atualização inválido")

        contexto = repository.buscar_contexto_autenticacao_por_id(user_id)
        if not contexto or not contexto.get("ativo"):
            raise ValueError("Sessão inválida ou expirada")

        if payload.get("role") != contexto.get("role"):
            raise ValueError("Sessão inválida ou expirada")

        try:
            novo_access_token = self.token_service.refresh_access_token(refresh_token_val)
        except JWTError:
            raise ValueError("Token de atualização inválido ou expirado")

        return RefreshTokenResponseDTO(
            token_acesso=novo_access_token,
            tipo_token="bearer"
        )
