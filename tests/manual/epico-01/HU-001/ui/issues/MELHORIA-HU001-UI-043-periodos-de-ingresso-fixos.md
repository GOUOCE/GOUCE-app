# Períodos de ingresso fixos e desatualizados no seletor

| Campo | Valor |
|---|---|
| **Tipo** | Melhoria |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-043` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-043](../UI-HU-001.md#ct-hu001-ui-043--selecionar-e-alterar-dados-acadêmicos) |
| **Issue relacionada** | [BUG-HU001-UI-043-periodo-anterior-grava-valor-inventado](BUG-HU001-UI-043-periodo-anterior-grava-valor-inventado.md), [MELHORIA-HU001-UI-043-coerencia-periodo-semestre](MELHORIA-HU001-UI-043-coerencia-periodo-semestre.md) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Na etapa **Contato e Vínculo**, abrir o seletor **Período de ingresso**.

### ✅ Resultado esperado

Oferecer os períodos até o semestre atual, gerados a partir da data.

### ❌ Resultado obtido

As opções são fixas: 2024.1, 2023.2, 2023.1, 2022.2 e Anterior. Faltam 2024.2, 2025.1, 2025.2, 2026.1 e 2026.2.

### ⚠️ Impacto

- Alunos que ingressaram depois de 2024.1 não conseguem escolher o período correto.

### Causa aparente

Opções fixas em `frontend/src/components/cadastro/Passo3ContatoVinculo.tsx:168`.

### Critérios de aceite

- A lista é gerada a partir da data atual, sem valores fixos no código.
- Reexecutar `CT-HU001-UI-043`.

### 📎 Evidência
