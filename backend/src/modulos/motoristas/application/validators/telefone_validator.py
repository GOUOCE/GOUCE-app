"""Validação do telefone de motoristas (DDD + 8 ou 9 dígitos)."""

import re

MENSAGEM_TELEFONE_INVALIDO = "Informe um telefone válido com DDD."

# Proteção contra entradas absurdas; telefones reais mascarados têm até 15.
_TAMANHO_MAXIMO = 40
# Parênteses só como par envolvendo o DDD, no início; o restante aceita
# apenas dígitos ASCII, espaço e hífen.
_FORMATO = re.compile(r"(?:\([0-9]{2}\)|[0-9])[0-9 \-]*")


def validar_telefone_br(valor: str) -> str:
    """Valida um telefone brasileiro e devolve o texto como foi informado.

    Aceita DDD (11 a 99) seguido de 8 dígitos (fixo) ou 9 (celular), com ou
    sem máscara. Não aceita prefixo de país. Levanta ``ValueError`` com a
    mensagem única de telefone inválido.
    """
    if (
        not isinstance(valor, str)
        or len(valor) > _TAMANHO_MAXIMO
        or not _FORMATO.fullmatch(valor)
    ):
        raise ValueError(MENSAGEM_TELEFONE_INVALIDO)

    digitos = re.sub(r"[^0-9]", "", valor)
    if len(digitos) not in (10, 11) or int(digitos[:2]) < 11:
        raise ValueError(MENSAGEM_TELEFONE_INVALIDO)
    return valor
