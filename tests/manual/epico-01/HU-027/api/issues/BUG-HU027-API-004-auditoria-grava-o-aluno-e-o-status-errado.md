# Auditoria da avaliação grava o aluno como autor e o status anterior igual ao novo

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / auditoria |
| **Severidade** | 🟡 Média |
| **Ambiente** | Branch `feature/testes-api-hu-027-hu-031` — Docker local isolado, `http://localhost:8001`, commit `4bf26d55` |
| **Caso relacionado** | `CT-HU027-API-009` |
| **Documentação** | [HU-027 — Testes manuais de API](../API-HU-027.md#ct-hu027-api-009--auditoria-da-avaliação) |

---

### Pré-condição

Token do administrador A (id 1). Alunos avaliados nos casos anteriores.

### Passos para reproduzir

1. Aprovar o A1: `PATCH /usuarios/alunos/2/aprovar`.
2. Reprovar o A2: `PATCH /usuarios/alunos/3/status` com status `rejeitado`, motivo e documentos.
3. Consultar `select id, usuario_id, acao, entidade_id, valor_anterior, valor_novo from log_auditoria where entidade = 'aluno'`.

### ✅ Resultado esperado

Um registro por avaliação, com `usuario_id` do **administrador** que avaliou, a ação, o id do aluno, o status **anterior** e o **novo**, e a data/hora (RNF-013).

### ❌ Resultado obtido

```json
4 | 2 | UPDATE_STATUS | aluno | 2 | ativado | ativado
5 | 3 | UPDATE_STATUS | aluno | 3 | rejeitado | rejeitado
```

Os 13 registros da execução seguem esse padrão: `usuario_id` é o id do **aluno** (nunca o 1 do administrador), e `valor_anterior` é sempre igual a `valor_novo` (o A1 estava `pendente`).

### ⚠️ Impacto

- Não dá para saber qual administrador aprovou ou reprovou cada aluno.
- O histórico não mostra de qual status o aluno saiu.

### Causa aparente

`usuario_repository.py:541` troca `aluno.status_cadastro` antes de montar o log; a linha 566 lê o status já trocado como `valor_anterior`. A linha 562 usa `usuario_id=aluno.aluno_id`, porque o id do administrador não chega ao repository (`usuario_routes.py:577` e `607` não passam `current_user`).

### Critérios de aceite

- `usuario_id` com o id do administrador autenticado.
- `valor_anterior` com o status antes da troca.
- Reexecutar `CT-HU027-API-009`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-27, ambiente Docker local isolado. JSON: [`CT-HU027-API-009.json`](../evidencias/CT-HU027-API-009.json).
