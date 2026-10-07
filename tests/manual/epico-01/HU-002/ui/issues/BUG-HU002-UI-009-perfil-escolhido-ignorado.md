# Perfil escolhido em “Como você quer entrar?” é ignorado no login

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / requisito (AC-08) |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU002-UI-009` |
| **Documentação** | HU-002 — Testes manuais de UI: [CT-HU002-UI-009](../UI-HU-002.md#ct-hu002-ui-009--perfil-escolhido-diferente-do-perfil-da-conta) |

---

### Pré-condição

Uma conta de aluno ativo e a conta de administrador, sem sessão autenticada no iPhone.

### Passos para reproduzir

1. Na tela **Entrar**, informar as credenciais do **aluno ativo** e tocar em **Entrar**.
2. Em **Como você quer entrar?**, tocar em **Sou administrador** (ou **Sou representante**).
3. Repetir com as credenciais do **administrador**, tocando em **Sou aluno** (ou **Sou representante**).

### ✅ Resultado esperado

Ao escolher um perfil que não é o da conta, o app informa a divergência e não entra, ou pede para escolher o perfil correto (AC-08).

### ❌ Resultado obtido

- O aluno entra na área do aluno, qualquer que seja o cartão tocado.
- O administrador entra no Painel do administrador, qualquer que seja o cartão tocado.
- O aluno pendente vê a tela **Cadastro enviado para análise** mesmo tocando em **Sou administrador** ou **Sou representante** (observado no `CT-HU002-UI-013`).
- Nenhum aviso é exibido. A escolha do perfil não tem efeito.

### ⚠️ Impacto

- O AC-08 da HU-002 não é atendido: a tela de seleção existe, mas é apenas visual.
- O usuário que escolheu um perfil vê outra área sem explicação, o que confunde e passa a impressão de erro do sistema.
- Não há escalada de privilégio: cada conta continua entrando só na área do próprio perfil.

### Causa aparente

- `frontend/src/app/(autenticacao)/selecao-perfil.tsx`: `handleSelectProfile(perfil)` recebe o perfil e não o usa; chama apenas `signIn(email, senha)`.
- `frontend/src/contexts/AuthContext.tsx`: `signIn` redireciona sempre para a área do `role` retornado pela API.
- O perfil escolhido não é enviado para `POST /auth/login`.

### Divergência relacionada

O AC-08 e o BDD (`bdd/features/epico-01/HU-002.feature`) preveem a escolha do perfil **antes** de informar e-mail e senha; no app, ela vem **depois**. Alinhar a ordem com o time ao corrigir.

### Critérios de aceite

- Escolher um perfil diferente do da conta exibe uma mensagem clara e não entra no app.
- Escolher o perfil correto entra na área correspondente.
- Reexecutar `CT-HU002-UI-009` e os `CT-HU002-UI-006` e `CT-HU002-UI-007`.

### 📎 Evidência
