# Validação de faculdade devolve “Valor inválido.” sem dizer o motivo

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação / mensagens |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Branch `feature/testes-api-hu-008` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#221](https://github.com/GOUOCE/GOUCE-app/issues/221) |
| **Caso relacionado** | `CT-HU008-API-005` |
| **Documentação** | [HU-008 — Testes manuais de API](../API-HU-008.md#ct-hu008-api-005--obrigatórios-e-limites) |

---

### Pré-condição

Token de administrador.

### Passos para reproduzir

1. `POST /faculdades` com `{}`, nome vazio/em branco, campus vazio/em branco, nome e campus com 256 caracteres e sigla com 51.
2. `PATCH /faculdades/3` com `{"nome_faculdade": ""}` e `{"campus_faculdade": "   "}`.

### ✅ Resultado esperado

HTTP `422` com o campo e o motivo em português, por exemplo “O nome da faculdade é obrigatório.” (AC-08, FA-003).

### ❌ Resultado obtido

HTTP `422` em todos (nada gravado), mas a mensagem é sempre genérica:

```json
{"success": false, "message": "Requisição inválida", "error": {"code": "REQUEST_VALIDATION_ERROR",
  "details": [{"field": "nome_faculdade", "message": "Valor inválido."},
             {"field": "campus_faculdade", "message": "Valor inválido."}]}}
```

### ⚠️ Impacto

- O app não consegue mostrar ao administrador o que corrigir.

### Causa aparente

Os `422` do DTO passam pelo tradutor genérico, que troca a mensagem específica por “Valor inválido.” (mesmo padrão da HU-007).

### Critérios de aceite

- Cada erro de validação informa o campo e o motivo em português.
- Reexecutar `CT-HU008-API-005`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
