# HU-015: dados da viagem mudam sem renovar a versão usada no cache

| Campo | Valor |
| --- | --- |
| Tipo | Bug funcional de versionamento das informações da viagem |
| Severidade | 🟡 Média — risco de persistência de informações antigas no cache |
| Ambiente | `feature/front-hu015` `4ac87b4623b493af2d56012d60b8c3b875c3af7e`; HTTP real `http://127.0.0.1:8015`; Docker `atu-qa-hu015`; Alembic `81_add_updated_at_rotas` |
| Branch do relato | `feature/testes-api-hu-015`, criada da develop `e177426e` |
| Caso relacionado | CT-HU015-API-007; complemento UI-007 ainda não executado |
| Documentação | [Suíte de API](../API-HU-015.md#ct-hu015-api-007--versão-da-informação-e-atualização-das-referências); AC-04/FA-002/RNF-015 |
| Issue publicada | [#404](https://github.com/GOUOCE/GOUCE-app/issues/404) |
| Evidência | [JSON da execução](../EVIDENCIAS-HU-015.json), `defeitos[1].reproducoes` |

### Pré-condição

Backend do commit indicado, banco real migrado, administrador e aluno A aprovados/autenticados por login real. Cadastros e reservas preparados pelas APIs: P1 id 1, C1 id 1, IES UFC id 1, IES extra id 3, bairro Centro id 2 e ponto id 1. AI id 1 é só ida em 11/11/2026; AIV id 3 tem ida/volta em 13/11/2026. Usar datas úteis atuais e os ids efetivamente retornados ao reproduzir em outro banco; os números abaixo descrevem esta massa.

### Passos para reproduzir

1. Como A, consultar AI por `GET /transporte/agendamentos/detalhes?data=2026-11-11`, por `GET /transporte/agendamentos/1` e na lista `GET /transporte/agendamentos/meus`. Anotar `atualizado_em` e os dados atuais.
2. Como administrador, enviar **somente** `PATCH /rotas-principais/1` com `{"faculdades_ida_ids":[1,3]}`; não alterar nome/horário junto.
3. Repetir os três GETs como A e comparar a lista de faculdades e a versão. Restaurar com `{"faculdades_ida_ids":[1]}`.
4. Isoladamente, enviar `PATCH /bairros/2` com `{"pontos_de_parada":["PONTO 1 HU015"]}`. A mudança de capitalização mantém o mesmo ponto id 1. Repetir as leituras, comparar `ponto_embarque_nome` e versão e restaurar `"Ponto 1 HU015"`.
5. Isoladamente, enviar `PATCH /faculdades/1` com `{"nome":"UFC Atualizada QA HU015"}`. Repetir as leituras, comparar `ies_destino_nome`, nome no resumo da principal e versão e restaurar `"UFC QA HU015"`.
6. Repetir a conferência em AIV id 3, data 13/11/2026, que compartilha essas referências na ida.

### ✅ Resultado esperado

Cada alteração administrativa que modifica informações devolvidas no detalhe renova `atualizado_em`, mantendo a versão estável sem mudanças e sem regressão. Data, id e lista concordam; reservas não são modificadas por GET. A versão deve permitir ao cliente persistir o conteúdo atual, conforme o contrato de revalidação usado no app e o caso de atualização ao reconectar.

### ❌ Resultado obtido

Todos os PATCHs e GETs retornaram **200**. Os novos valores aparecem corretamente nos três GETs, mas `atualizado_em` permanece **`2026-11-10T03:51:51.633825Z`**, tanto em AI quanto em AIV:

| Variação isolada | Antes | Depois | Versão mudou? |
| --- | --- | --- | --- |
| Faculdades da principal | Apenas UFC id 1 | IES extra id 3 e UFC id 1 | Não |
| Nome do mesmo ponto | `Ponto 1 HU015` | `PONTO 1 HU015` | Não |
| Nome da IES | `UFC QA HU015` | `UFC Atualizada QA HU015` | Não |

Exemplo do trecho referente à IES, extraído das respostas:

```json
{
  "antes": {
    "id": 1,
    "ies_destino_nome": "UFC QA HU015",
    "atualizado_em": "2026-11-10T03:51:51.633825Z"
  },
  "depois": {
    "id": 1,
    "ies_destino_nome": "UFC Atualizada QA HU015",
    "atualizado_em": "2026-11-10T03:51:51.633825Z"
  }
}
```

Foram seis divergências de versão: três alterações em duas reservas. Como controles positivos, mudanças isoladas de horário/conexão da complementar e nome da principal renovaram a versão. Todas as mudanças e restaurações ocorreram pela API administrativa; não houve edição direta no banco. As leituras preservaram reservas e auditoria; as escritas administrativas geraram apenas seus efeitos esperados.

### ⚠️ Impacto

A API confirma que o conteúdo pode mudar sem renovar a versão. No mesmo commit, `frontend/src/services/agendamentoService.ts` só regrava o detalhe em AsyncStorage quando `atualizado_em` difere. Assim, há risco de conservar informações antigas para uma próxima consulta offline, mesmo após receber dados atualizados online. **O comportamento no dispositivo ainda depende da execução de UI-007**; esta rodada comprova a inconsistência da versão na API e a condição no código do cliente.

### Causa aparente

`GerenciarAgendamentosUseCase._version` considera apenas `updated_at` da reserva e das rotas principal/complementar, sem os cadastros independentes de ponto/IES. No repositório de rota principal, a troca isolada de `faculdades_ida` altera o relacionamento sem atualizar uma coluna da própria rota, e seu `updated_at` também não se renova. Esses caminhos explicam as três reproduções, sem exigir header ETag no contrato.

### Critérios de aceite

- `atualizado_em` permite detectar alterações de todos os dados visíveis: rota, conexão, horários, ponto, IES e faculdades atendidas.
- Mudanças isoladas de relacionamentos renovam a versão; leituras sem alteração mantêm corpo/versão estáveis.
- Data/id/lista continuam consistentes, sem regressão de versão e sem escritas causadas por GET.
- Reexecutar CT-HU015-API-007; executar UI-007 no dispositivo para confirmar a persistência do conteúdo atualizado e a consulta offline.

### 📎 Evidência

Reproduzido pela LLM em **10/11/2026, 00:51:47–00:51:53, America/Fortaleza**, com HTTP e PostgreSQL reais. Massa restaurada após cada variação; código do produto preservado. Publicado como [#404](https://github.com/GOUOCE/GOUCE-app/issues/404), após autorização de Cauan, em 10/11/2026.
