# Máscara do WhatsApp com DDD e 9 dígitos, aceitando só números

| Campo | Valor |
|---|---|
| **Tipo** | Melhoria |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-039`, `CT-HU001-UI-040`, `CT-HU001-UI-041`, `CT-HU001-UI-042` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-039](../UI-HU-001.md#ct-hu001-ui-039--whatsapp-incompleto) · [CT-HU001-UI-040](../UI-HU-001.md#ct-hu001-ui-040--whatsapp-com-11-dígitos) · [CT-HU001-UI-041](../UI-HU-001.md#ct-hu001-ui-041--whatsapp-com-excesso-de-dígitos) · [CT-HU001-UI-042](../UI-HU-001.md#ct-hu001-ui-042--whatsapp-com-letras-símbolos-e-emoji) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Na etapa **Contato e Vínculo**, digitar o número de WhatsApp.

### ✅ Resultado esperado

Formatar automaticamente como (XX) 9XXXX-XXXX, aceitando apenas números.

### ❌ Resultado obtido

O campo valida o número, mas o QA recomenda deixar explícita a máscara com DDD e 9 dígitos, aceitando só números, para guiar a digitação.

### ⚠️ Impacto

- Sem máscara clara, o usuário pode digitar em formatos diferentes e receber erro.

### Critérios de aceite

- O campo exibe a máscara (XX) 9XXXX-XXXX e aceita apenas números.
- Reexecutar `CT-HU001-UI-039` a `CT-HU001-UI-042`.

### 📎 Evidência
