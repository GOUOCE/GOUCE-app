import re

file_path = 'backend/src/modulos/usuarios/interface/http/aluno_router.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'def validar_regras_arquivo[\s\S]*?return None\n',
    '',
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
