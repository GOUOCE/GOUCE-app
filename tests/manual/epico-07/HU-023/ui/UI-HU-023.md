# Testes manuais de UI — HU-023 — Publicação de Avisos

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Comunicação e Mural de Avisos (EP-007) |
| Funcionalidade | HU-023 — Publicação de Avisos |
| Camada | UI — celular ou web |
| Tipo de teste | Funcional manual essencial, integração administrador × aluno e tratamento de falha — baseado em risco |
| Telas | Início e Mais do administrador → lista de avisos e formulário de novo aviso; Mural de Avisos do aluno. |
| Base do planejamento | `feature/hu-023-publicacao-de-avisos` (commit `5466b1de`, [PR #382](https://github.com/GOUOCE/GOUCE-app/pull/382) fechado sem merge), 345 commits atrás da `develop` `1bc67d02`; **o módulo de avisos ainda não está na `develop`** |
| Branch de planejamento | `test/planejamento-api-ui-hu-023`, com entrega para `develop` |
| Revisão do planejamento | 25/11/2026 — requisitos 7.8 com as decisões do PO ([#539](https://github.com/GOUOCE/GOUCE-app/issues/539), sugestões ⭐), BDD do épico 07 e leitura do código das branches |
| Ambiente | A preencher — navegador (versão web) ou celular, URL, SHA do build integrado (`develop` + branch de avisos), fuso America/Fortaleza |
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
| PC-01 | Build integrado (`develop` + branch de avisos) com a migration renumerada; sem ele a tela de avisos do administrador não existe na `develop` e os casos ficam bloqueados. Registrar URL, SHAs e navegador. |
| PC-02 | Cauan executa a UI; a LLM prepara a massa (administradores, alunos aprovado, pendente e representante, avisos de apoio) e confere API/banco depois de cada caso. |
| PC-03 | Usar a massa da [suíte de API](../api/API-HU-023.md): administrador A1, aluno aprovado, aluno pendente e representante. |
| PC-04 | Os esperados seguem requisitos 7.8, BDD e decisões do PO; os riscos de leitura do [guia da API](../api/README.md) não são defeitos reproduzidos. Toda a suíte está pendente. |

## Resumo da execução

Executar na ordem e registrar cada variação. A LLM prepara a massa e confere API e banco depois dos casos de publicação; os casos 006 e 007 dependem de recursos que o código lido não tem.

### Seção A — Administrador

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU023-UI-001 | Acesso pelo menu ao mural de avisos | Administrador autenticado; menu Início e aba Mais. | Item do menu para o mural de avisos com o nome do requisito e a lista com o botão de novo aviso. | ⏳ PENDENTE | Risco de leitura: o item se chama “Notificações” (“gerenciar avisos e comunicados globais”) e o requisito pede “Mural de Avisos” ou “Comunicados”. BDD: acesso pelo menu; AC-01. |
| CT-HU023-UI-002 | Publicar um aviso e vê-lo na lista | Administrador; título “Manutenção na Rota Centro” e descrição “O ônibus V1 passa por manutenção na quinta-feira.”; duplo toque rápido no botão. | Popup de sucesso, aviso no topo da lista, uma única linha no banco e campos limpos ao reabrir o formulário. | ⏳ PENDENTE | Risco de leitura: o botão se chama “Salvar aviso” e o BDD fala em “Publicar”; a mensagem vem com ponto final. BDD: administrador publica; AC-03. |
| CT-HU023-UI-003 | Campos obrigatórios e preenchidos só com espaços | Formulário vazio; só o título; só a descrição; “   ” em cada campo. | Publicação bloqueada com a mensagem sob o campo; nada gravado; corrigir e publicar funciona. | ⏳ PENDENTE | BDD: bloqueia quando o campo não é preenchido; só espaços vale como vazio; FA-001. |
| CT-HU023-UI-004 | Limites de tamanho do título e da descrição | Título com 2, 3, 150 e 151 caracteres; descrição com 2, 3, 2000 e 2001; texto colado de uma só vez. | Abaixo de 3 caracteres, mensagem de tamanho mínimo; acima do máximo, recusado ou impedido com aviso claro. | ⏳ PENDENTE | Risco de leitura: os campos usam `maxLength` 150 e 2000, que corta o texto sem mensagem; conferir se o administrador percebe o corte. BDD: valor-limite; FA-001. |
| CT-HU023-UI-005 | Lista de avisos: ordem, busca e estado vazio | Quatro avisos (um com texto de 150 e 2000 caracteres e outro com `<b>negrito</b>`, aspas, emoji e quebras de linha); aviso publicado às 23h50; 200 avisos; busca por “manut”, “GREVE” e termo inexistente; lista sem avisos. | Do mais recente ao mais antigo; busca por parte do título; mensagem de vazio; textos longos sem estourar o cartão. | ⏳ PENDENTE | Risco de leitura: o texto vazio da lista é “Nenhum aviso publicado encontrado.”. BDD: lista de avisos publicados. |
| CT-HU023-UI-006 | Editar e inativar um aviso pela tela | Aviso publicado; procurar a ação de editar e de inativar em cada cartão da lista. | A tela oferece editar (formulário preenchido) e inativar (com confirmação), e o mural do aluno acompanha na hora. | ⏳ PENDENTE | Risco de leitura: o cartão não tem ação de editar nem de inativar e a API não tem rota; decisão 1 do PO (⭐). Se faltar, registrar bloqueio por dependência; não aprovar. BDD: edita e inativa; FA-002. |

### Seção B — Aluno e falhas

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU023-UI-007 | Aluno vê o aviso publicado no Mural de Avisos | Aluno aprovado; avisos publicados antes e depois de abrir a tela (um com `<script>`, emoji e quebras de linha); busca; mural vazio. | O mural mostra os avisos ativos, o aviso novo aparece sem recarregar e o vazio tem mensagem própria. | ⏳ PENDENTE | Risco de leitura: no branch o mural fica em `(aluno)/avisos.tsx`, fora das abas, e na `develop` o item Avisos da barra é um stub; conferir qual tela o aluno realmente abre. BDD: aluno visualiza os avisos; mural vazio. |
| CT-HU023-UI-008 | Acesso restrito: aluno, representante e sem sessão | Aluno aprovado, representante e sem sessão; endereços diretos da lista e do formulário de avisos do administrador. | Menu sem gerenciamento de avisos; endereço direto negado ou redirecionado ao login. | ⏳ PENDENTE | BDD: menu de gerenciamento não é exibido para quem não é administrador; RN-006. |
| CT-HU023-UI-009 | Falha de comunicação ao publicar, listar e abrir o mural | Rede desligada ao publicar, ao abrir a lista do administrador e ao abrir o mural do aluno; religar e repetir. | Erro explícito, nenhuma publicação falsa, nada gravado e a repetição funciona. | ⏳ PENDENTE | Risco de leitura: o erro de conexão usa o título “Erro de Conexão”; a publicação com falha mostra “Aviso” e a mensagem do servidor. BDD: padrões de erro do front. |

## Detalhamento dos casos

### Seção A — Administrador

#### CT-HU023-UI-001 — Acesso pelo menu ao mural de avisos

**Técnica/tipo:** Funcional positivo e navegação; consistência de rótulos.

**Dados de entrada:** Administrador autenticado; menu Início e aba Mais.

**Passos**

1. Entrar como administrador e olhar o Início e a aba Mais.
2. Abrir o item de avisos pelos dois caminhos.
3. Conferir o título da tela, o campo de busca e o botão de novo aviso.

**Resultado esperado**

- O menu leva à lista de avisos pelos dois caminhos, com o nome previsto no requisito (“Mural de Avisos” ou “Comunicados”).
- A tela mostra a lista de avisos publicados, a busca por título e a ação de criar um aviso.
- A divergência de nome, se existir, fica registrada.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU023-UI-002 — Publicar um aviso e vê-lo na lista

**Técnica/tipo:** Funcional positivo; integração com persistência; clique duplo.

**Dados de entrada:** Administrador; título “Manutenção na Rota Centro” e descrição “O ônibus V1 passa por manutenção na quinta-feira.”; duplo toque rápido no botão.

**Passos**

1. Abrir o formulário de novo aviso e preencher os dois campos.
2. Tocar duas vezes seguidas no botão de publicar.
3. Ler o popup e voltar para a lista.
4. Reabrir o formulário e comparar a API/banco (autor e quantidade de linhas).

**Resultado esperado**

- Popup de sucesso com “Aviso publicado com sucesso”, em popup padrão do app e sem toast preto.
- O aviso aparece no topo da lista; no banco há uma só linha, com o administrador como autor.
- O formulário reaberto vem vazio.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU023-UI-003 — Campos obrigatórios e preenchidos só com espaços

**Técnica/tipo:** Partição de classes inválidas; validação de formulário.

**Dados de entrada:** Formulário vazio; só o título; só a descrição; “   ” em cada campo.

**Passos**

1. Tocar em publicar com o formulário vazio.
2. Repetir com um só campo preenchido e com espaços nos dois.
3. Preencher corretamente e publicar.
4. Conferir que nada foi gravado nas tentativas bloqueadas.

**Resultado esperado**

- “Título é obrigatório.” e “Descrição é obrigatória.” sob os campos correspondentes, sem popup de sucesso.
- Só espaços é tratado como vazio.
- Nada é gravado até o preenchimento correto.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU023-UI-004 — Limites de tamanho do título e da descrição

**Técnica/tipo:** Análise de valor-limite pela tela.

**Dados de entrada:** Título com 2, 3, 150 e 151 caracteres; descrição com 2, 3, 2000 e 2001; texto colado de uma só vez.

**Passos**

1. Digitar 2 caracteres no título e tentar publicar.
2. Digitar e colar textos de 150 e 151 caracteres (título) e de 2000 e 2001 (descrição).
3. Publicar os aceitos e conferir o texto gravado.

**Resultado esperado**

- “O título deve ter pelo menos 3 caracteres.” e “A descrição deve ter pelo menos 3 caracteres.” abaixo do mínimo.
- 150 e 2000 aceitos; 151 e 2001 recusados com a mensagem de tamanho máximo ou impedidos com aviso visível, sem cortar o texto calado.
- O texto gravado é igual ao enviado.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU023-UI-005 — Lista de avisos: ordem, busca e estado vazio

**Técnica/tipo:** Partição vazio × preenchido; busca por título.

**Dados de entrada:** Quatro avisos (um com texto de 150 e 2000 caracteres e outro com `<b>negrito</b>`, aspas, emoji e quebras de linha); aviso publicado às 23h50; 200 avisos; busca por “manut”, “GREVE” e termo inexistente; lista sem avisos.

**Passos**

1. Abrir a lista com os quatro avisos e conferir a ordem.
2. Buscar por parte do título com maiúsculas e minúsculas.
3. Buscar um termo inexistente e, em outra massa, abrir a lista sem avisos.
4. Ler a data e a hora de publicação em cada cartão e compará-las com o horário local.
5. Com os 200 avisos, abrir a lista, rolar até o fim e medir a abertura.
6. Comparar com `GET /avisos`.

**Resultado esperado**

- Ordem do mais recente ao mais antigo, igual à API.
- A data e a hora de cada cartão correspondem ao horário de Fortaleza (o aviso das 23h50 não vira o dia seguinte).
- O texto com HTML, aspas, emoji e quebras aparece como texto, sem interpretar a marcação nem quebrar o cartão.
- Com 200 avisos a lista abre em até 3 segundos e rola sem travar.
- A busca filtra por parte do título sem diferenciar maiúsculas.
- Sem resultado ou sem avisos, aparece a mensagem de vazio e não um erro.
- Texto longo quebra linha dentro do cartão.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU023-UI-006 — Editar e inativar um aviso pela tela

**Técnica/tipo:** Transição de estado; funcionalidade dependente de API.

**Dados de entrada:** Aviso publicado; procurar a ação de editar e de inativar em cada cartão da lista.

**Passos**

1. Abrir um cartão e procurar editar e inativar.
2. Se existir, editar o texto, salvar e abrir o mural do aluno.
3. Inativar o aviso e conferir lista do administrador, mural do aluno, API e banco.

**Resultado esperado**

- Editar mostra o formulário com os dados e, ao salvar, o mural reflete a mudança sem recarregar (AC-04).
- Inativar pede confirmação, remove o aviso da lista e do mural e mantém o registro no banco (AC-05).
- Sem as ações, registrar o impedimento.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção B — Aluno e falhas

#### CT-HU023-UI-007 — Aluno vê o aviso publicado no Mural de Avisos

**Técnica/tipo:** Integração administrador × aluno; atualização com a tela aberta.

**Dados de entrada:** Aluno aprovado; avisos publicados antes e depois de abrir a tela (um com `<script>`, emoji e quebras de linha); busca; mural vazio.

**Passos**

1. Entrar como aluno e abrir o Mural de Avisos com avisos já publicados.
2. Com a tela aberta, o administrador publica um aviso novo (outra sessão).
3. Aguardar alguns segundos sem recarregar e buscar pelo título.
4. Abrir o mural numa massa sem avisos.
5. Conferir a data de publicação e o aviso com texto especial.

**Resultado esperado**

- O mural lista os avisos do mais recente ao mais antigo, iguais à API, com a data no horário de Fortaleza.
- O aviso com `<script>`, emoji e quebras é exibido como texto puro, sem executar nada.
- O aviso novo aparece sozinho em poucos segundos.
- Sem avisos, a tela mostra “Nenhum aviso publicado no momento.”.
- A tela aberta é o Mural de Avisos de verdade, e não a tela provisória.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU023-UI-008 — Acesso restrito: aluno, representante e sem sessão

**Técnica/tipo:** Partição por perfil; acesso por endereço direto (RN-006).

**Dados de entrada:** Aluno aprovado, representante e sem sessão; endereços diretos da lista e do formulário de avisos do administrador.

**Passos**

1. Entrar como aluno e como representante e procurar o gerenciamento de avisos.
2. Abrir o endereço direto da lista e do formulário com cada perfil e sem sessão.
3. Confirmar pela API que a publicação por esses perfis é recusada.

**Resultado esperado**

- Nenhum item de gerenciamento de avisos no menu do aluno ou do representante.
- O endereço direto leva a acesso negado ou ao login, sem dados.
- A API responde 403 e 401 nas tentativas.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU023-UI-009 — Falha de comunicação ao publicar, listar e abrir o mural

**Técnica/tipo:** Transição online/offline; tratamento de erro sem sucesso falso.

**Dados de entrada:** Rede desligada ao publicar, ao abrir a lista do administrador e ao abrir o mural do aluno; religar e repetir.

**Passos**

1. Com a rede desligada, tentar publicar um aviso.
2. Abrir a lista do administrador e o mural do aluno offline.
3. Religar a rede e repetir cada ação.
4. Conferir banco e API depois de cada tentativa.

**Resultado esperado**

- A publicação offline mostra o erro e não o popup de sucesso; nada é gravado.
- A lista e o mural mostram a falha de carregamento, sem afirmar que não há avisos.
- Com a rede de volta, as telas carregam e a publicação funciona.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

## Rastreabilidade

| Critério/regra | Casos UI | Complemento |
| --- | --- | --- |
| AC-01 — acesso e formulário | UI-001, UI-002 | API-001 |
| AC-02 / FA-001 — obrigatórios e limites | UI-003, UI-004 | API-003, API-004 |
| Lista e busca | UI-005 | API-002 |
| AC-04, AC-05 / FA-002 — editar e inativar | UI-006 | API-006, API-007 |
| Mural do aluno | UI-007 | API-001, API-002 |
| AC-06 / RN-006 — acesso restrito | UI-001, UI-008 | API-008 |
| Falha de comunicação | UI-009 | — |

## Defeitos encontrados

| Caso | Defeito ou dependência | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. Os riscos de leitura estão no [guia de execução da API](../api/README.md) e não são defeitos reproduzidos. | — |

## Observações gerais

- O texto de cada mensagem confere com o que o código mostra hoje; se o requisito pedir outro texto, vale o requisito e a divergência é registrada.
- Os casos 006 e 007 da UI e da API dependem da implementação de edição e inativação (decisão 1 do PO).
- Referências: [requisitos, seção 7.8](../../../../../docs/requisitos.md), [BDD do épico 07](../../../../../bdd/features/epico-07/README.md) e as [decisões do PO na #539](https://github.com/GOUOCE/GOUCE-app/issues/539).
- Nenhum caso foi executado nesta entrega; a leitura do código não aprova caso.
