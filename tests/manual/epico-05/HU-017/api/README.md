# Como executar os testes manuais de API — HU-017

Execução pela **LLM**, com revisão de **Cauan Ricardo**. [Suíte de API: 10 casos](API-HU-017.md). A [UI tem 9 casos](../ui/UI-HU-017.md) para execução manual por Cauan. Nenhum caso foi executado nesta entrega.

## Base e fontes

Planejamento na branch `test/planejamento-api-ui-hu-017`, com entrega para `develop`. Código analisado: `develop` `1eb2818d` e o front do [PR #457](https://github.com/GOUOCE/GOUCE-app/pull/457), branch `feature/front-hu16e17`, commit `80830b4d`. Ler os [requisitos, seção 7.6](../../../../../docs/requisitos.md), o [BDD do épico 05](../../../../../bdd/features/epico-05/README.md) e as [decisões do PO na #465](https://github.com/GOUOCE/GOUCE-app/issues/465).

## 1. Preparar a execução

1. Quando a execução for solicitada, criar a branch própria de testes e registrar o commit exato do build.
2. Usar API e PostgreSQL reais em stack isolada com as migrations da `develop` (head `82_updated_at_faculdade_ponto`), com acesso de leitura a `alocacao_diaria` e `log_auditoria`.
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

Guardar a evidência da execução em **um JSON simples**, quando houver resultados reais. Não criar pastas de executor/evidências nem incluir credenciais, tokens ou dados pessoais. Preparar relatos reproduzidos em `api/issues/` pelo [modelo de API](../../../modelos/ISSUE-BUG-API.md), vinculando a issue quando publicada. Os esperados não devem ser ajustados para fazer um caso passar.

Commits seguem o [CONTRIBUTING](../../../../../docs/CONTRIBUTING.md), com autoria de Cauan e sem coautoria. Depois da revisão e integração do planejamento em `develop`, criar a branch própria de execução da HU; não registrar aprovação de caso por leitura do código.

## Riscos mapeados no código

Os riscos abaixo vêm da leitura do código e orientam a execução. **Não são defeitos reproduzidos**: cada um só vira defeito depois de confirmado por HTTP ou na tela, com relato e issue.

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
