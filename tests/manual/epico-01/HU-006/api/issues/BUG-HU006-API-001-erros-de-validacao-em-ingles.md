# Gestão de administradores devolve erros de validação crus e em inglês

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação / mensagens |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Branch `feature/testes-api-hu-006` — Docker local isolado, `http://localhost:8001`, commit `a93d6e5d` |
| **Caso relacionado** | `CT-HU006-API-003` |
| **Documentação** | [HU-006 — Testes manuais de API](../API-HU-006.md#ct-hu006-api-003--criação-rejeitada) |
| **Issue relacionada** | #134 — mesmo padrão na renovação de vínculo (HU-028) |

---

### Pré-condição

Token de administrador ativo.

### Passos para reproduzir

1. `POST /administradores` com `{"nome": "Ab", "email": "ab.novo@example.com"}`.
2. `POST /administradores` com `{"nome": "Pedro Lima", "email": "carlos@"}`.

### ✅ Resultado esperado

HTTP `422` com o campo e o motivo em português, no mesmo formato das demais rotas da API (`{"success": false, "error": {"code": …, "message": …, "details": [{"field": …, "message": …}]}}`).

### ❌ Resultado obtido

HTTP `422` no formato cru do FastAPI/Pydantic, em inglês:

```json
{"detail":[{"type":"string_too_short","loc":["body","nome"],"msg":"String should have at least 3 characters","input":"Ab","ctx":{"min_length":3}}]}
{"detail":[{"type":"value_error","loc":["body","email"],"msg":"value is not a valid email address: There must be something after the @-sign.","input":"carlos@","ctx":{"reason":"There must be something after the @-sign."}}]}
```

As demais respostas de erro dessas rotas (409, 404) também usam `{"detail": …}`, e não o envelope padrão.

### ⚠️ Impacto

- O app mostra texto técnico em inglês ao administrador, ou precisa tratar dois formatos de erro diferentes.
- A resposta devolve o próprio valor enviado (`input`), o que não é necessário.

### Causa aparente

`backend/src/modulos/usuarios/interface/http/administrador_routes.py`: o roteador não usa a classe de rota que traduz os erros de validação (`CadastroValidationRoute`, usada em `aluno_router.py`) e lança `HTTPException(detail=…)` nos demais erros. A validação de tamanho do nome está no DTO (`CriarAdministradorDTO`, `min_length=3`), antes da regra em português do caso de uso (“O primeiro nome deve ter pelo menos 3 letras.”).

### Critérios de aceite

- Erros de validação das rotas de administradores vêm em português e no envelope padrão da API.
- Reexecutar `CT-HU006-API-003`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-06, ambiente Docker local isolado.
