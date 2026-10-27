"""ponto de parada unico apenas dentro do mesmo bairro

Remove o UNIQUE global em ponto_de_parada.nome e cria o UNIQUE composto
(bairro_id, nome), permitindo o mesmo nome de ponto em bairros diferentes
(AC-02 da HU-007).

Revision ID: 76_ponto_unico_por_bairro
Revises: 75_add_sigla_to_faculdade
Create Date: 2026-10-27

"""
from typing import Sequence, Union

from alembic import context, op
import sqlalchemy as sa


revision: str = "76_ponto_unico_por_bairro"
down_revision: Union[str, None] = "75_add_sigla_to_faculdade"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLE = "ponto_de_parada"
NEW_CONSTRAINT = "uq_ponto_de_parada_bairro_nome"
# Nome padrão que o PostgreSQL gera para UNIQUE em "nome" (usado só no downgrade)
OLD_CONSTRAINT = "ponto_de_parada_nome_key"


def upgrade() -> None:
    if context.is_offline_mode():
        return

    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if TABLE not in inspector.get_table_names():
        return

    uniques = inspector.get_unique_constraints(TABLE)
    indexes = inspector.get_indexes(TABLE)
    constraint_names = {u["name"] for u in uniques if u.get("name")}

    # UNIQUE antigo apenas em "nome", seja qual for o nome do constraint no banco
    old_constraints = [
        u["name"]
        for u in uniques
        if u.get("name") and list(u["column_names"]) == ["nome"]
    ]

    # Índices únicos soltos em "nome" (no PostgreSQL, constraints também
    # aparecem aqui, por isso excluímos os que já foram listados acima)
    old_indexes = [
        i["name"]
        for i in indexes
        if i.get("unique")
        and list(i["column_names"]) == ["nome"]
        and i["name"] not in constraint_names
    ]

    new_exists = NEW_CONSTRAINT in constraint_names or any(
        i["name"] == NEW_CONSTRAINT for i in indexes
    )

    with op.batch_alter_table(TABLE) as batch_op:
        for name in old_constraints:
            batch_op.drop_constraint(name, type_="unique")
        for name in old_indexes:
            batch_op.drop_index(name)
        if not new_exists:
            batch_op.create_unique_constraint(
                NEW_CONSTRAINT, ["bairro_id", "nome"]
            )


def downgrade() -> None:
    if context.is_offline_mode():
        return

    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if TABLE not in inspector.get_table_names():
        return

    # Voltar para UNIQUE global falha se já existirem nomes repetidos em
    # bairros diferentes. Melhor avisar de forma clara do que deixar o banco
    # estourar no meio da migration.
    duplicados = bind.execute(
        sa.text(
            f"SELECT nome FROM {TABLE} GROUP BY nome HAVING COUNT(*) > 1"
        )
    ).fetchall()
    if duplicados:
        nomes = ", ".join(sorted({str(row[0]) for row in duplicados}))
        raise RuntimeError(
            "Não é possível voltar para UNIQUE global em ponto_de_parada.nome: "
            f"existem nomes repetidos em bairros diferentes ({nomes}). "
            "Renomeie ou remova esses pontos antes do downgrade."
        )

    uniques = inspector.get_unique_constraints(TABLE)
    constraint_names = {u["name"] for u in uniques if u.get("name")}
    old_exists = OLD_CONSTRAINT in constraint_names or any(
        list(u["column_names"]) == ["nome"] for u in uniques
    )

    with op.batch_alter_table(TABLE) as batch_op:
        if NEW_CONSTRAINT in constraint_names:
            batch_op.drop_constraint(NEW_CONSTRAINT, type_="unique")
        if not old_exists:
            batch_op.create_unique_constraint(OLD_CONSTRAINT, ["nome"])