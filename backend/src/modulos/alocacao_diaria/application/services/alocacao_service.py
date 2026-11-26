import json
from datetime import date, timedelta

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
from src.modulos.alocacao_diaria.model.entities.rodizio_frota import (
    RodizioFrotaItemORM,
    RodizioFrotaORM,
)
from src.shared.infrastructure.audit_model import LogAuditoriaORM


MENSAGEM_DIA_PASSADO = "Não é possível alterar a distribuição de um dia que já passou."


class DistribuicaoError(ValueError):
    def __init__(self, message: str, status_code: int = 422):
        self.status_code = status_code
        super().__init__(message)


class AlocacaoService:
    def __init__(self, session: Session):
        self.session = session

    @staticmethod
    def _normalizar_placa(placa: str) -> str:
        return placa.strip().upper().replace("-", "")

    def _onibus_do_rodizio_na_semana(
        self,
        target: date,
        rota_id: int,
        turno: str,
    ) -> set[str] | None:
        configuracao = (
            self.session.query(RodizioFrotaORM)
            .filter(RodizioFrotaORM.ativo.is_(True))
            .order_by(RodizioFrotaORM.id.desc())
            .first()
        )
        if configuracao is None:
            return None

        inicio = configuracao.data_inicio - timedelta(
            days=configuracao.data_inicio.weekday()
        )
        target_inicio = target - timedelta(days=target.weekday())
        if target_inicio < inicio:
            return None

        semana = (target_inicio - inicio).days // 7
        if semana >= configuracao.semanas:
            return None

        itens = (
            self.session.query(RodizioFrotaItemORM)
            .filter(RodizioFrotaItemORM.rodizio_id == configuracao.id)
            .filter(RodizioFrotaItemORM.rota_id == rota_id)
            .filter(RodizioFrotaItemORM.turno == turno)
            .all()
        )
        return {self._normalizar_placa(item.onibus_id) for item in itens}

    def _alertas_fora_do_rodizio(
        self,
        target: date,
        alocacoes: list[dict],
    ) -> list[dict]:
        alertas = []
        for alocacao in alocacoes:
            rota_id = alocacao["rota_id"]
            turno = alocacao.get("turno", "ida")
            onibus_id = self._normalizar_placa(alocacao["onibus_id"])
            onibus_da_semana = self._onibus_do_rodizio_na_semana(
                target,
                rota_id,
                turno,
            )
            if onibus_da_semana is not None and onibus_id not in onibus_da_semana:
                alertas.append(
                    {
                        "tipo": "ONIBUS_DIFERENTE_DO_RODIZIO",
                        "rota_id": rota_id,
                        "turno": turno,
                        "onibus_id": onibus_id,
                        "mensagem": (
                            f"O ônibus {onibus_id} não está cadastrado no rodízio "
                            f"desta semana para a rota {rota_id} no turno {turno}."
                        ),
                    }
                )
        return alertas

    def preview(self, target: date) -> dict:
        demanda = self._demanda(target)
        automatica = self._preview_automatica(target, demanda)
        persistidas = self._alocacoes_persistidas(target)
        alocacoes = persistidas if persistidas is not None else automatica["alocacoes"]
        self._enriquecer_alocacoes(alocacoes)
        alertas_rodizio = self._alertas_fora_do_rodizio(target, alocacoes)
        if persistidas is not None:
            alertas = alertas_rodizio
        else:
            alertas = automatica["alertas"] + alertas_rodizio

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
            "alertas": alertas,
        }

    def _preview_automatica(
        self,
        target: date,
        demanda: dict[tuple[int, str], list[Passageiro]] | None = None,
    ) -> dict:
        if demanda is None:
            demanda = self._demanda(target)
        return {
            "data": target.isoformat(),
            **distribuir_alunos(
                demanda,
                self._buses(),
                rodizio=self._rodizio_para(target),
            ),
        }

    def _rodizio_para(self, target: date) -> dict[int | tuple[int, str], str]:
        configuracao = (
            self.session.query(RodizioFrotaORM)
            .filter(RodizioFrotaORM.ativo.is_(True))
            .order_by(RodizioFrotaORM.id.desc())
            .first()
        )
        if configuracao is None:
            return {}

        inicio = configuracao.data_inicio - timedelta(
            days=configuracao.data_inicio.weekday()
        )
        target_inicio = target - timedelta(days=target.weekday())
        if target_inicio < inicio:
            return {}
        diff_dias = (target_inicio - inicio).days
        if diff_dias < 0:
            return {}
        semana = diff_dias // 7
        if semana >= configuracao.semanas:
            return {}

        itens = (
            self.session.query(RodizioFrotaItemORM)
            .filter(RodizioFrotaItemORM.rodizio_id == configuracao.id)
            .all()
        )
        mapping: dict[int | tuple[int, str], str] = {}
        for turno in ("ida", "volta"):
            base = sorted(
                [item for item in itens if item.turno == turno],
                key=lambda item: item.rota_id,
            )
            if not base:
                continue
            pool = sorted({item.onibus_id for item in base})
            route_indexes = {
                rota_id: index
                for index, rota_id in enumerate(sorted({item.rota_id for item in base}))
            }
            for item in base:
                bus = pool[(route_indexes[item.rota_id] + semana) % len(pool)]
                mapping[(item.rota_id, turno)] = bus
        return mapping

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

    @staticmethod
    def _hoje() -> date:
        """Data de hoje no fuso do servidor (America/Fortaleza); isolada para os testes."""
        return date.today()

    def persist(
        self,
        payload: DistribuicaoRequestDTO,
        usuario_executor_id: int | None = None,
    ) -> dict:
        # RN-004: o histórico de períodos anteriores não pode ser alterado (issue #542).
        if payload.data < self._hoje():
            raise DistribuicaoError(MENSAGEM_DIA_PASSADO)
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
        buses = {
            self._normalizar_placa(bus.placa_onibus): bus
            for bus in self.session.query(OnibusORM).filter(OnibusORM.ativo.is_(True))
        }
        # Carrega também os inativos para citar o nome na recusa (issue #523).
        drivers = {driver.id: driver for driver in self.session.query(MotoristaORM)}
        used_buses: dict[tuple[str, str], int] = {}
        used_drivers: dict[tuple[int, str], int] = {}
        seen_students: set[tuple[int, str]] = set()
        for allocation in alocacoes:
            rota = routes.get(allocation.get("rota_id"))
            if rota is None:
                raise DistribuicaoError("Rota inexistente ou inativa.")
            prefix = getattr(rota, "nome", f"Rota {rota.id}")
            bus_id = self._normalizar_placa(allocation.get("onibus_id") or "")
            turno = allocation.get("turno", "ida")
            allocation["onibus_id"] = bus_id
            bus = buses.get(bus_id)
            if bus is None:
                raise DistribuicaoError(f"{prefix}: ônibus {bus_id} inexistente ou inativo.")
            if permitir_realocacao:
                onibus_da_semana = self._onibus_do_rodizio_na_semana(
                    target,
                    allocation["rota_id"],
                    turno,
                )
                if onibus_da_semana is not None and bus_id not in onibus_da_semana:
                    raise DistribuicaoError(
                        f"{prefix}: o ônibus {bus_id} não está cadastrado no rodízio desta semana para o turno {turno}.",
                        409,
                    )
            motorista_id = allocation.get("motorista_id")
            motorista = drivers.get(motorista_id)
            if motorista is None:
                raise DistribuicaoError(f"{prefix}: motorista inexistente ou inativo.")
            if not motorista.ativo:
                raise DistribuicaoError(
                    f"{prefix}: o motorista {motorista.nome_completo} está inativo e não pode ser escalado."
                )
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
