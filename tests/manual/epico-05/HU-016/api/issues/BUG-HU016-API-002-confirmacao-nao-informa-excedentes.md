# A confirmação da distribuição não informa os alunos excedentes

| Campo | Valor |
| --- | --- |
| **Tipo** | Bug funcional / divergência de requisito (AC-13, decisão do PO na #465) |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `test/execucao-api-hu-016` — Docker isolado `atu-api016`, `http://localhost:8116`, `develop` `7372b8d6` |
| **Caso relacionado** | `CT-HU016-API-007` |
| **Documentação** | [HU-016 — Testes manuais de API](../API-HU-016.md#ct-hu016-api-007--confirmar-com-excedentes-informa-a-lista) |

---

### Pré-condição

Administrador autenticado; V1 e M1 ativos (os demais inativos); 6 reservas ativas de P1 na ida (ids 59 a 64); V1 comporta 5.

### Passos para reproduzir

1. `POST /alocacao-diaria/distribuicao` com `{"data": "2026-11-24", "modo": "automatico"}`.
2. Ler o corpo da resposta.
3. Conferir `alocacao_aluno` e `GET /alocacao-diaria/minha-viagem` do aluno excedente.

### ✅ Resultado esperado

201 com os 5 alunos gravados e a resposta informando o excedente (aluno/agendamento 64 e turno), para a tela exibir o aviso com a lista.

### ❌ Resultado obtido

201 e 5 alunos gravados, mas a resposta tem só `mensagem`, `data`, `status_logistico` e `alocacoes` (cada uma com `excedentes: []`). O aluno 64 fica sem linha em `alocacao_aluno` e `minha-viagem` mostra `AGUARDANDO_ALOCACAO`.

```json
{
  "mensagem": "Distribuição realizada com sucesso",
  "data": "2026-11-24",
  "status_logistico": "DISTRIBUIDO",
  "alocacoes": [ { "onibus_id": "ABC1D23", "excedentes": [] } ]
}
```

### ⚠️ Impacto

- A tela de confirmação não consegue avisar quem ficou sem lugar, a não ser que refaça a prévia.
- O administrador pode concluir a distribuição sem perceber que há excedentes.

### Causa aparente

`AlocacaoService.persist` devolve a lista de alocações, sem `excedentes_globais`.

### Critérios de aceite

- A resposta da confirmação inclui os excedentes (`agendamento_id` e `turno`) quando houver.
- Reexecutar `CT-HU016-API-007`.

### 📎 Evidência

Reproduzido pela LLM em 17/11/2026, ambiente `atu-api016` (`develop` `7372b8d6`), com conferência no banco. [Resumo JSON](../EVIDENCIAS-HU-016.json). Sem tokens nem senhas.
