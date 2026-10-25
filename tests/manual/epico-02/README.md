# Testes manuais — Épico 02 — Gestão de Cadastros Base

Planejamento essencial de API e UI das HU-007, HU-008, HU-009, HU-010 e HU-030. **127 casos: 63 de API e 64 de UI**, todos pendentes. Nenhum resultado funcional foi obtido nesta rodada; riscos encontrados por leitura de código não são defeitos reproduzidos.

## Índice das suítes

| HU | Funcionalidade | API | UI | Dependências principais | Riscos prioritários |
| --- | --- | --- | --- | --- | --- |
| HU-007 | Bairros e pontos de parada | [12 casos](HU-007/api/API-HU-007.md) | [13 casos](HU-007/ui/UI-HU-007.md) | HU-011 para rota ativa; cadastro de aluno para novos vínculos | Unicidade do ponto fora do bairro; remoção física de pontos na edição; auditoria incompleta; exemplos no app |
| HU-008 | Faculdades | [12 casos](HU-008/api/API-HU-008.md) | [12 casos](HU-008/ui/UI-HU-008.md) | HU-013 para agendamento futuro; HU-030 para atribuição de representante | Inativação sem checar agenda; PATCH de status sem auditoria; exemplos e sucesso offline; novos vínculos com inativa |
| HU-009 | Frota / ônibus | [13 casos](HU-009/api/API-HU-009.md) | [13 casos](HU-009/ui/UI-HU-009.md) | PR #179 para a tela; HU-016/017 para escalação; módulos de histórico | Placa sem formato/normalização completos; capacidades permissivas; auditoria dependente do schema; ação sobre placa errada na UI |
| HU-010 | Motoristas | [13 casos](HU-010/api/API-HU-010.md) | [13 casos](HU-010/ui/UI-HU-010.md) | HU-017 para alocações; histórico; decisão sobre CNH na issue #185 | Inativação retorna 503; app chama /ativar e API /reativar; telefone validado superficialmente; auditoria incompleta e exemplos |
| HU-030 | Representantes | [13 casos](HU-030/api/API-HU-030.md) | [13 casos](HU-030/ui/UI-HU-030.md) | Alunos aprovados/ativos e faculdades; PR #195 para correções de perfil/exemplos; HU-018/021 para RN-015 | Instituição escolhida pode não ser enviada; revogados ocultos; vínculo vencido promovido; sessão/permissões após revogação |
| **Total** | **5 HUs** | **63** | **64** | **Dependências registradas por caso** | **127 casos pendentes** |

Guias existentes de registro de execução de API: [HU-007](HU-007/api/README.md), [HU-008](HU-008/api/README.md), [HU-009](HU-009/api/README.md), [HU-010](HU-010/api/README.md) e [HU-030](HU-030/api/README.md).

## Escopo e organização

- **API:** execução futura pela IA (Claude Code), com validação de Cauan Ricardo; stack isolada com banco limpo e Postman/Insomnia/Swagger em `/docs`.
- **UI:** execução futura por Cauan no celular (Expo Go) ou web em `http://localhost:3000`. Cada suíte está dividida nas seções A/B/C.
- **PC-05 — apoio da IA:** persistência, instituição efetivamente gravada, status, auditoria e histórico são conferidos pela IA na API/banco quando os passos pedirem. Se a UI não permitir preparar a massa, a IA pode montá-la no ambiente local, registrando a origem.
- IDs seguem `CT-HU007-API-001`, `CT-HU007-UI-001` etc. O resumo e o detalhamento de cada suíte usam os mesmos IDs.
- As suítes usam partição de equivalência, valor-limite, transição de estado e tabela de decisão conforme o risco. Variações de um caso devem ter evidências separadas; uma falha não pode ser ocultada pelo sucesso das demais.
- O planejamento fica na branch `test/casos-api-ui-epico-02`. A execução será na **branch da própria implementação/correção**, para corrigir os problemas antes de integrar em `develop`, conforme definido pelo responsável. Anotar branch e commit realmente executados em cada suíte.
- Os READMEs de API são modelos genéricos de uma etapa posterior. Nesta entrega, prevalece o escopo autorizado: arquivos Markdown, commits por HU e push da branch de testes; sem execução de testes, stack, issues ou PR.

## Dependências e critérios de bloqueio

| Verificação | Dependência | Como registrar na execução |
| --- | --- | --- |
| Inativar bairro/ponto usado em rota ativa | HU-011 | Sem rota real disponível, marcar a parte como 🚫; não simular o vínculo como prova |
| Inativar faculdade com alunos agendados no futuro | HU-013 | Sem agenda real, marcar a parte como 🚫 |
| Frota: tela e navegação | [PR #179](https://github.com/GOUOCE/GOUCE-app/pull/179), branch `feat/front-hu009` | Em 24/10/2026, PR aberto; casos de UI dependem da implementação presente no ambiente testado |
| Frota/motoristas: bloqueio por alocação e seleção de inativos | HU-016/017 para frota; HU-017 para motoristas | Sem escalação real, marcar partes dependentes como 🚫. Exemplos do app não substituem vínculos reais |
| Motorista sem alocação futura: inativação válida | Rota já existente, mas retorna 503 na versão lida | Registrar como falha esperada do fluxo quando reproduzida; não aprovar por haver um alerta nem classificar apenas como dependência externa |
| Login do aluno promovido, remoção de exemplos e busca de elegíveis | [PR #195](https://github.com/GOUOCE/GOUCE-app/pull/195), branch `fix/issues-hu030` | Em 24/10/2026, PR aberto; distinguir falha na versão anterior de reteste da correção |
| Representante: lista/presença restrita à universidade | HU-018/021, RN-015 | Tela estática não comprova a regra; sem endpoints/funcionalidade reais, marcar 🚫 |
| Preservação de alocações/relatórios antigos | Relacionamentos e dados históricos disponíveis | Conferir antes/depois com apoio da IA; sem histórico real, marcar somente a verificação dependente como 🚫 |

Um caso pode conter partes independentes: registrar o que foi verificado, a falha e o impedimento de cada parte. Preparar um inativo no banco não aprova a rota de inativação. Erro 500/503 não comprova aplicação da regra de bloqueio por alocação.

## Situação dos riscos e decisões

- Fonte principal: [requisitos, seção 7.3](../../../docs/requisitos.md); depois [cenários e README do BDD](../../../bdd/features/epico-02/README.md), confrontados com o código e a [issue #185](https://github.com/GOUOCE/GOUCE-app/issues/185).
- **Decisões pendentes, sem confirmação do responsável:** formato de placa, capacidades, telefone, unicidade com inativos, indisponibilidade para novos vínculos, instituição obrigatória e reatribuição. Os casos seguem os requisitos atuais como referência provisória; esta documentação não encerra a discussão.
- HU-010: RF-009 exige número/categoria da CNH, mas critérios, telas e API usam nome/telefone; cobertura de CNH depende de decisão de escopo. O mínimo de nome também diverge entre frontend e API, sem definição nos critérios.
- HU-030: RF-034 versus RF-34 precisa padronização. Não há regra expressa exigindo que a instituição representada seja a mesma da matrícula; confirmar antes de exigir bloqueio entre instituições.
- Mensagens de erro de quantidade da frota e de bloqueio de representantes não têm texto literal definido. Mensagens de placa e telefone já estão nos requisitos atuais, embora comentários dos BDDs ainda as tratem como indefinidas. Para motoristas, AC-07/BDD aceitam confirmação de sucesso sem um único texto obrigatório.
- **Hipótese de auditoria da frota:** ORM declara id Integer e usa a placa, mas uma migration tenta convertê-lo para VARCHAR; conferir o schema efetivo antes de atribuir causa a um erro. Não há falha reproduzida.
- **Contrato da frota:** POST/PATCH usam Form, mas a rota adapta JSON. Envio JSON pelo frontend não é incompatibilidade confirmada por si só.
- Issues [#188](https://github.com/GOUOCE/GOUCE-app/issues/188), [#189](https://github.com/GOUOCE/GOUCE-app/issues/189) e [#190](https://github.com/GOUOCE/GOUCE-app/issues/190) estão fechadas, mas correções do PR #195 ainda não estão integradas. O PR não corrige a ocultação de revogados nem o envio da instituição padrão.

## Registro dos resultados

Preencher ambiente/commit, última execução, resultado obtido, status, resumo e defeitos quando a execução ocorrer. **Não alterar o esperado para fazer o teste passar.** Os totais atuais são somente de planejamento: 127 pendentes, sem aprovações, reprovações ou bloqueios contabilizados.

Os detalhamentos contêm mensagens e dados de teste; ocultar credenciais, tokens e dados pessoais em evidências. Registrar defeitos somente após reproduzir e manter a decisão de abertura de issue fora desta rodada de planejamento.
