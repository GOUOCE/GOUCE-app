import re

file_path = 'backend/src/modulos/usuarios/interface/http/aluno_router.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make aluno_router use the prefix and tags
content = content.replace('aluno_router = APIRouter(route_class=CadastroValidationRoute)', 'aluno_router = APIRouter(prefix="/alunos", tags=["Usuários e Alunos"], route_class=CadastroValidationRoute)\nrouter.include_router(aluno_router)')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
