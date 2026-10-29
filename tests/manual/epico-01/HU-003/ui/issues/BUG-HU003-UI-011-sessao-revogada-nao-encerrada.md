# Conta inativada durante a sessão continua na área do aluno, sem aviso nem logout

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / controle de acesso |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU003-UI-011` |
| **Documentação** | HU-003 — Testes manuais de UI: [CT-HU003-UI-011](../UI-HU-003.md#ct-hu003-ui-011--conta-inativada-durante-a-sessão) |
| **Issue relacionada** | #100 — sessão não é restaurada ao reabrir o app (mesma área: `AuthContext`) |

---

### Pré-condição

Aluno ativo logado no iPhone, na aba **Perfil**.

### Passos para reproduzir

1. Com o aluno logado, inativar a conta pelo administrador (`PATCH /usuarios/alunos/{id}/status` com `{"status_cadastro": "inativado"}`).
2. No iPhone, sem sair do app, abrir a **Carteirinha Digital** e navegar pelas abas.

### ✅ Resultado esperado

Na próxima ação que consulta a API, o app identifica que o acesso foi revogado, encerra a sessão e leva para a tela de login (AC-08, FA-002).

### ❌ Resultado obtido

- O app continua na área do aluno, sem nenhuma mensagem.
- O **Perfil** segue mostrando o cadastro como aprovado.
- A foto de perfil e a **Carteirinha Digital** ficam em branco (azul claro), porque as requisições passam a falhar.
- Só depois de fechar e reabrir o app, um novo login é recusado com “Sua conta está inativada”.

### ⚠️ Impacto

- O aluno inativado continua vendo a área e os dados em cache da sessão (nome, e-mail, curso, status “aprovado”) até fechar o app.
- A tela fica quebrada (foto e carteirinha em branco) sem explicação, o que parece erro do sistema.
- A API bloqueia corretamente (`401 Sessão inválida ou expirada`); o defeito está no app.

### Causa aparente

- `frontend/src/api/api.ts`: o interceptador de resposta, ao receber `401`, só remove `@GOUOCE:token` e `@GOUOCE:user` do AsyncStorage.
- O estado do `AuthContext` (`user` e `token`) não é limpo e não há navegação para o login, então as telas continuam montadas com os dados antigos.

### Sugestão

- No 401, chamar o `signOut` do `AuthContext` (ou emitir um evento que ele escute), limpando o estado e redirecionando para o login com uma mensagem como “Sua sessão foi encerrada”.
- Exibir o motivo quando houver (ex.: conta inativada).

### Critérios de aceite

- Após a inativação, a primeira requisição que recebe 401 encerra a sessão e leva ao login, com mensagem clara.
- Nenhum dado da sessão anterior continua visível.
- Reexecutar `CT-HU003-UI-011`.

### 📎 Evidência
