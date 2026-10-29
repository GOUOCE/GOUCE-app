# Comprovante da renovação: avisar que é obrigatório e usar o limite de 5 MB do requisito

| Campo | Valor |
|---|---|
| **Tipo** | Melhoria / divergência de requisito |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU028-UI-002` |
| **Documentação** | HU-028 — Testes manuais de UI: [CT-HU028-UI-002](../UI-HU-028.md#ct-hu028-ui-002--envio-sem-comprovante) |
| **Issue relacionada** | [BUG-HU028-API-001-limite-de-5mb-nao-aplicado](../../api/issues/BUG-HU028-API-001-limite-de-5mb-nao-aplicado.md) (mesmo limite na API) |

---

### Pré-condição

Aluno aprovado em **Perfil → Renovar vínculo**, no passo 4 (Documentação).

### Passos para reproduzir

1. Não anexar o comprovante de matrícula.
2. Tocar no botão de envio.

### ✅ Resultado esperado

- Alerta claro de que o comprovante de matrícula é **obrigatório** (AC-02).
- Quando houver orientação de tamanho, ela informa o limite de **5 MB** definido no AC-03 e no BDD (`HU-028.feature`).

### ❌ Resultado obtido

- O envio é bloqueado (funcionalidade correta), mas a mensagem é “Envie PDF ou imagem (PNG, JPG ou WEBP) de até 10 MB”.
- O texto não diz que o arquivo é obrigatório e informa 10 MB.

### ⚠️ Impacto

- Baixo: o envio sem arquivo é bloqueado. A mensagem confunde o aluno e informa um limite diferente do requisito.

### Causa aparente

- `frontend/src/schemas/alunoSchema.ts`: o `fileSchema` usa `size <= 10 * 1024 * 1024` e uma única mensagem para arquivo ausente, formato e tamanho.
- A API aplica o mesmo limite de 10 MB na renovação (BUG-HU028-API-001).

### Sugestão

- Separar as mensagens: “O comprovante de matrícula é obrigatório” (sem arquivo), “Formato inválido” e “Arquivo excede o limite de tamanho”.
- Ajustar o limite para 5 MB no app e na API, ou atualizar o requisito se o time decidir manter 10 MB.

### Critérios de aceite

- Sem arquivo: mensagem de obrigatoriedade.
- Arquivo acima de 5 MB: “Arquivo excede o limite de tamanho”.
- Reexecutar `CT-HU028-UI-002` e `CT-HU028-UI-003`.

### 📎 Evidência
