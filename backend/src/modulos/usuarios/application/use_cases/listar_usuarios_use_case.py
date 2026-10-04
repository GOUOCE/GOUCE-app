class ListarUsuariosUseCase:
    def __init__(self, repository):
        self.repository = repository

    def execute(
        self,
        status: str | None = None,
        ordem: str | None = None,
    ) -> list[dict]:
        return self.repository.listar_usuarios_filtrados(
            status=status,
            ordem=ordem,
        )
