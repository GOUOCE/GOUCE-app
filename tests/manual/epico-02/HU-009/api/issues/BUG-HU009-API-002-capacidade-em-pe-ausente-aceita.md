# Cadastro de ônibus aceita capacidade em pé ausente ou vazia e grava zero

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação |
| **Severidade** | 🟡 Média |
| **Ambiente** | Branch `feature/testes-api-hu-009` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#226](https://github.com/GOUOCE/GOUCE-app/issues/226) |
| **Caso relacionado** | `CT-HU009-API-005` |
| **Documentação** | [HU-009 — Testes manuais de API](../API-HU-009.md#ct-hu009-api-005--exigir-campos-no-cadastro-e-impedir-esvaziamento-na-edição) |

---

### Pré-condição

Token de administrador.

### Passos para reproduzir

1. `POST /onibus` (Form) com `placa=OBR1A02`, `assentos=44` e **sem** `capacidade_em_pe`.
2. `POST /onibus` com `placa=OBR1A03`, `assentos=44` e `capacidade_em_pe=` (vazio).

### ✅ Resultado esperado

HTTP `422` com o campo e o motivo em português; não substituir a capacidade ausente por zero (AC-08, FA-003).

### ❌ Resultado obtido

HTTP `201`, e o ônibus é gravado com capacidade em pé 0:

```
POST sem capacidade_em_pe -> 201 {"placa": "OBR1A02", "capacidade_em_pe": 0}
POST capacidade_em_pe="" -> 201 {"placa": "OBR1A03", "capacidade_em_pe": 0}
```

### ⚠️ Impacto

- Um campo obrigatório é preenchido em silêncio com um valor que pode não ser o desejado, e o limite de alunos em pé fica errado.

### Causa aparente

`onibus_routes.py`: `capacidade_em_pe: int = Form(0, ...)` tem valor padrão 0.

### Critérios de aceite

- Cadastro sem `capacidade_em_pe` (ausente ou vazio) devolve `422`.
- Reexecutar `CT-HU009-API-005`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
