# Como executar os testes manuais de API — HU-017

Execução pela **LLM**, com revisão de **Cauan Ricardo**. [Suíte de API: 10 casos](API-HU-017.md). A [UI tem 9 casos](../ui/UI-HU-017.md) para execução manual por Cauan. Execução iniciada em 17/11/2026 na branch `test/execucao-api-hu-017`, criada da develop atualizada `a2bd96f7`. [Resultados e issues](API-HU-017.md).

## Base e fontes

Planejamento na branch `test/planejamento-api-ui-hu-017`, com entrega para `develop`. Código analisado: `develop` `1eb2818d` e o front do [PR #457](https://github.com/GOUOCE/GOUCE-app/pull/457), branch `feature/front-hu16e17`, commit `80830b4d`. Ler os [requisitos, seção 7.6](../../../../../docs/requisitos.md), o [BDD do épico 05](../../../../../bdd/features/epico-05/README.md) e as [decisões do PO na #465](https://github.com/GOUOCE/GOUCE-app/issues/465).

## 1. Preparar a execução

1. Quando a execução for solicitada, criar a branch própria de testes e registrar o commit exato do build.
2. Usar API e PostgreSQL reais em stack isolada com as migrations da `develop` (head `82_create_alocacao_diaria`, incluindo `82_updated_at_faculdade_ponto`), com acesso de leitura a `alocacao_diaria` e `log_auditoria`.
3. Confirmar no OpenAPI `POST /alocacao-diaria/distribuicao`, `GET /motoristas` e `PATCH /motoristas/{id}/inativar`, por HTTP.
4. Obter os tokens em `POST /auth/login` e manter fora do Git.

## 2. Preparar a massa

Cadastrar IES, rotas P1/P2, ônibus V1 a V4 e motoristas M1 a M4 como na HU-016. Criar reservas em D+1 pela HU-013 e montar, por caso, o payload manual completo do dia. Devolver a frota e os motoristas ao estado base ao fim de cada caso e anotar a contagem de `log_auditoria` antes do CT-007.

## 3. Executar e conferir

- Comparar cada resposta com `alocacao_diaria` em nova conexão (motorista, ônibus, rota, data, turno) e com a distribuição anterior nas recusas.
- Conferir a mensagem de cada recusa: o texto do requisito prevalece e a divergência com o código é registrada.
- Para a auditoria, comparar `log_auditoria` antes e depois, sem exigir formato de campo não definido.
- Para a concorrência, usar duas conexões simultâneas e registrar o resultado de cada uma; não aprovar sem verificar o banco.

## 4. Registrar e entregar

Preencher ambiente/commit, última execução, resultado obtido por variação, status, resumo, totais e defeitos. Usar ✅ passou, ❌ falhou, ⚠️ parcial, 🚫 bloqueado e ⏳ pendente; registrar a dependência específica quando impedir uma parte.

Nesta execução, registrar **somente JSON das falhas no corpo das issues do GitHub**, seguindo o [modelo de API](../../../modelos/ISSUE-BUG-API.md), conforme solicitado por Cauan. Sem arquivo JSON/pasta de evidências no repositório; vincular as issues à suíte e omitir credenciais, tokens e dados pessoais reais. Os esperados não devem ser ajustados para fazer um caso passar.

Commits seguem o [CONTRIBUTING](../../../../../docs/CONTRIBUTING.md), com autoria de Cauan e sem coautoria. Depois da revisão e integração do planejamento em `develop`, criar a branch própria de execução da HU; não registrar aprovação de caso por leitura do código.

## Riscos mapeados no código

Os riscos foram levantados no planejamento. A execução de 17/11/2026 confirmou quatro defeitos por HTTP/banco reais; as duas rodadas de concorrência não reproduziram 500 nem inconsistência. Riscos de UI permanecem sem execução nesta entrega. O API-006 ficou parcial porque o roteiro diverge do BDD quanto à presença do id na mensagem; não foi aberto bug de backend para esse texto.

| Risco | Evidência de leitura | Cobertura |
| --- | --- | --- |
| Mensagem do conflito de motorista diferente do requisito | `_validar_payload` levanta “alocação N: motorista X conflitante no turno ida.” (409); o requisito pede “Este motorista já está escalado para outra rota neste horário” | API-004; UI-004 |
| Mensagem de sucesso da escala diferente do requisito | `persist` responde “Distribuição realizada com sucesso”; “Escala de motoristas confirmada com sucesso” só aparece na tela do PR #457 | API-001; UI-003 |
| Sem auditoria da escala | o módulo `alocacao_diaria` não grava em `log_auditoria` | API-007 |
| Inativação de motorista com escala futura não é bloqueada | `MotoristaRepository.possui_alocacoes_futuras` devolve falso sem verificador injetado (TODO da HU-017) e nenhum verificador é injetado | API-008 |
| Lista de motoristas não filtra por turno | a tela chama `/motoristas` e lista todos os ativos; a API não tem consulta de disponibilidade por turno | API-002; UI-002 |
| Confirmações simultâneas dependem só das restrições únicas | `persist` captura `Exception` apenas para fazer rollback e repassar; uma violação de unicidade tende a virar 500 | API-009 |
| A confirmação regrava todas as rotas do dia | a tela avisa “As alocações de todas as rotas do dia também serão salvas” porque `_persistir` substitui a data inteira | UI-003 |
| A tela reexibe a escala a partir de memória do app | `cacheAlocacoesConfirmadas` no `logisticaService` | UI-003 |

## Dependências e critérios de bloqueio

- **UI:** exige o build do PR #457 (`80830b4d`); na `develop` a tela de escala não existe.
- **Massa:** a escala depende da distribuição do dia (HU-016), das reservas (HU-013) e dos cadastros de frota e motoristas.
- O CT-008 depende da implementação do verificador de escalas futuras; sem ele, a falha é esperada e deve ser registrada, não aprovada.
- Registrar cada parte verificada, falha ou impedimento; não aprovar caso inteiro quando houver impedimento.

## Resultado de 17/11/2026

**5 casos passaram, 4 falharam e 1 ficou parcial**, sem bloqueados ou pendentes na API. Código executado: develop `a2bd96f757f0bbccf1fd2ecec3260c557bda166a`; stack isolada `atu-qa-hu017`, porta 8117, banco PostgreSQL 15.17 inicialmente vazio e migrado até `82_create_alocacao_diaria`. Foram 126 chamadas HTTP, incluindo preparação e revisão pontual do API-006.

Defeitos com JSON da falha no próprio corpo, labels HU-017/API/Back e atribuição a ClidenorFilho: [#489](https://github.com/GOUOCE/GOUCE-app/issues/489) (mensagem de sucesso), [#490](https://github.com/GOUOCE/GOUCE-app/issues/490) (mensagem do conflito), [#491](https://github.com/GOUOCE/GOUCE-app/issues/491) (auditoria ausente) e [#492](https://github.com/GOUOCE/GOUCE-app/issues/492) (inativação com escala futura). Os títulos não usam prefixo de HU.

O API-006 preserva seu esperado original, mas a API cumpriu exatamente a mensagem do BDD: alocação 0: motorista inexistente ou inativo. O roteiro pede o id adicional no texto. A recusa 422, revalidação e rollback passaram; o caso ficou parcial até reconciliar esse oráculo, sem atribuir o erro do roteiro ao backend.

Concorrência: duas rodadas em 20/11 e 23/11/2026, com duas threads e conexões HTTP independentes e intervalos sobrepostos. As quatro confirmações retornaram 201; o estado final correspondeu integralmente a uma das requisições, sem duplicidade ou 500. Não houve lock artificial no banco nem alteração do servidor para produzir corrida; o resultado é limitado às rodadas executadas.

Toda a massa de negócio (cadastros, reservas, histórico de escala sem passageiros, redistribuições e inativação/reativação) foi preparada por HTTP. Somente contas/documentos e o representante de perfil exclusivo usaram fixtures ORM, com login real. M2 foi liberado de escalas futuras antes dos testes de inativação de preparo; estados e escalas foram restaurados após cada caso. Os scripts temporários ficaram fora do Git, e os 9 casos de UI não foram executados.
