from sqlalchemy.orm import Session
from src.modulos.arquivos.model.entities.arquivo import ArquivoORM


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
