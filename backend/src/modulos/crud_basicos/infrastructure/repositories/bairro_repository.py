import json
from datetime import datetime, timezone
from typing import Callable, Optional

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
from src.modulos.crud_basicos.domain.entities.ponto_de_parada import (
    PontoDeParadaORM,
)
from src.modulos.crud_basicos.infrastructure.repositories.ponto_parada_repository import (
    PontoDeParadaComRotaAtivaError,
    PontoDeParadaJaAtivadoError,
    PontoDeParadaJaDesativadoError,
    PontoDeParadaNaoEncontradoError,
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


class UltimoPontoAtivoError(ValueError):
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
                    f"O ponto de parada '{nome_limpo}' está repetido neste bairro."
                )

            nomes_encontrados.add(nome_normalizado)
            pontos_limpos.append(nome_limpo)

        return pontos_limpos

    def criar(
        self,
        nome: str,
        pontos_de_parada: list[str],
        usuario_executor_id: Optional[int] = None,
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
            self.session.flush()
            self._registrar(
                usuario_executor_id,
                "CRIAR",
                bairro.bairro_id,
                None,
                self._snapshot(bairro),
            )
            self.session.commit()
            self.session.refresh(bairro)

            return self.buscar_por_id(bairro.bairro_id)

        except IntegrityError as exc:
            self.session.rollback()
            if "ponto_de_parada" in str(exc.orig).lower():
                raise PontoDeParadaJaCadastradoError(
                    "Existem pontos de parada repetidos neste bairro."
                )
            raise BairroJaCadastradoError(
                "Esta localidade já está cadastrada."
            )
        except Exception:
            self.session.rollback()
            raise

    def atualizar(
        self,
        bairro_id: int,
        nome: Optional[str] = None,
        pontos_de_parada: Optional[list[str]] = None,
        usuario_executor_id: Optional[int] = None,
    ) -> BairroORM:
        bairro = self.buscar_por_id(bairro_id)

        if not bairro:
            raise BairroNaoEncontradoError(
                "Bairro não encontrado."
            )

        antes = self._snapshot(bairro)

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

            pontos_existentes_map = {
                ponto.nome.strip().casefold(): ponto
                for ponto in list(bairro.pontos_de_parada)
            }
            novos_nomes_normalizados = {p.casefold() for p in pontos_limpos}

            # Inativar pontos que não foram mantidos (soft delete) em vez de remover
            for nome_antigo, ponto_obj in list(pontos_existentes_map.items()):
                if nome_antigo not in novos_nomes_normalizados:
                    ponto_obj.ativo = False

            # Adicionar ou reativar pontos
            for nome_ponto in pontos_limpos:
                nome_norm = nome_ponto.casefold()
                if nome_norm in pontos_existentes_map:
                    ponto_existente = pontos_existentes_map[nome_norm]
                    ponto_existente.nome = nome_ponto
                    ponto_existente.ativo = True
                else:
                    bairro.pontos_de_parada.append(
                        PontoDeParadaORM(
                            nome=nome_ponto,
                            ativo=True,
                        )
                    )

        try:
            self.session.flush()
            depois = self._snapshot(bairro)
            if depois != antes:
                self._registrar(
                    usuario_executor_id, "EDITAR", bairro.bairro_id, antes, depois
                )
            self.session.commit()
            self.session.refresh(bairro)

            return self.buscar_por_id(bairro.bairro_id)

        except IntegrityError as exc:
            self.session.rollback()
            if "ponto_de_parada" in str(exc.orig).lower():
                raise PontoDeParadaJaCadastradoError(
                    "Existem pontos de parada repetidos neste bairro."
                )
            raise BairroJaCadastradoError(
                "Esta localidade já está cadastrada."
            )
        except Exception:
            self.session.rollback()
            raise

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

    def ativar_ponto(
        self,
        bairro_id: int,
        ponto_id: int,
        usuario_executor_id: Optional[int] = None,
    ) -> BairroORM:
        return self._alterar_status_ponto(
            bairro_id, ponto_id, True, usuario_executor_id
        )

    def inativar_ponto(
        self,
        bairro_id: int,
        ponto_id: int,
        usuario_executor_id: Optional[int] = None,
    ) -> BairroORM:
        return self._alterar_status_ponto(
            bairro_id, ponto_id, False, usuario_executor_id
        )

    def _alterar_status_ponto(
        self,
        bairro_id: int,
        ponto_id: int,
        ativo: bool,
        usuario_executor_id: Optional[int],
    ) -> BairroORM:
        bairro = self.buscar_por_id(bairro_id)

        if not bairro:
            raise BairroNaoEncontradoError("Bairro não encontrado.")

        ponto = next(
            (p for p in bairro.pontos_de_parada if p.ponto_id == ponto_id),
            None,
        )

        if ponto is None:
            raise PontoDeParadaNaoEncontradoError(
                "Ponto de parada não encontrado."
            )

        if bool(ponto.ativo) == ativo:
            raise (
                PontoDeParadaJaAtivadoError("Ponto de parada já está ativado.")
                if ativo
                else PontoDeParadaJaDesativadoError(
                    "Ponto de parada já está desativado."
                )
            )

        if not ativo:
            # A rota vincula bairros: o ponto está em rota ativa quando o bairro está.
            if self.possui_rota_ativa(bairro_id):
                raise PontoDeParadaComRotaAtivaError(
                    "Este ponto de parada não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar."
                )

            if sum(1 for p in bairro.pontos_de_parada if p.ativo) <= 1:
                raise UltimoPontoAtivoError(
                    "O bairro precisa ter ao menos um ponto de parada ativo."
                )

        ponto.ativo = ativo

        try:
            self._registrar(
                usuario_executor_id,
                "ATIVAR" if ativo else "INATIVAR",
                ponto_id,
                "inativo" if ativo else "ativo",
                "ativo" if ativo else "inativo",
                entidade="ponto_de_parada",
            )
            self.session.commit()
            self.session.refresh(bairro)
            return self.buscar_por_id(bairro_id)

        except Exception:
            self.session.rollback()
            raise

    def _registrar(
        self,
        usuario_id: Optional[int],
        acao: str,
        entidade_id: int,
        valor_anterior: Optional[str],
        valor_novo: Optional[str],
        entidade: str = "bairro",
    ) -> None:
        self.session.add(
            LogAuditoriaORM(
                usuario_id=usuario_id,
                acao=acao,
                entidade=entidade,
                entidade_id=entidade_id,
                valor_anterior=valor_anterior,
                valor_novo=valor_novo,
                criado_em=datetime.now(timezone.utc),
            )
        )

    @staticmethod
    def _snapshot(bairro: BairroORM) -> str:
        return json.dumps(
            {
                "nome": bairro.nome,
                "pontos_de_parada": [
                    {"ponto_id": p.ponto_id, "nome": p.nome, "ativo": bool(p.ativo)}
                    for p in sorted(
                        bairro.pontos_de_parada,
                        key=lambda p: (p.ponto_id or 0, p.nome),
                    )
                ],
            },
            ensure_ascii=False,
            sort_keys=True,
        )
