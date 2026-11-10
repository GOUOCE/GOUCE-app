# Testes manuais de UI — HU-015 — Consulta de Rota Complementar e Transferência

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Agendamento de Transporte — Aluno (EP-004) |
| Funcionalidade | HU-015 — Consulta de Rota Complementar e Transferência |
| Camada | UI — celular ou web |
| Tipo de teste | Funcional manual essencial, integração, consulta offline e isolamento de sessão — baseado em risco |
| Telas | Agenda → reserva → Ver detalhes; resumo do dia no Início; cache local e recuperação de erros. |
| Base do planejamento | `feature/front-hu015` `4ac87b4623b493af2d56012d60b8c3b875c3af7e` ([PR #379](https://github.com/GOUOCE/GOUCE-app/pull/379)) |
| Branch de planejamento | `test/planejamento-api-ui-hu-015-integrado`, com entrega para `develop`; código de referência na feature acima |
| Revisão do planejamento | 10/11/2026 — contrato integrado, BDD e decisões do PO |
| Ambiente | Navegador (versão web) em `http://localhost:3114`, front do PR #379 `4ac87b46`; API da `develop` `735bfdee` em `http://localhost:8014`, banco limpo, fuso America/Fortaleza |
| Total de casos | 10 |
| Última execução | 10/11/2026 (parcial: análise do código; execução na tela em andamento) |
| Testador | Cauan Ricardo — execução manual; LLM — apoio de massa e conferência de API/banco |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ⏳ Em execução (6 reprovados: 5 por leitura do código e 1 na tela) | 10 | 0 | 6 | 0 | 0 | 4 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | Build completo de `feature/front-hu015` no commit `4ac87b46`, com API do mesmo checkout e migrations até 81. Registrar dispositivo/SO ou navegador, URL e SHAs. Os testes anteriores de HU-013/HU-014 em outros commits não comprovam este build. |
| PC-02 | Usuário A e B aprovados com vínculo válido. Cauan executa a UI; a LLM prepara massa e confere API/banco. Usar o mapa AI/AV/AIV/AM1/AM2/AD/BI e C1/C2 da [suíte API](../api/API-HU-015.md), com datas/ids reais. |
| PC-03 | API confirma resumos completos por trecho e `onibus`/`motorista` nulos. Para Início, preparar **AH** em D (dia útil) com complementar, depois direto e sem viagem hoje; não conflitar com outra reserva de A em D. |
| PC-04 | Para offline, sincronizar dados reais e guardar captura antes de desligar a rede. Manter sessão/cache no cenário de reinício; usar perfil de teste separado para ausência de cache. A LLM conserva acesso independente ao servidor. |
| PC-05 | Para erro de cache, a LLM pode preparar JSON inválido somente na chave do ambiente de teste, documentando a intervenção. Se a ferramenta não permitir, bloquear apenas essa variação; não mudar código de produto. |
| PC-06 | Alocação diária futura exige dados reais de veículo/motorista. Até ela existir, validar ocultação correta; as variantes dependentes do épico 5 não são aprovadas por objetos simulados. |
| PC-07 | Esperados seguem requisitos/BDD/PO; riscos de leitura não são bugs reproduzidos. Toda a suíte está pendente: nenhuma tela, API ou teste unitário foi executado nesta revisão do planejamento. |

## Resumo da execução

Executar na ordem e registrar cada variação. Os casos dependentes da alocação futura trazem a dependência no próprio detalhe. Todos permanecem pendentes nesta entrega.

### Seção A — Consulta e apresentação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU015-UI-001 | Abrir os detalhes da reserva selecionada | AI e AV em datas distintas, usuário A; link de detalhes sem `dataIso` e com parâmetro inválido, quando o ambiente permitir. | Agenda abre o dia correto; parâmetros ausentes/inválidos não geram viagem fictícia. | ❌ FALHOU | O erro de uma consulta anterior continua na tela ao abrir uma reserva válida; a seta de voltar leva ao painel. #432, #417 |
| CT-HU015-UI-002 | Transferência clara e correta em cada trecho | AI, AV, AIV, AM1 e AM2; C1 05:45/18:15, C2 06:05/19:10; nome da complementar e ponto de conexão com 150 caracteres em uma variação. | Linha/horário/conexão corretos por trecho, incluindo resumo da Agenda e trajetos mistos. | ❌ FALHOU | Reprovado por leitura do código: resumo da Agenda reaproveita nome e conexão da ida na volta; cartões e rótulos da volta invertidos nos detalhes. #429, #418 |
| CT-HU015-UI-003 | Trajeto direto e ocultação sem alocação | AD direta e AI/AIV com complementar; API confirma `onibus`/`motorista` nulos. | Direto sem complementar; campos de veículo/motorista ocultos quando nulos. | ❌ FALHOU | Reprovado: Veículo e Motorista aparecem como “A definir” (visto na tela na HU-014); a decisão do PO é ocultar. #428 |
| CT-HU015-UI-004 | Resumo da viagem do dia no Início | AH em D com complementar; depois reserva de hoje direta; cenário sem reserva de hoje. Usar dia útil e data real do servidor/aparelho. | Resumo/atalho do dia correspondem à reserva real, com e sem complementar. | ❌ FALHOU | Reprovado por leitura do código: o resumo “Sua viagem hoje” é texto fixo e o botão não faz nada. #427 |

### Seção B — Consulta offline e sincronização

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU015-UI-005 | Consulta offline após sincronizar e reabrir | Duas variações no mesmo usuário: detalhe de AI aberto online; depois uma nova reserva AO preparada pela LLM, cuja informação completa foi sincronizada somente na Agenda por `/meus`, sem abrir seu detalhe antes do offline. | Informações previamente sincronizadas continuam acessíveis após perda de rede e reinício. | ⏳ PENDENTE | Variação 2 reprovada por leitura do código (#430); variação 1 pendente de execução. |
| CT-HU015-UI-006 | Offline sem dados próprios válidos | Reserva nunca sincronizada neste dispositivo; depois chave de teste com JSON inválido/estrutura incompleta. Preparação isolada com apoio da LLM, quando possível. | Indisponibilidade clara sem cache válido; recuperação online sem dados inventados. | ⏳ PENDENTE | BDD: offline sem dados sincronizados; robustez do cache. |
| CT-HU015-UI-007 | Reconectar e atualizar o cache com a versão atual | AI previamente sincronizada; C1 saída alterada de 05:45 para 05:50; depois principal/ponto/IES alterados separadamente por API administrativa. | Reconexão exibe e preserva a última informação real, limpando o estado de erro/offline. | ⏳ PENDENTE | BDD: atualização ao restabelecer conexão; risco de revalidação por atualizado_em. |
| CT-HU015-UI-008 | Separação por data e programação diária | AIV e outra reserva de A com linhas/horários distintos; quando alocação existir, V1 em D1 e V2 em D2 e alteração de D1. | Datas e trechos isolados; veículo diário coberto quando a alocação existir. | ⏳ PENDENTE | BDD: mesmos dados offline, veículo por data e alteração de programação. |

### Seção C — Conta e recusas do servidor

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU015-UI-009 | Isolamento de conta e sessão no cache | AIV de A e BI de B na mesma data, com nomes/pontos distintos; A já sincronizou, B ainda não. | Troca de conta/logout não expõe informações sincronizadas por outro aluno. | ❌ FALHOU | Reprovado: cache de agenda e de detalhes sem dono, logout não limpa (reproduzido na HU-014). #423 |
| CT-HU015-UI-010 | Recusa HTTP e cancelamento conhecido sem falso offline | Detalhe em cache; reserva cancelada em outra sessão; acesso realmente recusado pela API; controle de rede para distinguir HTTP de erro sem resposta. | Recusas reais não viram consulta offline indevida; cancelamento conhecido invalida a viagem. | ❌ FALHOU | Reprovado por leitura do código: recusa HTTP é tratada como offline e mostra a viagem guardada. #431 |

## Detalhamento dos casos

### Seção A — Consulta e apresentação

#### CT-HU015-UI-001 — Abrir os detalhes da reserva selecionada

**Técnica/tipo:** Partição por data/entrada e navegação funcional.

**Dados de entrada:** AI e AV em datas distintas, usuário A; link de detalhes sem `dataIso` e com parâmetro inválido, quando o ambiente permitir.

**Passos**

1. Abrir Agenda, localizar AI e tocar no card ou em Ver detalhes; conferir data/dia da semana.
2. Voltar e abrir AV; comparar com a reserva confirmada pela LLM na API.
3. Na web, conferir uma entrada sem data e uma data inválida. Voltar pelo controle da tela/aparelho.

**Resultado esperado**

- A tela abre a reserva selecionada, com data local correta, sem diferença de um dia por conversão UTC nem dados de outra viagem.
- Mudar a reserva troca os detalhes; indicador de carregamento termina e a tela permite voltar.
- Sem data, exibir erro claro, sem escolher data fixa por padrão. Data inválida não apresenta viagem inventada; registrar mensagem e recuperação.
- Os acessos partem do build completo da feature; link direto auxilia o diagnóstico, mas não substitui o fluxo normal pela Agenda.

**Resultado obtido**

- Sem data (`/agendamento-detalhes`): a tela mostra “Não foi possível carregar a viagem — Data da viagem não informada.”, sem escolher data fixa e com a seta de voltar.
- Data inválida (`?dataIso=abc`): “Data deve estar no formato YYYY-MM-DD.”, com **Tentar novamente** e sem viagem inventada.
- Depois desses erros, ao abrir uma reserva válida pela Agenda, a tela continuou mostrando o erro anterior (#432).
- A seta de voltar da tela de detalhes e da tela de erro leva ao painel, não à Agenda (#417).
- Status: ❌ Falhou. Issues: #432, #417.

---

#### CT-HU015-UI-002 — Transferência clara e correta em cada trecho

**Técnica/tipo:** Tabela trecho × complementar e limite cadastral de texto; funcional e integração.

**Dados de entrada:** AI, AV, AIV, AM1 e AM2; C1 05:45/18:15, C2 06:05/19:10; nome da complementar e ponto de conexão com 150 caracteres em uma variação.

**Passos**

1. Conferir o resumo da complementar nos cards da Agenda e abrir os detalhes de cada reserva.
2. Comparar linha, horário, conexão, principal, pontos e IES com o JSON da API; em AIV conferir C1 e C2 separadamente.
3. Rolar a tela para ler nomes/pontos longos; verificar a descrição da sequência de transferência na ida e na volta.

**Resultado esperado**

- Somente trechos utilizados aparecem. AI mostra Ida e AV Volta; nas viagens mistas, o card de complementar existe apenas no trecho que a utiliza.
- Na ida, C1 mostra saída 05:45; na volta, C2 mostra retorno 19:10. AIV não reutiliza nome/conexão de C1 para C2 no resumo da Agenda nem nos detalhes.
- Linha e ponto exato de conexão são destacados e legíveis. Na ida: ponto de embarque → complementar → conexão → principal → IES. Na volta: IES → principal → conexão → complementar → ponto de desembarque, sem rótulos que invertam origem/destino.
- Nome/ponto com 150 caracteres continuam compreensíveis com quebra de linha/rolagem; não exigir mapa ou regra de antecedência não definidos nos requisitos.

**Resultado obtido**

- Reprovado por leitura do código do commit `4ac87b46`, sem executar a tela.
- O resumo de rota complementar da Agenda usa um nome e uma conexão só (`ida?.nome ?? volta?.nome`): no AIV mostraria “Van 2 - Bairro Novo” e “Trevo do Bairro Novo” também para a volta (C2, Conexão Planalto) (#429).
- Na tela de detalhes, na volta, o cartão da complementar vem antes do da principal e os rótulos estão invertidos: “Ponto de Embarque” da complementar mostra o ponto de desembarque, e “Origem (IES)” da principal mostra o ponto do bairro. A segunda parte foi vista na tela na execução da HU-014 (#418).
- Status: ❌ Falhou (por leitura do código). Issues: #429, #418.

---

#### CT-HU015-UI-003 — Trajeto direto e ocultação sem alocação

**Técnica/tipo:** Partições direto/complementar e alocação ausente; funcional positivo.

**Dados de entrada:** AD direta e AI/AIV com complementar; API confirma `onibus`/`motorista` nulos.

**Passos**

1. Abrir AD após consultar uma viagem com complementar e conferir toda a tela.
2. Abrir AI/AIV e comparar os campos da principal com a resposta real.
3. Retornar à Agenda e conferir que os cards também distinguem os trajetos diretos.

**Resultado esperado**

- AD não mostra seção, nome ou instrução de complementar, preservando os dados reais da principal.
- Com `onibus`/`motorista` nulos, ocultar esses campos em qualquer trajeto. Exibir “A definir” nos campos em vez de ocultá-los diverge da decisão do PO (#389 item 7).
- Os dados essenciais da transferência e da principal continuam visíveis sem esperar o épico 5. A ausência de alocação não é bloqueio deste caso.
- Nenhum card antigo permanece quando a reserva seguinte é direta.

**Resultado obtido**

- Os campos **Veículo** e **Motorista** aparecem como “A definir” sem alocação; foi visto na tela (detalhes de 11/11, na execução da HU-014) e confere com o código. A decisão do PO (#389, item 7) é ocultá-los.
- A reserva direta (AD) não mostra seção de complementar, conforme o código.
- Status: ❌ Falhou. Issue: #428.

---

#### CT-HU015-UI-004 — Resumo da viagem do dia no Início

**Técnica/tipo:** Partição complementar/direto e presença/ausência de viagem do dia; funcional.

**Dados de entrada:** AH em D com complementar; depois reserva de hoje direta; cenário sem reserva de hoje. Usar dia útil e data real do servidor/aparelho.

**Passos**

1. Como A, abrir Início e conferir a seção Sua viagem hoje com a massa confirmada pela LLM.
2. Usar Ver detalhes/atalho oferecido pelo build e comparar a data com a viagem de hoje.
3. Repetir com trajeto direto e sem reserva de hoje, atualizando a tela após cada preparação.

**Resultado esperado**

- Quando o Início oferecer resumo da viagem, ele corresponde à reserva real de D; com complementar, mostra linha, horário e conexão; direto não mostra transferência.
- Sem alocação, não exibir ônibus/motorista fixos. Sem viagem hoje, não apresentar a reserva de amanhã como se fosse de hoje.
- Atalhos oferecidos funcionam e preservam a data. Registrar o cenário do BDD se o resumo continuar estático ou o botão não executar ação.
- AC-01 permite acesso por Agenda ou Início; o BDD inclui explicitamente o resumo no Início. Diferenciar essa cobertura do BDD da aprovação do caminho da Agenda.

**Resultado obtido**

- Reprovado por leitura do código: em `home.tsx`, “Sua viagem hoje” é um cartão fixo (“Ônibus 04 - Placa OCR-1234”, “Rota Centro → UFC | Saída 06:40”) que aparece com ou sem reserva; o botão **Ver detalhes** tem `onPress` vazio e os atalhos do Acesso Rápido não têm ação.
- Status: ❌ Falhou (por leitura do código). Issue: #427.

---

### Seção B — Consulta offline e sincronização

#### CT-HU015-UI-005 — Consulta offline após sincronizar e reabrir

**Técnica/tipo:** Transição online → offline e partição cache de detalhe/cache somente da Agenda.

**Dados de entrada:** Duas variações no mesmo usuário: detalhe de AI aberto online; depois uma nova reserva AO preparada pela LLM, cuja informação completa foi sincronizada somente na Agenda por `/meus`, sem abrir seu detalhe antes do offline.

**Passos**

1. Online, confirmar resposta HTTP real e guardar captura de linha/horário/conexão. A LLM confere que os dados completos vieram do servidor.
2. Desligar a rede do cliente, sair/voltar à Agenda e abrir a mesma reserva.
3. Fechar completamente e reabrir o app ainda offline, mantendo a sessão/cache; repetir para a reserva sincronizada somente pela Agenda.

**Resultado esperado**

- Dados já sincronizados ficam disponíveis offline, iguais à última resposta real, inclusive após reinício, com indicação de dados salvos no dispositivo.
- A navegação offline pela Agenda e seu calendário chega aos detalhes. Quando `/meus` já sincronizou os dados completos, verificar que o detalhe offline não exige uma consulta online adicional apenas para preencher outra chave de cache.
- Sem alteração do servidor durante o offline, linha/horário/conexão permanecem iguais. O banner sozinho não comprova sincronização; dados de exemplo não são aceitos.
- Na web, se o navegador não carregar o próprio app offline, registrar a limitação do ambiente e testar a persistência no celular; cache em memória não comprova reinício.

**Resultado obtido**

- Variação 2 (reserva sincronizada só pela Agenda): reprovada por leitura do código; `obterDetalhesViagem` consulta apenas a chave de detalhes e propaga o erro, sem usar a lista guardada de `/meus` (#430).
- Variação 1 (detalhe aberto online): pendente de execução na tela. Na web, o reinício offline depende de o navegador carregar o app sem rede; se não carregar, registrar a limitação do ambiente.
- Status: ⏳ Pendente (variação 2 ❌).

---

#### CT-HU015-UI-006 — Offline sem dados próprios válidos

**Técnica/tipo:** Partições cache ausente/malformado/incompleto e limite de primeira consulta.

**Dados de entrada:** Reserva nunca sincronizada neste dispositivo; depois chave de teste com JSON inválido/estrutura incompleta. Preparação isolada com apoio da LLM, quando possível.

**Passos**

1. Com o app já carregado e sem cache da reserva, desligar a rede e tentar abrir a viagem.
2. Conferir aviso e tentativa de recuperação; repetir com cache de teste inválido, registrando a preparação.
3. Restaurar a conexão e usar Tentar novamente; reabrir a viagem.

**Resultado esperado**

- Sem dados próprios sincronizados, informar indisponibilidade offline e permitir recuperar a consulta ao reconectar.
- Não usar a viagem de outra data/conta nem exemplo fixo para completar a tela, nem persistir isso como sincronização válida.
- Cache inválido não trava a tela. Se o ambiente não permitir preparar essa variação, registrar apenas ela como bloqueada.
- Após retorno real da API, mostrar os dados atuais e encerrar o erro/carregamento. Nenhum texto exato de indisponibilidade é imposto pelos requisitos.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU015-UI-007 — Reconectar e atualizar o cache com a versão atual

**Técnica/tipo:** Transição online/offline/reconectado e alteração de referência; integração.

**Dados de entrada:** AI previamente sincronizada; C1 saída alterada de 05:45 para 05:50; depois principal/ponto/IES alterados separadamente por API administrativa.

**Passos**

1. Com AI em cache, ficar offline; a LLM muda a referência real no banco por operação administrativa suportada.
2. Voltar à rede e abrir novamente os detalhes; comparar payload e `atualizado_em` com apoio da LLM.
3. Ficar offline de novo e reabrir: conferir se a última informação online foi persistida. Repetir ponto/IES e principal.
4. No cenário sem cache que gerou erro, reconectar e retornar à tela/usando Tentar novamente para conferir limpeza do estado de erro.

**Resultado esperado**

- Após resposta online válida, mostrar 05:50 e a versão atual; remover indicação offline. A nova consulta offline mantém 05:50, não a versão antiga.
- Mesmo resultado para os demais dados visíveis alterados; payload novo com versão antiga não deve deixar informação antiga no próximo offline (API-007).
- Erro transitório anterior não permanece sobre dados recuperados e a tela não fica vazia/carregando indefinidamente.
- Enquanto ainda offline, pode mostrar o último dado conhecido com aviso; não se exige descobrir atualização do servidor sem comunicação.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU015-UI-008 — Separação por data e programação diária

**Técnica/tipo:** Partição por data/trecho e tabela data × programação.

**Dados de entrada:** AIV e outra reserva de A com linhas/horários distintos; quando alocação existir, V1 em D1 e V2 em D2 e alteração de D1.

**Passos**

1. Online, consultar as duas datas e guardar os valores confirmados pela LLM.
2. Offline, alternar entre as reservas, conferir data, trechos e principal/complementar de cada uma.
3. Quando a alocação real existir, comparar ônibus por data e depois da alteração de D1, com apoio de API-008.

**Resultado esperado**

- Cache e tela mantêm os dados de cada data/trecho, sem reutilizar a última viagem aberta como se fosse de todas as datas.
- Com alocação real, V1/D1 e V2/D2 permanecem separados; realocação de D1 aparece após sincronizar e não muda D2.
- Sem alocação, conferir separação dos dados já disponíveis e registrar a parte de veículo como dependência futura; não exigir veículo inventado nem reprovar a ocultação correta.
- A data da tela corresponde ao cache consultado; alternar reservas não mistura conexões/horários.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção C — Conta e recusas do servidor

#### CT-HU015-UI-009 — Isolamento de conta e sessão no cache

**Técnica/tipo:** Transição de sessão e partição por dono; segurança de dados locais.

**Dados de entrada:** AIV de A e BI de B na mesma data, com nomes/pontos distintos; A já sincronizou, B ainda não.

**Passos**

1. Sincronizar como A, sair e entrar como B com rede, sem abrir os detalhes de B.
2. Ficar offline e abrir a mesma data; conferir também a Agenda carregada do cache.
3. Online, sincronizar B e repetir offline; sair e tentar reabrir detalhes por histórico/link direto sem sessão.

**Resultado esperado**

- B nunca recebe dados de A, nem na Agenda nem nos detalhes. Antes de sincronizar B, informar indisponibilidade do cache próprio; depois mostrar só os dados de B.
- Sem sessão, o app protege o acesso às informações locais da viagem. Não exigir estratégia de implementação específica para garantir o isolamento.
- Retornar a A não mistura os dados de B. A revisão de chaves de cache por leitura não substitui a reprodução visual.
- Se a sessão for renovada com sucesso, ela continua válida; distinguir renovação efetiva de acesso indevido.

**Resultado obtido**

- Reprovado: o cache da Agenda sem dono e o logout sem limpeza foram reproduzidos na tela na execução da HU-014 (CT-HU014-UI-010, #423).
- Por leitura do código, a chave dos detalhes (`@GOUOCE:detalhes_viagem_<data>`) também não tem o id do usuário, então B, offline e sem cache próprio, abriria o detalhe guardado por A na mesma data.
- Status: ❌ Falhou. Issue: #423.

---

#### CT-HU015-UI-010 — Recusa HTTP e cancelamento conhecido sem falso offline

**Técnica/tipo:** Partição erro de rede/401/403/404 e transição ATIVO → CANCELADO.

**Dados de entrada:** Detalhe em cache; reserva cancelada em outra sessão; acesso realmente recusado pela API; controle de rede para distinguir HTTP de erro sem resposta.

**Passos**

1. Com a viagem sincronizada, a LLM cancela a reserva em outra sessão; reabrir os detalhes online e confirmar o HTTP real.
2. Repetir com sessão/perfil sem acesso regular, registrando a recusa efetiva, inclusive após tentativa de refresh.
3. Cancelar pelo app quando possível e tentar reabrir a data offline; conferir invalidação de lista, calendário e detalhe.
4. Restaurar conta/massa válida e verificar que é possível recuperar a consulta.

**Resultado esperado**

- 404 de ausência/cancelamento e 401/403 de acesso recusado são tratados de forma coerente; não apresentar dados antigos como viagem ativa sob simples banner offline.
- Cancelamento confirmado pelo próprio app invalida a informação correspondente; a viagem não reaparece ativa ao ficar offline. Não se exige conhecer um cancelamento remoto enquanto não houve nova comunicação.
- Falha real de rede com cache próprio válido continua permitindo a consulta prevista no AC-04; não confundir essa condição com recusa HTTP do servidor.
- Sem cache, mostrar erro/ausência e permitir recuperar; nenhuma resposta recusada produz sucesso fictício.

**Resultado obtido**

- Reprovado por leitura do código: o `catch` de `obterDetalhesViagem` usa o cache em qualquer erro, inclusive 404, 401 e 403, e devolve `isOffline: true`; uma reserva cancelada em outra sessão reapareceria como viagem salva (#431).
- Status: ❌ Falhou (por leitura do código). Issue: #431.

---

## Rastreabilidade

| Critério/regra | Cenários BDD de referência | Casos UI | Complemento API |
| --- | --- | --- | --- |
| AC-01 — destaque e entrada | Dados destacados em Meus Agendamentos; resumo da viagem do dia no Início | 001, 002, 004 | 001, 002 |
| AC-02 — transferência clara | Principal de destino junto à complementar | 002 | 002 |
| AC-01 / #389 item 6 — volta | Horário de retorno no trecho da volta; complementar por trecho | 002 | 002 |
| AC-02 / #389 item 7 — sem alocação | Ônibus/motorista ocultos sem alocação diária | 003 | 003 |
| AC-03 / FA-001 — direto | Seção ocultada no detalhe e no resumo do Início | 003, 004 | 003 |
| AC-04 / FA-002 / RNF-015 — cache | Offline sincronizado; mesmos dados da última consulta; sem sincronização | 005, 006 | Fonte real validada em 001 a 003 |
| AC-04 — reconexão | Atualiza dados quando a conexão é restabelecida | 007 | 007 |
| RN-010 — programação | Veículo por dia e alteração de veículo | 008, parte futura | 008, dependente do épico 5 |
| RF-029 — dados próprios | Recurso de outro aluno; lista restrita | 009 | 005, 006 |
| RF-029 — recurso recusado | Data sem ativo/cancelado; perfis sem acesso; sem token | 001, 010 | 004 a 006 |
| Robustez de integração | Cache da Agenda sem detalhe, cache inválido, troca de conta e distinção rede/HTTP | 005, 006, 009, 010 | Cobertura adicional orientada pelo código |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-001 | Depois de um erro na tela de detalhes, abrir uma reserva válida continua mostrando o erro anterior; a seta de voltar leva ao painel. | #432, #417 |
| CT-002 | O resumo da Agenda reaproveita nome e conexão da ida na volta; na volta, os rótulos e a ordem dos cartões estão invertidos. | #429, #418 |
| CT-003 | Veículo e Motorista aparecem como “A definir” sem alocação; o PO decidiu ocultar. | #428 |
| CT-004 | O resumo “Sua viagem hoje” do Início é texto fixo e o botão não faz nada. | #427 |
| CT-005 | Offline, o detalhe de uma reserva sincronizada só pela Agenda dá erro. | #430 |
| CT-009 | O cache de agenda e de detalhes não tem dono, e o logout não o apaga. | #423 |
| CT-010 | Recusa do servidor (404, 401, 403) é tratada como offline e mostra a viagem guardada. | #431 |

## Fontes e observações

- [Requisitos, seção 7.5.3](../../../../../docs/requisitos.md): AC-01 a AC-04, FA-001/002, RN-010, RF-029 e RNF-015.
- [BDD HU-015](../../../../../bdd/features/epico-04/HU-015.feature) e [README do BDD](../../../../../bdd/features/epico-04/README.md), presentes neste checkout; os títulos na rastreabilidade correspondem aos cenários reais. Não foram modificados nesta entrega.
- [Resposta do PO na #389](https://github.com/GOUOCE/GOUCE-app/issues/389#issuecomment-6756236002), itens 6 e 7: saída na ida, retorno na volta e campos de ônibus/motorista ocultos sem alocação.
- [PR #379](https://github.com/GOUOCE/GOUCE-app/pull/379), branch `feature/front-hu015`, commit **`4ac87b4623b493af2d56012d60b8c3b875c3af7e`**, com backend e front no mesmo checkout.
- [Suíte de API](../api/API-HU-015.md). Preparação e conferência pela LLM não substituem a observação manual da UI por Cauan.
- Os cenários do BDD para Início são explicitamente cobertos, mesmo que o caminho básico do AC-01 possa ser atendido pela Agenda.
- Alocação ausente implica ocultar campos atualmente, conforme o PO; exibição de veículo por data é dependência futura, não motivo para bloquear os demais cenários.
- **Execução de 10/11/2026 (parcial):** os CT-002, 003, 004, 009 e 010 foram reprovados por leitura do código do commit `4ac87b46`, a pedido do testador, para não gastar execução manual em falhas já evidentes; a evidência de cada um está no detalhamento, e a execução na tela será refeita no reteste. O CT-001 foi executado na tela e reprovado; os CT-006, 007 e 008 e a variação 1 do CT-005 seguem pendentes de execução manual. A decisão sobre qual front vale (PR #378 ou #379) cabe ao time.
- Registrar dispositivos, mensagens e resultado de cada variação somente durante a execução. Evidências futuras em JSON simples, sem pastas de executor/evidências. Nenhuma execução ou issue faz parte desta revisão do planejamento.
