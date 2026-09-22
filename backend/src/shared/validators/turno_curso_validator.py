from enum import Enum


class TurnoCursoEnum(str, Enum):
    MATUTINO = "Matutino"
    VESPERTINO = "Vespertino"
    NOTURNO = "Noturno"
    INTEGRAL = "Integral"


class TurnoCursoValidator:
    """
    Valida e normaliza o turno do curso.
    """

    TURNOS_VALIDOS = {
        "matutino": TurnoCursoEnum.MATUTINO,
        "vespertino": TurnoCursoEnum.VESPERTINO,
        "noturno": TurnoCursoEnum.NOTURNO,
        "integral": TurnoCursoEnum.INTEGRAL,
    }

    @classmethod
    def validar_e_formatar(
        cls, turno: str | None
    ) -> tuple[bool, TurnoCursoEnum | None]:

        if not isinstance(turno, str) or not turno.strip():
            return False, None

        turno_clean = turno.strip().lower()

        turno_enum = cls.TURNOS_VALIDOS.get(turno_clean)

        if turno_enum is None:
            return False, None

        return True, turno_enum