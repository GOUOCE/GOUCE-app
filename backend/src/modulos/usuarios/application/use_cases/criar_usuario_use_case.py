from src.modulos.auth.application.dtos.login_dto import LoginResponseDTO
from src.modulos.usuarios.application.dtos.usuario_dto import CadastroUsuarioDTO
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.validators.data_nascimento_validator import DataNascimentoValidator
from src.shared.validators.email_validator import EmailValidator
from src.shared.validators.periodo_ingresso_validator import PeriodoIngressoValidator
from src.shared.validators.string_sem_numero_validator import StringSemNumeroValidator
from src.shared.validators.telefone_validator import TelefoneValidator


class CriarUsuarioUseCase:
    def __init__(
        self,
        repository,
        hasher,
        token_service,
        email_validator=None,
        string_validator=None,
        telefone_validator=None,
        data_nascimento_validator=None,
        periodo_ingresso_validator=None,
        arquivo_repository=None,
    ):
        self.repository = repository
        self.hasher = hasher
        self.token_service = token_service
        self.email_validator = email_validator or EmailValidator()
        self.string_validator = string_validator or StringSemNumeroValidator()
        self.telefone_validator = telefone_validator or TelefoneValidator()
        self.data_nascimento_validator = data_nascimento_validator or DataNascimentoValidator()
        self.periodo_ingresso_validator = periodo_ingresso_validator or PeriodoIngressoValidator()
        self.arquivo_repository = arquivo_repository

    def execute(self, dto: CadastroUsuarioDTO) -> LoginResponseDTO:
        # 1. Validação de Nome Completo
        nome = dto.nome.strip() if dto.nome else ""
        if not nome or len(nome) < 3:
            raise ValueError("Nome completo deve ter pelo menos 3 caracteres")
        if not self.string_validator.validar_string_sem_numero(nome):
            raise ValueError("Nome deve incluir apenas letras e espaços")

        # 2. Validação de E-mail (formato e duplicidade)
        email = str(dto.email).lower().strip() if dto.email else ""
        if not email:
            raise ValueError("E-mail é obrigatório")
        if not self.email_validator.validar_email(email):
            raise ValueError("Formato de e-mail inválido")
        if self.repository.buscar_por_email(email):
            raise ValueError("E-mail já cadastrado no sistema")

        # 3. Validação de Senha
        if not dto.senha or len(dto.senha) < 6:
            raise ValueError("A senha deve ter pelo menos 6 caracteres")

        # 4. Validação de Telefone (opcional, mas se fornecido deve ser válido)
        if dto.telefone and str(dto.telefone).strip():
            if not self.telefone_validator.validar_telefone(str(dto.telefone)):
                raise ValueError("Telefone inválido. Deve possuir 11 dígitos (DDD + número)")

        # 5. Validação e conversão do formato da Data de Nascimento
        if dto.data_nascimento is not None and dto.data_nascimento != "" and dto.data_nascimento != 0:
            data_nascimento_int = self.data_nascimento_validator.converter_para_inteiro(dto.data_nascimento)
            dto = dto.model_copy(update={"data_nascimento": data_nascimento_int})
        else:
            raise ValueError("Data de nascimento é obrigatória")

        # 6. Validação do Período de Ingresso (opcional, mas se informado não pode ser no futuro)
        if dto.periodo_ingresso and dto.periodo_ingresso.strip():
            periodo_formatado = self.periodo_ingresso_validator.validar_e_formatar(dto.periodo_ingresso)
            dto = dto.model_copy(update={"periodo_ingresso": periodo_formatado})

        # 7. Validação de Instituição / Faculdade
        if not dto.faculdade_id or not str(dto.faculdade_id).strip():
            raise ValueError("Instituição/Faculdade é obrigatória")

        # 8. Validação de Curso
        if not dto.curso or not dto.curso.strip():
            raise ValueError("Curso é obrigatório")

        # 9. Validação de Comprovante de Matrícula (Obrigatório)
        if not dto.id_comprovante_matricula or not str(dto.id_comprovante_matricula).strip():
            raise ValueError("Comprovante de matrícula é obrigatório (envie o arquivo ou UUID do arquivo enviado)")

        # 10. Validação de Comprovante de Residência (Obrigatório)
        if not dto.id_comprovante_residencia or not str(dto.id_comprovante_residencia).strip():
            raise ValueError("Comprovante de residência é obrigatório (envie o arquivo ou UUID do arquivo enviado)")

        # Validar existência dos arquivos se o repositório estiver disponível
        if self.arquivo_repository:
            if not self.arquivo_repository.buscar_por_id(str(dto.id_comprovante_matricula)):
                raise ValueError("O comprovante de matrícula informado não é um arquivo válido registrado no sistema")
            if not self.arquivo_repository.buscar_por_id(str(dto.id_comprovante_residencia)):
                raise ValueError("O comprovante de residência informado não é um arquivo válido registrado no sistema")

        # 11. Validação de Termos de Uso
        if not dto.termos_de_uso:
            raise ValueError("Você deve aceitar os termos de uso para se cadastrar")

        # Criação do usuário após passar por todas as validações
        senha_hash = self.hasher.hash(dto.senha)
        usuario = self.repository.criar_aluno(dto, senha_hash)

        cargo = CargoEnum.ALUNO.value

        token_acesso = self.token_service.generate(usuario, cargo)
        token_atualizacao = self.token_service.generate_refresh_token(usuario, cargo)

        dados_usuario = {
            "id": usuario.id,
            "nome": usuario.nome_completo,
            "email": usuario.email,
            "role": cargo,
        }

        return LoginResponseDTO(
            token_acesso=token_acesso,
            token_atualizacao=token_atualizacao,
            tipo_token="bearer",
            usuario=dados_usuario
        )
