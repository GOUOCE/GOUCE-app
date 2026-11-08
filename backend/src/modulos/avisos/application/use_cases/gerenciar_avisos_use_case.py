"""Casos de uso para o gerenciamento do Mural de Avisos (HU-023)."""

import re

from src.modulos.avisos.application.dtos.aviso_dto import (
    DESCRICAO_MAX,
    DESCRICAO_MIN,
    TITULO_MAX,
    TITULO_MIN,
)
from src.modulos.avisos.infrastructure.repositories.aviso_repository import (
    AvisoRepository,
)
from src.modulos.avisos.infrastructure.services.notificacao_push_service import (
    NotificacaoPushService,
)


class AvisoValidationError(ValueError):
    """Erro de validação de domínio/aplicação no gerenciamento de avisos."""

    def __init__(self, field: str, message: str):
        self.field = field
        super().__init__(message)


class GerenciarAvisosUseCase:
    """Coordena validações de negócio e operações do repositório de avisos."""

    def __init__(
        self,
        repository: AvisoRepository,
        notificacao_service: NotificacaoPushService | None = None,
    ):
        self.repository = repository
        self.notificacao_service = notificacao_service or NotificacaoPushService()

    def criar(self, titulo: str, descricao: str, autor_id: int) -> dict:
        self._validar_id(autor_id, "autor_id")
        titulo_validado = self._validar_titulo(titulo)
        descricao_validada = self._validar_descricao(descricao)
        aviso_criado = self.repository.criar(
            titulo=titulo_validado,
            descricao=descricao_validada,
            autor_id=autor_id,
        )
        try:
            self.notificacao_service.disparar_novo_aviso(aviso_criado)
        except Exception:
            # O disparo de push é desacoplado e não deve reverter a publicação do aviso.
            pass
        return aviso_criado

    def listar(self, titulo: str | None = None) -> list[dict]:
        if titulo is not None:
            if not isinstance(titulo, str):
                raise AvisoValidationError(
                    "titulo",
                    "O filtro de título deve ser um texto válido.",
                )
            titulo = titulo.strip()

        return self.repository.listar(titulo=titulo)

    def listar_notificacoes(
        self,
        apos_id: int | None = None,
        limite: int = 10,
    ) -> list[dict]:
        if apos_id is not None:
            if isinstance(apos_id, bool) or not isinstance(apos_id, int) or apos_id < 0:
                raise AvisoValidationError(
                    "apos_id",
                    "O identificador de referência deve ser um número inteiro não negativo.",
                )
        avisos_persistidos = self.repository.listar()
        return self.notificacao_service.listar_eventos_recentes(
            avisos_persistidos=avisos_persistidos,
            apos_id=apos_id,
            limite=limite,
        )

    @staticmethod
    def _validar_titulo(valor: str) -> str:
        if not isinstance(valor, str):
            raise AvisoValidationError(
                "titulo",
                "Título deve ser um texto válido.",
            )
        normalizado = re.sub(r"\s+", " ", valor.strip())
        if not normalizado:
            raise AvisoValidationError(
                "titulo",
                "Título é obrigatório.",
            )
        if len(normalizado) < TITULO_MIN:
            raise AvisoValidationError(
                "titulo",
                f"O título deve ter pelo menos {TITULO_MIN} caracteres.",
            )
        if len(normalizado) > TITULO_MAX:
            raise AvisoValidationError(
                "titulo",
                f"O título deve ter no máximo {TITULO_MAX} caracteres.",
            )
        return normalizado

    @staticmethod
    def _validar_descricao(valor: str) -> str:
        if not isinstance(valor, str):
            raise AvisoValidationError(
                "descricao",
                "Descrição deve ser um texto válido.",
            )
        normalizada = valor.strip()
        if not normalizada:
            raise AvisoValidationError(
                "descricao",
                "Descrição é obrigatória.",
            )
        if len(normalizada) < DESCRICAO_MIN:
            raise AvisoValidationError(
                "descricao",
                f"A descrição deve ter pelo menos {DESCRICAO_MIN} caracteres.",
            )
        if len(normalizada) > DESCRICAO_MAX:
            raise AvisoValidationError(
                "descricao",
                f"A descrição deve ter no máximo {DESCRICAO_MAX} caracteres.",
            )
        return normalizada

    @staticmethod
    def _validar_id(valor: int, campo: str) -> None:
        if isinstance(valor, bool) or not isinstance(valor, int) or valor <= 0:
            raise AvisoValidationError(
                campo,
                "ID deve ser um número inteiro positivo.",
            )
