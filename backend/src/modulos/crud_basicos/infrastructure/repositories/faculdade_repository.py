from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
from src.shared.infrastructure.audit_model import LogAuditoriaORM


class FaculdadeJaCadastradaError(ValueError):
    """Lançada quando a faculdade já está cadastrada (nome + campus duplicado)."""
    pass


class FaculdadeNaoEncontradaError(ValueError):
    """Lançada quando a faculdade não é encontrada."""
    pass


class FaculdadeRepository:
    def __init__(self, session: Session):
        self.session = session

    def listar(
        self,
        ativo: Optional[bool] = None,
        limite: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> list[FaculdadeORM]:
        query = self.session.query(FaculdadeORM)
        if ativo is not None:
            query = query.filter(FaculdadeORM.ativo == ativo)
        query = query.order_by(
            FaculdadeORM.nome_faculdade.asc(),
            FaculdadeORM.campus_faculdade.asc(),
        )
        if offset is not None:
            query = query.offset(offset)
        if limite is not None:
            query = query.limit(limite)
        return query.all()

    def buscar_por_id(self, faculdade_id: int) -> Optional[FaculdadeORM]:
        return (
            self.session.query(FaculdadeORM)
            .filter(FaculdadeORM.id_faculdade == faculdade_id)
            .first()
        )

    def existe_por_nome_e_campus(
        self,
        nome: str,
        campus: str,
        ignorar_id: Optional[int] = None,
    ) -> bool:
        nome_limpo = nome.strip()
        campus_limpo = campus.strip()
        query = self.session.query(FaculdadeORM.id_faculdade).filter(
            func.lower(FaculdadeORM.nome_faculdade) == nome_limpo.lower(),
            func.lower(FaculdadeORM.campus_faculdade) == campus_limpo.lower(),
        )
        if ignorar_id is not None:
            query = query.filter(FaculdadeORM.id_faculdade != ignorar_id)
        return query.first() is not None

    def criar(self, nome: str, campus: str, sigla: Optional[str] = None) -> FaculdadeORM:
        nome_limpo = nome.strip()
        campus_limpo = campus.strip()
        sigla_limpa = sigla.strip() if sigla is not None else None

        if self.existe_por_nome_e_campus(nome_limpo, campus_limpo):
            raise FaculdadeJaCadastradaError("Esta faculdade já está cadastrada.")

        faculdade = FaculdadeORM(
            nome_faculdade=nome_limpo,
            sigla=sigla_limpa,
            campus_faculdade=campus_limpo,
            ativo=True,
        )
        try:
            self.session.add(faculdade)
            self.session.commit()
            self.session.refresh(faculdade)
            return faculdade
        except IntegrityError:
            self.session.rollback()
            raise FaculdadeJaCadastradaError("Esta faculdade já está cadastrada.")

    def atualizar(
        self,
        faculdade_id: int,
        nome: Optional[str] = None,
        campus: Optional[str] = None,
        sigla: Optional[str] = None,
        ativo: Optional[bool] = None,
    ) -> FaculdadeORM:
        faculdade = self.buscar_por_id(faculdade_id)
        if not faculdade:
            raise FaculdadeNaoEncontradaError("Faculdade não encontrada.")

        nome_final = nome.strip() if nome is not None else faculdade.nome_faculdade
        campus_final = campus.strip() if campus is not None else faculdade.campus_faculdade
        sigla_final = sigla.strip() if sigla is not None else faculdade.sigla

        if self.existe_por_nome_e_campus(nome_final, campus_final, ignorar_id=faculdade_id):
            raise FaculdadeJaCadastradaError("Esta faculdade já está cadastrada.")

        if nome is not None:
            faculdade.nome_faculdade = nome_final
        if campus is not None:
            faculdade.campus_faculdade = campus_final
        if sigla is not None:
            faculdade.sigla = sigla_final
        if ativo is not None:
            faculdade.ativo = ativo

        try:
            self.session.commit()
            self.session.refresh(faculdade)
            return faculdade
        except IntegrityError:
            self.session.rollback()
            raise FaculdadeJaCadastradaError("Esta faculdade já está cadastrada.")

    def ativar(
        self,
        faculdade_id: int,
        usuario_executor_id: Optional[int] = None,
    ) -> FaculdadeORM:
        faculdade = self.buscar_por_id(faculdade_id)
        if not faculdade:
            raise FaculdadeNaoEncontradaError("Faculdade não encontrada.")

        valor_anterior = "ativo" if faculdade.ativo else "inativo"
        faculdade.ativo = True

        log = LogAuditoriaORM(
            usuario_id=usuario_executor_id,
            acao="ATIVAR",
            entidade="faculdade",
            entidade_id=faculdade_id,
            valor_anterior=valor_anterior,
            valor_novo="ativo",
            criado_em=datetime.now(timezone.utc),
        )
        self.session.add(log)
        self.session.commit()
        self.session.refresh(faculdade)
        return faculdade

    def inativar(
        self,
        faculdade_id: int,
        usuario_executor_id: Optional[int] = None,
    ) -> FaculdadeORM:
        faculdade = self.buscar_por_id(faculdade_id)
        if not faculdade:
            raise FaculdadeNaoEncontradaError("Faculdade não encontrada.")

        valor_anterior = "ativo" if faculdade.ativo else "inativo"
        faculdade.ativo = False

        log = LogAuditoriaORM(
            usuario_id=usuario_executor_id,
            acao="INATIVAR",
            entidade="faculdade",
            entidade_id=faculdade_id,
            valor_anterior=valor_anterior,
            valor_novo="inativo",
            criado_em=datetime.now(timezone.utc),
        )
        self.session.add(log)
        self.session.commit()
        self.session.refresh(faculdade)
        return faculdade
