# App exibe a carteirinha para aluno sem aprovação, mesmo com a API recusando

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / regra de negócio |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU029-UI-002` |
| **Documentação** | HU-029 — Testes manuais de UI: [CT-HU029-UI-002](../UI-HU-029.md#ct-hu029-ui-002--aluno-sem-status-aprovado) |
| **Issue relacionada** | #75 — mesma regra no backend (corrigida: a API já responde 403) |

---

### Pré-condição

Aluno com status **em análise de renovação** (`analise_renovacao`) logado no app.

### Passos para reproduzir

1. Abrir **Perfil → Ver carteirinha digital**.

### ✅ Resultado esperado

O documento fica oculto (sem foto, dados nem QR Code) e o app exibe “Carteirinha indisponível. Seu cadastro está inativo ou em análise.” (AC-02).

### ❌ Resultado obtido

A carteirinha é exibida com os dados do aluno e o QR Code. No log do backend, a chamada do app recebe `403 Forbidden` (“Carteirinha indisponível…”), mas o app ignora a resposta.

### ⚠️ Impacto

- Um aluno sem direito ao transporte (em análise, e potencialmente inativado durante a sessão) apresenta uma carteirinha com aparência válida no embarque.
- A correção da #75 no backend fica sem efeito para quem usa o app.

### Causa aparente

`frontend/src/app/(aluno)/carteirinha-digital.tsx`: o `catch` de `userService.getCarteirinha()` trata qualquer erro como “offline” (`console.warn('Carteirinha offline ou em carregamento, usando cache do usuário')`) e monta a carteirinha com `user` (sessão) e valores padrão fixos.

### Sugestão

- Diferenciar os erros: com `403`, ocultar o documento e mostrar a mensagem da API; usar dados guardados só quando não houver conexão (AC-03), e só se o último status conhecido for aprovado.
- Não usar valores padrão fixos no lugar de dados ausentes (ver CT-HU029-UI-003).

### Critérios de aceite

- Aluno em análise, pendente ou inativado não vê a carteirinha e recebe a mensagem do AC-02.
- Aluno aprovado continua vendo a carteirinha online e offline.
- Reexecutar `CT-HU029-UI-002`, `CT-HU029-UI-004` e `CT-HU029-UI-007`.

### 📎 Evidência

- Log do backend: `GET /alunos/me/carteirinha HTTP/1.1" 403 Forbidden` na requisição do aluno B.
