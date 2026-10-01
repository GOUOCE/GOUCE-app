from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CriarAdministradorDTO(BaseModel):
    nome: str = Field(min_length=3, max_length=150)
    email: EmailStr
    senha: str | None = Field(default=None, min_length=6, max_length=128)


class PromoverAdministradorDTO(BaseModel):
    aluno_id: int | None = Field(default=None, gt=0)
    email: EmailStr | None = None


class AtualizarAdministradorDTO(BaseModel):
    nome: str | None = Field(default=None, min_length=3, max_length=150)
    email: EmailStr | None = None


class AdministradorResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: EmailStr
    ativo: bool
    criado_em: datetime


class OperacaoAdministradorResponseDTO(BaseModel):
    success: bool = True
    message: str
    data: AdministradorResponseDTO | None = None
