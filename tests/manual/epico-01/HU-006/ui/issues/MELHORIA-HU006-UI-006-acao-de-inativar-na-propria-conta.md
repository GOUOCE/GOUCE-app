# Não oferecer a ação de inativar na própria conta e trocar o ícone de lixeira

| Campo | Valor |
|---|---|
| **Tipo** | Melhoria (UX) |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU006-UI-006` |
| **Documentação** | HU-006 — Testes manuais de UI: [CT-HU006-UI-006](../UI-HU-006.md#ct-hu006-ui-006--auto-inativação-bloqueada) |

---

### Pré-condição

Administrador logado na **Gestão de administradores**.

### Passos para reproduzir

1. Localizar o próprio administrador na listagem.
2. Tocar no ícone de lixeira.

### ✅ Resultado esperado

- Na linha da própria conta, a ação de inativar fica oculta ou desabilitada (com indicação de “você”), já que nunca pode ser executada (AC-06).
- O ícone da ação representa inativação (ex.: usuário bloqueado), e não exclusão.

### ❌ Resultado obtido

- A lixeira aparece também na própria conta; só depois do toque o app informa “Ação Bloqueada — Não é possível inativar a conta atualmente em uso.” (o bloqueio funciona corretamente).
- A ação usa o ícone de lixeira (`Trash2`), que sugere exclusão definitiva, embora seja uma inativação reversível (há **Reativar**).

### ⚠️ Impacto

- Baixo: o bloqueio funciona. O administrador vê uma ação que não pode usar, e o ícone transmite um risco (excluir) maior do que o real.

### Causa aparente

`frontend/src/app/(administrador)/administradores/index.tsx`: o ícone `Trash2` é exibido em todos os administradores ativos; a verificação da própria conta só acontece no `handleInativar` (linha 69).

### Critérios de aceite

- A própria conta não exibe a ação de inativar (ou a exibe desabilitada).
- O ícone da ação deixa claro que se trata de inativação.
- Reexecutar `CT-HU006-UI-006`.

### 📎 Evidência
