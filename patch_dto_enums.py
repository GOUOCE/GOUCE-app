import re, pathlib

file_path = pathlib.Path('backend/src/modulos/usuarios/application/dtos/usuario_dto.py')
content = file_path.read_text(encoding='utf-8')

# Insert import for enums at top after other imports
if 'from src.shared.enums.demograficos_enum' not in content:
    content = re.sub(r'(from src\.shared\.enums\.turno_curso_enum import TurnoCursoEnum\n)', r'\1from src.shared.enums.demograficos_enum import (\n    IdentidadeSexualEnum,\n    RacaEnum,\n    IdentificacaoGeneroEnum,\n    SimNaoPrefiroEnum,\n)\n', content)

# Update ValidarEtapa2CadastroUsuarioDTO field types
pattern = r'class ValidarEtapa2CadastroUsuarioDTO\(BaseModel\):([\s\S]*?)\n\n'
match = re.search(pattern, content)
if match:
    block = match.group(1)
    # replace field lines
    block = re.sub(r'raca: str \| None = Field\(default=None, max_length=50\)', 'raca: RacaEnum | None = Field(default=None)', block)
    block = re.sub(r'identificacao_sexual: str \| None = Field\(default=None, max_length=100\)', 'identificacao_sexual: IdentidadeSexualEnum | None = Field(default=None)', block)
    block = re.sub(r'identificacao_genero: str \| None = None', 'identificacao_genero: IdentificacaoGeneroEnum | None = None', block)
    block = re.sub(r'transgenero: str \| bool \| None = None', 'transgenero: SimNaoPrefiroEnum | None = None', block)
    block = re.sub(r'tem_filhos: str \| bool \| None = None', 'tem_filhos: SimNaoPrefiroEnum | None = None', block)
    new_block = f'class ValidarEtapa2CadastroUsuarioDTO(BaseModel):\n{block}\n'
    content = re.sub(pattern, new_block, content, count=1)

# Also adjust CadastroUsuarioDTO if desired (optional) – keep as generic strings for now

file_path.write_text(content, encoding='utf-8')
