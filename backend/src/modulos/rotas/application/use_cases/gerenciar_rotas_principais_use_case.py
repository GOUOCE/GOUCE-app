"""Casos de uso para o gerenciamento administrativo de rotas principais."""

from datetime import time

from src.modulos.rotas.application.dtos.rota_principal_dto import (
    contem_nul,
    interpretar_horario,
)
from src.modulos.rotas.infrastructure.repositories.rota_principal_repository import (
    MENSAGEM_ROTA_COM_COMPLEMENTARES_ATIVAS,
    RotaComComplementaresAtivasError,
    RotaPrincipalRepository,
)

MENSAGEM_ROTA_COM_AGENDAMENTOS = (
    "Esta rota possui agendamentos pendentes e não pode ser inativada no momento."
)

MENSAGEM_ROTA_COM_VINCULO_INATIVO = (
    "Esta rota possui bairro ou faculdade inativo e não pode ser reativada. "
    "Atualize os vínculos antes."
)

_ROTULOS = {
    "nome": "Nome da rota",
    "horario_saida": "Horário de saída",
    "horario_retorno": "Horário de retorno",
    "bairros_ids": "Bairros",
    "faculdades_ida_ids": "Faculdades da ida",
    "faculdades_volta_ids": "Faculdades da volta",
}
_CAMPOS_LISTA = ("bairros_ids", "faculdades_ida_ids", "faculdades_volta_ids")
_MENSAGENS_LISTA_VAZIA = {
    "bairros_ids": "Vincule ao menos um bairro.",
    "faculdades_ida_ids": "Informe ao menos uma faculdade na ida.",
    "faculdades_volta_ids": "Informe ao menos uma faculdade na volta.",
}
_MENSAGENS_LISTA_DUPLICADA = {
    "bairros_ids": "Bairros duplicados: cada bairro só pode ser vinculado uma vez.",
    "faculdades_ida_ids": "Faculdades da ida duplicadas: informe cada faculdade uma vez.",
    "faculdades_volta_ids": "Faculdades da volta duplicadas: informe cada faculdade uma vez.",
}


class RotaPrincipalValidationError(ValueError):
    """Erro de validação de uma entrada do gerenciamento de rotas."""

    def __init__(self, field: str, message: str):
        self.field = field
        super().__init__(message)


class RotaPrincipalNaoEncontradaError(ValueError):
    """Indica que a rota solicitada não existe."""


class RotaComAgendamentosPendentesError(ValueError):
    """Impede a inativação de rota com alunos agendados em datas futuras."""


class RotaComVinculoInativoError(ValueError):
    """Impede a reativação de rota ligada a bairro ou faculdade inativo."""


class RotaPrincipalStatusInalteradoError(ValueError):
    """A rota já está no estado solicitado (ativa/inativa)."""


class GerenciarRotasPrincipaisUseCase:
    """Coordena validações de negócio e operações do repository de rotas."""

    def __init__(self, repository: RotaPrincipalRepository):
        self.repository = repository

    def listar(
        self,
        incluir_inativos: bool = False,
        nome: str | None = None,
    ) -> list[dict]:
        if nome is not None:
            if not isinstance(nome, str) or contem_nul(nome):
                raise RotaPrincipalValidationError(
                    "nome", "Nome deve ser um texto válido."
                )
            nome = nome.strip() or None
        ativo = None if incluir_inativos else True
        return self.repository.listar(ativo=ativo, nome=nome)

    def listar_opcoes(self) -> dict:
        return self.repository.listar_opcoes()

    def buscar(self, rota_id: int) -> dict:
        self._validar_id(rota_id, "rota_id")
        resultado = self.repository.buscar(rota_id)
        if not resultado:
            raise RotaPrincipalNaoEncontradaError("Rota não encontrada.")
        return resultado

    def criar(
        self,
        nome: str,
        horario_saida: time,
        horario_retorno: time,
        bairros_ids: list[int],
        faculdades_ida_ids: list[int],
        faculdades_volta_ids: list[int],
        usuario_executor_id: int,
    ) -> dict:
        self._validar_id(usuario_executor_id, "usuario_executor_id")
        nome = self._validar_nome(nome)
        horario_saida = self._validar_horario(horario_saida, "horario_saida")
        horario_retorno = self._validar_horario(horario_retorno, "horario_retorno")
        self._validar_ordem_horarios(horario_saida, horario_retorno)
        bairros_ids = self._validar_lista("bairros_ids", bairros_ids)
        faculdades_ida_ids = self._validar_lista("faculdades_ida_ids", faculdades_ida_ids)
        faculdades_volta_ids = self._validar_lista(
            "faculdades_volta_ids", faculdades_volta_ids
        )
        return self.repository.criar(
            nome,
            horario_saida,
            horario_retorno,
            bairros_ids,
            faculdades_ida_ids,
            faculdades_volta_ids,
            usuario_executor_id,
        )

    def atualizar(
        self,
        rota_id: int,
        campos: dict,
        usuario_executor_id: int,
    ) -> dict:
        """``campos`` contém só as chaves enviadas; ``None`` conta como vazio."""
        self._validar_id(rota_id, "rota_id")
        self._validar_id(usuario_executor_id, "usuario_executor_id")
        if not campos:
            raise RotaPrincipalValidationError(
                "rota", "Informe ao menos um campo para atualização."
            )

        atual = self.buscar(rota_id)
        validados: dict = {}
        if "nome" in campos:
            validados["nome"] = self._validar_nome(campos["nome"])
        for campo in ("horario_saida", "horario_retorno"):
            if campo in campos:
                validados[campo] = self._validar_horario(campos[campo], campo)
        for campo in _CAMPOS_LISTA:
            if campo in campos:
                validados[campo] = self._validar_lista(campo, campos[campo])

        if "horario_saida" in validados or "horario_retorno" in validados:
            self._validar_ordem_horarios(
                validados.get("horario_saida", interpretar_horario(atual["horario_saida"])),
                validados.get(
                    "horario_retorno", interpretar_horario(atual["horario_retorno"])
                ),
            )

        resultado = self.repository.atualizar(rota_id, validados, usuario_executor_id)
        if not resultado:
            raise RotaPrincipalNaoEncontradaError("Rota não encontrada.")
        return resultado

    def inativar(self, rota_id: int, usuario_executor_id: int) -> dict:
        self._validar_id(usuario_executor_id, "usuario_executor_id")
        rota = self.buscar(rota_id)
        if not rota["ativo"]:
            raise RotaPrincipalStatusInalteradoError("Rota já está inativa.")
        if self.repository.possui_complementares_ativas(rota_id):
            raise RotaComComplementaresAtivasError(
                MENSAGEM_ROTA_COM_COMPLEMENTARES_ATIVAS
            )
        if self.repository.possui_agendamentos_futuros(rota_id):
            raise RotaComAgendamentosPendentesError(MENSAGEM_ROTA_COM_AGENDAMENTOS)
        resultado = self.repository.inativar(rota_id, usuario_executor_id)
        if not resultado:
            raise RotaPrincipalNaoEncontradaError("Rota não encontrada.")
        return resultado

    def reativar(self, rota_id: int, usuario_executor_id: int) -> dict:
        self._validar_id(usuario_executor_id, "usuario_executor_id")
        rota = self.buscar(rota_id)
        if rota["ativo"]:
            raise RotaPrincipalStatusInalteradoError("Rota já está ativa.")
        if self.repository.possui_vinculo_inativo(rota_id):
            raise RotaComVinculoInativoError(MENSAGEM_ROTA_COM_VINCULO_INATIVO)
        resultado = self.repository.reativar(rota_id, usuario_executor_id)
        if not resultado:
            raise RotaPrincipalNaoEncontradaError("Rota não encontrada.")
        return resultado

    @staticmethod
    def _validar_nome(valor: object) -> str:
        if valor is None:
            raise RotaPrincipalValidationError("nome", "Nome da rota é obrigatório.")
        if not isinstance(valor, str) or contem_nul(valor):
            raise RotaPrincipalValidationError(
                "nome", "Nome da rota deve ser um texto válido."
            )
        valor = valor.strip()
        if not valor:
            raise RotaPrincipalValidationError("nome", "Nome da rota é obrigatório.")
        if len(valor) > 150:
            raise RotaPrincipalValidationError(
                "nome", "Nome da rota deve ter no máximo 150 caracteres."
            )
        return valor

    @staticmethod
    def _validar_horario(valor: object, campo: str) -> time:
        if valor is None:
            raise RotaPrincipalValidationError(campo, f"{_ROTULOS[campo]} é obrigatório.")
        try:
            return interpretar_horario(valor)
        except ValueError as error:
            raise RotaPrincipalValidationError(campo, str(error)) from error

    @staticmethod
    def _validar_ordem_horarios(saida: time, retorno: time) -> None:
        if retorno <= saida:
            raise RotaPrincipalValidationError(
                "horario_retorno",
                "Horário de retorno deve ser maior que o horário de saída.",
            )

    @staticmethod
    def _validar_lista(campo: str, valor: object) -> list[int]:
        if not isinstance(valor, list) or not valor:
            raise RotaPrincipalValidationError(campo, _MENSAGENS_LISTA_VAZIA[campo])
        for item in valor:
            if isinstance(item, bool) or not isinstance(item, int) or item <= 0:
                raise RotaPrincipalValidationError(
                    campo, "Informe IDs válidos (números inteiros positivos)."
                )
        if len(set(valor)) != len(valor):
            raise RotaPrincipalValidationError(
                campo, _MENSAGENS_LISTA_DUPLICADA[campo]
            )
        return list(valor)

    @staticmethod
    def _validar_id(valor: object, campo: str) -> None:
        if isinstance(valor, bool) or not isinstance(valor, int) or valor <= 0:
            raise RotaPrincipalValidationError(
                campo, "ID deve ser um número inteiro positivo."
            )
