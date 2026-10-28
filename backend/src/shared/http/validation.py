def validation_details(errors: list[dict]) -> list[dict]:
    details = []
    for error in errors:
        location = [
            str(part)
            for part in error.get("loc", ())
            if part not in {"body", "path", "query", "form"}
        ]
        field = ".".join(location) or None
        details.append({
            "field": field,
            "message": validation_message(error, field),
        })
    return details


def validation_message(error: dict, field: str | None) -> str:
    error_type = error.get("type")
    context = error.get("ctx") or {}

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
        if context.get("le") == 100:
            if field in {"assentos", "qtd_assentos", "quantidade_assentos"}:
                return "A quantidade de assentos deve ser no máximo 100."
            if field in {"capacidade_em_pe", "capacidade_maxima", "capacidade_alunos_em_pe", "capacidade_maxima_alunos_em_pe"}:
                return "A capacidade em pé deve ser no máximo 100."
        return f"O valor informado excede o limite máximo permitido (máximo {context.get('le')})."

    msg_customizada = error.get("msg")
    if msg_customizada and not msg_customizada.startswith("Value error,"):
        return msg_customizada
    if msg_customizada and msg_customizada.startswith("Value error, "):
        return msg_customizada.replace("Value error, ", "")

    required_messages = {
        "comprovante_matricula": "Comprovante de matrícula é obrigatório.",
        "nome": "Informe o nome completo.",
    }
    if error_type in {"missing", "field_required"} and field in required_messages:
        return required_messages[field]

    if error_type in {"value_error", "value_error.email"} and field == "email":
        return "Formato de e-mail inválido."

    if error_type == "string_too_short":
        minimum = context.get("min_length")
        if field == "nome":
            return "O primeiro nome deve ter pelo menos 3 letras."
        return f"O campo deve ter pelo menos {minimum} caracteres."

    if error_type == "less_than_equal":
        maximum = context.get("le")
        return f"O valor informado excede o limite máximo permitido (máximo {maximum})."

    return msg_customizada or "Valor inválido."
