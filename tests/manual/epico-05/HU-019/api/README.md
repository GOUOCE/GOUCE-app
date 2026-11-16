# Como executar os testes manuais de API — HU-019

Execução pela **LLM**, com revisão de **Cauan Ricardo**. [Suíte de API: 9 casos](API-HU-019.md). A [UI tem 9 casos](../ui/UI-HU-019.md) para execução manual por Cauan. Nenhum caso foi executado nesta entrega.

## Base e fontes

Planejamento na branch `test/planejamento-api-ui-hu-019`, com entrega para `develop`. Código analisado: `develop` `1eb2818d`, `minha_viagem_service.py` e, no front, `agendamentoService.ts`, `home.tsx`, `agenda.tsx` e `agendamento-detalhes.tsx`. Ler os [requisitos, seção 7.6](../../../../../docs/requisitos.md), o [BDD do épico 05](../../../../../bdd/features/epico-05/README.md) e as [decisões do PO na #465](https://github.com/GOUOCE/GOUCE-app/issues/465).

## 1. Preparar a execução

1. Quando a execução for solicitada, criar a branch própria de testes e registrar o commit exato do build.
2. Usar API e PostgreSQL reais em stack isolada com as migrations da `develop` (head `82_updated_at_faculdade_ponto`).
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

Guardar a evidência da execução em **um JSON simples**, quando houver resultados reais. Não criar pastas de executor/evidências nem incluir credenciais, tokens ou dados pessoais. Preparar relatos reproduzidos em `api/issues/` pelo [modelo de API](../../../modelos/ISSUE-BUG-API.md), vinculando a issue quando publicada. Os esperados não devem ser ajustados para fazer um caso passar.

Commits seguem o [CONTRIBUTING](../../../../../docs/CONTRIBUTING.md), com autoria de Cauan e sem coautoria. Depois da revisão e integração do planejamento em `develop`, criar a branch própria de execução da HU; não registrar aprovação de caso por leitura do código.

## Riscos mapeados no código

Os riscos abaixo vêm da leitura do código e orientam a execução. **Não são defeitos reproduzidos**: cada um só vira defeito depois de confirmado por HTTP ou na tela, com relato e issue.

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
