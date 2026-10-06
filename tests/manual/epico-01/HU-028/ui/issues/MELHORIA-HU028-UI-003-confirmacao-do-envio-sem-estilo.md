# Confirmação do envio da renovação é um aviso rápido, sem o estilo do app

| Campo | Valor |
|---|---|
| **Tipo** | Melhoria |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU028-UI-003`, `CT-HU028-UI-004` |
| **Documentação** | HU-028 — Testes manuais de UI: [CT-HU028-UI-003](../UI-HU-028.md#ct-hu028-ui-003--arquivo-inválido) |
| **Issue relacionada** | #117 e #120 (mesmo padrão no Esqueci minha senha e na redefinição de senha) |

---

### Pré-condição

Aluno aprovado em **Perfil → Renovar vínculo**, com os passos 1 a 4 preenchidos.

### Passos para reproduzir

1. Tocar em **Concluir** no passo 4.

### ✅ Resultado esperado

Confirmação clara, no pop-up padrão do app (`AppPopup`), com o texto do AC-05: “Comprovante enviado com sucesso”, informando que o status passou a “Em análise”.

### ❌ Resultado obtido

Um aviso preto no rodapé (Snackbar), sem o estilo do app, com “Renovação de vínculo solicitada com sucesso”, que some em cerca de 2 segundos junto com a volta automática da tela. O testador não conseguiu ler a mensagem.

### ⚠️ Impacto

- Baixo: a renovação é enviada. O aluno pode não perceber que deu certo e tentar de novo (ver BUG-HU028-API-003, renovação duplicada).

### Causa aparente

`frontend/src/app/(aluno)/renovar-vinculo.tsx`: o sucesso exibe um `Snackbar` e chama `router.back()` após 2 segundos.

### Sugestão

Usar o `AppPopup` com o texto do AC-05 e voltar só quando o aluno tocar em **OK**, como nas demais telas.

### Critérios de aceite

- A confirmação aparece no pop-up do app, com o texto do requisito, e só fecha pela ação do aluno.
- Reexecutar `CT-HU028-UI-004`.

### 📎 Evidência
