from email_validator import validate_email, EmailNotValidError
from src.shared.domain.interfaces.i_email_validator import IEmailValidator

class EmailValidator(IEmailValidator):
    def validar_email(self, email: str) -> bool:
        if not email or not isinstance(email, str):
            return False
        try:
            validate_email(
                email,
                check_deliverability=False
            )
            return True
        except EmailNotValidError:
            return False
