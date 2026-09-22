from enum import Enum

class TurnoCursoEnum(str, Enum):
    MATUTINO = "Matutino"
    VESPERTINO = "Vespertino"
    NOTURNO = "Noturno"
    INTEGRAL = "Integral"
