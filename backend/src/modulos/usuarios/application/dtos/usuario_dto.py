from datetime import date, datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from src.shared.enums.status_cadastro_enum import StatusCadastroEnum


class CadastroUsuarioDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nome: str = Field(min_length=3, max_length=150)
    email: EmailStr
    senha: str = Field(min_length=6, max_length=128)
    telefone: str | None = Field(default=None, max_length=20)
    status_cadastro: StatusCadastroEnum = StatusCadastroEnum.PENDENTE
    faculdade_id: str = Field(min_length=1, max_length=150)
    bairro_id: str | None = Field(default=None, max_length=20)
    id_comprovante_matricula: str = Field(default="", max_length=255)
    id_comprovante_residencia: str = Field(default="", max_length=255)
    data_nascimento: str | int | float | date | datetime | None = None
    identificacao_genero: str | None = None
    tem_filhos: bool | None = None
    curso: str = Field(min_length=1, max_length=150)
    semestre_atual: int | None = None
    periodo_ingresso: str | None = Field(default=None, max_length=20)
    turno_curso: str | None = Field(default=None, max_length=30)
    raca: str | None = Field(default=None, max_length=50)
    validade_acesso: datetime | None = None
    id_foto_aluno: str | None = Field(default=None, max_length=255)
    identificacao_sexual: str | None = Field(default=None, max_length=100)
    motivo_reprovacao: str | None = Field(default=None, max_length=255)
    termos_de_uso: bool = False
    consentimento_lgpd_em: datetime | None = None
    versao_termos: str | None = Field(default="1.0", max_length=20)


# Alias para retrocompatibilidade se necessário
RegisterDTO = CadastroUsuarioDTO


class UsuarioResponseDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: int
    nome_completo: str
    email: str
    telefone: str | None = None
