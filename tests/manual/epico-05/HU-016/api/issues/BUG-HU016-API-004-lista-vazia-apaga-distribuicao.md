# Distribuição manual com lista de alocações vazia apaga a distribuição do dia

| Campo | Valor |
| --- | --- |
| **Tipo** | Bug de integridade (RNF-012); esperado inferido, confirmar com o PO |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `test/execucao-api-hu-016` — Docker isolado `atu-api016`, `http://localhost:8116`, `develop` `7372b8d6` |
| **Issue relacionada** | [#477](https://github.com/GOUOCE/GOUCE-app/issues/477) |
| **Caso relacionado** | `CT-HU016-API-010` |
| **Documentação** | [HU-016 — Testes manuais de API](../API-HU-016.md#ct-hu016-api-010--recursos-e-alunos-inválidos-e-atomicidade) |

---

**Decisão do PO:** pendente na [#473](https://github.com/GOUOCE/GOUCE-app/issues/473); seguimos a recomendação (esperado deste relato) como regra provisória.

### Pré-condição

Administrador autenticado; distribuição manual confirmada em 26/11 (2 alunos em V3 e 1 em V2).

### Passos para reproduzir

1. `POST /alocacao-diaria/distribuicao` com `{"data": "2026-11-26", "modo": "manual", "alocacoes": []}`.
2. Repetir sem o campo `alocacoes`.
3. Contar as linhas de `alocacao_diaria` e `alocacao_aluno` da data.

### ✅ Resultado esperado

Recusa (422) ou, no mínimo, aviso e confirmação explícita; a distribuição do dia não é apagada por uma lista vazia enviada por engano (RNF-012).

### ❌ Resultado obtido

201 “Distribuição realizada com sucesso” e `alocacoes: []`; as alocações da data ficam com 0 linhas (inclusive sem o campo `alocacoes`).

```json
{
  "mensagem": "Distribuição realizada com sucesso",
  "data": "2026-11-26",
  "status_logistico": "DISTRIBUIDO",
  "alocacoes": []
}
```

### ⚠️ Impacto

- Um envio vazio (erro de cliente ou da tela) desfaz a escala do dia e os alunos voltam a aguardar alocação, sem registro.
- O esperado foi inferido do requisito de consistência; a regra de limpar o dia pode ser intencional e precisa da confirmação do PO.

### Causa aparente

`_persistir` apaga todas as linhas da data e grava o que vier, mesmo vazio.

### Critérios de aceite

- Decisão do PO registrada; se for recusar, 422 com mensagem e distribuição intacta.
- Reexecutar `CT-HU016-API-010`.

### 📎 Evidência

Reproduzido pela LLM em 17/11/2026, ambiente `atu-api016` (`develop` `7372b8d6`), com conferência no banco. [Resumo JSON](../EVIDENCIAS-HU-016.json). Sem tokens nem senhas.
