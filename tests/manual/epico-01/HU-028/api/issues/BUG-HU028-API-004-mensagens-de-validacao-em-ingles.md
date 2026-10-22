# Renovação de vínculo devolve mensagens de validação em inglês

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação / mensagens |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Branch `feature/testes-api-hu-028` — Docker local isolado, `http://localhost:8001`, commit `a0a08b5f` |
| **Caso relacionado** | `CT-HU028-API-002`, `CT-HU028-API-008` |
| **Documentação** | [HU-028 — Testes manuais de API](../API-HU-028.md#ct-hu028-api-002--renovação-sem-comprovante) |

---

### Pré-condição

Aluno com cadastro aprovado e token válido.

### Passos para reproduzir

1. `PUT /alunos/renovar-vinculo` sem o arquivo `comprovante_matricula`.
2. `PUT /alunos/renovar-vinculo` com `nome` vazio.

### ✅ Resultado esperado

HTTP `422` com o campo e o motivo em português (ex.: “Comprovante de matrícula é obrigatório”, “Informe o nome completo”).

### ❌ Resultado obtido

HTTP `422` com o campo correto, mas a mensagem padrão do framework em inglês:

```json
{"success": false, "error": {"code": "REQUEST_VALIDATION_ERROR", "message": "Requisição inválida", "details": [{"field": "comprovante_matricula", "message": "Field required"}]}}
{"success": false, "error": {"code": "REQUEST_VALIDATION_ERROR", "message": "Requisição inválida", "details": [{"field": "nome", "message": "String should have at least 3 characters"}]}}
```

### ⚠️ Impacto

- Se o app repassar o `details`, o aluno vê texto técnico em inglês.
- Inconsistência com as demais validações da mesma rota, que já respondem em português (telefone, semestre, formato de arquivo).

### Causa aparente

Erros de validação do Pydantic/FastAPI (`Form(...)`, `File(...)`, `min_length`) são devolvidos com a mensagem original. O mesmo padrão aparece nas suítes de API da HU-004 e da HU-005 e na UI da HU-005 (#124).

### Critérios de aceite

- As mensagens de `REQUEST_VALIDATION_ERROR` da renovação vêm em português.
- Reexecutar `CT-HU028-API-002` e `CT-HU028-API-008`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-06, ambiente Docker local isolado.
