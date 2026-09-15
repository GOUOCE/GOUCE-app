from src.modulos.auth.application.dtos.login_dto import RefreshTokenResponseDTO


class RefreshTokenUseCase:
    def __init__(self, token_service):
        self.token_service = token_service

    def execute(self, refresh_token_val: str) -> RefreshTokenResponseDTO:
        if not refresh_token_val:
            raise ValueError("Token de atualização não fornecido")

        novo_access_token = self.token_service.refresh_access_token(refresh_token_val)

        return RefreshTokenResponseDTO(
            token_acesso=novo_access_token,
            tipo_token="bearer"
        )
