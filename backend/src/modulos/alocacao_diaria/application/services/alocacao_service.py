import json
from datetime import date

from sqlalchemy.orm import Session

from src.modulos.agendamentos.model.entities.agendamento import AgendamentoORM
from src.modulos.crud_basicos.domain.entities.onibus import OnibusORM
from src.modulos.motoristas.model.entities.motorista import MotoristaORM
from src.modulos.rotas.model.entities.rota_complementar import RotaComplementarORM
from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM
from src.modulos.usuarios.model.entities.usuario import UsuarioORM
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
        automatica = self._preview_automatica(target, demanda)
        persistidas = self._alocacoes_persistidas(target)
        alocacoes = persistidas if persistidas is not None else automatica["alocacoes"]
        self._enriquecer_alocacoes(alocacoes)

        alocados = {
            (aluno["agendamento_id"], alocacao["turno"])
            for alocacao in alocacoes
            for aluno in alocacao["alunos"]
        }
        excedentes = [
            {
                "agendamento_id": passageiro.agendamento_id,
                "turno": passageiro.turno,
                "rota_id": rota_id,
            }
            for (rota_id, _), passageiros in demanda.items()
            for passageiro in passageiros
            if (passageiro.agendamento_id, passageiro.turno) not in alocados
        ]
        self._enriquecer_excedentes(excedentes)

        distribuida = persistidas is not None
        return {
            "data": target.isoformat(),
            "status_logistico": "DISTRIBUIDO" if distribuida else "PENDENTE",
            "distribuicao_persistida": distribuida,
            "demanda_por_rota": automatica["demanda_por_rota"],
            "alocacoes": alocacoes,
            "excedentes_globais": excedentes,
            "alertas": [] if distribuida else automatica["alertas"],
        }

    def _preview_automatica(
        self,
        target: date,
        demanda: dict[tuple[int, str], list[Passageiro]] | None = None,
    ) -> dict:
        if demanda is None:
            demanda = self._demanda(target)
        return {"data": target.isoformat(), **distribuir_alunos(demanda, self._buses())}

    def _alocacoes_persistidas(self, target: date) -> list[dict] | None:
        alocacoes = (
            self.session.query(AlocacaoDiariaORM)
            .filter(AlocacaoDiariaORM.data == target)
            .order_by(
                AlocacaoDiariaORM.rota_id,
                AlocacaoDiariaORM.turno,
                AlocacaoDiariaORM.onibus_id,
            )
            .all()
        )
        if not alocacoes:
            return None

        buses = {bus.placa_onibus: bus for bus in self.session.query(OnibusORM).all()}
        resultado: list[dict] = []
        for alocacao in alocacoes:
            alunos = [item for item in alocacao.alunos if item.status == "ALOCADO"]
            bus = buses.get(alocacao.onibus_id)
            resultado.append(
                {
                    "rota_id": alocacao.rota_id,
                    "onibus_id": alocacao.onibus_id,
                    "motorista_id": alocacao.motorista_id,
                    "turno": alocacao.turno,
                    "capacidade": {
                        "assentos": bus.qtd_assentos if bus else 0,
                        "em_pe": bus.capacidade_maxima if bus else 0,
                    },
                    "sentados": sum(item.tipo_lugar == "sentado" for item in alunos),
                    "em_pe": sum(item.tipo_lugar == "em_pe" for item in alunos),
                    "alunos": [
                        {
                            "agendamento_id": item.agendamento_id,
                            "tipo_lugar": item.tipo_lugar,
                        }
                        for item in alunos
                    ],
                    "excedentes": [],
                }
            )
        return resultado

    def _enriquecer_alocacoes(self, alocacoes: list[dict]) -> None:
        if not alocacoes:
            return
        bus_ids = {item["onibus_id"] for item in alocacoes}
        motorista_ids = {item["motorista_id"] for item in alocacoes}
        buses = {
            bus.placa_onibus: bus
            for bus in self.session.query(OnibusORM).filter(
                OnibusORM.placa_onibus.in_(bus_ids)
            )
        }
        motoristas = {
            motorista.id: motorista
            for motorista in self.session.query(MotoristaORM).filter(
                MotoristaORM.id.in_(motorista_ids)
            )
        }
        for item in alocacoes:
            bus = buses.get(item["onibus_id"])
            motorista = motoristas.get(item["motorista_id"])
            item["onibus_apelido"] = bus.apelido_onibus if bus else None
            item["motorista_nome"] = motorista.nome_completo if motorista else None

    def _enriquecer_excedentes(self, excedentes: list[dict]) -> None:
        if not excedentes:
            return
        dados = self._dados_alunos({item["agendamento_id"] for item in excedentes})
        for item in excedentes:
            aluno_id, nome = dados.get(item["agendamento_id"], (None, None))
            item["aluno_id"] = aluno_id
            item["nome_aluno"] = nome or f"Agendamento #{item['agendamento_id']}"
        excedentes.sort(key=lambda item: ((item.get("nome_aluno") or "").lower(), item["turno"]))

    def _dados_alunos(
        self, agendamento_ids: set[int]
    ) -> dict[int, tuple[int | None, str | None]]:
        if not agendamento_ids:
            return {}
        rows = (
            self.session.query(
                AgendamentoORM.id,
                AgendamentoORM.aluno_id,
                UsuarioORM.nome_completo,
            )
            .join(UsuarioORM, UsuarioORM.id == AgendamentoORM.aluno_id)
            .filter(AgendamentoORM.id.in_(agendamento_ids))
            .all()
        )
        return {agendamento_id: (aluno_id, nome) for agendamento_id, aluno_id, nome in rows}

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
            self._validar_payload(payload.data, alocacoes, permitir_realocacao=True)

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

    def _validar_payload(
        self, target: date, alocacoes: list[dict], permitir_realocacao: bool = False
    ) -> None:
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
            driver.id: driver
            for driver in self.session.query(MotoristaORM).filter(MotoristaORM.ativo.is_(True))
        }
        used_buses: dict[tuple[str, str], int] = {}
        used_drivers: dict[tuple[int, str], int] = {}
        seen_students: set[tuple[int, str]] = set()
        for allocation in alocacoes:
            rota = routes.get(allocation.get("rota_id"))
            if rota is None:
                raise DistribuicaoError("Rota inexistente ou inativa.")
            prefix = getattr(rota, "nome", f"Rota {rota.id}")
            bus_id, turno = allocation.get("onibus_id"), allocation.get("turno", "ida")
            bus = buses.get(bus_id)
            if bus is None:
                raise DistribuicaoError(f"{prefix}: ônibus {bus_id} inexistente ou inativo.")
            motorista_id = allocation.get("motorista_id")
            motorista = drivers.get(motorista_id)
            if motorista is None:
                raise DistribuicaoError(f"{prefix}: motorista {motorista_id} inexistente ou inativo.")
            if (bus_id, turno) in used_buses:
                outra = routes.get(used_buses[(bus_id, turno)])
                outra_nome = outra.nome if outra else "outra rota"
                bus_label = bus.apelido_onibus or bus_id
                raise DistribuicaoError(
                    f"{prefix}: o ônibus {bus_label} já está alocado na rota {outra_nome} no turno {turno}.",
                    409,
                )
            if (motorista_id, turno) in used_drivers:
                raise DistribuicaoError(
                    "Este motorista já está escalado para outra rota neste horário.",
                    409,
                )
            used_buses[(bus_id, turno)] = allocation["rota_id"]
            used_drivers[(motorista_id, turno)] = allocation["rota_id"]
            alunos = allocation.get("alunos", [])
            if len(alunos) > bus.qtd_assentos + bus.capacidade_maxima:
                raise DistribuicaoError(f"{prefix}: capacidade total do ônibus excedida.")
            sentados = sum(item["tipo_lugar"] == "sentado" for item in alunos)
            em_pe = sum(item["tipo_lugar"] == "em_pe" for item in alunos)
            if sentados > bus.qtd_assentos or em_pe > bus.capacidade_maxima:
                raise DistribuicaoError(f"{prefix}: capacidade de assentos ou em pé excedida.")
            for student in alunos:
                key = (student["agendamento_id"], turno)
                booking = active_bookings.get(student["agendamento_id"])
                if booking is None:
                    raise DistribuicaoError(
                        f"{prefix}: agendamento {student['agendamento_id']} não está ativo nessa data."
                    )
                if not getattr(booking, f"usa_{turno}"):
                    raise DistribuicaoError(f"{prefix}: agendamento {booking.id} não usa o turno {turno}.")
                expected_route = self._route_for(booking, turno, list(routes.values()), complementary)
                if (
                    not permitir_realocacao
                    and expected_route is not None
                    and allocation["rota_id"] != expected_route
                ):
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
