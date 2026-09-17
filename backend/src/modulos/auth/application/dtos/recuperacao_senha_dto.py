from typing import Optional
from pydantic import BaseModel, Field


class SolicitarRecuperacaoSenhaDTO(BaseModel):
    """Estrutura da requisição para solicitação de recuperação de senha"""
    email: str = Field(..., description="E-mail cadastrado na plataforma", example="usuario@dominio.com")


class SolicitarRecuperacaoSenhaResponseDTO(BaseModel):
    """Estrutura da resposta para solicitação de recuperação de senha"""
    mensagem: str = Field(
        ...,
        description="Mensagem genérica para evitar exposição da existência da conta",
        example="Se o e-mail estiver cadastrado no sistema, você receberá as instruções para redefinição de senha."
    )


class ValidarTokenRecuperacaoDTO(BaseModel):
    """Estrutura da requisição para validação de token/código de recuperação"""
    token: str = Field(..., description="Token ou código de recuperação recebido")


class ValidarTokenRecuperacaoResponseDTO(BaseModel):
    """Estrutura da resposta da validação de token/código de recuperação"""
    valido: bool = Field(..., example=True)
    mensagem: str = Field(..., example="Token válido.")


class RedefinirSenhaDTO(BaseModel):
    """Estrutura da requisição para redefinição de senha"""
    token: str = Field(..., description="Token ou código de recuperação recebido")
    nova_senha: str = Field(..., min_length=6, description="Nova senha com no mínimo 6 caracteres")


class RedefinirSenhaResponseDTO(BaseModel):
    """Estrutura da resposta da redefinição de senha"""
    mensagem: str = Field(..., example="Senha alterada com sucesso.")
