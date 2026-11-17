# A prévia automática não usa o mesmo ônibus na ida e na volta e deixa a volta como excedente

| Campo | Valor |
| --- | --- |
| **Tipo** | Bug funcional / divergência de requisito (RN-003) |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `test/execucao-api-hu-016` — Docker isolado `atu-api016`, `http://localhost:8116`, `develop` `7372b8d6` |
| **Caso relacionado** | `CT-HU016-API-009` |
| **Documentação** | [HU-016 — Testes manuais de API](../API-HU-016.md#ct-hu016-api-009--capacidade-e-conflito-de-ônibus-na-distribuição-manual) |

---

### Pré-condição

Administrador autenticado; apenas V1 e M1 ativos; reservas de P1 em 25/11: A e C só na ida e B na ida e na volta.

### Passos para reproduzir

1. `GET /alocacao-diaria/distribuicao-automatica?data=2026-11-25`.
2. Conferir `alocacoes` e `excedentes_globais`.

### ✅ Resultado esperado

V1 atende a ida (3 alunos) e também a volta (aluno B), já que o mesmo ônibus pode fazer ida e volta (RN-003; confirmado na distribuição manual, que aceita).

### ❌ Resultado obtido

V1 só aparece na ida. O aluno B na volta vai para `excedentes_globais` (agendamento 75, turno volta). Com 3 ônibus e a massa do CT-001 a volta também usa um ônibus diferente do da ida, mesmo com V1 livre.

```json
{
  "alocacoes": [ { "onibus_id": "ABC1D23", "turno": "ida", "alunos": 3 } ],
  "excedentes_globais": [ { "agendamento_id": 75, "turno": "volta" } ]
}
```

### ⚠️ Impacto

- Com frota reduzida, toda a volta fica sem ônibus na sugestão automática, embora o mesmo ônibus pudesse fazê-la.
- A confirmação automática grava a ida e deixa a volta sem alocação.

### Causa aparente

O conjunto `usados` é único para ida e volta (`distribuicao.py`).

### Critérios de aceite

- O ônibus e o motorista usados na ida voltam a ser candidatos na volta.
- Reexecutar `CT-HU016-API-009`.

### 📎 Evidência

Reproduzido pela LLM em 17/11/2026, ambiente `atu-api016` (`develop` `7372b8d6`), com conferência no banco. [Resumo JSON](../EVIDENCIAS-HU-016.json). Sem tokens nem senhas.
