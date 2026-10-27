# Recusas da reprovação de cadastro aparecem em inglês e com texto técnico

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação / mensagem |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Branch `feature/testes-api-hu-027-hu-031` — Docker local isolado, `http://localhost:8001`, commit `4bf26d55` |
| **Caso relacionado** | `CT-HU027-API-006` |
| **Documentação** | [HU-027 — Testes manuais de API](../API-HU-027.md#ct-hu027-api-006--motivo-obrigatório-na-reprovação) |

---

### Pré-condição

Token de administrador; aluno A3 (id 4) `pendente`.

### Passos para reproduzir

1. `PATCH /usuarios/alunos/4/status` com `{"status_cadastro": "rejeitado", "documentos_reenvio": [{"tipo": "comprovante_matricula", "motivo": ""}]}`.
2. Repetir com `"tipo": "rg"` e com `motivo_reprovacao` de 256 caracteres.
3. Repetir sem `motivo_reprovacao`.

### ✅ Resultado esperado

HTTP `422` com mensagem em português indicando o campo, no formato de erro usado pelas outras rotas (`success`, `error.code`, `error.message`, `error.details`).

### ❌ Resultado obtido

```json
{"detail": [{"type": "string_too_short", "loc": ["body", "documentos_reenvio", 0, "motivo"], "msg": "String should have at least 1 character"}]}
{"detail": [{"type": "enum", "loc": ["body", "documentos_reenvio", 0, "tipo"], "msg": "Input should be 'comprovante_matricula', 'comprovante_residencia' or 'foto_perfil'"}]}
{"detail": [{"type": "string_too_long", "loc": ["body", "motivo_reprovacao"], "msg": "String should have at most 255 characters"}]}
{"detail": [{"type": "value_error", "loc": ["body"], "msg": "Value error, motivo_reprovacao é obrigatório quando status_cadastro é rejeitado."}]}
```

### ⚠️ Impacto

- O app pode mostrar ao administrador um texto em inglês ou técnico (“Value error, …”).
- O formato difere do usado pelas rotas de cadastro e de reenvio (`success`/`error`).

### Causa aparente

O `router` de `usuario_routes.py:206` não usa uma `route_class` de validação, como `cadastro_router` e `edicao_router` usam; o `422` padrão do FastAPI passa sem tradução.

### Critérios de aceite

- As recusas de `PATCH /usuarios/alunos/{id}/status` vêm em português, com o campo indicado e sem o prefixo “Value error,”.
- Reexecutar `CT-HU027-API-006`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-27, ambiente Docker local isolado. JSON: [`CT-HU027-API-006.json`](../evidencias/CT-HU027-API-006.json) (passos 1 a 5).
