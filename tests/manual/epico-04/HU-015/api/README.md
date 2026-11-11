# Como executar os testes manuais de API — HU-015

Execução pela **LLM**, com revisão de **Cauan Ricardo**. [Suíte de API: 8 casos](API-HU-015.md). A [UI tem 10 casos](../ui/UI-HU-015.md) para execução manual por Cauan. Execução de API em **10/11/2026**: **5 passaram, 2 falharam e 1 bloqueado**. Foram 205 chamadas HTTP reais. [Evidência JSON](EVIDENCIAS-HU-015.json); [resultados e defeitos](API-HU-015.md#defeitos-encontrados). Os 10 casos de UI seguem pendentes.

## Base e fontes

O planejamento está na branch `test/planejamento-api-ui-hu-015-integrado`, com PR destinado à `develop`. O código de referência analisado é **`feature/front-hu015` `4ac87b4623b493af2d56012d60b8c3b875c3af7e`** ([PR #379](https://github.com/GOUOCE/GOUCE-app/pull/379)); backend e front desse build devem ser usados juntos na execução. A execução usa esse mesmo SHA em checkout separado; a branch `feature/testes-api-hu-015` parte da develop `e177426e49aa798103fe969fac85db4aa3749801`, após o merge do planejamento no PR #401. O PR de resultados é destinado à `develop`.

Ler os [requisitos, seção 7.5.3](../../../../../docs/requisitos.md), o [BDD HU-015](../../../../../bdd/features/epico-04/HU-015.feature) e as [decisões do PO na #389](https://github.com/GOUOCE/GOUCE-app/issues/389#issuecomment-6756236002). O BDD já existe no checkout; os casos têm rastreabilidade para seus cenários. Esta versão substitui o planejamento anterior baseado no front `b2111a9c` e na develop `99bbf2c6`.

## 1. Preparar a execução

1. Quando a execução for solicitada, criar uma branch própria de testes e registrar o commit exato do build, preservando alterações locais em worktree separada quando necessário.
2. Usar API e PostgreSQL reais em stack isolada; aplicar as migrations do commit alvo, incluindo `81_add_updated_at_rotas`. Anotar URL, revisão, data/fuso e SHAs.
3. Confirmar no OpenAPI `GET /transporte/agendamentos/detalhes?data=YYYY-MM-DD`, `GET /transporte/agendamentos/{id}` e `GET /transporte/agendamentos/meus`. O router já está registrado no código desta base; isso ainda precisa ser verificado por HTTP durante API-001.
4. Preparar A/B e os demais perfis descritos na suíte. Obter tokens em `POST /auth/login` e mantê-los fora do Git.

O resultado da HU-013 em `ee305857` é de outra branch/versão; não marcar este planejamento como bloqueado ou aprovado por aquele resultado.

## 2. Preparar a massa

Usar o mapa das pré-condições da suíte: P1/P2, C1/C2, AI/AV/AIV/AM1/AM2/AD, BI e AC. Preparar por API administrativa as rotas, bairros/pontos e IES reais. As principais devem atender às combinações de ponto/IES e às complementares de cada trecho.

Criar reservas por `POST /transporte/agendamentos` da HU-013; usar dias úteis válidos na janela e ids efetivamente retornados. Exemplo com ids ilustrativos, que devem ser substituídos pela massa real:

```json
{
  "data": "<data útil válida em YYYY-MM-DD>",
  "usa_ida": true,
  "usa_volta": true,
  "ponto_embarque_id": 123,
  "ies_destino_id": 456,
  "rota_complementar_ida_id": 789,
  "ies_origem_id": 654,
  "ponto_desembarque_id": 321,
  "rota_complementar_volta_id": 987
}
```

Horários são obtidos dos cadastros de rota; não enviar campos legados de horário no payload do agendamento. A LLM prepara e registra o mapa de ids/datas/donos/trechos, sem presumir ids fixos nem tratar dados de exemplo do app como massa de teste.

## 3. Executar e conferir

Executar API-001 a API-008 na ordem. Usar token do aluno em consultas e token de administrador somente na preparação/conferência dos cadastros. Comparar os três retornos reais (por data, id e lista) com os dados do banco, preservando a distinção de ida/volta e de rota direta.

- Confirmar o nome da linha, os dois horários e o ponto de conexão; a UI deve usar saída na ida e retorno na volta.
- Sem alocação, `onibus` e `motorista` nulos são o esperado; ocultação visual pertence à UI. Apenas API-008 depende do épico 5 para comprovar programação de veículo/motorista real.
- Em validação por data, conferir também a mensagem definida no BDD. Um 422 genérico pode aplicar a recusa e ainda divergir do texto esperado.
- No API-007, conferir os valores e `atualizado_em` após mudanças de referências; o cliente usa essa versão para decidir se regrava o cache. Não exigir header ETag não implementado.
- GET no servidor ou teste unitário com mock não comprova consulta offline no dispositivo. A LLM apoia os passos de UI com conferência da fonte de dados, sem substituir a observação de Cauan.

## 4. Registrar e entregar

Preencher ambiente/commit, última execução, resultado obtido por variação, status, resumo, totais e defeitos. Usar ✅ passou, ❌ falhou, ⚠️ parcial, 🚫 bloqueado e ⏳ pendente; registrar a dependência específica quando impedir uma parte.

Guardar a evidência da execução em **um JSON simples**, quando houver resultados reais. Não criar pastas de executor/evidências nem incluir credenciais. Preparar relatos reproduzidos em `api/issues/` pelo [modelo de API](../../../modelos/ISSUE-BUG-API.md), vinculando a issue quando publicada. Os esperados não devem ser ajustados para fazer um caso passar.

Commits seguem o [CONTRIBUTING](../../../../../docs/CONTRIBUTING.md), com autoria de Cauan e sem coautoria. A execução atual registra os resultados nesta suíte e em `EVIDENCIAS-HU-015.json`; os dois relatos em `issues/` estão publicados como [#403](https://github.com/GOUOCE/GOUCE-app/issues/403) e [#404](https://github.com/GOUOCE/GOUCE-app/issues/404). Não há pastas de executor/evidências. A stack temporária foi usada somente para QA e seus dados são sintéticos.

## Execução de 10/11/2026

API em `http://127.0.0.1:8015`, projeto Docker `atu-qa-hu015`, `America/Fortaleza`; PostgreSQL real iniciado vazio e migrado até `81_add_updated_at_rotas`. Backend `main:app` do commit alvo montado sem mudanças, sem mocks ou substituição de dependências. Contas sintéticas preparadas por fixture ORM e autenticadas por HTTP; bairros/pontos, IES, principais/complementares, reservas e cancelamento preparados por operações reais da API.

O API-004 falhou pela mensagem de data malformada; o API-007 falhou por não renovar a versão ao mudar faculdades da principal, nome de ponto e nome de IES. O API-008 ficou bloqueado pela alocação diária ainda ausente. As verificações de nulos sem alocação passaram em API-003. Não se concluiu sobre cache/offline no dispositivo: essa parte é de UI.
