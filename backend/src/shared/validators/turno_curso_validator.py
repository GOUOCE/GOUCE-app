class TurnoCursoValidator:
    """
    Valida e normaliza o turno do curso.
    Opções válidas: Matutino, Vespertino, Noturno, Integral.
    """

    TURNOS_VALIDOS = {
        "matutino": "Matutino",
        "vespertino": "Vespertino",
        "noturno": "Noturno",
        "integral": "Integral",
    }

    def validar_e_formatar(self, turno: str | None) -> str | None:
        if not turno or not isinstance(turno, str) or not turno.strip():
            return None

        turno_clean = turno.strip().lower()
        if turno_clean not in self.TURNOS_VALIDOS:
            raise ValueError(
                "Turno do curso inválido. Opções permitidas: Matutino, Vespertino, Noturno ou Integral"
            )

        return self.TURNOS_VALIDOS[turno_clean]
