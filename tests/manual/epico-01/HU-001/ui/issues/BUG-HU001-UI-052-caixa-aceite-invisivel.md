# Caixa de aceite dos termos não aparece na tela

| Campo | Valor |
|---|---|
| **Tipo** | Bug de UX |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-052` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-052](../UI-HU-001.md#ct-hu001-ui-052--conclusão-sem-aceite-e-retirada-do-aceite) |
| **Issue relacionada** | [BUG-HU001-UI-051-termos-sem-lgpd-texto-provisorio](BUG-HU001-UI-051-termos-sem-lgpd-texto-provisorio.md) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Avançar até a etapa **Termos de Uso**.
2. Procurar a caixa de marcar do aceite.

### ✅ Resultado esperado

Exibir a caixa de marcar do aceite de forma visível, indicando claramente se está marcada.

### ❌ Resultado obtido

A caixa de marcar do aceite não aparece visualmente na tela. A conclusão sem aceite continua bloqueada.

### ⚠️ Impacto

- O usuário não vê onde aceitar os termos e pode achar que o botão de concluir está travado.

### Critérios de aceite

- A caixa de aceite aparece, com estado marcado e desmarcado visíveis.
- Reexecutar `CT-HU001-UI-052`.

### 📎 Evidência
