# Sessão não é restaurada ao reabrir o app: volta para as boas-vindas e pede login

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU002-UI-015` |
| **Documentação** | HU-002 — Testes manuais de UI: [CT-HU002-UI-015](../UI-HU-002.md#ct-hu002-ui-015--sessão-mantida-ao-reabrir-o-app) |

---

### Pré-condição

Aluno ativo logado na área do aluno no iPhone.

### Passos para reproduzir

1. Fechar o app completamente (remover da lista de apps abertos).
2. Abrir o app novamente.

### ✅ Resultado esperado

Abrir direto na área do aluno, sem pedir as credenciais, enquanto a sessão for válida.

### ❌ Resultado obtido

O app abre na tela de boas-vindas e pede login de novo.

### ⚠️ Impacto

- O usuário precisa digitar e-mail e senha toda vez que abre o app, o que contradiz a sessão mantida prevista na HU-002.
- Afeta todos os perfis (aluno, administrador).

### Causa aparente

- `frontend/src/contexts/AuthContext.tsx`: `loadStorageData` recupera `@GOUOCE:user` e `@GOUOCE:token` do AsyncStorage, mas o efeito de navegação só age quando a rota atual é protegida (`(aluno)`, `(representante)`, `(administrador)`).
- O app abre em `/` (`frontend/src/app/index.tsx`, tela de boas-vindas), que não é protegida e não verifica se há usuário salvo. Com isso, o usuário fica nas boas-vindas mesmo com sessão salva.
- Ponto de atenção para a correção: o token de acesso dura 15 minutos (`max_age=900` no `/auth/login`). Restaurar a sessão sem renovar o token (`/auth/refresh`) pode levar a erros 401 logo depois de abrir o app.

### Critérios de aceite

- Com sessão salva e válida, reabrir o app leva direto à área do perfil da conta.
- Com sessão expirada ou inválida, o app pede login.
- Depois de **Sair**, reabrir o app não entra logado (`CT-HU002-UI-016`).
- Reexecutar `CT-HU002-UI-015`.

### 📎 Evidência
