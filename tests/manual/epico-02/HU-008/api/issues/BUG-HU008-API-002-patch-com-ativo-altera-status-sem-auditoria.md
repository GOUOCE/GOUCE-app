# `PATCH /faculdades/{id}` com `ativo` muda o status sem auditoria

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / auditoria |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `feature/testes-api-hu-008` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#218](https://github.com/GOUOCE/GOUCE-app/issues/218) |
| **Caso relacionado** | `CT-HU008-API-008` |
| **Documentação** | [HU-008 — Testes manuais de API](../API-HU-008.md#ct-hu008-api-008--inativação-pelo-patch-com-ativo) |

---

### Pré-condição

Token de administrador. Faculdade `IFCE` (id 3) ativa.

### Passos para reproduzir

1. `PATCH /faculdades/3` com `{"ativo": false}`.
2. `GET /faculdades/3` e consultar `log_auditoria`.
3. `PATCH /faculdades/3` com `{"ativo": true}` e conferir de novo.

### ✅ Resultado esperado

A mudança de status segue as mesmas regras da rota de inativar/ativar: auditoria gravada (AC-10) e bloqueio por agendamentos futuros (AC-06). Ou o campo `ativo` é ignorado/recusado.

### ❌ Resultado obtido

HTTP `200`; a faculdade ficou inativa e depois ativa, mas `log_auditoria` não ganhou nenhum registro (continuou com 6):

```json
PATCH /faculdades/3 {"ativo": false} -> 200 {"data": {"id_faculdade": 3, "ativo": false}}
log_auditoria antes: 6 registros | depois das duas chamadas: 6 registros
```

### ⚠️ Impacto

- Caminho que contorna a rastreabilidade (RNF-013).
- Também contornaria o bloqueio por agendamento futuro (AC-06) quando a HU-013 existir.

### Causa aparente

O DTO de edição aceita `ativo` e o serviço de edição o aplica diretamente, sem passar pelo fluxo de inativar/ativar.

### Critérios de aceite

- `ativo` deixa de ser aceito na edição, ou passa pelas mesmas regras e auditoria da inativação.
- Reexecutar `CT-HU008-API-008`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
