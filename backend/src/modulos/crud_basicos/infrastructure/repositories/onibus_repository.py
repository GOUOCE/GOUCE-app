from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.modulos.crud_basicos.domain.entities.onibus import OnibusORM
from src.shared.infrastructure.audit_model import LogAuditoriaORM


class OnibusJaCadastradoError(ValueError):
    """Lançada quando o ônibus já está cadastrado (placa duplicada)."""
    pass


class OnibusJaAtivado(ValueError):
    """Lançada quando o ônibus já está ativado."""
    pass


class OnibusJaDesativado(ValueError):
    """Lançada quando o ônibus já está desativado."""
    pass


class OnibusNaoEncontradoError(ValueError):
    """Lançada quando o ônibus não é encontrado."""
    pass


class OnibusRepository:
    def __init__(self, session: Session):
        self.session = session

    def listar(
        self,
        ativo: Optional[bool] = None,
        limite: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> list[OnibusORM]:
        query = self.session.query(OnibusORM)
        if ativo is not None:
            query = query.filter(OnibusORM.ativo == ativo)
        query = query.order_by(
            OnibusORM.apelido_onibus.asc(),
            OnibusORM.placa_onibus.asc(),
        )
        if offset is not None:
            query = query.offset(offset)
        if limite is not None:
            query = query.limit(limite)
        return query.all()

    def buscar_por_placa(self, placa_onibus: str) -> Optional[OnibusORM]:
        placa_limpa = placa_onibus.strip().upper()
        return (
            self.session.query(OnibusORM)
            .filter(func.upper(func.trim(OnibusORM.placa_onibus)) == placa_limpa)
            .first()
        )

    def existe_por_placa(
        self,
        placa: str,
        ignorar_placa: Optional[str] = None,
    ) -> bool:
        placa_limpa = placa.strip().upper()
        query = self.session.query(OnibusORM.placa_onibus).filter(
            func.upper(func.trim(OnibusORM.placa_onibus)) == placa_limpa
        )
        if ignorar_placa is not None:
            query = query.filter(
                func.upper(func.trim(OnibusORM.placa_onibus)) != ignorar_placa.strip().upper()
            )
        return query.first() is not None

    def arquivo_existe(self, arquivo_id: str) -> bool:
        from src.modulos.arquivos.model.entities.arquivo import ArquivoORM
        return self.session.query(ArquivoORM.id).filter(ArquivoORM.id == arquivo_id).first() is not None

    def criar(
        self,
        placa: str,
        qtd_assentos: int,
        capacidade_maxima: int,
        apelido: Optional[str] = None,
        id_foto_onibus: Optional[str] = None,
    ) -> OnibusORM:
        placa_limpa = placa.strip().upper()
        apelido_limpo = apelido.strip() if apelido is not None else None
        if apelido_limpo == "":
            apelido_limpo = None

        if self.existe_por_placa(placa_limpa):
            raise OnibusJaCadastradoError("Este veículo já está registrado.")

        onibus = OnibusORM(
            placa_onibus=placa_limpa,
            qtd_assentos=qtd_assentos,
            capacidade_maxima=capacidade_maxima,
            apelido_onibus=apelido_limpo,
            ativo=True,
            id_foto_onibus=id_foto_onibus,
        )
        try:
            self.session.add(onibus)
            self.session.commit()
            self.session.refresh(onibus)
            return onibus
        except IntegrityError:
            self.session.rollback()
            raise OnibusJaCadastradoError("Este veículo já está registrado.")

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
    ) -> OnibusORM:
        onibus = self.buscar_por_placa(placa_onibus)
        if not onibus:
            raise OnibusNaoEncontradoError("Ônibus não encontrado.")

        placa_final = nova_placa.strip().upper() if nova_placa is not None else onibus.placa_onibus

        if self.existe_por_placa(placa_final, ignorar_placa=onibus.placa_onibus):
            raise OnibusJaCadastradoError("Este veículo já está registrado.")

        if nova_placa is not None:
            onibus.placa_onibus = placa_final
        if qtd_assentos is not None:
            onibus.qtd_assentos = qtd_assentos
        if capacidade_maxima is not None:
            onibus.capacidade_maxima = capacidade_maxima
        if apelido is not None:
            apelido_limpo = apelido.strip()
            onibus.apelido_onibus = apelido_limpo if apelido_limpo != "" else None
        if ativo is not None:
            onibus.ativo = ativo
        if remover_foto:
            onibus.id_foto_onibus = None
        elif id_foto_onibus is not None:
            onibus.id_foto_onibus = id_foto_onibus

        try:
            self.session.commit()
            self.session.refresh(onibus)
            return onibus
        except IntegrityError:
            self.session.rollback()
            raise OnibusJaCadastradoError("Este veículo já está registrado.")

    def ativar(
        self,
        placa_onibus: str,
        usuario_executor_id: Optional[int] = None,
    ) -> OnibusORM:
        onibus = self.buscar_por_placa(placa_onibus)
        if not onibus:
            raise OnibusNaoEncontradoError("Ônibus não encontrado.")

        if onibus.ativo:
            raise OnibusJaAtivado("Onibus já ativado.")

        onibus.ativo = True

        log = LogAuditoriaORM(
            usuario_id=usuario_executor_id,
            acao="ATIVAR",
            entidade="onibus",
            entidade_id=placa_onibus,
            valor_anterior="inativo",
            valor_novo="ativo",
            criado_em=datetime.now(timezone.utc),
        )
        self.session.add(log)
        self.session.commit()
        self.session.refresh(onibus)
        return onibus

    def inativar(
        self,
        placa_onibus: str,
        usuario_executor_id: Optional[int] = None,
    ) -> OnibusORM:
        onibus = self.buscar_por_placa(placa_onibus)
        if not onibus:
            raise OnibusNaoEncontradoError("Ônibus não encontrado.")

        if not onibus.ativo:
            raise OnibusJaDesativado("Onibus já desativado.")

        onibus.ativo = False

        log = LogAuditoriaORM(
            usuario_id=usuario_executor_id,
            acao="INATIVAR",
            entidade="onibus",
            entidade_id=placa_onibus,
            valor_anterior="ativo",
            valor_novo="inativo",
            criado_em=datetime.now(timezone.utc),
        )
        self.session.add(log)
        self.session.commit()
        self.session.refresh(onibus)
        return onibus
