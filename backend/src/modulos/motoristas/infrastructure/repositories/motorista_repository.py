"""Persistência dos cadastros de motoristas.

O repository mantém o modelo persistido separado do contrato público: o ORM
usa ``nome_completo`` e o resultado exposto para as camadas superiores usa
``nome``. Nome e telefone continuam sendo lidos e gravados pelo
``EncryptedString`` definido na entidade.
"""

from typing import Callable, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.modulos.motoristas.model.entities.motorista import MotoristaORM
from src.modulos.usuarios.model.entities.usuario import UsuarioORM  # noqa: F401
from src.shared.infrastructure.audit_model import LogAuditoriaORM
from src.shared.security.lgpd_encryption import hash_telefone


class MotoristaTelefoneEmUsoError(ValueError):
    """Indica que o telefone já pertence a outro motorista."""


class MotoristaRepository:
    """Repository SQLAlchemy para a entidade independente de motorista."""

    def __init__(
        self,
        session: Session,
        alocacoes_futuras_checker: Optional[Callable[[int], bool]] = None,
    ):
        self.session = session
        self._alocacoes_futuras_checker = alocacoes_futuras_checker

    def criar(self, nome: str, telefone: str) -> dict:
        """Cria um motorista sem criar ou alterar registros de usuário."""
        telefone_limpo = telefone.strip()
        try:
            if self.telefone_em_uso(telefone_limpo):
                raise MotoristaTelefoneEmUsoError(
                    "Este profissional já está registrado."
                )

            motorista = MotoristaORM(
                nome_completo=nome.strip(),
                telefone=telefone_limpo,
                telefone_hash=hash_telefone(telefone_limpo),
                ativo=True,
            )
            self.session.add(motorista)
            self.session.commit()
            self.session.refresh(motorista)
            return self._serializar(motorista)
        except IntegrityError as error:
            self.session.rollback()
            if self.telefone_em_uso(telefone_limpo):
                raise MotoristaTelefoneEmUsoError(
                    "Este profissional já está registrado."
                ) from error
            raise
        except Exception:
            self.session.rollback()
            raise

    def listar(
        self,
        ativo: bool | None = None,
        nome: str | None = None,
    ) -> list[dict]:
        """Lista motoristas e aplica a busca de nome após a descriptografia.

        ``nome_completo`` é armazenado com ``EncryptedString``. Por isso, uma
        busca SQL com ``LIKE``/``ILIKE`` não seria compatível com o valor
        persistido e poderia expor uma falsa sensação de busca funcional.
        Primeiro filtramos ``ativo`` no banco, carregamos os registros e então
        comparamos o nome já descriptografado em memória, sem registrar dados
        pessoais em logs. Essa estratégia é linear na quantidade de registros
        retornados e deverá ser revisada caso o volume de motoristas cresça.
        """
        query = self.session.query(MotoristaORM)
        if ativo is not None:
            query = query.filter(MotoristaORM.ativo == ativo)

        motoristas = query.order_by(MotoristaORM.id).all()
        termo = nome.strip().casefold() if nome is not None else ""
        if termo:
            motoristas = [
                motorista
                for motorista in motoristas
                if termo in (motorista.nome_completo or "").casefold()
            ]

        return [self._serializar(motorista) for motorista in motoristas]

    def buscar(self, motorista_id: int) -> dict | None:
        """Busca um motorista pelo identificador e retorna o contrato público."""
        motorista = self._buscar_orm(motorista_id)
        return self._serializar(motorista) if motorista else None

    def atualizar(
        self,
        motorista_id: int,
        nome: str | None = None,
        telefone: str | None = None,
    ) -> dict | None:
        """Atualiza parcialmente nome e telefone de um motorista."""
        telefone_limpo = None
        try:
            motorista = self._buscar_orm(motorista_id)
            if motorista is None:
                return None

            if nome is not None:
                motorista.nome_completo = nome.strip()
            if telefone is not None:
                telefone_limpo = telefone.strip()
                if self.telefone_em_uso(
                    telefone_limpo,
                    ignorar_motorista_id=motorista_id,
                ):
                    raise MotoristaTelefoneEmUsoError(
                        "Este profissional já está registrado."
                    )
                motorista.telefone = telefone_limpo
                motorista.telefone_hash = hash_telefone(telefone_limpo)

            self.session.commit()
            self.session.refresh(motorista)
            return self._serializar(motorista)
        except IntegrityError as error:
            self.session.rollback()
            if telefone_limpo is not None and self.telefone_em_uso(
                telefone_limpo,
                ignorar_motorista_id=motorista_id,
            ):
                raise MotoristaTelefoneEmUsoError(
                    "Este profissional já está registrado."
                ) from error
            raise
        except Exception:
            self.session.rollback()
            raise

    def inativar(self, motorista_id: int, usuario_executor_id: int) -> dict | None:
        """Inativa (soft delete) um motorista e registra a operação de auditoria."""
        return self._alterar_status(
            motorista_id=motorista_id,
            usuario_executor_id=usuario_executor_id,
            ativo=False,
            acao="INATIVAR",
        )

    def possui_alocacoes_futuras(self, motorista_id: int) -> bool:
        """Indica se o motorista está escalado em rotas de dias futuros.

        TODO(HU-010): a entidade de escalas/alocações de rotas ainda não existe.
        Quando ela for criada, substituir este retorno por uma consulta real às
        escalas do motorista com data posterior a hoje (ou injetar essa
        consulta via ``alocacoes_futuras_checker``). Até lá a verificação
        "falha aberto": sem checker injetado, nenhuma inativação é bloqueada.
        """
        if self._alocacoes_futuras_checker is not None:
            return bool(self._alocacoes_futuras_checker(motorista_id))
        return False

    def reativar(self, motorista_id: int, usuario_executor_id: int) -> dict | None:
        """Reativa um motorista inativo e registra a operação de auditoria."""
        return self._alterar_status(
            motorista_id=motorista_id,
            usuario_executor_id=usuario_executor_id,
            ativo=True,
            acao="REATIVAR",
        )

    def _buscar_orm(self, motorista_id: int) -> MotoristaORM | None:
        return (
            self.session.query(MotoristaORM)
            .filter(MotoristaORM.id == motorista_id)
            .first()
        )

    def telefone_em_uso(
        self,
        telefone: str,
        ignorar_motorista_id: int | None = None,
    ) -> bool:
        """Verifica telefone em qualquer status sem consultar texto cifrado."""
        telefone_hash = hash_telefone(telefone)
        query = self.session.query(MotoristaORM.id).filter(
            MotoristaORM.telefone_hash == telefone_hash
        )
        if ignorar_motorista_id is not None:
            query = query.filter(MotoristaORM.id != ignorar_motorista_id)
        return query.first() is not None

    def _alterar_status(
        self,
        motorista_id: int,
        usuario_executor_id: int,
        ativo: bool,
        acao: str,
    ) -> dict | None:
        try:
            motorista = self._buscar_orm(motorista_id)
            if motorista is None:
                return None

            estado_anterior = bool(motorista.ativo)
            if estado_anterior == ativo:
                return self._serializar(motorista)

            motorista.ativo = ativo
            self.session.add(
                LogAuditoriaORM(
                    usuario_id=usuario_executor_id,
                    acao=acao,
                    entidade="motorista",
                    entidade_id=motorista_id,
                    valor_anterior="ativo" if estado_anterior else "inativo",
                    valor_novo="ativo" if ativo else "inativo",
                )
            )
            self.session.commit()
            self.session.refresh(motorista)
            return self._serializar(motorista)
        except Exception:
            self.session.rollback()
            raise

    @staticmethod
    def _serializar(motorista: MotoristaORM) -> dict:
        """Mapeia somente os campos previstos no contrato público."""
        return {
            "id": motorista.id,
            "nome": motorista.nome_completo,
            "telefone": motorista.telefone,
            "ativo": bool(motorista.ativo),
        }
