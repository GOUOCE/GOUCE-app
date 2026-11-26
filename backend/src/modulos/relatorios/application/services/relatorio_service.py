from datetime import date
from typing import Optional

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session, aliased

from src.modulos.agendamentos.model.entities.agendamento import AgendamentoORM
from src.modulos.alocacao_diaria.model.entities.alocacao import (
    AlocacaoAlunoORM,
    AlocacaoDiariaORM,
)
from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
from src.modulos.crud_basicos.domain.entities.ponto_de_parada import PontoDeParadaORM
from src.modulos.motoristas.model.entities.motorista import MotoristaORM
from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM

TIPOS_RELATORIO = {
    "geral": "Relatório Geral",
    "agendamentos": "Relatório de Agendamentos",
    "motoristas": "Relatório de Motoristas",
}

MENSAGEM_SEM_DADOS = "Nenhum dado encontrado para os filtros informados."


class RelatorioValidationError(Exception):
    def __init__(self, mensagem: str, campos: Optional[list[str]] = None):
        super().__init__(mensagem)
        self.mensagem = mensagem
        self.campos = campos or []


def formatar_data(valor: date) -> str:
    return valor.strftime("%d/%m/%Y")


def _percentual(parcial: int, total: int) -> str:
    if not total:
        return "0,0%"
    return f"{(parcial / total) * 100:.1f}%".replace(".", ",")


class RelatorioService:
    def __init__(self, session: Session):
        self.session = session

    def gerar(
        self,
        *,
        tipo: str,
        data_inicio: date,
        data_fim: date,
        faculdade_id: Optional[int] = None,
        bairro_id: Optional[int] = None,
    ) -> dict:
        if data_fim < data_inicio:
            raise RelatorioValidationError(
                "A data final não pode ser anterior à data inicial.",
                ["data_fim", "data_inicio"],
            )

        ponto_embarque = aliased(PontoDeParadaORM)
        ponto_desembarque = aliased(PontoDeParadaORM)

        condicoes = [
            AgendamentoORM.status == "ATIVO",
            AgendamentoORM.data >= data_inicio,
            AgendamentoORM.data <= data_fim,
        ]

        if faculdade_id is not None:
            condicoes.append(
                or_(
                    and_(
                        AgendamentoORM.usa_ida.is_(True),
                        AgendamentoORM.ies_destino_id == faculdade_id,
                    ),
                    and_(
                        AgendamentoORM.usa_volta.is_(True),
                        AgendamentoORM.ies_origem_id == faculdade_id,
                    ),
                )
            )

        if bairro_id is not None:
            condicoes.append(
                or_(
                    ponto_embarque.bairro_id == bairro_id,
                    ponto_desembarque.bairro_id == bairro_id,
                )
            )

        agendamentos = list(
            self.session.scalars(
                select(AgendamentoORM)
                .outerjoin(
                    ponto_embarque,
                    AgendamentoORM.ponto_embarque_id == ponto_embarque.ponto_id,
                )
                .outerjoin(
                    ponto_desembarque,
                    AgendamentoORM.ponto_desembarque_id == ponto_desembarque.ponto_id,
                )
                .where(*condicoes)
                .order_by(AgendamentoORM.data, AgendamentoORM.id)
            )
        )
        agendamentos_por_id = {agendamento.id: agendamento for agendamento in agendamentos}

        faculdades = {
            faculdade.id_faculdade: faculdade
            for faculdade in self.session.scalars(select(FaculdadeORM)).all()
        }
        bairros = {
            bairro.bairro_id: bairro.nome
            for bairro in self.session.scalars(select(BairroORM)).all()
        }
        pontos = {
            ponto.ponto_id: ponto.bairro_id
            for ponto in self.session.scalars(select(PontoDeParadaORM)).all()
        }
        rotas = {
            rota.id: rota.nome
            for rota in self.session.scalars(select(RotaPrincipalORM)).all()
        }
        motoristas = {
            motorista.id: {
                "nome": motorista.nome_completo,
                "ativo": bool(motorista.ativo),
            }
            for motorista in self.session.scalars(select(MotoristaORM)).all()
        }

        total_agendamentos = len(agendamentos_por_id)
        total_embarques = sum(
            1 for item in agendamentos if item.presenca_status == "PRESENTE"
        )
        total_faltas = sum(
            1 for item in agendamentos if item.presenca_status == "FALTA"
        )

        alocacoes = []
        if agendamentos_por_id:
            alocacoes = list(
                self.session.scalars(
                    select(AlocacaoAlunoORM)
                    .join(
                        AlocacaoDiariaORM,
                        AlocacaoAlunoORM.alocacao_diaria_id == AlocacaoDiariaORM.id,
                    )
                    .where(
                        AlocacaoAlunoORM.agendamento_id.in_(agendamentos_por_id),
                        AlocacaoAlunoORM.status == "ALOCADO",
                        AlocacaoDiariaORM.data >= data_inicio,
                        AlocacaoDiariaORM.data <= data_fim,
                    )
                )
            )

        diarias = {
            diaria.id: diaria
            for diaria in self.session.scalars(
                select(AlocacaoDiariaORM).where(
                    AlocacaoDiariaORM.data >= data_inicio,
                    AlocacaoDiariaORM.data <= data_fim,
                )
            ).all()
        }

        grupos: dict[tuple[date, int, str], list[AgendamentoORM]] = {}
        escalas_por_motorista: dict[int, dict] = {}

        for alocacao in alocacoes:
            diaria = diarias.get(alocacao.alocacao_diaria_id)
            agendamento = agendamentos_por_id.get(alocacao.agendamento_id)
            if diaria is None or agendamento is None:
                continue

            chave = (diaria.data, diaria.rota_id, alocacao.turno)
            grupos.setdefault(chave, []).append(agendamento)

            dados_motorista = escalas_por_motorista.setdefault(
                diaria.motorista_id,
                {"datas": set(), "rotas": set(), "escalas": set()},
            )
            dados_motorista["datas"].add(diaria.data)
            dados_motorista["rotas"].add(rotas.get(diaria.rota_id, f"Rota {diaria.rota_id}"))
            dados_motorista["escalas"].add(
                (
                    diaria.data,
                    rotas.get(diaria.rota_id, f"Rota {diaria.rota_id}"),
                    alocacao.turno,
                )
            )

        detalhamento = []
        for (data, rota_id, turno), itens in sorted(
            grupos.items(), key=lambda item: (item[0][0], item[0][1], item[0][2])
        ):
            if turno == "volta":
                faculdade_ids = [
                    item.ies_origem_id for item in itens if item.ies_origem_id
                ]
                ponto_ids = [
                    item.ponto_desembarque_id
                    for item in itens
                    if item.ponto_desembarque_id
                ]
            else:
                faculdade_ids = [
                    item.ies_destino_id for item in itens if item.ies_destino_id
                ]
                ponto_ids = [
                    item.ponto_embarque_id for item in itens if item.ponto_embarque_id
                ]

            nomes_faculdades = sorted(
                {
                    faculdades[fid].nome_faculdade
                    for fid in faculdade_ids
                    if fid in faculdades
                }
            )
            nomes_bairros = sorted(
                {bairros[pontos[pid]] for pid in ponto_ids if pid in pontos and pontos[pid] in bairros}
            )
            quantidade_agendados = len(itens)
            quantidade_embarques = sum(
                1 for item in itens if item.presenca_status == "PRESENTE"
            )
            quantidade_faltas = sum(
                1 for item in itens if item.presenca_status == "FALTA"
            )

            detalhamento.append(
                {
                    "data": formatar_data(data),
                    "rota": rotas.get(rota_id, f"Rota {rota_id}"),
                    "turno": turno.upper(),
                    "faculdade": ", ".join(nomes_faculdades) or "-",
                    "bairro": ", ".join(nomes_bairros) or "-",
                    "agendados": quantidade_agendados,
                    "embarques": quantidade_embarques,
                    "faltas": quantidade_faltas,
                    "comparecimento": _percentual(
                        quantidade_embarques, quantidade_agendados
                    ),
                    "porcentagemFaltas": _percentual(
                        quantidade_faltas, quantidade_agendados
                    ),
                }
            )

        rota_maior_demanda = "-"
        if detalhamento:
            rota_maior_demanda = max(
                detalhamento, key=lambda item: item["agendados"]
            )["rota"]

        motoristas_relatorio = []
        for motorista_id, dados in sorted(
            escalas_por_motorista.items(),
            key=lambda item: motoristas.get(item[0], {}).get("nome", ""),
        ):
            motoristas_relatorio.append(
                {
                    "nome": motoristas.get(motorista_id, {}).get(
                        "nome", f"Motorista {motorista_id}"
                    ),
                    "ativo": motoristas.get(motorista_id, {}).get("ativo", True),
                    "diasTrabalhados": len(dados["datas"]),
                    "rotas": sorted(dados["rotas"]),
                    "escalas": [
                        {
                            "data": formatar_data(data),
                            "rota": rota,
                            "turno": "Ida" if turno == "ida" else "Volta",
                        }
                        for data, rota, turno in sorted(dados["escalas"])
                    ],
                }
            )

        nome_faculdade = (
            faculdades[faculdade_id].nome_faculdade
            if faculdade_id in faculdades
            else "Todas as faculdades"
        )
        nome_bairro = (
            bairros[bairro_id] if bairro_id in bairros else "Todos os bairros"
        )

        return {
            "tipo": tipo,
            "filtrosResumo": {
                "tipoLabel": TIPOS_RELATORIO.get(tipo, TIPOS_RELATORIO["agendamentos"]),
                "periodoLabel": (
                    f"{formatar_data(data_inicio)} a {formatar_data(data_fim)}"
                ),
                "faculdadeLabel": nome_faculdade,
                "bairroLabel": nome_bairro,
            },
            "consolidado": {
                "totalAgendamentos": total_agendamentos,
                "totalEmbarques": total_embarques,
                "totalFaltas": total_faltas,
                "comparecimento": _percentual(total_embarques, total_agendamentos),
                "porcentagemFaltas": _percentual(total_faltas, total_agendamentos),
                "rotaMaiorDemanda": rota_maior_demanda,
            },
            "detalhamento": detalhamento,
            "motoristas": motoristas_relatorio,
            "mensagem": MENSAGEM_SEM_DADOS if total_agendamentos == 0 else None,
        }
