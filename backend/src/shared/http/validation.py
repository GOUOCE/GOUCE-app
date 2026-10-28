def validation_details(errors: list[dict]) -> list[dict]:
    details = []

    aliases = {
        "nome_bairro": "nome",
    }

    for error in errors:
        location = [
            str(part)
            for part in error.get("loc", ())
            if part not in {"body", "path", "query", "form"}
        ]

        field = ".".join(location) or None

        if field:
            partes = field.split(".")
            partes = [aliases.get(parte, parte) for parte in partes]
            field = ".".join(partes)

        details.append({
            "field": field,
            "message": validation_message(error, field),
        })

    return details



def validation_message(error: dict, field: str | None) -> str:
    error_type = error.get("type")
    context = error.get("ctx") or {}
    msg_customizada = error.get("msg") or ""

    # Remove o prefixo adicionado pelo Pydantic aos ValueError.
    if msg_customizada.startswith("Value error, "):
        msg_customizada = msg_customizada.removeprefix("Value error, ").strip()

    # Mensagens específicas para os campos de bairro.
    if error_type in {"missing", "field_required"}:
        if field == "nome":
            return "O nome do bairro é obrigatório."
        if field == "pontos_de_parada":
            return "Ao menos um ponto de parada é obrigatório."

    # Preserva as mensagens definidas nos validadores personalizados.
    if msg_customizada and error_type in {
        "value_error",
        "assertion_error",
        "value_error.email",
    }:
        return msg_customizada

    # Tipos de dados inválidos.
    tipo_msg = {
        "int_from_float": "Informe um número inteiro válido.",
        "int_parsing": "Informe um número válido.",
        "int_type": "Informe um número válido.",
        "bool_parsing": "Informe um valor booleano válido.",
        "string_type": "Informe um texto válido.",
    }.get(error_type)

    if tipo_msg:
        return tipo_msg

    if error_type == "less_than_equal":
        maximum = context.get("le")

        if maximum == 100:
            if field in {
                "assentos",
                "qtd_assentos",
                "quantidade_assentos",
            }:
                return "A quantidade de assentos deve ser no máximo 100."

            if field in {
                "capacidade_em_pe",
                "capacidade_maxima",
                "capacidade_alunos_em_pe",
                "capacidade_maxima_alunos_em_pe",
            }:
                return "A capacidade em pé deve ser no máximo 100."

        return (
            f"O valor informado excede o limite máximo permitido "
            f"(máximo {maximum})."
        )

    if field in {"bairro_id", "faculdade_id"}:
        return "Informe o ID inteiro positivo da localidade cadastrada."

    if error_type == "value_error.email" or field == "email":
        if error_type in {"value_error", "value_error.email"}:
            return "Formato de e-mail inválido."

    if error_type == "string_too_short":
        minimum = context.get("min_length")

        if field == "nome":
            return "O nome do bairro deve ter pelo menos 3 caracteres."

        if field == "pontos_de_parada":
            return "Informe pelo menos um ponto de parada."

        return f"O campo deve ter pelo menos {minimum} caracteres."

    if error_type == "string_too_long":
        maximum = context.get("max_length")
        return f"O campo deve ter no máximo {maximum} caracteres."

    if error_type == "too_short" and field == "pontos_de_parada":
        return "Ao menos um ponto de parada é obrigatório."

    if error_type == "too_long":
        maximum = context.get("max_length")
        return f"O campo deve ter no máximo {maximum} itens."

    if error_type == "less_than_equal":
        maximum = context.get("le")
        return f"O valor informado excede o limite máximo permitido (máximo {maximum})."

    return msg_customizada or "Valor inválido."
