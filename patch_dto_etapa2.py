import re

file_path = 'backend/src/modulos/usuarios/application/dtos/usuario_dto.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update ValidarEtapa2CadastroUsuarioDTO
content = content.replace(
    'transgenero: bool | None = None',
    'transgenero: str | bool | None = None'
)
content = content.replace(
    'tem_filhos: bool | None = None',
    'tem_filhos: str | bool | None = None'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
