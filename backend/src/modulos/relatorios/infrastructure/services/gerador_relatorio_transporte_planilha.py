from io import BytesIO

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill

from src.modulos.relatorios.application.dtos.relatorio_transporte_dto import (
    RelatorioTransporteDTO,
)

ROTULOS_TIPO = {
    "geral": "Geral",
    "agendamentos_embarques": "Agendamentos e embarques",
    "motoristas": "Motoristas",
}
MARINHO = "153E78"
AZUL_CLARO = "E8F0FE"


def gerar_planilha(relatorio: RelatorioTransporteDTO) -> bytes:
    workbook = Workbook()
    resumo = workbook.active
    resumo.title = "Resumo"
    filtros = relatorio.filtros
    linhas_resumo = [
        ["Relatório Quantitativo de Transporte Universitário"],
        ["Tipo", ROTULOS_TIPO[filtros.tipo]],
        ["Data inicial", filtros.data_inicio.strftime("%d/%m/%Y")],
        ["Data final", filtros.data_fim.strftime("%d/%m/%Y")],
        ["Faculdade", filtros.faculdade_nome or "Todas as faculdades"],
        ["Bairro", filtros.bairro_nome or "Todos os bairros"],
        ["Agendamentos", relatorio.total_agendamentos],
        ["Embarques", relatorio.total_embarques],
        ["Taxa de comparecimento (%)", relatorio.taxa_comparecimento],
        ["Faltas", relatorio.total_faltas],
        ["Taxa de faltas (%)", relatorio.taxa_faltas],
        ["Pendentes", relatorio.total_pendentes],
        ["Rota com maior demanda", relatorio.rota_maior_demanda],
        ["Mensagem", relatorio.mensagem or ""],
    ]
    for row in linhas_resumo:
        resumo.append(row)
    _formatar_planilha(resumo)

    if filtros.tipo != "motoristas":
        detalhamento = workbook.create_sheet("Agendamentos")
        detalhamento.append([
            "Data",
            "Rota",
            "Bairros",
            "Faculdades",
            "Agendados",
            "Embarques",
            "Faltas",
            "Pendentes",
            "Taxa de presença (%)",
        ])
        for linha in relatorio.linhas:
            detalhamento.append([
                linha.data.strftime("%d/%m/%Y"),
                linha.rota,
                ", ".join(linha.localidades),
                ", ".join(linha.faculdades_destino),
                linha.agendados,
                linha.embarques,
                linha.faltas,
                linha.pendentes,
                linha.taxa_presenca,
            ])
        if not relatorio.linhas:
            detalhamento.append([relatorio.mensagem or "Nenhum dado encontrado"])
        _formatar_planilha(detalhamento)

        por_faculdade = workbook.create_sheet("Por faculdade")
        _adicionar_totais_categoria(por_faculdade, "Faculdade", relatorio.por_faculdade)
        _formatar_planilha(por_faculdade)

        por_bairro = workbook.create_sheet("Por bairro")
        _adicionar_totais_categoria(por_bairro, "Bairro", relatorio.por_bairro)
        _formatar_planilha(por_bairro)

    if filtros.tipo != "agendamentos_embarques":
        motoristas = workbook.create_sheet("Motoristas")
        motoristas.append([
            "Motorista",
            "Dias trabalhados no período",
            "Rotas alocadas",
            "Dias / escala de alocação",
        ])
        for motorista in relatorio.motoristas:
            motoristas.append([
                motorista.nome,
                motorista.dias_trabalhados,
                motorista.rotas_alocadas,
                motorista.escala,
            ])
        if not relatorio.motoristas:
            motoristas.append([relatorio.mensagem or "Nenhum dado encontrado"])
        _formatar_planilha(motoristas)

    arquivo = BytesIO()
    workbook.save(arquivo)
    return arquivo.getvalue()


def _adicionar_totais_categoria(worksheet, cabecalho: str, categorias):
    worksheet.append([
        cabecalho, "Agendamentos", "Embarques", "Faltas", "Pendentes",
    ])
    for item in categorias:
        worksheet.append([
            item.nome,
            item.agendamentos,
            item.embarques,
            item.faltas,
            item.pendentes,
        ])
    if not categorias:
        worksheet.append(["Nenhum dado encontrado"])


def _formatar_planilha(worksheet):
    worksheet.freeze_panes = "A2"
    worksheet.auto_filter.ref = worksheet.dimensions
    for cell in worksheet[1]:
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor=MARINHO)
    for row in worksheet.iter_rows():
        for cell in row:
            cell.alignment = Alignment(vertical="top", wrap_text=True)
    for column in worksheet.columns:
        width = max(
            (len(str(cell.value or "")) for cell in column),
            default=10,
        )
        worksheet.column_dimensions[column[0].column_letter].width = min(
            max(width + 2, 14),
            48,
        )
