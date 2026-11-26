from datetime import date, timedelta

from sqlalchemy.orm import Session

from src.modulos.alocacao_diaria.application.dtos.rodizio_dto import RodizioRequestDTO
from src.modulos.alocacao_diaria.application.services.alocacao_service import AlocacaoService
from src.modulos.alocacao_diaria.model.entities.rodizio_frota import RodizioFrotaORM, RodizioFrotaItemORM
from src.modulos.crud_basicos.domain.entities.onibus import OnibusORM
from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM


class RodizioError(ValueError):
    def __init__(self, message: str, status_code: int = 422):
        self.status_code = status_code
        super().__init__(message)


class RodizioService:
    def __init__(self, session: Session):
        self.session = session

    @staticmethod
    def _normalizar_placa(placa: str) -> str:
        return placa.strip().upper().replace("-", "")

    @staticmethod
    def _inicio_da_semana(data: date) -> date:
        return data - timedelta(days=data.weekday())

    def obter_configuracao(self) -> dict:
        configuracao = (
            self.session.query(RodizioFrotaORM)
            .filter(RodizioFrotaORM.ativo.is_(True))
            .order_by(RodizioFrotaORM.id.desc())
            .first()
        )
        if configuracao is None:
            return {"ativa": False, "configuracao": None}
        itens = (
            self.session.query(RodizioFrotaItemORM)
            .filter(RodizioFrotaItemORM.rodizio_id == configuracao.id)
            .order_by(RodizioFrotaItemORM.rota_id, RodizioFrotaItemORM.turno)
            .all()
        )
        return {
            "ativa": True,
            "configuracao": {
                "id": configuracao.id,
                "data_inicio": configuracao.data_inicio.isoformat(),
                "semanas": configuracao.semanas,
                "itens": [
                    {"rota_id": item.rota_id, "onibus_id": item.onibus_id, "turno": item.turno}
                    for item in itens
                ],
            },
        }

    def listar_contexto(self) -> dict:
        rotas = (
            self.session.query(RotaPrincipalORM)
            .filter(RotaPrincipalORM.ativo.is_(True))
            .order_by(RotaPrincipalORM.nome)
            .all()
        )
        onibus = (
            self.session.query(OnibusORM)
            .filter(OnibusORM.ativo.is_(True))
            .order_by(OnibusORM.placa_onibus)
            .all()
        )
        configuracao = self.obter_configuracao()
        return {
            "rotas": [
                {"id": rota.id, "nome": rota.nome, "horario_saida": rota.horario_saida.isoformat() if rota.horario_saida else None, "horario_retorno": rota.horario_retorno.isoformat() if rota.horario_retorno else None}
                for rota in rotas
            ],
            "onibus": [
                {"placa": bus.placa_onibus, "apelido": bus.apelido_onibus, "assentos": bus.qtd_assentos, "capacidade_em_pe": bus.capacidade_maxima}
                for bus in onibus
            ],
            **configuracao,
        }

    def _validar(self, payload: RodizioRequestDTO) -> None:
        if not payload.itens:
            raise RodizioError("É necessário selecionar pelo menos um ônibus para o rodízio.")

        routes = {
            item.id: item
            for item in self.session.query(RotaPrincipalORM).filter(RotaPrincipalORM.ativo.is_(True)).all()
        }
        buses = {
            self._normalizar_placa(item.placa_onibus): item
            for item in self.session.query(OnibusORM).filter(OnibusORM.ativo.is_(True)).all()
        }
        vistos: set[tuple[int, str]] = set()
        usados: set[tuple[str, str]] = set()
        for item in payload.itens:
            if item.rota_id not in routes:
                raise RodizioError("Rota inexistente ou inativa.")
            if item.onibus_id not in buses:
                raise RodizioError("Ônibus inexistente ou inativo.", 409)
            key = (item.rota_id, item.turno)
            if key in vistos:
                raise RodizioError("Uma rota não pode ter mais de uma configuração no mesmo turno.")
            resource_key = (item.onibus_id, item.turno)
            if resource_key in usados:
                raise RodizioError(
                    "O mesmo ônibus não pode ser alocado a mais de uma rota no mesmo dia e horário.",
                    409,
                )
            vistos.add(key)
            usados.add(resource_key)

    def preview(self, payload: RodizioRequestDTO) -> dict:
        self._validar(payload)
        inicio = self._inicio_da_semana(payload.data_inicio)
        buses = {
            self._normalizar_placa(item.placa_onibus): item
            for item in self.session.query(OnibusORM).filter(OnibusORM.ativo.is_(True)).all()
        }
        rotas = {
            item.id: item
            for item in self.session.query(RotaPrincipalORM).filter(RotaPrincipalORM.ativo.is_(True)).all()
        }
        escalas = []
        alertas = []
        alocacao_service = AlocacaoService(self.session)

        for semana in range(payload.semanas):
            inicio_semana = inicio + timedelta(days=7 * semana)
            fim_semana = inicio_semana + timedelta(days=6)
            itens_semana = []
            demanda_no_dia = alocacao_service._demanda(inicio_semana)

            base_por_turno: dict[str, list] = {"ida": [], "volta": []}
            for item in payload.itens:
                base_por_turno[item.turno].append(item)

            for turno in ("ida", "volta"):
                base = sorted(base_por_turno[turno], key=lambda item: item.rota_id)
                if not base:
                    continue
                pool = sorted({item.onibus_id for item in base})
                route_index = {
                    rota_id: index
                    for index, rota_id in enumerate(sorted({item.rota_id for item in base}))
                }
                for item in base:
                    base_bus_index = pool.index(item.onibus_id)
                    route_offset = route_index[item.rota_id]
                    bus = pool[(base_bus_index + semana) % len(pool)]
                    if turno == "ida":
                        bus = pool[(route_offset + semana) % len(pool)]
                    else:
                        bus = pool[(route_offset + semana) % len(pool)]
                    veiculo = buses.get(bus)
                    rota = rotas.get(item.rota_id)
                    demanda = sum(
                        len(passageiros)
                        for (rota_id, turno_demanda), passageiros in demanda_no_dia.items()
                        if rota_id == item.rota_id and turno_demanda == turno
                    )
                    capacidade = (veiculo.qtd_assentos + veiculo.capacidade_maxima) if veiculo else 0
                    alerta = None
                    if demanda > capacidade:
                        alerta = (
                            "Atenção: O veículo selecionado pode não atender à demanda prevista "
                            "para esta rota"
                        )
                        alertas.append({
                            "semana": semana + 1,
                            "rota_id": item.rota_id,
                            "onibus_id": bus,
                            "mensagem": alerta,
                        })
                    itens_semana.append({
                        "rota_id": item.rota_id,
                        "rota_nome": rota.nome if rota else f"Rota {item.rota_id}",
                        "onibus_id": bus,
                        "turno": turno,
                        "demanda_prevista": demanda,
                        "capacidade_assentos": veiculo.qtd_assentos if veiculo else 0,
                        "capacidade_em_pe": veiculo.capacidade_maxima if veiculo else 0,
                        "alerta_capacidade": alerta,
                    })
            escalas.append({
                "semana": semana + 1,
                "data_inicio": inicio_semana.isoformat(),
                "data_fim": fim_semana.isoformat(),
                "itens": itens_semana,
            })

        return {
            "ativa": False,
            "data_inicio": inicio.isoformat(),
            "semanas": payload.semanas,
            "escalas": escalas,
            "alertas": alertas,
        }

    def confirmar(self, payload: RodizioRequestDTO, usuario_id: int | None = None) -> dict:
        self._validar(payload)
        inicio = self._inicio_da_semana(payload.data_inicio)

        antigos = self.session.query(RodizioFrotaORM).filter(RodizioFrotaORM.ativo.is_(True)).all()
        for antigo in antigos:
            antigo.ativo = False

        configuracao = RodizioFrotaORM(
            data_inicio=inicio,
            semanas=payload.semanas,
            ativo=True,
            usuario_id=usuario_id,
        )
        self.session.add(configuracao)
        self.session.flush()
        for item in payload.itens:
            self.session.add(RodizioFrotaItemORM(
                rodizio_id=configuracao.id,
                rota_id=item.rota_id,
                onibus_id=item.onibus_id,
                turno=item.turno,
            ))
        try:
            self.session.commit()
        except Exception:
            self.session.rollback()
            raise
        return {
            "mensagem": "Rodízio configurado e aplicado com sucesso",
            "configuracao": self.obter_configuracao()["configuracao"],
        }
