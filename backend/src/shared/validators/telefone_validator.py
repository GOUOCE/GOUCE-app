import re
from src.shared.domain.interfaces.i_telefone_validator import ITelefoneValidator

# DDDs válidos das regiões brasileiras
DDDS_VALIDOS = {
    11, 12, 13, 14, 15, 16, 17, 18, 19, # SP
    21, 22, 24, # RJ
    27, 28, # ES
    31, 32, 33, 34, 35, 37, 38, # MG
    41, 42, 43, 44, 45, 46, # PR
    47, 48, 49, # SC
    51, 53, 54, 55, # RS
    61, # DF
    62, 64, # GO
    63, # TO
    65, 66, # MT
    67, # MS
    68, # AC
    69, # RO
    71, 73, 74, 75, 77, # BA
    79, # SE
    81, 87, # PE
    82, # AL
    83, # PB
    84, # RN
    85, 88, # CE
    86, 89, # PI
    91, 93, 94, # PA
    92, 97, # AM
    95, # RR
    96, # AP
    98, 99, # MA
}


class TelefoneValidator(ITelefoneValidator):
    """
    Valida números de telefone/celular brasileiros com DDD estrito e 11 dígitos (DD9XXXXXXXX).
    """

    def validar_telefone(self, telefone: str) -> bool:
        if not telefone or not isinstance(telefone, str):
            return False

        apenas_numeros = re.sub(r"\D", "", telefone)
        if len(apenas_numeros) != 11:
            return False

        # Rejeitar números com todos os dígitos iguais (ex: 11999999999 ou 00000000000)
        if len(set(apenas_numeros)) == 1:
            return False

        # Validar DDD
        try:
            ddd = int(apenas_numeros[:2])
            if ddd not in DDDS_VALIDOS:
                return False
        except ValueError:
            return False

        # Validar primeiro dígito do celular (deve ser 9)
        if apenas_numeros[2] != "9":
            return False

        return True

    def validar_celular(self, telefone: str) -> bool:
        return self.validar_telefone(telefone)

    def formatar_telefone(self, telefone: str) -> str:
        if not self.validar_telefone(telefone):
            return ""

        apenas_numeros = re.sub(r"\D", "", telefone)
        return f"({apenas_numeros[:2]}) {apenas_numeros[2:7]}-{apenas_numeros[7:]}"
