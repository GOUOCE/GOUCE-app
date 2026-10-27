# Cadastro de aluno aceita faculdade inativa

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / validação |
| **Severidade** | 🟡 Média |
| **Ambiente** | Branch `feature/testes-api-hu-008` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#220](https://github.com/GOUOCE/GOUCE-app/issues/220) |
| **Caso relacionado** | `CT-HU008-API-011` |
| **Documentação** | [HU-008 — Testes manuais de API](../API-HU-008.md#ct-hu008-api-011--faculdade-inativa-fora-de-novos-vínculos-e-histórico-preservado) |

---

### Pré-condição

Faculdade `UFC` / `Quixadá` (id 2) inativada. Bairro ativo e dados de cadastro válidos.

### Passos para reproduzir

1. `PATCH /faculdades/2/inativar`.
2. `POST /usuarios/cadastrar` (`multipart/form-data`, dados válidos) com `faculdade_id = 2`.

### ✅ Resultado esperado

O novo cadastro com faculdade inativa é recusado com mensagem clara e nenhum aluno é criado (AC-11). O aluno já vinculado mantém o `faculdade_id` (RN-004), e a promoção a representante é recusada.

### ❌ Resultado obtido

O vínculo foi mantido e a promoção foi recusada (`422` “Faculdade inativa.”), mas o novo cadastro foi **aceito**:

```json
HTTP 201 {"success": true, "message": "Cadastro enviado para análise da coordenação",
  "data": {"id": 5, "nome": "Aluno Quatro Qa", "status_cadastro": "pendente"}}
```

### ⚠️ Impacto

- Alunos novos ficam ligados a uma faculdade desativada.
- Inconsistente com a promoção a representante, que valida a faculdade ativa.

### Causa aparente

O cadastro de aluno não confere se o `faculdade_id` informado está ativo.

### Critérios de aceite

- `POST /usuarios/cadastrar` com faculdade inativa retorna erro claro (4xx) e não cria usuário.
- Reexecutar `CT-HU008-API-011`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
