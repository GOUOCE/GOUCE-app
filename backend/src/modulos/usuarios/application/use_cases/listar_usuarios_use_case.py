class ListarUsuariosUseCase:
    def __init__(self, repository):
        self.repository = repository

    def execute(self) -> list[dict]:
        return self.repository.listar_todos()
