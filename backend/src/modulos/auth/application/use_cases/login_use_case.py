from datetime import datetime, timezone
from src.modulos.auth.application.dtos.login_dto import LoginDTO, LoginResponseDTO
from src.shared.enums.cargo_enum import CargoEnum
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
        usuario, aluno = self.repository.buscar_com_detalhes_por_email(email_normalizado)

        # Se não encontrar no buscar_com_detalhes, fallback para buscar_por_email simples
        if not usuario:
            usuario = self.repository.buscar_por_email(email_normalizado)

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

        # 2. Validação estrita de status: APENAS o estado 'ativado' tem permissão de acesso
        if aluno:
            status = (aluno.status_cadastro or "").lower().strip()

            if status == StatusCadastroEnum.PENDENTE.value:
                raise UsuarioInativoError("Sua conta está pendente de aprovação pela coordenação.")

            if status != StatusCadastroEnum.ATIVADO.value:
                motivo = f": {aluno.motivo_reprovacao}" if aluno.motivo_reprovacao else ""
                raise UsuarioInativoError(f"Sua conta está inativada{motivo}. Entre em contato com a coordenação.")

            # Validação de validade de acesso expirada
            if aluno.validade_acesso:
                validade_dt = aluno.validade_acesso
                if validade_dt.tzinfo is None:
                    validade_dt = validade_dt.replace(tzinfo=timezone.utc)
                if agora > validade_dt:
                    raise UsuarioInativoError("A validade de acesso da sua conta expirou. Entre em contato com a coordenação.")

        cargo = CargoEnum.ALUNO.value

        token_acesso = self.token_service.generate(usuario, cargo, login_data.lembrar_me)
        token_atualizacao = self.token_service.generate_refresh_token(usuario, cargo, login_data.lembrar_me)

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
