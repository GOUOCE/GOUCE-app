import json
from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from src.modulos.agendamentos.model.entities.agendamento import AgendamentoORM
from src.modulos.agendamentos.model.entities.feriado import FeriadoORM
from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
from src.modulos.crud_basicos.domain.entities.ponto_de_parada import PontoDeParadaORM
from src.modulos.rotas.model.entities.rota_complementar import RotaComplementarORM
from src.modulos.rotas.model.entities.rota_principal import (
    RotaPrincipalORM,
    rota_principal_bairro,
    rota_principal_faculdade_ida,
    rota_principal_faculdade_volta,
)
from src.shared.infrastructure.audit_model import LogAuditoriaORM


class AgendamentoRepository:
    def __init__(self, session: Session):
        self.session = session

    def holiday(self, target: date):
        return self.session.query(FeriadoORM).filter(FeriadoORM.data == target).first()

    def active_for_day(self, aluno_id: int, target: date, exclude_id=None):
        query = self.session.query(AgendamentoORM).filter(
            AgendamentoORM.aluno_id == aluno_id,
            AgendamentoORM.data == target,
            AgendamentoORM.status == "ATIVO",
        )
        if exclude_id is not None:
            query = query.filter(AgendamentoORM.id != exclude_id)
        return query.first()

    def active_from(self, aluno_id: int, target: date):
        return (
            self.session.query(AgendamentoORM.id)
            .filter(
                AgendamentoORM.aluno_id == aluno_id,
                AgendamentoORM.status == "ATIVO",
                AgendamentoORM.data >= target,
            )
            .with_for_update()
            .all()
        )

    def reference(self, model, value):
        return self.session.get(model, value)

    def route_for(self, point, faculty, direction, route_id=None):
        route_faculty = (
            rota_principal_faculdade_ida
            if direction == "ida"
            else rota_principal_faculdade_volta
        )
        query = (
            self.session.query(RotaPrincipalORM)
            .join(route_faculty, route_faculty.c.rota_id == RotaPrincipalORM.id)
            .join(rota_principal_bairro, rota_principal_bairro.c.rota_id == RotaPrincipalORM.id)
            .filter(
                RotaPrincipalORM.ativo.is_(True),
                route_faculty.c.faculdade_id == faculty.id_faculdade,
                rota_principal_bairro.c.bairro_id == point.bairro_id,
            )
        )
        if route_id is not None:
            query = query.filter(RotaPrincipalORM.id == route_id)
        return query.first()

    def active_complementary(self, complementary_id: int):
        return self.session.get(RotaComplementarORM, complementary_id)

    def bookings_between(self, aluno_id: int, start: date, end: date):
        return (
            self.session.query(AgendamentoORM)
            .filter(
                AgendamentoORM.aluno_id == aluno_id,
                AgendamentoORM.status == "ATIVO",
                AgendamentoORM.data.between(start, end),
            )
            .all()
        )

    def has_active_route(self):
        return self.session.query(RotaPrincipalORM.id).filter(
            RotaPrincipalORM.ativo.is_(True)
        ).first() is not None

    def active_routes(self):
        return self.session.query(RotaPrincipalORM).filter(
            RotaPrincipalORM.ativo.is_(True)
        ).order_by(RotaPrincipalORM.id).all()

    def get_active(self, aluno_id: int, item_id: int):
        return self.session.query(AgendamentoORM).filter_by(
            id=item_id, aluno_id=aluno_id, status="ATIVO"
        ).first()

    def create(self, aluno_id: int, data):
        item = AgendamentoORM(**data.model_dump(), aluno_id=aluno_id)
        self.session.add(item)
        self.session.flush()
        self.session.add(
            LogAuditoriaORM(
                usuario_id=aluno_id,
                acao="CRIAR",
                entidade="agendamento",
                entidade_id=item.id,
                valor_novo=json.dumps(data.model_dump(), default=str),
            )
        )
        self.session.commit()
        self.session.refresh(item)
        return item

    def update(self, aluno_id: int, item, data):
        before = {key: getattr(item, key) for key in data.model_dump()}
        for key, value in data.model_dump().items():
            setattr(item, key, value)
        self.session.add(
            LogAuditoriaORM(
                usuario_id=aluno_id,
                acao="EDITAR",
                entidade="agendamento",
                entidade_id=item.id,
                valor_anterior=json.dumps(before, default=str),
                valor_novo=json.dumps(data.model_dump(), default=str),
            )
        )
        self.session.commit()
        self.session.refresh(item)
        return item

    def list_active_from(self, aluno_id: int, target: date):
        return (
            self.session.query(AgendamentoORM)
            .filter(
                AgendamentoORM.aluno_id == aluno_id,
                AgendamentoORM.status == "ATIVO",
                AgendamentoORM.data >= target,
            )
            .order_by(AgendamentoORM.data)
            .all()
        )

    def count_active_from(self, aluno_id: int, target: date) -> int:
        return len(self.list_active_from(aluno_id, target))

    def get_by_id(self, aluno_id: int, item_id: int):
        """Agendamento ATIVO do aluno (qualquer data, inclusive passada)."""
        return self.get_active(aluno_id, item_id)

    def get_active_by_date(self, aluno_id: int, target: date):
        """Agendamento ATIVO do aluno numa data (qualquer data, inclusive passada).

        No máximo um resultado: ``uq_agendamento_aluno_data_ativo`` garante um
        único agendamento ATIVO por (aluno_id, data).
        """
        return self.session.query(AgendamentoORM).filter_by(
            aluno_id=aluno_id, data=target, status="ATIVO"
        ).first()

    def reference_name(self, model, value, attr: str):
        if value is None:
            return None
        item = self.session.get(model, value)
        return getattr(item, attr, None) if item is not None else None

    def remove_allocations(self, agendamento) -> None:
        """Gancho para remover a alocação veículo/dia do agendamento.

        No-op até a tabela de alocação (HU-016/HU-018) existir. Quando existir,
        deve apagar/atualizar a alocação vinculada usando a mesma sessão, sem
        commit próprio, para que o cancelamento permaneça atômico (RNF-012).
        """
        return None

    def cancel(self, aluno_id: int, item):
        """Cancelamento lógico em transação única (sem cancelamento parcial)."""
        try:
            before = {
                "data": item.data,
                "usa_ida": item.usa_ida,
                "usa_volta": item.usa_volta,
                "status": item.status,
            }
            self.remove_allocations(item)
            item.status = "CANCELADO"
            item.cancelled_at = datetime.now(timezone.utc)
            self.session.add(
                LogAuditoriaORM(
                    usuario_id=aluno_id,
                    acao="CANCELAR",
                    entidade="agendamento",
                    entidade_id=item.id,
                    valor_anterior=json.dumps(before, default=str),
                    valor_novo=json.dumps({"status": "CANCELADO"}),
                )
            )
            self.session.commit()
        except Exception:
            self.session.rollback()
            raise
        return item

    def rollback(self):
        self.session.rollback()
