import re
from typing import Annotated

from pydantic import BeforeValidator


def validar_id_localidade(valor: object) -> int:
    if isinstance(valor, bool) or not isinstance(valor, (int, str)):
        raise ValueError("Informe o ID inteiro positivo da localidade cadastrada.")
    texto = str(valor).strip()
    if not re.fullmatch(r"[0-9]{1,10}", texto) or not 0 < int(texto) <= 2147483647:
        raise ValueError("Informe o ID inteiro positivo da localidade cadastrada.")
    return int(texto)


IdLocalidade = Annotated[int, BeforeValidator(validar_id_localidade)]
