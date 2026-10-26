# Promoção de representante devolve “Valor inválido.” sem informar o motivo

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação / mensagens |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Branch `feature/testes-api-hu-030` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#236](https://github.com/GOUOCE/GOUCE-app/issues/236) |
| **Caso relacionado** | `CT-HU030-API-003` |
| **Documentação** | [HU-030 — Testes manuais de API](../API-HU-030.md#ct-hu030-api-003--validar-instituição-obrigatória-e-ids) |

---

### Pré-condição

Token de administrador. Aluno elegível livre (id 6).

### Passos para reproduzir

1. `POST /representantes/promover` com `{"aluno_id": 6}` (sem instituição), com `faculdade_id` = `null`, `0` e `-1`.
2. O mesmo para `aluno_id` ausente, `null`, `0` e `-1`.

### ✅ Resultado esperado

HTTP `422` com o campo e o motivo em português, por exemplo “Informe a instituição de ensino.” (AC-12). A instituição é obrigatória e não deve ser assumida.

### ❌ Resultado obtido

HTTP `422` e nada gravado (correto), mas a mensagem é genérica:

```
{"aluno_id": 6} -> {"field": "faculdade_id", "message": "Valor inválido."}
faculdade_id null / 0 / -1 -> {"field": "faculdade_id", "message": "Valor inválido."}
aluno_id ausente / null / 0 / -1 -> {"field": "aluno_id", "message": "Valor inválido."}
faculdade_id "abc" -> {"message": "Informe um número válido."}
```

### ⚠️ Impacto

- O app não consegue dizer ao administrador o que corrigir; é o mesmo padrão das demais HUs do épico 02.

### Causa aparente

Os `422` do DTO passam pelo tradutor genérico, que troca a mensagem específica por “Valor inválido.”.

### Critérios de aceite

- Os erros trazem o motivo em português (ex.: instituição obrigatória).
- Reexecutar `CT-HU030-API-003`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
