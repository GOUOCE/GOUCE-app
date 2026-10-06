# Padronizar as mensagens da recuperação de senha com o pop-up do app

| Campo | Valor |
|---|---|
| **Tipo** | Melhoria |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU004-UI-006` |
| **Documentação** | HU-004 — Testes manuais de UI: [CT-HU004-UI-006](../UI-HU-004.md#ct-hu004-ui-006--redefinição-válida-e-login) |
| **Issue relacionada** | [BUG-HU004-UI-002-confirmacao-escondida-pelo-teclado](BUG-HU004-UI-002-confirmacao-escondida-pelo-teclado.md) |

---

### Pré-condição

Tela **Redefinir Senha** aberta por um link de recuperação válido.

### Passos para reproduzir

1. Preencher os dois campos com uma senha válida e tocar em **Salvar nova senha**.

### ✅ Resultado esperado

A confirmação “Senha redefinida com sucesso” aparece no mesmo pop-up estilizado usado no restante do app (login, seleção de perfil).

### ❌ Resultado obtido

A confirmação aparece no alerta nativo do iOS (caixa simples, sem as cores e o ícone do app). O mesmo vale para os erros desta tela (“Link Expirado”, “Erro ao Redefinir Senha”) e para o erro do **Esqueci minha senha**.

### ⚠️ Impacto

- Baixo: a mensagem é lida e o fluxo funciona, mas a experiência fica inconsistente com o resto do app.

### Causa aparente

- `frontend/src/app/(autenticacao)/redefinir-senha.tsx`: usa `Alert.alert` para sucesso, link expirado e erro.
- `frontend/src/app/(autenticacao)/esqueci-senha.tsx`: usa `Alert.alert` para erro (e `Snackbar` para sucesso, ver BUG-HU004-UI-002).
- O app já tem o componente `AppPopup` (`frontend/src/components/ui/AppPopup.tsx`), usado no login e na seleção de perfil.

### Critérios de aceite

- As mensagens de sucesso e erro de **Esqueci minha senha** e **Redefinir Senha** usam o `AppPopup`.
- Reexecutar `CT-HU004-UI-002` e `CT-HU004-UI-006`.

### 📎 Evidência
