# Link de recuperação usado ou expirado abre a tela de nova senha e só avisa ao salvar

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / UX |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU004-UI-007` |
| **Documentação** | HU-004 — Testes manuais de UI: [CT-HU004-UI-007](../UI-HU-004.md#ct-hu004-ui-007--link-já-utilizado-ou-expirado) |
| **Issue relacionada** | [MELHORIA-HU004-UI-006-padronizar-alertas-recuperacao](MELHORIA-HU004-UI-006-padronizar-alertas-recuperacao.md) |

---

### Pré-condição

Um link de recuperação já utilizado, ou com mais de 15 minutos.

### Passos para reproduzir

1. Abrir o link no iPhone.
2. Preencher **Nova senha** e **Confirmar nova senha** com uma senha válida.
3. Tocar em **Salvar nova senha**.

### ✅ Resultado esperado

Ao abrir o link, o app identifica que ele não vale mais, **não exibe o formulário de nova senha** e mostra “Link de recuperação expirado ou inválido. Por favor, solicite novamente.”, de preferência com atalho para **Esqueci minha senha** (AC-04, FA-002).

### ❌ Resultado obtido

- A tela **Redefinir Senha** abre normalmente, com o formulário.
- Só depois de preencher e salvar aparece “Erro ao redefinir senha — Token de recuperação já utilizado.” (ou “expirado”).
- A mensagem não orienta a pedir um novo link.
- A senha não é alterada. ✅

### ⚠️ Impacto

- O usuário preenche a senha duas vezes para só então descobrir que o link não vale.
- Sem orientação, ele não sabe que precisa voltar ao **Esqueci minha senha**.

### Causa aparente

- `frontend/src/app/(autenticacao)/redefinir-senha.tsx`: só verifica se o `token` existe; a validade é conferida apenas no envio (`POST /auth/redefinir-senha`).
- O backend já tem a validação do token separada (`validar_token_recuperacao_use_case.py`), mas o app não a consulta ao abrir a tela.

### Sugestão

- Ao abrir a tela, validar o token na API (rota de validação, se existir, ou criar uma) e, se inválido, mostrar a mensagem do FA-002 com botão para **Esqueci minha senha**.
- No erro ao salvar, usar a mesma mensagem orientativa.

### Critérios de aceite

- Link usado ou expirado não exibe o formulário e orienta a solicitar novamente.
- Link válido continua abrindo o formulário.
- Reexecutar `CT-HU004-UI-007`.

### 📎 Evidência
