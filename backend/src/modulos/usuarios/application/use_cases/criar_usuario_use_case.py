from src.modulos.auth.application.dtos.login_dto import LoginResponseDTO
from src.modulos.usuarios.application.dtos.usuario_dto import CadastroUsuarioDTO
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.validators.data_nascimento_validator import DataNascimentoValidator
from src.shared.validators.email_validator import EmailValidator
from src.shared.validators.periodo_ingresso_validator import PeriodoIngressoValidator
from src.shared.validators.string_sem_numero_validator import StringSemNumeroValidator
from src.shared.validators.telefone_validator import TelefoneValidator
from src.shared.validators.senha_validator import SenhaValidator
from src.shared.validators.turno_curso_validator import TurnoCursoValidator


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
        senha_validator=None,
        turno_curso_validator=None,
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
        self.senha_validator = senha_validator or SenhaValidator()
        self.turno_curso_validator = turno_curso_validator or TurnoCursoValidator()
        self.arquivo_repository = arquivo_repository

    def execute(self, dto: CadastroUsuarioDTO) -> LoginResponseDTO:
        # 1. Validação de Nome Completo (Exige Nome + Sobrenome e apenas letras)
        nome = dto.nome.strip() if dto.nome else ""
        if not nome or len(nome) < 3:
            raise ValueError("Nome completo deve ter pelo menos 3 caracteres")
        if len(nome.split()) < 2:
            raise ValueError("Informe seu nome completo (nome e sobrenome)")
        if not self.string_validator.validar_string_sem_numero(nome):
            raise ValueError("O nome deve conter apenas letras e espaços")

        # 2. Validação de E-mail (formato e duplicidade)
        email = str(dto.email).lower().strip() if dto.email else ""
        if not email:
            raise ValueError("E-mail é obrigatório")
        if not self.email_validator.validar_email(email):
            raise ValueError("Formato de e-mail inválido")
        if self.repository.buscar_por_email(email):
            raise ValueError("E-mail já cadastrado no sistema")

        # 3. Validação de Senha Forte
        is_senha_valida, msg_senha = self.senha_validator.validar_senha(dto.senha or "")
        if not is_senha_valida:
            raise ValueError(msg_senha)

        # 4. Validação de Telefone / Celular com DDD
        if dto.telefone and str(dto.telefone).strip():
            if not self.telefone_validator.validar_telefone(str(dto.telefone)):
                raise ValueError("Telefone celular inválido. Informe um número celular válido com DDD (ex: 11987654321)")

        # 5. Validação e conversão do formato da Data de Nascimento
        if dto.data_nascimento is not None and dto.data_nascimento != "" and dto.data_nascimento != 0:
            data_nascimento_int = self.data_nascimento_validator.converter_para_inteiro(dto.data_nascimento)
            dto = dto.model_copy(update={"data_nascimento": data_nascimento_int})
        else:
            raise ValueError("Data de nascimento é obrigatória")

        # 6. Validação do Período de Ingresso
        if dto.periodo_ingresso and dto.periodo_ingresso.strip():
            periodo_formatado = self.periodo_ingresso_validator.validar_e_formatar(dto.periodo_ingresso)
            dto = dto.model_copy(update={"periodo_ingresso": periodo_formatado})

        # 7. Validação de Semestre Atual
        if dto.semestre_atual is not None:
            if not isinstance(dto.semestre_atual, int) or dto.semestre_atual < 1 or dto.semestre_atual > 16:
                raise ValueError("O semestre atual deve ser um número inteiro entre 1 e 16")

        # 8. Validação de Turno do Curso
        if dto.turno_curso and str(dto.turno_curso).strip():
            turno_formatado = self.turno_curso_validator.validar_e_formatar(str(dto.turno_curso))
            dto = dto.model_copy(update={"turno_curso": turno_formatado})

        # 9. Validação de Instituição / Faculdade
        if not dto.faculdade_id or len(str(dto.faculdade_id).strip()) < 2:
            raise ValueError("Instituição/Faculdade é obrigatória")

        # 10. Validação de Curso
        if not dto.curso or len(str(dto.curso).strip()) < 2:
            raise ValueError("O nome do curso é obrigatório")

        # 11. Validação de Comprovante de Matrícula (Obrigatório)
        if not dto.id_comprovante_matricula or not str(dto.id_comprovante_matricula).strip():
            raise ValueError("Comprovante de matrícula é obrigatório (envie o arquivo ou UUID do arquivo enviado)")

        # 12. Validação de Comprovante de Residência (Obrigatório)
        if not dto.id_comprovante_residencia or not str(dto.id_comprovante_residencia).strip():
            raise ValueError("Comprovante de residência é obrigatório (envie o arquivo ou UUID do arquivo enviado)")

        # Validar existência dos arquivos no banco/storage se o repositório estiver disponível
        if self.arquivo_repository:
            if not self.arquivo_repository.buscar_por_id(str(dto.id_comprovante_matricula)):
                raise ValueError("O comprovante de matrícula informado não é um arquivo válido registrado no sistema")
            if not self.arquivo_repository.buscar_por_id(str(dto.id_comprovante_residencia)):
                raise ValueError("O comprovante de residência informado não é um arquivo válido registrado no sistema")

        # 13. Validação de Termos de Uso
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
