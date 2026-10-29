import re
from typing import Optional

# Mesma regra do app (frontend/src/schemas/alunoSchema.ts → nomeSchema).
# Se mudar uma, mude a outra: regras diferentes fazem o app aprovar o nome no
# Passo 1 e a API recusar só no envio final.
_PARTE_VALIDA = re.compile(r"^[A-Za-zÀ-ÖØ-öø-ÿ'\-.]+$")
_SO_LETRAS = re.compile(r"[^A-Za-zÀ-ÿ]")


def normalizar_nome(nome: Optional[str]) -> str:
    """Remove espaços extras e troca o apóstrofo tipográfico (’) pelo simples (')."""
    return re.sub(r"\s+", " ", (nome or "").strip()).replace("’", "'")


def validar_nome_completo(nome: Optional[str]) -> Optional[str]:
    """Retorna a mensagem de erro do nome completo, ou None se ele for válido."""
    nome = normalizar_nome(nome)
    if len(nome) < 3:
        return "Informe seu nome completo"
    if len(nome) > 150:
        return "O nome deve ter no máximo 150 caracteres"

    partes = nome.split(" ")
    if not all(_PARTE_VALIDA.match(parte) for parte in partes):
        return "Use apenas letras, espaços, hífen ou apóstrofo"

    if len(partes) < 2:
        return "Informe nome e sobrenome completos"
    primeira = _SO_LETRAS.sub("", partes[0])
    ultima = _SO_LETRAS.sub("", partes[-1])
    if len(primeira) < 2 or len(ultima) < 2:
        return "Informe nome e sobrenome completos"

    return None
