# Como executar os testes manuais de API — HU-016

Execução pela **LLM**, com revisão de **Cauan Ricardo**. [Suíte de API: 11 casos](API-HU-016.md). A [UI tem 9 casos](../ui/UI-HU-016.md) para execução manual por Cauan. **Execução de 17/11/2026:** 6 passaram, 2 falharam e 3 parciais; defeitos em [`issues/`](issues/) e resumo em [EVIDENCIAS-HU-016.json](EVIDENCIAS-HU-016.json).

## Base e fontes

Planejamento na branch `test/planejamento-api-ui-hu-016`, com entrega para `develop`. Código analisado: `develop` `1eb2818d` (backend em `backend/src/modulos/alocacao_diaria/`) e o front do [PR #457](https://github.com/GOUOCE/GOUCE-app/pull/457), branch `feature/front-hu16e17`, commit `80830b4d`. Ler os [requisitos, seção 7.6](../../../../../docs/requisitos.md), o [BDD do épico 05](../../../../../bdd/features/epico-05/README.md) e as [decisões do PO na #465](https://github.com/GOUOCE/GOUCE-app/issues/465).

## 1. Preparar a execução

1. Quando a execução for solicitada, criar a branch própria de testes e registrar o commit exato do build.
2. Usar API e PostgreSQL reais em stack isolada com as migrations da `develop` (head `82_updated_at_faculdade_ponto`). Anotar URL, SHA, data/fuso e revisão aplicada.
3. Confirmar no OpenAPI as rotas `/alocacao-diaria/distribuicao-automatica` e `/alocacao-diaria/distribuicao`, por HTTP.
4. Obter os tokens em `POST /auth/login` e manter fora do Git.

## 2. Preparar a massa

Cadastrar pela API administrativa as IES, as rotas P1/P2 (e P3 no CT-005), os ônibus V1/V2/V3/V4 e os motoristas M1/M2/M3/M4 descritos na suíte. Criar as reservas por `POST /transporte/agendamentos` da HU-013, em dias úteis válidos, e registrar o mapa de ids, datas, donos e trechos. A distribuição automática usa todos os ônibus e motoristas ativos: ao fim de cada caso devolver a frota ao estado base. Sem presumir ids fixos.

## 3. Executar e conferir

- Comparar cada resposta com o banco em nova conexão: `alocacao_diaria` (rota, ônibus, motorista, data, turno) e `alocacao_aluno` (agendamento, turno, `tipo_lugar`, `status`).
- Provar a ausência de efeito na prévia contando as linhas antes e depois, e a atomicidade das recusas comparando a distribuição anterior.
- Conferir a mensagem de cada recusa com o texto do código; o texto dos requisitos prevalece quando divergir, e a divergência é registrada.
- Medição básica do tempo de resposta da prévia e da confirmação, sem substituir teste de carga.

## 4. Registrar e entregar

Preencher ambiente/commit, última execução, resultado obtido por variação, status, resumo, totais e defeitos. Usar ✅ passou, ❌ falhou, ⚠️ parcial, 🚫 bloqueado e ⏳ pendente; registrar a dependência específica quando impedir uma parte.

Guardar a evidência da execução em **um JSON simples**, quando houver resultados reais. Não criar pastas de executor/evidências nem incluir credenciais, tokens ou dados pessoais. Preparar relatos reproduzidos em `api/issues/` pelo [modelo de API](../../../modelos/ISSUE-BUG-API.md), vinculando a issue quando publicada. Os esperados não devem ser ajustados para fazer um caso passar.

Commits seguem o [CONTRIBUTING](../../../../../docs/CONTRIBUTING.md), com autoria de Cauan e sem coautoria. Depois da revisão e integração do planejamento em `develop`, criar a branch própria de execução da HU; não registrar aprovação de caso por leitura do código.

## Riscos mapeados no código

Os riscos abaixo vêm da leitura do código e orientam a execução. **Não são defeitos reproduzidos**: cada um só vira defeito depois de confirmado por HTTP ou na tela, com relato e issue.

| Risco | Evidência de leitura | Cobertura |
| --- | --- | --- |
| A prévia não usa outro ônibus com assento livre antes de deixar aluno em pé | `distribuicao.py` escolhe o ônibus de maior capacidade total e o enche com assentos e vagas em pé antes de passar ao seguinte; README do BDD lista a pendência | API-004; UI-003 |
| A confirmação com excedentes não informa a lista | `AlocacaoService.persist` devolve `mensagem`, `data`, `status_logistico` e `alocacoes`, sem `excedentes_globais` | API-007; UI-005 |
| Realocar excedente para ônibus de outra rota parece impossível pela API | `_validar_payload` exige `rota_id` igual à rota da reserva e a restrição única impede repetir o ônibus no turno; `foi_realocado` da HU-019 só ocorreria por dado direto no banco | API-008; UI-007 |
| Prévia automática não reaproveita o ônibus da ida na volta | `usados` é um conjunto único para ida e volta; com um só ônibus a volta fica toda como excedente | API-009 |
| Lista de alocações vazia no modo manual apaga a distribuição do dia | `_persistir` apaga todas as linhas da data e grava o que vier, mesmo vazio, e responde sucesso | API-010 |
| Demanda atribuída à primeira rota que atende a IES | `_route_for` varre as rotas ativas sem ordenar e compara só a IES; duas rotas com a mesma IES tornam a atribuição arbitrária e ignoram bairro/ponto | API-001, API-005 |
| Só entram na prévia tantos ônibus quantos motoristas ativos | `_buses` corta `buses[: len(drivers)]` sem ordenar; o conjunto escolhido pode variar | API-003, API-004 |
| A tela reexibe a distribuição confirmada a partir de memória do app | `logisticaService` guarda `cacheAlocacoesConfirmadas` em um `Map`; a prévia da API sempre recalcula a sugestão e não lê o que foi gravado | UI-004 |
| Excedentes aparecem como “Agendamento #id” | `obterExcedentes` monta `nome: Agendamento #id` e iniciais fixas “ID” | UI-005 |
| Cartão Rodízio de frota aponta para rota inexistente e a Distribuição aponta para rota só do PR #457 | `logistica.tsx` abre `/logistica/rodizio` e `/logistica/distribuicao`; só a segunda existe no PR #457 | UI-001 |

## Dependências e critérios de bloqueio

- **UI:** exige o build do PR #457 (`80830b4d`); na `develop` a tela de distribuição não existe. Se o PR mudar, registrar o novo SHA.
- **Massa:** HU-013 (reservas), HU-014 (cancelamento) e cadastros administrativos de rotas, frota e motoristas; HU-018 e HU-019 para conferir o efeito da distribuição.
- **HU-020:** adiada pelo PO (#465); não há caso de rodízio e o alerta do AC-15 não é exigido.
- Registrar cada parte verificada, falha ou impedimento; não aprovar caso inteiro quando houver impedimento.
