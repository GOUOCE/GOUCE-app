import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select

from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
from src.modulos.usuarios.model.entities.aluno import AlunoORM
from src.modulos.usuarios.model.entities.representante import RepresentanteORM
from src.modulos.usuarios.model.entities.tipo import TipoORM
from src.modulos.usuarios.model.entities.usuario import UsuarioORM
from src.modulos.usuarios.model.entities.usuario_tipo import UsuarioTipoORM
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.enums.status_cadastro_enum import StatusCadastroEnum
from src.shared.infrastructure.audit_model import LogAuditoriaORM


class AlunoNaoEncontradoError(ValueError):
    pass


class FaculdadeNaoEncontradaError(ValueError):
    pass


class FaculdadeInativaError(ValueError):
    pass


class AlunoNaoAprovadoOuInativoError(ValueError):
    pass

class AlunoValidadeAcessoExpiradoError(ValueError):
    pass


class RepresentanteJaAtivoError(ValueError):
    pass


class RepresentanteNaoEncontradoError(ValueError):
    pass


class RepresentanteNaoAtivoError(ValueError):
    pass


class TipoRepresentanteNaoInicializadoError(RuntimeError):
    pass


class RepresentanteRepository:
    def __init__(self, session: Session):
        self.session = session

    def listar(self, ativo: bool | None = None, faculdade_id: int | None = None) -> list[dict]:
        query = (
            self.session.query(UsuarioORM, AlunoORM, RepresentanteORM, FaculdadeORM)
            .join(RepresentanteORM, RepresentanteORM.administrador_id == UsuarioORM.id)
            .join(AlunoORM, AlunoORM.aluno_id == UsuarioORM.id)
            .outerjoin(FaculdadeORM, FaculdadeORM.id_faculdade == RepresentanteORM.id_faculdade_responsavel)
        )
        if ativo is not None:
            query = query.filter(RepresentanteORM.is_representante_ativo == ativo)
        if faculdade_id is not None:
            query = query.filter(RepresentanteORM.id_faculdade_responsavel == faculdade_id)

        return [
            self._serializar(usuario, aluno, representante, faculdade)
            for usuario, aluno, representante, faculdade in query.order_by(UsuarioORM.nome_completo).all()
        ]

    def buscar(self, representante_id: int):
        return (
            self.session.query(UsuarioORM, AlunoORM, RepresentanteORM, FaculdadeORM)
            .join(RepresentanteORM, RepresentanteORM.administrador_id == UsuarioORM.id)
            .join(AlunoORM, AlunoORM.aluno_id == UsuarioORM.id)
            .outerjoin(FaculdadeORM, FaculdadeORM.id_faculdade == RepresentanteORM.id_faculdade_responsavel)
            .filter(RepresentanteORM.administrador_id == representante_id)
            .first()
        )

    def promover(self, aluno_id: int, faculdade_id: int, usuario_executor_id: int):
        resultado_aluno = (
            self.session.query(UsuarioORM, AlunoORM)
            .join(AlunoORM, AlunoORM.aluno_id == UsuarioORM.id)
            .filter(UsuarioORM.id == aluno_id)
            .first()
        )
        validade_acesso = self.session.execute(
            select(AlunoORM.validade_acesso).where(
                AlunoORM.aluno_id == aluno_id
            )
        ).scalar_one_or_none()
        if not resultado_aluno:
            raise AlunoNaoEncontradoError("Aluno não encontrado.")

        usuario, aluno = resultado_aluno

        is_aprovado = str(aluno.status_cadastro or "").lower() == StatusCadastroEnum.ATIVADO.value
        is_ativo = bool(usuario.ativo)
        if not is_aprovado or not is_ativo:
            raise AlunoNaoAprovadoOuInativoError("Aluno não aprovado ou inativo.")

        if validade_acesso is not None and validade_acesso.tzinfo is None:
            validade_acesso = validade_acesso.replace(tzinfo=timezone.utc)
        if (
            validade_acesso is not None
            and validade_acesso < datetime.now(timezone.utc)
        ):
            raise AlunoValidadeAcessoExpiradoError("Aluno com validade de acesso expirada ou não definida.")
        
        faculdade = (
            self.session.query(FaculdadeORM)
            .filter(FaculdadeORM.id_faculdade == faculdade_id)
            .first()
        )
        if not faculdade:
            raise FaculdadeNaoEncontradaError("Faculdade não encontrada.")
        if not faculdade.ativo:
            raise FaculdadeInativaError("Faculdade inativa.")

        representante = (
            self.session.query(RepresentanteORM)
            .filter(RepresentanteORM.administrador_id == usuario.id)
            .first()
        )
        if representante and representante.is_representante_ativo:
            raise RepresentanteJaAtivoError("Este aluno já é um representante ativo.")

        tipo_representante = (
            self.session.query(TipoORM)
            .filter(TipoORM.tipo_usuario == CargoEnum.REPRESENTANTE.value)
            .first()
        )
        if not tipo_representante:
            raise TipoRepresentanteNaoInicializadoError(
                "O tipo de usuário representante não está inicializado."
            )

        if representante:
            faculdade_anterior = representante.id_faculdade_responsavel
            representante.is_representante_ativo = True
            representante.id_faculdade_responsavel = faculdade_id
            valor_anterior = json.dumps({"faculdade_id": faculdade_anterior, "ativo": False})
        else:
            representante = RepresentanteORM(
                administrador_id=usuario.id,
                is_representante_ativo=True,
                id_faculdade_responsavel=faculdade_id,
            )
            self.session.add(representante)
            valor_anterior = None

        vinculo_tipo = (
            self.session.query(UsuarioTipoORM)
            .filter(
                UsuarioTipoORM.id_usuario == usuario.id,
                UsuarioTipoORM.id_tipo == tipo_representante.id,
            )
            .first()
        )
        if not vinculo_tipo:
            self.session.add(UsuarioTipoORM(
                id_usuario=usuario.id,
                id_tipo=tipo_representante.id,
            ))

        self.session.add(LogAuditoriaORM(
            usuario_id=usuario_executor_id,
            acao="PROMOVER",
            entidade="representante",
            entidade_id=usuario.id,
            valor_anterior=valor_anterior,
            valor_novo=json.dumps({
                "faculdade_id": faculdade_id,
                "aluno_id": usuario.id,
                "ativo": True,
            }),
            criado_em=datetime.now(timezone.utc),
        ))

        self.session.commit()
        return self.buscar(usuario.id)

    def revogar(self, representante_id: int, usuario_executor_id: int):
        representante = (
            self.session.query(RepresentanteORM)
            .filter(RepresentanteORM.administrador_id == representante_id)
            .first()
        )
        if not representante:
            raise RepresentanteNaoEncontradoError("Representante não encontrado.")

        if not representante.is_representante_ativo:
            raise RepresentanteNaoAtivoError("Este usuário não é um representante ativo.")

        representante.is_representante_ativo = False

        tipo_representante = (
            self.session.query(TipoORM)
            .filter(TipoORM.tipo_usuario == CargoEnum.REPRESENTANTE.value)
            .first()
        )
        if tipo_representante:
            self.session.query(UsuarioTipoORM).filter(
                UsuarioTipoORM.id_usuario == representante_id,
                UsuarioTipoORM.id_tipo == tipo_representante.id,
            ).delete(synchronize_session=False)

        self.session.add(LogAuditoriaORM(
            usuario_id=usuario_executor_id,
            acao="REVOGAR",
            entidade="representante",
            entidade_id=representante_id,
            valor_anterior=json.dumps({
                "faculdade_id": representante.id_faculdade_responsavel,
                "ativo": True,
            }),
            valor_novo=json.dumps({
                "faculdade_id": representante.id_faculdade_responsavel,
                "ativo": False,
            }),
            criado_em=datetime.now(timezone.utc),
        ))

        self.session.commit()
        return self.buscar(representante_id)

    @staticmethod
    def _serializar(usuario, aluno, representante, faculdade=None) -> dict:
        faculdade_obj = faculdade or getattr(representante, "faculdade", None)
        faculdade_id = getattr(representante, "id_faculdade_responsavel", None)
        faculdade_nome = getattr(faculdade_obj, "nome_faculdade", None) if faculdade_obj else None
        faculdade_campus = getattr(faculdade_obj, "campus_faculdade", None) if faculdade_obj else None

        return {
            "id": usuario.id,
            "aluno_id": getattr(aluno, "aluno_id", usuario.id),
            "nome": usuario.nome_completo,
            "email": usuario.email,
            "ativo": bool(representante.is_representante_ativo),
            "faculdade_id": faculdade_id,
            "faculdade": {
                "id_faculdade": faculdade_obj.id_faculdade,
                "nome_faculdade": faculdade_obj.nome_faculdade,
                "campus_faculdade": faculdade_obj.campus_faculdade,
                "ativo": faculdade_obj.ativo,
            } if faculdade_obj else None,
            "instituicao": faculdade_nome or "",
            "campus": faculdade_campus or "",
            "curso": getattr(aluno, "curso", "") or "",
            "periodo_ingresso": getattr(aluno, "periodo_ingresso", "") or "",
            "id_foto_aluno": getattr(aluno, "id_foto_aluno", None),
            "criado_em": getattr(usuario, "data_criacao", None),
        }
