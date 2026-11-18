# Testes manuais de UI — HU-016 — Distribuição de Alunos nos Ônibus

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Alocação e Distribuição Logística (EP-005) |
| Funcionalidade | HU-016 — Distribuição de Alunos nos Ônibus |
| Camada | UI — celular ou web |
| Tipo de teste | Funcional manual essencial, integração e tratamento de falha — baseado em risco |
| Telas | Logística → Distribuição Logística (demanda por rota, prévia, confirmação, alocação por rota e excedentes). |
| Base do planejamento | [PR #457](https://github.com/GOUOCE/GOUCE-app/pull/457), branch `feature/front-hu16e17`, commit `80830b4d`, sobre a `develop` `1eb2818d`; a tela de distribuição ainda não está na `develop` |
| Branch de planejamento | `test/planejamento-api-ui-hu-016`, com entrega para `develop` |
| Revisão do planejamento | 16/11/2026 — requisitos 7.6 com as decisões do PO (#465), BDD do épico 05 e leitura do código |
| Ambiente | A preencher — navegador (versão web) ou celular, URL, SHAs do front ([PR #457](https://github.com/GOUOCE/GOUCE-app/pull/457) `80830b4d`) e da API; banco limpo, fuso America/Fortaleza |
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
| PC-01 | Front do [PR #457](https://github.com/GOUOCE/GOUCE-app/pull/457), branch `feature/front-hu16e17`, commit `80830b4d`, com a API da `develop` `1eb2818d`. A tela de distribuição não existe na `develop`; sem esse build os casos ficam bloqueados. Registrar URL, SHAs e navegador. |
| PC-02 | Cauan executa a UI; a LLM prepara a massa pela API (rotas, frota, motoristas, alunos e reservas) e confere API/banco depois de cada caso. Administrador, aluno A, aluno B e representante prontos. |
| PC-03 | Usar a massa e o mapa de ids da [suíte de API](../api/API-HU-016.md): P1/P2, V1/V2/V3, M1/M2/M3, reservas em D+1 e o cenário de excedente do CT-007. |
| PC-04 | Para as falhas de comunicação, a LLM mantém acesso independente à API e ao banco para comprovar que nada foi gravado. |
| PC-05 | Os esperados seguem requisitos 7.6, BDD e decisões do PO; os riscos de leitura do [guia da API](../api/README.md) não são defeitos reproduzidos. Toda a suíte está pendente. |

## Resumo da execução

Executar na ordem e registrar cada variação. A LLM confere API e banco depois dos casos de confirmação. Os casos dependem do build do PR #457.

### Seção A — Acesso e demanda

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU016-UI-001 | Acesso pelo painel logístico | Administrador autenticado; aba Logística; massa do CT-HU016-API-001 em D+1. | Painel mostra Distribuição Logística e Lista de embarque; Rodízio oculto; nenhum cartão leva a rota inexistente. | ⏳ PENDENTE | Risco de leitura: o painel ainda tem o cartão Rodízio, com rota inexistente. |
| CT-HU016-UI-002 | Selecionar o dia e ver a demanda por rota | Semana atual e seguinte; dias com reservas em P1/P2 e dia sem reservas; abas Próximos e Histórico. | Demanda por rota igual à da API; dia sem reservas informa a ausência. | ⏳ PENDENTE | BDD: demanda por rota; dia sem alunos. |
| CT-HU016-UI-003 | Prévia com sentados, em pé e situação por rota (sem gravar) | P1 com 5 alunos e V1 (3+2); P2 com demanda acima da capacidade disponível; sem confirmar. | Cada rota mostra ônibus, motorista, sentados e em pé corretos e a situação certa; recarregar não grava nada. | ⏳ PENDENTE | BDD: sentados e em pé; prévia sem gravação. |

### Seção B — Confirmação e ajustes

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU016-UI-004 | Confirmar a distribuição e ver o dia como distribuído | Dia da massa sem distribuição; confirmar; depois recarregar a página e abrir de novo o dia. | Popup de confirmação, mensagem de sucesso, status do dia atualizado e distribuição mantida após recarregar. | ⏳ PENDENTE | Risco de leitura: a tela guarda a confirmação em memória; a API sempre devolve a sugestão automática. |
| CT-HU016-UI-005 | Confirmar com excedentes: aviso com a lista dos alunos | V1 e M1 ativos; P1 na ida com 6 alunos (um excedente); confirmar. | Confirmação permitida com aviso que lista os excedentes pelo nome; o aluno aguarda alocação. | ⏳ PENDENTE | Risco de leitura: a lista de excedentes usa “Agendamento #id” em vez do nome. BDD: excedentes na confirmação. |
| CT-HU016-UI-006 | Trocar ônibus e motorista antes de confirmar | Rota P1 aberta na prévia; ônibus V1, V2, V3 e motoristas M1, M2, M3; V2 já sugerido para P2 no mesmo turno. | Troca antes de confirmar; recursos já usados no turno ficam fora da seleção; confirmação grava a escolha. | ⏳ PENDENTE | BDD: trocar ônibus e motorista; AC-02, AC-11 e AC-14. |
| CT-HU016-UI-007 | Realocar excedentes manualmente | Distribuição com um excedente; tela de excedentes; ônibus com vaga. | Seleção e realocação do excedente; aluno passa a ver o ônibus alternativo. | ⏳ PENDENTE | Risco de leitura: a API recusa a alocação em rota diferente (ver CT-HU016-API-008). BDD: realocação manual. |

### Seção C — Falhas e acesso

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU016-UI-008 | Falha de comunicação ao carregar e ao confirmar | API disponível e depois indisponível: abrir a tela sem rede; confirmar sem rede; religar e repetir. | Erro explícito, sem demanda inventada nem sucesso falso; nada gravado; repetição funciona. | ⏳ PENDENTE | BDD: AC-13 e RNF-012; padrões de erro do front. |
| CT-HU016-UI-009 | Perfis sem acesso ao menu e à tela | Aluno, representante e sem sessão; endereço direto da tela de distribuição. | Menu de logística não aparece para aluno e representante; URL direta é negada. | ⏳ PENDENTE | BDD: menu de alocação diária não é exibido sem perfil administrativo; RN-006. |

## Detalhamento dos casos

### Seção A — Acesso e demanda

#### CT-HU016-UI-001 — Acesso pelo painel logístico

**Técnica/tipo:** Funcional positivo e navegação; partição por cartão do painel.

**Dados de entrada:** Administrador autenticado; aba Logística; massa do CT-HU016-API-001 em D+1.

**Passos**

1. Entrar como administrador e abrir a aba **Logística**.
2. Conferir os cartões da seção Alocação e Embarque e da seção Frota.
3. Abrir **Distribuição Logística**.

**Resultado esperado**

- A aba mostra os cartões **Distribuição Logística** e **Lista de embarque**.
- O cartão **Rodízio de frota** fica oculto (HU-020 adiada, decisão do PO na #465); nenhum cartão abre tela inexistente.
- **Distribuição Logística** abre a tela de alocação diária (AC-01).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU016-UI-002 — Selecionar o dia e ver a demanda por rota

**Técnica/tipo:** Partição por dia (com e sem reservas, passado e futuro); consistência com a API.

**Dados de entrada:** Semana atual e seguinte; dias com reservas em P1/P2 e dia sem reservas; abas Próximos e Histórico.

**Passos**

1. Escolher, no seletor semanal, um dia com reservas e conferir cada rota listada.
2. Comparar nome, faculdades, horários e total de alunos com a resposta da API.
3. Escolher um dia sem reservas e, depois, abrir a aba Histórico.

**Resultado esperado**

- Cada rota mostra nome, faculdades atendidas, horários de saída e retorno e o total de alunos agendados, iguais aos da API.
- O dia sem reservas mostra “Nenhum aluno agendado para este dia.”
- A aba Histórico lista dias passados sem permitir alterar a distribuição (consulta).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU016-UI-003 — Prévia com sentados, em pé e situação por rota (sem gravar)

**Técnica/tipo:** Partição por lotação (cabe, superlotada, pendente); verificação de efeito colateral.

**Dados de entrada:** P1 com 5 alunos e V1 (3+2); P2 com demanda acima da capacidade disponível; sem confirmar.

**Passos**

1. Abrir o dia da massa e ler, por rota, ônibus, motorista, sentados, em pé e o selo de situação.
2. Comparar com a prévia da API e conferir os selos Alocada, Superlotada e Pendente.
3. Sem confirmar, recarregar a tela e consultar o banco.

**Resultado esperado**

- Ônibus, motorista, sentados e em pé de cada rota coincidem com a prévia da API e respeitam a capacidade.
- O selo reflete a situação da rota: dentro da capacidade, superlotada ou sem ônibus (pendente).
- A prévia não persiste nada: após recarregar, `alocacao_diaria` continua sem linhas para a data.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção B — Confirmação e ajustes

#### CT-HU016-UI-004 — Confirmar a distribuição e ver o dia como distribuído

**Técnica/tipo:** Transição de estado e persistência; popup padrão do app; recarga de sessão.

**Dados de entrada:** Dia da massa sem distribuição; confirmar; depois recarregar a página e abrir de novo o dia.

**Passos**

1. Tocar em **Confirmar distribuição**, conferir o popup e desistir uma vez.
2. Confirmar de novo e conferir a mensagem e o status do dia.
3. Recarregar a página, abrir o mesmo dia e comparar com o banco.

**Resultado esperado**

- O popup “Confirmar distribuição?” cita a data; desistir não grava nada.
- Confirmar mostra “Distribuição realizada com sucesso” em popup padrão, sem toast preto, e o status logístico do dia passa a distribuído.
- Depois de recarregar (ou em outra sessão), a tela mostra a distribuição **gravada** e não uma nova sugestão automática.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU016-UI-005 — Confirmar com excedentes: aviso com a lista dos alunos

**Técnica/tipo:** Tabela de decisão capacidade × confirmação; funcional negativo permitido.

**Dados de entrada:** V1 e M1 ativos; P1 na ida com 6 alunos (um excedente); confirmar.

**Passos**

1. Abrir o dia e conferir a sinalização de excedente na prévia.
2. Confirmar a distribuição e ler o aviso exibido.
3. Entrar como o aluno excedente e abrir a viagem do dia (apoio da HU-019).

**Resultado esperado**

- A confirmação é permitida (AC-13) e a mensagem de sucesso é exibida.
- O aviso lista os alunos excedentes com nome legível, não só com o número do agendamento.
- O aluno excedente vê “Aguardando alocação do veículo” até ser realocado.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU016-UI-006 — Trocar ônibus e motorista antes de confirmar

**Técnica/tipo:** Partição de recursos disponíveis × já usados no turno; persistência.

**Dados de entrada:** Rota P1 aberta na prévia; ônibus V1, V2, V3 e motoristas M1, M2, M3; V2 já sugerido para P2 no mesmo turno.

**Passos**

1. Abrir a alocação de P1 e abrir a seleção de ônibus e de motorista.
2. Escolher V3 e M2 e confirmar; conferir a mensagem.
3. Voltar à seleção e procurar o ônibus e o motorista já usados por outra rota no mesmo turno.
4. Comparar o banco com a escolha feita.

**Resultado esperado**

- O administrador troca o ônibus e o motorista sugeridos antes de confirmar (AC-02).
- Ônibus e motorista já alocados a outra rota no mesmo turno não aparecem como disponíveis (RN-003 e RN-002) ou geram o alerta de indisponibilidade.
- A confirmação grava V3 e M2 para P1 e mantém as demais rotas do dia como estavam.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU016-UI-007 — Realocar excedentes manualmente

**Técnica/tipo:** Transição de estado do aluno (excedente → alocado em outro ônibus); integração com a HU-019.

**Dados de entrada:** Distribuição com um excedente; tela de excedentes; ônibus com vaga.

**Passos**

1. Abrir a lista de excedentes do dia e selecionar o aluno.
2. Realocar para um ônibus com vaga e confirmar.
3. Conferir o banco e a viagem do aluno (HU-019).

**Resultado esperado**

- O administrador seleciona os excedentes e os realoca para um ônibus com vaga (AC-09).
- O status do aluno passa a informar em qual ônibus ele deve embarcar (AC-10); o aluno vê “Atenção: Você foi realocado. Seu ônibus para hoje é o veículo X” quando o ônibus é de outra rota.
- Se a realocação for recusada, a tela mostra a causa e não altera a distribuição.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção C — Falhas e acesso

#### CT-HU016-UI-008 — Falha de comunicação ao carregar e ao confirmar

**Técnica/tipo:** Transição de estado online/offline; erro sem efeito parcial.

**Dados de entrada:** API disponível e depois indisponível: abrir a tela sem rede; confirmar sem rede; religar e repetir.

**Passos**

1. Com a rede desligada, abrir a tela do dia e observar.
2. Com a rede ligada, abrir o dia, desligar a rede e confirmar a distribuição.
3. Religar a rede, repetir e consultar o banco.

**Resultado esperado**

- Ao abrir sem rede, a tela informa a falha de carregamento e não mostra demanda fictícia nem “Nenhum aluno agendado”.
- Ao confirmar sem rede, a mensagem é de falha, a distribuição não é gravada e não há popup de sucesso.
- Com a rede de volta, a repetição grava normalmente.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU016-UI-009 — Perfis sem acesso ao menu e à tela

**Técnica/tipo:** Partição por perfil; acesso por URL direta.

**Dados de entrada:** Aluno, representante e sem sessão; endereço direto da tela de distribuição.

**Passos**

1. Entrar como aluno e como representante e procurar o menu de logística.
2. Abrir o endereço direto da distribuição com cada perfil e sem sessão.

**Resultado esperado**

- Aluno e representante não veem o menu de alocação diária.
- A URL direta leva à tela de acesso negado ou ao login; nenhum dado de alocação é exibido.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

## Rastreabilidade

| Critério/regra | Casos UI | Complemento |
| --- | --- | --- |
| AC-01 / fluxo principal — acessar e ver a demanda do dia | UI-001, UI-002 | API-001, API-002 |
| AC-03 / AC-04 — prévia com sentados e em pé | UI-003 | API-001, API-003 |
| AC-13 / FA-001 — confirmar, status e excedentes | UI-004, UI-005 | API-006, API-007 |
| AC-02 / AC-11 / AC-14 — trocar ônibus e motorista; conflitos | UI-006 | API-008, API-009 |
| AC-09 / AC-10 — realocar excedentes | UI-007 | API-008 |
| RNF-012 — falha sem efeito parcial | UI-008 | API-010 |
| RN-006 — somente administrador | UI-009 | API-011 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. Os riscos de leitura estão no [guia de execução da API](../api/README.md). | — |

## Observações gerais

- Referências: [requisitos, seção 7.6](../../../../../docs/requisitos.md), [BDD do épico 05](../../../../../bdd/features/epico-05/README.md) e as [decisões do PO na #465](https://github.com/GOUOCE/GOUCE-app/issues/465).
- O PR #457 muda a tela enquanto está aberto; registrar o SHA efetivamente testado e rever os casos se o PR mudar.
- Nenhum caso foi executado nesta entrega. A decisão do PO sobre o rodízio (HU-020 adiada) vale para o cartão do painel.
