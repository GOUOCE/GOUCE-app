# Administrador não consegue sair da conta: aba Mais desativada

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU002-UI-016` |
| **Documentação** | HU-002 — Testes manuais de UI: [CT-HU002-UI-016](../UI-HU-002.md#ct-hu002-ui-016--sair-da-conta) |
| **Issue relacionada** | [BUG-HU002-UI-015-sessao-nao-restaurada](BUG-HU002-UI-015-sessao-nao-restaurada.md) |

---

### Pré-condição

Administrador logado no **Painel** no iPhone.

### Passos para reproduzir

1. No menu inferior, tocar na aba **Mais**.

### ✅ Resultado esperado

Abrir a tela **Mais**, com o botão **Sair**; ao tocar em **Sair**, encerrar a sessão e voltar para a tela de login.

### ❌ Resultado obtido

A aba **Mais** não responde ao toque. O administrador não tem como sair da conta; a única saída é fechar o app, o que não encerra a sessão.

### ⚠️ Impacto

- O administrador fica preso na conta: não consegue trocar de usuário nem encerrar a sessão, por exemplo em um aparelho compartilhado.
- A sessão (usuário e token) continua salva no aparelho.

### Causa aparente

- `frontend/src/app/(administrador)/_layout.tsx`: a aba `mais` usa `tabBarButton` com `pointerEvents="none"`, o mesmo bloqueio aplicado às abas ainda não implementadas (Cadastros e Logística).
- A tela `frontend/src/app/(administrador)/mais.tsx` já tem o botão **Sair** ligado ao `signOut`; falta liberar a aba.

### Critérios de aceite

- A aba **Mais** abre a tela com o botão **Sair**.
- **Sair** encerra a sessão e volta para a tela de login.
- Ao reabrir o app depois de sair, ele não entra logado.
- Reexecutar `CT-HU002-UI-016`.

### 📎 Evidência
