import csv
import io
import textwrap
from typing import Any

from src.modulos.relatorios.application.services.relatorio_service import (
    MENSAGEM_SEM_DADOS,
)


def _valor(objeto: Any, nome: str, alternativo: str | None = None) -> Any:
    if not isinstance(objeto, dict):
        return None
    if nome in objeto:
        return objeto[nome]
    if alternativo and alternativo in objeto:
        return objeto[alternativo]
    return None


def _texto(valor: Any) -> str:
    if valor is None:
        return "-"
    if isinstance(valor, (list, tuple, set)):
        return ", ".join(str(item) for item in valor) or "-"
    return str(valor)


def _linhas_relatorio(relatorio: dict) -> list[str]:
    filtros = _valor(relatorio, "filtrosResumo", "filtros_resumo") or {}
    consolidado = _valor(relatorio, "consolidado") or {}
    detalhamento = _valor(relatorio, "detalhamento") or []
    motoristas = _valor(relatorio, "motoristas") or []

    linhas = [
        "GOUCE - Relatório de Agendamentos",
        f"Tipo: {_texto(_valor(filtros, 'tipoLabel', 'tipo_label'))}",
        f"Período: {_texto(_valor(filtros, 'periodoLabel', 'periodo_label'))}",
        f"Faculdade: {_texto(_valor(filtros, 'faculdadeLabel', 'faculdade_label'))}",
        f"Localidade: {_texto(_valor(filtros, 'bairroLabel', 'bairro_label'))}",
        "",
        "CONSOLIDAÇÃO",
        f"Agendamentos: {_texto(_valor(consolidado, 'totalAgendamentos', 'total_agendamentos'))}",
        f"Embarques: {_texto(_valor(consolidado, 'totalEmbarques', 'total_embarques'))}",
        f"Faltas: {_texto(_valor(consolidado, 'totalFaltas', 'total_faltas'))}",
        f"% Comparecimento: {_texto(_valor(consolidado, 'comparecimento'))}",
        f"% Faltas: {_texto(_valor(consolidado, 'porcentagemFaltas', 'porcentagem_faltas'))}",
        f"Rota de maior demanda: {_texto(_valor(consolidado, 'rotaMaiorDemanda', 'rota_maior_demanda'))}",
        "",
    ]

    if detalhamento:
        linhas.append("DETALHAMENTO POR DIA/ROTA")
        for item in detalhamento:
            linhas.append(
                " | ".join(
                    [
                        f"Data: {_texto(_valor(item, 'data'))}",
                        f"Rota: {_texto(_valor(item, 'rota'))}",
                        f"Turno: {_texto(_valor(item, 'turno'))}",
                        f"Faculdade: {_texto(_valor(item, 'faculdade'))}",
                        f"Localidade: {_texto(_valor(item, 'bairro'))}",
                        f"Agendados: {_texto(_valor(item, 'agendados'))}",
                        f"Embarques: {_texto(_valor(item, 'embarques'))}",
                        f"Faltas: {_texto(_valor(item, 'faltas'))}",
                        f"% Comparecimento: {_texto(_valor(item, 'comparecimento'))}",
                        f"% Faltas: {_texto(_valor(item, 'porcentagemFaltas', 'porcentagem_faltas'))}",
                    ]
                )
            )
        linhas.append("")
    else:
        linhas.append(MENSAGEM_SEM_DADOS)
        linhas.append("")

    if motoristas:
        linhas.append("ESCALAS DOS MOTORISTAS")
        for item in motoristas:
            escalas = _valor(item, "escalas") or []
            escalas_texto = "; ".join(
                f"{_texto(_valor(escala, 'data'))} - "
                f"{_texto(_valor(escala, 'rota'))} ({_texto(_valor(escala, 'turno'))})"
                for escala in escalas
            )
            linhas.append(
                " | ".join(
                    [
                        f"Motorista: {_texto(_valor(item, 'nome'))}",
                        f"Dias trabalhados: {_texto(_valor(item, 'diasTrabalhados', 'dias_trabalhados'))}",
                        f"Rotas: {_texto(_valor(item, 'rotas'))}",
                        f"Escalas: {escalas_texto or '-'}",
                    ]
                )
            )

    return linhas


def _csv_bytes(relatorio: dict) -> bytes:
    filtros = _valor(relatorio, "filtrosResumo", "filtros_resumo") or {}
    consolidado = _valor(relatorio, "consolidado") or {}
    detalhamento = _valor(relatorio, "detalhamento") or []
    motoristas = _valor(relatorio, "motoristas") or []

    saida = io.StringIO(newline="")
    escritor = csv.writer(saida, delimiter=";", lineterminator="\r\n")

    escritor.writerow(["GOUCE - Relatório de Agendamentos"])
    escritor.writerow(["Tipo", _texto(_valor(filtros, "tipoLabel", "tipo_label"))])
    escritor.writerow(["Período", _texto(_valor(filtros, "periodoLabel", "periodo_label"))])
    escritor.writerow(
        ["Faculdade", _texto(_valor(filtros, "faculdadeLabel", "faculdade_label"))]
    )
    escritor.writerow(
        ["Bairro", _texto(_valor(filtros, "bairroLabel", "bairro_label"))]
    )
    escritor.writerow([])
    escritor.writerow(["CONSOLIDAÇÃO"])
    escritor.writerow(
        ["Agendamentos", _texto(_valor(consolidado, "totalAgendamentos", "total_agendamentos"))]
    )
    escritor.writerow(
        ["Embarques", _texto(_valor(consolidado, "totalEmbarques", "total_embarques"))]
    )
    escritor.writerow(
        ["Faltas", _texto(_valor(consolidado, "totalFaltas", "total_faltas"))]
    )
    escritor.writerow(
        ["% Comparecimento", _texto(_valor(consolidado, "comparecimento"))]
    )
    escritor.writerow(
        ["% Faltas", _texto(_valor(consolidado, "porcentagemFaltas", "porcentagem_faltas"))]
    )
    escritor.writerow(
        [
            "Rota de maior demanda",
            _texto(_valor(consolidado, "rotaMaiorDemanda", "rota_maior_demanda")),
        ]
    )
    escritor.writerow([])

    if detalhamento:
        escritor.writerow(["DETALHAMENTO POR DIA/ROTA"])
        escritor.writerow(
            [
                "Data",
                "Rota",
                "Turno",
                "Faculdade",
                "Bairro",
                "Agendados",
                "Embarques",
                "Faltas",
                "% Comparecimento",
                "% Faltas",
            ]
        )
        for item in detalhamento:
            escritor.writerow(
                [
                    _texto(_valor(item, "data")),
                    _texto(_valor(item, "rota")),
                    _texto(_valor(item, "turno")),
                    _texto(_valor(item, "faculdade")),
                    _texto(_valor(item, "bairro")),
                    _texto(_valor(item, "agendados")),
                    _texto(_valor(item, "embarques")),
                    _texto(_valor(item, "faltas")),
                    _texto(_valor(item, "comparecimento")),
                    _texto(_valor(item, "porcentagemFaltas", "porcentagem_faltas")),
                ]
            )
        escritor.writerow([])
    else:
        escritor.writerow([MENSAGEM_SEM_DADOS])
        escritor.writerow([])

    if motoristas:
        escritor.writerow(["ESCALAS DOS MOTORISTAS"])
        escritor.writerow(["Motorista", "Dias trabalhados", "Rotas", "Escalas"])
        for item in motoristas:
            escalas = _valor(item, "escalas") or []
            escalas_texto = "; ".join(
                f"{_texto(_valor(escala, 'data'))} - "
                f"{_texto(_valor(escala, 'rota'))} ({_texto(_valor(escala, 'turno'))})"
                for escala in escalas
            )
            escritor.writerow(
                [
                    _texto(_valor(item, "nome")),
                    _texto(_valor(item, "diasTrabalhados", "dias_trabalhados")),
                    _texto(_valor(item, "rotas")),
                    escalas_texto or "-",
                ]
            )

    return saida.getvalue().encode("utf-8-sig")


def _escapar_pdf(texto: str) -> str:
    return texto.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _linhas_paginadas(linhas: list[str]) -> list[list[str]]:
    quebradas: list[str] = []
    for linha in linhas:
        if len(linha) <= 100:
            quebradas.append(linha)
            continue
        quebradas.extend(textwrap.wrap(linha, width=100, break_long_words=True))
        if not quebradas:
            quebradas.append("")

    if not quebradas:
        quebradas = [""]

    return [quebradas[i : i + 54] for i in range(0, len(quebradas), 54)]


def _pdf_bytes(linhas: list[str]) -> bytes:
    paginas = _linhas_paginadas(linhas)
    total_paginas = len(paginas)
    referencia_fonte = 3 + total_paginas * 2

    objetos: dict[int, bytes | str] = {
        1: "<< /Type /Catalog /Pages 2 0 R >>",
        2: (
            "<< /Type /Pages /Kids ["
            + " ".join(f"{3 + indice * 2} 0 R" for indice in range(total_paginas))
            + f"] /Count {total_paginas} >>"
        ),
    }

    for indice, conteudo_pagina in enumerate(paginas):
        numero_pagina = 3 + indice * 2
        numero_conteudo = 4 + indice * 2

        objetos[numero_pagina] = (
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
            "/Resources << /Font << /F1 "
            f"{referencia_fonte} 0 R >> >> /Contents {numero_conteudo} 0 R >>"
        )

        partes = ["BT", "/F1 9 Tf", "40 810 Td", "12 TL"]
        for linha in conteudo_pagina:
            partes.append(f"({_escapar_pdf(linha)}) Tj")
            partes.append("T*")
        partes.append("ET")
        fluxo = "\n".join(partes).encode("latin-1", "replace")

        objetos[numero_conteudo] = (
            f"<< /Length {len(fluxo)} >>\nstream\n".encode("latin-1")
            + fluxo
            + b"\nendstream"
        )

    objetos[referencia_fonte] = (
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
    )

    saida = bytearray(b"%PDF-1.4\n")
    deslocamentos: dict[int, int] = {}
    for numero in sorted(objetos):
        deslocamentos[numero] = len(saida)
        conteudo = objetos[numero]
        if isinstance(conteudo, str):
            conteudo = conteudo.encode("latin-1", "replace")
        saida.extend(f"{numero} 0 obj\n".encode("latin-1"))
        saida.extend(conteudo)
        saida.extend(b"\nendobj\n")

    posicao_xref = len(saida)
    maior_numero = max(objetos)
    saida.extend(f"xref\n0 {maior_numero + 1}\n".encode("latin-1"))
    saida.extend(b"0000000000 65535 f \n")
    for numero in range(1, maior_numero + 1):
        saida.extend(f"{deslocamentos[numero]:010d} 00000 n \n".encode("latin-1"))
    saida.extend(
        (
            f"trailer\n<< /Size {maior_numero + 1} /Root 1 0 R >>\n"
            f"startxref\n{posicao_xref}\n%%EOF\n"
        ).encode("latin-1")
    )

    return bytes(saida)


class RelatorioExportacaoService:
    def exportar(self, relatorio: dict, formato: str) -> tuple[bytes, str, str]:
        if formato not in {"pdf", "csv"}:
            raise ValueError("Formato de exportação inválido.")

        tipo = _texto(_valor(relatorio, "tipo", "tipo")).lower()
        nome_arquivo = f"relatorio-{tipo}.{formato}"

        if formato == "csv":
            return (
                _csv_bytes(relatorio),
                nome_arquivo,
                "Planilha gerada com sucesso.",
            )

        return (
            _pdf_bytes(_linhas_relatorio(relatorio)),
            nome_arquivo,
            "PDF gerado com sucesso.",
        )
