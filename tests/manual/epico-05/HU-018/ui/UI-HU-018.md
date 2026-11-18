# Testes manuais de UI — HU-018 — Visualização da Lista de Embarque

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Alocação e Distribuição Logística (EP-005) |
| Funcionalidade | HU-018 — Visualização da Lista de Embarque |
| Camada | UI — celular ou web |
| Tipo de teste | Funcional manual essencial, integração, atualização automática e tratamento de falha — baseado em risco |
| Telas | Logística → Lista de embarque (administrador) e home do representante; impressão da lista. |
| Base do planejamento | `develop` `1eb2818d` (`ListaEmbarqueConteudo`, `logistica/embarque.tsx` e `(representante)/home.tsx`); o atalho a partir da rota depende do [PR #457](https://github.com/GOUOCE/GOUCE-app/pull/457) |
| Branch de planejamento | `test/planejamento-api-ui-hu-018`, com entrega para `develop` |
| Revisão do planejamento | 16/11/2026 — requisitos 7.6 com as decisões do PO (#465), BDD do épico 05 e leitura do código |
| Ambiente | A preencher — navegador (versão web) ou celular, URL e SHAs do front e da API da `develop` `1eb2818d`; banco limpo, fuso America/Fortaleza |
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
| PC-01 | Front e API da `develop` `1eb2818d`; o atalho a partir da rota do painel (CT-006) depende do PR #457. Registrar URL, SHAs e navegador. |
| PC-02 | Cauan executa a UI; a LLM prepara a massa (distribuição confirmada e mudanças por API de cancelamento e de ônibus) e confere API/banco depois de cada caso. |
| PC-03 | Usar a massa da [suíte de API](../api/API-HU-018.md): P1/P2, alunos das quatro combinações de turno, administrador e representantes R1/R2. |
| PC-04 | Para a impressão, usar navegador com visualização de impressão ou exportação habilitada e guardar a captura do documento. |
| PC-05 | Os esperados seguem requisitos 7.6, BDD e decisões do PO; os riscos de leitura do [guia da API](../api/README.md) não são defeitos reproduzidos. Toda a suíte está pendente. |

## Resumo da execução

Executar na ordem e registrar cada variação. A LLM prepara as mudanças por API durante o CT-008 e confere a resposta correspondente.

### Seção A — Consulta pelo menu

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU018-UI-001 | Acesso pelo menu e seletor “Rota *” obrigatório | Administrador; Logística → Lista de embarque; D com distribuição confirmada. | Tela com a data e o campo “Rota *”; sem rota, orientação para selecionar. | ⏳ PENDENTE | BDD: seleciona a rota; rota obrigatória. |
| CT-HU018-UI-002 | Selecionar a rota: contador, ordenação e dados dos alunos | P1 com 5 alunos alocados e nomes fora de ordem; depois rota com 1 aluno. | Contador, ordenação por nome, ponto, faculdade e turno conforme a API. | ⏳ PENDENTE | BDD: contador; ordenação por nome. |
| CT-HU018-UI-003 | Indicação visual dos turnos agendados | Alunos com só ida, só volta, ida e volta na mesma IES e em IES distintas na mesma rota. | Cada aluno mostra o turno e a IES correspondentes. | ⏳ PENDENTE | BDD: indicação do turno agendado; AC-03. |
| CT-HU018-UI-004 | Rota sem alunos e botão Imprimir desabilitado | Rota sem alunos alocados na data. | Mensagem do requisito e botão desabilitado. | ⏳ PENDENTE | BDD: rota sem alunos; AC-04. |
| CT-HU018-UI-005 | Imprimir a lista de embarque | Rota com alunos alocados; navegador ou celular com impressão/exportação disponível. | Botão habilitado e documento com os mesmos dados da tela. | ⏳ PENDENTE | BDD: botão Imprimir lista habilitado; AC-05. |

### Seção B — Rota fixa e representante

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU018-UI-006 | Acesso direto por uma rota, sem seletor | Administrador abrindo a lista a partir de uma rota já selecionada no painel logístico, quando a tela oferecer o atalho. | Lista abre direto na rota, com o nome fixo e sem seletor. | ⏳ PENDENTE | Depende de existir o atalho no painel (PR #457). BDD: acesso a partir da rota; FA-001. |
| CT-HU018-UI-007 | Representante: só os alunos da sua faculdade | R1 (UFC) e R2 (IFCE); P1 com alunos das duas IES. | Rota fixa e apenas alunos da própria IES. | ⏳ PENDENTE | BDD: representante visualiza apenas os alunos da faculdade; RNF-010. |

### Seção C — Atualização

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU018-UI-008 | Atualização automática por cancelamento e realocação | Lista aberta (administrador); a LLM cancela uma reserva pela API (HU-014) e depois troca o ônibus de um aluno; observar a tela sem recarregar. | Lista, contador e indicador atualizados sozinhos. | ⏳ PENDENTE | Risco de leitura: a tela atualiza por consulta periódica, não por evento. BDD: remove aluno cancelado; realocação; indicador. |
| CT-HU018-UI-009 | Falha de comunicação ao carregar a lista | Rede desligada ao selecionar a rota; religar. | Erro explícito; nada de lista vazia como se não houvesse alunos. | ⏳ PENDENTE | BDD: AC-06; padrões de erro do front. |
| CT-HU018-UI-010 | Acesso restrito: aluno, sem sessão e representante sem vínculo | Aluno, sem sessão e representante sem vínculo ativo; endereço direto da lista de embarque. | Sem acesso aos dados pessoais. | ⏳ PENDENTE | BDD: acesso restrito a administrador e representante. |

## Detalhamento dos casos

### Seção A — Consulta pelo menu

#### CT-HU018-UI-001 — Acesso pelo menu e seletor “Rota *” obrigatório

**Técnica/tipo:** Funcional positivo; validação de campo obrigatório.

**Dados de entrada:** Administrador; Logística → Lista de embarque; D com distribuição confirmada.

**Passos**

1. Abrir Logística → **Lista de embarque**.
2. Observar a tela antes de escolher a rota.
3. Abrir o seletor “Rota *” e conferir as opções com `rotas-do-dia`.

**Resultado esperado**

- A tela mostra a data da operação e o seletor “Rota *”; antes da escolha, aparece “Selecione uma rota para visualizar os alunos alocados.”
- As opções do seletor são as rotas do dia retornadas pela API.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU018-UI-002 — Selecionar a rota: contador, ordenação e dados dos alunos

**Técnica/tipo:** Integração de contrato × tela; partição por quantidade.

**Dados de entrada:** P1 com 5 alunos alocados e nomes fora de ordem; depois rota com 1 aluno.

**Passos**

1. Selecionar P1 e ler o contador e a lista.
2. Comparar nome, ponto, faculdade e turno de cada aluno com o JSON da API.
3. Selecionar a rota com 1 aluno.

**Resultado esperado**

- O contador mostra “5 alunos alocados” (e “1 aluno alocado” no singular).
- Os alunos aparecem ordenados pelo nome, com ponto de embarque/desembarque e faculdade corretos, e o ônibus e o motorista escalados da rota.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU018-UI-003 — Indicação visual dos turnos agendados

**Técnica/tipo:** Tabela de decisão ida × volta × IES.

**Dados de entrada:** Alunos com só ida, só volta, ida e volta na mesma IES e em IES distintas na mesma rota.

**Passos**

1. Selecionar a rota e localizar cada aluno da massa.
2. Comparar a indicação visual de turno e de IES com a reserva.

**Resultado esperado**

- A indicação distingue só ida, só volta, ida e volta na mesma IES e ida e volta em IES distintas, com a IES de cada turno.
- Os turnos exibidos coincidem com `indicacao_turno` da API.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU018-UI-004 — Rota sem alunos e botão Imprimir desabilitado

**Técnica/tipo:** Partição vazio × preenchido.

**Dados de entrada:** Rota sem alunos alocados na data.

**Passos**

1. Selecionar uma rota sem alunos alocados.
2. Tentar tocar em **Imprimir lista**.

**Resultado esperado**

- Aparece “Essa rota não possui nenhum aluno alocado para este dia.”
- O botão **Imprimir lista** fica desabilitado e não responde ao toque.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU018-UI-005 — Imprimir a lista de embarque

**Técnica/tipo:** Funcional positivo; conferência de conteúdo exportado.

**Dados de entrada:** Rota com alunos alocados; navegador ou celular com impressão/exportação disponível.

**Passos**

1. Selecionar uma rota com alunos e tocar em **Imprimir lista**.
2. Abrir o documento gerado e comparar com a tela.

**Resultado esperado**

- O botão está habilitado e abre o documento para impressão/exportação sem erro.
- O documento traz rota, data, ônibus, motorista e os mesmos alunos, na mesma ordem e com o mesmo total da tela.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção B — Rota fixa e representante

#### CT-HU018-UI-006 — Acesso direto por uma rota, sem seletor

**Técnica/tipo:** Funcional por caminho de entrada (menu × rota do painel).

**Dados de entrada:** Administrador abrindo a lista a partir de uma rota já selecionada no painel logístico, quando a tela oferecer o atalho.

**Passos**

1. Na distribuição, abrir uma rota e procurar o atalho para a lista de embarque.
2. Abrir a lista por esse caminho.

**Resultado esperado**

- A lista abre já na rota escolhida, com o nome da linha fixo e sem o campo seletor (AC-02, FA-001).
- Se o atalho não existir no build testado, registrar bloqueio por dependência; não aprovar.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU018-UI-007 — Representante: só os alunos da sua faculdade

**Técnica/tipo:** Partição por perfil e por IES (RN-015).

**Dados de entrada:** R1 (UFC) e R2 (IFCE); P1 com alunos das duas IES.

**Passos**

1. Entrar como R1 e abrir a lista de embarque.
2. Conferir rota, contador e alunos; repetir com R2.

**Resultado esperado**

- A lista abre na rota do representante, sem seletor, e mostra só alunos cuja IES do turno é a sua.
- O contador reflete apenas esses alunos; nenhum dado de outra IES aparece.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção C — Atualização

#### CT-HU018-UI-008 — Atualização automática por cancelamento e realocação

**Técnica/tipo:** Transição de estado com a tela aberta; sincronização periódica.

**Dados de entrada:** Lista aberta (administrador); a LLM cancela uma reserva pela API (HU-014) e depois troca o ônibus de um aluno; observar a tela sem recarregar.

**Passos**

1. Abrir a lista de P1 e anotar contador e alunos.
2. Pedir à LLM o cancelamento de uma reserva por API e aguardar sem recarregar (a consulta periódica roda a cada 30 s).
3. Pedir uma nova distribuição manual que troque o ônibus de um aluno e aguardar.
4. Ler o indicador inferior de sincronização.

**Resultado esperado**

- O aluno cancelado some e o contador diminui sem recarregar (AC-06, FA-003).
- A realocação aparece com o novo ônibus.
- O rodapé exibe “Atualizado há X min” e reinicia a cada atualização.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU018-UI-009 — Falha de comunicação ao carregar a lista

**Técnica/tipo:** Transição online/offline; erro sem dados inventados.

**Dados de entrada:** Rede desligada ao selecionar a rota; religar.

**Passos**

1. Selecionar a rota com a rede ligada e depois desligar a rede.
2. Selecionar outra rota ou aguardar a atualização automática.
3. Religar a rede e repetir.

**Resultado esperado**

- A tela exibe a falha de carregamento e não afirma que a rota não tem alunos.
- A lista já exibida não é apagada nem substituída por dados inventados; com a rede de volta, a lista recarrega.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU018-UI-010 — Acesso restrito: aluno, sem sessão e representante sem vínculo

**Técnica/tipo:** Partição por perfil; acesso por URL direta (RNF-010).

**Dados de entrada:** Aluno, sem sessão e representante sem vínculo ativo; endereço direto da lista de embarque.

**Passos**

1. Entrar como aluno e procurar a lista de embarque.
2. Abrir o endereço direto com o aluno, sem sessão e com o representante sem vínculo.

**Resultado esperado**

- O aluno não encontra a lista; a URL direta leva a acesso negado ou ao login.
- O representante sem vínculo ativo recebe a recusa e nenhum dado de aluno é exibido.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

## Rastreabilidade

| Critério/regra | Casos UI | Complemento |
| --- | --- | --- |
| AC-01 — menu, data e seletor obrigatório | UI-001 | API-001, API-005 |
| AC-03 — contador, ordem e turnos | UI-002, UI-003 | API-002, API-003 |
| AC-04 / AC-05 — sem alunos e impressão | UI-004, UI-005 | API-004 |
| AC-02 / FA-001 — rota fixa e representante | UI-006, UI-007 | API-006 |
| AC-06 / FA-003 — atualização automática | UI-008, UI-009 | API-007, API-008 |
| AC-07 / RNF-010 — acesso restrito | UI-010 | API-009 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. Os riscos de leitura estão no [guia de execução da API](../api/README.md). | — |

## Observações gerais

- Referências: [requisitos, seção 7.6](../../../../../docs/requisitos.md), [BDD do épico 05](../../../../../bdd/features/epico-05/README.md) e as [decisões do PO na #465](https://github.com/GOUOCE/GOUCE-app/issues/465).
- O CT-006 só se aplica quando houver atalho para a lista a partir da rota; sem ele, registrar bloqueio por dependência.
- Nenhum caso foi executado nesta entrega.
