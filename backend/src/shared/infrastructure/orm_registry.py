"""Registro das entidades ORM para scripts isolados (worker, seeds)."""

from src.modulos.usuarios.model.entities.usuario import UsuarioORM  # noqa: F401
from src.modulos.usuarios.model.entities.aluno import AlunoORM  # noqa: F401
from src.modulos.arquivos.model.entities.arquivo import ArquivoORM  # noqa: F401
from src.modulos.motoristas.model.entities.motorista import MotoristaORM  # noqa: F401
from src.modulos.auth.domain.entities.password_reset_token import PasswordResetTokenORM  # noqa: F401
from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM  # noqa: F401
