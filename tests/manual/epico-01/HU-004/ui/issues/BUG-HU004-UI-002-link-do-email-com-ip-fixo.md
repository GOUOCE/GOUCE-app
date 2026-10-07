# Link do e-mail de recuperação abre o app num IP fixo no código (192.168.0.3)

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / configuração |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU004-UI-002`, `CT-HU004-UI-004` a `CT-HU004-UI-007` |
| **Documentação** | HU-004 — Testes manuais de UI: [PC-03](../UI-HU-004.md#pré-condições) e [CT-HU004-UI-002](../UI-HU-004.md#ct-hu004-ui-002--solicitação-com-e-mail-cadastrado) |

---

### Pré-condição

E-mail de recuperação recebido no iPhone, com o app rodando num computador cujo IP não é `192.168.0.3`.

### Passos para reproduzir

1. No e-mail, tocar em **Redefinir minha senha**.
2. Na página intermediária, tocar em **ABRIR NO APLICATIVO** (ou aguardar o redirecionamento automático).

### ✅ Resultado esperado

O app abre na tela **Redefinir Senha** com o token do link.

### ❌ Resultado obtido

A página tenta abrir `exp://192.168.0.3:8081/--/redefinir-senha?token=...`, endereço fixo no código, que não corresponde ao computador que roda o app. O app não abre. Nos testes, foi preciso copiar o token e abrir manualmente `exp://<IP do computador>:8081/--/redefinir-senha?token=...` (plano B do PC-03).

### ⚠️ Impacto

- O fluxo de recuperação pelo e-mail não funciona para ninguém fora da máquina com esse IP: o usuário recebe o link e não consegue chegar à tela de nova senha.
- Bloqueia o teste ponta a ponta da HU-004 sem intervenção manual.

### Causa aparente

- `backend/src/modulos/auth/api/http/auth_routes.py:314`: a rota-ponte `GET /auth/redefinir-senha` monta `expo_link = f"exp://192.168.0.3:8081/--/redefinir-senha?token=..."` com IP e porta fixos.
- O mesmo IP aparece como valor reserva no app: `frontend/src/api/api.ts:10`, `frontend/src/app/(aluno)/perfil.tsx:47` e `frontend/src/app/(aluno)/carteirinha-digital.tsx:39` (usado só se `EXPO_PUBLIC_API_URL` não estiver definido).

### Sugestão

- Ler o endereço do app de uma variável de ambiente do backend (ex.: `APP_DEEP_LINK_URL`), como já é feito com `APP_URL`, e documentar no `.env.example`.
- Remover o IP fixo dos valores reserva do front, ou trocar por um erro claro de configuração.

### Critérios de aceite

- O link do e-mail abre o app na tela **Redefinir Senha** em qualquer máquina configurada pelo `.env`.
- Nenhum IP fixo no código.
- Reexecutar `CT-HU004-UI-002` a `CT-HU004-UI-007` usando o link do e-mail.

### 📎 Evidência
