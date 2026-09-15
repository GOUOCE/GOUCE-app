import re
from datetime import date


class PeriodoIngressoValidator:
    """
    Valida o período de ingresso de alunos (ex: "2025.1", "2024.2").
    Regras:
    - Formato: AAAA.S (ex: 2025.1) onde AAAA é o ano (4 dígitos) e S é o semestre (1 ou 2).
    - Não pode ser maior do que o ano e semestre atual.
    """

    def validar_e_formatar(self, periodo: str) -> str:
        if not periodo or not isinstance(periodo, str) or not periodo.strip():
            return ""

        periodo_clean = periodo.strip()
        match = re.match(r"^(\d{4})[\.\/\-]([1-2])$", periodo_clean)
        if not match:
            raise ValueError("Formato de período de ingresso inválido. Use o padrão AAAA.S (ex: 2025.1 ou 2024.2)")

        ano_ingresso = int(match.group(1))
        semestre_ingresso = int(match.group(2))

        hoje = date.today()
        ano_atual = hoje.year
        semestre_atual = 1 if hoje.month <= 6 else 2

        if ano_ingresso > ano_atual or (ano_ingresso == ano_atual and semestre_ingresso > semestre_atual):
            raise ValueError(f"Período de ingresso ({ano_ingresso}.{semestre_ingresso}) não pode ser no futuro")

        if ano_ingresso < (ano_atual - 50):
            raise ValueError(f"Ano de ingresso ({ano_ingresso}) muito antigo")

        return f"{ano_ingresso}.{semestre_ingresso}"
