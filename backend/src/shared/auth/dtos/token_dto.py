from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class RegisterDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nome: str = Field(min_length=3, max_length=150)
    email: EmailStr
    senha: str = Field(min_length=6, max_length=128)
    telefone: str | None = Field(default=None, max_length=20)
    status_cadastro: str = Field(default="pendente", max_length=150)
    faculdade_id: str = Field(min_length=1, max_length=150)
    bairro_id: str | None = Field(default=None, max_length=20)
    id_comprovante_matricula: str = Field(min_length=1, max_length=255)
    data_nascimento: int = 0
    identificacao_genero: datetime | None = None
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


class LoginDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    email: EmailStr
    senha: str
    lembrar_me: bool = False


class LoginResponseDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    token_acesso: str
    token_atualizacao: str
    tipo_token: str = "bearer"
    usuario: dict


class RefreshTokenDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    token_atualizacao: str


class RefreshTokenResponseDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    token_acesso: str
    tipo_token: str = "bearer"
