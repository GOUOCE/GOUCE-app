# BDD — Épico 03: Gestão de Rotas e Horários

Especificações em Gherkin (português) do comportamento esperado para a estruturação logística dos trajetos: rotas principais, com seus horários, bairros de origem e faculdades de destino, e rotas complementares, vinculadas às rotas principais.

O formato, as tags e a rastreabilidade seguem o padrão descrito em [`../epico-01/README.md`](../epico-01/README.md). As tags adicionais e a organização em blocos `Regra:` seguem o [`../epico-02/README.md`](../epico-02/README.md).

## Estrutura

```
bdd/features/epico-03/
├── HU-011.feature  (Rotas Principais e Horários)
└── HU-012.feature  (Rotas Complementares)
```

## Histórias de Usuário

**HU-011: Gerenciamento de Rotas Principais e Horários**

- Fluxo: admin cadastra, edita, inativa e reativa rotas (nome, horário de saída e retorno, bairros e faculdades da ida e da volta); a listagem mostra só as ativas, com a chave "Mostrar inativos"
- Faculdades da volta configuradas de forma independente das da ida (AC-10)
- Seleção: bairros e faculdades inativos não aparecem como opção
- Bloqueio: rota com alunos agendados para datas futuras não pode ser inativada (depende da HU-013)
- Organizado em blocos `Regra:` (gestão pelo admin, soft delete e auditoria, indisponibilidade e histórico, acesso restrito)
- Cenários: 1 listagem + 1 sucesso + 1 vários bairros e faculdades + 1 volta independente da ida + 2 obrigatórios (cadastro e edição) + 1 seleção só de ativos + 1 edição + 1 inativação + 1 reativação + 1 bloqueio por agendamento + 1 inativos + 1 soft delete + 1 auditoria + 1 histórico (RN-004) + 1 rota inativa fora do agendamento + 2 acesso restrito (menu e API)

**HU-012: Gerenciamento de Rotas Complementares**

- Fluxo: admin cadastra, edita, inativa e reativa rotas complementares (rota principal vinculada, nome, horário de saída e ponto de conexão); a listagem mostra só as ativas, com a chave "Mostrar inativos"
- Seleção: o campo de rota principal exibe apenas rotas ativas
- Bloqueio: rota complementar com alunos agendados para datas futuras não pode ser inativada (depende da HU-013)
- Organizado em blocos `Regra:` (gestão pelo admin, soft delete e auditoria, histórico e indisponibilidade, acesso restrito)
- Cenários: 1 listagem + 1 sucesso + 2 obrigatórios (cadastro e edição) + 1 seleção só de rotas principais ativas + 1 edição + 1 inativação + 1 reativação + 1 bloqueio por agendamento + 1 inativos + 1 soft delete + 1 auditoria + 1 histórico (RN-004) + 1 rota inativa fora do agendamento (RN-010) + 2 acesso restrito (menu e API)

## Resumo de Cobertura

| HU     | Cenários | Esquemas | Execuções |
| ------ | -------- | -------- | --------- |
| HU-011 | 18       | 6        | 33        |
| HU-012 | 16       | 5        | 27        |
| Total  | 34       | 11       | 60        |

- Todos os critérios de aceite e fluxos alternativos de `docs/requisitos.md` (seção 7.4) têm ao menos um cenário.
- Cenários de soft delete, auditoria, RN-004 e acesso por API estão marcados com `@teste_api @nao_automatizavel_via_appium`, pois exigem consulta ao banco ou à API.
- Cenários que dependem de outras histórias carregam a tag `@depende_de_HU0XX` (HU-013, agendamento).
- Arquivos validados com o parser oficial `@cucumber/gherkin`.

## Pontos para alinhar com o time

Os cenários seguem a opção indicada e trazem um comentário `# Observação` no arquivo quando aplicável. Nenhuma alteração foi feita em `docs/requisitos.md`.

**Divergências no documento**

| HU             | Divergência                                                                                                                                                               | Opção seguida nos cenários                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| HU-011 e 012   | O AC-01 cita rotas **ativas e inativas** na listagem; o AC-09 cita visualizar inativas "quando necessário"                                                                | Ativas na listagem e inativas com a chave "Mostrar inativos" |
| HU-011 e 012   | O AC-05 cita a auditoria só da **inativação**; o fluxo principal registra **toda** operação no log                                                                        | Auditoria das quatro operações                              |
| HU-011         | O AC-02 cita "uma ou mais faculdades"; o fluxo principal e o FA-003 citam "a faculdade de destino" (singular)                                                             | AC-02: uma ou mais faculdades, ao menos uma na ida          |
| HU-012         | O AC-02 cita "horários" (plural) e o fluxo principal cita "pontos de conexão" (plural); o AC-08 e o formulário usam horário de saída e um ponto de conexão                | Um horário de saída e um ponto de conexão                   |
| HU-012         | O AC-08 não inclui o **nome** nos campos obrigatórios, mas o AC-02 e o formulário o exigem                                                                                | Nome obrigatório                                            |
| HU-011 e 012   | O texto da mensagem de bloqueio por agendamentos futuros (FA-001) não está definido                                                                                       | Cenários verificam o sentido da mensagem, não o texto exato |

**Regras não definidas no requisito (sem cenário; precisam de decisão)**

- Nome da rota: precisa ser único? Rota principal e complementar com o mesmo nome são permitidas?
- Horários: o horário de retorno deve ser posterior ao de saída? Há horário mínimo ou máximo?
- Faculdades da volta: são obrigatórias? Hoje o cenário da volta independente trata a volta como um subconjunto livre da ida.
- Inativar uma rota principal que possui rotas complementares ativas vinculadas: bloquear, inativar em cascata ou manter o vínculo?
- Reativar uma rota complementar cuja rota principal está inativa: permitir ou bloquear?
- Bairro ou faculdade inativado depois de já vinculado a uma rota ativa (a HU-007 bloqueia a inativação do bairro nesse caso; falta definir o equivalente para a faculdade na HU-008).

**Comportamentos inferidos (cenário criado, a confirmar)**

- Rota principal e rota complementar inativas não aparecem como opção no agendamento do aluno (decorre da finalidade da rota; depende da HU-013).
