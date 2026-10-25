from typing import Optional

from src.modulos.crud_basicos.infrastructure.repositories.bairro_repository import (
    BairroJaCadastradoError,
    BairroNaoEncontradoError,
    BairroRepository,
    PontoDeParadaJaCadastradoError,
)
from src.modulos.crud_basicos.domain.entities.bairro import BairroORM


class BairroValidationError(ValueError):
    def __init__(self, field: str, message: str):
        self.field = field
        super().__init__(message)


class BairroService:
    def __init__(self, repository: BairroRepository):
        self.repository = repository

    def listar(
        self,
        ativo: Optional[bool] = None,
        limite: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> list[BairroORM]:
        return self.repository.listar(ativo=ativo, limite=limite, offset=offset)

    def buscar_por_id(self, bairro_id: int) -> BairroORM:
        self._validar_id(bairro_id, "bairro_id")
        bairro = self.repository.buscar_por_id(bairro_id)
        if not bairro:
            raise BairroNaoEncontradoError("Bairro não encontrado.")
        return bairro

    def criar(self, nome: str, pontos_de_parada: list[str]) -> BairroORM:
        nome_normalizado = self._validar_campo_obrigatorio(
            nome, "nome", "O nome do bairro é obrigatório."
        )

        if not pontos_de_parada or not isinstance(pontos_de_parada, list):
            raise BairroValidationError(
                "pontos_de_parada", "Ao menos um ponto de parada é obrigatório."
            )

        pontos_limpos = []
        for ponto in pontos_de_parada:
            ponto_limpo = self._validar_campo_obrigatorio(
                ponto, "pontos_de_parada", "O nome do ponto de parada não pode ser vazio."
            )
            pontos_limpos.append(ponto_limpo)

        return self.repository.criar(
            nome=nome_normalizado,
            pontos_de_parada=pontos_limpos,
        )

    def atualizar(
        self,
        bairro_id: int,
        nome: Optional[str] = None,
        pontos_de_parada: Optional[list[str]] = None,
    ) -> BairroORM:
        self._validar_id(bairro_id, "bairro_id")

        nome_normalizado = None
        if nome is not None:
            nome_normalizado = self._validar_campo_obrigatorio(
                nome, "nome", "O nome do bairro não pode ser vazio."
            )

        pontos_limpos = None
        if pontos_de_parada is not None:
            if not pontos_de_parada or not isinstance(pontos_de_parada, list):
                raise BairroValidationError(
                    "pontos_de_parada", "Ao menos um ponto de parada deve ser informado."
                )
            pontos_limpos = []
            for ponto in pontos_de_parada:
                ponto_limpo = self._validar_campo_obrigatorio(
                    ponto, "pontos_de_parada", "O nome do ponto de parada não pode ser vazio."
                )
                pontos_limpos.append(ponto_limpo)

        return self.repository.atualizar(
            bairro_id=bairro_id,
            nome=nome_normalizado,
            pontos_de_parada=pontos_limpos,
        )

    def ativar(
        self,
        bairro_id: int,
        usuario_executor_id: Optional[int] = None,
    ) -> BairroORM:
        self._validar_id(bairro_id, "bairro_id")
        if usuario_executor_id is not None:
            self._validar_id(usuario_executor_id, "usuario_executor_id")

        return self.repository.ativar(
            bairro_id=bairro_id,
            usuario_executor_id=usuario_executor_id,
        )

    def inativar(
        self,
        bairro_id: int,
        usuario_executor_id: Optional[int] = None,
    ) -> BairroORM:
        self._validar_id(bairro_id, "bairro_id")
        if usuario_executor_id is not None:
            self._validar_id(usuario_executor_id, "usuario_executor_id")

        return self.repository.inativar(
            bairro_id=bairro_id,
            usuario_executor_id=usuario_executor_id,
        )

    @staticmethod
    def _validar_campo_obrigatorio(valor: Optional[str], campo: str, mensagem: str) -> str:
        if valor is None:
            raise BairroValidationError(campo, mensagem)
        valor_limpo = str(valor).strip()
        if not valor_limpo:
            raise BairroValidationError(campo, mensagem)
        return valor_limpo

    @staticmethod
    def _validar_id(valor: object, campo: str) -> None:
        if isinstance(valor, bool) or not isinstance(valor, int) or valor <= 0:
            raise BairroValidationError(campo, f"{campo} deve ser um número inteiro positivo.")
