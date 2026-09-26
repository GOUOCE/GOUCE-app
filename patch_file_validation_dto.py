import re

file_path = 'backend/src/modulos/usuarios/interface/http/aluno_router.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'return CadastroSucessoDTO(message="Etapa 1 validada com sucesso", data={"status_cadastro": "em_andamento"})',
    'return CadastroSucessoDTO(message="Etapa 1 validada com sucesso", data=CadastroDataDTO(id=0, nome="", email="", status_cadastro="em_andamento"))'
)

content = content.replace(
    'return CadastroSucessoDTO(message="Etapa 4 validada com sucesso", data={"status_cadastro": "em_andamento"})',
    'return CadastroSucessoDTO(message="Etapa 4 validada com sucesso", data=CadastroDataDTO(id=0, nome="", email="", status_cadastro="em_andamento"))'
)

# Also need to import CadastroDataDTO
content = content.replace(
    'ValidarEtapa1CadastroUsuarioDTO,',
    'ValidarEtapa1CadastroUsuarioDTO,\n    CadastroDataDTO,'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
