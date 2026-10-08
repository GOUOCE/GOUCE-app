# Confirmação do “Esqueci minha senha” fica escondida pelo teclado e não é genérica

| Campo | Valor |
|---|---|
| **Tipo** | Bug de UX |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU004-UI-002` |
| **Documentação** | HU-004 — Testes manuais de UI: [CT-HU004-UI-002](../UI-HU-004.md#ct-hu004-ui-002--solicitação-com-e-mail-cadastrado) |

---

### Pré-condição

App sem sessão, na tela **Esqueci minha senha** no iPhone.

### Passos para reproduzir

1. Tocar no campo **E-mail** e digitar um e-mail cadastrado.
2. Com o teclado aberto, tocar em **Enviar instruções**.

### ✅ Resultado esperado

- Um retorno claro e visível, como nas outras telas (pop-up), com a mensagem genérica do AC-03: “Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação”.
- O teclado é fechado ao enviar.

### ❌ Resultado obtido

- O teclado continua aberto.
- A confirmação aparece só como um aviso discreto (Snackbar) no rodapé, escondido pelo teclado. É preciso fechar o teclado para ler “E-mail enviado. Verifique sua caixa de entrada para continuar.”
- O texto afirma que o e-mail foi enviado. Como a API responde sucesso para qualquer e-mail, o mesmo texto aparece para e-mails não cadastrados.

### ⚠️ Impacto

- O usuário não percebe que a solicitação deu certo e tende a tocar de novo, gerando novos links e invalidando os anteriores.
- “E-mail enviado” para um e-mail não cadastrado engana o usuário, que fica esperando uma mensagem que nunca chega.

### Causa aparente

- `frontend/src/app/(autenticacao)/esqueci-senha.tsx`: o sucesso só liga um `Snackbar` (`setVisivel(true)`), sem `Keyboard.dismiss()`; o Snackbar fica no rodapé, atrás do teclado.
- O texto do Snackbar é fixo: “E-mail enviado. Verifique sua caixa de entrada para continuar.”

### Sugestão

- Fechar o teclado no envio (`Keyboard.dismiss()`) e mostrar o retorno com o `AppPopup`, como no login.
- Usar a mensagem genérica do AC-03.

### Critérios de aceite

- Após o envio, o teclado fecha e a confirmação aparece em destaque, sem precisar de ação extra.
- O texto é genérico e igual para e-mails cadastrados e não cadastrados.
- Reexecutar `CT-HU004-UI-002` e `CT-HU004-UI-003`.

### 📎 Evidência

- Na execução do CT-002, a caixa de teste recebeu **3 e-mails de recuperação** para a mesma conta em menos de 1 minuto (03:57:19, 03:57:30 e 03:58:13 UTC), porque a confirmação não ficou visível e o envio foi repetido. Cada novo envio invalida o link anterior.
