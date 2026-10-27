from typing import Optional

from src.modulos.crud_basicos.infrastructure.repositories.faculdade_repository import (
    FaculdadeJaCadastradaError,
    FaculdadeNaoEncontradaError,
    FaculdadeRepository,
)
from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM


class FaculdadeValidationError(ValueError):
    def __init__(self, field: str, message: str):
        self.field = field
        super().__init__(message)


class FaculdadeService:
    def __init__(self, repository: FaculdadeRepository):
        self.repository = repository

    def listar(
        self,
        ativo: Optional[bool] = None,
        limite: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> list[FaculdadeORM]:
        return self.repository.listar(ativo=ativo, limite=limite, offset=offset)

    def buscar_por_id(self, faculdade_id: int) -> FaculdadeORM:
        self._validar_id(faculdade_id, "faculdade_id")
        faculdade = self.repository.buscar_por_id(faculdade_id)
        if not faculdade:
            raise FaculdadeNaoEncontradaError("Faculdade não encontrada.")
        return faculdade

    def criar(self, nome: str, campus: str, sigla: Optional[str] = None) -> FaculdadeORM:
        nome_normalizado = self._validar_campo_obrigatorio(nome, "nome", "O nome da faculdade é obrigatório.")
        campus_normalizado = self._validar_campo_obrigatorio(campus, "campus", "O campus da faculdade é obrigatório.")
        sigla_normalizada = sigla.strip() if sigla is not None and str(sigla).strip() else nome_normalizado[:3].upper()

        return self.repository.criar(nome=nome_normalizado, campus=campus_normalizado, sigla=sigla_normalizada)

    def atualizar(
        self,
        faculdade_id: int,
        usuario_executor_id: int,
        nome: Optional[str] = None,
        campus: Optional[str] = None,
        sigla: Optional[str] = None,
        ativo: Optional[bool] = None,
    ) -> FaculdadeORM:
        self._validar_id(faculdade_id, "faculdade_id")

        nome_normalizado = None
        if nome is not None:
            nome_normalizado = self._validar_campo_obrigatorio(nome, "nome", "O nome da faculdade não pode ser vazio.")

        campus_normalizado = None
        if campus is not None:
            campus_normalizado = self._validar_campo_obrigatorio(campus, "campus", "O campus da faculdade não pode ser vazio.")

        sigla_normalizada = sigla.strip() if sigla is not None and str(sigla).strip() else (None if sigla is not None else None)

        return self.repository.atualizar(
            faculdade_id=faculdade_id,
            nome=nome_normalizado,
            usuario_executor_id=usuario_executor_id,
            campus=campus_normalizado,
            sigla=sigla_normalizada,
            ativo=ativo,
        )

    def ativar(
        self,
        faculdade_id: int,
        usuario_executor_id: Optional[int] = None,
    ) -> FaculdadeORM:
        self._validar_id(faculdade_id, "faculdade_id")
        if usuario_executor_id is not None:
            self._validar_id(usuario_executor_id, "usuario_executor_id")

        return self.repository.ativar(
            faculdade_id=faculdade_id,
            usuario_executor_id=usuario_executor_id,
        )

    def inativar(
        self,
        faculdade_id: int,
        usuario_executor_id: Optional[int] = None,
    ) -> FaculdadeORM:
        self._validar_id(faculdade_id, "faculdade_id")
        if usuario_executor_id is not None:
            self._validar_id(usuario_executor_id, "usuario_executor_id")

        return self.repository.inativar(
            faculdade_id=faculdade_id,
            usuario_executor_id=usuario_executor_id,
        )

    @staticmethod
    def _validar_campo_obrigatorio(valor: Optional[str], campo: str, mensagem: str) -> str:
        if valor is None:
            raise FaculdadeValidationError(campo, mensagem)
        valor_limpo = str(valor).strip()
        if not valor_limpo:
            raise FaculdadeValidationError(campo, mensagem)
        return valor_limpo

    @staticmethod
    def _validar_id(valor: object, campo: str) -> None:
        if isinstance(valor, bool) or not isinstance(valor, int) or valor <= 0:
            raise FaculdadeValidationError(campo, f"{campo} deve ser um número inteiro positivo.")
