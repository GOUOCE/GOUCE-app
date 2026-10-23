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

    return {
        "int_parsing": "Informe um número válido.",
        "bool_parsing": "Informe um valor booleano válido.",
        "string_type": "Informe um texto válido.",
    }.get(error_type, "Valor inválido.")
