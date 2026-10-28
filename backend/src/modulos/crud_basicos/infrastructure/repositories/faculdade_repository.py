import json
from datetime import datetime, timezone
from typing import Callable, Optional

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
from src.shared.infrastructure.audit_model import LogAuditoriaORM

ENTIDADE_AUDITORIA = "faculdade"


class FaculdadeJaCadastradaError(ValueError):
    """Lançada quando a faculdade já está cadastrada (nome + campus duplicado)."""
    pass


class FaculdadeNaoEncontradaError(ValueError):
    """Lançada quando a faculdade não é encontrada."""
    pass

class FaculdadeJaAtivadaError(ValueError):
    """Lançada ao ativar uma faculdade que já está ativa."""
    pass

class FaculdadeJaDesativadaError(ValueError):
    """Lançada ao inativar uma faculdade que já está inativa."""
    pass


class FaculdadeComRotaAtivaError(ValueError):
    """Lançada ao inativar uma faculdade vinculada a uma rota ativa."""
    pass


class FaculdadeRepository:
    def __init__(
        self,
        session: Session,
        rota_ativa_checker: Optional[Callable[[int], bool]] = None,
    ):
        self.session = session
        self._rota_ativa_checker = rota_ativa_checker

    def possui_rota_ativa(self, faculdade_id: int) -> bool:
        if self._rota_ativa_checker is not None:
            return bool(self._rota_ativa_checker(faculdade_id))
        return False

    def _validar_sem_rota_ativa(self, faculdade_id: int) -> None:
        if self.possui_rota_ativa(faculdade_id):
            raise FaculdadeComRotaAtivaError(
                "Esta faculdade não pode ser inativada pois pertence a uma rota ativa. Remova-a da rota antes de continuar."
            )

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

    def criar(
        self,
        nome: str,
        campus: str,
        sigla: Optional[str] = None,
        usuario_executor_id: Optional[int] = None,
    ) -> FaculdadeORM:
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
            self.session.flush()
            self._registrar(
                usuario_executor_id,
                "CRIAR",
                faculdade.id_faculdade,
                None,
                self._snapshot(faculdade),
            )
            self.session.commit()
            self.session.refresh(faculdade)
            return faculdade
        except IntegrityError:
            self.session.rollback()
            raise FaculdadeJaCadastradaError("Esta faculdade já está cadastrada.")
        except Exception:
            self.session.rollback()
            raise

    def atualizar(
        self,
        faculdade_id: int,
        usuario_executor_id: int,
        nome: Optional[str] = None,
        campus: Optional[str] = None,
        sigla: Optional[str] = None,
        ativo: Optional[bool] = None,
    ) -> FaculdadeORM:

        try:
            faculdade = self._buscar_para_atualizar(faculdade_id)
            if not faculdade:
                raise FaculdadeNaoEncontradaError("Faculdade não encontrada.")

            nome_final = nome.strip() if nome is not None else faculdade.nome_faculdade
            campus_final = (
                campus.strip() if campus is not None else faculdade.campus_faculdade
            )
            sigla_final = sigla.strip() if sigla is not None else faculdade.sigla

            if self.existe_por_nome_e_campus(
                nome_final, campus_final, ignorar_id=faculdade_id
            ):
                raise FaculdadeJaCadastradaError("Esta faculdade já está cadastrada.")

            antes = self._snapshot(faculdade)

            if nome is not None:
                faculdade.nome_faculdade = nome_final
            if campus is not None:
                faculdade.campus_faculdade = campus_final
            if sigla is not None:
                faculdade.sigla = sigla_final

            depois = self._snapshot(faculdade)
            if depois != antes:
                self._registrar(
                    usuario_executor_id, "EDITAR", faculdade_id, antes, depois
                )

            if ativo is not None and bool(faculdade.ativo) != ativo:
                self._aplicar_status(faculdade, ativo, usuario_executor_id)

            self.session.commit()
            self.session.refresh(faculdade)
            return faculdade
        except IntegrityError:
            self.session.rollback()
            raise FaculdadeJaCadastradaError("Esta faculdade já está cadastrada.")
        except Exception:
            self.session.rollback()
            raise

    def ativar(
        self,
        faculdade_id: int,
        usuario_executor_id: Optional[int] = None,
    ) -> FaculdadeORM:
        return self._alterar_status(faculdade_id, True, usuario_executor_id)

    def inativar(
        self,
        faculdade_id: int,
        usuario_executor_id: Optional[int] = None,
    ) -> FaculdadeORM:
        return self._alterar_status(faculdade_id, False, usuario_executor_id)

    def _alterar_status(
        self,
        faculdade_id: int,
        ativo: bool,
        usuario_executor_id: Optional[int],
    ) -> FaculdadeORM:
        try:
            faculdade = self._buscar_para_atualizar(faculdade_id)
            if not faculdade:
                raise FaculdadeNaoEncontradaError("Faculdade não encontrada.")
            if bool(faculdade.ativo) == ativo:
                raise (
                    FaculdadeJaAtivadaError("Faculdade já ativada.")
                    if ativo
                    else FaculdadeJaDesativadaError("Faculdade já desativada.")
                )
            self._aplicar_status(faculdade, ativo, usuario_executor_id)
            self.session.commit()
            self.session.refresh(faculdade)
            return faculdade
        except Exception:
            self.session.rollback()
            raise

    def _aplicar_status(
        self,
        faculdade: FaculdadeORM,
        ativo: bool,
        usuario_executor_id: Optional[int],
    ) -> None:

        if not ativo:
            self._validar_sem_rota_ativa(faculdade.id_faculdade)
        anterior = "ativo" if faculdade.ativo else "inativo"
        faculdade.ativo = ativo
        self._registrar(
            usuario_executor_id,
            "ATIVAR" if ativo else "INATIVAR",
            faculdade.id_faculdade,
            anterior,
            "ativo" if ativo else "inativo",
        )

    def _buscar_para_atualizar(self, faculdade_id: int) -> Optional[FaculdadeORM]:
        """Lê a faculdade travando a linha até o fim da transação."""
        return (
            self.session.query(FaculdadeORM)
            .filter(FaculdadeORM.id_faculdade == faculdade_id)
            .with_for_update()
            .populate_existing()
            .first()
        )

    def _registrar(
        self,
        usuario_id: Optional[int],
        acao: str,
        faculdade_id: int,
        valor_anterior: Optional[str],
        valor_novo: Optional[str],
    ) -> None:
        self.session.add(
            LogAuditoriaORM(
                usuario_id=usuario_id,
                acao=acao,
                entidade=ENTIDADE_AUDITORIA,
                entidade_id=faculdade_id,
                valor_anterior=valor_anterior,
                valor_novo=valor_novo,
                criado_em=datetime.now(timezone.utc),
            )
        )

    @staticmethod
    def _snapshot(faculdade: FaculdadeORM) -> str:
        return json.dumps(
            {
                "nome": faculdade.nome_faculdade,
                "campus": faculdade.campus_faculdade,
                "sigla": faculdade.sigla,
            },
            ensure_ascii=False,
            sort_keys=True,
        )