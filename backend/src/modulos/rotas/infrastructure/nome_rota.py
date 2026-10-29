"""Unicidade do nome entre rotas principais e complementares (#208, item 1).

O nome é comparado sem diferenciar maiúsculas e sem os espaços das pontas,
contra rotas ativas e inativas dos dois tipos. Os índices únicos de cada tabela
só protegem o próprio tipo; entre as tabelas, a checagem roda depois de um
lock transacional pelo nome (Postgres), para que duas criações concorrentes com
o mesmo nome em tipos diferentes não passem juntas.
"""

from sqlalchemy import func, text
from sqlalchemy.orm import Session

from src.modulos.rotas.model.entities.rota_complementar import RotaComplementarORM
from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM

MENSAGEM_NOME_ROTA_EM_USO = "Já existe uma rota com este nome."


def travar_nome_rota(session: Session, nome: str) -> None:
    """Serializa, até o fim da transação, as escritas que usam este nome."""
    if session.get_bind().dialect.name != "postgresql":
        return
    session.execute(
        text("SELECT pg_advisory_xact_lock(hashtext(lower(trim(:nome))))"),
        {"nome": nome},
    )


def nome_rota_em_uso(
    session: Session,
    nome: str,
    ignorar_principal_id: int | None = None,
    ignorar_complementar_id: int | None = None,
) -> bool:
    for orm, ignorar_id in (
        (RotaPrincipalORM, ignorar_principal_id),
        (RotaComplementarORM, ignorar_complementar_id),
    ):
        query = session.query(orm.id).filter(
            func.lower(func.trim(orm.nome)) == func.lower(func.trim(nome))
        )
        if ignorar_id is not None:
            query = query.filter(orm.id != ignorar_id)
        if query.first() is not None:
            return True
    return False
