# Validação de bairro devolve “Valor inválido.” sem dizer o motivo

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação / mensagens |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Branch `feature/testes-api-hu-007` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#214](https://github.com/GOUOCE/GOUCE-app/issues/214) |
| **Caso relacionado** | `CT-HU007-API-005` |
| **Documentação** | [HU-007 — Testes manuais de API](../API-HU-007.md#ct-hu007-api-005--campos-obrigatórios-e-limites) |

---

### Pré-condição

Token de administrador.

### Passos para reproduzir

1. `POST /bairros` com `{}`.
2. `POST /bairros` com nome vazio; sem pontos; `pontos_de_parada: []`; ponto em branco; nome com 101 caracteres.
3. `PATCH /bairros/1` com `{"nome": ""}` e `{"pontos_de_parada": []}`.

### ✅ Resultado esperado

HTTP `422` com o campo e o motivo em português, por exemplo “O nome do bairro é obrigatório.” e “Ao menos um ponto de parada é obrigatório.” (AC-08, FA-003).

### ❌ Resultado obtido

HTTP `422` em todos (nada gravado), mas a mensagem é sempre genérica, e o nome do campo varia (`nome_bairro` com `{}`, `nome` nos demais):

```json
{"success": false, "message": "Requisição inválida", "error": {"code": "REQUEST_VALIDATION_ERROR",
  "details": [{"field": "nome_bairro", "message": "Valor inválido."},
             {"field": "pontos_de_parada", "message": "Valor inválido."}]}}
```

### ⚠️ Impacto

- O app não consegue mostrar ao administrador o que corrigir.
- O nome do campo diverge do contrato (`nome`).

### Causa aparente

Os `422` do DTO passam pelo tradutor genérico (`validation_details`), que troca a mensagem específica por “Valor inválido.”.

### Critérios de aceite

- Cada erro de validação informa o campo (`nome` ou `pontos_de_parada`) e o motivo em português.
- Reexecutar `CT-HU007-API-005`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
