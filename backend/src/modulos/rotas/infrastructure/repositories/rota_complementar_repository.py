"""Persistência das rotas complementares.

Toda escrita (criar, editar, inativar, reativar) grava o log de auditoria na
mesma transação; qualquer falha desfaz a operação inteira. A rota principal é
lida com ``FOR UPDATE`` na criação, na troca de vínculo e na reativação, para
que a checagem "principal ativa" não corra contra uma escrita concorrente.
"""

import json
from datetime import time
from typing import Callable, Optional

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from src.modulos.rotas.model.entities.rota_complementar import RotaComplementarORM
from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM
from src.modulos.usuarios.model.entities.usuario import UsuarioORM  # noqa: F401
from src.shared.infrastructure.audit_model import LogAuditoriaORM

ENTIDADE_AUDITORIA = "rota_complementar"

MENSAGEM_PRINCIPAL_INATIVA_OU_INEXISTENTE = "Rota principal inativa ou inexistente."
MENSAGEM_PRINCIPAL_INATIVA_REATIVACAO = (
    "A rota principal vinculada está inativa. Reative-a ou altere o vínculo antes."
)


class RotaComplementarNomeEmUsoError(ValueError):
    """Indica que já existe outra rota complementar (ativa ou inativa) com o mesmo nome."""


class RotaComplementarReferenciaInvalidaError(ValueError):
    """Rota principal inexistente ou inativa informada para o vínculo."""

    def __init__(self, field: str, message: str):
        self.field = field
        super().__init__(message)


class RotaComplementarComPrincipalInativaError(ValueError):
    """Impede a reativação de rota complementar cuja rota principal está inativa."""


class RotaComplementarRepository:
    """Repository SQLAlchemy das rotas complementares."""

    def __init__(
        self,
        session: Session,
        agendamentos_futuros_checker: Optional[Callable[[int], bool]] = None,
    ):
        self.session = session
        self._agendamentos_futuros_checker = agendamentos_futuros_checker

    # ------------------------------------------------------------ leitura
    def listar(
        self,
        ativo: bool | None = None,
        nome: str | None = None,
        rota_principal_id: int | None = None,
    ) -> list[dict]:
        query = self._query_com_principal()
        if ativo is not None:
            query = query.filter(RotaComplementarORM.ativo == ativo)
        if rota_principal_id is not None:
            query = query.filter(
                RotaComplementarORM.rota_principal_id == rota_principal_id
            )
        if nome:
            query = query.filter(
                func.lower(RotaComplementarORM.nome).contains(
                    nome.lower(), autoescape=True
                )
            )
        rotas = query.order_by(
            func.lower(RotaComplementarORM.nome), RotaComplementarORM.id
        ).all()
        return [self._serializar(rota) for rota in rotas]

    def buscar(self, rota_id: int) -> dict | None:
        rota = self._buscar_orm(rota_id)
        return self._serializar(rota) if rota else None

    def listar_opcoes(self) -> dict:
        """Somente rotas principais ativas, para a lista de seleção."""
        principais = (
            self.session.query(RotaPrincipalORM)
            .filter(RotaPrincipalORM.ativo.is_(True))
            .order_by(func.lower(RotaPrincipalORM.nome), RotaPrincipalORM.id)
            .all()
        )
        return {
            "rotas_principais": [
                {
                    "id": p.id,
                    "nome": p.nome,
                    "horario_saida": p.horario_saida.strftime("%H:%M"),
                    "horario_retorno": p.horario_retorno.strftime("%H:%M"),
                }
                for p in principais
            ]
        }

    def nome_em_uso(self, nome: str, ignorar_rota_id: int | None = None) -> bool:
        query = self.session.query(RotaComplementarORM.id).filter(
            func.lower(func.trim(RotaComplementarORM.nome))
            == func.lower(func.trim(nome))
        )
        if ignorar_rota_id is not None:
            query = query.filter(RotaComplementarORM.id != ignorar_rota_id)
        return query.first() is not None

    def principal_inativa(self, rota_id: int) -> bool:
        """Indica se a rota principal vinculada à complementar está inativa."""
        rota = self._buscar_orm(rota_id)
        return rota is not None and not rota.rota_principal.ativo

    def possui_agendamentos_futuros(self, rota_id: int) -> bool:
        """Indica se há alunos agendados para viagens futuras nesta rota.

        TODO(HU-013): a entidade de agendamentos de alunos (criada pela HU-013 -
        Agendamento de Transporte, EP-004, conforme docs/requisitos.md) ainda
        não existe. Quando ela existir, substituir este retorno por uma consulta
        real aos agendamentos da rota com data posterior a hoje (ou injetar essa
        consulta via ``agendamentos_futuros_checker``). Até lá a verificação
        "falha aberto": sem checker injetado, nenhuma inativação é bloqueada.
        """
        if self._agendamentos_futuros_checker is not None:
            return bool(self._agendamentos_futuros_checker(rota_id))
        return False

    # ------------------------------------------------------------ escrita
    def criar(
        self,
        nome: str,
        horario_saida: time,
        ponto_conexao: str,
        rota_principal_id: int,
        usuario_executor_id: int,
    ) -> dict:
        try:
            if self.nome_em_uso(nome):
                raise RotaComplementarNomeEmUsoError(
                    "Já existe uma rota complementar com este nome."
                )

            principal = self._carregar_principal_ativa(rota_principal_id)
            rota = RotaComplementarORM(
                nome=nome.strip(),
                horario_saida=horario_saida,
                ponto_conexao=ponto_conexao.strip(),
                rota_principal=principal,
                ativo=True,
            )
            self.session.add(rota)
            self.session.flush()
            self._registrar(
                usuario_executor_id,
                "CRIAR",
                rota.id,
                None,
                self._snapshot(rota),
            )
            self.session.commit()
            self.session.refresh(rota)
            return self._serializar(rota)
        except IntegrityError as error:
            self.session.rollback()
            if self.nome_em_uso(nome):
                raise RotaComplementarNomeEmUsoError(
                    "Já existe uma rota complementar com este nome."
                ) from error
            raise
        except Exception:
            self.session.rollback()
            raise

    def atualizar(
        self,
        rota_id: int,
        campos: dict,
        usuario_executor_id: int,
    ) -> dict | None:
        """Aplica somente as chaves presentes em ``campos``.

        Manter a rota principal atual é sempre permitido, mesmo que ela tenha
        sido inativada depois; só um vínculo novo exige uma principal ativa.
        """
        nome = campos.get("nome")
        try:
            rota = self._buscar_orm(rota_id)
            if rota is None:
                return None
            antes = self._snapshot(rota)

            if "nome" in campos and self.nome_em_uso(nome, ignorar_rota_id=rota_id):
                raise RotaComplementarNomeEmUsoError(
                    "Já existe uma rota complementar com este nome."
                )

            nova_principal = None
            if (
                "rota_principal_id" in campos
                and campos["rota_principal_id"] != rota.rota_principal_id
            ):
                nova_principal = self._carregar_principal_ativa(
                    campos["rota_principal_id"]
                )

            if "nome" in campos:
                rota.nome = nome.strip()
            if "horario_saida" in campos:
                rota.horario_saida = campos["horario_saida"]
            if "ponto_conexao" in campos:
                rota.ponto_conexao = campos["ponto_conexao"].strip()
            if nova_principal is not None:
                rota.rota_principal = nova_principal

            depois = self._snapshot(rota)
            if depois != antes:
                self._registrar(usuario_executor_id, "EDITAR", rota_id, antes, depois)
            self.session.commit()
            self.session.refresh(rota)
            return self._serializar(rota)
        except IntegrityError as error:
            self.session.rollback()
            if nome is not None and self.nome_em_uso(nome, ignorar_rota_id=rota_id):
                raise RotaComplementarNomeEmUsoError(
                    "Já existe uma rota complementar com este nome."
                ) from error
            raise
        except Exception:
            self.session.rollback()
            raise

    def inativar(self, rota_id: int, usuario_executor_id: int) -> dict | None:
        return self._alterar_status(rota_id, usuario_executor_id, False, "INATIVAR")

    def reativar(self, rota_id: int, usuario_executor_id: int) -> dict | None:
        return self._alterar_status(rota_id, usuario_executor_id, True, "REATIVAR")

    # ------------------------------------------------------------ internos
    def _alterar_status(
        self,
        rota_id: int,
        usuario_executor_id: int,
        ativo: bool,
        acao: str,
    ) -> dict | None:
        try:
            rota = self._buscar_orm(rota_id)
            if rota is None:
                return None
            estado_anterior = bool(rota.ativo)
            if estado_anterior == ativo:
                return self._serializar(rota)

            if ativo and not self._ler_principal_para_atualizar(
                rota.rota_principal_id
            ).ativo:
                raise RotaComplementarComPrincipalInativaError(
                    MENSAGEM_PRINCIPAL_INATIVA_REATIVACAO
                )

            rota.ativo = ativo
            self._registrar(
                usuario_executor_id,
                acao,
                rota_id,
                "ativo" if estado_anterior else "inativo",
                "ativo" if ativo else "inativo",
            )
            self.session.commit()
            self.session.refresh(rota)
            return self._serializar(rota)
        except Exception:
            self.session.rollback()
            raise

    def _registrar(
        self,
        usuario_id: int,
        acao: str,
        rota_id: int,
        valor_anterior: str | None,
        valor_novo: str | None,
    ) -> None:
        self.session.add(
            LogAuditoriaORM(
                usuario_id=usuario_id,
                acao=acao,
                entidade=ENTIDADE_AUDITORIA,
                entidade_id=rota_id,
                valor_anterior=valor_anterior,
                valor_novo=valor_novo,
            )
        )

    def _query_com_principal(self):
        return self.session.query(RotaComplementarORM).options(
            joinedload(RotaComplementarORM.rota_principal)
        )

    def _buscar_orm(self, rota_id: int) -> RotaComplementarORM | None:
        return (
            self._query_com_principal()
            .filter(RotaComplementarORM.id == rota_id)
            .first()
        )

    def _ler_principal_para_atualizar(self, rota_principal_id: int):
        """Lê a rota principal travando a linha até o fim da transação."""
        return (
            self.session.query(RotaPrincipalORM)
            .filter(RotaPrincipalORM.id == rota_principal_id)
            .with_for_update()
            .populate_existing()
            .first()
        )

    def _carregar_principal_ativa(self, rota_principal_id: int) -> RotaPrincipalORM:
        principal = self._ler_principal_para_atualizar(rota_principal_id)
        if principal is None or not principal.ativo:
            raise RotaComplementarReferenciaInvalidaError(
                "rota_principal_id", MENSAGEM_PRINCIPAL_INATIVA_OU_INEXISTENTE
            )
        return principal

    @staticmethod
    def _snapshot(rota: RotaComplementarORM) -> str:
        return json.dumps(
            {
                "nome": rota.nome,
                "horario_saida": rota.horario_saida.strftime("%H:%M"),
                "ponto_conexao": rota.ponto_conexao,
                "rota_principal_id": rota.rota_principal.id,
                "ativo": bool(rota.ativo),
            },
            ensure_ascii=False,
            sort_keys=True,
        )

    @staticmethod
    def _serializar(rota: RotaComplementarORM) -> dict:
        return {
            "id": rota.id,
            "nome": rota.nome,
            "horario_saida": rota.horario_saida.strftime("%H:%M"),
            "ponto_conexao": rota.ponto_conexao,
            "ativo": bool(rota.ativo),
            "rota_principal": {
                "id": rota.rota_principal.id,
                "nome": rota.rota_principal.nome,
                "ativo": bool(rota.rota_principal.ativo),
            },
        }
