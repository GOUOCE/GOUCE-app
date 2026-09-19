import re


class SenhaValidator:
    """
    Valida a força e os requisitos de complexidade da senha.
    Regras:
    - Mínimo de 6 caracteres, máximo de 128.
    - Deve conter pelo menos uma letra (maiúscula ou minúscula).
    - Deve conter pelo menos um número.
    - Não pode conter apenas caracteres repetidos (ex: "111111" ou "aaaaaa").
    """

    def validar_senha(self, senha: str) -> tuple[bool, str]:
        if not senha or not isinstance(senha, str):
            return False, "A senha é obrigatória"

        senha_clean = senha.strip()
        if len(senha_clean) < 8:
            return False, "A senha deve ter pelo menos 8 caracteres"

        if len(senha_clean) > 128:
            return False, "A senha não pode exceder 128 caracteres"

        if len(set(senha_clean)) == 1:
            return False, "A senha não pode conter apenas caracteres repetidos"

        if not re.search(r"[A-Za-zÀ-ÿ]", senha_clean):
            return False, "A senha deve conter pelo menos uma letra"

        if not re.search(r"[0-9]", senha_clean):
            return False, "A senha deve conter pelo menos um número"

        return True, ""
