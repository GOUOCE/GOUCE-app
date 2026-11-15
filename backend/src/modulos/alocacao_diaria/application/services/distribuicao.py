from dataclasses import dataclass
from typing import Iterable


@dataclass(frozen=True)
class Passageiro:
    agendamento_id: int
    turno: str


@dataclass(frozen=True)
class OnibusDisponivel:
    onibus_id: str
    assentos: int
    em_pe: int
    motorista_id: int


def distribuir_alunos(
    demanda_por_rota: dict[int | tuple[int, str], list[Passageiro]],
    onibus: Iterable[OnibusDisponivel],
    rodizio: dict[int, str] | None = None,
) -> dict:
    """Calcula a distribuição sem ler ou alterar estado externo."""
    disponiveis = sorted(onibus, key=lambda item: item.onibus_id)
    usados: set[str] = set()
    alocacoes: list[dict] = []
    excedentes_globais: list[dict] = []
    alertas: list[dict] = []
    rodizio = rodizio or {}
    demanda_resumida: dict[int, int] = {}
    grupos = sorted(
        demanda_por_rota.items(),
        key=lambda item: (
            item[0][0] if isinstance(item[0], tuple) else item[0],
            item[0][1] if isinstance(item[0], tuple) else "",
        ),
    )

    for chave, passageiros in grupos:
        rota_id = chave[0] if isinstance(chave, tuple) else chave
        demanda_resumida[rota_id] = demanda_resumida.get(rota_id, 0) + len(passageiros)
        restantes = list(passageiros)
        while restantes:
            candidatos = [item for item in disponiveis if item.onibus_id not in usados]
            if not candidatos:
                excedentes_globais.extend(
                    {"agendamento_id": item.agendamento_id, "turno": item.turno}
                    for item in restantes
                )
                break

            preferido = rodizio.get(rota_id)
            escolhido = next(
                (item for item in candidatos if item.onibus_id == preferido),
                max(candidatos, key=lambda item: item.assentos + item.em_pe),
            )
            usados.add(escolhido.onibus_id)
            ocupantes = restantes[: escolhido.assentos + escolhido.em_pe]
            restantes = restantes[len(ocupantes) :]
            sentados = min(len(ocupantes), escolhido.assentos)
            alocacoes.append(
                {
                    "rota_id": rota_id,
                    "onibus_id": escolhido.onibus_id,
                    "motorista_id": escolhido.motorista_id,
                    "turno": ocupantes[0].turno if ocupantes else "ida",
                    "capacidade": {
                        "assentos": escolhido.assentos,
                        "em_pe": escolhido.em_pe,
                    },
                    "sentados": sentados,
                    "em_pe": len(ocupantes) - sentados,
                    "alunos": [
                        {
                            "agendamento_id": passenger.agendamento_id,
                            "tipo_lugar": "sentado" if index < sentados else "em_pe",
                        }
                        for index, passenger in enumerate(ocupantes)
                    ],
                    "excedentes": [],
                }
            )
            if preferido and escolhido.onibus_id != preferido:
                alertas.append(
                    {
                        "tipo": "ONIBUS_DIFERENTE_DO_RODIZIO",
                        "mensagem": (
                            f"A rota {rota_id} usou o ônibus {escolhido.onibus_id}; "
                            f"o rodízio previa {preferido}."
                        ),
                    }
                )

    return {
        "demanda_por_rota": [
            {"rota_id": rota_id, "total_alunos": total}
            for rota_id, total in sorted(demanda_resumida.items())
        ],
        "alocacoes": alocacoes,
        "excedentes_globais": excedentes_globais,
        "alertas": alertas,
    }
