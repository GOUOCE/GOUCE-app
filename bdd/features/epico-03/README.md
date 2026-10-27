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
- Obrigatórios: nome, horários, ao menos um bairro, ao menos uma faculdade na ida e ao menos uma na volta; ida e volta configuradas de forma independente (AC-08, AC-10)
- Nome único entre todas as rotas, principais e complementares, ativas ou inativas, sem diferenciar maiúsculas/minúsculas (AC-11)
- Horários no formato `HH:mm`, sem faixa mínima ou máxima, com retorno estritamente depois da saída (AC-12)
- Seleção: bairros e faculdades inativos não aparecem como opção
- Bloqueios: rota com alunos agendados para datas futuras (depende da HU-013) e rota com rotas complementares ativas vinculadas (AC-13) não podem ser inativadas; rota vinculada a bairro ou faculdade inativo não pode ser reativada (AC-15)
- Nome com no máximo 150 caracteres (AC-16)
- Organizado em blocos `Regra:` (gestão pelo admin, soft delete e auditoria, indisponibilidade e histórico, acesso restrito)
- Cenários: 1 listagem + 1 sucesso + 1 vários bairros e faculdades + 1 volta independente da ida + 2 nome duplicado (cadastro e edição) + 1 retorno não posterior à saída + 1 horários aceitos sem faixa + 1 formato do horário (API) + 1 tamanho do nome (API) + 2 obrigatórios (cadastro e edição) + 1 seleção só de ativos + 1 edição + 1 inativação + 1 reativação + 1 bloqueio por agendamento + 1 bloqueio da reativação com vínculo inativo + 1 bloqueio por complementar ativa + 1 inativação com complementares só inativas + 1 inativos + 1 soft delete + 1 auditoria + 1 histórico (RN-004) + 1 rota inativa fora do agendamento + 2 acesso restrito (menu e API)

**HU-012: Gerenciamento de Rotas Complementares**

- Fluxo: admin cadastra, edita, inativa e reativa rotas complementares (rota principal vinculada, nome, horário de saída, horário de retorno e ponto de conexão); a listagem mostra só as ativas, com a chave "Mostrar inativos"
- Cada complementar tem exatamente 1 ponto de conexão, 1 horário de saída e 1 horário de retorno (AC-10)
- Nome único entre todas as rotas (AC-11) e horários com as mesmas regras da HU-011 (AC-12)
- Nome e ponto de conexão com no máximo 150 caracteres cada (AC-15)
- Seleção: o campo de rota principal exibe apenas rotas ativas
- Bloqueios: rota complementar com alunos agendados para datas futuras não pode ser inativada (depende da HU-013); rota complementar cuja rota principal está inativa não pode ser reativada (AC-13)
- Organizado em blocos `Regra:` (gestão pelo admin, soft delete e auditoria, histórico e indisponibilidade, acesso restrito)
- Cenários: 1 listagem + 1 sucesso + 2 nome duplicado (cadastro e edição) + 1 retorno não posterior à saída + 1 um valor por campo (API) + 1 tamanho do nome e do ponto (API) + 2 obrigatórios (cadastro e edição) + 1 seleção só de rotas principais ativas + 1 edição + 1 inativação + 1 reativação + 1 bloqueio da reativação com principal inativa + 1 bloqueio por agendamento + 1 inativos + 1 soft delete + 1 auditoria + 1 histórico (RN-004) + 1 rota inativa fora do agendamento (RN-010) + 2 acesso restrito (menu e API)

## Resumo de Cobertura

| HU     | Cenários | Esquemas | Execuções |
| ------ | -------- | -------- | --------- |
| HU-011 | 27       | 12       | 55        |
| HU-012 | 22       | 9        | 45        |
| Total  | 49       | 21       | 100       |

- Todos os critérios de aceite e fluxos alternativos de `docs/requisitos.md` (seção 7.4) têm ao menos um cenário.
- Cenários de soft delete, auditoria, RN-004 e acesso por API estão marcados com `@teste_api @nao_automatizavel_via_appium`, pois exigem consulta ao banco ou à API.
- Cenários que dependem de outras histórias carregam a tag `@depende_de_HU0XX` (HU-013, agendamento).
- Arquivos validados com o parser oficial `@cucumber/gherkin`.

## Decisões do PO

Os pontos que estavam em aberto foram respondidos pelo PO na [issue #208](https://github.com/GOUOCE/GOUCE-app/issues/208) (27/10/2026), todos na opção sugerida, e incorporados à seção 7.4 de `docs/requisitos.md` e aos cenários:

| Item | Decisão | Onde |
| ---- | ------- | ---- |
| 1 | Nome único entre principais e complementares, ativas ou inativas, sem diferenciar maiúsculas/minúsculas e sem espaços nas pontas | AC-11 e FA-005 das duas HUs |
| 2 | Retorno estritamente depois da saída; sem faixa de horário; formato `HH:mm` | AC-12 e FA-006 das duas HUs |
| 3 | Ao menos uma faculdade na ida e uma na volta, configuradas de forma independente | HU-011, AC-08, AC-10 e FA-003 |
| 4 | Complementar com 1 ponto de conexão, 1 horário de saída e 1 de retorno | HU-012, AC-02, AC-08 e AC-10 |
| 5 | Inativar principal com complementares ativas é bloqueado | HU-011, AC-13 e FA-004 |
| 6 | Reativar complementar com principal inativa é bloqueado | HU-012, AC-13 e FA-004 |
| 7 | Faculdade em rota ativa não pode ser inativada | HU-008, AC-12 e FA-004 (épico 02) |
| 8 | Rotas inativas fora das opções de novo agendamento, com histórico mantido | AC-14 das duas HUs |

As mensagens de duplicidade e de horário seguem as do backend; as de bloqueio por complementar e de reativação seguem o texto definido pelo PO.

Além das decisões do PO, a seção 7.4 passou a registrar duas regras que já estão no backend (`backend/src/modulos/rotas/`), com as mensagens do código: a reativação de rota principal vinculada a bairro ou faculdade inativo é bloqueada (HU-011, AC-15 e FA-007) e os campos de texto têm no máximo 150 caracteres (HU-011, AC-16; HU-012, AC-15).
