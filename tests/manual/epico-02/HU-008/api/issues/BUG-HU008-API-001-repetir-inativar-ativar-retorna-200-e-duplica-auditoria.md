# Repetir inativar ou ativar faculdade devolve 200 e grava auditoria duplicada

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / auditoria |
| **Severidade** | 🟡 Média |
| **Ambiente** | Branch `feature/testes-api-hu-008` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#217](https://github.com/GOUOCE/GOUCE-app/issues/217) |
| **Caso relacionado** | `CT-HU008-API-007` |
| **Documentação** | [HU-008 — Testes manuais de API](../API-HU-008.md#ct-hu008-api-007--inativar-e-reativar-soft-delete) |

---

### Pré-condição

Token de administrador. Faculdade `Uniateneu` / `Ocara` (id 6) já inativa.

### Passos para reproduzir

1. `PATCH /faculdades/6/inativar` (já inativa).
2. `PATCH /faculdades/6/ativar` duas vezes seguidas.
3. `PATCH /faculdades/6/inativar` duas vezes seguidas.
4. Consultar `log_auditoria` por `entidade = 'faculdade'`.

### ✅ Resultado esperado

Repetir a operação no mesmo estado devolve HTTP `409` com mensagem clara em português e não grava novo registro de auditoria.

### ❌ Resultado obtido

HTTP `200` “Operação realizada com sucesso” em todas as repetições, e cada uma gravou um registro novo:

```json
log_auditoria: 6 registros (INATIVAR, INATIVAR, ATIVAR, ATIVAR, INATIVAR, INATIVAR) para a mesma faculdade id 6
```

### ⚠️ Impacto

- O log de auditoria fica poluído com ações que não mudaram nada.
- Inconsistente com o bairro (HU-007), que responde `409` na repetição.

### Causa aparente

`backend/src/modulos/crud_basicos/`: os serviços de inativar e ativar da faculdade não conferem o status atual antes de gravar.

### Critérios de aceite

- Repetir a inativação ou a reativação devolve `409` em português e não grava auditoria.
- Reexecutar `CT-HU008-API-007`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
