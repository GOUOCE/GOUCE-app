# Como executar os testes manuais de API — HU-019

Execução pela **LLM**, com revisão de **Cauan Ricardo**. [Suíte de API: 9 casos](API-HU-019.md). A [UI tem 9 casos](../ui/UI-HU-019.md) para execução manual por Cauan. Execução iniciada em 17/11/2026 na branch `test/execucao-api-hu-019`, criada da develop atualizada `7372b8d6`. [Resultados e issues](API-HU-019.md).

## Base e fontes

Planejamento na branch `test/planejamento-api-ui-hu-019`, com entrega para `develop`. Código analisado: `develop` `1eb2818d`, `minha_viagem_service.py` e, no front, `agendamentoService.ts`, `home.tsx`, `agenda.tsx` e `agendamento-detalhes.tsx`. Ler os [requisitos, seção 7.6](../../../../../docs/requisitos.md), o [BDD do épico 05](../../../../../bdd/features/epico-05/README.md) e as [decisões do PO na #465](https://github.com/GOUOCE/GOUCE-app/issues/465).

## 1. Preparar a execução

1. Quando a execução for solicitada, criar a branch própria de testes e registrar o commit exato do build.
2. Usar API e PostgreSQL reais em stack isolada com as migrations da `develop` (head `82_create_alocacao_diaria`, incluindo `82_updated_at_faculdade_ponto`).
3. Confirmar no OpenAPI `GET /alocacao-diaria/minha-viagem`, por HTTP.
4. Obter os tokens de A, B, administrador e representante em `POST /auth/login` e manter fora do Git.

## 2. Preparar a massa

Cadastrar IES, rotas, frota e motoristas como na HU-016 e criar as reservas de A e B pela HU-013. Confirmar as distribuições pela HU-016 para as datas que pedem alocação, deixar uma data sem distribuição e montar o excedente. Se a realocação não puder ser criada pela API, documentar a fixture usada no banco isolado.

## 3. Executar e conferir

- Comparar cada resposta com `alocacao_diaria`, `alocacao_aluno`, `onibus`, `motorista` e `rota_principal` em nova conexão.
- Conferir a mensagem de espera e o texto do aviso de realocação com o requisito; divergência é registrada.
- Conferir que o aluno só vê o próprio agendamento e que a consulta não altera dados.
- Medição básica do tempo (RNF-001) e, na UI, contagem de chamadas feitas pela Agenda.

## 4. Registrar e entregar

Preencher ambiente/commit, última execução, resultado obtido por variação, status, resumo, totais e defeitos. Usar ✅ passou, ❌ falhou, ⚠️ parcial, 🚫 bloqueado e ⏳ pendente; registrar a dependência específica quando impedir uma parte.

Nesta execução, registrar **somente o JSON das falhas no corpo das issues do GitHub**, pelo [modelo de API](../../../modelos/ISSUE-BUG-API.md), conforme solicitado por Cauan. Sem arquivo JSON de evidência, pasta de evidências ou coleção de respostas aprovadas no repositório. Vincular as issues na suíte; omitir credenciais, tokens e dados pessoais reais. Os esperados não devem ser ajustados para fazer um caso passar.

Commits seguem o [CONTRIBUTING](../../../../../docs/CONTRIBUTING.md), com autoria de Cauan e sem coautoria. Depois da revisão e integração do planejamento em `develop`, criar a branch própria de execução da HU; não registrar aprovação de caso por leitura do código.

## Riscos mapeados no código

Os riscos foram levantados no planejamento. A execução de API de 17/11/2026 confirmou as mensagens técnicas de data (#486) e a diferença de acesso regular (#487, regra inferida a confirmar com o PO). A realocação entre rotas continua dependente da HU-016 (#478). Os riscos de UI não foram executados nesta rodada.

| Risco | Evidência de leitura | Cobertura |
| --- | --- | --- |
| Realocação (FA-002) pode não ser alcançável pela distribuição regular | `_validar_payload` recusa aluno em alocação de rota diferente da reserva; `foi_realocado` compara a rota da alocação com a original | API-005; UI-006 |
| Uma chamada de alocação por reserva ao abrir Agenda e Início | `listarAgendamentosAtivos` faz `obterMinhaViagem` para cada item de `/meus` (até 22) a cada atualização | UI-009 |
| Falha na consulta de alocação vira “Aguardando alocação do veículo” | `obterMinhaViagem` devolve `null` em qualquer erro e `resolverAlocacaoRota` trata sem ônibus como AGUARDANDO_ALOCACAO | UI-008 |
| Cache local pode manter alocação antiga | `listarAgendamentosAtivos` e o detalhe guardam o resultado já enriquecido em cache | UI-007, UI-008 |
| Aviso de realocação depende de campos do front | o texto é montado em `formatarAvisoRealocacao` e o status REALOCADO usa o rótulo “Alocação confirmada” | UI-006 |
| Aluno sem acesso regular não é recusado na consulta | `minha-viagem` usa só `require_roles(aluno)`; as demais rotas do aluno usam `verify_student_standard_access` (403 para pendente, reprovado e vínculo vencido) | API-008 |
| Data inválida usa mensagem técnica do framework | `data` é validada como `date` pelo FastAPI, como no achado #403 da HU-015 | API-007 |

## Dependências e critérios de bloqueio

- **Distribuição (HU-016):** a alocação do aluno só existe depois de uma distribuição confirmada; sem ela, só os casos de espera e de ausência de agendamento são executáveis.
- **Realocação:** depende de a distribuição permitir ônibus de outra rota ou de fixture documentada; não aprovar o fluxo por fixture.
- **Perfis:** administrador e representante apenas para os casos de acesso negado.
- Registrar cada parte verificada, falha ou impedimento; não aprovar caso inteiro quando houver impedimento.

## Resultado de 17/11/2026

**6 casos passaram, 2 falharam e 1 ficou parcial**, sem bloqueados ou pendentes na API. Branch `test/execucao-api-hu-019` criada da develop atualizada `7372b8d67165344545c1264ac936cd4c060ca245`; API real na porta 8119 e PostgreSQL 15.17 inicialmente vazio, migrado até `82_create_alocacao_diaria`. Foram 128 chamadas HTTP e 371 verificações, 365 satisfeitas. GETs não alteraram reservas, alocações ou auditoria.

Issues [#486](https://github.com/GOUOCE/GOUCE-app/issues/486) e [#487](https://github.com/GOUOCE/GOUCE-app/issues/487), ambas atribuídas a ClidenorFilho, com label HU-019 e sem o prefixo no título. O JSON das falhas está no corpo de cada issue. A política de acesso regular da #487 depende de confirmação do PO, conforme o esperado inferido do planejamento; a leitura indevida de dados de outro aluno não foi reproduzida.

A leitura do aviso de realocação foi confirmada por fixture SQL isolada e restaurada. O fluxo completo não foi aprovado, pois a HU-016 recusa a troca de rota (#478); SQL e parâmetros estão no API-005 da suíte. Estados pendente/rejeitado/vencido foram preparados como fixtures após criação real de reservas/alocações e restaurados após comparação com a recusa 403 de `/meus`. Administrador e representante de perfil exclusivo foram recusados com 403.

Desempenho: 10 consultas com alocação e 10 sem distribuição, todas em menos de 41 ms. As medianas/máximos e cada amostra estão no API-009; a medição é local e não substitui carga ou teste de UI. Os scripts temporários ficaram fora do Git.
