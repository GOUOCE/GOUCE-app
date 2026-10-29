"""Casos de uso para o gerenciamento administrativo de rotas complementares."""

import re
from datetime import time

from src.modulos.rotas.application.dtos.rota_principal_dto import (
    contem_nul,
    interpretar_horario,
)
from src.modulos.rotas.infrastructure.repositories.rota_complementar_repository import (
    MENSAGEM_PRINCIPAL_INATIVA_REATIVACAO,
    RotaComplementarComPrincipalInativaError,
    RotaComplementarRepository,
)
from src.modulos.rotas.application.use_cases.gerenciar_rotas_principais_use_case import (
    MENSAGEM_NOME_ROTA_INVALIDO,
)

MENSAGEM_ROTA_COM_AGENDAMENTOS = (
    "Esta rota possui agendamentos pendentes e não pode ser inativada no momento."
)

TAMANHO_MAXIMO = 150

# O nome é único entre principal e complementar (#208, item 1): mesma regra de caracteres da principal.
# O ponto de conexão é um endereço: a mesma base mais ponto, vírgula, º e ª, como a máscara do app (#356)
_PADROES_TEXTO = {
    "nome": (
        re.compile(r"[0-9A-Za-zÀ-ÖØ-öø-ÿ'’/\- ]+"),
        MENSAGEM_NOME_ROTA_INVALIDO,
    ),
    "ponto_conexao": (
        re.compile(r"[0-9A-Za-zÀ-ÖØ-öø-ÿ'’/\-.,ºª ]+"),
        "Ponto de conexão deve conter apenas letras, números, espaços, hífen, apóstrofo, "
        "barra, ponto, vírgula, º ou ª.",
    ),
}

_ROTULOS = {
    "nome": "Nome da rota complementar",
    "ponto_conexao": "Ponto de conexão",
    "horario_saida": "Horário de saída",
    "horario_retorno": "Horário de retorno",
}
MENSAGEM_ID_PRINCIPAL_INVALIDO = "Informe um ID de rota principal válido."
# Mesma regra e mensagem da rota principal (#208, item 2)
MENSAGEM_ORDEM_HORARIOS = "Horário de retorno deve ser maior que o horário de saída."


class RotaComplementarValidationError(ValueError):
    """Erro de validação de uma entrada do gerenciamento de rotas complementares."""

    def __init__(self, field: str, message: str):
        self.field = field
        super().__init__(message)


class RotaComplementarNaoEncontradaError(ValueError):
    """Indica que a rota complementar solicitada não existe."""


class RotaComplementarComAgendamentosPendentesError(ValueError):
    """Impede a inativação de rota com alunos agendados em datas futuras."""


class RotaComplementarStatusInalteradoError(ValueError):
    """A rota já está no estado solicitado (ativa/inativa)."""


class GerenciarRotasComplementaresUseCase:
    """Coordena validações de negócio e operações do repository de rotas complementares."""

    def __init__(self, repository: RotaComplementarRepository):
        self.repository = repository

    def listar(
        self,
        incluir_inativos: bool = False,
        nome: str | None = None,
        rota_principal_id: int | None = None,
    ) -> list[dict]:
        if nome is not None:
            if not isinstance(nome, str) or contem_nul(nome):
                raise RotaComplementarValidationError(
                    "nome", "Nome deve ser um texto válido."
                )
            nome = nome.strip() or None
        if rota_principal_id is not None:
            self._validar_id_principal(rota_principal_id)
        ativo = None if incluir_inativos else True
        return self.repository.listar(
            ativo=ativo, nome=nome, rota_principal_id=rota_principal_id
        )

    def listar_opcoes(self) -> dict:
        return self.repository.listar_opcoes()

    def buscar(self, rota_id: int) -> dict:
        self._validar_id(rota_id, "rota_id")
        resultado = self.repository.buscar(rota_id)
        if not resultado:
            raise RotaComplementarNaoEncontradaError("Rota complementar não encontrada.")
        return resultado

    def criar(
        self,
        nome: str,
        horario_saida: time,
        horario_retorno: time,
        ponto_conexao: str,
        rota_principal_id: int,
        usuario_executor_id: int,
    ) -> dict:
        self._validar_id(usuario_executor_id, "usuario_executor_id")
        nome = self._validar_texto(nome, "nome")
        horario_saida = self._validar_horario(horario_saida, "horario_saida")
        horario_retorno = self._validar_horario(horario_retorno, "horario_retorno")
        self._validar_ordem_horarios(horario_saida, horario_retorno)
        ponto_conexao = self._validar_texto(ponto_conexao, "ponto_conexao")
        rota_principal_id = self._validar_principal(rota_principal_id)
        return self.repository.criar(
            nome,
            horario_saida,
            horario_retorno,
            ponto_conexao,
            rota_principal_id,
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
            raise RotaComplementarValidationError(
                "rota", "Informe ao menos um campo para atualização."
            )

        atual = self.buscar(rota_id)
        validados: dict = {}
        for campo in ("nome", "ponto_conexao"):
            if campo in campos:
                validados[campo] = self._validar_texto(campos[campo], campo)
        for campo in ("horario_saida", "horario_retorno"):
            if campo in campos:
                validados[campo] = self._validar_horario(campos[campo], campo)
        # Na edição parcial, o horário não enviado é o que já está salvo
        if "horario_saida" in validados or "horario_retorno" in validados:
            self._validar_ordem_horarios(
                validados.get("horario_saida", interpretar_horario(atual["horario_saida"])),
                validados.get(
                    "horario_retorno", interpretar_horario(atual["horario_retorno"])
                ),
            )
        if "rota_principal_id" in campos:
            validados["rota_principal_id"] = self._validar_principal(
                campos["rota_principal_id"]
            )

        resultado = self.repository.atualizar(rota_id, validados, usuario_executor_id)
        if not resultado:
            raise RotaComplementarNaoEncontradaError("Rota complementar não encontrada.")
        return resultado

    def inativar(self, rota_id: int, usuario_executor_id: int) -> dict:
        self._validar_id(usuario_executor_id, "usuario_executor_id")
        rota = self.buscar(rota_id)
        if not rota["ativo"]:
            raise RotaComplementarStatusInalteradoError(
                "Rota complementar já está inativa."
            )
        if self.repository.possui_agendamentos_futuros(rota_id):
            raise RotaComplementarComAgendamentosPendentesError(
                MENSAGEM_ROTA_COM_AGENDAMENTOS
            )
        resultado = self.repository.inativar(rota_id, usuario_executor_id)
        if not resultado:
            raise RotaComplementarNaoEncontradaError("Rota complementar não encontrada.")
        return resultado

    def reativar(self, rota_id: int, usuario_executor_id: int) -> dict:
        self._validar_id(usuario_executor_id, "usuario_executor_id")
        rota = self.buscar(rota_id)
        if rota["ativo"]:
            raise RotaComplementarStatusInalteradoError(
                "Rota complementar já está ativa."
            )
        if self.repository.principal_inativa(rota_id):
            raise RotaComplementarComPrincipalInativaError(
                MENSAGEM_PRINCIPAL_INATIVA_REATIVACAO
            )
        resultado = self.repository.reativar(rota_id, usuario_executor_id)
        if not resultado:
            raise RotaComplementarNaoEncontradaError("Rota complementar não encontrada.")
        return resultado

    @staticmethod
    def _validar_texto(valor: object, campo: str) -> str:
        rotulo = _ROTULOS[campo]
        if valor is None:
            raise RotaComplementarValidationError(campo, f"{rotulo} é obrigatório.")
        if not isinstance(valor, str) or contem_nul(valor):
            raise RotaComplementarValidationError(
                campo, f"{rotulo} deve ser um texto válido."
            )
        valor = valor.strip()
        if not valor:
            raise RotaComplementarValidationError(campo, f"{rotulo} é obrigatório.")
        if len(valor) > TAMANHO_MAXIMO:
            raise RotaComplementarValidationError(
                campo, f"{rotulo} deve ter no máximo {TAMANHO_MAXIMO} caracteres."
            )
        padrao, mensagem = _PADROES_TEXTO[campo]
        if not padrao.fullmatch(valor):
            raise RotaComplementarValidationError(campo, mensagem)
        return valor

    @staticmethod
    def _validar_horario(valor: object, campo: str) -> time:
        if valor is None:
            raise RotaComplementarValidationError(campo, f"{_ROTULOS[campo]} é obrigatório.")
        try:
            return interpretar_horario(valor)
        except ValueError as error:
            raise RotaComplementarValidationError(campo, str(error)) from error

    @staticmethod
    def _validar_ordem_horarios(saida: time, retorno: time) -> None:
        if retorno <= saida:
            raise RotaComplementarValidationError(
                "horario_retorno", MENSAGEM_ORDEM_HORARIOS
            )

    @staticmethod
    def _validar_principal(valor: object) -> int:
        if valor is None:
            raise RotaComplementarValidationError(
                "rota_principal_id", "Rota principal vinculada é obrigatória."
            )
        GerenciarRotasComplementaresUseCase._validar_id_principal(valor)
        return valor

    @staticmethod
    def _validar_id_principal(valor: object) -> None:
        if isinstance(valor, bool) or not isinstance(valor, int) or valor <= 0:
            raise RotaComplementarValidationError(
                "rota_principal_id", MENSAGEM_ID_PRINCIPAL_INVALIDO
            )

    @staticmethod
    def _validar_id(valor: object, campo: str) -> None:
        if isinstance(valor, bool) or not isinstance(valor, int) or valor <= 0:
            raise RotaComplementarValidationError(
                campo, "ID deve ser um número inteiro positivo."
            )
