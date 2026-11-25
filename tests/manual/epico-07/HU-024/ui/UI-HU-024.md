# Testes manuais de UI — HU-024 — Recebimento de Notificações Push

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Comunicação e Mural de Avisos (EP-007) |
| Funcionalidade | HU-024 — Recebimento de Notificações Push |
| Camada | UI — celular ou web |
| Tipo de teste | Funcional manual essencial, integração, estados do aparelho e tratamento de falha — baseado em risco |
| Telas | Mural de Avisos e notificações do aplicativo do aluno (web e celular); tela de Consulta de Alocação aberta pelo toque; publicação de avisos pelo administrador. |
| Base do planejamento | `feature/hu-024-mural-aluno-e-notificacoes` (commit `e15f398a`, [PR #383](https://github.com/GOUOCE/GOUCE-app/pull/383) fechado sem merge), 345 commits atrás da `develop` `1bc67d02`; **o módulo de avisos ainda não está na `develop`** |
| Branch de planejamento | `test/planejamento-api-ui-hu-024`, com entrega para `develop` |
| Revisão do planejamento | 25/11/2026 — requisitos 7.8 com as decisões do PO ([#539](https://github.com/GOUOCE/GOUCE-app/issues/539), sugestões ⭐), BDD do épico 07 e leitura do código das branches |
| Ambiente | A preencher — navegador (versão web) ou celular, URL, SHA do build integrado (`develop` + branch de avisos), fuso America/Fortaleza |
| Total de casos | 10 |
| Última execução | Não realizada |
| Testador | Cauan Ricardo — execução manual; LLM — massa e conferência de API/banco |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 10 | 0 | 0 | 0 | 0 | 10 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | Build integrado (`develop` + branches de avisos) com a migration renumerada. A **versão web** usa a notificação do navegador (com permissão e com o app aberto); o push real só pode ser verificado no **celular** com build nativo. Registrar URL, SHAs, navegador ou aparelho e versão do sistema. |
| PC-02 | Cauan executa a UI; a LLM prepara a massa (administrador, alunos aprovado, pendente, reprovado e com vínculo vencido, avisos e alocações) e confere API/banco depois de cada caso. |
| PC-03 | Usar a massa da [suíte de API](../api/API-HU-024.md) e da [HU-023](../../HU-023/api/API-HU-023.md); para a alteração de alocação, reservas e distribuição de D+1 (HU-016 e HU-019). |
| PC-04 | Para o CT-005 e o CT-006 é preciso poder colocar o aplicativo em segundo plano, fechá-lo e desligar a rede; guardar capturas da tela de bloqueio ou da central de notificações. |
| PC-05 | Os esperados seguem requisitos 7.8, BDD e decisões do PO; os riscos de leitura do [guia da API](../api/README.md) não são defeitos reproduzidos. Toda a suíte está pendente. |

## Resumo da execução

Executar na ordem e registrar cada variação, informando se foi na web ou no celular. A LLM publica os avisos, prepara os estados dos alunos e confere API e banco; os casos 004, 005 e 006 dependem de recursos que o código lido não tem e o 010 depende da sessão do app.

### Seção A — Notificação com o aplicativo aberto

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU024-UI-001 | Solicitação de permissão de notificações | Aluno aprovado entrando no app pela primeira vez no navegador ou aparelho, sem permissão concedida. | O app pede a permissão de notificações ao entrar e guarda a resposta. | ⏳ PENDENTE | BDD: solicitação de permissão. Risco de leitura: o pedido é feito ao entrar na área do aluno, e uma falha da chamada nativa é tratada como permissão concedida. |
| CT-HU024-UI-002 | Aviso publicado chega ao aluno com o aplicativo aberto | Aluno aprovado logado no Mural; o administrador publica “Manutenção na Rota Centro” em outra sessão. | A notificação aparece em poucos segundos, com o nome do app e o título do aviso, e o mural se atualiza sozinho. | ⏳ PENDENTE | BDD: aviso publicado; app aberto. Risco de leitura: consulta a cada 5 segundos; a primeira consulta só marca os avisos antigos como vistos. |
| CT-HU024-UI-003 | Tocar na notificação abre o Mural de Avisos | Notificação de aviso recebida pelo aluno (CT-002), com o aplicativo em outra tela. | O toque abre o Mural de Avisos com o aviso visível. | ⏳ PENDENTE | AC-03. Risco de leitura: o app usa `router.push('/(aluno)/avisos')`; na `develop` o item Avisos da barra é outra tela (`(tabs)/avisos.tsx`). |
| CT-HU024-UI-004 | Alteração de alocação: notificação e abertura da Consulta de Alocação | Aluno A alocado em D+1; a LLM confirma uma nova distribuição manual que muda o ônibus de A; A com o aplicativo aberto. | A recebe “Você foi realocado” com o ônibus novo e, ao tocar, abre a Consulta de Alocação com os dados atualizados. | ⏳ PENDENTE | AC-01, AC-03 e AC-06; decisão 4 do PO (⭐). Risco de leitura: nenhuma alteração dispara o evento e o toque sempre abre os avisos. Esperado falhar até existir; registrar, não aprovar. |

### Seção B — Situações do aparelho

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU024-UI-005 | Aplicativo fechado ou em segundo plano | Aluno aprovado com permissão concedida; app em segundo plano e depois fechado; aviso publicado pelo administrador. | A notificação aparece na tela mesmo com o app fechado ou em segundo plano. | ⏳ PENDENTE | AC-02. Risco de leitura: sem push nativo a notificação só nasce com o app aberto; no navegador, com a aba fechada nada chega. Esperado falhar; registrar, não aprovar. Exige celular. |
| CT-HU024-UI-006 | Aparelho offline: entrega depois da volta da conexão | Aluno aprovado; rede desligada; dois avisos publicados; rede religada. | As notificações retidas são entregues quando a conexão volta, sem perder nem repetir. | ⏳ PENDENTE | FA-001 e RNF-014. Risco de leitura: não há serviço que retenha a mensagem; quem entrega é a consulta a cada 5 segundos, que traz no máximo 5 eventos por vez. |
| CT-HU024-UI-007 | Permissão de notificações desativada | Aluno aprovado com a permissão de notificações negada no navegador ou no sistema; aviso publicado. | Nenhuma notificação é exibida; o aluno vê o aviso ao abrir o Mural. | ⏳ PENDENTE | FA-002. Risco de leitura: a permissão negada ou uma falha ao consultá-la podem ser tratadas como concedida, gerando pedidos repetidos ou erro. |

### Seção C — Destinatários e repetições

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU024-UI-008 | Quem recebe a notificação: aprovado, pendente, reprovado e vínculo vencido | Quatro alunos (aprovado com vínculo válido, pendente, reprovado e com vínculo vencido) e o representante; aviso publicado. | Só o aluno aprovado com vínculo válido recebe a notificação. | ⏳ PENDENTE | Decisão 6 do PO (⭐). Risco de leitura: o app só deixa de monitorar o status “pendente”; reprovado e vencido continuam consultando. Esperado falhar nesses estados. |
| CT-HU024-UI-009 | Rajada de avisos, duplicidade e troca de conta | Sete avisos publicados em menos de 5 segundos; aluno A com o app aberto; aviso editado/inativado depois (se existir); logout de A e login de B no mesmo aparelho. | Todos os avisos aparecem no mural e notificam uma vez; trocar de conta não repete nem esconde notificações. | ⏳ PENDENTE | Risco de leitura: o cliente pede `limite=5` e move o cursor para o maior id, então numa rajada os intermediários podem se perder; os ids já notificados ficam em memória do layout. Decisão 7: edição e inativação não notificam. |
| CT-HU024-UI-010 | Consulta contínua: sessão expirada e várias abas ou aparelhos | Aluno A com o app aberto cuja sessão expira (token vencido ou invalidado); o mesmo aluno em duas abas do navegador e, se possível, em dois aparelhos; aviso publicado. | Sessão expirada é renovada ou leva ao login, sem as notificações pararem em silêncio; cada aviso notifica uma vez por aparelho. | ⏳ PENDENTE | Risco de leitura: o monitoramento consulta a cada 5 segundos e engole qualquer erro, inclusive 401; a duplicidade na web depende só da `tag` da notificação do navegador. |

## Detalhamento dos casos

### Seção A — Notificação com o aplicativo aberto

#### CT-HU024-UI-001 — Solicitação de permissão de notificações

**Técnica/tipo:** Funcional positivo; estado da permissão.

**Dados de entrada:** Aluno aprovado entrando no app pela primeira vez no navegador ou aparelho, sem permissão concedida.

**Passos**

1. Limpar a permissão de notificações do site ou do app.
2. Entrar como aluno aprovado.
3. Observar o pedido de permissão e responder “Permitir”.
4. Sair, entrar de novo e conferir que não pergunta outra vez.

**Resultado esperado**

- O pedido de permissão aparece depois do login do aluno.
- Com “Permitir”, o estado fica concedido e a próxima entrada não pergunta de novo.
- O texto do pedido identifica o aplicativo.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU024-UI-002 — Aviso publicado chega ao aluno com o aplicativo aberto

**Técnica/tipo:** Integração administrador × aluno; tempo de entrega.

**Dados de entrada:** Aluno aprovado logado no Mural; o administrador publica “Manutenção na Rota Centro” em outra sessão.

**Passos**

1. Entrar como aluno, abrir o Mural e aguardar a primeira sincronização.
2. Publicar o aviso pelo administrador e marcar o horário.
3. Contar quanto tempo leva para a notificação aparecer e ler o texto.
4. Conferir o mural sem recarregar.

**Resultado esperado**

- Notificação com “GOUOCE • título” e a mensagem do aviso em até cerca de 5 segundos.
- O aviso aparece no mural sem recarregar a tela.
- Avisos publicados antes de entrar não geram notificação.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU024-UI-003 — Tocar na notificação abre o Mural de Avisos

**Técnica/tipo:** Navegação a partir do evento.

**Dados de entrada:** Notificação de aviso recebida pelo aluno (CT-002), com o aplicativo em outra tela.

**Passos**

1. Com o aluno em outra tela (Agenda), receber a notificação.
2. Tocar na notificação.
3. Conferir a tela aberta, a barra de abas e o aviso.

**Resultado esperado**

- Abre o Mural de Avisos com o aviso novo no topo.
- A barra de abas continua correta e o botão de voltar funciona.
- A tela aberta é a mesma do item Avisos da barra.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU024-UI-004 — Alteração de alocação: notificação e abertura da Consulta de Alocação

**Técnica/tipo:** Integração HU-016 × HU-019 × HU-024.

**Dados de entrada:** Aluno A alocado em D+1; a LLM confirma uma nova distribuição manual que muda o ônibus de A; A com o aplicativo aberto.

**Passos**

1. Abrir o app como A e anotar o ônibus em Início e Agenda.
2. Pedir à LLM a nova distribuição e aguardar até um minuto.
3. Observar a notificação e tocar nela.
4. Comparar a tela aberta com `minha-viagem`.

**Resultado esperado**

- Notificação “Você foi realocado” com o novo ônibus.
- O toque abre a Consulta de Alocação, e não o Mural de Avisos.
- Os dados exibidos são os mais recentes; o aluno B não recebe nada.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção B — Situações do aparelho

#### CT-HU024-UI-005 — Aplicativo fechado ou em segundo plano

**Técnica/tipo:** Estado do aplicativo; lacuna conhecida.

**Dados de entrada:** Aluno aprovado com permissão concedida; app em segundo plano e depois fechado; aviso publicado pelo administrador.

**Passos**

1. Colocar o app em segundo plano (ou trocar de aba do navegador) e publicar um aviso.
2. Fechar o app (ou a aba) e publicar outro aviso.
3. Olhar a tela de bloqueio ou a central de notificações.
4. Abrir o app e conferir o mural.

**Resultado esperado**

- Em segundo plano e com o app fechado, a notificação é exibida pelo sistema do aparelho.
- Ao abrir o app, o mural mostra os avisos.
- Se nada chegar com o app fechado, registrar o resultado e a lacuna do push nativo.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU024-UI-006 — Aparelho offline: entrega depois da volta da conexão

**Técnica/tipo:** Transição online/offline; retenção da mensagem (FA-001).

**Dados de entrada:** Aluno aprovado; rede desligada; dois avisos publicados; rede religada.

**Passos**

1. Desligar a rede do aparelho.
2. Publicar dois avisos pelo administrador.
3. Religar a rede e aguardar.
4. Contar as notificações recebidas e conferir o mural.

**Resultado esperado**

- Depois de religar, as duas notificações chegam, uma vez cada.
- O mural mostra os dois avisos.
- Se alguma se perder, registrar quais.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU024-UI-007 — Permissão de notificações desativada

**Técnica/tipo:** Partição por estado da permissão (FA-002).

**Dados de entrada:** Aluno aprovado com a permissão de notificações negada no navegador ou no sistema; aviso publicado.

**Passos**

1. Negar a permissão do site ou do app nas configurações.
2. Entrar como aluno e publicar um aviso pelo administrador.
3. Observar se aparece notificação, pedido de permissão ou erro.
4. Abrir o Mural de Avisos.

**Resultado esperado**

- Nenhuma notificação do sistema é exibida e não há pedido repetido nem erro visível.
- O aviso aparece no mural quando o aluno abre a tela.
- O aplicativo continua funcionando normalmente.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção C — Destinatários e repetições

#### CT-HU024-UI-008 — Quem recebe a notificação: aprovado, pendente, reprovado e vínculo vencido

**Técnica/tipo:** Tabela de decisão situação do cadastro × recebimento.

**Dados de entrada:** Quatro alunos (aprovado com vínculo válido, pendente, reprovado e com vínculo vencido) e o representante; aviso publicado.

**Passos**

1. Preparar os estados por fixture no banco isolado.
2. Entrar com cada aluno em sessões separadas.
3. Publicar o aviso e observar cada sessão por cerca de 15 segundos.
4. Conferir pela API o que cada token recebe.

**Resultado esperado**

- Só o aluno aprovado com vínculo válido recebe a notificação.
- Pendente, reprovado e vínculo vencido não recebem (e, se o app deles redirecionar para outra tela, a notificação não aparece).
- O representante e o administrador não recebem notificação de aluno.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU024-UI-009 — Rajada de avisos, duplicidade e troca de conta

**Técnica/tipo:** Valor-limite de volume; idempotência; isolamento de estado.

**Dados de entrada:** Sete avisos publicados em menos de 5 segundos; aluno A com o app aberto; aviso editado/inativado depois (se existir); logout de A e login de B no mesmo aparelho.

**Passos**

1. Com A no Mural, pedir à LLM sete publicações seguidas.
2. Contar as notificações e os avisos do mural.
3. Editar e inativar um aviso, se as ações existirem, e conferir que não há nova notificação.
4. Sair e entrar como B, publicar um aviso e conferir as notificações.

**Resultado esperado**

- O mural mostra os sete avisos; as notificações chegam sem repetição (se faltar alguma, registrar qual).
- Edição e inativação não geram nova notificação.
- B recebe só os avisos publicados depois do seu login, sem reaproveitar o estado de A.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU024-UI-010 — Consulta contínua: sessão expirada e várias abas ou aparelhos

**Técnica/tipo:** Resiliência de sessão; idempotência com mais de um cliente.

**Dados de entrada:** Aluno A com o app aberto cuja sessão expira (token vencido ou invalidado); o mesmo aluno em duas abas do navegador e, se possível, em dois aparelhos; aviso publicado.

**Passos**

1. Com A logado, invalidar ou aguardar o vencimento do token e publicar um aviso.
2. Observar se o app renova a sessão, redireciona ao login ou fica mudo; depois de renovar, publicar outro aviso.
3. Abrir A em duas abas e publicar um aviso; contar as notificações exibidas.
4. Se houver um segundo aparelho, repetir com ele.

**Resultado esperado**

- Com a sessão vencida, o app renova a sessão ou pede o login; as notificações não ficam paradas sem aviso ao aluno.
- Depois de renovar, os avisos voltam a notificar, sem repetir os antigos.
- Com duas abas, cada aviso gera uma única notificação visível (sem duplicidade); com dois aparelhos, uma por aparelho.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

## Rastreabilidade

| Critério/regra | Casos UI | Complemento |
| --- | --- | --- |
| AC-01 — disparo por aviso e por alteração de alocação | UI-002, UI-004 | API-001, API-004 |
| AC-02 — app fechado ou em segundo plano | UI-005 | API-009 |
| AC-03 — tela correspondente ao tocar | UI-003, UI-004 | — |
| AC-04 / FA-001 — aparelho offline | UI-006 | API-009 |
| AC-05 / FA-002 — permissão desativada e solicitação | UI-001, UI-007 | — |
| Destinatários e repetições (decisões 6 e 7) | UI-008, UI-009 | API-002, API-003 |
| AC-06 / RN-009 — dados atualizados | UI-004 | API-005 |
| RNF-014 — sessão expirada e várias abas | UI-010 | API-008 |

## Defeitos encontrados

| Caso | Defeito ou dependência | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. Os riscos de leitura estão no [guia de execução da API](../api/README.md) e não são defeitos reproduzidos. | — |

## Observações gerais

- Os casos de celular (005, 006, parte do 003 e do 007) exigem aparelho físico; na web, registrar que o resultado vale só para a notificação do navegador.
- As lacunas conhecidas (push nativo, gatilho de realocação, abertura na tela correta, filtro de destinatários) vêm da decisão do PO na #539 e ficam como casos que tendem a falhar.
- Referências: [requisitos, seção 7.8](../../../../../docs/requisitos.md), [BDD do épico 07](../../../../../bdd/features/epico-07/README.md) e as [decisões do PO na #539](https://github.com/GOUOCE/GOUCE-app/issues/539).
- Nenhum caso foi executado nesta entrega; a leitura do código não aprova caso.
