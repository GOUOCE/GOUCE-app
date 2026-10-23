from src.modulos.usuarios.infrastructure.repositories.representante_repository import (
    AlunoNaoAprovadoOuInativoError,
    AlunoNaoEncontradoError,
    FaculdadeInativaError,
    FaculdadeNaoEncontradaError,
    RepresentanteJaAtivoError,
    RepresentanteNaoAtivoError,
    RepresentanteNaoEncontradoError,
    RepresentanteRepository,
    TipoRepresentanteNaoInicializadoError,
)


class RepresentanteValidationError(ValueError):
    def __init__(self, field: str, message: str):
        self.field = field
        super().__init__(message)


class GerenciarRepresentantesUseCase:
    def __init__(self, repository: RepresentanteRepository):
        self.repository = repository

    def promover(self, aluno_id: int, faculdade_id: int, usuario_executor_id: int):
        self._validar_id(aluno_id, "aluno_id")
        self._validar_id(faculdade_id, "faculdade_id")
        self._validar_id(usuario_executor_id, "usuario_executor_id")

        return self.repository.promover(
            aluno_id=aluno_id,
            faculdade_id=faculdade_id,
            usuario_executor_id=usuario_executor_id,
        )

    def revogar(self, representante_id: int, usuario_executor_id: int):
        self._validar_id(representante_id, "representante_id")
        self._validar_id(usuario_executor_id, "usuario_executor_id")

        resultado = self.repository.revogar(
            representante_id=representante_id,
            usuario_executor_id=usuario_executor_id,
        )
        if not resultado:
            raise RepresentanteNaoEncontradoError("Representante não encontrado.")
        return resultado

    @staticmethod
    def _validar_id(valor: int, campo: str) -> None:
        if isinstance(valor, bool) or not isinstance(valor, int) or valor <= 0:
            raise RepresentanteValidationError(campo, "ID deve ser um número inteiro positivo.")
