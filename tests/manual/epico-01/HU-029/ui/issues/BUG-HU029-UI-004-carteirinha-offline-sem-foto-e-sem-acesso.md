# Carteirinha offline aparece sem foto e fica inacessível ao reabrir o app sem internet

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU029-UI-004` |
| **Documentação** | HU-029 — Testes manuais de UI: [CT-HU029-UI-004](../UI-HU-029.md#ct-hu029-ui-004--carteirinha-offline) |
| **Issue relacionada** | #100 — sessão não é restaurada ao reabrir o app |

---

### Pré-condição

Aluno aprovado que já abriu a carteirinha com internet.

### Passos para reproduzir

1. Desligar Wi-Fi e dados móveis e abrir a carteirinha.
2. Ainda sem internet, fechar o app completamente e abrir de novo.

### ✅ Resultado esperado

Sem erro de conexão, a versão salva na última conexão válida aparece imediatamente, com **foto, dados e QR Code** (AC-03, FA-001), inclusive depois de reabrir o app no momento do embarque.

### ❌ Resultado obtido

- Com o app aberto: a carteirinha aparece com os dados e o selo **Disponível offline**, mas **sem a foto** (área azul).
- Com a internet de volta, a foto não reaparece até sair da tela ou reabrir o app.
- Depois de reabrir o app sem internet: não é possível entrar (falha de conexão com o servidor), então a carteirinha não pode ser exibida.

### ⚠️ Impacto

- No embarque sem sinal, o aluno não consegue apresentar a carteirinha completa (sem foto, o motorista não confere a identidade) ou não consegue abri-la.
- O selo **Disponível offline** promete algo que não acontece.

### Causa aparente

- `frontend/src/app/(aluno)/carteirinha-digital.tsx`: não há cache da carteirinha; em erro, a tela usa os dados da sessão em memória. A foto é carregada da API (`/arquivos/{id}/view`) a cada abertura.
- O selo **Disponível offline** é fixo.
- Ao reabrir o app, a sessão salva não é restaurada (#100) e o login depende da API.

### Sugestão

- Guardar no aparelho (AsyncStorage/FileSystem) os dados da carteirinha e a imagem da foto na última consulta bem-sucedida, apenas se o aluno estiver aprovado, e usá-los quando não houver conexão.
- Permitir abrir a carteirinha em cache sem passar pelo login quando há sessão salva (depende da #100).
- Exibir o selo só quando a carteirinha estiver de fato em cache, informando a data da última atualização.

### Critérios de aceite

- Sem internet, a carteirinha aparece com foto, dados e QR Code, também após reabrir o app.
- Reexecutar `CT-HU029-UI-004` e `CT-HU029-UI-005`.

### 📎 Evidência
