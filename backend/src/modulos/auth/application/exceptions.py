class RecuperacaoApplicationError(ValueError):
    """Erro de negócio seguro para o fluxo de recuperação de senha."""

    status_code = 400
    code = "REQUEST_ERROR"
    public_message = "Não foi possível processar a solicitação."

    def __init__(self, *, details: list[dict] | None = None):
        self.details = details or []
        super().__init__(self.public_message)


class TokenInvalidError(RecuperacaoApplicationError):
    code = "TOKEN_INVALID"
    public_message = "Token de recuperação inválido."


class TokenExpiredError(RecuperacaoApplicationError):
    code = "TOKEN_EXPIRED"
    public_message = "Token de recuperação expirado."


class TokenAlreadyUsedError(RecuperacaoApplicationError):
    code = "TOKEN_ALREADY_USED"
    public_message = "Token de recuperação já utilizado."


class InvalidEmailError(RecuperacaoApplicationError):
    code = "REQUEST_VALIDATION_ERROR"
    public_message = "Formato de e-mail inválido."


class InvalidPasswordError(RecuperacaoApplicationError):
    code = "PASSWORD_INVALID"
    public_message = "A nova senha não atende aos critérios de segurança."


class EmailSendError(RecuperacaoApplicationError):
    status_code = 500
    code = "EMAIL_SEND_FAILED"
    public_message = "Não foi possível enviar o e-mail de recuperação. Tente novamente mais tarde."


class RecuperacaoInternalError(RecuperacaoApplicationError):
    status_code = 500
    code = "INTERNAL_ERROR"
    public_message = "Erro interno ao processar a solicitação."
