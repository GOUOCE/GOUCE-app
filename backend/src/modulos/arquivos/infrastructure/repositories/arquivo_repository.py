from sqlalchemy import or_
from sqlalchemy.orm import Session
from src.modulos.arquivos.model.entities.arquivo import ArquivoORM
from src.modulos.usuarios.model.entities.aluno import AlunoORM


class SQLAlchemyArquivoRepository:
    def __init__(self, session: Session):
        self.session = session

    def salvar(self, arquivo_orm: ArquivoORM) -> ArquivoORM:
        self.session.add(arquivo_orm)
        self.session.commit()
        self.session.refresh(arquivo_orm)
        return arquivo_orm

    def buscar_por_id(self, arquivo_id: str) -> ArquivoORM | None:
        return self.session.query(ArquivoORM).filter(ArquivoORM.id == arquivo_id).first()

    def buscar_por_id_do_usuario(self, arquivo_id: str, user_id: int) -> ArquivoORM | None:
        """Busca somente arquivo associado ao perfil do aluno informado."""
        return (
            self.session.query(ArquivoORM)
            .join(
                AlunoORM,
                or_(
                    ArquivoORM.id == AlunoORM.id_comprovante_matricula,
                    ArquivoORM.id == AlunoORM.id_comprovante_residencia,
                    ArquivoORM.id == AlunoORM.id_foto_aluno,
                ),
            )
            .filter(
                ArquivoORM.id == arquivo_id,
                AlunoORM.aluno_id == user_id,
            )
            .first()
        )
