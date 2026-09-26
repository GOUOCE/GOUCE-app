import re

file_path = 'backend/src/modulos/usuarios/interface/http/aluno_router.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the routing
content = re.sub(
    r'router = APIRouter.*?\n.*?aluno_router = APIRouter.*?\nrouter\.include_router\(aluno_router\)',
    'router = APIRouter(prefix="/alunos", tags=["Usuários e Alunos"], route_class=CadastroValidationRoute)',
    content,
    flags=re.MULTILINE | re.DOTALL
)

content = content.replace('@aluno_router.post', '@router.post')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
