# Alterar e-mail recusa e-mail com espaços nas pontas e não normaliza para minúsculas

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU005-UI-005`, `CT-HU005-UI-006` |
| **Documentação** | HU-005 — Testes manuais de UI: [CT-HU005-UI-005](../UI-HU-005.md#ct-hu005-ui-005--alterar-e-mail-com-senha-correta) |
| **Issue relacionada** | #51 (mesma correção no cadastro, fechada), #97 (mesmo problema no login), #98 (e-mail em minúsculas no login) |

---

### Pré-condição

Aluno ativo logado, na tela **Alterar endereço de e-mail**.

### Passos para reproduzir

1. Em **Novo E-mail**, informar um e-mail válido com espaço no início e no fim: `" aaaa@gmail.com "`.
2. Informar a senha atual correta e salvar.

### ✅ Resultado esperado

Remover os espaços das pontas, converter para minúsculas e aceitar o e-mail, como o cadastro já faz desde a #51.

### ❌ Resultado obtido

O app recusa o e-mail como inválido (“Informe um e-mail novo válido”) por causa dos espaços.

### ⚠️ Impacto

- O teclado do iPhone costuma inserir espaço depois de uma sugestão, e e-mails colados podem trazer espaços: o usuário digita um e-mail correto e recebe erro sem entender.
- O e-mail digitado em maiúsculas é guardado na sessão do app como foi digitado (`updateUser`), embora o backend salve em minúsculas.
- É a terceira tela com o mesmo defeito (cadastro corrigido na #51; login na #97).

### Causa aparente

- `frontend/src/schemas/perfilSchema.ts`: `alterarEmailSchema` usa `z.string().email(...)` em `emailAtual` e `novoEmail`, sem `trim()` nem minúsculas.
- O cadastro já tem a regra correta em `frontend/src/schemas/alunoSchema.ts:49` (`emailSchema`: `trim().toLowerCase()` antes de validar).
- O backend já normaliza (`redefinir_email_use_case.py`: `lower().strip()`); o bloqueio é só no app.

### Sugestão

- Criar um único schema de e-mail compartilhado (trim + minúsculas) e usá-lo no cadastro, no login (#97), no **Esqueci minha senha** e no **Alterar e-mail**.
- Exibir o e-mail em minúsculas ao sair do campo, como proposto na #98.

### Critérios de aceite

- `" aaaa@gmail.com "` e `AAAA@Gmail.com` são aceitos e salvos como `aaaa@gmail.com`.
- Reexecutar `CT-HU005-UI-005` e `CT-HU005-UI-006`.

### 📎 Evidência
