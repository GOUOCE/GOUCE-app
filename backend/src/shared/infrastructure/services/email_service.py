import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from src.shared.domain.interfaces.i_email_service import IEmailService

logger = logging.getLogger("email_service")


class SMTPEmailService(IEmailService):
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("FROM_EMAIL") or self.smtp_user or "no-reply@gouce.edu.br"
        self.app_url = os.getenv("APP_URL", "http://localhost:3000")

    def enviar_email_recuperacao_senha(self, email_destino: str, nome_usuario: str, token_recuperacao: str) -> bool:
        assunto = "Recuperação de Senha - GOUCE"
        base_url = self.app_url.rstrip("/")
        # Incluído /auth para bater com a rota do servidor
        link_recuperacao = f"{base_url}/auth/redefinir-senha?token={token_recuperacao}"

        conteudo_texto = (
            f"Olá {nome_usuario},\n\n"
            f"Recebemos uma solicitação de recuperação de senha para sua conta no GOUCE.\n\n"
            f"Clique no link abaixo para redefinir sua senha:\n{link_recuperacao}\n\n"
            f"Seu token/código de recuperação é:\n{token_recuperacao}\n\n"
            f"Se você não solicitou esta alteração, ignore este e-mail.\n"
            f"O link e o token expiram em 15 minutos.\n"
        )
        conteudo_html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #0056b3;">Recuperação de Senha</h2>
              <p>Olá <strong>{nome_usuario}</strong>,</p>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta na plataforma <strong>GOUCE</strong>.</p>
              
              <p style="margin: 25px 0; text-align: center;">
                <a href="{link_recuperacao}" 
                   style="background-color: #0056b3; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                  Redefinir Minha Senha
                </a>
              </p>

              <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #0056b3; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #555;">Caso o botão não funcione, copie e cole o link abaixo no seu navegador:</p>
                <p style="word-break: break-all; font-size: 13px; color: #0056b3; margin-top: 5px;">
                  <a href="{link_recuperacao}" style="color: #0056b3;">{link_recuperacao}</a>
                </p>
                <p style="margin-top: 10px; font-size: 12px; color: #777;">Código do Token: <code>{token_recuperacao}</code></p>
              </div>

              <p style="font-size: 13px; color: #666;">Se você não solicitou a recuperação de senha, por favor ignore este e-mail. Este link é válido por <strong>15 minutos</strong>.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #888;">GOUCE - Sistema de Gestão Universitária</p>
            </div>
          </body>
        </html>
        """

        # Se as credenciais de SMTP estiverem configuradas, envia via smtplib
        if self.smtp_server and self.smtp_user and self.smtp_password:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = assunto
                msg["From"] = self.from_email
                msg["To"] = email_destino

                msg.attach(MIMEText(conteudo_texto, "plain", "utf-8"))
                msg.attach(MIMEText(conteudo_html, "html", "utf-8"))

                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.smtp_user, self.smtp_password)
                    server.sendmail(self.from_email, [email_destino], msg.as_string())

                logger.info(f"E-mail de recuperação enviado com sucesso para {email_destino}")
                return True
            except Exception as e:
                logger.error(f"Erro ao enviar e-mail via SMTP para {email_destino}: {str(e)}")
                print(f"[EMERGENCY/DEV EMAIL LOG] E-mail para: {email_destino} | Link: {link_recuperacao} | Token: {token_recuperacao} | Erro SMTP: {e}")
                return False

        # Modo Desenvolvedor / Simulação caso SMTP não esteja preenchido no .env
        print(f"\n==================================================")
        print(f"[MODO DESENVOLVIMENTO - SIMULAÇÃO DE E-MAIL]")
        print(f"Para: {email_destino} ({nome_usuario})")
        print(f"Assunto: {assunto}")
        print(f"Link de Acesso Direto: {link_recuperacao}")
        print(f"Token de Recuperação: {token_recuperacao}")
        print(f"==================================================\n")
        return True
