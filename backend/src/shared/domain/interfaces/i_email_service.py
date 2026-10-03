from abc import ABC, abstractmethod


class IEmailService(ABC):
    @abstractmethod
    def enviar_senha_temporaria(self, email_destino: str, nome_usuario: str, senha: str) -> bool:
        """Envia a senha gerada para um novo usuário."""
        pass

    @abstractmethod
    def enviar_email_recuperacao_senha(self, email_destino: str, nome_usuario: str, token_recuperacao: str) -> bool:
        """Envia e-mail com instruções e token de recuperação de senha."""
        pass
