from src.modulos.usuarios.application.dtos.usuario_dto import CadastroUsuarioDTO, CadastroSucessoDTO
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.validators.data_nascimento_validator import DataNascimentoValidator
from src.shared.validators.email_validator import EmailValidator
from src.shared.validators.periodo_ingresso_validator import PeriodoIngressoValidator
from src.shared.validators.string_sem_numero_validator import StringSemNumeroValidator
from src.shared.validators.telefone_validator import TelefoneValidator
from src.shared.validators.senha_validator import SenhaValidator
from src.shared.validators.turno_curso_validator import TurnoCursoValidator


class ValidacaoMultiplaError(Exception):
    def __init__(self, erros: list[str]):
        self.erros = erros
        super().__init__("Erros de validação encontrados")


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

    def execute(self, dto: CadastroUsuarioDTO) -> CadastroSucessoDTO:
        erros = []

        # 1. Validação de Nome Completo
        nome = dto.nome.strip() if dto.nome else ""
        if not nome or len(nome) < 3:
            erros.append("Nome completo deve ter pelo menos 3 caracteres")
        elif len(nome.split()) < 2:
            erros.append("Informe seu nome completo (nome e sobrenome)")
        elif not self.string_validator.validar_string_sem_numero(nome):
            erros.append("O nome deve conter apenas letras e espaços")

        # 2. Validação de E-mail
        email = str(dto.email).lower().strip() if dto.email else ""
        if not email:
            erros.append("E-mail é obrigatório")
        elif not self.email_validator.validar_email(email):
            erros.append("Formato de e-mail inválido")
        elif self.repository.buscar_por_email(email):
            erros.append("E-mail já cadastrado no sistema")

        # 3. Validação de Senha Forte
        is_senha_valida, msg_senha = self.senha_validator.validar_senha(dto.senha or "")
        if not is_senha_valida:
            erros.append(msg_senha)

        # 4. Validação de Telefone / Celular com DDD
        if dto.telefone and str(dto.telefone).strip():
            if not self.telefone_validator.validar_telefone(str(dto.telefone)):
                erros.append("Telefone celular inválido. Informe um número celular válido com DDD (ex: 11987654321)")

        # 5. Validação e conversão da Data de Nascimento
        if dto.data_nascimento is not None and dto.data_nascimento != "" and dto.data_nascimento != 0:
            try:
                data_nascimento_int = self.data_nascimento_validator.converter_para_inteiro(dto.data_nascimento)
                dto = dto.model_copy(update={"data_nascimento": data_nascimento_int})
            except ValueError as e:
                erros.append(str(e))
        else:
            erros.append("Data de nascimento é obrigatória")

        # 6. Validação do Período de Ingresso
        if dto.periodo_ingresso and str(dto.periodo_ingresso).strip():
            try:
                periodo_formatado = self.periodo_ingresso_validator.validar_e_formatar(str(dto.periodo_ingresso))
                dto = dto.model_copy(update={"periodo_ingresso": periodo_formatado})
            except ValueError as e:
                erros.append(str(e))

        # 7. Validação de Semestre Atual
        if dto.semestre_atual is not None:
            if not isinstance(dto.semestre_atual, int) or dto.semestre_atual < 1 or dto.semestre_atual > 16:
                erros.append("O semestre atual deve ser um número inteiro entre 1 e 16")

        # 8. Validação de Turno do Curso
        turno_valido, turno_curso_formatado = self.turno_curso_validator.validar_e_formatar(dto.turno_curso)
        
        if not turno_valido:
            erros.append("Turno do curso inválido. Opções permitidas: Matutino, Vespertino, Noturno ou Integral")
        
        dto.turno_curso = turno_curso_formatado


        # 9. Validação de Instituição / Faculdade
        if not dto.faculdade_id or len(str(dto.faculdade_id).strip()) < 2:
            erros.append("Instituição/Faculdade é obrigatória")

        # 10. Validação de Curso
        if not dto.curso or len(str(dto.curso).strip()) < 2:
            erros.append("O nome do curso é obrigatório")

        # 11. Validação de Comprovante de Matrícula
        if not dto.id_comprovante_matricula or not str(dto.id_comprovante_matricula).strip():
            erros.append("Comprovante de matrícula é obrigatório")

        # 12. Validação de Comprovante de Residência
        if not dto.id_comprovante_residencia or not str(dto.id_comprovante_residencia).strip():
            erros.append("Comprovante de residência é obrigatório")

        # Validar existência dos arquivos
        if self.arquivo_repository:
            if dto.id_comprovante_matricula and not self.arquivo_repository.buscar_por_id(str(dto.id_comprovante_matricula)):
                erros.append("O comprovante de matrícula informado não é um arquivo válido registrado no sistema")
            if dto.id_comprovante_residencia and not self.arquivo_repository.buscar_por_id(str(dto.id_comprovante_residencia)):
                erros.append("O comprovante de residência informado não é um arquivo válido registrado no sistema")
            if dto.id_foto_aluno and not self.arquivo_repository.buscar_por_id(str(dto.id_foto_aluno)):
                erros.append("A foto de perfil informada não é um arquivo válido registrado no sistema")

        # 13. Validação de Termos de Uso
        if not dto.termos_de_uso:
            erros.append("Você deve aceitar os termos de uso para se cadastrar")

        # Lança a exceção com a lista de erros, se existirem
        if erros:
            raise ValidacaoMultiplaError(erros)

        # Criação do usuário após passar por todas as validações
        senha_hash = self.hasher.hash(dto.senha)
        usuario = self.repository.criar_aluno(dto, senha_hash)

        return CadastroSucessoDTO(
            id=usuario.id,
            nome=usuario.nome_completo,
            email=usuario.email,
            status_cadastro="pendente",
            mensagem="Cadastro realizado com sucesso! Aguarde a aprovação da coordenação para realizar o login."
        )
