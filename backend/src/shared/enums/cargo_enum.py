from enum import Enum

class CargoEnum(str, Enum):
    ADMINISTRADOR = "administrador"
    ALUNO = "aluno"
    SUPERVISOR = "supervisor"
