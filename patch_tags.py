import re

file_path = 'backend/src/modulos/usuarios/interface/http/aluno_router.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'router = APIRouter(prefix="/alunos", tags=["Usuários e Alunos"], route_class=CadastroValidationRoute)',
    'router = APIRouter(prefix="/alunos", tags=["Alunos"], route_class=CadastroValidationRoute)'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
