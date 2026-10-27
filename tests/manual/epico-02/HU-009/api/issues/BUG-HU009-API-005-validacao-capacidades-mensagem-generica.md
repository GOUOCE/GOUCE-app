# Validação da frota devolve “Valor inválido.” sem informar o motivo

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação / mensagens |
| **Severidade** | 🟡 Média |
| **Ambiente** | Branch `feature/testes-api-hu-009` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#229](https://github.com/GOUOCE/GOUCE-app/issues/229) |
| **Caso relacionado** | `CT-HU009-API-005 e CT-HU009-API-007` |
| **Documentação** | [HU-009 — Testes manuais de API](../API-HU-009.md#ct-hu009-api-007--validar-limites-e-tipo-das-capacidades) |

---

### Pré-condição

Token de administrador.

### Passos para reproduzir

1. `POST /onibus` com `assentos=-1` e com `capacidade_em_pe=-1`.
2. `POST /onibus` sem `placa`, com `placa` só de espaços e sem `assentos`.

### ✅ Resultado esperado

HTTP `422` com o campo e o motivo em português. O requisito define “A quantidade de assentos deve ser maior que zero” e “A capacidade em pé não pode ser negativa”.

### ❌ Resultado obtido

HTTP `422` com texto genérico, e a mensagem muda conforme o tipo de erro:

```
assentos=-1            -> {"field": "assentos", "message": "Valor inválido."}
capacidade_em_pe=-1    -> {"field": "capacidade_em_pe", "message": "Valor inválido."}
assentos=abc ou 4.5    -> {"field": "assentos", "message": "Informe um número válido."}
placa ausente ou vazia -> {"field": "placa", "message": "Valor inválido."}
```

### ⚠️ Impacto

- O app não consegue dizer ao administrador o que corrigir; diverge do texto do requisito.

### Causa aparente

Os `422` passam pelo tradutor genérico, que troca a mensagem específica por “Valor inválido.”.

### Critérios de aceite

- Os erros trazem as mensagens do requisito para assentos e capacidade em pé, e um motivo para placa.
- Reexecutar `CT-HU009-API-005` e `CT-HU009-API-007`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
