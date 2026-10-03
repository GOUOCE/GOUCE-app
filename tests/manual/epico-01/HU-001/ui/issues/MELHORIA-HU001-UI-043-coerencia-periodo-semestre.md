# Período de ingresso e semestre atual não são validados entre si

| Campo | Valor |
|---|---|
| **Tipo** | Melhoria |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-043` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-043](../UI-HU-001.md#ct-hu001-ui-043--selecionar-e-alterar-dados-acadêmicos) |
| **Issue relacionada** | [MELHORIA-HU001-UI-043-periodos-de-ingresso-fixos](MELHORIA-HU001-UI-043-periodos-de-ingresso-fixos.md), [DISCUSSAO-HU001-UI-044-limite-semestre-atual](DISCUSSAO-HU001-UI-044-limite-semestre-atual.md) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Na etapa **Contato e Vínculo**, escolher ingresso **2024.1**.
2. Escolher semestre atual **10º** e avançar.

### ✅ Resultado esperado

Impedir combinações impossíveis entre período de ingresso e semestre atual.

### ❌ Resultado obtido

A combinação 2024.1 com 10º semestre foi aceita; nenhuma camada verifica a coerência.

### ⚠️ Impacto

- Cadastros chegam com dados acadêmicos impossíveis.

### Critérios de aceite

- Combinações impossíveis entre período e semestre são rejeitadas com mensagem clara.
- Reexecutar `CT-HU001-UI-043`.

### 📎 Evidência
