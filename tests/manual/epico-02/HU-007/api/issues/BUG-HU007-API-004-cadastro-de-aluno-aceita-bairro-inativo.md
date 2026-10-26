# Cadastro de aluno aceita bairro inativo

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / validação |
| **Severidade** | 🟡 Média |
| **Ambiente** | Branch `feature/testes-api-hu-007` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#213](https://github.com/GOUOCE/GOUCE-app/issues/213) |
| **Caso relacionado** | `CT-HU007-API-011` |
| **Documentação** | [HU-007 — Testes manuais de API](../API-HU-007.md#ct-hu007-api-011--bairro-inativo-fora-de-novos-vínculos-e-histórico-preservado) |

---

### Pré-condição

Bairro **Centro** inativado (`PATCH /bairros/2/inativar`). Faculdade ativa. Aluno já vinculado ao Centro.

### Passos para reproduzir

1. Conferir `aluno.bairro_id` do aluno existente (2) antes e depois da inativação.
2. `POST /usuarios/cadastrar` (`multipart/form-data`, dados válidos) com `bairro_id = 2`.

### ✅ Resultado esperado

O aluno existente mantém o vínculo (RN-004). O novo cadastro com bairro inativo é recusado com mensagem clara e nenhum aluno é criado (AC-11).

### ❌ Resultado obtido

O vínculo foi mantido, mas o novo cadastro foi **aceito**:

```json
HTTP 201 {"success": true, "message": "Cadastro enviado para análise da coordenação",
  "data": {"id": 4, "nome": "Aluno Novo Qa", "status_cadastro": "pendente"}}
```

### ⚠️ Impacto

- Alunos novos ficam ligados a um bairro desativado, que não deveria estar disponível.
- Em tese a lista pública de bairros já esconde o inativo; o risco é uma chamada direta à API.

### Causa aparente

O cadastro de aluno não confere se o `bairro_id` informado está ativo.

### Critérios de aceite

- `POST /usuarios/cadastrar` com bairro inativo retorna erro claro (4xx) e não cria usuário.
- Reexecutar `CT-HU007-API-011`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
