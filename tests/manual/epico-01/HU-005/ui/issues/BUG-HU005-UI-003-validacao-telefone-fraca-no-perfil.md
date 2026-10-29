# Editar perfil aceita telefone com mais de 20 dígitos e mostra erro em inglês

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU005-UI-003` |
| **Documentação** | HU-005 — Testes manuais de UI: [CT-HU005-UI-003](../UI-HU-005.md#ct-hu005-ui-003--telefone-inválido) |
| **Issue relacionada** | [MELHORIA-HU005-UI-002-mascara-telefone-no-perfil](MELHORIA-HU005-UI-002-mascara-telefone-no-perfil.md) |

---

### Pré-condição

Aluno ativo logado, na tela **Editar perfil**.

### Passos para reproduzir

1. No campo **Telefone (WhatsApp)**, digitar mais de 20 dígitos.
2. Tocar em **Salvar alterações**.

### ✅ Resultado esperado

O app bloqueia no próprio campo, com mensagem em português, como no cadastro (DDD + 9 dígitos). Nada é enviado à API (AC-05, FA-001).

### ❌ Resultado obtido

O app envia o telefone à API e exibe o erro do backend em inglês: “String should have at most 20 characters”. O telefone salvo não é alterado.

### ⚠️ Impacto

- O usuário recebe uma mensagem técnica em inglês.
- Números com 12 a 20 dígitos também passam pela validação do app e só são recusados pela API, sem mensagem clara no campo.

### Causa aparente

- `frontend/src/schemas/perfilSchema.ts`: `telefone: z.string().min(10, ...)`, sem limite máximo nem regra de formato.
- O cadastro já tem a regra completa em `frontend/src/schemas/alunoSchema.ts:78` (`telefoneSchema`: só dígitos, 11 caracteres, DDD válido, começa com 9).
- O backend (`usuario_dto.py:311`, `max_length=20`) responde 422 com a mensagem padrão do Pydantic em inglês.

### Sugestão

- Reutilizar o `telefoneSchema` do cadastro no `perfilSchema` e limitar o campo a 11 dígitos (máscara do cadastro).

### Critérios de aceite

- Telefone fora do padrão DDD + 9 dígitos é bloqueado no campo, com mensagem em português, sem chamar a API.
- Reexecutar `CT-HU005-UI-003`.

### 📎 Evidência

- `PATCH /usuarios/me` com telefone de 21 caracteres → `422` com `"String should have at most 20 characters"`.
