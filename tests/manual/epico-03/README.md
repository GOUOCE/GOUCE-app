# Testes manuais — Épico 03 — Gestão de Rotas e Horários

Planejamento essencial de API e UI das HU-011 e HU-012. **54 casos: 27 de API e 27 de UI**. A execução de API de 27/10/2026 está registrada abaixo; os 27 casos de UI permanecem pendentes. Esta versão substitui o planejamento feito antes da implementação (base `5554bc90`, 24/10/2026): agora os casos usam as **decisões do PO** na [issue #208](https://github.com/GOUOCE/GOUCE-app/issues/208), os requisitos atualizados, o **backend real** da `develop` e as telas dos PRs de front. Riscos encontrados por leitura de código não são defeitos reproduzidos.

## Execução de API — 27/10/2026

| HU | Casos | Aprovados | Falharam | Parciais | Bloqueados | Chamadas HTTP (com preparação) | Branch / PR |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| HU-011 | 14 | 11 | 1 | 1 | 1 | 143 | [feat/front-hu011 — PR #194](https://github.com/GOUOCE/GOUCE-app/pull/194) |
| HU-012 | 13 | 8 | 2 | 2 | 1 | 123 | [feat/front-hu012 — PR #182](https://github.com/GOUOCE/GOUCE-app/pull/182) |
| Total API | 27 | 19 | 3 | 3 | 2 | 266 | Evidências separadas por HU |

Issues reproduzidas: [#309](https://github.com/GOUOCE/GOUCE-app/issues/309), [#310](https://github.com/GOUOCE/GOUCE-app/issues/310), [#311](https://github.com/GOUOCE/GOUCE-app/issues/311) e [#312](https://github.com/GOUOCE/GOUCE-app/issues/312). Os casos bloqueados dependem da HU-013; não foram aprovados por simulação. Cada branch contém as evidências e os commits da respectiva HU; o outro resultado está no PR indicado. Os resultados de UI não foram preenchidos nesta execução.

## Índice das suítes

| HU | Funcionalidade | API | UI | Dependências principais | Riscos prioritários |
| --- | --- | --- | --- | --- | --- |
| HU-011 | Rotas principais e horários | [14 casos](HU-011/api/API-HU-011.md) | [14 casos](HU-011/ui/UI-HU-011.md) | Bairros e faculdades ativos (HU-007/008); [PR #194](https://github.com/GOUOCE/GOUCE-app/pull/194) para as telas; HU-013 para agendamentos | Nome único só entre principais; mensagem de complementar ativa diferente do PO; exemplos e sucesso offline no app; horários em lista fixa |
| HU-012 | Rotas complementares | [13 casos](HU-012/api/API-HU-012.md) | [13 casos](HU-012/ui/UI-HU-012.md) | Rotas principais ativas (HU-011); [PR #182](https://github.com/GOUOCE/GOUCE-app/pull/182) para as telas; HU-013 para agendamentos | Sem horário de retorno (back e front); nome único só entre complementares; mensagem da reativação diferente do PO; exemplos no app |
| **Total** | **2 HUs** | **27** | **27** | **Dependências registradas por caso** | **27 casos de UI pendentes; API executada acima** |

Guias de execução de API: [HU-011](HU-011/api/README.md) e [HU-012](HU-012/api/README.md).

## Escopo e organização

- **API:** execução assistida pelo Codex, com validação de Cauan Ricardo; HTTP real e PostgreSQL isolado com banco limpo, conforme as evidências desta rodada. Os endpoints `/rotas-principais` e `/rotas-complementares` estão na `develop` (`7c3d72d8`).
- **UI:** execução por Cauan no celular (Expo Go) ou web em `http://localhost:3000`, na branch do PR de front de cada HU (ou na `develop` depois do merge). Cada suíte está dividida nas seções A/B/C.
- **Apoio da IA:** persistência, vínculos, status e auditoria são conferidos pela IA na API/banco quando os passos pedirem. Se a UI não permitir montar a massa (por exemplo, inativar um bairro usado em rota), a IA monta pela API, registrando a origem.
- IDs seguem `CT-HU011-API-001`, `CT-HU011-UI-001`, `CT-HU012-API-001` e `CT-HU012-UI-001`. O resumo e o detalhamento de cada suíte usam os mesmos IDs.
- Técnicas: partição de equivalência (base ativa/inativa/inexistente; perfis), valor-limite (listas com zero e um item; 150/151 caracteres; horário igual e um minuto depois), transição de estado (ativa → inativa → ativa, com bloqueios) e tabela de decisão (complementar ativa/inativa × principal ativa/inativa).

## Fontes

1. [Requisitos, seção 7.4](../../../docs/requisitos.md): HU-011 em 7.4.1 e HU-012 em 7.4.2.
2. [Decisões do PO do épico 03 (#208)](https://github.com/GOUOCE/GOUCE-app/issues/208) e, para bairros e faculdades em rota, do [épico 02 (#207)](https://github.com/GOUOCE/GOUCE-app/issues/207).
3. [HU-011.feature](../../../bdd/features/epico-03/HU-011.feature), [HU-012.feature](../../../bdd/features/epico-03/HU-012.feature) e o [README do BDD](../../../bdd/features/epico-03/README.md).
4. Código: backend em `backend/src/modulos/rotas/` na `develop` `7c3d72d8`; front do PR #194 (`feat/front-hu011`, `3429ab7a`) e do PR #182 (`feat/front-hu012`, `23d1063f`), lidos em 27/10/2026.

## O que mudou em relação ao planejamento anterior

| Ponto | Antes (24/10) | Agora |
| --- | --- | --- |
| Listagem | Ativas e inativas, padrão a definir | Só ativas; inativas com a chave “Mostrar inativos” (AC-01, AC-09) |
| Auditoria | Só a inativação no AC-05 | As quatro escritas (AC-05) |
| Nome da rota | Unicidade não definida | Único entre **principais e complementares**, sem diferenciar maiúsculas, sem espaços nas pontas, contra ativas e inativas (#208, item 1) |
| Horários | Ordem e faixa não definidas | Retorno estritamente depois da saída; sem faixa; formato `HH:mm` (#208, item 2) |
| Volta da principal | Obrigatoriedade não definida | Ao menos uma faculdade na ida e na volta, configuradas de forma independente (#208, item 3) |
| Complementar | Um ou vários horários/pontos | 1 ponto, 1 horário de saída e 1 de retorno (#208, item 4) |
| Principal com complementar ativa | Não definido | Bloquear com mensagem definida pelo PO (#208, item 5) |
| Reativar complementar com principal inativa | Não definido | Bloquear com mensagem definida pelo PO (#208, item 6) |
| Bairro/faculdade em rota ativa | Política pendente | Bloquear a inativação; mensagem da faculdade definida pelo PO (#208, item 7) |
| Rota inativa no agendamento | Inferência do BDD | Fora das opções de novo agendamento, histórico mantido (#208, item 8) |
| Mensagem de agendamentos pendentes | Sem texto | “Esta rota possui agendamentos pendentes e não pode ser inativada no momento.” (AC-06) |
| Contrato | Operações lógicas “a confirmar” | Endpoints, campos e mensagens reais do backend |

## Dependências e critérios de bloqueio

| Verificação | Dependência | Como registrar na execução |
| --- | --- | --- |
| Inativação com agendamentos futuros (AC-06) e rota inativa fora do agendamento (#208, item 8) | HU-013 | O backend responde sempre “sem agendamentos” até a HU-013 existir. Sem agenda real, marcar a parte como 🚫; não preparar agenda pelo banco |
| Telas de rotas principais | PR #194 aberto | Executar a UI na branch do PR ou na `develop` depois do merge; anotar o commit |
| Telas de rotas complementares | PR #182 aberto | Idem. Os dois PRs alteram a mesma linha de `cadastros.tsx`; conferir os dois cards depois do merge |
| Complementar usada nos casos da HU-011 | API da HU-012 | A IA cria pela API quando a tela não estiver no mesmo build |
| Bairro e faculdade em rota ativa | Telas de Bairros e Faculdades (HU-007/008) | Testado na API (CT-HU011-API-011) e na UI (CT-HU011-UI-012) |

Um caso pode ter partes independentes: registrar o que foi verificado, a falha e o impedimento de cada parte. Erro 500 ou mensagem técnica não comprova a aplicação correta de uma regra de bloqueio.

## Riscos mapeados no código

**Backend (`develop` `7c3d72d8`)**

- A unicidade do nome é conferida só dentro de cada tabela: principal com nome de complementar (e vice-versa) é aceita, contra o item 1 da #208.
- A complementar não tem `horario_retorno` (nem tabela, nem DTO); o campo enviado volta 422 “Campo não permitido.”, contra o item 4 da #208.
- Mensagens com texto diferente do definido pelo PO: complementar ativa (“… Inative ou reassocie as complementares antes.”) e reativação com principal inativa (“A rota principal vinculada está inativa. Reative-a ou altere o vínculo antes.”).
- Bloqueio por agendamentos futuros sempre “sem agendamentos” (`TODO(HU-013)`).
- Reativar principal com bairro ou faculdade inativo é bloqueado (regra extra, coerente com RNF-012).
- Bairro e faculdade em rota ativa já têm o bloqueio com as mensagens da HU-007 e da #208.

**Front (PRs #194 e #182)**

- Listas de exemplo (rotas, faculdades, bairros) aparecem com banco vazio ou servidor fora; sem servidor, as escritas parecem ter dado certo.
- A rota/complementar de `id` 1 é barrada na inativação pela regra de exemplo de “agendamentos pendentes”, com texto diferente do requisito.
- “Mostrar inativos” começa ligada; mensagens de sucesso diferentes de “Operação realizada com sucesso”.
- Horários em listas fixas de seis opções; a complementar só tem horário de saída, já vem com `06:10` marcado e a listagem não mostra o ponto de conexão.
- O aviso de bloqueio lê `detail`, mas a API devolve `error.message` (risco de mostrar `Request failed with status code 409`); a reativação recusada não mostra aviso.
- Edição sem confirmação e sem aviso ao sair sem salvar.

## Registro dos resultados

Preencher ambiente/commit, última execução, resultado obtido, status, resumo e defeitos quando a execução ocorrer. **Não alterar o esperado para fazer o teste passar.** São 54 casos planejados; os resultados de API desta execução estão na tabela acima. A UI permanece pendente.

Mensagens definidas pelo PO valem como esperado; quando a regra funciona com outro texto, registrar ⚠️ na API. Ocultar credenciais, tokens e dados pessoais em evidências. Abrir issues somente depois de reproduzir, ao final de cada HU.
