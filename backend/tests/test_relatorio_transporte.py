from datetime import date, time
from io import BytesIO
from zipfile import ZipFile
from unittest import TestCase
from unittest.mock import patch

from fastapi import HTTPException
from openpyxl import load_workbook
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from src.modulos.relatorios.application.dtos.relatorio_transporte_dto import (
    FiltrosRelatorioTransporteDTO,
    RelatorioTransporteDTO,
)
from src.modulos.relatorios.application.services.relatorio_transporte_service import (
    RelatorioTransporteService,
    consolidar_linhas,
    consolidar_motoristas,
    percentual,
)
from src.modulos.relatorios.interface.http import relatorio_transporte_routes as routes
from src.modulos.relatorios.infrastructure.services.gerador_relatorio_transporte_pdf import (
    _tabela_motoristas,
    gerar_pdf,
)
from src.modulos.relatorios.infrastructure.services.gerador_relatorio_transporte_planilha import (
    gerar_planilha,
)
from src.shared.infrastructure.db import Base

# Register every ORM table before creating the isolated SQLite schema.
from src.modulos.arquivos.model.entities import arquivo as _arquivo_model
from src.modulos.auth.domain.entities import password_reset_token as _token_model
from src.modulos.crud_basicos.domain.entities import (
    bairro as _bairro_model,
    faculdade as _faculdade_model,
    onibus as _onibus_model,
    ponto_de_parada as _ponto_model,
)
from src.modulos.usuarios.model.entities import (
    administrador as _admin_model,
    aluno as _aluno_model,
    representante as _representante_model,
    tipo as _tipo_model,
    usuario as _usuario_model,
    usuario_tipo as _usuario_tipo_model,
)
from src.modulos.motoristas.model.entities.motorista import MotoristaORM
from src.modulos.agendamentos.model.entities import (
    agendamento as _agendamento_model,
    feriado as _feriado_model,
)
from src.modulos.alocacao_diaria.model.entities import (
    alocacao as _alocacao_model,
    rodizio_frota as _rodizio_model,
)
from src.modulos.rotas.model.entities import (
    rota_complementar as _rota_complementar_model,
    rota_principal as _rota_model,
)
from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
from src.modulos.crud_basicos.domain.entities.ponto_de_parada import PontoDeParadaORM
from src.modulos.agendamentos.model.entities.agendamento import AgendamentoORM
from src.modulos.alocacao_diaria.model.entities.alocacao import (
    AlocacaoAlunoORM,
    AlocacaoDiariaORM,
)
from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM
from src.modulos.relatorios.infrastructure.repositories.relatorio_transporte_repository import (
    RelatorioTransporteRepository,
)


class RelatorioTransporteServiceTest(TestCase):
    def test_percentual_presenca_tem_uma_casa_decimal(self):
        self.assertEqual(percentual(289, 312), 92.6)
        self.assertEqual(percentual(0, 0), 0.0)

    def test_totais_preservam_pendentes_separados_de_faltas(self):
        agregados = [
            _registro(date(2026, 9, 1), 1, "Linha 01", "PRESENTE", 5),
            _registro(date(2026, 9, 1), 1, "Linha 01", "FALTA", 2),
            _registro(date(2026, 9, 1), 1, "Linha 01", "PENDENTE", 1),
        ]
        linhas = consolidar_linhas(agregados)
        self.assertEqual(
            (linhas[0].agendados, linhas[0].embarques, linhas[0].faltas, linhas[0].pendentes),
            (8, 5, 2, 1),
        )

    def test_rota_maior_demanda_soma_dias_no_periodo(self):
        agregados = [
            _registro(date(2026, 9, 1), 1, "Linha 01", "PRESENTE", 4),
            _registro(date(2026, 9, 2), 1, "Linha 01", "PRESENTE", 3),
            _registro(date(2026, 9, 1), 2, "Linha 02", "PRESENTE", 5),
        ]

        class FakeRepository:
            def buscar_agregados(self, *_):
                return agregados

            def buscar_motoristas(self, *_):
                return []

            def buscar_nome_usuario(self, _):
                return "Administrador"

            def buscar_rotulos_filtros(self, *_):
                return None, None

        relatorio = RelatorioTransporteService(FakeRepository()).gerar(
            FiltrosRelatorioTransporteDTO(
                data_inicio=date(2026, 9, 1),
                data_fim=date(2026, 9, 30),
            ),
            usuario_id=1,
        )
        self.assertEqual(relatorio.rota_maior_demanda, "Linha 01")
        self.assertEqual(relatorio.total_agendamentos, 12)

    def test_resumo_mantem_totais_e_percentuais_coerentes_com_pendentes(self):
        agregados = [
            _registro(date(2026, 9, 1), 1, "Linha 01", "PRESENTE", 2),
            _registro(date(2026, 9, 1), 1, "Linha 01", "FALTA", 2),
            _registro(date(2026, 9, 1), 1, "Linha 01", "PENDENTE", 1),
        ]

        class FakeRepository:
            def buscar_agregados(self, *_):
                return agregados

            def buscar_motoristas(self, *_):
                return []

            def buscar_nome_usuario(self, _):
                return "Administrador"

            def buscar_rotulos_filtros(self, *_):
                return None, None

        relatorio = RelatorioTransporteService(FakeRepository()).gerar(
            FiltrosRelatorioTransporteDTO(
                data_inicio=date(2026, 9, 1),
                data_fim=date(2026, 9, 30),
            ),
            usuario_id=1,
        )
        self.assertEqual(
            (
                relatorio.total_agendamentos,
                relatorio.total_embarques,
                relatorio.total_faltas,
                relatorio.total_pendentes,
            ),
            (5, 2, 2, 1),
        )
        self.assertEqual(relatorio.taxa_comparecimento, 40.0)
        self.assertEqual(relatorio.taxa_faltas, 40.0)

    def test_tipos_separam_detalhamento_de_agendamentos_e_motoristas(self):
        agregados = [
            _registro(date(2026, 9, 1), 1, "Linha 01", "PRESENTE", 2),
            _registro(date(2026, 9, 1), 1, "Linha 01", "FALTA", 1),
        ]
        motoristas = [_motorista(1, "Ana", date(2026, 9, 1), "Linha 01", True)]

        class FakeRepository:
            def buscar_agregados(self, *_):
                return agregados

            def buscar_motoristas(self, *_):
                return motoristas

            def buscar_nome_usuario(self, _):
                return "Administrador"

            def buscar_rotulos_filtros(self, *_):
                return None, None

        service = RelatorioTransporteService(FakeRepository())
        filtros = FiltrosRelatorioTransporteDTO(
            data_inicio=date(2026, 9, 1),
            data_fim=date(2026, 9, 30),
            tipo="agendamentos_embarques",
        )
        relatorio_agendamentos = service.gerar(filtros, usuario_id=1)
        self.assertEqual(len(relatorio_agendamentos.linhas), 1)
        self.assertEqual(relatorio_agendamentos.motoristas, [])
        self.assertEqual(relatorio_agendamentos.por_faculdade[0].agendamentos, 3)
        self.assertEqual(relatorio_agendamentos.por_bairro[0].agendamentos, 3)

        relatorio_motoristas = service.gerar(
            filtros.model_copy(update={"tipo": "motoristas"}),
            usuario_id=1,
        )
        self.assertEqual(relatorio_motoristas.linhas, [])
        self.assertEqual(len(relatorio_motoristas.motoristas), 1)
        self.assertEqual(relatorio_motoristas.total_agendamentos, 0)

    def test_escala_motorista_agrupa_dias_por_rota_e_inclui_sem_alocacao(self):
        registros = [
            _motorista(1, "Ana", date(2026, 9, 7), "Linha 02", True),
            _motorista(1, "Ana", date(2026, 9, 9), "Linha 02", True),
            _motorista(1, "Ana", date(2026, 9, 8), "Linha 01", True),
            _motorista(2, "Paulo", None, None, False),
        ]
        resultado = consolidar_motoristas(registros)
        self.assertEqual(resultado[0].dias_trabalhados, 3)
        self.assertEqual(resultado[0].escala, "Ter (Linha 01) • Seg e Qua (Linha 02)")
        self.assertEqual(resultado[1].dias_trabalhados, 0)
        self.assertEqual(resultado[1].rotas_alocadas, "Sem alocação")
        self.assertEqual(resultado[1].escala, "Sem alocação no período")
        self.assertIn("(Inativo)", resultado[1].nome)


class RelatorioTransporteEndpointTest(TestCase):
    @patch.object(routes, "gerar_pdf", return_value=b"%PDF-1.4 test")
    def test_exporta_pdf_com_nome_e_headers_corretos(self, _pdf):
        response = routes.exportar_relatorio_transporte(
            data_inicio=date(2026, 9, 1),
            data_fim=date(2026, 9, 30),
            tipo="geral",
            formato="pdf",
            faculdade_id=None,
            localidade_id=None,
            bairro_id=None,
            service=_FakeReportService(),
            user={"current_user_id": 7},
        )
        self.assertEqual(response.media_type, "application/pdf")
        self.assertIn(
            "attachment; filename=\"relatorio-transporte-universitario_"
            "2026-09-01_2026-09-30.pdf\"",
            response.headers["Content-Disposition"],
        )
        self.assertEqual(response.body, b"%PDF-1.4 test")

    @patch.object(routes, "gerar_planilha", return_value=b"xlsx")
    def test_exporta_planilha_com_mime_e_nome_corretos(self, gerar_planilha_mock):
        response = routes.exportar_relatorio_transporte(
            data_inicio=date(2026, 9, 1),
            data_fim=date(2026, 9, 30),
            tipo="motoristas",
            formato="planilha",
            faculdade_id=None,
            localidade_id=None,
            bairro_id=None,
            service=_FakeReportService(),
            user={"current_user_id": 7},
        )
        self.assertEqual(
            response.media_type,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        self.assertIn(".xlsx", response.headers["Content-Disposition"])
        self.assertEqual(response.body, b"xlsx")
        gerar_planilha_mock.assert_called_once()

    def test_consulta_devolve_totais_zerados_e_mensagem_quando_vazia(self):
        response = routes.consultar_relatorio_transporte(
            data_inicio=date(2026, 9, 1),
            data_fim=date(2026, 9, 30),
            tipo="geral",
            faculdade_id=None,
            localidade_id=None,
            bairro_id=None,
            service=_FakeReportService(_report(mensagem="Nenhum dado encontrado para os filtros informados.")),
            user={"current_user_id": 7},
        )
        self.assertEqual(response.total_agendamentos, 0)
        self.assertEqual(
            response.mensagem,
            "Nenhum dado encontrado para os filtros informados.",
        )

    def test_rejeita_periodo_invertido(self):
        with self.assertRaises(HTTPException) as error:
            routes.consultar_relatorio_transporte(
                data_inicio=date(2026, 9, 30),
                data_fim=date(2026, 9, 1),
                tipo="geral",
                faculdade_id=None,
                localidade_id=None,
                bairro_id=None,
                service=_FakeReportService(),
                user={"current_user_id": 7},
            )
        self.assertEqual(error.exception.status_code, 422)


class RelatorioTransportePdfTest(TestCase):
    def test_cabecalho_dias_trabalhados_quebra_linha_sem_sobrepor_coluna(self):
        tabela = _tabela_motoristas(_report(), 180 * mm, getSampleStyleSheet()["Normal"])

        cabecalho = tabela._cellvalues[0][1]
        largura_disponivel = tabela._colWidths[1] - 6
        _, altura = cabecalho.wrap(largura_disponivel, 100 * mm)

        self.assertIsInstance(cabecalho, Paragraph)
        self.assertGreater(altura, cabecalho.style.leading)

    def test_gera_pdf_com_periodo_sem_registros(self):
        relatorio = RelatorioTransporteDTO(
            filtros=FiltrosRelatorioTransporteDTO(
                data_inicio=date(2026, 9, 1),
                data_fim=date(2026, 9, 30),
            ),
            emitido_por="Administradora",
            emitido_em=date(2026, 9, 30),
            total_agendamentos=0,
            total_embarques=0,
            total_faltas=0,
            total_pendentes=0,
            taxa_comparecimento=0,
            taxa_faltas=0,
            rota_maior_demanda="Sem rota",
            linhas=[],
            motoristas=[],
            por_faculdade=[],
            por_bairro=[],
        )
        self.assertTrue(gerar_pdf(relatorio).startswith(b"%PDF-"))

    def test_gera_planilha_com_as_tabelas_do_relatorio(self):
        arquivo = gerar_planilha(_report())
        with ZipFile(BytesIO(arquivo)) as zip_file:
            self.assertIn("xl/workbook.xml", zip_file.namelist())
        workbook = load_workbook(BytesIO(arquivo), read_only=True)
        self.assertEqual(
            workbook.sheetnames,
            ["Resumo", "Agendamentos", "Por faculdade", "Por bairro", "Motoristas"],
        )


class RelatorioTransporteRepositoryTest(TestCase):
    def test_filtros_de_faculdade_e_bairro_incluem_trecho_de_volta(self):
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        try:
            with Session(engine) as session:
                bairro_ida = BairroORM(nome="Centro", ativo=True)
                bairro_volta = BairroORM(nome="Campo Velho", ativo=True)
                faculdade_ida = FaculdadeORM(
                    nome_faculdade="Faculdade Ida",
                    sigla="IDA",
                    campus_faculdade="Campus A",
                    ativo=True,
                )
                faculdade_volta = FaculdadeORM(
                    nome_faculdade="Faculdade Volta",
                    sigla="VOLTA",
                    campus_faculdade="Campus B",
                    ativo=True,
                )
                session.add_all(
                    [bairro_ida, bairro_volta, faculdade_ida, faculdade_volta]
                )
                session.flush()
                ponto_ida = PontoDeParadaORM(
                    nome="Ponto de ida",
                    bairro=bairro_ida,
                    ativo=True,
                )
                ponto_volta = PontoDeParadaORM(
                    nome="Ponto de volta",
                    bairro=bairro_volta,
                    ativo=True,
                )
                rota_ida = RotaPrincipalORM(
                    nome="Linha Ida",
                    horario_saida=time(7),
                    horario_retorno=time(18),
                    ativo=True,
                    bairros=[bairro_ida],
                    faculdades_ida=[faculdade_ida],
                )
                rota_volta = RotaPrincipalORM(
                    nome="Linha Volta",
                    horario_saida=time(7),
                    horario_retorno=time(18),
                    ativo=True,
                    bairros=[bairro_volta],
                    faculdades_volta=[faculdade_volta],
                )
                motorista = MotoristaORM(
                    nome_completo="Motorista",
                    telefone="85999999999",
                    telefone_hash="relatorio-test",
                    ativo=True,
                )
                session.add_all([ponto_ida, ponto_volta, rota_ida, rota_volta, motorista])
                session.flush()
                agendamento = AgendamentoORM(
                    aluno_id=1,
                    data=date(2026, 9, 1),
                    usa_ida=True,
                    usa_volta=True,
                    ponto_embarque_id=ponto_ida.ponto_id,
                    ies_destino_id=faculdade_ida.id_faculdade,
                    ponto_desembarque_id=ponto_volta.ponto_id,
                    ies_origem_id=faculdade_volta.id_faculdade,
                    status="ATIVO",
                    presenca_status="PRESENTE",
                )
                session.add(agendamento)
                session.flush()
                for rota, turno in (
                    (rota_ida, "ida"),
                    (rota_volta, "volta"),
                ):
                    alocacao = AlocacaoDiariaORM(
                        rota_id=rota.id,
                        onibus_id=f"TEST-{turno}",
                        data=agendamento.data,
                        motorista_id=motorista.id,
                        turno=turno,
                    )
                    session.add(alocacao)
                    session.flush()
                    session.add(
                        AlocacaoAlunoORM(
                            alocacao_diaria_id=alocacao.id,
                            agendamento_id=agendamento.id,
                            turno=turno,
                            tipo_lugar="sentado",
                            status="ALOCADO",
                        )
                    )
                session.flush()

                resultado = RelatorioTransporteRepository(session).buscar_agregados(
                    date(2026, 9, 1),
                    date(2026, 9, 30),
                    faculdade_id=faculdade_volta.id_faculdade,
                    bairro_id=bairro_volta.bairro_id,
                )
                self.assertEqual(len(resultado), 1)
                self.assertEqual(resultado[0]["rota"], "Linha Volta")
                self.assertEqual(resultado[0]["faculdade"], "VOLTA")
                self.assertEqual(resultado[0]["localidade"], "Campo Velho")
        finally:
            engine.dispose()


class _FakeReportService:
    def __init__(self, relatorio=None):
        self.relatorio = relatorio or _report()

    def gerar(self, *_):
        return self.relatorio


def _report(mensagem=None):
    return RelatorioTransporteDTO(
        filtros=FiltrosRelatorioTransporteDTO(
            data_inicio=date(2026, 9, 1),
            data_fim=date(2026, 9, 30),
        ),
        mensagem=mensagem,
        emitido_por="Administradora",
        emitido_em=date(2026, 9, 30),
        total_agendamentos=0,
        total_embarques=0,
        total_faltas=0,
        total_pendentes=0,
        taxa_comparecimento=0,
        taxa_faltas=0,
        rota_maior_demanda="Sem rota",
        linhas=[],
        motoristas=[],
        por_faculdade=[],
        por_bairro=[],
    )


def _registro(data, rota_id, rota, status, quantidade):
    return {
        "data": data,
        "rota_id": rota_id,
        "rota": rota,
        "faculdade_id": 1,
        "faculdade": "UFC",
        "localidade": "Centro",
        "status_presenca": status,
        "quantidade": quantidade,
    }


def _motorista(motorista_id, nome, data, rota, ativo):
    return {
        "motorista_id": motorista_id,
        "nome": nome,
        "ativo": ativo,
        "data": data,
        "rota_id": 1 if rota else None,
        "rota": rota,
    }
