# Opção “Anterior” no período de ingresso grava um período inventado

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / integridade de dados |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-043` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-043](../UI-HU-001.md#ct-hu001-ui-043--selecionar-e-alterar-dados-acadêmicos) |
| **Issue relacionada** | [MELHORIA-HU001-UI-043-periodos-de-ingresso-fixos](MELHORIA-HU001-UI-043-periodos-de-ingresso-fixos.md), [MELHORIA-HU001-UI-043-coerencia-periodo-semestre](MELHORIA-HU001-UI-043-coerencia-periodo-semestre.md) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Na etapa **Contato e Vínculo**, escolher o período de ingresso **Anterior**.
2. Concluir o cadastro.
3. Consultar o período de ingresso salvo para o aluno.

### ✅ Resultado esperado

Salvar o período real de ingresso do aluno, ou deixar o campo sem valor, em vez de um valor fictício.

### ❌ Resultado obtido

O app troca “Anterior” por (ano atual − 4).1, ou seja, 2022.1 em 2026. Um cadastro com “Anterior” e 10º semestre foi aceito (status pendente, ID 5) com esse valor convertido. Quem entrou em 2018 ou em 2021.2 fica gravado como 2022.1.

### ⚠️ Impacto

- O banco passa a ter períodos de ingresso falsos, que a coordenação pode usar na análise.

### Causa aparente

`frontend/src/services/userService.ts:158-160` substitui “Anterior” por `${ano atual − 4}.1`. A mesma lógica se repete na renovação de vínculo (`userService.ts:207-209`).

### Critérios de aceite

- “Anterior” não grava um período que o aluno não informou.
- O app pede o período real ou salva o campo sem valor.
- Reexecutar `CT-HU001-UI-043`.

### 📎 Evidência
