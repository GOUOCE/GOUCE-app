from datetime import datetime, timezone
from typing import Callable, Optional

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
from src.modulos.crud_basicos.domain.entities.ponto_de_parada import (
    PontoDeParadaORM,
)
from src.shared.infrastructure.audit_model import LogAuditoriaORM


class PontoDeParadaNaoEncontradoError(ValueError):
    pass


class PontoDeParadaJaCadastradoError(ValueError):
    pass


class PontoDeParadaJaAtivadoError(ValueError):
    pass


class PontoDeParadaJaDesativadoError(ValueError):
    pass


class PontoDeParadaComRotaAtivaError(ValueError):
    pass


class BairroNaoEncontradoError(ValueError):
    pass


class PontoDeParadaRepository:
    def __init__(
        self,
        session: Session,
        rota_ativa_checker: Optional[Callable[[int], bool]] = None,
    ):
        self.session = session
        self._rota_ativa_checker = rota_ativa_checker

    def listar(
        self,
        bairro_id: Optional[int] = None,
        ativo: Optional[bool] = None,
        limite: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> list[PontoDeParadaORM]:
        query = self.session.query(PontoDeParadaORM)

        if bairro_id is not None:
            query = query.filter(
                PontoDeParadaORM.bairro_id == bairro_id
            )

        if ativo is not None:
            query = query.filter(
                PontoDeParadaORM.ativo == ativo
            )

        query = query.order_by(
            PontoDeParadaORM.nome.asc(),
            PontoDeParadaORM.ponto_id.asc(),
        )

        if offset is not None:
            query = query.offset(offset)

        if limite is not None:
            query = query.limit(limite)

        return query.all()

    def buscar_por_id(
        self,
        ponto_id: int,
    ) -> Optional[PontoDeParadaORM]:
        return (
            self.session.query(PontoDeParadaORM)
            .filter(PontoDeParadaORM.ponto_id == ponto_id)
            .first()
        )

    def existe_por_nome(
        self,
        nome: str,
        bairro_id: Optional[int] = None,
        ignorar_ponto_id: Optional[int] = None,
    ) -> bool:
        nome_limpo = nome.strip().lower()

        query = self.session.query(PontoDeParadaORM.ponto_id).filter(
            func.lower(func.trim(PontoDeParadaORM.nome)) == nome_limpo
        )

        if bairro_id is not None:
            query = query.filter(PontoDeParadaORM.bairro_id == bairro_id)

        if ignorar_ponto_id is not None:
            query = query.filter(
                PontoDeParadaORM.ponto_id != ignorar_ponto_id
            )

        return query.first() is not None

    def ponto_existe_no_sistema(
        self,
        nome_ponto: str,
        ignorar_ponto_id: Optional[int] = None,
    ) -> bool:
        return self.existe_por_nome(nome=nome_ponto, ignorar_ponto_id=ignorar_ponto_id)

    def bairro_existe(self, bairro_id: int) -> bool:
        return (
            self.session.query(BairroORM.bairro_id)
            .filter(BairroORM.bairro_id == bairro_id)
            .first()
        ) is not None

    def criar(
        self,
        nome: str,
        bairro_id: int,
    ) -> PontoDeParadaORM:
        pontos = self.criar_varios(
            bairro_id=bairro_id,
            nomes=[nome],
        )
        return pontos[0]

    def criar_varios(
        self,
        bairro_id: int,
        nomes: list[str],
    ) -> list[PontoDeParadaORM]:
        if not self.bairro_existe(bairro_id):
            raise BairroNaoEncontradoError(
                "Bairro não encontrado."
            )

        if not nomes:
            raise ValueError(
                "Informe pelo menos um ponto de parada."
            )

        pontos = []
        nomes_recebidos = set()

        for nome in nomes:
            if nome is None:
                raise ValueError("O nome do ponto de parada não pode ser vazio.")
            nome_limpo = str(nome).strip()

            if not nome_limpo:
                raise ValueError(
                    "O nome do ponto de parada não pode ser vazio."
                )

            nome_normalizado = nome_limpo.casefold()

            if nome_normalizado in nomes_recebidos:
                raise PontoDeParadaJaCadastradoError(
                    "Esta localidade já está cadastrada."
                )

            if self.ponto_existe_no_sistema(nome_limpo):
                raise PontoDeParadaJaCadastradoError(
                    "Esta localidade já está cadastrada."
                )

            nomes_recebidos.add(nome_normalizado)

            pontos.append(
                PontoDeParadaORM(
                    nome=nome_limpo,
                    bairro_id=bairro_id,
                    ativo=True,
                )
            )

        try:
            self.session.add_all(pontos)
            self.session.commit()

            for ponto in pontos:
                self.session.refresh(ponto)

            return pontos

        except IntegrityError:
            self.session.rollback()
            raise PontoDeParadaJaCadastradoError(
                "Esta localidade já está cadastrada."
            )

    def atualizar(
        self,
        ponto_id: int,
        nome: Optional[str] = None,
        bairro_id: Optional[int] = None,
    ) -> PontoDeParadaORM:
        ponto = self.buscar_por_id(ponto_id)

        if not ponto:
            raise PontoDeParadaNaoEncontradoError(
                "Ponto de parada não encontrado."
            )

        nome_final = str(nome).strip() if nome is not None else ponto.nome
        bairro_final = bairro_id if bairro_id is not None else ponto.bairro_id

        if not nome_final:
            raise ValueError(
                "O nome do ponto de parada não pode ser vazio."
            )

        if not self.bairro_existe(bairro_final):
            raise BairroNaoEncontradoError(
                "Bairro não encontrado."
            )

        if self.ponto_existe_no_sistema(
            nome_final,
            ignorar_ponto_id=ponto_id,
        ):
            raise PontoDeParadaJaCadastradoError(
                "Esta localidade já está cadastrada."
            )

        ponto.nome = nome_final
        ponto.bairro_id = bairro_final

        try:
            self.session.commit()
            self.session.refresh(ponto)
            return ponto

        except IntegrityError:
            self.session.rollback()
            raise PontoDeParadaJaCadastradoError(
                "Esta localidade já está cadastrada."
            )

    def possui_rota_ativa(self, ponto_id: int) -> bool:
        if self._rota_ativa_checker is not None:
            return bool(self._rota_ativa_checker(ponto_id))
        return False

    def ativar(
        self,
        ponto_id: int,
        usuario_executor_id: Optional[int] = None,
    ) -> PontoDeParadaORM:
        ponto = self.buscar_por_id(ponto_id)

        if not ponto:
            raise PontoDeParadaNaoEncontradoError(
                "Ponto de parada não encontrado."
            )

        if ponto.ativo:
            raise PontoDeParadaJaAtivadoError(
                "Ponto de parada já está ativado."
            )

        ponto.ativo = True

        log = LogAuditoriaORM(
            usuario_id=usuario_executor_id,
            acao="ATIVAR",
            entidade="ponto_de_parada",
            entidade_id=ponto_id,
            valor_anterior="inativo",
            valor_novo="ativo",
            criado_em=datetime.now(timezone.utc),
        )

        try:
            self.session.add(log)
            self.session.commit()
            self.session.refresh(ponto)
            return ponto

        except Exception:
            self.session.rollback()
            raise

    def inativar(
        self,
        ponto_id: int,
        usuario_executor_id: Optional[int] = None,
    ) -> PontoDeParadaORM:
        ponto = self.buscar_por_id(ponto_id)

        if not ponto:
            raise PontoDeParadaNaoEncontradoError(
                "Ponto de parada não encontrado."
            )

        if not ponto.ativo:
            raise PontoDeParadaJaDesativadoError(
                "Ponto de parada já está desativado."
            )

        if self.possui_rota_ativa(ponto_id):
            raise PontoDeParadaComRotaAtivaError(
                "Este ponto pertence a uma rota ativa. Remova-o da rota antes de continuar."
            )

        ponto.ativo = False

        log = LogAuditoriaORM(
            usuario_id=usuario_executor_id,
            acao="INATIVAR",
            entidade="ponto_de_parada",
            entidade_id=ponto_id,
            valor_anterior="ativo",
            valor_novo="inativo",
            criado_em=datetime.now(timezone.utc),
        )

        try:
            self.session.add(log)
            self.session.commit()
            self.session.refresh(ponto)
            return ponto

        except Exception:
            self.session.rollback()
            raise
