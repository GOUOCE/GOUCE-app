class AgendamentoError(Exception):
    def __init__(self, code: str, message: str, status_code: int, fields=None):
        self.code, self.message, self.status_code, self.fields = (
            code,
            message,
            status_code,
            fields,
        )
        super().__init__(message)
