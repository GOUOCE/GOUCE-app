# HU-015: consulta com data malformada retorna mensagem técnica em inglês

| Campo | Valor |
| --- | --- |
| Tipo | Divergência de validação em relação ao BDD |
| Severidade | 🟢 Baixa — formato recusado corretamente, mensagem incorreta |
| Ambiente | `feature/front-hu015` `4ac87b4623b493af2d56012d60b8c3b875c3af7e`; API HTTP real `http://127.0.0.1:8015`; Docker `atu-qa-hu015`; Alembic `81_add_updated_at_rotas` |
| Branch do relato | `feature/testes-api-hu-015`, criada da develop `e177426e` |
| Caso relacionado | CT-HU015-API-004 |
| Documentação | [Suíte de API](../API-HU-015.md#ct-hu015-api-004--consulta-ausente-cancelada-ou-com-parâmetro-inválido); [BDD HU-015](../../../../../../bdd/features/epico-04/HU-015.feature) |
| Evidência | [JSON da execução](../EVIDENCIAS-HU-015.json), `defeitos[0]` |

### Pré-condição

Backend exato indicado acima, banco real migrado e aluno ativo, aprovado e com vínculo válido. Autenticação real por `POST /auth/login` (200), sem registrar credenciais. O endpoint está publicado no OpenAPI; consulta válida de AIV em 13/11/2026 retorna 200. Não é necessário cadastrar uma reserva na data inválida.

### Passos para reproduzir

1. Autenticar o aluno aprovado no backend do commit indicado.
2. Usando o token do aluno, enviar `GET /transporte/agendamentos/detalhes?data=10-11-2026`.
3. Conferir o status e a mensagem do corpo. Como controle, enviar a data civil impossível `2026-02-30`.

### ✅ Resultado esperado

HTTP **422**, informando **“Data deve estar no formato YYYY-MM-DD.”**, conforme o cenário “API recusa a consulta do detalhe por data com formato inválido” do BDD. A consulta não altera reservas ou auditoria.

### ❌ Resultado obtido

HTTP **422**, com o corpo real:

```json
{
  "detail": [
    {
      "type": "string_pattern_mismatch",
      "loc": ["query", "data"],
      "msg": "String should match pattern '^\\d{4}-\\d{2}-\\d{2}$'",
      "input": "10-11-2026",
      "ctx": {"pattern": "^\\d{4}-\\d{2}-\\d{2}$"}
    }
  ]
}
```

O controle `data=2026-02-30` retorna 422 `VALIDATION_ERROR` com a mensagem esperada em português. AC cancelada, data sem reserva e id inexistente retornaram 404 com as mensagens corretas; não foram agrupados como falhas. Snapshots de reservas e auditoria permaneceram iguais nas oito variações.

### ⚠️ Impacto

O consumidor recebe texto técnico em inglês em uma recusa prevista no BDD. A validação impede a consulta inválida; não houve aceitação indevida, erro 500 ou perda de dados.

### Causa aparente

No alvo, `backend/src/modulos/agendamentos/interface/http/agendamento_routes.py` declara regex na query `data`. A validação do FastAPI ocorre antes de `detail_by_date`, que contém a mensagem de domínio em português. O corpo observado confirma essa diferença de tratamento. Nenhuma correção foi aplicada nesta execução.

### Critérios de aceite

- Data malformada continua retornando 422 com a mensagem definida no BDD.
- Data impossível, parâmetro ausente e consultas válidas mantêm seus comportamentos previstos, sem 500 ou escrita em reservas.
- Reexecutar CT-HU015-API-004 após a correção, preservando a mensagem esperada.

### 📎 Evidência

Reproduzido pela LLM em **10/11/2026, 00:51:47–00:51:53, America/Fortaleza**. Relato local para revisão de Cauan; nenhuma issue publicada no GitHub nesta execução. A evidência está no único JSON da suíte, sem tokens ou senhas.
