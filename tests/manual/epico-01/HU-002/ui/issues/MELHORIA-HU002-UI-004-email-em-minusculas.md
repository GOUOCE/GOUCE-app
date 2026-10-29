# Exibir o e-mail em minúsculas no campo de login

| Campo | Valor |
|---|---|
| **Tipo** | Melhoria |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU002-UI-004` |
| **Documentação** | HU-002 — Testes manuais de UI: [CT-HU002-UI-004](../UI-HU-002.md#ct-hu002-ui-004--e-mail-com-caixa-mista-e-espaços) |
| **Issue relacionada** | [BUG-HU002-UI-003-email-com-espacos-recusado](BUG-HU002-UI-003-email-com-espacos-recusado.md) |

---

### Pré-condição

Usuário sem sessão autenticada na tela **Entrar** no iPhone.

### Passos para reproduzir

1. Informar o e-mail em letras maiúsculas (ex.: `ALUNO@GMAIL.COM`).
2. Sair do campo.

### ✅ Resultado esperado

O campo passa a exibir o e-mail em minúsculas (`aluno@gmail.com`), deixando claro para o usuário que maiúsculas e minúsculas não fazem diferença.

### ❌ Resultado obtido

O campo mantém as letras maiúsculas. O login funciona (o backend converte para minúsculas), mas o app não mostra essa normalização.

### ⚠️ Impacto

- Baixo: é uma questão de clareza. O usuário pode achar que precisa digitar o e-mail exatamente como cadastrou.

### Sugestão

- Normalizar o e-mail (trim + minúsculas) no schema antes de validar e enviar, como no cadastro.
- Na tela, converter para minúsculas **ao sair do campo** (`onBlur`), e não a cada tecla: trocar o texto durante a digitação faz o cursor pular no iOS (mesmo cuidado tomado com a máscara do telefone na HU-001).

### Critérios de aceite

- Ao sair do campo, o e-mail aparece em minúsculas e sem espaços nas pontas.
- A digitação não é afetada (o cursor não pula).
- Reexecutar `CT-HU002-UI-004`.

### 📎 Evidência
