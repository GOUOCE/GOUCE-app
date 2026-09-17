import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL or not DATABASE_URL.startswith("postgresql"):
    raise ValueError("DATABASE_URL deve apontar para um banco PostgreSQL")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """Criar todas tabelas"""
    # Importar entidades para garantia de registro na Base
    from src.modulos.arquivos.model.entities.arquivo import ArquivoORM
    from src.modulos.usuarios.model.entities.usuario import UsuarioORM
    from src.modulos.usuarios.model.entities.aluno import AlunoORM
    from src.modulos.auth.domain.entities.password_reset_token import PasswordResetTokenORM

    Base.metadata.create_all(bind=engine)

def sync_schema():
    """
    Sincroniza o schema do banco de dados com os modelos definidos.
    Detecta automaticamente mudanças nas entidades e altera tipos ou cria colunas no banco.
    """
    inspector = inspect(engine)
    
    with engine.begin() as connection:
        preparer = connection.dialect.identifier_preparer

        for table in Base.metadata.tables.values():
            table_name = table.name
            
            # Se a tabela não existe, será criada por create_tables()
            if table_name not in inspector.get_table_names():
                continue
            
            existing_columns = {col['name']: col for col in inspector.get_columns(table_name)}
            
            # Correções específicas de colunas
            if table_name == "aluno" and "identificacao_genero" in existing_columns:
                col_type_str = str(existing_columns["identificacao_genero"]["type"]).upper()
                if "TIMESTAMP" in col_type_str or "DATETIME" in col_type_str:
                    try:
                        sql = "ALTER TABLE aluno ALTER COLUMN identificacao_genero TYPE VARCHAR(100) USING NULL;"
                        connection.execute(text(sql))
                        print("✓ Coluna aluno.identificacao_genero convertida para VARCHAR(100)")
                    except Exception as e:
                        print(f"Aviso ao alterar aluno.identificacao_genero: {e}")

            # Verificar se há colunas novas
            for column in table.columns:
                col_name = column.name
                
                if col_name not in existing_columns:
                    try:
                        col_type = str(column.type.compile(dialect=connection.dialect))
                        default = f"DEFAULT {column.default.arg}" if column.default is not None else ""

                        quoted_table_name = preparer.quote(table_name)
                        quoted_column_name = preparer.quote(col_name)

                        sql = f"ALTER TABLE {quoted_table_name} ADD COLUMN {quoted_column_name} {col_type} NULL {default}".strip()
                        connection.execute(text(sql))
                        print(f"✓ Coluna {table_name}.{col_name} criada")
                    except Exception as e:
                        if "already exists" not in str(e).lower():
                            print(f"Aviso ao criar {table_name}.{col_name}: {e}")
