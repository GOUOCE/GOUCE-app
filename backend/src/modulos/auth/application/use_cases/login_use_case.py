from datetime import datetime, timezone
from src.modulos.auth.application.dtos.login_dto import LoginDTO, LoginResponseDTO
from src.shared.enums.status_cadastro_enum import StatusCadastroEnum


class UsuarioInativoError(ValueError):
    """Exceção para contas de usuário inativadas ou com acesso não autorizado."""
    pass


class LoginUseCase:
    def __init__(self, repository, hasher, token_service):
        self.repository = repository
        self.hasher = hasher
        self.token_service = token_service

    def execute(self, login_data: LoginDTO) -> LoginResponseDTO:
        email_normalizado = login_data.email.lower().strip()
        contexto = self.repository.buscar_contexto_autenticacao_por_email(email_normalizado)
        usuario = contexto.get("usuario") if contexto else None
        aluno = contexto.get("aluno") if contexto else None

        if not usuario or not self.hasher.verify(login_data.senha, usuario.senha):
            raise ValueError("Email ou senha inválidos")

        # 1. Validação de bloqueio por limite de tempo
        agora = datetime.now(timezone.utc)
        if hasattr(usuario, "limite_de_bloqueio") and usuario.limite_de_bloqueio:
            bloqueio_dt = usuario.limite_de_bloqueio
            if bloqueio_dt.tzinfo is None:
                bloqueio_dt = bloqueio_dt.replace(tzinfo=timezone.utc)
            if agora < bloqueio_dt:
                raise ValueError("Conta temporariamente bloqueada. Tente novamente mais tarde.")

        # O perfil e o estado são derivados das tabelas atuais pelo repository.
        # O JWT não é usado como fonte de verdade para essa decisão.
        if not contexto or not contexto.get("role"):
            raise UsuarioInativoError("Usuário sem perfil de acesso válido.")

        if not contexto.get("ativo"):
            status_atual = contexto.get("status")
            motivo_contexto = contexto.get("motivo")

            if aluno and status_atual == StatusCadastroEnum.PENDENTE.value:
                raise UsuarioInativoError("Sua conta está pendente de aprovação pela coordenação.")

            if aluno and status_atual != StatusCadastroEnum.ATIVADO.value:
                motivo = f": {aluno.motivo_reprovacao}" if aluno.motivo_reprovacao else ""
                raise UsuarioInativoError(f"Sua conta está inativada{motivo}. Entre em contato com a coordenação.")

            raise UsuarioInativoError(motivo_contexto or "Sua conta não está ativa.")

        cargo = contexto["role"]

        # Gera os tokens
        token_acesso = self.token_service.generate(usuario, cargo, login_data.lembrar_me)
        token_atualizacao = self.token_service.generate_refresh_token(usuario, cargo, login_data.lembrar_me)

        # Monta os dados do usuário para o frontend
        dados_usuario = {
            "id": usuario.id,
            "nome": usuario.nome_completo,
            "email": usuario.email,
            "telefone": usuario.telefone,
            "role": cargo,
        }

        # Se for aluno, adiciona detalhes específicos
        if aluno:
            dados_usuario.update({
                "status_cadastro": aluno.status_cadastro,
                "curso": aluno.curso,
                "faculdade": aluno.faculdade_id,
                "periodo_ingresso": aluno.periodo_ingresso,
                "turno": aluno.turno_curso,
                "foto_perfil": aluno.id_foto_aluno
            })

        return LoginResponseDTO(
            token_acesso=token_acesso,
            token_atualizacao=token_atualizacao,
            tipo_token="bearer",
            usuario=dados_usuario
        )
