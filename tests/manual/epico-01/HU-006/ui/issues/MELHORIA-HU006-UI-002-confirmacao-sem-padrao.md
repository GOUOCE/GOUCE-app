# Confirmações da gestão de administradores são avisos rápidos sem o estilo do app

| Campo | Valor |
|---|---|
| **Tipo** | Melhoria |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU006-UI-002`, `CT-HU006-UI-004`, `CT-HU006-UI-005` |
| **Documentação** | HU-006 — Testes manuais de UI: [CT-HU006-UI-002](../UI-HU-006.md#ct-hu006-ui-002--cadastrar-novo-administrador) |
| **Issue relacionada** | #120 e #137 — mesmo padrão na recuperação de senha e na renovação de vínculo |

---

### Pré-condição

Administrador logado na **Gestão de administradores**.

### Passos para reproduzir

1. Cadastrar um administrador e confirmar.

### ✅ Resultado esperado

Confirmação no pop-up padrão do app (`AppPopup`), com o texto do AC-07: “Operação realizada com sucesso”, fechando pela ação do usuário.

### ❌ Resultado obtido

Aviso preto no rodapé (Snackbar), sem o estilo do app, com “Cadastro realizado com sucesso”, que some em cerca de 1,5 s junto com a volta automática da tela. O testador não conseguiu ler.

### ⚠️ Impacto

- Baixo: a operação é concluída, mas o administrador pode não perceber o resultado.

### Causa aparente

`frontend/src/app/(administrador)/administradores/cadastrar.tsx` (e, pelo código, `editar.tsx` e a inativação/reativação em `index.tsx`): sucesso exibido com `Snackbar` e textos próprios (“Cadastro realizado com sucesso”, “Administrador inativado”).

### Critérios de aceite

- As confirmações de cadastro, edição e inativação usam o `AppPopup` com “Operação realizada com sucesso”.
- Reexecutar `CT-HU006-UI-002`, `CT-HU006-UI-004` e `CT-HU006-UI-005`.

### 📎 Evidência
