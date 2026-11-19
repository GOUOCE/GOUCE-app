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
    usados: set[tuple[str, str]] = set()
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
        turno = chave[1] if isinstance(chave, tuple) else "ida"
        demanda_resumida[rota_id] = demanda_resumida.get(rota_id, 0) + len(passageiros)
        restantes = list(passageiros)
        candidatos = [
            item
            for item in disponiveis
            if (item.onibus_id, turno) not in usados
        ]
        if not candidatos:
            excedentes_globais.extend(
                {"agendamento_id": item.agendamento_id, "turno": item.turno}
                for item in restantes
            )
            continue

        preferido = rodizio.get(rota_id)
        candidatos.sort(
            key=lambda item: (
                item.onibus_id != preferido,
                -item.assentos,
                item.onibus_id,
            )
        )

        alocacoes_do_grupo: dict[str, dict] = {}
        for passageiro in candidatos:
            if not restantes:
                break
            sentados = min(len(restantes), passageiro.assentos)
            if not sentados:
                continue
            usados.add((passageiro.onibus_id, turno))
            ocupantes = restantes[:sentados]
            restantes = restantes[sentados:]
            registro = {
                "rota_id": rota_id,
                "onibus_id": passageiro.onibus_id,
                "motorista_id": passageiro.motorista_id,
                "turno": ocupantes[0].turno,
                "capacidade": {
                    "assentos": passageiro.assentos,
                    "em_pe": passageiro.em_pe,
                },
                "sentados": sentados,
                "em_pe": 0,
                "alunos": [
                    {
                        "agendamento_id": student.agendamento_id,
                        "tipo_lugar": "sentado",
                    }
                    for student in ocupantes
                ],
                "excedentes": [],
            }
            alocacoes_do_grupo[passageiro.onibus_id] = registro
            alocacoes.append(registro)
            if preferido and passageiro.onibus_id != preferido:
                alertas.append(
                    {
                        "tipo": "ONIBUS_DIFERENTE_DO_RODIZIO",
                        "mensagem": (
                            f"A rota {rota_id} usou o ônibus {passageiro.onibus_id}; "
                            f"o rodízio previa {preferido}."
                        ),
                    }
                )

        for passageiro in candidatos:
            if not restantes:
                break
            em_pe = min(len(restantes), passageiro.em_pe)
            if not em_pe:
                continue
            usados.add((passageiro.onibus_id, turno))
            ocupantes = restantes[:em_pe]
            restantes = restantes[em_pe:]
            registro = alocacoes_do_grupo.get(passageiro.onibus_id)
            if registro is None:
                registro = {
                    "rota_id": rota_id,
                    "onibus_id": passageiro.onibus_id,
                    "motorista_id": passageiro.motorista_id,
                    "turno": ocupantes[0].turno,
                    "capacidade": {
                        "assentos": passageiro.assentos,
                        "em_pe": passageiro.em_pe,
                    },
                    "sentados": 0,
                    "em_pe": 0,
                    "alunos": [],
                    "excedentes": [],
                }
                alocacoes_do_grupo[passageiro.onibus_id] = registro
                alocacoes.append(registro)
            registro["em_pe"] += em_pe
            registro["alunos"].extend(
                {
                    "agendamento_id": student.agendamento_id,
                    "tipo_lugar": "em_pe",
                }
                for student in ocupantes
            )

        if restantes:
            excedentes_globais.extend(
                {"agendamento_id": item.agendamento_id, "turno": item.turno}
                for item in restantes
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
