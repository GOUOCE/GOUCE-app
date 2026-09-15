import re
from datetime import date, datetime


class DataNascimentoValidator:
    """
    Valida e converte data de nascimento nos formatos:
    - 'DD/MM/YYYY' (ex: '18/03/2005')
    - 'YYYY/MM/DD' (ex: '2005/03/18')
    - 'YYYY-MM-DD' (ex: '2005-03-18')
    - 'DD-MM-YYYY' (ex: '18-03-2005')
    - Integer 'AAAAMMDD' (ex: 20050318) ou Timestamp Unix
    - date ou datetime
    """

    def validar_e_converter(self, valor: str | int | float | date | datetime) -> date:
        if valor is None or valor == 0 or valor == "":
            raise ValueError("Data de nascimento é obrigatória")

        dt = None

        if isinstance(valor, datetime):
            dt = valor.date()
        elif isinstance(valor, date):
            dt = valor
        elif isinstance(valor, (int, float)):
            val_str = str(int(valor))
            if len(val_str) == 8:  # Formato AAAAMMDD
                try:
                    dt = datetime.strptime(val_str, "%Y%m%d").date()
                except ValueError:
                    pass
            if not dt and valor > 0:  # Timestamp Unix
                try:
                    dt = datetime.fromtimestamp(valor).date()
                except (ValueError, OverflowError, OSError):
                    pass
        elif isinstance(valor, str):
            val_clean = valor.strip()
            # Formato DD/MM/YYYY ou DD-MM-YYYY
            if re.match(r"^\d{2}[/-]\d{2}[/-]\d{4}$", val_clean):
                sep = "/" if "/" in val_clean else "-"
                try:
                    dt = datetime.strptime(val_clean, f"%d{sep}%m{sep}%Y").date()
                except ValueError:
                    raise ValueError("Data de nascimento inválida (verifique dia e mês)")
            # Formato YYYY/MM/DD ou YYYY-MM-DD
            elif re.match(r"^\d{4}[/-]\d{2}[/-]\d{2}$", val_clean):
                sep = "/" if "/" in val_clean else "-"
                try:
                    dt = datetime.strptime(val_clean, f"%Y{sep}%m{sep}%d").date()
                except ValueError:
                    raise ValueError("Data de nascimento inválida (verifique dia e mês)")

        if not dt:
            raise ValueError("Formato de data de nascimento inválido. Use o formato DD/MM/AAAA ou AAAA-MM-DD")

        # Validação de limite de idade
        hoje = date.today()
        if dt > hoje:
            raise ValueError("Data de nascimento não pode ser no futuro")

        idade = hoje.year - dt.year - ((hoje.month, hoje.day) < (dt.month, dt.day))
        if idade < 12 or idade > 120:
            raise ValueError(f"Idade inválida ({idade} anos). Deve ter entre 12 e 120 anos")

        return dt

    def converter_para_inteiro(self, valor: str | int | float | date | datetime) -> int:
        dt = self.validar_e_converter(valor)
        return int(dt.strftime("%Y%m%d"))
