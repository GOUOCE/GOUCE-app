class VinculoAlunoValidationError(ValueError):
    def __init__(self, field: str, message: str):
        self.field = field
        super().__init__(message)


class ValidarVinculosAlunoUseCase:
    def __init__(self, repository):
        self.repository = repository

    def execute(self, bairro_id: int, faculdade_id: int) -> None:
        if not self.repository.bairro_ativo_existe(bairro_id):
            raise VinculoAlunoValidationError(
                "bairro_id", "Selecione um bairro cadastrado e ativo."
            )
        if not self.repository.faculdade_ativa_existe(faculdade_id):
            raise VinculoAlunoValidationError(
                "faculdade_id", "Selecione uma instituição cadastrada e ativa."
            )
