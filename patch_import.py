import re

file_path = 'backend/src/modulos/usuarios/application/dtos/usuario_dto.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'from src.shared.enums.status_cadastro_enum import StatusCadastroEnum',
    'from src.shared.enums.status_cadastro_enum import StatusCadastroEnum\nfrom src.shared.enums.turno_curso_enum import TurnoCursoEnum'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
