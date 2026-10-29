"""Persistência dos ônibus.

Toda escrita (criar, editar, inativar, reativar) grava o log de auditoria na
mesma transação; qualquer falha desfaz a operação inteira. A mudança de
status feita via ``atualizar(ativo=...)`` passa pelas mesmas regras e pela
mesma auditoria de ``ativar``/``inativar`` (ver ``_aplicar_status``).
"""

import json
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.modulos.crud_basicos.domain.entities.onibus import OnibusORM
from src.modulos.arquivos.model.entities.arquivo import ArquivoORM
from src.shared.infrastructure.audit_model import LogAuditoriaORM

ENTIDADE_AUDITORIA = "onibus"


class OnibusJaCadastradoError(ValueError):
    pass


class OnibusJaAtivado(ValueError):
    pass


class OnibusJaDesativado(ValueError):
    pass


class OnibusNaoEncontradoError(ValueError):
    pass


def normalizar_placa(placa: str) -> str:
    return placa.strip().upper().replace("-", "")


def formatar_placa(placa: str) -> str:
    placa = placa.strip().upper().replace("-", "")
    return f"{placa[:3]}-{placa[3:]}"


OnibusORM.placa = property(lambda self: formatar_placa(self.placa_onibus))


def _limpar_texto(valor) -> Optional[str]:
    if valor is None:
        return None
    return str(valor).strip() or None


class OnibusRepository:
    def __init__(self, session: Session):
        self.session = session

    def _coluna_placa_normalizada(self):
        return func.replace(func.upper(func.trim(OnibusORM.placa_onibus)), "-", "")

    def _tratar_integrity_error(self, erro: IntegrityError):
        self.session.rollback()
        sqlstate = getattr(erro.orig, "sqlstate", None) or getattr(erro.orig, "pgcode", None)
        if sqlstate == "23505":
            constraint = getattr(getattr(erro.orig, "diag", None), "constraint_name", None)
            if constraint in ("onibus_pkey", "onibus_placa_onibus_key"):
                raise OnibusJaCadastradoError("Este veículo já está registrado.") from erro
        raise erro

    def listar(
        self,
        ativo: Optional[bool] = None,
        limite: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> list[OnibusORM]:
        query = self.session.query(OnibusORM)
        if ativo is not None:
            query = query.filter(OnibusORM.ativo == ativo)
        query = query.order_by(OnibusORM.apelido_onibus.asc(), OnibusORM.placa_onibus.asc())
        if offset is not None:
            query = query.offset(offset)
        if limite is not None:
            query = query.limit(limite)
        return query.all()

    def buscar_por_placa(self, placa_onibus: str) -> Optional[OnibusORM]:
        return (
            self.session.query(OnibusORM)
            .filter(self._coluna_placa_normalizada() == normalizar_placa(placa_onibus))
            .first()
        )

    def existe_por_placa(self, placa: str, ignorar_placa: Optional[str] = None) -> bool:
        coluna = self._coluna_placa_normalizada()
        query = self.session.query(OnibusORM.placa_onibus).filter(
            coluna == normalizar_placa(placa)
        )
        if ignorar_placa is not None:
            query = query.filter(coluna != normalizar_placa(ignorar_placa))
        return query.first() is not None

    def arquivo_existe(self, arquivo_id: str) -> bool:
        return (
            self.session.query(ArquivoORM.id).filter(ArquivoORM.id == arquivo_id).first()
            is not None
        )

    def criar(
        self,
        placa: str,
        qtd_assentos: int,
        capacidade_maxima: int,
        apelido: Optional[str] = None,
        id_foto_onibus: Optional[str] = None,
        usuario_executor_id: Optional[int] = None,
    ) -> OnibusORM:
        placa_limpa = normalizar_placa(placa)
        if self.existe_por_placa(placa_limpa):
            raise OnibusJaCadastradoError("Este veículo já está registrado.")
        onibus = OnibusORM(
            placa_onibus=placa_limpa,
            qtd_assentos=qtd_assentos,
            capacidade_maxima=capacidade_maxima,
            apelido_onibus=_limpar_texto(apelido),
            ativo=True,
            id_foto_onibus=_limpar_texto(id_foto_onibus),
        )
        try:
            self.session.add(onibus)
            self.session.flush()
            self._registrar(
                usuario_executor_id,
                "CRIAR",
                onibus.placa_onibus,
                None,
                self._snapshot(onibus),
            )
            self.session.commit()
            self.session.refresh(onibus)
            return onibus
        except IntegrityError as erro:
            self._tratar_integrity_error(erro)
        except Exception:
            self.session.rollback()
            raise

    def atualizar(
        self,
        placa_onibus: str,
        nova_placa: Optional[str] = None,
        qtd_assentos: Optional[int] = None,
        capacidade_maxima: Optional[int] = None,
        apelido: Optional[str] = None,
        ativo: Optional[bool] = None,
        id_foto_onibus: Optional[str] = None,
        remover_foto: bool = False,
        usuario_executor_id: Optional[int] = None,
    ) -> OnibusORM:
        
        try:
            onibus = self._buscar_para_atualizar(placa_onibus)
            if onibus is None:
                raise OnibusNaoEncontradoError("Ônibus não encontrado.")

            placa_final = (
                normalizar_placa(nova_placa)
                if nova_placa is not None
                else onibus.placa_onibus
            )
            if self.existe_por_placa(placa_final, ignorar_placa=onibus.placa_onibus):
                raise OnibusJaCadastradoError("Este veículo já está registrado.")

            antes = self._snapshot(onibus)

            if nova_placa is not None:
                onibus.placa_onibus = placa_final
            if qtd_assentos is not None:
                onibus.qtd_assentos = qtd_assentos
            if capacidade_maxima is not None:
                onibus.capacidade_maxima = capacidade_maxima
            if apelido is not None:
                onibus.apelido_onibus = _limpar_texto(apelido)
            if remover_foto:
                onibus.id_foto_onibus = None
            elif id_foto_onibus is not None:
                onibus.id_foto_onibus = _limpar_texto(id_foto_onibus)

            depois = self._snapshot(onibus)
            if depois != antes:
                self._registrar(
                    usuario_executor_id, "EDITAR", onibus.placa_onibus, antes, depois
                )

            if ativo is not None and bool(onibus.ativo) != ativo:
                self._aplicar_status(onibus, ativo, usuario_executor_id)

            self.session.commit()
            self.session.refresh(onibus)
            return onibus
        except IntegrityError as erro:
            self._tratar_integrity_error(erro)
        except Exception:
            self.session.rollback()
            raise

    def ativar(
        self, placa_onibus: str, usuario_executor_id: Optional[int] = None
    ) -> OnibusORM:
        return self._alterar_status(placa_onibus, True, usuario_executor_id)

    def inativar(
        self, placa_onibus: str, usuario_executor_id: Optional[int] = None
    ) -> OnibusORM:
        return self._alterar_status(placa_onibus, False, usuario_executor_id)

    def _alterar_status(
        self, placa_onibus: str, ativo: bool, usuario_executor_id: Optional[int]
    ) -> OnibusORM:
        try:
            onibus = self._buscar_para_atualizar(placa_onibus)
            if onibus is None:
                raise OnibusNaoEncontradoError("Ônibus não encontrado.")
            if bool(onibus.ativo) == ativo:
                raise (
                    OnibusJaAtivado("Ônibus já ativado.")
                    if ativo
                    else OnibusJaDesativado("Ônibus já desativado.")
                )
            self._aplicar_status(onibus, ativo, usuario_executor_id)
            self.session.commit()
            self.session.refresh(onibus)
            return onibus
        except Exception:
            self.session.rollback()
            raise

    def _aplicar_status(
        self, onibus: OnibusORM, ativo: bool, usuario_executor_id: Optional[int]
    ) -> None:

        anterior = "ativo" if onibus.ativo else "inativo"
        onibus.ativo = ativo
        self._registrar(
            usuario_executor_id,
            "ATIVAR" if ativo else "INATIVAR",
            onibus.placa_onibus,
            anterior,
            "ativo" if ativo else "inativo",
        )

    def _buscar_para_atualizar(self, placa_onibus: str) -> Optional[OnibusORM]:
        return (
            self.session.query(OnibusORM)
            .filter(self._coluna_placa_normalizada() == normalizar_placa(placa_onibus))
            .with_for_update()
            .populate_existing()
            .first()
        )

    def _registrar(
        self,
        usuario_id: Optional[int],
        acao: str,
        placa: str,
        valor_anterior: Optional[str],
        valor_novo: Optional[str],
    ) -> None:
        self.session.add(
            LogAuditoriaORM(
                usuario_id=usuario_id,
                acao=acao,
                entidade=ENTIDADE_AUDITORIA,
                entidade_id=placa,
                valor_anterior=valor_anterior,
                valor_novo=valor_novo,
                criado_em=datetime.now(timezone.utc),
            )
        )

    @staticmethod
    def _snapshot(onibus: OnibusORM) -> str:
        return json.dumps(
            {
                "placa": onibus.placa_onibus,
                "qtd_assentos": onibus.qtd_assentos,
                "capacidade_maxima": onibus.capacidade_maxima,
                "apelido": onibus.apelido_onibus,
                "id_foto_onibus": onibus.id_foto_onibus,
            },
            ensure_ascii=False,
            sort_keys=True,
        )