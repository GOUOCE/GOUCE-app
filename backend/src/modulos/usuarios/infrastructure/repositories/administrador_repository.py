from sqlalchemy.orm import Session

from src.modulos.usuarios.model.entities.administrador import AdministradorORM
from src.modulos.usuarios.model.entities.aluno import AlunoORM
from src.modulos.usuarios.model.entities.usuario import UsuarioORM
from src.modulos.usuarios.model.entities.tipo import TipoORM
from src.modulos.usuarios.model.entities.usuario_tipo import UsuarioTipoORM
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.infrastructure.audit_model import LogAuditoriaORM
from src.shared.security.lgpd_encryption import hash_email


class AdministradorEmailEmUsoError(ValueError):
    pass


class AlunoNaoEncontradoError(ValueError):
    pass


class AdministradorJaExistenteError(ValueError):
    pass


class TipoAdministradorNaoInicializadoError(RuntimeError):
    pass


class AdministradorRepository:
    def __init__(self, session: Session):
        self.session = session

    def listar(self, ativo: bool | None) -> list[dict]:
        query = self.session.query(UsuarioORM, AdministradorORM).join(
            AdministradorORM, AdministradorORM.administrador_id == UsuarioORM.id
        )
        if ativo is not None:
            query = query.filter(AdministradorORM.is_administrador_ativo == ativo)
        return [self._serializar(usuario, administrador) for usuario, administrador in query.order_by(UsuarioORM.nome_completo).all()]

    def buscar(self, administrador_id: int):
        return (
            self.session.query(UsuarioORM, AdministradorORM)
            .join(AdministradorORM, AdministradorORM.administrador_id == UsuarioORM.id)
            .filter(AdministradorORM.administrador_id == administrador_id)
            .first()
        )

    def email_em_uso(self, email: str, ignorar_usuario_id: int | None = None) -> bool:
        query = self.session.query(UsuarioORM.id).filter(UsuarioORM.email_hash == hash_email(email.lower().strip()))
        if ignorar_usuario_id is not None:
            query = query.filter(UsuarioORM.id != ignorar_usuario_id)
        return query.first() is not None

    def criar(self, nome: str, email: str, senha_hash: str):
        email = email.lower().strip()
        if self.email_em_uso(email):
            raise AdministradorEmailEmUsoError
        usuario = UsuarioORM(nome_completo=nome.strip(), email=email, email_hash=hash_email(email), senha=senha_hash)
        self.session.add(usuario)
        self.session.flush()
        tipo_administrador = self.session.query(TipoORM).filter(
            TipoORM.tipo_usuario == CargoEnum.ADMINISTRADOR.value
        ).first()
        if not tipo_administrador:
            self.session.rollback()
            raise TipoAdministradorNaoInicializadoError(
                "O tipo de usuário administrador não está inicializado."
            )
        administrador = AdministradorORM(administrador_id=usuario.id, is_administrador_ativo=True)
        self.session.add(administrador)
        self.session.add(UsuarioTipoORM(id_usuario=usuario.id, id_tipo=tipo_administrador.id))
        self.session.commit()
        return self.buscar(usuario.id)

    def remover_criacao(self, administrador_id: int) -> None:
        self.session.query(UsuarioTipoORM).filter(
            UsuarioTipoORM.id_usuario == administrador_id
        ).delete(synchronize_session=False)
        self.session.query(AdministradorORM).filter(
            AdministradorORM.administrador_id == administrador_id
        ).delete(synchronize_session=False)
        self.session.query(UsuarioORM).filter(
            UsuarioORM.id == administrador_id
        ).delete(synchronize_session=False)
        self.session.commit()

    def promover(self, aluno_id: int | None = None, email: str | None = None):
        query = self.session.query(UsuarioORM, AlunoORM).join(
            AlunoORM, AlunoORM.aluno_id == UsuarioORM.id
        )
        if aluno_id is not None:
            query = query.filter(UsuarioORM.id == aluno_id)
        else:
            query = query.filter(UsuarioORM.email_hash == hash_email(email.lower().strip()))

        resultado = query.first()
        if not resultado:
            raise AlunoNaoEncontradoError("Aluno não encontrado.")

        usuario, _ = resultado
        if self.session.query(AdministradorORM).filter(
            AdministradorORM.administrador_id == usuario.id
        ).first():
            raise AdministradorJaExistenteError("Este usuário já possui perfil administrativo.")

        tipo_administrador = self.session.query(TipoORM).filter(
            TipoORM.tipo_usuario == CargoEnum.ADMINISTRADOR.value
        ).first()
        if not tipo_administrador:
            raise TipoAdministradorNaoInicializadoError(
                "O tipo de usuário administrador não está inicializado."
            )

        self.session.add(AdministradorORM(
            administrador_id=usuario.id,
            is_administrador_ativo=True,
        ))
        self.session.add(UsuarioTipoORM(
            id_usuario=usuario.id,
            id_tipo=tipo_administrador.id,
        ))
        self.session.commit()
        return self.buscar(usuario.id)

    def atualizar(self, administrador_id: int, nome: str | None, email: str | None):
        resultado = self.buscar(administrador_id)
        if not resultado:
            return None
        usuario, _ = resultado
        if email is not None:
            email = email.lower().strip()
            if self.email_em_uso(email, ignorar_usuario_id=usuario.id):
                raise AdministradorEmailEmUsoError
            usuario.email = email
            usuario.email_hash = hash_email(email)
        if nome is not None:
            usuario.nome_completo = nome.strip()
        self.session.commit()
        return self.buscar(administrador_id)

    def inativar(self, administrador_id: int, usuario_executor_id: int):
        resultado = self.buscar(administrador_id)
        if not resultado:
            return None
        usuario, administrador = resultado
        if administrador_id == usuario_executor_id:
            raise ValueError("Não é possível inativar a conta atualmente em uso.")
        if not administrador.is_administrador_ativo:
            return resultado
        administrador.is_administrador_ativo = False
        self.session.add(LogAuditoriaORM(
            usuario_id=usuario_executor_id,
            acao="INATIVAR",
            entidade="administrador",
            entidade_id=administrador_id,
            valor_anterior="ativo",
            valor_novo="inativo",
        ))
        self.session.commit()
        return self.buscar(administrador_id)

    @staticmethod
    def _serializar(usuario, administrador) -> dict:
        return {
            "id": usuario.id,
            "nome": usuario.nome_completo,
            "email": usuario.email,
            "ativo": bool(administrador.is_administrador_ativo),
            "criado_em": usuario.data_criacao,
        }
