import re

file_path = 'backend/src/modulos/usuarios/application/dtos/usuario_dto.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace ValidarEtapa1CadastroUsuarioDTO with the 4 new ones
new_dtos = """
class ValidarEtapa1CadastroUsuarioDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id_foto_aluno: str | None = Field(default=None, max_length=36)
    nome: str = Field(min_length=3, max_length=150)
    data_nascimento: str | int | float | date | datetime | None = None
    email: EmailStr
    senha: str = Field(min_length=6, max_length=128)
    confirmar_senha: str = Field(min_length=6, max_length=128)

class ValidarEtapa2CadastroUsuarioDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    raca: str | None = Field(default=None, max_length=50)
    identificacao_sexual: str | None = Field(default=None, max_length=100)
    identificacao_genero: str | None = None
    transgenero: bool | None = None
    tem_filhos: bool | None = None

class ValidarEtapa3CadastroUsuarioDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    bairro_id: str | None = Field(default=None, max_length=20)
    telefone: str | None = Field(default=None, max_length=20)
    faculdade_id: str = Field(min_length=1, max_length=150)
    curso: str = Field(min_length=1, max_length=150)
    campus: str | None = Field(default=None, max_length=150)
    periodo_ingresso: str | None = Field(default=None, max_length=20)
    turno_curso: TurnoCursoEnum | str | None = None
    semestre_atual: int | None = None

class ValidarEtapa4CadastroUsuarioDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id_comprovante_matricula: str = Field(default="", max_length=255)
    id_comprovante_residencia: str = Field(default="", max_length=255)
"""

content = re.sub(
    r'class ValidarEtapa1CadastroUsuarioDTO\(BaseModel\):[\s\S]*?(?=class CadastroUsuarioDTO\(BaseModel\):)',
    new_dtos + "\n",
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
