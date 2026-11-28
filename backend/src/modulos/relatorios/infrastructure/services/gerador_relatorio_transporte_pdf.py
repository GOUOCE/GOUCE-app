from datetime import datetime
from io import BytesIO
from zoneinfo import ZoneInfo

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import Flowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from src.modulos.relatorios.application.dtos.relatorio_transporte_dto import (
    RelatorioTransporteDTO,
)

ROTULOS_TIPO = {
    "geral": "Geral",
    "agendamentos_embarques": "Agendamentos e embarques",
    "motoristas": "Motoristas",
}

MARINHO = colors.HexColor("#153E78")
AZUL_CLARO = colors.HexColor("#E8F0FE")
BORDA = colors.HexColor("#C9D2E3")
VERMELHO = colors.HexColor("#B42318")
CINZA = colors.HexColor("#667085")
FORTALEZA = ZoneInfo("America/Fortaleza")


class CardsResumo(Flowable):
    def __init__(self, itens: list[tuple[str, str, str]], largura: float):
        super().__init__()
        self.itens = itens
        self.width = largura
        self.height = 25 * mm

    def draw(self):
        canvas = self.canv
        gap = 2.2 * mm
        card_width = (self.width - gap * (len(self.itens) - 1)) / len(self.itens)
        for index, (titulo, valor, cor_valor) in enumerate(self.itens):
            x = index * (card_width + gap)
            canvas.setFillColor(colors.HexColor("#F5F8FE"))
            canvas.setStrokeColor(BORDA)
            canvas.roundRect(x, 0, card_width, self.height, 7, fill=1, stroke=1)
            canvas.setFillColor(CINZA)
            self._desenhar_texto(
                canvas,
                titulo,
                x + 2.5 * mm,
                self.height - 4.5 * mm,
                card_width - 5 * mm,
                fonte="Helvetica",
                tamanho=6.7,
                entrelinha=3 * mm,
            )
            canvas.setFillColor(colors.HexColor(cor_valor))
            self._desenhar_texto(
                canvas,
                valor,
                x + 2.5 * mm,
                self.height - 13 * mm,
                card_width - 5 * mm,
                fonte="Helvetica-Bold",
                tamanho=8.4,
                entrelinha=3.8 * mm,
            )

    @staticmethod
    def _desenhar_texto(
        canvas,
        texto: str,
        x: float,
        y: float,
        largura: float,
        fonte: str,
        tamanho: float,
        entrelinha: float,
    ):
        partes = texto.split()
        linhas: list[str] = []
        linha = ""
        for parte in partes:
            candidata = f"{linha} {parte}".strip()
            if stringWidth(candidata, fonte, tamanho) <= largura:
                linha = candidata
            else:
                if linha:
                    linhas.append(linha)
                linha = parte
        if linha:
            linhas.append(linha)
        canvas.setFont(fonte, tamanho)
        for indice, conteudo in enumerate(linhas[:2]):
            canvas.drawString(x, y - indice * entrelinha, conteudo)


class IconeOnibus(Flowable):
    def __init__(self):
        super().__init__()
        self.width = 12 * mm
        self.height = 12 * mm

    def draw(self):
        canvas = self.canv
        canvas.setFillColor(MARINHO)
        canvas.roundRect(0, 0, self.width, self.height, 3 * mm, fill=1, stroke=0)
        canvas.setFillColor(colors.white)
        canvas.roundRect(2.4 * mm, 4 * mm, 7.2 * mm, 4.7 * mm, 1 * mm, fill=1, stroke=0)
        canvas.rect(3 * mm, 6.2 * mm, 2.2 * mm, 1.6 * mm, fill=0, stroke=1)
        canvas.rect(6.7 * mm, 6.2 * mm, 2.2 * mm, 1.6 * mm, fill=0, stroke=1)
        canvas.circle(4 * mm, 3.5 * mm, 0.8 * mm, fill=1, stroke=0)
        canvas.circle(8 * mm, 3.5 * mm, 0.8 * mm, fill=1, stroke=0)


class NumeroPaginasCanvas:
    def __new__(cls, *args, **kwargs):
        from reportlab.pdfgen.canvas import Canvas

        class _Canvas(Canvas):
            def __init__(self, *canvas_args, **canvas_kwargs):
                super().__init__(*canvas_args, **canvas_kwargs)
                self._estados = []

            def showPage(self):
                self._estados.append(dict(self.__dict__))
                self._startPage()

            def save(self):
                total = len(self._estados)
                for pagina, estado in enumerate(self._estados, start=1):
                    self.__dict__.update(estado)
                    self.setFont("Helvetica", 8)
                    self.setFillColor(CINZA)
                    self.drawRightString(
                        A4[0] - 18 * mm,
                        10 * mm,
                        f"Página {pagina} de {total}",
                    )
                    super().showPage()
                super().save()

        return _Canvas(*args, **kwargs)


def gerar_pdf(relatorio: RelatorioTransporteDTO) -> bytes:
    arquivo = BytesIO()
    documento = SimpleDocTemplate(
        arquivo,
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=14 * mm,
        bottomMargin=18 * mm,
        title="Relatório Quantitativo de Transporte Universitário",
        author=relatorio.emitido_por,
    )
    largura = A4[0] - 30 * mm
    estilos = getSampleStyleSheet()
    titulo = ParagraphStyle(
        "RelatorioTitulo",
        parent=estilos["Title"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=17,
        textColor=MARINHO,
        alignment=TA_LEFT,
        spaceAfter=2,
    )
    subtitulo = ParagraphStyle(
        "RelatorioSubtitulo",
        parent=estilos["Normal"],
        fontSize=8,
        leading=10,
        textColor=CINZA,
    )
    secao = ParagraphStyle(
        "RelatorioSecao",
        parent=estilos["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        textColor=MARINHO,
        spaceBefore=5,
        spaceAfter=4,
    )
    pequeno = ParagraphStyle(
        "RelatorioPequeno",
        parent=estilos["Normal"],
        fontSize=6.5,
        leading=8,
    )
    cabecalho = Table(
        [[
            IconeOnibus(),
            [
                Paragraph("Relatório Quantitativo de Transporte Universitário", titulo),
                Paragraph("Controle de Frequência, Demanda e Alocação de Frota", subtitulo),
            ],
        ]],
        colWidths=[15 * mm, largura - 15 * mm],
        style=TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 2),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        ),
    )
    story = [
        cabecalho,
        Spacer(1, 2 * mm),
        Paragraph(
            f"Emitido por: {_escapar(relatorio.emitido_por)}"
            f" &nbsp;&nbsp; Data de emissão: "
            f"{datetime.now(FORTALEZA).strftime('%d/%m/%Y às %H:%M')}",
            pequeno,
        ),
        Spacer(1, 2 * mm),
        _chips(relatorio),
    ]
    if relatorio.filtros.tipo != "motoristas":
        story.extend([
            Spacer(1, 3 * mm),
            Paragraph("Resultado Geral Consolidado", secao),
            CardsResumo(
                [
                    ("Agendamentos", str(relatorio.total_agendamentos), "#153E78"),
                    (
                        "Embarques / Taxa de Comparecimento",
                        f"{relatorio.total_embarques} ({_percentual_texto(relatorio.taxa_comparecimento)})",
                        "#153E78",
                    ),
                    (
                        "Faltas registradas",
                        f"{relatorio.total_faltas} ({_percentual_texto(relatorio.taxa_faltas)})",
                        "#B42318",
                    ),
                    ("Rota com maior demanda", relatorio.rota_maior_demanda, "#153E78"),
                ],
                largura,
            ),
            Spacer(1, 1.5 * mm),
            Paragraph(
                f"Pendentes sem registro: {relatorio.total_pendentes} "
                "(não classificados como falta).",
                pequeno,
            ),
            Paragraph("Detalhamento por Dia, Rota e Localidade", secao),
            _tabela_detalhamento(relatorio, largura, pequeno),
            Paragraph("Quantidade por Faculdade", secao),
            _tabela_categorias(relatorio.por_faculdade, largura, pequeno),
            Paragraph("Quantidade por Bairro", secao),
            _tabela_categorias(relatorio.por_bairro, largura, pequeno),
        ])
    if relatorio.filtros.tipo != "agendamentos_embarques":
        story.extend([
            Paragraph("Controle de Alocação de Motoristas no Período", secao),
            _tabela_motoristas(relatorio, largura, pequeno),
        ])

    def rodape(canvas, _document):
        canvas.saveState()
        canvas.setStrokeColor(BORDA)
        canvas.line(15 * mm, 14 * mm, A4[0] - 15 * mm, 14 * mm)
        canvas.restoreState()

    documento.build(story, onFirstPage=rodape, onLaterPages=rodape, canvasmaker=NumeroPaginasCanvas)
    return arquivo.getvalue()


def _chips(relatorio: RelatorioTransporteDTO) -> Flowable:
    filtros = relatorio.filtros
    return ChipsFiltros([
        f"Tipo: {ROTULOS_TIPO[filtros.tipo]}",
        f"Período: {filtros.data_inicio.strftime('%d/%m/%Y')} a {filtros.data_fim.strftime('%d/%m/%Y')}",
        f"Faculdade: {filtros.faculdade_nome or 'Todas as faculdades'}",
        f"Localidade/Bairro: {filtros.bairro_nome or 'Todos os bairros'}",
    ], A4[0] - 30 * mm)


class ChipsFiltros(Flowable):
    def __init__(self, itens: list[str], largura: float):
        super().__init__()
        self.itens = itens
        self.width = largura
        self.height = 14 * mm

    def draw(self):
        canvas = self.canv
        gap_x = 2 * mm
        gap_y = 1.5 * mm
        chip_width = (self.width - gap_x) / 2
        chip_height = (self.height - gap_y) / 2
        for index, texto in enumerate(self.itens):
            coluna = index % 2
            linha = index // 2
            x = coluna * (chip_width + gap_x)
            y = self.height - (linha + 1) * chip_height - linha * gap_y
            canvas.setFillColor(AZUL_CLARO)
            canvas.setStrokeColor(colors.HexColor("#B8CCF2"))
            canvas.roundRect(x, y, chip_width, chip_height, 2.5 * mm, fill=1, stroke=1)
            canvas.setFillColor(MARINHO)
            canvas.setFont("Helvetica", 7)
            largura_texto = chip_width - 5 * mm
            rotulo = texto
            while rotulo and stringWidth(rotulo, "Helvetica", 7) > largura_texto:
                rotulo = rotulo[:-2].rstrip() + "…"
            canvas.drawString(x + 2.5 * mm, y + 2.1 * mm, rotulo)


def _tabela_detalhamento(relatorio, largura, estilo) -> Table:
    linhas = [[
        "Data", "Rota / Localidade", "Faculdade de Destino", "Agendados",
        "Embarques", "Faltas", "Pendentes", "Taxa de Presença (%)",
    ]]
    for linha in relatorio.linhas:
        linhas.append([
            linha.data.strftime("%d/%m/%Y"),
            Paragraph(
                _escapar(
                    linha.rota
                    + (f" - {', '.join(linha.localidades)}" if linha.localidades else "")
                ),
                estilo,
            ),
            Paragraph(_escapar(", ".join(linha.faculdades_destino) or "—"), estilo),
            str(linha.agendados),
            str(linha.embarques),
            str(linha.faltas),
            str(linha.pendentes),
            _percentual_texto(linha.taxa_presenca),
        ])
    if not relatorio.linhas:
        linhas.append([
            Paragraph(
                relatorio.mensagem or "Nenhum dado encontrado para os filtros informados.",
                estilo,
            )
        ] + [""] * 7)
    larguras = [17 * mm, 31 * mm, 31 * mm, 14 * mm, 16 * mm, 12 * mm, 16 * mm, largura - 137 * mm]
    return _tabela(linhas, larguras, estilo, cor_faltas=True)


def _tabela_motoristas(relatorio, largura, estilo) -> Table:
    estilo_cabecalho = ParagraphStyle(
        "RelatorioCabecalhoMotoristas",
        parent=estilo,
        fontName="Helvetica-Bold",
        fontSize=6.3,
        leading=7.5,
        textColor=MARINHO,
    )
    linhas = [[
        Paragraph("Motorista", estilo_cabecalho),
        Paragraph("Dias Trabalhados no Período", estilo_cabecalho),
        Paragraph("Rotas Alocadas", estilo_cabecalho),
        Paragraph("Dias / Escala de Alocação", estilo_cabecalho),
    ]]
    for motorista in relatorio.motoristas:
        linhas.append([
            Paragraph(_escapar(motorista.nome), estilo),
            str(motorista.dias_trabalhados),
            Paragraph(_escapar(motorista.rotas_alocadas), estilo),
            Paragraph(_escapar(motorista.escala), estilo),
        ])
    if not relatorio.motoristas:
            linhas.append([
                Paragraph(
                    relatorio.mensagem or "Nenhum motorista encontrado",
                    estilo,
                ),
                "",
                "",
                "",
            ])
    larguras = [38 * mm, 27 * mm, 40 * mm, largura - 105 * mm]
    return _tabela(linhas, larguras, estilo)


def _tabela_categorias(categorias, largura, estilo) -> Table:
    linhas = [["Faculdade / Bairro", "Agendados", "Embarques", "Faltas", "Pendentes"]]
    linhas.extend([
        [
            Paragraph(_escapar(item.nome), estilo),
            str(item.agendamentos),
            str(item.embarques),
            str(item.faltas),
            str(item.pendentes),
        ]
        for item in categorias
    ])
    if not categorias:
        linhas.append([Paragraph("Nenhum dado encontrado para os filtros informados.", estilo), "", "", "", ""])
    return _tabela(
        linhas,
        [largura - 58 * mm, 16 * mm, 16 * mm, 12 * mm, 14 * mm],
        estilo,
        cor_faltas=True,
    )


def _tabela(linhas, larguras, estilo, cor_faltas=False) -> Table:
    tabela = Table(
        linhas,
        colWidths=larguras,
        repeatRows=1,
        hAlign="LEFT",
        splitByRow=1,
    )
    comandos = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F5F7FB")),
        ("TEXTCOLOR", (0, 0), (-1, 0), MARINHO),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 6.3),
        ("LEADING", (0, 0), (-1, -1), 7.5),
        ("GRID", (0, 0), (-1, -1), 0.35, BORDA),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FBFCFE")]),
    ]
    if cor_faltas:
        comandos.extend([
            ("TEXTCOLOR", (5, 1), (5, -1), VERMELHO),
            ("FONTNAME", (5, 1), (5, -1), "Helvetica-Bold"),
        ])
    tabela.setStyle(TableStyle(comandos))
    return tabela


def _percentual_texto(valor: float) -> str:
    return f"{valor:.1f}".replace(".", ",") + "%"


def _escapar(valor: str) -> str:
    return (
        valor.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
