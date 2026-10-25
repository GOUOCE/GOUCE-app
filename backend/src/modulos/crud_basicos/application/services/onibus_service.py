from typing import Optional

from src.modulos.crud_basicos.infrastructure.repositories.onibus_repository import (
    OnibusJaCadastradoError,
    OnibusNaoEncontradoError,
    OnibusJaAtivado,
    OnibusJaDesativado,
    OnibusRepository,
)
from src.modulos.crud_basicos.domain.entities.onibus import OnibusORM


class OnibusValidationError(ValueError):
    def __init__(self, field: str, message: str):
        self.field = field
        super().__init__(message)


class OnibusService:
    def __init__(self, repository: OnibusRepository):
        self.repository = repository

    def listar(
        self,
        ativo: Optional[bool] = None,
        limite: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> list[OnibusORM]:
        return self.repository.listar(ativo=ativo, limite=limite, offset=offset)

    def buscar_por_placa(self, placa: str) -> OnibusORM:
        placa_normalizada = self._validar_placa(placa, "placa")
        onibus = self.repository.buscar_por_placa(placa_normalizada)
        if not onibus:
            raise OnibusNaoEncontradoError("Ônibus não encontrado.")
        return onibus

    def criar(
        self,
        placa: str,
        qtd_assentos: int,
        capacidade_maxima: int,
        apelido: Optional[str] = None,
        id_foto_onibus: Optional[str] = None,
    ) -> OnibusORM:
        placa_normalizada = self._validar_placa(placa, "placa")
        self._validar_capacidade(qtd_assentos, "qtd_assentos", "A quantidade de assentos deve ser maior que zero.")
        self._validar_capacidade_em_pe(capacidade_maxima, "capacidade_maxima", "A capacidade máxima de alunos em pé deve ser maior ou igual a zero.")

        if id_foto_onibus:
            id_foto_limpo = str(id_foto_onibus).strip()
            if not self.repository.arquivo_existe(id_foto_limpo):
                raise OnibusValidationError("id_foto_onibus", "A foto informada não é um arquivo válido registrado no sistema.")
            id_foto_onibus = id_foto_limpo

        return self.repository.criar(
            placa=placa_normalizada,
            qtd_assentos=qtd_assentos,
            capacidade_maxima=capacidade_maxima,
            apelido=apelido,
            id_foto_onibus=id_foto_onibus,
        )

    def atualizar(
        self,
        placa_atual: str,
        nova_placa: Optional[str] = None,
        qtd_assentos: Optional[int] = None,
        capacidade_maxima: Optional[int] = None,
        apelido: Optional[str] = None,
        ativo: Optional[bool] = None,
        id_foto_onibus: Optional[str] = None,
        remover_foto: bool = False,
    ) -> OnibusORM:
        placa_atual_normalizada = self._validar_placa(placa_atual, "placa")

        placa_nova_normalizada = None
        if nova_placa is not None:
            placa_nova_normalizada = self._validar_placa(nova_placa, "placa")

        if qtd_assentos is not None:
            self._validar_capacidade(qtd_assentos, "qtd_assentos", "A quantidade de assentos deve ser maior que zero.")

        if capacidade_maxima is not None:
            self._validar_capacidade_em_pe(capacidade_maxima, "capacidade_maxima", "A capacidade máxima de alunos em pé deve ser maior ou igual a zero.")

        if id_foto_onibus is not None:
            id_foto_limpo = str(id_foto_onibus).strip()
            if id_foto_limpo and not self.repository.arquivo_existe(id_foto_limpo):
                raise OnibusValidationError("id_foto_onibus", "A foto informada não é um arquivo válido registrado no sistema.")
            if not id_foto_limpo:
                remover_foto = True
                id_foto_onibus = None
            else:
                id_foto_onibus = id_foto_limpo

        return self.repository.atualizar(
            placa_onibus=placa_atual_normalizada,
            nova_placa=placa_nova_normalizada,
            qtd_assentos=qtd_assentos,
            capacidade_maxima=capacidade_maxima,
            apelido=apelido,
            ativo=ativo,
            id_foto_onibus=id_foto_onibus,
            remover_foto=remover_foto,
        )

    def ativar(
        self,
        placa: str,
        usuario_executor_id: Optional[int] = None,
    ) -> OnibusORM:
        placa_normalizada = self._validar_placa(placa, "placa")
        if usuario_executor_id is not None:
            self._validar_id(usuario_executor_id, "usuario_executor_id")

        return self.repository.ativar(
            placa_onibus=placa_normalizada,
            usuario_executor_id=usuario_executor_id,
        )

    def inativar(
        self,
        placa: str,
        usuario_executor_id: Optional[int] = None,
    ) -> OnibusORM:
        placa_normalizada = self._validar_placa(placa, "placa")
        if usuario_executor_id is not None:
            self._validar_id(usuario_executor_id, "usuario_executor_id")

        return self.repository.inativar(
            placa_onibus=placa_normalizada,
            usuario_executor_id=usuario_executor_id,
        )

    @staticmethod
    def _validar_placa(valor: Optional[str], campo: str) -> str:
        if valor is None:
            raise OnibusValidationError(campo, "A placa do veículo é obrigatória.")
        valor_limpo = str(valor).strip().upper()
        if not valor_limpo:
            raise OnibusValidationError(campo, "A placa do veículo é obrigatória.")
        return valor_limpo

    @staticmethod
    def _validar_capacidade(valor: object, campo: str, mensagem: str) -> None:
        if valor is None or isinstance(valor, bool) or not isinstance(valor, int) or valor <= 0:
            raise OnibusValidationError(campo, mensagem)

    @staticmethod
    def _validar_capacidade_em_pe(valor: object, campo: str, mensagem: str) -> None:
            if valor is None or isinstance(valor, bool) or not isinstance(valor, int) or valor < 0:
                raise OnibusValidationError(campo, mensagem)

    @staticmethod
    def _validar_id(valor: object, campo: str) -> None:
        if isinstance(valor, bool) or not isinstance(valor, int) or valor <= 0:
            raise OnibusValidationError(campo, f"{campo} deve ser um número inteiro positivo.")
