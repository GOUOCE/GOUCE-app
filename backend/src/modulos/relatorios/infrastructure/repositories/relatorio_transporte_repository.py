from datetime import date

from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.orm import Session, aliased

from src.modulos.alocacao_diaria.model.entities.alocacao import (
    AlocacaoAlunoORM,
    AlocacaoDiariaORM,
)
from src.modulos.agendamentos.model.entities.agendamento import AgendamentoORM
from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
from src.modulos.crud_basicos.domain.entities.ponto_de_parada import PontoDeParadaORM
from src.modulos.motoristas.model.entities.motorista import MotoristaORM
from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM
from src.modulos.usuarios.model.entities.usuario import UsuarioORM


class RelatorioTransporteRepository:
    def __init__(self, session: Session):
        self.session = session

    def _rota_ids(
        self,
        faculdade_id: int | None,
        bairro_id: int | None,
    ) -> list[int] | None:
        if faculdade_id is None and bairro_id is None:
            return None

        query = self.session.query(RotaPrincipalORM.id)
        if faculdade_id is not None:
            query = query.filter(
                RotaPrincipalORM.faculdades_ida.any(
                    FaculdadeORM.id_faculdade == faculdade_id
                )
                | RotaPrincipalORM.faculdades_volta.any(
                    FaculdadeORM.id_faculdade == faculdade_id
                )
            )
        if bairro_id is not None:
            query = query.filter(
                RotaPrincipalORM.bairros.any(BairroORM.bairro_id == bairro_id)
            )
        return [row[0] for row in query.all()]

    def buscar_agregados(
        self,
        data_inicio: date,
        data_fim: date,
        faculdade_id: int | None = None,
        bairro_id: int | None = None,
    ) -> list[dict]:
        ponto_embarque = aliased(PontoDeParadaORM)
        ponto_desembarque = aliased(PontoDeParadaORM)
        bairro_embarque = (
            select(ponto_embarque.bairro_id)
            .where(ponto_embarque.ponto_id == AgendamentoORM.ponto_embarque_id)
            .correlate(AgendamentoORM)
            .scalar_subquery()
        )
        bairro_desembarque = (
            select(ponto_desembarque.bairro_id)
            .where(ponto_desembarque.ponto_id == AgendamentoORM.ponto_desembarque_id)
            .correlate(AgendamentoORM)
            .scalar_subquery()
        )
        ida_filtros = [AgendamentoORM.usa_ida.is_(True)]
        volta_filtros = [AgendamentoORM.usa_volta.is_(True)]
        if faculdade_id is not None:
            ida_filtros.append(AgendamentoORM.ies_destino_id == faculdade_id)
            volta_filtros.append(AgendamentoORM.ies_origem_id == faculdade_id)
        if bairro_id is not None:
            ida_filtros.append(bairro_embarque == bairro_id)
            volta_filtros.append(bairro_desembarque == bairro_id)
        ida_corresponde = and_(*ida_filtros)
        volta_corresponde = and_(*volta_filtros)
        turno_relatorio = case(
            (ida_corresponde, "ida"),
            (volta_corresponde, "volta"),
            (AgendamentoORM.usa_ida.is_(True), "ida"),
            else_="volta",
        )
        faculdade_relatorio_id = case(
            (turno_relatorio == "ida", AgendamentoORM.ies_destino_id),
            else_=AgendamentoORM.ies_origem_id,
        )
        ponto_relatorio_id = case(
            (turno_relatorio == "ida", AgendamentoORM.ponto_embarque_id),
            else_=AgendamentoORM.ponto_desembarque_id,
        )
        faculdade_nome = func.coalesce(
            FaculdadeORM.sigla,
            FaculdadeORM.nome_faculdade,
        )

        query = (
            self.session.query(
                AgendamentoORM.data.label("data"),
                RotaPrincipalORM.id.label("rota_id"),
                RotaPrincipalORM.nome.label("rota"),
                FaculdadeORM.id_faculdade.label("faculdade_id"),
                faculdade_nome.label("faculdade"),
                BairroORM.nome.label("localidade"),
                AgendamentoORM.presenca_status.label("status_presenca"),
                func.count(AgendamentoORM.id).label("quantidade"),
            )
            .select_from(AgendamentoORM)
            .outerjoin(
                AlocacaoAlunoORM,
                and_(
                    AlocacaoAlunoORM.agendamento_id == AgendamentoORM.id,
                    AlocacaoAlunoORM.turno == turno_relatorio,
                    AlocacaoAlunoORM.status == "ALOCADO",
                ),
            )
            .outerjoin(
                AlocacaoDiariaORM,
                and_(
                    AlocacaoDiariaORM.id == AlocacaoAlunoORM.alocacao_diaria_id,
                    AlocacaoDiariaORM.data == AgendamentoORM.data,
                ),
            )
            .outerjoin(
                RotaPrincipalORM,
                RotaPrincipalORM.id == AlocacaoDiariaORM.rota_id,
            )
            .outerjoin(
                FaculdadeORM,
                FaculdadeORM.id_faculdade == faculdade_relatorio_id,
            )
            .outerjoin(
                PontoDeParadaORM,
                PontoDeParadaORM.ponto_id == ponto_relatorio_id,
            )
            .outerjoin(
                BairroORM,
                BairroORM.bairro_id == PontoDeParadaORM.bairro_id,
            )
            .filter(
                AgendamentoORM.status == "ATIVO",
                AgendamentoORM.data >= data_inicio,
                AgendamentoORM.data <= data_fim,
            )
        )

        if faculdade_id is not None:
            query = query.filter(or_(ida_corresponde, volta_corresponde))
        if bairro_id is not None:
            query = query.filter(or_(ida_corresponde, volta_corresponde))

        return [
            {
                "data": row.data,
                "rota_id": row.rota_id,
                "rota": row.rota,
                "faculdade_id": row.faculdade_id,
                "faculdade": row.faculdade,
                "localidade": row.localidade,
                "status_presenca": row.status_presenca,
                "quantidade": row.quantidade,
            }
            for row in query.group_by(
                AgendamentoORM.data,
                RotaPrincipalORM.id,
                RotaPrincipalORM.nome,
                FaculdadeORM.id_faculdade,
                faculdade_nome,
                BairroORM.nome,
                AgendamentoORM.presenca_status,
            )
            .order_by(AgendamentoORM.data.asc(), RotaPrincipalORM.nome.asc())
            .all()
        ]

    def buscar_motoristas(
        self,
        data_inicio: date,
        data_fim: date,
        faculdade_id: int | None = None,
        bairro_id: int | None = None,
    ) -> list[dict]:
        rota_ids = self._rota_ids(faculdade_id, bairro_id)
        query = (
            self.session.query(
                MotoristaORM.id.label("motorista_id"),
                MotoristaORM.nome_completo.label("nome"),
                MotoristaORM.ativo.label("ativo"),
                AlocacaoDiariaORM.data.label("data"),
                RotaPrincipalORM.id.label("rota_id"),
                RotaPrincipalORM.nome.label("rota"),
            )
            .outerjoin(
                AlocacaoDiariaORM,
                and_(
                    AlocacaoDiariaORM.motorista_id == MotoristaORM.id,
                    AlocacaoDiariaORM.data >= data_inicio,
                    AlocacaoDiariaORM.data <= data_fim,
                    (
                        AlocacaoDiariaORM.rota_id.in_(rota_ids)
                        if rota_ids is not None and rota_ids
                        else (
                            AlocacaoDiariaORM.rota_id.is_(None)
                            if rota_ids is not None
                            else True
                        )
                    ),
                ),
            )
            .outerjoin(
                RotaPrincipalORM,
                RotaPrincipalORM.id == AlocacaoDiariaORM.rota_id,
            )
            .order_by(MotoristaORM.nome_completo.asc(), AlocacaoDiariaORM.data.asc())
        )

        return [
            {
                "motorista_id": row.motorista_id,
                "nome": row.nome,
                "ativo": row.ativo,
                "data": row.data,
                "rota_id": row.rota_id,
                "rota": row.rota,
            }
            for row in query.all()
        ]

    def buscar_nome_usuario(self, usuario_id: int) -> str:
        nome = (
            self.session.query(UsuarioORM.nome_completo)
            .filter(UsuarioORM.id == usuario_id)
            .scalar()
        )
        return nome or f"Usuário {usuario_id}"

    def buscar_rotulos_filtros(
        self,
        faculdade_id: int | None,
        bairro_id: int | None,
    ) -> tuple[str | None, str | None]:
        faculdade_nome = None
        bairro_nome = None
        if faculdade_id is not None:
            faculdade = (
                self.session.query(FaculdadeORM)
                .filter(FaculdadeORM.id_faculdade == faculdade_id)
                .first()
            )
            faculdade_nome = (
                f"{faculdade.sigla or faculdade.nome_faculdade}"
                + (
                    f" - {faculdade.campus_faculdade}"
                    if faculdade.campus_faculdade
                    else ""
                )
                if faculdade
                else f"Faculdade {faculdade_id}"
            )
        if bairro_id is not None:
            bairro = (
                self.session.query(BairroORM)
                .filter(BairroORM.bairro_id == bairro_id)
                .first()
            )
            bairro_nome = bairro.nome if bairro else f"Bairro {bairro_id}"
        return faculdade_nome, bairro_nome
