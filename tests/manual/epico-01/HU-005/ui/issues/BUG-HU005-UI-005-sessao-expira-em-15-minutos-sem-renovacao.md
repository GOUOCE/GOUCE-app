# Sessão vence em 15 minutos e o app não renova o token: ações falham com “não autorizado”

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / sessão |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU005-UI-005` |
| **Documentação** | HU-005 — Testes manuais de UI: [CT-HU005-UI-005](../UI-HU-005.md#ct-hu005-ui-005--alterar-e-mail-com-senha-correta) |
| **Issue relacionada** | #100 — sessão não restaurada ao reabrir o app; #112 — conta inativada não encerra a sessão |

---

### Pré-condição

Aluno ativo logado há mais de 15 minutos, usando o app normalmente.

### Passos para reproduzir

1. Entrar como aluno e usar o app por mais de 15 minutos.
2. Em **Meu Perfil → Alterar endereço de e-mail**, preencher dados válidos e salvar (ou qualquer outra ação que chame a API).

### ✅ Resultado esperado

O app renova a sessão automaticamente (rota `/auth/refresh`) e a ação é concluída. Se a renovação não for possível, o app avisa que a sessão expirou e leva ao login.

### ❌ Resultado obtido

- A ação falha com “Falha ao alterar — E-mail não autorizado”. O backend responde `401`.
- Com um login novo, a mesma alteração é aceita: o problema é só o token vencido.
- O app continua na área do aluno, sem avisar que a sessão expirou.

### ⚠️ Impacto

- Todo usuário perde a sessão depois de 15 minutos de uso, e as ações passam a falhar sem explicação.
- A mensagem “E-mail não autorizado” engana: parece um problema com o e-mail, não com a sessão.

### Causa aparente

- `backend/src/shared/auth/jwt_service.py:23`: o token de acesso expira em 15 minutos (o de atualização dura horas ou dias).
- O backend já oferece `POST /auth/refresh`, mas o app não o usa: não há renovação em `frontend/src/api/api.ts`, `AuthContext.tsx` nem `authService.ts`.
- `frontend/src/contexts/AuthContext.tsx` não guarda o `token_atualizacao` retornado pelo login.
- O interceptador de 401 (`api.ts`) só apaga o AsyncStorage, sem renovar nem levar ao login (ver #112).

### Sugestão

- Guardar o `token_atualizacao` no login e, no interceptador de 401, chamar `/auth/refresh`, atualizar o token e repetir a requisição.
- Se a renovação falhar, chamar `signOut` com a mensagem “Sua sessão expirou. Entre novamente.”

### Critérios de aceite

- Com o app aberto por mais de 15 minutos, as ações continuam funcionando.
- Com a renovação impossível, o app avisa e leva ao login.
- Reexecutar `CT-HU005-UI-005` após 15 minutos de sessão.

### 📎 Evidência

- Log do backend: `PATCH /usuarios/me/email` vindo do iPhone → `401 Unauthorized` (duas vezes); a mesma requisição com token novo foi aceita.
