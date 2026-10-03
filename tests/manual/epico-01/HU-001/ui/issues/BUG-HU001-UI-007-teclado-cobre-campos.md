# Teclado cobre campos, mensagens de erro e o botão Avançar nas etapas 1 e 3

| Campo | Valor |
|---|---|
| **Tipo** | Bug de UX |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-007` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-007](../UI-HU-001.md#ct-hu001-ui-007--teclado-rolagem-e-correção-de-erros-no-iphone) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Na etapa **Dados básicos**, tocar em **Nome completo** para abrir o teclado.
2. Tentar rolar até senha e confirmação de senha e até o botão de avanço.
3. Repetir na etapa **Contato e Vínculo**.

### ✅ Resultado esperado

Com o teclado aberto, manter campos, mensagens de erro e botões acessíveis pela rolagem.

### ❌ Resultado obtido

Com o teclado aberto, não foi possível rolar até os campos inferiores nem acessar o botão de avanço: ao rolar para baixo, a tela voltava para cima. O teclado também escondia as mensagens de erro. Com o teclado fechado, a rolagem funcionava. O problema ocorre nas etapas 1 e 3.

### ⚠️ Impacto

- O usuário não consegue preencher a senha nem avançar sem antes fechar o teclado.
- Mensagens de erro ficam escondidas, e o usuário não sabe o que corrigir.

### Critérios de aceite

- Com o teclado aberto, a tela rola até qualquer campo e até o botão de avanço nas etapas 1 e 3.
- Mensagens de erro ficam visíveis acima do teclado.
- Reexecutar `CT-HU001-UI-007`.

### 📎 Evidência
