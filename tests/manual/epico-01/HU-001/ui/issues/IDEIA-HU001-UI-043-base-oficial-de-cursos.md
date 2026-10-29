# Pesquisar uma base oficial de cursos para alimentar a lista de cursos

| Campo | Valor |
|---|---|
| **Tipo** | Ideia futura |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-043` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-043](../UI-HU-001.md#ct-hu001-ui-043--selecionar-e-alterar-dados-acadêmicos) |
| **Issue relacionada** | [MELHORIA-HU001-UI-043-lista-de-cursos-autocomplete](MELHORIA-HU001-UI-043-lista-de-cursos-autocomplete.md) |

---

### Pré-condição

Nenhuma.

### Passos para reproduzir

1. Abrir o seletor **Curso** na etapa **Contato e Vínculo**.

### ✅ Resultado esperado

Ter uma lista de cursos completa e atualizada, sem depender de valores fixos no código.

### ❌ Resultado obtido

Hoje há poucos cursos e não é possível informar o próprio curso ao escolher Outro.

### ⚠️ Impacto

- Sem uma fonte confiável de cursos, a lista fica desatualizada e incompleta.

### Critérios de aceite

- Pesquisar se o e-MEC ou o Sisu oferecem uma API estável.
- Decidir entre integração direta ou uma tabela de cursos no banco, carregada a partir da base do MEC e atualizada periodicamente (alternativa mais barata).
- Não é prioridade desta entrega, porque depende de um serviço externo que pode mudar.

### 📎 Evidência
