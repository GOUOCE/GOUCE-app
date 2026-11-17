# Como executar os testes manuais de API — HU-018

Execução pela **LLM**, com revisão de **Cauan Ricardo**. [Suíte de API: 9 casos](API-HU-018.md). A [UI tem 10 casos](../ui/UI-HU-018.md) para execução manual por Cauan. Execução de API iniciada em 17/11/2026 na branch `test/execucao-api-hu-018`, criada da develop atualizada `7372b8d6`. [Resultados e issues](API-HU-018.md).

## Base e fontes

Planejamento na branch `test/planejamento-api-ui-hu-018`, com entrega para `develop`. Código analisado: `develop` `1eb2818d`, `lista_embarque_service.py`, `ListaEmbarqueConteudo` e `listaEmbarqueService`. Ler os [requisitos, seção 7.6](../../../../../docs/requisitos.md), o [BDD do épico 05](../../../../../bdd/features/epico-05/README.md) e as [decisões do PO na #465](https://github.com/GOUOCE/GOUCE-app/issues/465).

## 1. Preparar a execução

1. Quando a execução for solicitada, criar a branch própria de testes e registrar o commit exato do build.
2. Usar API e PostgreSQL reais em stack isolada com as migrations do commit executado (head `82_create_alocacao_diaria`, que inclui `82_updated_at_faculdade_ponto`).
3. Confirmar no OpenAPI `GET /alocacao-diaria/rotas-do-dia` e `GET /alocacao-diaria/lista-embarque`, por HTTP.
4. Obter os tokens do administrador, de R1, de R2 e de um aluno em `POST /auth/login` e manter fora do Git.

## 2. Preparar a massa

Cadastrar IES, rotas, frota e motoristas como na HU-016; cadastrar R1 e R2 pela promoção de alunos a representante (HU-030) com IES responsável. Criar reservas pela HU-013 com as quatro combinações de turno e IES de ida/volta, confirmar a distribuição (HU-016) e registrar o mapa de ids, nomes, IES e ônibus.

## 3. Executar e conferir

- Comparar a lista com `alocacao_aluno`, `alocacao_diaria` e `agendamento` em nova conexão; só vínculo ALOCADO com reserva ATIVA entra.
- Conferir a privacidade: a resposta do representante não traz nome, ponto ou IES de outra faculdade.
- Conferir os códigos e mensagens de recusa: 422 `ROTA_ID_OBRIGATORIO`, 404 “Rota não encontrada.”, 422 `MULTIPLAS_ROTAS`, 404 `SEM_ROTA_NO_DIA` e 403 sem vínculo.
- A atualização automática da tela é observada na UI; a API comprova apenas o novo estado e o `ultima_sincronizacao`.

## 4. Registrar e entregar

Preencher ambiente/commit, última execução, resultado obtido por variação, status, resumo, totais e defeitos. Usar ✅ passou, ❌ falhou, ⚠️ parcial, 🚫 bloqueado e ⏳ pendente; registrar a dependência específica quando impedir uma parte.

Nesta execução, por solicitação de Cauan, registrar **somente o JSON das falhas, diretamente no corpo das issues do GitHub**, seguindo o [modelo de API](../../../modelos/ISSUE-BUG-API.md). Não criar pasta de evidências, arquivo JSON de evidência no repositório nem coleção de respostas aprovadas. Vincular as issues na suíte; omitir credenciais, tokens e dados pessoais reais. Os esperados não devem ser ajustados para fazer um caso passar.

Commits seguem o [CONTRIBUTING](../../../../../docs/CONTRIBUTING.md), com autoria de Cauan e sem coautoria. Depois da revisão e integração do planejamento em `develop`, criar a branch própria de execução da HU; não registrar aprovação de caso por leitura do código.

## Riscos mapeados no código

Os riscos abaixo foram levantados no planejamento. A execução de 17/11/2026 confirmou por HTTP o erro 500 de data civil impossível, a exposição de dados do outro trecho por IES/turno e as demais falhas registradas na [suíte](API-HU-018.md#defeitos-encontrados). Os riscos de UI permanecem sem execução nesta rodada.

| Risco | Evidência de leitura | Cobertura |
| --- | --- | --- |
| Data inexistente (`2026-02-30`) tende a virar erro 500 | `rotas_do_dia` e `lista_embarque` validam só o formato por regex e chamam `date.fromisoformat` sem tratar `ValueError` | API-001, API-005 |
| Representante com `rota_id` de rota sem alunos da sua IES recebe lista vazia, não recusa | a rota informada não é validada contra a IES responsável; o filtro só esvazia a lista | API-006 |
| Contador de lugares dos veículos não é filtrado pela IES do representante | `veiculos_escalados` soma sentados e em pé de toda a alocação, enquanto `alunos` é filtrado pela IES | API-006; UI-007 |
| Indicador de sincronização fixo no servidor | `indicador_sincronizacao` é sempre “Atualizado agora”; “Atualizado há X min” depende do cálculo no cliente | API-008; UI-008 |
| Aluno só aparece se a distribuição foi confirmada | a lista depende de `alocacao_diaria`/`alocacao_aluno`; sem distribuição a rota mostra “não possui nenhum aluno alocado” | API-004; UI-004 |
| Atualização por consulta periódica, não por evento | `inscreverAtualizacaoRota` refaz a consulta a cada `INTERVALO_POLLING_LISTA_MS`; uma mudança logo após uma atualização só aparece no próximo ciclo | UI-008 |
| Atalho a partir da rota no painel pode não existir | `logistica.tsx` abre a lista sem `rota_id`; o acesso direto depende de tela do PR #457 | UI-006 |
| Falha de carregamento limpa a lista; falha em segundo plano passa sem aviso | o `catch` da consulta principal faz `setLista(null)` e mostra o erro; a atualização periódica ignora erros e mantém a lista antiga sem indicar que está desatualizada | UI-009 |

## Dependências e critérios de bloqueio

- **Distribuição (HU-016):** toda lista depende de alocação confirmada; sem ela, usar apenas os casos de rota sem alunos e registrar a dependência.
- **CT-006 de UI:** depende de existir atalho para a lista a partir da rota (PR #457).
- **Representantes:** R1 e R2 dependem da promoção de aluno a representante da HU-030 com IES responsável.
- Registrar cada parte verificada, falha ou impedimento; não aprovar caso inteiro quando houver impedimento.

## Resultado de 17/11/2026

**5 casos passaram, 4 falharam, nenhum bloqueado ou pendente na API.** Backend da develop `7372b8d67165344545c1264ac936cd4c060ca245`, API real na porta 8118 e PostgreSQL 15.17 inicialmente vazio, migrado até `82_create_alocacao_diaria`. Foram 131 chamadas HTTP; GETs e recusas preservaram reservas, alocações e auditoria. A sincronização foi comparada após 125,033 segundos reais.

Defeitos com JSON de falha no próprio corpo: [#480](https://github.com/GOUOCE/GOUCE-app/issues/480) (data impossível), [#481](https://github.com/GOUOCE/GOUCE-app/issues/481) (privacidade do representante), [#482](https://github.com/GOUOCE/GOUCE-app/issues/482) (filtro por turno), [#483](https://github.com/GOUOCE/GOUCE-app/issues/483) (ordenação) e [#484](https://github.com/GOUOCE/GOUCE-app/issues/484) (mensagem para representante sem IES).

As contas e os documentos são fixtures sintéticas com login real. Promoção/revogação, cadastros de negócio, reservas, distribuição, cancelamento e realocação foram exercitados pela API. Somente o estado legado de representante sem IES foi preparado por fixture SQL, pois o DTO de promoção atual não permite omitir a faculdade; o estado foi restaurado. Os scripts temporários ficaram fora do Git; nenhum código de produto ou teste de UI foi alterado.
