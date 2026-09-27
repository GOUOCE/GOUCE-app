from typing import Literal, Optional

from pydantic import BaseModel, Field


class SolicitarRecuperacaoSenhaDTO(BaseModel):
    """Estrutura da requisição para solicitação de recuperação de senha"""
    email: str = Field(..., description="E-mail cadastrado na plataforma", example="usuario@dominio.com")


class RecuperacaoSucessoResponseDTO(BaseModel):
    success: Literal[True] = True
    message: str


class RecuperacaoErroDetalheDTO(BaseModel):
    field: Optional[str] = None
    message: str


class RecuperacaoErroDTO(BaseModel):
    code: str
    message: str
    details: list[RecuperacaoErroDetalheDTO] = Field(default_factory=list)


class RecuperacaoErroResponseDTO(BaseModel):
    success: Literal[False] = False
    error: RecuperacaoErroDTO


class SolicitarRecuperacaoSenhaResponseDTO(RecuperacaoSucessoResponseDTO):
    """Resposta genérica para evitar enumeração de contas."""

    message: str = Field(
        default="Se o e-mail estiver cadastrado no sistema, você receberá as instruções para redefinição de senha.",
        description="Mensagem genérica para evitar exposição da existência da conta",
    )


class ValidarTokenRecuperacaoDTO(BaseModel):
    """Estrutura da requisição para validação de token/código de recuperação"""
    token: str = Field(..., description="Token ou código de recuperação recebido")


class ValidarTokenRecuperacaoResponseDTO(RecuperacaoSucessoResponseDTO):
    """Estrutura da resposta da validação de token/código de recuperação"""

    valido: bool = Field(..., example=True)
    message: str = Field(default="Token válido.", example="Token válido.")


class RedefinirSenhaDTO(BaseModel):
    """Estrutura da requisição para redefinição de senha"""
    token: str = Field(..., description="Token ou código de recuperação recebido")
    nova_senha: str = Field(..., description="Nova senha conforme os critérios de segurança do sistema")


class RedefinirSenhaResponseDTO(RecuperacaoSucessoResponseDTO):
    """Estrutura da resposta da redefinição de senha"""

    message: str = Field(default="Senha alterada com sucesso.", example="Senha alterada com sucesso.")
