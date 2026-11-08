"""Persistência e consulta de comunicados do Mural de Avisos (HU-023)."""

from sqlalchemy.orm import Session

from src.modulos.avisos.model.entities.aviso import AvisoORM
from src.shared.infrastructure.audit_model import LogAuditoriaORM


class AvisoRepository:
    """Repository SQLAlchemy para a entidade AvisoORM."""

    def __init__(self, session: Session):
        self.session = session

    def criar(self, titulo: str, descricao: str, autor_id: int) -> dict:
        """Cria um novo aviso e registra o log de auditoria na mesma transação."""
        titulo_limpo = titulo.strip()
        descricao_limpa = descricao.strip()
        try:
            aviso = AvisoORM(
                titulo=titulo_limpo,
                descricao=descricao_limpa,
                autor_id=autor_id,
            )
            self.session.add(aviso)
            self.session.flush()
            self._registrar_auditoria(
                usuario_id=autor_id,
                acao="CRIAR",
                aviso_id=aviso.id,
                valor_anterior=None,
                valor_novo=titulo_limpo,
            )
            self.session.commit()
            self.session.refresh(aviso)
            return self._serializar(aviso)
        except Exception:
            self.session.rollback()
            raise

    def listar(self, titulo: str | None = None) -> list[dict]:
        """Lista os avisos do mais recente para o mais antigo, com busca opcional por título."""
        query = self.session.query(AvisoORM)

        termo = titulo.strip() if isinstance(titulo, str) else ""
        if termo:
            query = query.filter(AvisoORM.titulo.ilike(f"%{termo}%"))

        avisos = query.order_by(
            AvisoORM.data_criacao.desc(),
            AvisoORM.id.desc(),
        ).all()
        return [self._serializar(aviso) for aviso in avisos]

    def _registrar_auditoria(
        self,
        usuario_id: int,
        acao: str,
        aviso_id: int,
        valor_anterior: str | None,
        valor_novo: str | None,
    ) -> None:
        self.session.add(
            LogAuditoriaORM(
                usuario_id=usuario_id,
                acao=acao,
                entidade="aviso",
                entidade_id=aviso_id,
                valor_anterior=valor_anterior,
                valor_novo=valor_novo,
            )
        )

    @staticmethod
    def _serializar(aviso: AvisoORM) -> dict:
        return {
            "id": aviso.id,
            "titulo": aviso.titulo,
            "descricao": aviso.descricao,
            "conteudo": aviso.descricao,
            "autor_id": aviso.autor_id,
            "data_criacao": aviso.data_criacao,
        }
