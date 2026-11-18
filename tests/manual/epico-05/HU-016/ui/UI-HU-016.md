# Testes manuais de UI — HU-016 — Distribuição de Alunos nos Ônibus

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Alocação e Distribuição Logística (EP-005) |
| Funcionalidade | HU-016 — Distribuição de Alunos nos Ônibus |
| Camada | UI — celular ou web |
| Tipo de teste | Funcional manual essencial, integração e tratamento de falha — baseado em risco |
| Telas | Logística → Distribuição Logística (demanda por rota, prévia, confirmação, alocação por rota e excedentes). |
| Base do planejamento | [PR #457](https://github.com/GOUOCE/GOUCE-app/pull/457), branch `feature/front-hu16e17`, commit `80830b4d`, mesclado na `develop` (`7372b8d6`) |
| Branch de planejamento | `test/planejamento-api-ui-hu-016`, com entrega para `develop` |
| Revisão do planejamento | 16/11/2026 — requisitos 7.6 com as decisões do PO (#465), BDD do épico 05 e leitura do código |
| Ambiente | Navegador Brave 1.86.148 (Chromium 144.0.7559.133, 64 bits, Linux); Expo web `http://localhost:8081`; API `http://localhost:8216`; PostgreSQL `atu_ui016`; build `develop` commit `0f90c961e484ed1045017d04b1bad15d09b0818c` (merge do PR #472); branch de execução `test/execucao-ui-hu-016`; fuso America/Fortaleza; Alembic head aplicado: `82_create_alocacao_diaria` |
| Total de casos | 9 |
| Última execução | 18/11/2026 |
| Testador | Radlei — execução manual; LLM — massa e conferência de API/banco |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Execução de 18/11/2026 | 9 | 3 | 6 | 0 | 0 | 0 |

Por verificação (cada bullet do "Resultado esperado" de cada caso, contando separadamente quando um bullet reúne mais de uma checagem): 17 ✅ / 9 ❌ / 2 🚫, de 28 verificações nos 9 casos. Detalhe por caso na tabela de resumo e no detalhamento abaixo.

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | Front do [PR #457](https://github.com/GOUOCE/GOUCE-app/pull/457), branch `feature/front-hu16e17`, commit `80830b4d`, mesclado na `develop`, com a API no commit `0f90c961e484ed1045017d04b1bad15d09b0818c` (branch `test/execucao-ui-hu-016`). Ambiente, SHAs e navegador registrados em "Identificação da suíte". |
| PC-02 | Radlei executa a UI; a LLM prepara a massa pela API (rotas, frota, motoristas, alunos e reservas) e confere API/banco depois de cada caso. Administrador, alunos A-F e G1-G5, aluno H Um Farias, representantes R1 e R_inativo prontos. |
| PC-03 | Usar a massa e o mapa de ids da [suíte de API](../api/API-HU-016.md): P1/P2/P3, V1/V2/V3, M1/M2/M3, reservas em D+1 (18/11) e massas adicionais em 10/11 (Histórico, inserida direto no banco), 24/11, 26/11, 27/11 e 30/11 para os demais casos. |
| PC-04 | Para as falhas de comunicação, a LLM mantém acesso independente à API e ao banco para comprovar que nada foi gravado. |
| PC-05 | Os esperados seguem requisitos 7.6, BDD e decisões do PO; os riscos de leitura do [guia da API](../api/README.md) não são defeitos reproduzidos — vários se confirmaram como defeitos reais nesta execução (ver "Defeitos encontrados"). |

## Resumo da execução

Executada na ordem em 18/11/2026. A LLM preparou a massa pela API (e, no caso do dia passado do CT-002, direto no banco) e conferiu API e banco depois dos casos de confirmação.

### Seção A — Acesso e demanda

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU016-UI-001 | Acesso pelo painel logístico | Administrador autenticado; aba Logística; massa do CT-HU016-API-001 em D+1. | Painel mostra Distribuição Logística e Lista de embarque; Rodízio oculto; nenhum cartão leva a rota inexistente. | ❌ FALHOU | 2 de 4 verificações falharam: Rodízio visível e abre rota inexistente (Unmatched Route). Relato [BUG-HU016-UI-001](issues/BUG-HU016-UI-001.md), issue #504. |
| CT-HU016-UI-002 | Selecionar o dia e ver a demanda por rota | Semana atual e seguinte; dias com reservas em P1/P2 e dia sem reservas; abas Próximos e Histórico. | Demanda por rota igual à da API; dia sem reservas informa a ausência. | ❌ FALHOU | 1 de 4 verificações falhou: Histórico mostra lápis e "Confirmar distribuição" (não é só consulta). Relato [BUG-HU016-UI-002](issues/BUG-HU016-UI-002.md), issue #505. Observação: "1 alunos" no plural errado; selo "Alocada" em dia sem distribuição confirmada. |
| CT-HU016-UI-003 | Prévia com sentados, em pé e situação por rota (sem gravar) | P1 com 5 alunos e V1 (3+2); P2 com demanda acima da capacidade disponível; sem confirmar. | Cada rota mostra ônibus, motorista, sentados e em pé corretos e a situação certa; recarregar não grava nada. | ✅ PASSOU | 3/3. Massa em 26/11 (P1=5, P2=8, P3=1, V1/V2/V3 e M1/M2/M3 ativos); os três selos (Alocada, Superlotada, Pendente) apareceram; banco em 0/0 antes e depois. |

### Seção B — Confirmação e ajustes

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU016-UI-004 | Confirmar a distribuição e ver o dia como distribuído | Dia da massa sem distribuição; confirmar; depois recarregar a página e abrir de novo o dia. | Popup de confirmação, mensagem de sucesso, status do dia atualizado e distribuição mantida após recarregar. | ❌ FALHOU | 2 de 3 verificações falharam: depois do F5, "Status logístico" desaparece e a tela volta a mostrar a sugestão automática em vez do gravado. Relato [BUG-HU016-UI-003](issues/BUG-HU016-UI-003.md), issue #506 (Bloqueante). |
| CT-HU016-UI-005 | Confirmar com excedentes: aviso com a lista dos alunos | V1 e M1 ativos; P1 na ida com 6 alunos (um excedente); confirmar. | Confirmação permitida com aviso que lista os excedentes pelo nome; o aluno aguarda alocação. | ❌ FALHOU | 1 de 3 verificações falhou (aviso mostra "Agendamento #30", não o nome do aluno) e 1 de 3 ficou 🚫 não executada (verificação no app do aluno, fica para o reteste). Relato [BUG-HU016-UI-004](issues/BUG-HU016-UI-004.md), issue #507. |
| CT-HU016-UI-006 | Trocar ônibus e motorista antes de confirmar | Rota P1 aberta na prévia; ônibus V1, V2, V3 e motoristas M1, M2, M3; V2 já sugerido para P2 no mesmo turno. | Troca antes de confirmar; recursos já usados no turno ficam fora da seleção; confirmação grava a escolha. | ❌ FALHOU | 2 de 3 verificações falharam: a seleção não filtra nem avisa recurso já usado por outra rota; V3+M2 foi recusado (409) — gravado com V3+M3 (variação), mantendo P2 em V2/M2. Relato [BUG-HU016-UI-005](issues/BUG-HU016-UI-005.md), issue #508 (Não bloqueante). |
| CT-HU016-UI-007 | Realocar excedentes manualmente | Distribuição com um excedente; tela de excedentes; ônibus com vaga. | Seleção e realocação do excedente; aluno passa a ver o ônibus alternativo. | ❌ FALHOU | Verificação 1 ❌ (não há ação de realocar na tela, só pela API); verificação 2 ✅ (via API + minha-viagem); verificação 3 🚫 (depende da 1). Relato [BUG-HU016-UI-006](issues/BUG-HU016-UI-006.md), issue #509 (Bloqueante). |

### Seção C — Falhas e acesso

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU016-UI-008 | Falha de comunicação ao carregar e ao confirmar | API disponível e depois indisponível: abrir a tela sem rede; confirmar sem rede; religar e repetir. | Erro explícito, sem demanda inventada nem sucesso falso; nada gravado; repetição funciona. | ✅ PASSOU | 3/3. Massa em 24/11 (P1=1, P2=1). Sem rede: 0/0 gravado; com rede de volta, repetição gravou 2 linhas em `alocacao_diaria` e 2 em `alocacao_aluno`. Padrão 401→refresh→nova tentativa observado durante o caso (não é defeito da HU-016, ver observações gerais). |
| CT-HU016-UI-009 | Perfis sem acesso ao menu e à tela | Aluno, representante e sem sessão; endereço direto da tela de distribuição. | Menu de logística não aparece para aluno e representante; URL direta é negada. | ✅ PASSOU | 2/2. Aluno, representante (R1, perfil "Sou representante") e sem sessão: sem menu de Logística; URL direta leva a `/acesso-negado` (erro 403) ou ao login; nenhum dado de alocação exibido; 0 chamadas Fetch/XHR de dados de alocação. |

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

- Painel `/logistica`: seção "Alocação e Embarque" com os cartões **Distribuição Logística** e **Lista de embarque**; seção "Frota" com o cartão **Rodízio de frota**. ✅ (cartões Distribuição e Lista presentes).
- **Distribuição Logística** abre `/logistica/distribuicao` (abas Próximos e Histórico, seletor semanal) — a tela de alocação diária (AC-01). ✅
- **Rodízio de frota** fica visível na seção Frota (esperado: oculto). ❌
- Ao tocar em Rodízio de frota, abre `/(administrador)/logistica/rodizio` e mostra "Unmatched Route – Page could not be found" (esperado: nenhum cartão leva a rota inexistente). ❌
- **Lista de embarque** abre `/logistica/embarque` (seleção de rota com P1, P2 e P3) — fora do esperado formal do caso, registrado como observação.
- Relato: [BUG-HU016-UI-001](issues/BUG-HU016-UI-001.md) (issue #504, 🟡 Média, Não bloqueante).
- Status: ❌ Falhou (2 de 4 verificações).

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

- Dia com reservas mostra rota, faculdades, horários e total iguais à API: ✅ em 18/11 (P1=4, P2=1), 24/11 (P1=1, P2=1) e 10/11 (P1=1), com os mesmos ônibus e motoristas sugeridos (M1=Carlos Um Silva, M2=Marcos Dois Souza, M3=Pedro Tres Lima).
- Dia sem reservas mostra "Nenhum aluno agendado para este dia.": ✅ em 17/11, 25/11 e 11/11.
- Histórico lista dias passados: ✅ (10/11 mostra P1 com 1 aluno). Massa do dia passado criada direto no banco (tabela `agendamento`, id 10), por não haver forma de reservar no passado pela API.
- Histórico sem permitir alterar a distribuição (consulta): ❌. Em 10/11 aparecem o lápis de editar e o botão "Confirmar distribuição"; o lápis abre `/logistica/alocar?linhaId=1&dataIso=2026-11-10` com o botão "Confirmar alocação" ativo. Não foi confirmado nada.
- Observações: o aviso de rodízio de frotas (AC-15) aparece na tela de alocação mesmo com a HU-020 adiada; selo "Alocada" em 10/11 sem distribuição confirmada; "1 alunos" no plural errado.
- Relato: [BUG-HU016-UI-002](issues/BUG-HU016-UI-002.md) (issue #505, 🟡 Média, Não bloqueante).
- Status: ❌ Falhou (1 de 4 verificações).

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

- Massa em 26/11: P1 com 5 alunos, P2 com 8 alunos, P3 com 1 aluno, todos na ida; V1, V2, V3 e M1, M2, M3 ativos (criados pela API; 5 alunos novos aprovados para completar P2).
- Ônibus, motorista, sentados e em pé iguais à prévia da API: ✅ P1 (V1+M1, 3 sentados + 2 em pé), P2 (V3+M3 com 4 sentados e V2+M2 com 2 sentados + 1 em pé, 1 excedente), P3 sem veículo (1 excedente).
- Selos: ✅ P1 "Alocada", P2 "Superlotada", P3 "Pendente" — os três apareceram sem precisar forçar nada além da ordem das rotas e da quantidade de alunos.
- Sem confirmar, recarregada a tela (F5): ✅ `alocacao_diaria` e `alocacao_aluno` continuaram em 0/0 em 26/11.
- Status: ✅ Passou (3/3).

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

- Massa: 18/11 (P1=4, P2=1, V1/V2/V3 e M1/M2/M3 ativos, sem distribuição — `alocacao_diaria`/`alocacao_aluno` em 0/0 antes).
- Popup "Confirmar distribuição?" aberto e desistência: ✅ nada gravado (banco confirmado em 0/0 depois de desistir).
- Confirmar: `POST /alocacao-diaria/distribuicao` retornou 201, `status_logístico: DISTRIBUIDO`; a tela mostrou "Distribuição confirmada" e "Status logístico: DISTRIBUIDO". A condição "sem toast preto" do enunciado não foi verificada separadamente nesta execução.
- Recarregar a página (F5) e reabrir 18/11: ❌ a linha "Status logístico: DISTRIBUIDO" não aparece mais e o botão "Confirmar distribuição" volta como se nada tivesse sido confirmado; a tela mostra de novo a sugestão automática (V1/M1 em P1 ida), não o que está gravado. Reproduzido de novo esperando 3s e trocando para 19/11 e voltando.
- Banco confirmado íntegro durante todo o caso: 3 linhas em `alocacao_diaria` e 5 em `alocacao_aluno` em 18/11, batendo com a confirmação.
- Variação: regravado P1 ida por `POST` manual em V3/M3 (201, `DISTRIBUIDO`); depois do F5, o lápis de P1 mostrou a sugestão automática (V1/M1), não o V3/M3 gravado — confirma que a tela não lê o persistido.
- Relato: [BUG-HU016-UI-003](issues/BUG-HU016-UI-003.md) (issue #506, 🟠 Alta, Bloqueante).
- Status: ❌ Falhou (2 de 3 verificações).

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

- Massa em 27/11: P1 com 6 alunos na ida, só V1 e M1 ativos (V2 e V3 inativados); 5 cabem, 1 excedente (Aluno H Um Farias, agendamento 30).
- Confirmação permitida e mensagem de sucesso exibida: ✅ `POST` retornou 201, `status_logístico: DISTRIBUIDO`.
- Aviso lista os excedentes com nome legível: ❌. A resposta do `POST` veio com `excedentes: []` e sem citar o agendamento 30; a tela de Excedentes mostrou "Agendamento #30", não o nome do aluno.
- "Aguardando alocação do veículo" no app do aluno excedente: 🚫 não executada — o aluno foi realocado antes dessa checagem, no preparo do CT-007, e a verificação nunca chegou a ser feita na tela do aluno; fica para o reteste.
- Banco: 5 linhas `ALOCADO` em `alocacao_aluno` (agendamentos 25 a 29); nenhuma para o agendamento 30.
- Relato: [BUG-HU016-UI-004](issues/BUG-HU016-UI-004.md) (issue #507, 🟡 Média, Não bloqueante).
- Status: ❌ Falhou (1 de 3 verificações falhou; 1 de 3 ficou 🚫 não executada).

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

- Massa em 30/11: P1 ida (A, B) + volta (B, C), P2 ida (D); sugestão automática P1 ida V1/M1, P1 volta V3/M3, P2 ida V2/M2 (V2 e M2 "já sugeridos para P2 no mesmo turno" — ida).
- Administrador troca o ônibus e o motorista sugeridos antes de confirmar: ✅ (AC-02) — foi possível abrir a seleção de P1 e trocar.
- Ônibus e motorista já usados por outra rota no mesmo turno não aparecem como disponíveis ou geram alerta: ❌. As listas mostraram `DEF-4G56` (V2) e Marcos Dois Souza (M2), ambos usados por P2 na ida; nenhum alerta ao escolher; o botão de confirmar ficou ativo.
- Ao confirmar com V3+M2 (a combinação literal do caso): recusado com 409, mensagem "Erro na alocação: alocação 2: motorista 2 conflitante no turno ida." Nada foi gravado nesse momento (0/0).
- Variação executada com o motorista M3 em vez de M2 (M2 estava mesmo ocupado em P2 na ida): `POST` manual com V3/M3 para P1 ida e volta respondeu 201, gravado; P2 manteve-se em V2/M2. A gravação literal de "V3 e M2" não ocorreu; a capacidade de trocar e persistir manteve as demais rotas como estavam, só com outra combinação.
- Relato: [BUG-HU016-UI-005](issues/BUG-HU016-UI-005.md) (issue #508, 🟡 Média, Não bloqueante).
- Status: ❌ Falhou (2 de 3 verificações).

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

- Massa em 27/11 (mesma do CT-005): excedente real e persistido (agendamento 30), com V2 e V3 reativados depois para servirem de "ônibus com vaga" (sem linha gravada nessa data) — condição que só existe no estado gravado, não é alcançável só pela prévia automática (o algoritmo nunca deixa excedente e ônibus com vaga coexistirem na mesma sugestão recalculada).
- Administrador seleciona o excedente e realoca para um ônibus com vaga (AC-09): ❌. A tela de Excedentes (`excedentes.tsx`) só lista cards estáticos, sem `onPress`, sem seleção e sem nenhuma ação de realocar; o único botão é "Voltar para a distribuição". Na Network, só GETs, nenhuma chamada de escrita. A realocação foi feita diretamente pela API (`POST /alocacao-diaria/distribuicao`, modo manual, mesmo formato do CT-HU016-API-008), não pela tela.
- Status do aluno passa a informar o ônibus (AC-10): ✅, verificado via `GET /alocacao-diaria/minha-viagem` do aluno H1 depois da realocação por API — `status_geral: ALOCADO`, ônibus `DEF4G56`, motorista Marcos Dois Souza, `tipo_lugar: sentado`. A mensagem "Atenção: Você foi realocado..." não se aplica: `foi_realocado: false`, porque a realocação foi dentro da mesma rota (P1), e essa flag só liga para troca entre rotas diferentes — coerente com o já observado no CT-HU016-API-008.
- Se a realocação for recusada, mostra a causa sem alterar a distribuição: 🚫 Bloqueado — depende da verificação 1 (não há, na tela, nenhuma ação de realocar para tentar e observar uma recusa).
- Relato: [BUG-HU016-UI-006](issues/BUG-HU016-UI-006.md) (issue #509, 🟠 Alta, Bloqueante). Contexto: issue #473 (decisão do PO sobre realocação entre rotas) foi fechada sem decisão registrada (sem comentário, sem caixa marcada).
- Status: ❌ Falhou (verificação 1 ❌, verificação 2 ✅, verificação 3 🚫).

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

- Massa: 24/11 (P1=1, P2=1), sem distribuição.
- Sem rede, ao abrir o dia: ✅ confirmado pelo testador — tela informa a falha de carregamento, sem demanda fictícia nem "Nenhum aluno agendado".
- Com rede, abrir o dia e depois desligar a rede para confirmar: ✅ mensagem de falha, sem popup de sucesso; banco confirmado em 0/0 logo depois (nada gravado).
- Religar a rede e repetir a confirmação: ✅ gravou normalmente — banco passou a ter 2 linhas em `alocacao_diaria` (P1 ida V1/M1, P2 ida V3/M3) e 2 em `alocacao_aluno`.
- Status: ✅ Passou (3/3).

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

- Contas: aluno (A), representante (R1, escolhendo "Sou representante" no login — internamente mapeado para o papel `MOTORISTA`, ver `frontend/src/services/authService.ts:42-54`) e sem sessão.
- Aluno e representante não veem o menu de alocação diária: ✅ nenhum dos dois mostra opção de Logística na barra de abas.
- URL direta (`/logistica/distribuicao`) nega o acesso: ✅ aluno e representante caem em `/acesso-negado` (erro 403); sem sessão cai na tela de login. Nenhum dado de alocação é exibido em nenhum dos três; 0 chamadas Fetch/XHR de dados de alocação na aba Network.
- Status: ✅ Passou (2/2).

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

| Caso | Defeito | Severidade | Bloqueante | Relato | Issue |
| --- | --- | --- | --- | --- | --- |
| CT-HU016-UI-001 | Cartão "Rodízio de frota" aparece no painel e abre uma página de erro | 🟡 Média | Não bloqueante | [BUG-HU016-UI-001](issues/BUG-HU016-UI-001.md) | #504 |
| CT-HU016-UI-002 | Histórico mostra botões para editar e confirmar a distribuição de dias passados | 🟡 Média | Não bloqueante | [BUG-HU016-UI-002](issues/BUG-HU016-UI-002.md) | #505 |
| CT-HU016-UI-004 | Depois de recarregar, a tela de Distribuição não mostra o dia como distribuído e exibe a sugestão automática no lugar do que está gravado | 🟠 Alta | Bloqueante | [BUG-HU016-UI-003](issues/BUG-HU016-UI-003.md) | #506 |
| CT-HU016-UI-005 | Aviso de alunos excedentes mostra "Agendamento #30" em vez do nome do aluno | 🟡 Média | Não bloqueante | [BUG-HU016-UI-004](issues/BUG-HU016-UI-004.md) | #507 |
| CT-HU016-UI-006 | Tela de alocação não avisa ônibus/motorista já usados por outra rota no mesmo turno; o conflito só é recusado ao confirmar, com mensagem técnica | 🟡 Média | Não bloqueante | [BUG-HU016-UI-005](issues/BUG-HU016-UI-005.md) | #508 |
| CT-HU016-UI-007 | Tela de excedentes não permite realocar o aluno para um ônibus com vaga; os cards são apenas informativos | 🟠 Alta | Bloqueante | [BUG-HU016-UI-006](issues/BUG-HU016-UI-006.md) | #509 |

Numeração dos relatos (`BUG-HU016-UI-001` a `006`) não segue a numeração dos CTs — ver a coluna "Caso" para o mapeamento.

## Observações gerais

- Referências: [requisitos, seção 7.6](../../../../../docs/requisitos.md), [BDD do épico 05](../../../../../bdd/features/epico-05/README.md) e as [decisões do PO na #465](https://github.com/GOUOCE/GOUCE-app/issues/465).
- O PR #457 já está mesclado na `develop`; SHA efetivamente testado: `0f90c961e484ed1045017d04b1bad15d09b0818c`. A decisão do PO sobre o rodízio (HU-020 adiada) vale para o cartão do painel.
- Padrão de 401 seguido de `refresh` e nova tentativa observado nas chamadas autenticadas (token de acesso com 15 min de vida); comportamento esperado da renovação automática, não é defeito da HU-016.
- Risco de leitura observado: quando o `refresh` falha, a tela chega a mostrar "Não autenticado" com botão de repetir, em vez de redirecionar direto ao login.
- Avisos no Console do navegador, sem relação direta com a HU-016: `useNativeDriver` não suportado na Web; `shadow*`/`pointerEvents` depreciados; `[Layout children] No route named "logistica/embarque"` (aviso de rota não registrada no layout, apesar de a tela abrir); "Violation" de handler; `aria-hidden`; "A form field element should have an id or name attribute" / password field not contained in a form.
- Toast "GO_BACK was not handled by any navigator" ao voltar em alguns fluxos.
- Popup de tradução automática do Brave apareceu em algumas telas (ruído do navegador, não do app).
- "1 alunos agendados" — plural incorreto (CT-002).
- Placa exibida como "ABC1D23" em alguns pontos e "ABC-1D23" em outros (sem o hífen vs. com o hífen) — inconsistência de formatação, não investigada a fundo.
- Popup de confirmação com excedente mostrou "6 aluno(s)", contando o excedente junto com os alocados (CT-005).
- Aviso de rodízio de frotas (AC-15) na tela de alocação, mesmo com a HU-020 adiada (ver BUG-HU016-UI-001).
- P2 (Rota Campo - IFCE) só apareceu com demanda de ida em toda a execução; nenhuma massa desta suíte teve volta de P2.
- O dado de entrada do CT-HU016-UI-007 (excedente real coexistindo com ônibus com vaga) não é alcançável só pela prévia automática recalculada — o algoritmo de distribuição sempre usa toda a frota ativa até não sobrar vaga antes de gerar excedente, então excedente e vaga nunca aparecem juntos na mesma sugestão. Só existe no estado **gravado** (uma distribuição confirmada com frota menor, seguida da reativação de mais veículos).
- A issue [#473](https://github.com/GOUOCE/GOUCE-app/issues/473) (decisão do PO sobre realocação entre rotas e lista vazia no modo manual) foi fechada pelo autor 1m47s depois de aberta, sem nenhum comentário e sem nenhuma opção marcada — não há decisão registrada, apesar de fechada.
- `foi_realocado` ficou `false` na realocação manual de excedente dentro da mesma rota (CT-007) — coerente com o comportamento já registrado em `CT-HU016-API-008`; a flag só liga para realocação entre rotas diferentes.
- A numeração dos relatos de defeito de UI (`BUG-HU016-UI-001` a `006`) não segue a numeração dos CTs (ver tabela de defeitos); a suíte de API também tem numeração de relatos inconsistente com os CTs correspondentes.
- Documentação desatualizada: o Alembic head realmente aplicado no banco testado é `82_create_alocacao_diaria`; outra documentação do projeto referencia `82_updated_at_faculdade_ponto` como head.
- `"representante"` e `"supervisor"` são mapeados internamente para o mesmo papel `MOTORISTA` (`frontend/src/services/authService.ts:42-54`), e a aba "Minha Rota" do grupo `(representante)` ainda é um placeholder (`rota.tsx`, só renderiza o texto "Minha Rota") — fora do escopo da HU-016, registrado aqui como contexto.
- Ao apertar F5, a tela de Distribuição Logística volta para a semana/dia de hoje, não para a data que estava aberta (a data não faz parte da URL).
- CT-HU016-UI-005, verificação 3 ("Aguardando alocação do veículo" no app do aluno excedente): 🚫 não executada — o aluno foi realocado antes dessa checagem, no preparo do CT-007. Fica para o reteste.
