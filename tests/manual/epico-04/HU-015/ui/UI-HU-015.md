# Testes manuais de UI — HU-015 — Consulta de Rota Complementar e Transferência

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Agendamento de Transporte — Aluno (EP-004) |
| Funcionalidade | HU-015 — Consulta de Rota Complementar e Transferência |
| Camada | UI — celular ou web |
| Tipo de teste | Funcional manual essencial, integração, consulta offline e isolamento de cache — baseado em risco |
| Tela | Agenda → dia agendado → Ver detalhes → `agendamento-detalhes`; entrada pelo Início quando disponível |
| Ambiente | A preencher — aparelho/SO ou navegador, URL, SHAs do front/API, fuso; front analisado no PR #379 `b2111a9c`, backend `develop` `99bbf2c6` |
| Total de casos | 9 |
| Última execução | Não realizada |
| Testador | Cauan Ricardo — execução manual; LLM — massa e conferência de API/banco |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 9 | 0 | 0 | 0 | 0 | 9 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | Build do [PR #379](https://github.com/GOUOCE/GOUCE-app/pull/379), branch `feature/front-hu015`, com os SHAs anotados. A branch de planejamento só contém documentação. |
| PC-02 | Alunos A e B aprovados com vínculo válido; contas e reservas diferentes. A LLM confirma respostas reais da API e dados de origem; não usar o protótipo como massa sincronizada. |
| PC-03 | Reservas de A: AI (só ida com C1), AV (só volta com C2), AIV (ida com C1 e volta com C2), AD (direta); B tem BI em uma das mesmas datas de A. Datas válidas e atuais, pontos/horários/linhas distintos entre si e do fallback do PR. Mapa da massa no [guia API](../api/README.md). |
| PC-04 | Consulta integrada com dados reais de horário, linha, conexão e programação do dia para comprovação dos AC-01/02/03. Na análise, o caminho `/agendamentos/detalhes?data=...` chamado pelo PR não existe no backend, que expõe ids/nomes em `/transporte/agendamentos/{id}`. Não aprovar UI com fallback após 404. |
| PC-05 | Para RN-010, alocação real em D1/D2 com veículos distintos quando implementada; LLM prepara e registra. Sem alocação, verificar os demais dados e registrar separadamente o impedimento. |
| PC-06 | Controle da rede do cliente e acesso online independente da LLM para conferir o servidor. Após sincronizar de verdade, manter sessão local ao testar offline; não limpar dados do app no cenário que exige preservar cache. |
| PC-07 | Para primeiro acesso sem cache, usar perfil de navegador/app de teste separado ou remover somente os dados de teste pertinentes. Para cache inválido, a LLM pode preparar valor malformado na chave de teste via ferramenta de desenvolvimento, documentando a intervenção; nunca alterar código de produto nem dados compartilhados. |

## Resumo da execução

Executar na ordem, restaurando rede e massa entre cenários. O banner offline sozinho não prova que dados reais foram sincronizados. Registrar cada parte que falhar ou depender de integração ainda ausente.

### Seção A — Consulta e apresentação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU015-UI-001 | Abrir a viagem selecionada | Agenda → AI/AV; Início quando disponível | Data e reserva corretas; navegação funcional, sem data fixa | ⏳ PENDENTE | Não executado. |
| CT-HU015-UI-002 | Dados claros da transferência por trecho | AI, AV e AIV com C1/C2 distintas | Linha, horário, conexão e principal legíveis e coerentes com cada trecho | ⏳ PENDENTE | Depende de detalhe completo real. |
| CT-HU015-UI-003 | Trajeto direto | AD sem complementar | Nenhuma seção de complementar; somente principal/veículo/motorista reais | ⏳ PENDENTE | Não executado. |

### Seção B — Consulta offline e atualização

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU015-UI-004 | Offline após sincronização e reinício | AI sincronizada; rede desligada; reabrir app | Mesmos dados persistidos, aviso de cache e sem dependência de servidor | ⏳ PENDENTE | Não executado. |
| CT-HU015-UI-005 | Offline sem cache ou com cache inválido | Data nunca sincronizada; conteúdo inválido em cache de teste | Indisponibilidade clara, sem exemplos/viagem de outra data nem travamento | ⏳ PENDENTE | Não executado. |
| CT-HU015-UI-006 | Atualizar informação e invalidar viagem indisponível | Atualização online, complementar → direto e cancelamento conhecido | Tela/cache passam a refletir os dados confirmados; cancelada não reaparece como ativa | ⏳ PENDENTE | Não executado. |
| CT-HU015-UI-007 | Cache separado por data e operação | D1/D2 com veículos/horários diferentes; alternar online/offline | Cada data/trecho mantém a programação correspondente | ⏳ PENDENTE | Veículo diário depende de alocação. |

### Seção C — Conta e erros do servidor

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU015-UI-008 | Isolamento após troca de conta | A sincroniza → sair → B na mesma data, offline/online | Nenhum dado de A visível a B ou sem sessão | ⏳ PENDENTE | Não executado. |
| CT-HU015-UI-009 | Recusa HTTP sem falso offline | Sessão recusada ou viagem ausente; cache anterior | Trata autenticação/ausência; não apresenta recusa como sincronização válida | ⏳ PENDENTE | Cache após falha de rede continua coberto pelo CT-004. |

## Detalhamento dos casos

### Seção A — Consulta e apresentação

#### CT-HU015-UI-001 — Abrir a viagem selecionada

**Técnica/tipo:** partição por entrada/data e navegação funcional.

**Dados de entrada:** AI e AV em datas atuais diferentes; viagem do dia no Início, se existir no build.

**Passos**

1. Entrar como A e ir à Agenda; selecionar AI e tocar em **Ver detalhes**.
2. Conferir data/dia da semana, voltar e abrir AV; comparar com os ids/datas confirmados pela LLM.
3. Abrir a viagem pelo Início se o build oferecer o atalho; conferir que corresponde à viagem do dia e não a uma data padrão.

**Resultado esperado**

- A Agenda abre os detalhes da reserva selecionada, com data real; voltar permite selecionar outra reserva sem repetir os detalhes anteriores (AC-01, RF-029).
- Sem data fixa `2026-09-01` ou datas impossíveis, sem rota inexistente e sem usar viagem de demonstração para completar a tela.
- O requisito permite entrada por Meus Agendamentos **ou** Início: um caminho funcional satisfaz a entrada. Registrar separadamente atalho oferecido que não funcione; não exigir duas entradas como novo critério obrigatório.
- Se a grade fixa impedir alcançar uma reserva atual, registrar o impedimento. Link direto pode ajudar a investigar, mas não substitui aprovação da navegação normal.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU015-UI-002 — Dados claros da transferência por trecho

**Técnica/tipo:** tabela de decisão ida/volta × complementar; funcional, integração e legibilidade.

**Dados de entrada:** AI/AV/AIV, C1/C2 com nomes, conexões e horários distintos. Preparar nome e ponto de conexão com 150 caracteres (limite cadastral válido) em uma variação para conferir leitura completa no aparelho, sem modificar dados compartilhados.

**Passos**

1. Abrir cada reserva por **Ver detalhes** e capturar o que a tela apresenta.
2. Comparar com a LLM nome da linha, horário do trecho, ponto exato de conexão e dados da principal/programação diária.
3. Em AIV, localizar as informações de ida e volta e distinguir as duas complementares. Rolar a tela e conferir leitura completa do ponto e horário.

**Resultado esperado**

- A complementar aparece destacada, com nome da linha, horário correto da Van/Micro-ônibus e ponto exato de conexão; embarque inicial e conexão são distinguíveis (AC-01/02).
- Ida não usa horário de retorno; volta não repete automaticamente a saída da ida. AIV preserva a informação de cada trecho, sem apresentar somente Ida para uma viagem com duas transferências diferentes.
- Dados da principal ajudam a identificar o ônibus de conexão; veículo corresponde à operação diária quando a alocação estiver disponível (RN-010).
- Texto longo pode quebrar linha/rolar, mas não deixa conexão, linha ou horário ilegíveis. Não exigir mapa, instrução textual extra ou padrão visual ausente do requisito.
- Comparação precisa ser com dados reais do servidor; um card com “Van 2 - Bairro Novo” após falha HTTP não comprova a consulta. Sem detalhe completo/alocação, registrar as partes afetadas.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU015-UI-003 — Trajeto direto

**Técnica/tipo:** partição com/sem complementar; funcional positivo.

**Dados de entrada:** AD confirmada na API com complementares nulas, sem alterar parâmetros de URL para forçar a regra.

**Passos**

1. Abrir AD pelo fluxo normal da Agenda; conferir toda a tela.
2. Pedir à LLM para confirmar a classificação direta e os dados da operação principal.
3. Repetir depois de consultar uma reserva com complementar, verificando que o card anterior não permanece.

**Resultado esperado**

- Ocultar completamente a seção de complementar e instrução de transferência; mostrar somente informações reais do ônibus/motorista da principal quando alocados (AC-03, FA-001).
- A regra decorre da reserva, não de `semComplementar=true` nem do valor padrão `temComplementar=true` do serviço. Não mostrar dados antigos de C1/C2.
- Falta da alocação limita a conferência de ônibus/motorista; ainda é possível avaliar separadamente se a seção de complementar foi ocultada corretamente.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção B — Consulta offline e atualização

#### CT-HU015-UI-004 — Offline após sincronização e reinício

**Técnica/tipo:** transição online → offline; persistência do cache e recuperação.

**Dados de entrada:** AI carregada por resposta HTTP bem-sucedida, com informação real distinta do protótipo; sessão local válida.

**Passos**

1. Online, abrir AI e guardar captura/valores. A LLM confirma resposta HTTP e dados de origem; se necessário, confere a existência do cache de teste sem expor credenciais.
2. Desligar a rede do cliente e consultar AI novamente.
3. Fechar o app completamente e reabrir ainda offline; na web, recarregar a página se a aplicação já puder ser carregada offline.
4. Voltar à mesma viagem e comparar todos os dados; depois restaurar a rede.

**Resultado esperado**

- Nome, horário, conexão e informação principal previamente sincronizados continuam disponíveis sem internet e após reinício, sem substituição por exemplos (AC-04, FA-002, RNF-015).
- O PR prevê aviso **“Visualização Offline (Dados salvos no dispositivo)”**; conferir indicação de cache. O texto exato do banner é referência da implementação, não frase obrigatória do requisito.
- Não é necessário que a API responda enquanto offline. Se o navegador não puder nem carregar o app offline, registrar a limitação do ambiente e executar a persistência no celular; não tratar teste só em memória como prova de persistência local.
- Sem uma sincronização real anterior, registrar o bloqueio deste caso e executar CT-005; fallback guardado após erro não conta como sincronização.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU015-UI-005 — Offline sem cache ou com cache inválido

**Técnica/tipo:** partições cache válido/ausente/inválido e limite de primeira consulta; integração negativa.

**Dados de entrada:** perfil/app de teste sem cache de AI; depois chave de cache de teste com JSON malformado ou estrutura sem campos obrigatórios, preparada pela LLM em ambiente isolado.

**Passos**

1. Sem sincronizar AI, desligar a rede e tentar consultar seus detalhes no app já aberto.
2. Conferir se aparece indisponibilidade ou alguma viagem inventada; reabrir para verificar se exemplos foram persistidos.
3. Repetir com conteúdo inválido na chave de teste; anotar como a massa foi preparada. Se o ambiente não permitir intervir no cache, registrar essa variação bloqueada.

**Resultado esperado**

- Sem dados previamente sincronizados, informar que as informações não estão disponíveis offline; não exibir viagem de exemplo, outra data ou outro aluno como alocação real (limite de AC-04/RNF-015).
- Cache inválido não derruba a tela nem vira prova de viagem válida; permitir recuperar a consulta quando a rede voltar.
- Não persistir o fallback do protótipo como se viesse do servidor. A mensagem exata de indisponibilidade não foi definida nos requisitos; registrar a utilizada sem inventar texto obrigatório.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU015-UI-006 — Atualizar informação e invalidar viagem indisponível

**Técnica/tipo:** transição de estado e atualização de cache; integração com HU-013/014.

**Dados de entrada:** AI previamente sincronizada; alteração de ponto/horário/programação por fluxo permitido, depois reserva do mesmo dia alterada para direta e por fim cancelada.

**Passos**

1. Com apoio da LLM, alterar os dados efetivos da viagem em ambiente de teste por operação real e documentar a origem. Online, sair e abrir novamente o detalhe; comparar com a API.
2. Offline, reabrir e conferir que o último conjunto sincronizado substituiu o anterior.
3. Online, a LLM altera a reserva para direta pela HU-013; abrir novamente e depois consultar offline.
4. Online, cancelar pela HU-014 e fazer o app consultar/receber a confirmação de ausência; voltar a ficar offline e tentar reabrir a viagem.

**Resultado esperado**

- Após nova resposta online válida, tela e cache refletem o novo ponto/horário/dados; trajeto que virou direto deixa de mostrar complementar, inclusive na consulta offline seguinte (AC-03/04, RN-010).
- Cancelamento conhecido pelo app não reaparece como viagem ativa por reutilização do cache. Mostrar ausência/indisponibilidade coerente, sem recuperar um roteiro que o servidor já recusou.
- Enquanto totalmente offline, não se exige descobrir alterações ainda desconhecidas do servidor: pode exibir o último dado sincronizado, identificado como tal. A conclusão deste teste depende de reconexão e consulta efetiva antes de avaliar a invalidação.
- Sem fluxo real para alterar programação, registrar esse trecho bloqueado e verificar as transições de reserva disponíveis; não simular atualização apenas editando o cache.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU015-UI-007 — Cache separado por data e operação

**Técnica/tipo:** partição por data/trecho e tabela de decisão por programação; integração e cache.

**Dados de entrada:** D1 e D2 com horários/pontos diferentes; mesma linha complementar operada por V1 em D1 e V2 em D2 quando a alocação existir; AIV tem complementares diferentes por trecho.

**Passos**

1. Online, abrir D1 e D2 e guardar os detalhes confirmados pela LLM.
2. Desligar a rede e alternar a consulta entre as datas; reabrir AIV para conferir ida e volta.
3. Comparar data exibida, programação, principal e transferências com cada captura online.

**Resultado esperado**

- Cada data mantém seu próprio último conjunto sincronizado, sem reutilizar a última viagem consultada para todas as datas (AC-04, RNF-015).
- O veículo acompanha a programação do respectivo dia; mesma linha não significa mesmo veículo permanente (RN-010).
- Ida e volta distintas não se fundem em um único horário/ponto. Se a alocação faltar, verificar separação por data/trechos e registrar apenas a parte de veículo diário bloqueada.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção C — Conta e erros do servidor

#### CT-HU015-UI-008 — Isolamento após troca de conta

**Técnica/tipo:** transição de sessão e partição por dono; isolamento de dados locais.

**Dados de entrada:** A e B com viagens diferentes na mesma data; cache de A previamente sincronizado no mesmo aparelho/perfil de navegador.

**Passos**

1. Como A, sincronizar sua viagem; sair da conta e entrar como B ainda online, sem abrir os detalhes de B.
2. Ficar offline e abrir a viagem da mesma data; verificar o que aparece antes de B ter sincronizado.
3. Online, sincronizar a viagem de B e repetir offline; depois sair e tentar reabrir os detalhes pelo histórico/link direto sem sessão.

**Resultado esperado**

- Antes de sincronizar B, nunca mostrar dados de A. Depois de sincronizar B, exibir apenas os de B (consulta pessoal prevista na HU-015; integração com controle de acesso).
- Sem sessão, bloquear o acesso aos detalhes protegidos. O cache precisa preservar o isolamento por conta, qualquer que seja a estratégia adotada, sem impor implementação específica.
- A chave de cache do PR usa somente a data: registrar a exposição se reproduzida; uma chave compartilhada por leitura de código é risco, não evidência de execução.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU015-UI-009 — Recusa HTTP sem falso offline

**Técnica/tipo:** partição falha de rede/recusa HTTP e recuperação; integração negativa.

**Dados de entrada:** cache válido de uma viagem; rede disponível; sessão realmente recusada pela API ou reserva cancelada em outra sessão. Usar respostas reais, com a LLM anotando HTTP/estado.

**Passos**

1. Preparar sessão sem acesso regular ou encerrada pelo fluxo real disponível; tentar abrir os detalhes com o cliente conectado. Se o refresh renovar a sessão com sucesso, essa tentativa não conta como recusa de autenticação.
2. Com sessão válida novamente, sincronizar outra reserva; a LLM a cancela em outra sessão. Reabrir os detalhes online e conferir a resposta de ausência.
3. Restaurar acesso/massa válida quando necessário e abrir novamente; comparar com o servidor.

**Resultado esperado**

- Recusa de acesso pede autenticação/informa bloqueio conforme o estado; ausência confirmada da viagem é tratada como ausência, sem detalhes inventados.
- Não classificar qualquer HTTP 401/403/404 como “sem internet” nem apresentar dados protegidos/viagem cancelada como informação ativa e atualizada. Falha real de rede com dados sincronizados continua coberta pelo CT-004.
- Cache só deve sustentar a consulta permitida de informações previamente disponibilizadas; o banner offline não mascara erro de contrato nem comprova sucesso da API (AC-04/RNF-015 e controle de acesso).
- Na base analisada, o caminho ausente pode resultar em erro de integração; registrar esse resultado separadamente de ausência de reserva. Não usar 404 de rota inexistente para aprovar o tratamento de viagem cancelada.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Rastreabilidade

| Critério/regra | Casos UI | Complemento API |
| --- | --- | --- |
| AC-01 — informação destacada da complementar | 001, 002 | API-001, API-002, API-004 |
| AC-02 — clareza para a transferência | 002 | API-004, API-005 |
| AC-03 / FA-001 — somente principal no trajeto direto | 003, 006 | API-003 |
| AC-04 / FA-002 — consulta offline sincronizada | 004 a 009 | API fornece origem; persistência local verificada aqui |
| RN-010 — veículo/programação da operação | 002, 006, 007 | API-004, API-005 |
| RF-029 — consulta da própria viagem | 001 a 003, 008, 009 | API-002, API-003, API-006, API-007 |
| RNF-015 — informação previamente disponibilizada offline | 004, 005, 006, 007 | Não comprovado somente por GET ou mock |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. Riscos de leitura estão no índice do épico. | — |

## Observações gerais

- Referências: [requisitos, seção 7.5.3](../../../../../docs/requisitos.md), [PR #379](https://github.com/GOUOCE/GOUCE-app/pull/379), [suíte API](../api/API-HU-015.md) e [índice com fontes/riscos](../../README.md).
- Sem BDD da HU-015 na base analisada; revisar a rastreabilidade quando ele for adicionado. O planejamento atual segue os quatro critérios de aceite e as duas alternativas dos requisitos.
- Cache, datas e credenciais devem pertencer ao ambiente de teste. Relatos reproduzidos serão registrados em `ui/issues/` durante a execução, sem dados pessoais/tokens.
- Não confundir visual de protótipo, teste unitário com mock ou leitura do código com aprovação manual. Todos os nove casos permanecem pendentes nesta entrega.
