# A `develop` não sobe em banco vazio: migration 69 usa `faculdade.sigla` antes de a coluna existir

| Campo | Valor |
|---|---|
| **Tipo** | Bug de ambiente / migration |
| **Severidade** | 🔴 Crítica |
| **Ambiente** | Branch `feature/testes-api-hu-007` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#215](https://github.com/GOUOCE/GOUCE-app/issues/215) |
| **Caso relacionado** | `PC-01 (ambiente da suíte)` |
| **Documentação** | [HU-007 — Testes manuais de API](../API-HU-007.md#pré-condições) |

---

### Pré-condição

Banco Postgres vazio e a imagem do backend; `develop` no commit `5e7301a0`.

### Passos para reproduzir

1. Subir o backend com banco vazio (`./docker-entrypoint.sh` roda `alembic upgrade head`).
2. Observar o log.

### ✅ Resultado esperado

Todas as migrations rodam até a 75 e a API sobe.

### ❌ Resultado obtido

A migration `69_faculdade_fk_in_aluno` falha e a API não sobe:

```json
psycopg2.errors.UndefinedColumn: column f.sigla does not exist
  File "/app/migrations/versions/69_faculdade_fk_in_aluno.py", line 46, in upgrade
```

### ⚠️ Impacto

- Nenhum ambiente novo (testes, CI, outra pessoa do time) sobe do zero; só bancos que já têm a coluna funcionam.
- Impede cumprir a PC-01 (“banco limpo”) das suítes. Também: a migration `74` insere o bairro `Centro` sem pontos em banco novo, o que colide com o cadastro de `Centro` da suíte.

### Causa aparente

A `69` seleciona `f.sigla`, mas a coluna só é criada pela `75_add_sigla_to_faculdade`. A `68` cria a tabela `faculdade` sem `sigla`.

### Critérios de aceite

- Banco vazio sobe até a 75 sem erro (criar `sigla` na `68`, ou a `69` não usar a coluna).
- Repetir o procedimento nas pré-condições das suítes.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
