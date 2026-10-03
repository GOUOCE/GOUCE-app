# Seta do seletor não abre a lista de opções

| Campo | Valor |
|---|---|
| **Tipo** | Bug de UX |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-043` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-043](../UI-HU-001.md#ct-hu001-ui-043--selecionar-e-alterar-dados-acadêmicos) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Na etapa **Contato e Vínculo**, tocar na seta de um seletor (ex.: Curso).
2. Tocar no restante do campo.

### ✅ Resultado esperado

Abrir a lista ao tocar em qualquer parte do seletor, inclusive na seta.

### ❌ Resultado obtido

Tocar na seta não abre a lista; é preciso tocar no campo.

### ⚠️ Impacto

- O usuário toca no ícone que indica abertura e nada acontece.

### Critérios de aceite

- Tocar na seta abre a lista de opções em todos os seletores do cadastro.
- Reexecutar `CT-HU001-UI-043`.

### 📎 Evidência
