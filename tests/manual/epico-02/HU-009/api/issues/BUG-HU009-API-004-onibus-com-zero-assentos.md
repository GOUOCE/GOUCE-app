# API da frota permite cadastrar e editar ônibus com zero assentos

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `feature/testes-api-hu-009` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#228](https://github.com/GOUOCE/GOUCE-app/issues/228) |
| **Caso relacionado** | `CT-HU009-API-007` |
| **Documentação** | [HU-009 — Testes manuais de API](../API-HU-009.md#ct-hu009-api-007--validar-limites-e-tipo-das-capacidades) |

---

### Pré-condição

Token de administrador.

### Passos para reproduzir

1. `POST /onibus` com `assentos=0` (demais campos válidos).
2. `PATCH /onibus/AB1234` com `assentos=0`.

### ✅ Resultado esperado

HTTP `422`: assentos deve ser inteiro maior ou igual a 1 (AC-10).

### ❌ Resultado obtido

HTTP `201` no cadastro e `200` na edição, com `assentos: 0`:

```
POST assentos=0 -> 201 {"placa": "LIM1A94", "assentos": 0}
PATCH /onibus/AB1234 assentos=0 -> 200 {"assentos": 0}
```

### ⚠️ Impacto

- Existe ônibus sem lugar nenhum, o que não faz sentido para o transporte.

### Causa aparente

`onibus_routes.py`: `assentos: int = Form(..., ge=0)` e o campo da edição também usam `ge=0`.

### Critérios de aceite

- `assentos` menor que 1 é recusado no cadastro e na edição.
- Reexecutar `CT-HU009-API-007`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
