# Testes manuais — Épico 04 — Agendamento de Transporte (Aluno)

Suítes essenciais das **HU-013 — Agendamento de Transporte**, **HU-014 — Visualização e Cancelamento de Agendamentos** e **HU-015 — Consulta de Rota Complementar e Transferência**: **51 casos, sendo 30 de API e 21 de UI**. A API da HU-014 tem **9 casos aprovados e 1 parcial**; a API da HU-013 teve **1 falha e 11 bloqueados** por integração indisponível. A API da HU-015 teve **5 aprovados, 2 falhas e 1 bloqueado** no build integrado em 10/11/2026. Os **21 casos de UI permanecem pendentes**. A HU-013 cobre somente API; cada resultado preserva o SHA efetivamente testado.

## Índice das suítes

| HU | Funcionalidade | API | UI | Dependências principais |
| --- | --- | --- | --- | --- |
| HU-013 | Agendamento de transporte | [12 casos](HU-013/api/API-HU-013.md) | — (fora desta entrega) | Backend exato de `feature/front-hu013`, [PR #377](https://github.com/GOUOCE/GOUCE-app/pull/377); rotas/cadastros e regras da #389 |
| HU-014 | Meus agendamentos e cancelamento | [10 casos](HU-014/api/API-HU-014.md) | [11 casos](HU-014/ui/UI-HU-014.md) | HU-013 para massa; HU-011/012 para rotas; HU-016/018 para alocação real; [PR #378](https://github.com/GOUOCE/GOUCE-app/pull/378) para UI |
| HU-015 | Rota complementar e transferência | [8 casos](HU-015/api/API-HU-015.md) | [10 casos](HU-015/ui/UI-HU-015.md) | Back/front integrados em `feature/front-hu015` `4ac87b46` ([PR #379](https://github.com/GOUOCE/GOUCE-app/pull/379)); BDD e #389; alocação futura somente nos casos indicados |
| **Total** | **3 HUs** | **30** | **21** | **14 passaram; 3 falharam; 1 parcial; 12 bloqueados; 21 pendentes** |

## Escopo e organização

- **API:** execução pela LLM, com revisão de Cauan Ricardo; chamadas HTTP contra API e banco reais em ambiente isolado. Guias: [HU-013](HU-013/api/README.md), [HU-014](HU-014/api/README.md) e [HU-015](HU-015/api/README.md).
- **UI:** execução manual por Cauan Ricardo no celular ou web; a LLM prepara massa e confere persistência/API quando solicitado.
- Estrutura: `epico-04/HU-013/api/`, `epico-04/HU-014/` e `epico-04/HU-015/`; as duas últimas têm `api/` e `ui/`. Defeitos reproduzidos são registrados em `api/issues/` ou `ui/issues/` para revisão.
- Tipos: funcional positivo/negativo, integração com persistência, autorização e integridade. Medição básica do tempo de resposta nos fluxos principais (RNF-001), sem substituir teste de carga.
- IDs: `CT-HU013-API-001` a `012`, `CT-HU014-API-001` a `010`, `CT-HU014-UI-001` a `011`, `CT-HU015-API-001` a `008` e `CT-HU015-UI-001` a `010`. Cada caso contém dados, passos, esperado e espaço para resultado obtido.
- As branches de planejamento contêm somente documentação. Depois da revisão e integração em `develop`, criar branch própria de execução da HU correspondente; não registrar aprovação de casos por leitura do código.

## Técnicas e cobertura essencial

**HU-013 — somente API**

| Técnica | Cobertura | Casos |
| --- | --- | --- |
| Integração e contrato | Publicação das operações antes das regras de negócio | 001 |
| Partição de equivalência | Dias, referências, credenciais e dono | 002, 005, 006, 011 |
| Tabela de decisão | Ida/volta; dia útil/rota disponível | 002, 003, 004, 005 |
| Valor-limite | D−1/D/D+29/D+30; 21/22 ativos; configuração 15 dias/5 ativos | 008, 009 |
| Transição de estado e persistência | Duplicidade, concorrência, edição, cancelamento e rollback | 007, 010, 012 |

**HU-014**

| Técnica | Partições ou limites | Casos API | Casos UI |
| --- | --- | --- | --- |
| Partição de equivalência | Sem reservas/com reservas; própria/de outro aluno; ativo/cancelado; perfis autorizados e recusados | 001, 003, 007, 008 | 001, 003, 010 |
| Valor-limite | Ontem/hoje/amanhã; zero/um; 22 → 21 → 22 ativos; mudança de mês | 001, 002, 005, 006, 009 | 001, 002, 006, 007, 011 |
| Transição de estado | ATIVO → CANCELADO; desistir; repetir; erro sem mudança | 004, 007, 010 | 004, 005, 008, 009 |
| Tabela de decisão | Dono × data × status; confirmação × resultado da API | 003 a 008 | 004 a 010 |

O resumo de cada suíte indica as seções A/B/C; os detalhes identificam a técnica aplicada. Não acrescentar combinações repetidas sem risco distinto.

**HU-015 — planejamento revisado sobre a integração**

| Técnica | Partições ou transições | Casos API | Casos UI |
| --- | --- | --- | --- |
| Partição de equivalência | Direto/complementar; trechos; parâmetros; perfis; cache válido/ausente/inválido | 001 a 006 | 001 a 006, 009, 010 |
| Tabela de decisão | Trecho × complementar; data × programação; rede × cache × conta | 002, 003, 005, 008 | 002, 003, 005, 008, 009 |
| Transição de estado | Mudança de referência; online/offline/reconectado; troca de conta; cancelamento conhecido | 004, 007, 008 | 005, 007, 009, 010 |
| Valor-limite | Primeira consulta sem cache; nome/ponto com 150 caracteres | — | 002, 006 |

Matriz essencial: trecho com complementar apresenta transferência; direto oculta a seção; sem alocação oculta veículo/motorista; offline com informação própria sincronizada preserva a consulta; offline sem cache próprio informa indisponibilidade.

## Fontes e versões analisadas

**HU-013 — execução solicitada sobre a feature**

- Resultados partem da develop `4e44913d8df632666b3433d32358bb49fc91c6a8`, já com a HU-014 integrada. O código a testar é `feature/front-hu013` `ee305857954fcb23f3919f3ebfe7e163fcbc167a` ([PR #377](https://github.com/GOUOCE/GOUCE-app/pull/377)), sem incorporar a feature ao PR de testes.
- [Requisitos, seção 7.5.1](../../../docs/requisitos.md); [BDD da HU-013 em d7c952ad](https://github.com/GOUOCE/GOUCE-app/blob/d7c952adfd56eb858aa86f48a68afdab206fc913/bdd/features/epico-04/HU-013.feature), ainda fora dessa develop; [resposta do PO na #389](https://github.com/GOUOCE/GOUCE-app/issues/389#issuecomment-6756236002).
- As decisões da #389 prevalecem nas divergências: não cobrar feriado/recesso, bloquear sábado/domingo, janela de D a D+29 e mensagens definidas pelo PO. As referências da HU-014 abaixo preservam o histórico anterior; a HU-015 foi revisada sobre o build integrado, sem reexecutar as outras HUs.

**HU-014 — referências preservadas do planejamento inicial**

1. [Requisitos, seção 7.5.2](../../../docs/requisitos.md): AC-01 a AC-08, FA-001 a FA-004, RF-016, RN-005, RNF-001 e RNF-012. AC refere-se somente aos oito critérios de aceite; os itens seguintes do documento são fluxos e referências.
2. API: `origin/develop` **`3e3bb13c6dab1db0b30ea2e58e3bdcd6905c0479`**, com o [PR #381](https://github.com/GOUOCE/GOUCE-app/pull/381) integrado. Código em `backend/src/modulos/agendamentos/`.
3. UI: [PR #378](https://github.com/GOUOCE/GOUCE-app/pull/378), branch **`feature/front-hu014`**, commit **`7d5f01272700c43e6bbecb6d55cc90df35a9da03`**. Código em `frontend/src/app/(aluno)/agenda.tsx` e `frontend/src/services/agendamentoService.ts`.
4. [Padrão de contribuição](../../../docs/CONTRIBUTING.md) e [suítes do épico 03](../epico-03/README.md).

Leitura realizada em **09/11/2026**. Não há arquivo BDD da HU-014 na base analisada; a rastreabilidade usa diretamente os requisitos. Anotar novos commits na execução, pois o PR pode mudar.

**HU-015 — execução da API no build integrado**

1. [Requisitos, seção 7.5.3](../../../docs/requisitos.md) e [BDD HU-015](../../../bdd/features/epico-04/HU-015.feature), presentes no checkout. Os cenários do BDD já cobrem consulta por data, trechos independentes, retorno na volta, dados nulos sem alocação, direto, offline, atualização e acesso.
2. Backend e front: `feature/front-hu015` **`4ac87b4623b493af2d56012d60b8c3b875c3af7e`** ([PR #379](https://github.com/GOUOCE/GOUCE-app/pull/379)). Branch de planejamento **`test/planejamento-api-ui-hu-015-integrado`**, com entrega para `develop`; a feature indicada permanece como referência do código analisado.
3. [Resposta do PO na #389](https://github.com/GOUOCE/GOUCE-app/issues/389#issuecomment-6756236002), itens 6 e 7: saída na ida/retorno na volta e ônibus/motorista ocultos sem alocação diária.
4. Código: `backend/src/modulos/agendamentos/`, migration `81_add_updated_at_rotas`, `frontend/src/services/agendamentoService.ts` e telas `agenda.tsx`, `agendamento-detalhes.tsx` e `home.tsx`. O planejamento anterior em `b2111a9c`/`99bbf2c6` foi substituído para a HU-015; os resultados das HU-013/014 em outros SHAs permanecem como histórico.
5. Execução de API em **10/11/2026**, branch `feature/testes-api-hu-015` criada da develop `e177426e`; código testado em checkout separado no SHA `4ac87b46`. HTTP real e PostgreSQL 15.17 migrado até `81_add_updated_at_rotas`, sem mocks. **205 chamadas, 5 casos passaram, 2 falharam e 1 bloqueado**. [JSON único](HU-015/api/EVIDENCIAS-HU-015.json).

**Contrato atual da HU-015**

`GET /transporte/agendamentos/detalhes?data=YYYY-MM-DD`, `GET /transporte/agendamentos/{id}` e `GET /transporte/agendamentos/meus`. O router está registrado em `backend/main.py`. O detalhe contém resumos independentes de complementar/principal por trecho e `atualizado_em`; `onibus`/`motorista` ficam nulos até o épico 5. Leitura de código não equivale a execução HTTP.

## Riscos mapeados no código

Os riscos de leitura orientam a execução. Achados confirmados por HTTP são identificados como reproduzidos e vinculados aos seus relatos.

**HU-013**

- Confirmado por HTTP no commit `ee305857`: sete caminhos de agendamento retornam 404 genérico, apesar de health/login 200, e nenhuma operação do módulo aparece no OpenAPI. [BUG-HU013-API-001](HU-013/api/issues/BUG-HU013-API-001-rotas-agendamento-nao-publicadas.md). CT-001 falhou; CT-002 a CT-012 bloqueados. [Resumo JSON](HU-013/api/EVIDENCIAS-HU-013.json).
- O front captura erros de criação/edição e pode devolver sucesso de fallback. Somente resposta HTTP real e banco validam a API; nenhuma conclusão de UI é feita por essa leitura.

**HU-014**

| Risco | Evidência de leitura | Cobertura |
| --- | --- | --- |
| Calendário e detalhes sem correspondência com a reserva real | `agenda.tsx` tem grade e mês fixos em setembro/2026, data `2026-09-31`, setas sem ação e detalhes de trajeto/ponto/IES fixos | UI-002, UI-003, UI-007 |
| Cancelamento parece funcionar após falha | `cancelarAgendamento` captura qualquer erro e retorna `{ success: true }`; a tela remove a reserva localmente | UI-008, UI-009 |
| Erro de leitura aparece como ausência de reservas | `listarAgendamentosAtivos` retorna `[]` em qualquer erro | UI-009 |
| DELETE usa identificador diferente do registro real | A seleção usa o objeto da grade fixa; o cancelamento usa `idAgendamento` dele ou a data ISO, sem buscar o id da reserva carregada | UI-005 |
| Remoção indevida de histórico | A tela verifica `ehPassado`, mas a grade não preenche esse campo nem usa `pode_remover` retornado pela API | API-006, UI-007 |
| Vaga no veículo continua ocupada | `AgendamentoRepository.remove_allocations` é um gancho sem efeito até HU-016/018 | API-010 e parte de UI-005 |

**HU-015 — resultados de API e riscos de UI ainda pendentes**

| Risco | Evidência de leitura do build `4ac87b46` | Cobertura |
| --- | --- | --- |
| Campo visível com origem/destino incorretos na volta | `mapearTrecho` usa ponto de desembarque como embarque da complementar; o card da principal rotula `pontoDesembarque` como Origem (IES) na volta | UI-002 |
| Resumo da Agenda mistura complementares distintas | O resumo escolhe nome/conexão por ida ou volta em um único card; conferir AIV com C1 e C2 diferentes | API-002; UI-002 |
| Ônibus/motorista visíveis sem alocação | `CardRotaPrincipal` renderiza ambos os campos com “A definir” quando nulos; o PO determinou ocultá-los | API-003; UI-003 |
| Resumo do Início continua estático | `home.tsx` tem ônibus/linha fixos e botão Ver detalhes sem ação | UI-004 |
| Dados sincronizados só na Agenda não chegam ao detalhe offline | `/meus` e calendário têm caches próprios; detalhe lê somente a chave de detalhe por data | UI-005 |
| Cache antigo reutilizado após recusa HTTP | Serviço de detalhe e Agenda tentam cache em qualquer erro, inclusive resposta 401/403/404 | UI-010 |
| Dados de A aparecem para B | Chaves da lista/calendário/detalhe não incluem conta; `signOut` remove tokens/usuário, sem remover essas chaves | API-005/006; UI-009 |
| Payload muda sem renovar a versão persistida | **Reproduzido na API:** mudança de faculdades atendidas, nome do ponto e nome da IES mantém a versão antiga em AI/AIV e nos três GETs. [Relato local](HU-015/api/issues/BUG-HU015-API-002-versao-desatualizada-detalhe.md); efeito no dispositivo ainda depende de UI | API-007 falhou; UI-007 pendente |
| Erro permanece após retorno de foco com sucesso | A busca da tela define erro no catch; o caminho de sucesso não o limpa explicitamente | UI-007 |
| Mensagem de data inválida difere do BDD | **Reproduzido:** `data=10-11-2026` retorna 422 com texto técnico em inglês, em vez da mensagem em português. [Relato local](HU-015/api/issues/BUG-HU015-API-001-mensagem-data-invalida.md) | API-004 falhou; UI-001/010 pendentes |

## Dependências e critérios de bloqueio

- **HU-015:** usar back e front do mesmo commit `4ac87b46`; o planejamento é entregue para `develop` e referencia esse build da feature. A integração de detalhe já está no código e deve ser conferida em API-001. O resultado da HU-013 em outra feature/commit não bloqueia nem aprova automaticamente este build.
- **Massa HU-015:** a LLM prepara pela API as reservas da HU-013 e os cadastros de rota principal/complementar, pontos e IES; registra ids/datas reais e as mudanças de referência. Se a tela de criação não permitir montar a massa, preparar pela API e registrar a origem.
- **Alocação HU-015:** ausência de veículo/motorista é o estado esperado atual; API-003 e UI-003 verificam nulos/ocultação. API-008 e a parte futura de UI-008 dependem de alocação real HU-016/017/018. Não bloquear os demais casos nem criar objeto simulado para aprovar veículo diário.
- **Offline HU-015:** comprovar sincronização HTTP efetiva antes de desligar a rede. Validar detalhe já aberto e dados completos sincronizados apenas na Agenda; distinguir ausência de cache próprio de cache de outra conta. Teste com mock não aprova consulta offline no dispositivo.
- **HU-014, histórico:** alocação ausente mantém a limitação documentada no CT-HU014-API-010. Os resultados anteriores usam seus próprios SHAs e não são reexecutados nesta revisão.
- Registrar cada parte verificada, falha ou impedimento. Os PRs #378 e #379 alteram telas/serviço compartilhados; revisar o build que vier a ser executado, preservando a rastreabilidade da versão.

## Registro dos resultados

Preencher ambiente/commit, data, resultado obtido, status, resumo, totais e defeitos apenas na execução. Em caso parcialmente verificável, separar o que passou, falhou e ficou bloqueado; não aprovar o caso inteiro se houver impedimento. Preservar o esperado mesmo quando a implementação divergir. Contabilização após a execução da HU-015 em 10/11/2026: **14 passaram, 3 falharam, 1 parcial, 12 bloqueados e 21 pendentes**. Na HU-013, CT-001 falhou por falta de publicação das rotas na feature; os outros 11 casos estão bloqueados por essa causa e não tiveram as regras de negócio exercitadas. Os 10 casos de API da HU-014 foram abordados; o CT-010 ficou parcial porque a integração com alocação real ainda não existe. Na HU-015, API-004 falhou pela mensagem e API-007 pelo versionamento; API-008 está bloqueado pela alocação diária ainda ausente. Os 11 casos de UI da HU-014 e os 10 de UI da HU-015 permanecem pendentes. [Resumo JSON da execução de API da HU-014](HU-014/api/EVIDENCIAS-HU-014.json).

Registrar HTTP e corpo na API, evidências visuais na UI e consultas de persistência quando pedidas. Omitir credenciais, tokens e dados pessoais dos registros. Preparar relatos `.md` após reprodução; publicação no GitHub fica para a etapa de execução e revisão.

A HU-015 mantém **8 casos de API e 10 de UI**. A API foi exercitada no código exato da feature, sem incorporar seu código ao PR de resultados para `develop`. [Suíte com resultados](HU-015/api/API-HU-015.md), [JSON simples](HU-015/api/EVIDENCIAS-HU-015.json) e dois relatos locais de defeito; nenhuma issue foi publicada nesta execução. Sem pastas de executor/evidências, credenciais ou testes de UI executados.
