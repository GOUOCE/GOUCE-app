from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.modulos.crud_basicos.domain.entities.onibus import OnibusORM
from src.modulos.arquivos.model.entities.arquivo import ArquivoORM
from src.shared.infrastructure.audit_model import LogAuditoriaORM


class OnibusJaCadastradoError(ValueError):
    pass


class OnibusJaAtivado(ValueError):
    pass


class OnibusJaDesativado(ValueError):
    pass


class OnibusNaoEncontradoError(ValueError):
    pass


def normalizar_placa(placa: str) -> str:
    return placa.strip().upper().replace('-', '')


def formatar_placa(placa: str) -> str:
    placa = placa.strip().upper().replace("-", "")
    return f"{placa[:3]}-{placa[3:]}"

OnibusORM.placa = property(lambda self: formatar_placa(self.placa_onibus))


class OnibusRepository:
    def __init__(self, session: Session):
        self.session = session

    def _coluna_placa_normalizada(self):
        return func.replace(func.upper(func.trim(OnibusORM.placa_onibus)), '-', '')

    def _tratar_integrity_error(self, erro: IntegrityError):
        self.session.rollback()
        sqlstate = getattr(erro.orig, 'sqlstate', None) or getattr(erro.orig, 'pgcode', None)
        if sqlstate == '23505':
            constraint = getattr(getattr(erro.orig, 'diag', None), 'constraint_name', None)
            if constraint in ('onibus_pkey', 'onibus_placa_onibus_key'):
                raise OnibusJaCadastradoError('Este veículo já está registrado.') from erro
        raise erro

    def listar(self, ativo: Optional[bool] = None, limite: Optional[int] = None, offset: Optional[int] = None) -> list[OnibusORM]:
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
        return (self.session.query(OnibusORM)
                .filter(self._coluna_placa_normalizada() == normalizar_placa(placa_onibus))
                .first())

    def existe_por_placa(self, placa: str, ignorar_placa: Optional[str] = None) -> bool:
        coluna = self._coluna_placa_normalizada()
        query = self.session.query(OnibusORM.placa_onibus).filter(coluna == normalizar_placa(placa))
        if ignorar_placa is not None:
            query = query.filter(coluna != normalizar_placa(ignorar_placa))
        return query.first() is not None

    def arquivo_existe(self, arquivo_id: str) -> bool:
        return self.session.query(ArquivoORM.id).filter(ArquivoORM.id == arquivo_id).first() is not None

    def criar(self, placa: str, qtd_assentos: int, capacidade_maxima: int,
              apelido: Optional[str] = None, id_foto_onibus: Optional[str] = None) -> OnibusORM:
        placa_limpa = normalizar_placa(placa)
        if self.existe_por_placa(placa_limpa):
            raise OnibusJaCadastradoError('Este veículo já está registrado.')
        onibus = OnibusORM(
            placa_onibus=placa_limpa,
            qtd_assentos=qtd_assentos,
            capacidade_maxima=capacidade_maxima,
            apelido_onibus=apelido.strip() or None if apelido is not None else None,
            ativo=True,
            id_foto_onibus=str(id_foto_onibus).strip() or None if id_foto_onibus is not None else None,
        )
        try:
            self.session.add(onibus)
            self.session.commit()
            self.session.refresh(onibus)
            return onibus
        except IntegrityError as erro:
            self._tratar_integrity_error(erro)

    def atualizar(self, placa_onibus: str, nova_placa: Optional[str] = None,
                 qtd_assentos: Optional[int] = None, capacidade_maxima: Optional[int] = None,
                 apelido: Optional[str] = None, ativo: Optional[bool] = None,
                 id_foto_onibus: Optional[str] = None, remover_foto: bool = False) -> OnibusORM:
        onibus = self.buscar_por_placa(placa_onibus)
        if onibus is None:
            raise OnibusNaoEncontradoError('Ônibus não encontrado.')
        placa_final = normalizar_placa(nova_placa) if nova_placa is not None else onibus.placa_onibus
        if self.existe_por_placa(placa_final, ignorar_placa=onibus.placa_onibus):
            raise OnibusJaCadastradoError('Este veículo já está registrado.')
        if nova_placa is not None:
            onibus.placa_onibus = placa_final
        if qtd_assentos is not None:
            onibus.qtd_assentos = qtd_assentos
        if capacidade_maxima is not None:
            onibus.capacidade_maxima = capacidade_maxima
        if apelido is not None:
            onibus.apelido_onibus = apelido.strip() or None
        if ativo is not None:
            onibus.ativo = ativo
        if remover_foto:
            onibus.id_foto_onibus = None
        elif id_foto_onibus is not None:
            onibus.id_foto_onibus = str(id_foto_onibus).strip() or None
        try:
            self.session.commit()
            self.session.refresh(onibus)
            return onibus
        except IntegrityError as erro:
            self._tratar_integrity_error(erro)

    def ativar(self, placa_onibus: str, usuario_executor_id: Optional[int] = None) -> OnibusORM:
        onibus = self.buscar_por_placa(placa_onibus)
        if onibus is None:
            raise OnibusNaoEncontradoError('Ônibus não encontrado.')
        if onibus.ativo:
            raise OnibusJaAtivado('Ônibus já ativado.')
        onibus.ativo = True
        log = LogAuditoriaORM(
            usuario_id=usuario_executor_id, acao='ATIVAR', entidade='onibus',
            entidade_id=onibus.placa_onibus, valor_anterior='inativo',
            valor_novo='ativo', criado_em=datetime.now(timezone.utc),
        )
        try:
            self.session.add(log)
            self.session.commit()
            self.session.refresh(onibus)
            return onibus
        except Exception:
            self.session.rollback()
            raise

    def inativar(self, placa_onibus: str, usuario_executor_id: Optional[int] = None) -> OnibusORM:
        onibus = self.buscar_por_placa(placa_onibus)
        if onibus is None:
            raise OnibusNaoEncontradoError('Ônibus não encontrado.')
        if not onibus.ativo:
            raise OnibusJaDesativado('Ônibus já desativado.')
        onibus.ativo = False
        log = LogAuditoriaORM(
            usuario_id=usuario_executor_id, acao='INATIVAR', entidade='onibus',
            entidade_id=onibus.placa_onibus, valor_anterior='ativo',
            valor_novo='inativo', criado_em=datetime.now(timezone.utc),
        )
        try:
            self.session.add(log)
            self.session.commit()
            self.session.refresh(onibus)
            return onibus
        except Exception:
            self.session.rollback()
            raise
