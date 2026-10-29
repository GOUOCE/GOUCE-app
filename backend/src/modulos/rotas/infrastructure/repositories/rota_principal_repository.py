"""Persistência das rotas principais e de seus vínculos.

Bairros, faculdades da ida e faculdades da volta são vínculos independentes.
Toda escrita (criar, editar, inativar, reativar) grava o log de auditoria na
mesma transação; qualquer falha desfaz a operação inteira. A inativação lê a
linha da rota com ``FOR UPDATE`` e confere as complementares ativas dentro da
transação; criar, trocar o vínculo ou reativar uma complementar trava a mesma
linha, então as duas operações se serializam.
"""

import json
from datetime import time
from typing import Callable, Optional

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
from src.modulos.rotas.infrastructure.nome_rota import (
    MENSAGEM_NOME_ROTA_EM_USO,
    nome_rota_em_uso,
    travar_nome_rota,
)
from src.modulos.rotas.model.entities.rota_complementar import RotaComplementarORM
from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM
from src.modulos.usuarios.model.entities.usuario import UsuarioORM  # noqa: F401
from src.shared.infrastructure.audit_model import LogAuditoriaORM

ENTIDADE_AUDITORIA = "rota_principal"

MENSAGEM_ROTA_COM_COMPLEMENTARES_ATIVAS = (
    "Esta rota possui rotas complementares ativas vinculadas. "
    "Inative ou desvincule as rotas complementares antes de continuar."
)


class RotaComComplementaresAtivasError(ValueError):
    """Impede a inativação de rota principal que tem rotas complementares ativas."""


class RotaPrincipalNomeEmUsoError(ValueError):
    """Indica que já existe outra rota principal ou complementar (ativa ou inativa) com o mesmo nome."""


class RotaReferenciaInvalidaError(ValueError):
    """Bairro ou faculdade inexistente/inativo informado para o vínculo."""

    def __init__(self, field: str, message: str):
        self.field = field
        super().__init__(message)


class RotaPrincipalRepository:
    """Repository SQLAlchemy das rotas principais."""

    def __init__(
        self,
        session: Session,
        agendamentos_futuros_checker: Optional[Callable[[int], bool]] = None,
    ):
        self.session = session
        self._agendamentos_futuros_checker = agendamentos_futuros_checker

    # ------------------------------------------------------------ leitura
    def listar(
        self,
        ativo: bool | None = None,
        nome: str | None = None,
    ) -> list[dict]:
        query = self._query_com_vinculos()
        if ativo is not None:
            query = query.filter(RotaPrincipalORM.ativo == ativo)
        if nome:
            query = query.filter(
                func.lower(RotaPrincipalORM.nome).contains(
                    nome.lower(), autoescape=True
                )
            )
        rotas = query.order_by(
            func.lower(RotaPrincipalORM.nome), RotaPrincipalORM.id
        ).all()
        return [self._serializar(rota) for rota in rotas]

    def buscar(self, rota_id: int) -> dict | None:
        rota = self._buscar_orm(rota_id)
        return self._serializar(rota) if rota else None

    def listar_opcoes(self) -> dict:
        """Somente bairros e faculdades ativos, para as listas de seleção."""
        bairros = (
            self.session.query(BairroORM)
            .filter(BairroORM.ativo.is_(True))
            .order_by(func.lower(BairroORM.nome), BairroORM.bairro_id)
            .all()
        )
        faculdades = (
            self.session.query(FaculdadeORM)
            .filter(FaculdadeORM.ativo.is_(True))
            .order_by(
                func.lower(FaculdadeORM.nome_faculdade),
                func.lower(FaculdadeORM.campus_faculdade),
                FaculdadeORM.id_faculdade,
            )
            .all()
        )
        return {
            "bairros": [self._ref_bairro(b) for b in bairros],
            "faculdades": [self._ref_faculdade(f) for f in faculdades],
        }

    def nome_em_uso(self, nome: str, ignorar_rota_id: int | None = None) -> bool:
        """Confere o nome nas rotas principais e nas complementares (#309)."""
        return nome_rota_em_uso(
            self.session, nome, ignorar_principal_id=ignorar_rota_id
        )

    # ------------------------------------------------------------ escrita
    def criar(
        self,
        nome: str,
        horario_saida: time,
        horario_retorno: time,
        bairros_ids: list[int],
        faculdades_ida_ids: list[int],
        faculdades_volta_ids: list[int],
        usuario_executor_id: int,
    ) -> dict:
        try:
            travar_nome_rota(self.session, nome)
            if self.nome_em_uso(nome):
                raise RotaPrincipalNomeEmUsoError(MENSAGEM_NOME_ROTA_EM_USO)

            rota = RotaPrincipalORM(
                nome=nome.strip(),
                horario_saida=horario_saida,
                horario_retorno=horario_retorno,
                ativo=True,
            )
            rota.bairros = self._carregar_bairros(bairros_ids, set())
            rota.faculdades_ida = self._carregar_faculdades(
                "faculdades_ida_ids", faculdades_ida_ids, set()
            )
            rota.faculdades_volta = self._carregar_faculdades(
                "faculdades_volta_ids", faculdades_volta_ids, set()
            )
            self.session.add(rota)
            self.session.flush()
            self._registrar(
                usuario_executor_id,
                "CRIAR",
                rota.id,
                None,
                self._snapshot(rota),
            )
            self.session.commit()
            self.session.refresh(rota)
            return self._serializar(rota)
        except IntegrityError as error:
            self.session.rollback()
            if self.nome_em_uso(nome):
                raise RotaPrincipalNomeEmUsoError(MENSAGEM_NOME_ROTA_EM_USO) from error
            raise
        except Exception:
            self.session.rollback()
            raise

    def atualizar(
        self,
        rota_id: int,
        campos: dict,
        usuario_executor_id: int,
    ) -> dict | None:
        """Aplica somente as chaves presentes em ``campos``.

        Listas enviadas substituem as atuais. Vínculos que já existiam podem
        ser mantidos mesmo que o bairro/faculdade tenha sido inativado depois;
        apenas os vínculos novos exigem registros ativos.
        """
        nome = campos.get("nome")
        try:
            rota = self._buscar_orm(rota_id)
            if rota is None:
                return None
            antes = self._snapshot(rota)

            if "nome" in campos:
                travar_nome_rota(self.session, nome)
                if self.nome_em_uso(nome, ignorar_rota_id=rota_id):
                    raise RotaPrincipalNomeEmUsoError(MENSAGEM_NOME_ROTA_EM_USO)

            novos_bairros = novas_ida = novas_volta = None
            if "bairros_ids" in campos:
                novos_bairros = self._carregar_bairros(
                    campos["bairros_ids"], {b.bairro_id for b in rota.bairros}
                )
            if "faculdades_ida_ids" in campos:
                novas_ida = self._carregar_faculdades(
                    "faculdades_ida_ids",
                    campos["faculdades_ida_ids"],
                    {f.id_faculdade for f in rota.faculdades_ida},
                )
            if "faculdades_volta_ids" in campos:
                novas_volta = self._carregar_faculdades(
                    "faculdades_volta_ids",
                    campos["faculdades_volta_ids"],
                    {f.id_faculdade for f in rota.faculdades_volta},
                )

            if "nome" in campos:
                rota.nome = nome.strip()
            if "horario_saida" in campos:
                rota.horario_saida = campos["horario_saida"]
            if "horario_retorno" in campos:
                rota.horario_retorno = campos["horario_retorno"]
            if novos_bairros is not None:
                rota.bairros = novos_bairros
            if novas_ida is not None:
                rota.faculdades_ida = novas_ida
            if novas_volta is not None:
                rota.faculdades_volta = novas_volta

            depois = self._snapshot(rota)
            if depois != antes:
                self._registrar(usuario_executor_id, "EDITAR", rota_id, antes, depois)
            self.session.commit()
            self.session.refresh(rota)
            return self._serializar(rota)
        except IntegrityError as error:
            self.session.rollback()
            if nome is not None and self.nome_em_uso(
                nome, ignorar_rota_id=rota_id
            ):
                raise RotaPrincipalNomeEmUsoError(MENSAGEM_NOME_ROTA_EM_USO) from error
            raise
        except Exception:
            self.session.rollback()
            raise

    def possui_agendamentos_futuros(self, rota_id: int) -> bool:
        """Indica se há alunos agendados para viagens futuras nesta rota.

        TODO(HU-013): a entidade de agendamentos de alunos (criada pela HU-013 -
        Agendamento de Transporte, EP-004, conforme docs/requisitos.md) ainda
        não existe. Quando ela existir, substituir este retorno por uma consulta
        real aos agendamentos da rota com data posterior a hoje (ou injetar essa
        consulta via ``agendamentos_futuros_checker``). Até lá a verificação
        "falha aberto": sem checker injetado, nenhuma inativação é bloqueada.
        """
        if self._agendamentos_futuros_checker is not None:
            return bool(self._agendamentos_futuros_checker(rota_id))
        return False

    def possui_complementares_ativas(self, rota_id: int) -> bool:
        """Indica se alguma rota complementar ativa está vinculada a esta rota."""
        return (
            self.session.query(RotaComplementarORM.id)
            .filter(
                RotaComplementarORM.rota_principal_id == rota_id,
                RotaComplementarORM.ativo.is_(True),
            )
            .first()
            is not None
        )

    def possui_vinculo_inativo(self, rota_id: int) -> bool:
        """Indica se algum bairro ou faculdade (ida ou volta) da rota está inativo."""
        rota = self._buscar_orm(rota_id)
        if rota is None:
            return False
        vinculos = [*rota.bairros, *rota.faculdades_ida, *rota.faculdades_volta]
        return any(not vinculo.ativo for vinculo in vinculos)

    def inativar(self, rota_id: int, usuario_executor_id: int) -> dict | None:
        return self._alterar_status(rota_id, usuario_executor_id, False, "INATIVAR")

    def reativar(self, rota_id: int, usuario_executor_id: int) -> dict | None:
        return self._alterar_status(rota_id, usuario_executor_id, True, "REATIVAR")

    # ------------------------------------------------------------ internos
    def _alterar_status(
        self,
        rota_id: int,
        usuario_executor_id: int,
        ativo: bool,
        acao: str,
    ) -> dict | None:
        try:
            rota = self._buscar_orm(rota_id)
            if rota is None:
                return None
            if not ativo:
                # Trava antes de decidir: o estado e as complementares lidos
                # abaixo já refletem qualquer escrita concorrente confirmada.
                self._ler_para_atualizar(rota_id)
            estado_anterior = bool(rota.ativo)
            if estado_anterior == ativo:
                return self._serializar(rota)
            if not ativo and self.possui_complementares_ativas(rota_id):
                raise RotaComComplementaresAtivasError(
                    MENSAGEM_ROTA_COM_COMPLEMENTARES_ATIVAS
                )

            rota.ativo = ativo
            self._registrar(
                usuario_executor_id,
                acao,
                rota_id,
                "ativo" if estado_anterior else "inativo",
                "ativo" if ativo else "inativo",
            )
            self.session.commit()
            self.session.refresh(rota)
            return self._serializar(rota)
        except Exception:
            self.session.rollback()
            raise

    def _registrar(
        self,
        usuario_id: int,
        acao: str,
        rota_id: int,
        valor_anterior: str | None,
        valor_novo: str | None,
    ) -> None:
        self.session.add(
            LogAuditoriaORM(
                usuario_id=usuario_id,
                acao=acao,
                entidade=ENTIDADE_AUDITORIA,
                entidade_id=rota_id,
                valor_anterior=valor_anterior,
                valor_novo=valor_novo,
            )
        )

    def _query_com_vinculos(self):
        return self.session.query(RotaPrincipalORM).options(
            selectinload(RotaPrincipalORM.bairros),
            selectinload(RotaPrincipalORM.faculdades_ida),
            selectinload(RotaPrincipalORM.faculdades_volta),
        )

    def _buscar_orm(self, rota_id: int) -> RotaPrincipalORM | None:
        return (
            self._query_com_vinculos()
            .filter(RotaPrincipalORM.id == rota_id)
            .first()
        )

    def _ler_para_atualizar(self, rota_id: int) -> RotaPrincipalORM | None:
        """Lê a rota travando a linha até o fim da transação (atualiza a instância carregada)."""
        return (
            self.session.query(RotaPrincipalORM)
            .filter(RotaPrincipalORM.id == rota_id)
            .with_for_update()
            .populate_existing()
            .first()
        )

    def _carregar_bairros(
        self, ids: list[int], ja_vinculados: set[int]
    ) -> list[BairroORM]:
        registros = {
            b.bairro_id: b
            for b in self.session.query(BairroORM)
            .filter(BairroORM.bairro_id.in_(ids))
            .all()
        }
        invalidos = [
            i
            for i in ids
            if i not in registros
            or (not registros[i].ativo and i not in ja_vinculados)
        ]
        if invalidos:
            raise RotaReferenciaInvalidaError(
                "bairros_ids",
                "Bairro inativo ou inexistente (ids: "
                + ", ".join(str(i) for i in invalidos)
                + ").",
            )
        return [registros[i] for i in ids]

    def _carregar_faculdades(
        self, campo: str, ids: list[int], ja_vinculadas: set[int]
    ) -> list[FaculdadeORM]:
        registros = {
            f.id_faculdade: f
            for f in self.session.query(FaculdadeORM)
            .filter(FaculdadeORM.id_faculdade.in_(ids))
            .all()
        }
        invalidos = [
            i
            for i in ids
            if i not in registros
            or (not registros[i].ativo and i not in ja_vinculadas)
        ]
        if invalidos:
            raise RotaReferenciaInvalidaError(
                campo,
                "Faculdade inativa ou inexistente (ids: "
                + ", ".join(str(i) for i in invalidos)
                + ").",
            )
        return [registros[i] for i in ids]

    @staticmethod
    def _snapshot(rota: RotaPrincipalORM) -> str:
        return json.dumps(
            {
                "nome": rota.nome,
                "horario_saida": rota.horario_saida.strftime("%H:%M"),
                "horario_retorno": rota.horario_retorno.strftime("%H:%M"),
                "bairros_ids": sorted(b.bairro_id for b in rota.bairros),
                "faculdades_ida_ids": sorted(
                    f.id_faculdade for f in rota.faculdades_ida
                ),
                "faculdades_volta_ids": sorted(
                    f.id_faculdade for f in rota.faculdades_volta
                ),
                "ativo": bool(rota.ativo),
            },
            ensure_ascii=False,
            sort_keys=True,
        )

    @staticmethod
    def _ref_bairro(bairro: BairroORM) -> dict:
        return {"id": bairro.bairro_id, "nome": bairro.nome}

    @staticmethod
    def _ref_faculdade(faculdade: FaculdadeORM) -> dict:
        return {
            "id": faculdade.id_faculdade,
            "nome": faculdade.nome_faculdade,
            "campus": faculdade.campus_faculdade,
        }

    def _serializar(self, rota: RotaPrincipalORM) -> dict:
        def por_nome(itens, chave):
            return sorted(itens, key=lambda item: (chave(item).casefold(), item["id"]))

        return {
            "id": rota.id,
            "nome": rota.nome,
            "horario_saida": rota.horario_saida.strftime("%H:%M"),
            "horario_retorno": rota.horario_retorno.strftime("%H:%M"),
            "ativo": bool(rota.ativo),
            "bairros": por_nome(
                [self._ref_bairro(b) for b in rota.bairros], lambda i: i["nome"]
            ),
            "faculdades_ida": por_nome(
                [self._ref_faculdade(f) for f in rota.faculdades_ida],
                lambda i: i["nome"],
            ),
            "faculdades_volta": por_nome(
                [self._ref_faculdade(f) for f in rota.faculdades_volta],
                lambda i: i["nome"],
            ),
        }
