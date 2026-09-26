import re

file_path = 'backend/src/modulos/usuarios/application/dtos/usuario_dto.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add transgenero to CadastroUsuarioDTO
if 'transgenero' not in content.split('class CadastroUsuarioDTO(BaseModel):')[1]:
    content = content.replace(
        'identificacao_genero: str | None = None',
        'identificacao_genero: str | None = None\\n    transgenero: str | bool | None = None'
    )

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
