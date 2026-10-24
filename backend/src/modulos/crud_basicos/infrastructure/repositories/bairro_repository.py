from datetime import datetime, timezone
from typing import Callable, Optional

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
from src.modulos.crud_basicos.domain.entities.ponto_de_parada import (
    PontoDeParadaORM,
)
from src.shared.infrastructure.audit_model import LogAuditoriaORM


class BairroJaCadastradoError(ValueError):
    pass


class BairroNaoEncontradoError(ValueError):
    pass


class BairroJaAtivadoError(ValueError):
    pass


class BairroJaDesativadoError(ValueError):
    pass


class PontoDeParadaJaCadastradoError(ValueError):
    pass


class BairroComRotaAtivaError(ValueError):
    pass


class BairroRepository:
    def __init__(
        self,
        session: Session,
        rota_ativa_checker: Optional[Callable[[int], bool]] = None,
    ):
        self.session = session
        self._rota_ativa_checker = rota_ativa_checker

    def listar(
        self,
        ativo: Optional[bool] = None,
        limite: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> list[BairroORM]:
        query = self.session.query(BairroORM).options(
            selectinload(BairroORM.pontos_de_parada)
        )

        if ativo is not None:
            query = query.filter(BairroORM.ativo == ativo)

        query = query.order_by(
            BairroORM.nome.asc(),
            BairroORM.bairro_id.asc(),
        )

        if offset is not None:
            query = query.offset(offset)

        if limite is not None:
            query = query.limit(limite)

        return query.all()

    def buscar_por_id(
        self,
        bairro_id: int,
    ) -> Optional[BairroORM]:
        return (
            self.session.query(BairroORM)
            .options(selectinload(BairroORM.pontos_de_parada))
            .filter(BairroORM.bairro_id == bairro_id)
            .first()
        )

    def existe_por_nome(
        self,
        nome: str,
        ignorar_bairro_id: Optional[int] = None,
    ) -> bool:
        nome_limpo = nome.strip().lower()

        query = self.session.query(BairroORM.bairro_id).filter(
            func.lower(func.trim(BairroORM.nome)) == nome_limpo
        )

        if ignorar_bairro_id is not None:
            query = query.filter(
                BairroORM.bairro_id != ignorar_bairro_id
            )

        return query.first() is not None

    def ponto_existe_no_sistema(
        self,
        nome_ponto: str,
        ignorar_ponto_ids: Optional[list[int]] = None,
    ) -> bool:
        """Verifica se já existe ponto de parada com este nome no sistema (ativo ou inativo)."""
        nome_limpo = nome_ponto.strip().lower()
        query = self.session.query(PontoDeParadaORM.ponto_id).filter(
            func.lower(func.trim(PontoDeParadaORM.nome)) == nome_limpo
        )
        if ignorar_ponto_ids:
            query = query.filter(PontoDeParadaORM.ponto_id.notin_(ignorar_ponto_ids))
        return query.first() is not None

    def validar_pontos(
        self,
        pontos_de_parada: list[str],
    ) -> list[str]:
        if not pontos_de_parada:
            raise ValueError(
                "O bairro deve possuir pelo menos um ponto de parada."
            )

        pontos_limpos = []
        nomes_encontrados = set()

        for nome in pontos_de_parada:
            if nome is None:
                raise ValueError("O nome do ponto de parada não pode ser vazio.")
            nome_limpo = str(nome).strip()

            if not nome_limpo:
                raise ValueError(
                    "O nome do ponto de parada não pode ser vazio."
                )

            nome_normalizado = nome_limpo.casefold()

            if nome_normalizado in nomes_encontrados:
                raise PontoDeParadaJaCadastradoError(
                    "Esta localidade já está cadastrada."
                )

            nomes_encontrados.add(nome_normalizado)
            pontos_limpos.append(nome_limpo)

        return pontos_limpos

    def criar(
        self,
        nome: str,
        pontos_de_parada: list[str],
    ) -> BairroORM:
        if nome is None:
            raise ValueError("O nome do bairro não pode ser vazio.")
        nome_limpo = str(nome).strip()

        if not nome_limpo:
            raise ValueError(
                "O nome do bairro não pode ser vazio."
            )

        if self.existe_por_nome(nome_limpo):
            raise BairroJaCadastradoError(
                "Esta localidade já está cadastrada."
            )

        pontos_limpos = self.validar_pontos(pontos_de_parada)

        for ponto_nome in pontos_limpos:
            if self.ponto_existe_no_sistema(ponto_nome):
                raise PontoDeParadaJaCadastradoError(
                    "Esta localidade já está cadastrada."
                )

        bairro = BairroORM(
            nome=nome_limpo,
            ativo=True,
            pontos_de_parada=[
                PontoDeParadaORM(
                    nome=nome_ponto,
                    ativo=True,
                )
                for nome_ponto in pontos_limpos
            ],
        )

        try:
            self.session.add(bairro)
            self.session.commit()
            self.session.refresh(bairro)

            return self.buscar_por_id(bairro.bairro_id)

        except IntegrityError:
            self.session.rollback()
            raise BairroJaCadastradoError(
                "Esta localidade já está cadastrada."
            )

    def atualizar(
        self,
        bairro_id: int,
        nome: Optional[str] = None,
        pontos_de_parada: Optional[list[str]] = None,
    ) -> BairroORM:
        bairro = self.buscar_por_id(bairro_id)

        if not bairro:
            raise BairroNaoEncontradoError(
                "Bairro não encontrado."
            )

        if nome is not None:
            nome_limpo = str(nome).strip()

            if not nome_limpo:
                raise ValueError(
                    "O nome do bairro não pode ser vazio."
                )

            if self.existe_por_nome(
                nome_limpo,
                ignorar_bairro_id=bairro_id,
            ):
                raise BairroJaCadastradoError(
                    "Esta localidade já está cadastrada."
                )

            bairro.nome = nome_limpo

        if pontos_de_parada is not None:
            pontos_limpos = self.validar_pontos(pontos_de_parada)

            # Validar unicidade dos pontos com outros no sistema que não pertencem a este bairro
            ids_atuais = [p.ponto_id for p in bairro.pontos_de_parada if p.ponto_id is not None]
            for ponto_nome in pontos_limpos:
                if self.ponto_existe_no_sistema(ponto_nome, ignorar_ponto_ids=ids_atuais):
                    raise PontoDeParadaJaCadastradoError(
                        "Esta localidade já está cadastrada."
                    )

            # Sincronizar pontos de parada do bairro mantendo ou recriando
            pontos_existentes_map = {
                ponto.nome.strip().casefold(): ponto
                for ponto in list(bairro.pontos_de_parada)
            }
            novos_nomes_normalizados = {p.casefold() for p in pontos_limpos}

            # Remover pontos que não foram mantidos
            for nome_antigo, ponto_obj in list(pontos_existentes_map.items()):
                if nome_antigo not in novos_nomes_normalizados:
                    bairro.pontos_de_parada.remove(ponto_obj)

            # Adicionar ou atualizar novos
            for nome_ponto in pontos_limpos:
                nome_norm = nome_ponto.casefold()
                if nome_norm in pontos_existentes_map:
                    ponto_existente = pontos_existentes_map[nome_norm]
                    ponto_existente.nome = nome_ponto
                else:
                    bairro.pontos_de_parada.append(
                        PontoDeParadaORM(
                            nome=nome_ponto,
                            ativo=True,
                        )
                    )

        try:
            self.session.commit()
            self.session.refresh(bairro)

            return self.buscar_por_id(bairro.bairro_id)

        except IntegrityError:
            self.session.rollback()
            raise BairroJaCadastradoError(
                "Esta localidade já está cadastrada."
            )

    def possui_rota_ativa(self, bairro_id: int) -> bool:
        if self._rota_ativa_checker is not None:
            return bool(self._rota_ativa_checker(bairro_id))
        return False

    def ativar(
        self,
        bairro_id: int,
        usuario_executor_id: Optional[int] = None,
    ) -> BairroORM:
        bairro = self.buscar_por_id(bairro_id)

        if not bairro:
            raise BairroNaoEncontradoError(
                "Bairro não encontrado."
            )

        if bairro.ativo:
            raise BairroJaAtivadoError(
                "Bairro já está ativado."
            )

        bairro.ativo = True

        log = LogAuditoriaORM(
            usuario_id=usuario_executor_id,
            acao="ATIVAR",
            entidade="bairro",
            entidade_id=bairro_id,
            valor_anterior="inativo",
            valor_novo="ativo",
            criado_em=datetime.now(timezone.utc),
        )

        try:
            self.session.add(log)
            self.session.commit()
            self.session.refresh(bairro)
            return bairro

        except Exception:
            self.session.rollback()
            raise

    def inativar(
        self,
        bairro_id: int,
        usuario_executor_id: Optional[int] = None,
    ) -> BairroORM:
        bairro = self.buscar_por_id(bairro_id)

        if not bairro:
            raise BairroNaoEncontradoError(
                "Bairro não encontrado."
            )

        if not bairro.ativo:
            raise BairroJaDesativadoError(
                "Bairro já está desativado."
            )

        if self.possui_rota_ativa(bairro_id):
            raise BairroComRotaAtivaError(
                "Este bairro não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar."
            )

        bairro.ativo = False

        log = LogAuditoriaORM(
            usuario_id=usuario_executor_id,
            acao="INATIVAR",
            entidade="bairro",
            entidade_id=bairro_id,
            valor_anterior="ativo",
            valor_novo="inativo",
            criado_em=datetime.now(timezone.utc),
        )

        try:
            self.session.add(log)
            self.session.commit()
            self.session.refresh(bairro)
            return bairro

        except Exception:
            self.session.rollback()
            raise
