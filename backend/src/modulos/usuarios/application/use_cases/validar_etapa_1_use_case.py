
# -*- coding: utf-8 -*-
from src.modulos.usuarios.application.dtos.usuario_dto import (
    ValidacaoSucessoDTO,
    CadastroValidationDetailDTO,
    CadastroSucessoDTO,
    ValidarEtapa1CadastroUsuarioDTO,
)
from src.shared.validators.data_nascimento_validator import DataNascimentoValidator
from src.shared.validators.email_validator import EmailValidator
from src.shared.validators.string_sem_numero_validator import StringSemNumeroValidator
from src.shared.validators.senha_validator import SenhaValidator
from src.modulos.usuarios.application.use_cases.criar_usuario_use_case import ValidacaoMultiplaError

def validar_regras_arquivo(nome_original: str, content_type: str, conteudo_bytes: bytes) -> str | None:
    MIME_TYPES_PERMITIDOS = {"application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"}
    if len(conteudo_bytes) > 10 * 1024 * 1024:
        return "O arquivo excede o tamanho máximo permitido de 10MB"
    ct = (content_type or "application/octet-stream").lower().strip()
    extensao = nome_original.split(".")[-1].lower() if "." in nome_original else ""
    if ct not in MIME_TYPES_PERMITIDOS and extensao not in ["pdf", "png", "jpg", "jpeg", "webp"]:
        return "Formato de arquivo inválido. Apenas PDF e Imagens (PNG, JPG, JPEG, WEBP) são permitidos."
    return None


class ValidarEtapa1UsuarioUseCase:
    def __init__(
        self,
        repository,
        email_validator=None,
        string_validator=None,
        data_nascimento_validator=None,
        senha_validator=None,
    ):
        self.repository = repository
        self.email_validator = email_validator or EmailValidator()
        self.string_validator = string_validator or StringSemNumeroValidator()
        self.data_nascimento_validator = data_nascimento_validator or DataNascimentoValidator()
        self.senha_validator = senha_validator or SenhaValidator()

    def execute(self, dto: ValidarEtapa1CadastroUsuarioDTO, arquivo_foto: tuple | None = None) -> CadastroSucessoDTO:
        erros = []

        # Validação de Foto (Regras de negócio de arquivo)
        if arquivo_foto:
            erro_foto = validar_regras_arquivo(arquivo_foto[0], arquivo_foto[1], arquivo_foto[2])
            if erro_foto:
                erros.append({"field": "foto_perfil", "message": erro_foto})

        # Validação de Nome Completo
        nome = dto.nome.strip() if dto.nome else ""
        if not nome or len(nome) < 3:
            erros.append({"field": "nome", "message": "Nome completo deve ter pelo menos 3 caracteres"})
        elif len(nome.split()) < 2:
            erros.append({"field": "nome", "message": "Informe seu nome completo (nome e sobrenome)"})
        elif not self.string_validator.validar_string_sem_numero(nome):
            erros.append({"field": "nome", "message": "O nome deve conter apenas letras e espaços"})

        # Validação de Data de Nascimento
        if dto.data_nascimento is not None and dto.data_nascimento != "" and dto.data_nascimento != 0:
            try:
                self.data_nascimento_validator.converter_para_inteiro(dto.data_nascimento)
            except ValueError as e:
                erros.append({"field": "data_nascimento", "message": str(e)})
        else:
            erros.append({"field": "data_nascimento", "message": "Data de nascimento é obrigatória"})

        # Validação de E-mail
        email = str(dto.email).lower().strip() if dto.email else ""
        if not email:
            erros.append({"field": "email", "message": "E-mail é obrigatório"})
        elif not self.email_validator.validar_email(email):
            erros.append({"field": "email", "message": "Formato de e-mail inválido"})
        elif self.repository.buscar_por_email(email):
            erros.append({"field": "email", "message": "E-mail já cadastrado no sistema"})

        # Validação de Senha Forte
        is_senha_valida, msg_senha = self.senha_validator.validar_senha(dto.senha or "")
        if not is_senha_valida:
            erros.append({"field": "senha", "message": msg_senha})
            
        # Confirmação de Senha
        if not dto.confirmar_senha:
            erros.append({"field": "confirmar_senha", "message": "A confirmação de senha é obrigatória"})
        elif dto.senha != dto.confirmar_senha:
            erros.append({"field": "confirmar_senha", "message": "As senhas não coincidem"})

        # Lança a exceção com a lista de erros, se existirem
        if erros:
            raise ValidacaoMultiplaError(erros)

        return ValidacaoSucessoDTO(
            success=True,
            message="Etapa 2 validada com sucesso",
            data=CadastroValidationDetailDTO(
                field=None,
                message="Sem erros"
            )
        )
