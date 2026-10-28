# A `develop` não sobe em banco vazio: duas migrations são “head” ao mesmo tempo

| Campo | Valor |
|---|---|
| **Tipo** | Bug de ambiente / migration |
| **Severidade** | 🔴 Crítica |
| **Ambiente** | Branch `feature/testes-api-hu-027-hu-031` — Docker local isolado, `http://localhost:8001`, commit `4bf26d55` |
| **Issue** | [#318](https://github.com/GOUOCE/GOUCE-app/issues/318) |
| **Caso relacionado** | `PC-01 (ambiente das suítes HU-027 e HU-031)` |
| **Documentação** | [HU-027 — Testes manuais de API](../API-HU-027.md#observações-gerais) |
| **Issue relacionada** | [#215](https://github.com/GOUOCE/GOUCE-app/issues/215) (problema anterior de banco vazio, já fechado) |

---

### Pré-condição

Banco Postgres vazio e a imagem do backend; `develop` no commit `4bf26d55`.

### Passos para reproduzir

1. Subir o backend com banco vazio (`./docker-entrypoint.sh` roda `alembic upgrade head`).
2. Observar o log. Para confirmar: `alembic heads`.

### ✅ Resultado esperado

As migrations rodam até a última e a API sobe.

### ❌ Resultado obtido

```json
ERROR [alembic.util.messaging] Multiple head revisions are present for given argument 'head'; please specify a specific target revision, '<branchname>@head' to narrow to a specific head, or 'heads' for all heads
FAILED: Multiple head revisions are present for given argument 'head'; ...

$ alembic heads
76_ponto_unico_por_bairro (head)
77_create_rota_complementar (head)
```

A API não sobe (`GET /docs` sem resposta).

### ⚠️ Impacto

- Nenhum ambiente novo (testes, CI, outra pessoa do time) sobe do zero.
- Bancos que já existem também param na próxima subida do container, porque o entrypoint roda `alembic upgrade head`.

### Causa aparente

`76_ponto_unico_por_bairro.py` e `76_create_rota_principal.py` têm o mesmo `down_revision` (`75_add_sigla_to_faculdade`), e nenhuma migration junta os dois ramos. A `77_create_rota_complementar` continua só um deles.

### Critérios de aceite

- Uma migration de merge (ou o reencadeamento da `76_ponto_unico_por_bairro`) deixa uma só head.
- Banco vazio sobe até a última migration sem erro.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-27, ambiente Docker local isolado. Contorno usado só na stack isolada: cópia das migrations com uma migration de merge vazia (`down_revision = ("76_ponto_unico_por_bairro", "77_create_rota_complementar")`). JSON: [`00-ambiente-migrations.json`](../evidencias/00-ambiente-migrations.json).
