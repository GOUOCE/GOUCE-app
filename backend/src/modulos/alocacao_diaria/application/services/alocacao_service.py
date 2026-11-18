import json
from datetime import date

from sqlalchemy.orm import Session

from src.modulos.agendamentos.model.entities.agendamento import AgendamentoORM
from src.modulos.crud_basicos.domain.entities.onibus import OnibusORM
from src.modulos.motoristas.model.entities.motorista import MotoristaORM
from src.modulos.rotas.model.entities.rota_complementar import RotaComplementarORM
from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM
from src.modulos.alocacao_diaria.application.dtos.alocacao_dto import DistribuicaoRequestDTO
from src.modulos.alocacao_diaria.application.services.distribuicao import (
    OnibusDisponivel,
    Passageiro,
    distribuir_alunos,
)
from src.modulos.alocacao_diaria.model.entities.alocacao import (
    AlocacaoAlunoORM,
    AlocacaoDiariaORM,
)
from src.shared.infrastructure.audit_model import LogAuditoriaORM


class DistribuicaoError(ValueError):
    def __init__(self, message: str, status_code: int = 422):
        self.status_code = status_code
        super().__init__(message)


class AlocacaoService:
    def __init__(self, session: Session):
        self.session = session

    def preview(self, target: date) -> dict:
        demanda = self._demanda(target)
        return {"data": target.isoformat(), **distribuir_alunos(demanda, self._buses())}

    def persist(
        self,
        payload: DistribuicaoRequestDTO,
        usuario_executor_id: int | None = None,
    ) -> dict:
        excedentes_globais: list[dict] = []
        if payload.modo == "automatico":
            preview = self.preview(payload.data)
            alocacoes = preview["alocacoes"]
            excedentes_globais = preview["excedentes_globais"]
            self._validar_payload(payload.data, alocacoes)
        else:
            if not payload.alocacoes:
                raise DistribuicaoError("A lista de alocações não pode ser vazia.")
            self._demanda(payload.data)
            alocacoes = [item.model_dump() for item in payload.alocacoes]
            self._validar_payload(payload.data, alocacoes)

        try:
            self._persistir(payload.data, alocacoes, usuario_executor_id)
            self.session.commit()
        except DistribuicaoError:
            self.session.rollback()
            raise
        except Exception:
            self.session.rollback()
            raise
        return {
            "mensagem": (
                "Escala de motoristas confirmada com sucesso"
                if payload.modo == "manual"
                else "Distribuição realizada com sucesso"
            ),
            "data": payload.data.isoformat(),
            "status_logistico": "DISTRIBUIDO",
            "alocacoes": alocacoes,
            "excedentes_globais": excedentes_globais,
        }

    def _buses(self) -> list[OnibusDisponivel]:
        buses = self.session.query(OnibusORM).filter(OnibusORM.ativo.is_(True)).all()
        drivers = (
            self.session.query(MotoristaORM)
            .filter(MotoristaORM.ativo.is_(True))
            .order_by(MotoristaORM.id)
            .all()
        )
        if not drivers and buses:
            raise DistribuicaoError("Não há motoristas ativos disponíveis.")
        return [
            OnibusDisponivel(
                onibus_id=bus.placa_onibus,
                assentos=bus.qtd_assentos,
                em_pe=bus.capacidade_maxima,
                motorista_id=drivers[index % len(drivers)].id,
            )
            for index, bus in enumerate(buses[: len(drivers)])
        ]

    def _demanda(self, target: date):
        bookings = (
            self.session.query(AgendamentoORM)
            .filter(AgendamentoORM.data == target, AgendamentoORM.status == "ATIVO")
            .all()
        )
        routes = self.session.query(RotaPrincipalORM).filter(RotaPrincipalORM.ativo.is_(True)).all()
        complementary = {
            item.id: item.rota_principal_id
            for item in self.session.query(RotaComplementarORM).filter(
                RotaComplementarORM.ativo.is_(True)
            )
        }
        demand: dict[tuple[int, str], list[Passageiro]] = {}
        for booking in bookings:
            for turno, enabled in (("ida", booking.usa_ida), ("volta", booking.usa_volta)):
                if not enabled:
                    continue
                route_id = self._route_for(booking, turno, routes, complementary)
                if route_id is None:
                    raise DistribuicaoError(
                        f"Não foi encontrada rota ativa para o agendamento {booking.id} ({turno})."
                    )
                passenger = Passageiro(booking.id, turno)
                demand.setdefault((route_id, turno), []).append(passenger)
        return demand

    @staticmethod
    def _route_for(booking, turno, routes, complementary):
        complementary_id = (
            booking.rota_complementar_ida_id
            if turno == "ida"
            else booking.rota_complementar_volta_id
        )
        if complementary_id:
            if complementary_id in complementary:
                return complementary[complementary_id]
        faculty_id = booking.ies_destino_id if turno == "ida" else booking.ies_origem_id
        for route in routes:
            faculties = route.faculdades_ida if turno == "ida" else route.faculdades_volta
            if faculty_id in {faculty.id_faculdade for faculty in faculties}:
                return route.id
        return None

    def _validar_payload(self, target: date, alocacoes: list[dict]) -> None:
        active_bookings = {
            booking.id: booking
            for booking in self.session.query(AgendamentoORM).filter(
                AgendamentoORM.data == target, AgendamentoORM.status == "ATIVO"
            )
        }
        routes = {
            route.id: route
            for route in self.session.query(RotaPrincipalORM).filter(RotaPrincipalORM.ativo.is_(True))
        }
        complementary = {
            item.id: item.rota_principal_id
            for item in self.session.query(RotaComplementarORM).filter(RotaComplementarORM.ativo.is_(True))
        }
        buses = {
            bus.placa_onibus: bus
            for bus in self.session.query(OnibusORM).filter(OnibusORM.ativo.is_(True))
        }
        drivers = {
            driver.id
            for driver in self.session.query(MotoristaORM).filter(MotoristaORM.ativo.is_(True))
        }
        used_buses: set[tuple[str, str]] = set()
        used_drivers: set[tuple[int, str]] = set()
        seen_students: set[tuple[int, str]] = set()
        for index, allocation in enumerate(alocacoes):
            prefix = f"alocação {index}"
            bus_id, turno = allocation.get("onibus_id"), allocation.get("turno", "ida")
            if bus_id not in buses:
                raise DistribuicaoError(f"{prefix}: ônibus {bus_id} inexistente ou inativo.")
            if allocation.get("rota_id") not in routes:
                raise DistribuicaoError(f"{prefix}: rota inexistente ou inativa.")
            if allocation.get("motorista_id") not in drivers:
                raise DistribuicaoError(f"{prefix}: motorista inexistente ou inativo.")
            if (bus_id, turno) in used_buses:
                raise DistribuicaoError(f"{prefix}: ônibus {bus_id} conflitante no turno {turno}.", 409)
            if (allocation["motorista_id"], turno) in used_drivers:
                raise DistribuicaoError(
                    "Este motorista já está escalado para outra rota neste horário.",
                    409,
                )
            used_buses.add((bus_id, turno))
            used_drivers.add((allocation["motorista_id"], turno))
            bus = buses[bus_id]
            if len(allocation.get("alunos", [])) > bus.qtd_assentos + bus.capacidade_maxima:
                raise DistribuicaoError(f"{prefix}: capacidade total do ônibus excedida.")
            sentados = sum(item["tipo_lugar"] == "sentado" for item in allocation.get("alunos", []))
            em_pe = sum(item["tipo_lugar"] == "em_pe" for item in allocation.get("alunos", []))
            if sentados > bus.qtd_assentos or em_pe > bus.capacidade_maxima:
                raise DistribuicaoError(f"{prefix}: capacidade de assentos ou em pé excedida.")
            for student in allocation.get("alunos", []):
                key = (student["agendamento_id"], turno)
                booking = active_bookings.get(student["agendamento_id"])
                if booking is None:
                    raise DistribuicaoError(
                        f"{prefix}: agendamento {student['agendamento_id']} não está ativo nessa data."
                    )
                if not getattr(booking, f"usa_{turno}"):
                    raise DistribuicaoError(f"{prefix}: agendamento {booking.id} não usa o turno {turno}.")
                expected_route = self._route_for(booking, turno, list(routes.values()), complementary)
                if expected_route is not None and allocation["rota_id"] != expected_route:
                    raise DistribuicaoError(
                        f"{prefix}: agendamento {booking.id} não pertence à rota {allocation['rota_id']}."
                    )
                if key in seen_students:
                    raise DistribuicaoError(f"{prefix}: agendamento {booking.id} alocado mais de uma vez.")
                seen_students.add(key)

    def _persistir(
        self,
        target: date,
        alocacoes: list[dict],
        usuario_executor_id: int | None = None,
    ) -> None:
        old = self.session.query(AlocacaoDiariaORM).filter(AlocacaoDiariaORM.data == target).all()
        old_by_key = {
            (item.rota_id, item.turno): self._snapshot(item)
            for item in old
        }
        for item in old:
            self.session.delete(item)
        self.session.flush()
        persisted: list[AlocacaoDiariaORM] = []
        for allocation in alocacoes:
            entity = AlocacaoDiariaORM(
                rota_id=allocation["rota_id"],
                onibus_id=allocation["onibus_id"],
                motorista_id=allocation["motorista_id"],
                data=target,
                turno=allocation.get("turno", "ida"),
            )
            entity.alunos = [
                AlocacaoAlunoORM(
                    agendamento_id=student["agendamento_id"],
                    turno=allocation.get("turno", "ida"),
                    tipo_lugar=student["tipo_lugar"],
                )
                for student in allocation.get("alunos", [])
            ]
            self.session.add(entity)
            persisted.append(entity)
        if usuario_executor_id is None:
            return
        self.session.flush()
        for entity in persisted:
            self.session.add(
                LogAuditoriaORM(
                    usuario_id=usuario_executor_id,
                    acao="CONFIRMAR",
                    entidade="alocacao_diaria",
                    entidade_id=entity.id,
                    valor_anterior=json.dumps(
                        old_by_key.get((entity.rota_id, entity.turno)),
                        ensure_ascii=False,
                    ),
                    valor_novo=json.dumps(self._snapshot(entity), ensure_ascii=False),
                )
            )

    @staticmethod
    def _snapshot(entity: AlocacaoDiariaORM) -> dict:
        return {
            "rota_id": entity.rota_id,
            "onibus_id": entity.onibus_id,
            "motorista_id": entity.motorista_id,
            "data": entity.data.isoformat(),
            "turno": entity.turno,
            "alunos": [
                {
                    "agendamento_id": student.agendamento_id,
                    "turno": student.turno,
                    "tipo_lugar": student.tipo_lugar,
                    "status": student.status,
                }
                for student in entity.alunos
            ],
        }
