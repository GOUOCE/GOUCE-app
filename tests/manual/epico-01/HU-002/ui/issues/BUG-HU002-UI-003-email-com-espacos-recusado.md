# E-mail com espaços nas pontas é recusado como inválido no login

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU002-UI-003` |
| **Documentação** | HU-002 — Testes manuais de UI: [CT-HU002-UI-003](../UI-HU-002.md#ct-hu002-ui-003--e-mail-em-formato-inválido) |
| **Issue relacionada** | #51 — mesma correção, já feita no cadastro (HU-001) |

---

### Pré-condição

Usuário sem sessão autenticada na tela **Entrar** no iPhone, com uma conta de aluno ativo (PC-02 da suíte).

### Passos para reproduzir

1. Informar o e-mail do aluno ativo com espaço no início ou no fim (ex.: `" aluno@gmail.com"` ou `"aluno@gmail.com "`).
2. Informar a senha correta.
3. Tocar em **Entrar**.

### ✅ Resultado esperado

Remover os espaços das pontas (trim) e aceitar o e-mail, como o cadastro já faz desde a #51.

### ❌ Resultado obtido

O app exibe “Informe um e-mail válido” e não avança para a seleção de perfil.

### ⚠️ Impacto

- O teclado do iPhone costuma inserir um espaço depois de uma sugestão do autocompletar, e o e-mail colado também pode trazer espaços. O usuário digita um e-mail correto e recebe um erro que não entende.
- O backend já remove os espaços (`login_use_case.py`), mas o app bloqueia antes de enviar.

### Causa aparente

O `loginSchema` em `frontend/src/schemas/loginSchema.ts` valida o e-mail com `z.string().min(1).email()`, sem remover espaços. O `emailSchema` do cadastro (`frontend/src/schemas/alunoSchema.ts:49`) faz `trim()` + minúsculas antes de validar. O `forgotPasswordSchema` (Esqueci minha senha), no mesmo arquivo, tem o mesmo problema.

### Critérios de aceite

- Espaços no início e no fim do e-mail são removidos antes da validação no login e no Esqueci minha senha.
- O e-mail enviado para a API sai sem espaços.
- Reexecutar `CT-HU002-UI-003` e `CT-HU002-UI-004`.

### 📎 Evidência
