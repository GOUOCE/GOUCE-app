from collections import defaultdict
from datetime import date, datetime
from typing import Any
from zoneinfo import ZoneInfo

from src.modulos.relatorios.application.dtos.relatorio_transporte_dto import (
    FiltrosRelatorioTransporteDTO,
    LinhaRelatorioTransporteDTO,
    MotoristaRelatorioTransporteDTO,
    RelatorioTransporteDTO,
    TotalPorCategoriaRelatorioDTO,
)

FORTALEZA = ZoneInfo("America/Fortaleza")
DIAS_SEMANA = ("Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom")


def percentual(parte: int, total: int) -> float:
    return round(parte * 100 / total, 1) if total else 0.0


def consolidar_linhas(registros: list[dict]) -> list[LinhaRelatorioTransporteDTO]:
    agrupados: dict[tuple[date, int | None], dict[str, Any]] = {}
    for registro in registros:
        chave = (registro["data"], registro["rota_id"])
        linha = agrupados.setdefault(
            chave,
            {
                "data": registro["data"],
                "rota": registro["rota"] or "Sem rota alocada",
                "localidades": set(),
                "faculdades": set(),
                "agendados": 0,
                "embarques": 0,
                "faltas": 0,
                "pendentes": 0,
            },
        )
        if registro["faculdade"]:
            linha["faculdades"].add(registro["faculdade"])
        if registro.get("localidade"):
            linha["localidades"].add(registro["localidade"])
        quantidade = registro["quantidade"]
        linha["agendados"] += quantidade
        if registro["status_presenca"] == "PRESENTE":
            linha["embarques"] += quantidade
        elif registro["status_presenca"] == "FALTA":
            linha["faltas"] += quantidade
        else:
            linha["pendentes"] += quantidade

    resultado = []
    for linha in sorted(agrupados.values(), key=lambda item: (item["data"], item["rota"])):
        resultado.append(
            LinhaRelatorioTransporteDTO(
                data=linha["data"],
                rota=linha["rota"],
                localidades=sorted(linha["localidades"]),
                faculdades_destino=sorted(linha["faculdades"]),
                agendados=linha["agendados"],
                embarques=linha["embarques"],
                faltas=linha["faltas"],
                pendentes=linha["pendentes"],
                taxa_presenca=percentual(linha["embarques"], linha["agendados"]),
            )
        )
    return resultado


def consolidar_totais_por_categoria(
    registros: list[dict],
    campo: str,
    categoria_vazia: str,
) -> list[TotalPorCategoriaRelatorioDTO]:
    totais: dict[str, dict[str, int]] = defaultdict(
        lambda: {"agendamentos": 0, "embarques": 0, "faltas": 0, "pendentes": 0}
    )
    for registro in registros:
        nome = registro.get(campo) or categoria_vazia
        categoria = totais[nome]
        quantidade = registro["quantidade"]
        categoria["agendamentos"] += quantidade
        if registro["status_presenca"] == "PRESENTE":
            categoria["embarques"] += quantidade
        elif registro["status_presenca"] == "FALTA":
            categoria["faltas"] += quantidade
        else:
            categoria["pendentes"] += quantidade

    return [
        TotalPorCategoriaRelatorioDTO(nome=nome, **valores)
        for nome, valores in sorted(totais.items(), key=lambda item: item[0].casefold())
    ]


def consolidar_motoristas(registros: list[dict]) -> list[MotoristaRelatorioTransporteDTO]:
    agrupados: dict[int, dict[str, Any]] = {}
    for registro in registros:
        motorista = agrupados.setdefault(
            registro["motorista_id"],
            {
                "nome": registro["nome"],
                "ativo": registro["ativo"],
                "dias": set(),
                "rotas": defaultdict(set),
            },
        )
        if registro["data"] and registro["rota"]:
            motorista["dias"].add(registro["data"])
            motorista["rotas"][registro["rota"]].add(registro["data"].weekday())

    resultado = []
    for motorista in sorted(agrupados.values(), key=lambda item: item["nome"].casefold()):
        rotas = sorted(motorista["rotas"])
        if rotas:
            escala = " • ".join(
                f"{_formatar_dias(motorista['rotas'][rota])} ({rota})"
                for rota in rotas
            )
            rotas_texto = ", ".join(rotas)
        else:
            rotas_texto = "Sem alocação"
            escala = "Sem alocação no período"
        nome = motorista["nome"] or "Motorista sem nome"
        if not motorista["ativo"]:
            nome = f"{nome} (Inativo)"
        resultado.append(
            MotoristaRelatorioTransporteDTO(
                nome=nome,
                dias_trabalhados=len(motorista["dias"]),
                rotas_alocadas=rotas_texto,
                escala=escala,
            )
        )
    return resultado


def _formatar_dias(dias: set[int]) -> str:
    nomes = [DIAS_SEMANA[dia] for dia in sorted(dias)]
    if len(nomes) < 2:
        return nomes[0] if nomes else ""
    if len(nomes) == 2:
        return " e ".join(nomes)
    return f"{', '.join(nomes[:-1])} e {nomes[-1]}"


class RelatorioTransporteService:
    def __init__(self, repository):
        self.repository = repository

    def gerar(
        self,
        filtros: FiltrosRelatorioTransporteDTO,
        usuario_id: int,
    ) -> RelatorioTransporteDTO:
        agregados = (
            []
            if filtros.tipo == "motoristas"
            else self.repository.buscar_agregados(
                filtros.data_inicio,
                filtros.data_fim,
                filtros.faculdade_id,
                filtros.bairro_id,
            )
        )
        linhas = consolidar_linhas(agregados)
        motoristas = (
            []
            if filtros.tipo == "agendamentos_embarques"
            else consolidar_motoristas(
                self.repository.buscar_motoristas(
                    filtros.data_inicio,
                    filtros.data_fim,
                    filtros.faculdade_id,
                    filtros.bairro_id,
                )
            )
        )

        totais = {
            "agendamentos": sum(linha.agendados for linha in linhas),
            "embarques": sum(linha.embarques for linha in linhas),
            "faltas": sum(linha.faltas for linha in linhas),
            "pendentes": sum(linha.pendentes for linha in linhas),
        }
        faculdade_nome, bairro_nome = self.repository.buscar_rotulos_filtros(
            filtros.faculdade_id,
            filtros.bairro_id,
        )
        filtros = filtros.model_copy(
            update={
                "faculdade_nome": faculdade_nome,
                "bairro_nome": bairro_nome,
            }
        )
        demanda_por_rota: dict[str, int] = defaultdict(int)
        for linha in linhas:
            if linha.rota != "Sem rota alocada":
                demanda_por_rota[linha.rota] += linha.agendados
        rota_maior_demanda = (
            min(
                demanda_por_rota,
                key=lambda rota: (-demanda_por_rota[rota], rota.casefold()),
            )
            if demanda_por_rota
            else "Sem rota"
        )
        por_faculdade = consolidar_totais_por_categoria(
            agregados,
            "faculdade",
            "Sem faculdade",
        )
        por_bairro = consolidar_totais_por_categoria(
            agregados,
            "localidade",
            "Sem bairro",
        )

        sem_dados = (
            not any(motorista.dias_trabalhados for motorista in motoristas)
            if filtros.tipo == "motoristas"
            else (
                not linhas
                if filtros.tipo == "agendamentos_embarques"
                else (
                    not linhas
                    and not any(
                        motorista.dias_trabalhados for motorista in motoristas
                    )
                )
            )
        )

        return RelatorioTransporteDTO(
            filtros=filtros,
            mensagem=(
                "Nenhum dado encontrado para os filtros informados."
                if sem_dados
                else None
            ),
            emitido_por=self.repository.buscar_nome_usuario(usuario_id),
            emitido_em=datetime.now(FORTALEZA).date(),
            total_agendamentos=totais["agendamentos"],
            total_embarques=totais["embarques"],
            total_faltas=totais["faltas"],
            total_pendentes=totais["pendentes"],
            taxa_comparecimento=percentual(totais["embarques"], totais["agendamentos"]),
            taxa_faltas=percentual(totais["faltas"], totais["agendamentos"]),
            rota_maior_demanda=rota_maior_demanda,
            linhas=linhas,
            motoristas=motoristas,
            por_faculdade=por_faculdade,
            por_bairro=por_bairro,
        )
