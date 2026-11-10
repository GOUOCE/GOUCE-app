# Testes manuais — Épico 04 — Agendamento de Transporte (Aluno)

Planejamento essencial das **HU-014 — Visualização e Cancelamento de Agendamentos** e **HU-015 — Consulta de Rota Complementar e Transferência**: **37 casos, sendo 17 de API e 20 de UI**. A API da HU-014 foi executada em 09/11/2026: **9 passaram e 1 parcial**; os outros **27 casos permanecem pendentes**. Segue a organização e os campos das suítes do épico 03. A HU-013 entra como dependência de preparação e integração; sua suíte completa não faz parte deste planejamento.

## Índice das suítes

| HU | Funcionalidade | API | UI | Dependências principais |
| --- | --- | --- | --- | --- |
| HU-014 | Meus agendamentos e cancelamento | [10 casos](HU-014/api/API-HU-014.md) | [11 casos](HU-014/ui/UI-HU-014.md) | HU-013 para massa; HU-011/012 para rotas; HU-016/018 para alocação real; [PR #378](https://github.com/GOUOCE/GOUCE-app/pull/378) para UI |
| HU-015 | Rota complementar e transferência | [7 casos](HU-015/api/API-HU-015.md) | [9 casos](HU-015/ui/UI-HU-015.md) | HU-013/014 para reservas; HU-012 para complementares; detalhe integrado e alocação diária; [PR #379](https://github.com/GOUOCE/GOUCE-app/pull/379) para UI |
| **Total** | **2 HUs** | **17** | **20** | **9 passaram; 1 parcial; 27 pendentes** |

## Escopo e organização

- **API:** execução pela LLM, com revisão de Cauan Ricardo; chamadas HTTP contra API e banco reais em ambiente isolado. Guias: [HU-014](HU-014/api/README.md) e [HU-015](HU-015/api/README.md).
- **UI:** execução manual por Cauan Ricardo no celular ou web; a LLM prepara massa e confere persistência/API quando solicitado.
- Estrutura: `epico-04/HU-014/` e `epico-04/HU-015/`, cada uma com `api/` e `ui/`. Defeitos reproduzidos serão registrados em `api/issues/` ou `ui/issues/` durante a execução, seguindo os outros épicos.
- Tipos: funcional positivo/negativo, integração com persistência, autorização e integridade. Medição básica do tempo de resposta nos fluxos principais (RNF-001), sem substituir teste de carga.
- IDs: `CT-HU014-API-001` a `010`, `CT-HU014-UI-001` a `011`, `CT-HU015-API-001` a `007` e `CT-HU015-UI-001` a `009`. Cada caso contém dados, passos, esperado e espaço para resultado obtido.
- As branches de planejamento contêm somente documentação. Depois da revisão e integração em `develop`, criar branch própria de execução da HU correspondente; não registrar aprovação de casos por leitura do código.

## Técnicas e cobertura essencial

**HU-014**

| Técnica | Partições ou limites | Casos API | Casos UI |
| --- | --- | --- | --- |
| Partição de equivalência | Sem reservas/com reservas; própria/de outro aluno; ativo/cancelado; perfis autorizados e recusados | 001, 003, 007, 008 | 001, 003, 010 |
| Valor-limite | Ontem/hoje/amanhã; zero/um; 22 → 21 → 22 ativos; mudança de mês | 001, 002, 005, 006, 009 | 001, 002, 006, 007, 011 |
| Transição de estado | ATIVO → CANCELADO; desistir; repetir; erro sem mudança | 004, 007, 010 | 004, 005, 008, 009 |
| Tabela de decisão | Dono × data × status; confirmação × resultado da API | 003 a 008 | 004 a 010 |

O resumo de cada suíte indica as seções A/B/C; os detalhes identificam a técnica aplicada. Não acrescentar combinações repetidas sem risco distinto.

**HU-015**

| Técnica | Partições ou transições | Casos API | Casos UI |
| --- | --- | --- | --- |
| Partição de equivalência | Complementar/direto; ida/volta; conta própria/outra; cache válido/ausente/inválido | 002, 003, 006, 007 | 002 a 005, 008, 009 |
| Tabela de decisão | Trecho × complementar; data × programação; rede × cache × conta | 002, 004, 005 | 002, 004, 005, 007, 008 |
| Transição de estado | Online → offline; nova sincronização; complementar → direto; cancelamento conhecido; troca de conta | 005, 007 | 004, 006, 008, 009 |
| Valor-limite | Primeiro acesso sem dados; nome/ponto com 150 caracteres, no limite cadastral válido para leitura | — | 002, 005 |

A tabela de decisão essencial da HU-015 é: reserva com complementar mostra transferência; direta oculta a seção; offline com cache próprio válido mostra o último dado sincronizado; offline sem cache próprio informa indisponibilidade. Cache de outra conta ou outra data nunca substitui a viagem selecionada.

## Fontes e versões analisadas

**HU-014 — referências preservadas do planejamento inicial**

1. [Requisitos, seção 7.5.2](../../../docs/requisitos.md): AC-01 a AC-08, FA-001 a FA-004, RF-016, RN-005, RNF-001 e RNF-012. AC refere-se somente aos oito critérios de aceite; os itens seguintes do documento são fluxos e referências.
2. API: `origin/develop` **`3e3bb13c6dab1db0b30ea2e58e3bdcd6905c0479`**, com o [PR #381](https://github.com/GOUOCE/GOUCE-app/pull/381) integrado. Código em `backend/src/modulos/agendamentos/`.
3. UI: [PR #378](https://github.com/GOUOCE/GOUCE-app/pull/378), branch **`feature/front-hu014`**, commit **`7d5f01272700c43e6bbecb6d55cc90df35a9da03`**. Código em `frontend/src/app/(aluno)/agenda.tsx` e `frontend/src/services/agendamentoService.ts`.
4. [Padrão de contribuição](../../../docs/CONTRIBUTING.md) e [suítes do épico 03](../epico-03/README.md).

Leitura realizada em **09/11/2026**. Não há arquivo BDD da HU-014 na base analisada; a rastreabilidade usa diretamente os requisitos. Anotar novos commits na execução, pois o PR pode mudar.

**HU-015 — planejamento adicionado em 09/11/2026**

1. [Requisitos, seção 7.5.3](../../../docs/requisitos.md): AC-01 a AC-04, FA-001/002, RN-010, RF-029 e RNF-015. Os itens depois dos quatro critérios são fluxos e referências.
2. API: `origin/develop` **`99bbf2c6df8bd3b4a9d76f22267d63e11b45f126`**, já com o planejamento da HU-014 integrado pelo [PR #385](https://github.com/GOUOCE/GOUCE-app/pull/385). Endpoints e DTOs em `backend/src/modulos/agendamentos/`; cadastro de referência em `backend/src/modulos/rotas/`.
3. UI: [PR #379](https://github.com/GOUOCE/GOUCE-app/pull/379), branch **`feature/front-hu015`**, commit **`b2111a9c0c9c29b8e39eb78746b44a6a0088e94b`**. Arquivos: `agendamento-detalhes.tsx`, `agenda.tsx`, `agendamentoService.ts` e testes unitários do serviço.
4. Não há BDD da HU-015 na base analisada. Quando adicionado, revisar a correspondência com as suítes sem presumir que cenários ainda ausentes foram cobertos. A ausência do BDD não impede este planejamento pelos requisitos e pelo PR.

## Riscos mapeados no código

São hipóteses para orientar a execução, **não defeitos reproduzidos**.

**HU-014**

| Risco | Evidência de leitura | Cobertura |
| --- | --- | --- |
| Calendário e detalhes sem correspondência com a reserva real | `agenda.tsx` tem grade e mês fixos em setembro/2026, data `2026-09-31`, setas sem ação e detalhes de trajeto/ponto/IES fixos | UI-002, UI-003, UI-007 |
| Cancelamento parece funcionar após falha | `cancelarAgendamento` captura qualquer erro e retorna `{ success: true }`; a tela remove a reserva localmente | UI-008, UI-009 |
| Erro de leitura aparece como ausência de reservas | `listarAgendamentosAtivos` retorna `[]` em qualquer erro | UI-009 |
| DELETE usa identificador diferente do registro real | A seleção usa o objeto da grade fixa; o cancelamento usa `idAgendamento` dele ou a data ISO, sem buscar o id da reserva carregada | UI-005 |
| Remoção indevida de histórico | A tela verifica `ehPassado`, mas a grade não preenche esse campo nem usa `pode_remover` retornado pela API | API-006, UI-007 |
| Vaga no veículo continua ocupada | `AgendamentoRepository.remove_allocations` é um gancho sem efeito até HU-016/018 | API-010 e parte de UI-005 |

**HU-015**

| Risco | Evidência de leitura | Cobertura |
| --- | --- | --- |
| Detalhe não integra com a API disponível | Front consulta `/agendamentos/detalhes?data=...`; backend tem `/transporte/agendamentos/{id}`, sem o DTO completo de viagem | API-001, API-004; UI-001/002 |
| Exemplos aparecem como informação offline sincronizada | Sem resposta nem cache, o serviço constrói viagem fixa de setembro/2026 e a grava no AsyncStorage | UI-004, UI-005, UI-009 |
| Dados de A reaproveitados por B | Chave `@GOUOCE:detalhes_viagem_${dataIso}` depende só da data, sem identificação da conta | UI-008 |
| Duas transferências viram uma informação de ida | Modelo do front tem uma `rotaComplementar`; a tela usa “Volta” só quando `tipoTrajeto === 'volta'`, tratando `ambos` como “Ida” | API-002/004; UI-002/007 |
| Viagem direta recebe complementar de exemplo | Tela/serviço usam data fixa e `temComplementar=true` por padrão quando faltam parâmetros/dados reais | UI-001, UI-003 |
| Recusa HTTP ou falha de gravação vira falso offline | Um único `catch` trata requisição e escrita no storage, depois usa cache/fallback para qualquer erro | UI-005, UI-006, UI-009 |
| Navegação usa reservas fixas | `agenda.tsx` do PR inicia com demonstração e calendário de setembro/2026; `/agendamentos/meus` também difere do prefixo real | UI-001 |
| Veículo diário não pode ser conferido | Detalhe atual do backend não entrega programação/alocação da operação | API-005; UI-002/007 |

## Dependências e critérios de bloqueio

Usar a `develop` analisada para API e o build do PR #378 (HU-014) ou #379 (HU-015) para UI, com os SHAs anotados. As versões de `develop` analisadas não contêm essas telas. As branches de documentação não incorporam código das features.

- A LLM prepara alunos A e B aprovados, rotas ativas e reservas pela API da HU-013. Sem uma dependência, marcar somente a parte afetada como 🚫 e indicar a causa.
- Histórico e feriado/recesso exigem massa de fixture/seed em banco isolado, porque não há endpoint para criar reserva no passado nem para cadastrar feriado no router analisado. Documentar exatamente a preparação; não alterar o relógio do sistema nem dados compartilhados.
- Falta da alocação real bloqueia a comprovação de liberação da vaga e atomicidade com a alocação (API-010); um DELETE 200 sozinho não comprova AC-06 inteiro.
- Para simular falha transacional, é necessário mecanismo controlado no ambiente de teste. Sem ele, registrar a parte como bloqueada, sem chamar teste com mock de integração real.
- Na HU-014 (AC-08), testar primeiro erro antes de a requisição chegar à API. Se só a resposta se perder após o commit, consultar novamente o estado no servidor antes de concluir se houve cancelamento parcial.

Para a **HU-015**, confirmar o contrato real no CT-HU015-API-001 antes de tentar comprovar detalhe completo/veículo diário. Os ids/nomes das complementares nos endpoints atuais podem ser conferidos independentemente. Ausência de endpoint integrado não deve ser confundida com ausência de reserva nem aprovada por um fallback do front. Falta da alocação real limita RN-010 e os dados de ônibus/motorista. O cache offline só pode ser aprovado após sincronização HTTP efetiva de dados reais; testes unitários com mock não suprem essa dependência.

Os PRs #378 e #379 alteram `agenda.tsx` e `agendamentoService.ts`. Após integração, revisar o build final para conferir prefixos de API, navegação entre as duas HUs e preservação do comportamento de cache. Não pressupor que os dois PRs já estão combinados neste planejamento.

## Registro dos resultados

Preencher ambiente/commit, data, resultado obtido, status, resumo, totais e defeitos apenas na execução. Em caso parcialmente verificável, separar o que passou, falhou e ficou bloqueado; não aprovar o caso inteiro se houver impedimento. Preservar o esperado mesmo quando a implementação divergir. Contabilização em 09/11/2026: **9 passaram, 1 parcial e 27 pendentes**. Os 10 casos de API da HU-014 foram abordados; o CT-010 ficou parcial porque a integração com alocação real ainda não existe. Os 11 casos de UI da HU-014 e os 16 casos da HU-015 permanecem pendentes. [Evidências da execução de API da HU-014](HU-014/api/evidencias/2026-11-09/README.md).

Registrar HTTP e corpo na API, evidências visuais na UI e consultas de persistência quando pedidas. Omitir credenciais, tokens e dados pessoais dos registros. Preparar relatos `.md` após reprodução; publicação no GitHub fica para a etapa de execução e revisão.
