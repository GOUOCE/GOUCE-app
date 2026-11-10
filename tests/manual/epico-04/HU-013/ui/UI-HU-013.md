# Testes manuais de UI — HU-013 — Agendamento de Transporte

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Agendamento de Transporte — Aluno (EP-004) |
| Funcionalidade | HU-013 — Agendamento de Transporte |
| Camada | UI — versão web (celular quando disponível) |
| Tipo de teste | Funcional manual essencial — foco na funcionalidade; um único caso trata mensagem de falha |
| Telas | **Agendar Transporte** (escolha do dia) → **Novo agendamento** (ida e volta) → confirmação → edição/cancelamento do dia agendado |
| Base | Front do [PR #377](https://github.com/GOUOCE/GOUCE-app/pull/377) (`feature/front-hu013`, `ee305857`), a branch da HU-013; as mesmas telas aparecem, com variações, no [PR #378](https://github.com/GOUOCE/GOUCE-app/pull/378) (`739c8f89`), que as incorporou; API da `develop` |
| Requisitos | [Seção 7.5.1](../../../../../docs/requisitos.md), [BDD da HU-013](../../../../../bdd/features/epico-04/HU-013.feature), decisões do PO na [#389](https://github.com/GOUOCE/GOUCE-app/issues/389) e pendências do back e do front na [#390](https://github.com/GOUOCE/GOUCE-app/issues/390) |
| Ambiente | Versão web em `http://localhost:3013`, front do PR #377 `ee305857`; API da `develop` (`36f3cb52`) em `http://localhost:8014`, banco limpo, fuso America/Fortaleza |
| Total de casos | 9 |
| Última execução | 10/11/2026 (análise do código; nenhum caso executado na tela) |
| Testador | Cauan Ricardo; Claude Code: massa, conferência de API/banco e análise do código |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ❌ Reprovada (8 ❌ e 1 ⚠️, todos por leitura do código) | 9 | 0 | 8 | 1 | 0 | 0 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | Web do PR #377 `ee305857` conectada à API da `develop` em stack isolada, com migrations até a 82. Anotar commits, URL e fuso. |
| PC-02 | Alunos A e B aprovados, com vínculo válido; rotas principais **Rota Centro - UFC** e **Rota Planalto - IFCE** ativas, complementares C1 e C2, pontos e IES cadastrados pela API de administração. |
| PC-03 | A sem reservas futuras no início. Datas em dias úteis dentro da janela de D a D+29; D é a data local do servidor. |
| PC-04 | Esperados seguem requisitos, BDD e decisões do PO (#389): calendário só com Disponível, Agendado e Indisponível; sábado e domingo indisponíveis; mensagens “Agendamento realizado com sucesso”, “Nenhum agendamento foi criado.” e “Já existe um agendamento ativo para este dia. Edite ou cancele o agendamento existente.”. |
| PC-05 | A conferência de API e banco é feita por Claude Code depois de cada caso; a observação na tela é de Cauan. |

## Resumo da execução

Os casos foram reduzidos aos que validam a funcionalidade. Cenários de rede ligada e desligada ficaram de fora, exceto o CT-009, que só confere a mensagem exibida quando o servidor recusa ou não responde. A análise do código do commit `ee305857` (PR #377) mostra que a tela de agendamento ainda é um protótipo; por isso, a pedido do testador, os nove casos foram reprovados por **leitura do código** (o CT-002 como divergência entre requisito e protótipo), com a evidência de cada um no detalhamento. A execução na tela será feita no reteste.

### Seção A — Escolher o dia

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU013-UI-001 | Dias reais vindos da API | A sem reservas; semana atual e as seguintes da janela | Dias, estados (Disponível, Agendado, Indisponível) e janela de D a D+29 vindos da API; sábado e domingo indisponíveis; sem feriado | ❌ FALHOU | A tela mostra uma semana fixa de 31/08 a 06/09/2026, escrita no código, com todos os dias já selecionados. #437 |
| CT-HU013-UI-002 | Selecionar um dia disponível | Um dia útil disponível | Só a data selecionada e o botão **Novo agendamento** (requisito, AC-03) | ⚠️ PARCIAL | A tela e o Figma usam seleção de vários dias e **Continuar**; o requisito diz outra coisa. Divergência a decidir com o PO. #437 |

### Seção B — Novo agendamento

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU013-UI-003 | Perguntas de ida e volta, campos condicionais e listas ativas | Ida Sim/Não e volta Sim/Não | Campos de cada trecho só quando a resposta é Sim; listas só com pontos, IES e complementares ativos cadastrados pelo administrador | ❌ FALHOU | As listas vêm de dados fixos do app (a rota de opções não existe), e o formulário abre com tudo pré-selecionado. #438 |
| CT-HU013-UI-004 | Criar só ida, só volta e ida e volta | Três combinações válidas | Mensagem “Agendamento realizado com sucesso”, reserva gravada com os dados escolhidos e dia marcado como agendado | ❌ FALHOU | Só dias passados podem ser escolhidos, a API recusa e a tela mostra sucesso mesmo assim. #439 |
| CT-HU013-UI-005 | Não para ida e volta | Ida Não e volta Não | Nenhuma reserva criada e mensagem “Nenhum agendamento foi criado.”, sem erro | ❌ FALHOU | A mensagem não existe no app nem na API (#390). #439 |

### Seção C — Regras e recusas

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU013-UI-006 | Duplicidade, trajeto sem rota e campos obrigatórios | Dia já agendado; ponto e IES sem rota; Sim sem ponto ou IES | Cada recusa mostra a mensagem correspondente e nada é gravado | ❌ FALHOU | Erros do servidor são engolidos e a tela segue para a confirmação. #439 |
| CT-HU013-UI-007 | Limite de 22 agendamentos e janela de datas | A com 22 ativos; dia D+30 | Recusa com mensagem; nenhuma reserva a mais; só D a D+29 selecionáveis | ❌ FALHOU | Mesmo erro engolido; a janela é uma semana fixa. #437, #439 |
| CT-HU013-UI-008 | Editar e cancelar o dia agendado | Reserva existente; alterar trechos; Não para ida e volta | A edição atualiza a mesma reserva; Não para ida e volta é tratado como cancelamento, com confirmação | ❌ FALHOU | A edição cria nova reserva e o cancelamento usa a data como id. #440 |

### Seção D — Mensagem de falha

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU013-UI-009 | Falha do servidor ou sem conexão ao salvar | Servidor recusa; servidor indisponível | Mensagem clara no padrão de popup do app; nada é gravado; sem sucesso falso | ❌ FALHOU | Nenhum erro é exibido ao salvar; o serviço inventa o sucesso. #439 |

## Detalhamento dos casos

### Seção A — Escolher o dia

#### CT-HU013-UI-001 — Dias reais vindos da API

**Dados de entrada:** A sem reservas futuras; mês atual e o seguinte.

**Passos**

1. Abrir **Agendar Transporte** pelo atalho do Início ou pela rota `/agendar-transporte`.
2. Conferir os dias exibidos, os estados e a navegação entre os meses.
3. Comparar com `GET /transporte/agendamentos/calendario?mes=YYYY-MM`.

**Resultado esperado**

- Os dias e seus estados (**Disponível**, **Agendado** e **Indisponível**) vêm da API; sábado e domingo e dias sem rota ativa indisponíveis; só de D a D+29 selecionáveis; sem feriado (AC-01, AC-02; decisões 1 a 3 do PO). O requisito fala em calendário mensal (AC-17), mas o Figma da HU-013 mostra seletor semanal; o formato fica como pergunta ao PO.

**Resultado obtido**

- Reprovado por leitura do código do commit `ee305857`, sem executar a tela.
- `index.tsx` desenha a lista fixa `DATAS_EXEMPLO`: segunda 31/08 a domingo 06/09/2026, com 03/09 “agendado”, sábado “indisponível” e o domingo como “feriado” (o PO decidiu retirar feriado e recesso do calendário). O subtítulo diz “nesta semana”. Não há chamada ao calendário da API nem navegação de mês, e todas as datas são anteriores a hoje (10/11/2026). Ao abrir a tela, todos os dias disponíveis já vêm selecionados.
- Back (conferido na API em 10/11/2026): sábado 14/11 e domingo 15/11 voltam como `DISPONIVEL` no calendário, e o `POST` em um sábado foi aceito (#390, item 1).
- Status: ❌ Falhou (por leitura do código). Issue: #437.

---

#### CT-HU013-UI-002 — Selecionar um dia disponível

**Dados de entrada:** um dia útil disponível.

**Passos**

1. Tocar em um dia disponível do calendário.
2. Conferir o que aparece na área inferior.

**Resultado esperado**

- Aparecem só a data selecionada e o botão **Novo agendamento** (AC-03).

**Resultado obtido**

- O toque alterna uma seleção de **vários dias**, mostra “N dias selecionados” e o botão **Continuar**, que abre o formulário dia a dia; não existe o botão **Novo agendamento**.
- O Figma da HU-013 (telas 42 a 45) mostra exatamente esse desenho (seletor semanal, vários dias, **Continuar**), e o texto do requisito (AC-03) diz outra coisa. É divergência entre requisito e protótipo, não defeito do código; fica como pergunta ao PO.
- Status: ⚠️ Parcial (divergência de requisito). Issue: #437.

---

### Seção B — Novo agendamento

#### CT-HU013-UI-003 — Perguntas de ida e volta, campos condicionais e listas ativas

**Dados de entrada:** respostas Sim e Não para ida e volta.

**Passos**

1. Abrir o formulário de um dia.
2. Alternar Sim e Não da ida e da volta e conferir os campos.
3. Abrir cada lista e comparar com os cadastros ativos da API.

**Resultado esperado**

- Campos de ida só com “Sim” e campos de volta só com “Sim”, independentes entre si; listas puxando só dados ativos do administrador (AC-04 a AC-08).

**Resultado obtido**

- Reprovado por leitura do código. Os controles Sim/Não existem e alternam os campos (a conferir na tela no reteste).
- As listas não vêm do administrador: `obterOpcoesAgendamento` chama `GET /agendamentos/opcoes`, rota que **não existe** (a API de agendamento não tem rota de opções para o aluno; `GET /transporte/agendamentos/opcoes` responde `422`, #390 item 3), e cai numa lista fixa do app (“Igreja Matriz de Quixadá”, “Praça dos Leões”, “Terminal Rodoviário de Quixadá”, “Acesso ao Campus da UFC”; “UFC”, “IFCE” e “UECE - FECLEISC”). Os valores dessas opções são ids que não correspondem aos cadastros reais (na massa, o id 1 é “Praça do Campo Velho”).
- O formulário abre com ida **Sim**, volta **Sim**, ponto `1` e IES `1` já escolhidos, o que impede perceber um campo vazio.
- Status: ❌ Falhou (por leitura do código). Issue: #438.

---

#### CT-HU013-UI-004 — Criar só ida, só volta e ida e volta

**Dados de entrada:** três combinações válidas.

**Passos**

1. Escolher um dia, responder as perguntas e confirmar cada combinação.
2. Conferir a mensagem, o status do dia e a reserva na API.

**Resultado esperado**

- Mensagem “Agendamento realizado com sucesso”, reserva gravada com os dados escolhidos e dia agendado (AC-09, AC-14).

**Resultado obtido**

- Reprovado por leitura do código. Só as datas de 31/08 a 06/09/2026 são escolhíveis, e todas são passadas; a API recusa data fora da janela (`422 DATA_FORA_DA_JANELA`).
- `criarAgendamento`, no serviço, captura qualquer falha e **devolve uma resposta inventada** (`mensagem: 'Agendamento realizado com sucesso'`, `estado_dia: 'AGENDADO'`); além disso, `handleSalvarDia` tem um `catch` vazio (“Fallback”). Em qualquer recusa da API a tela segue para a confirmação “N agendamentos realizados com sucesso!”, sem reserva gravada. Com mais de um dia, mostra o toast preto “Agendamento salvo. Avançando para o próximo dia.”.
- Status: ❌ Falhou (por leitura do código). Issue: #439.

---

#### CT-HU013-UI-005 — Não para ida e volta

**Dados de entrada:** ida Não e volta Não.

**Passos**

1. Responder Não para ida e volta e confirmar.
2. Conferir a mensagem e a API.

**Resultado esperado**

- Nenhuma reserva criada e a mensagem “Nenhum agendamento foi criado.”, sem erro (AC-10; decisão 4b do PO).

**Resultado obtido**

- Reprovado por leitura do código: o texto “Nenhum agendamento foi criado.” não existe no app. A tela envia o `POST` com os dois trechos falsos; a API (conferida em 10/11/2026) responde `422 FA-003` (“Selecione pelo menos um trecho: ida ou volta.”) em vez de `200` com a mensagem (#390, item 5), e a tela engole o erro e mostra a confirmação de sucesso.
- Status: ❌ Falhou (por leitura do código). Issue: #439.

---

### Seção C — Regras e recusas

#### CT-HU013-UI-006 — Duplicidade, trajeto sem rota e campos obrigatórios

**Dados de entrada:** dia já agendado; ponto e IES sem rota; Sim sem ponto ou IES.

**Resultado esperado**

- Dia já agendado: “Já existe um agendamento ativo para este dia. Edite ou cancele o agendamento existente.” (FA-001). Trajeto sem rota: aviso de indisponibilidade (FA-002). Campos pendentes destacados e salvamento bloqueado (FA-003).

**Resultado obtido**

- Reprovado por leitura do código. A API devolve `409 FA-001` (texto antigo, “Já existe agendamento ativo para este dia.”, #390 item 2) e `422 FA-002` com a mensagem do trajeto, mas o serviço devolve uma resposta de sucesso inventada e a tela vai à confirmação. Para os dias fixos marcados como agendados, a tela abre o popup “Agendamento já existente — Deseja editar o agendamento existente?”, que não é a mensagem do requisito.
- Os avisos de campo obrigatório existem no esquema de validação (“Selecione o ponto de embarque”, “Selecione a faculdade (IES) de destino” e equivalentes da volta), mas o formulário abre pré-preenchido; essa parte fica para confirmar na tela.
- Status: ❌ Falhou (por leitura do código). Issue: #439.

---

#### CT-HU013-UI-007 — Limite de 22 agendamentos e janela de datas

**Dados de entrada:** A com 22 ativos; dia D+30.

**Resultado esperado**

- A 23ª tentativa é recusada com mensagem e nada é gravado; datas além de D+29 não podem ser selecionadas (AC-02).

**Resultado obtido**

- Reprovado por leitura do código. A API recusa com `422 LIMITE_AGENDAMENTOS` (conferido em 10/11/2026) e `422 DATA_FORA_DA_JANELA`, mas o serviço devolve sucesso inventado (#439) e a tela não tem janela real, só a semana fixa (#437).
- Status: ❌ Falhou (por leitura do código). Issues: #437, #439.

---

#### CT-HU013-UI-008 — Editar e cancelar o dia agendado

**Dados de entrada:** reserva existente; alterar os trechos; Não para ida e volta.

**Resultado esperado**

- A edição atualiza a **mesma** reserva (mesmo id). Não para ida e volta é tratado como cancelamento, com o mesmo alerta de confirmação da HU-014 (AC-16).

**Resultado obtido**

- Reprovado por leitura do código. No modo de edição, `handleSalvarDia` chama `atualizarAgendamento(1, payloadApi)`: o id **1 está escrito no código**, então a edição tenta alterar `PUT /transporte/agendamentos/1`, que não é a reserva do dia.
- `handleConfirmarCancelamento` chama `cancelarAgendamento(dataIsoAtual)`, ou seja, `DELETE /transporte/agendamentos/2026-09-02`, com a data no lugar do id; se a API recusa, o serviço devolve `{ success: true }` e a tela mostra “Agendamento cancelado com sucesso” em toast preto e volta ao Início.
- Não foi identificado no código o tratamento de “Não para ida e volta” como cancelamento.
- Status: ❌ Falhou (por leitura do código). Issue: #440.

---

### Seção D — Mensagem de falha

#### CT-HU013-UI-009 — Falha do servidor ou sem conexão ao salvar

**Dados de entrada:** servidor recusando; servidor indisponível.

**Resultado esperado**

- Mensagem clara, no padrão de popup do app, sem sucesso falso e sem gravação.

**Resultado obtido**

- Reprovado por leitura do código: ao salvar, nenhum erro é exibido (o serviço devolve sucesso inventado e o `catch` da tela está vazio) e a tela segue para o sucesso. As mensagens de sucesso do fluxo usam o `Snackbar` escuro, que no Figma da HU-013 faz parte do desenho (ver #413).
- Status: ❌ Falhou (por leitura do código). Issue: #439.

## Rastreabilidade

| Critério/regra | Casos UI | Complemento API |
| --- | --- | --- |
| AC-01, AC-02, AC-17 — calendário mensal e janela | 001, 007 | API-002, API-008 |
| AC-03 — dia selecionado e **Novo agendamento** | 002 | — |
| AC-04 a AC-08 — perguntas e campos | 003 | API-002, API-006 |
| AC-09, AC-14 — criar e confirmar | 004 | API-003 |
| AC-10 — Não para ida e volta | 005 | API-004 |
| AC-11, FA-001 a FA-003 — recusas | 006 | API-005, API-006, API-007 |
| AC-02 — limite de 22 ativos | 007 | API-009 |
| AC-16 — edição e cancelamento | 008 | API-010 |
| RNF-012 — falha sem gravação parcial | 009 | API-012 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-001, 002, 007 | A tela **Agendar Transporte** usa uma semana fixa de 31/08 a 06/09/2026 escrita no código (datas passadas, sem API, todos os dias já selecionados). | #437 |
| CT-003 | O formulário usa listas fixas do app (a rota de opções não existe) e abre com Sim, ponto e IES pré-selecionados. | #438 |
| CT-004, 005, 006, 007, 009 | Quando a API recusa, o serviço devolve uma resposta de sucesso inventada e a tela mostra sucesso; as mensagens do PO reais não aparecem. | #439 |
| CT-008 | A edição atualiza sempre o id 1 e o cancelamento usa a data como id, com sucesso inventado se a API recusar. | #440 |
| Exploratório | A barra de abas do aluno mostra “(tabs)/home”, “(tabs)/agenda” e uma aba “agendar-tra…”, com ícones padrão, porque as telas foram movidas para `(tabs)` sem atualizar o layout. | #442 |
| CT-001, 005, 006 | Sábado e domingo disponíveis, “Não” para ida e volta e mensagem de duplicidade fora do requisito (back). | #390 |
| CT-004, 009 | Toast escuro nas mensagens do fluxo (no Figma da HU-013 é o desenho; confirmar o padrão com o design). | #413 |

## Observações gerais

- Execução de 10/11/2026: análise do código do commit `ee305857` do PR #377 (branch da HU-013) e conferência da API da `develop` em execução. No PR #378, que incorporou estas telas, o serviço já não inventa a resposta de `criarAgendamento` e a edição usa o id recebido, mas a semana fixa, as listas fixas, o `catch` vazio da tela e os toasts pretos continuam iguais. Os nove casos foram reprovados por leitura do código, a pedido do testador, para não gastar execução manual em falhas evidentes; a execução na tela será feita no reteste, quando o front deixar de usar a semana fixa e as listas fixas.
- O back ainda tem as divergências da #390: fim de semana disponível, `Não` para ida e volta com `422`, mensagem de duplicidade antiga e ausência de rota de opções para o aluno.
- **Figma da HU-013 (telas 42 a 45):** seletor semanal com seleção de vários dias e **Continuar**, formulário “Novo Agendamento” com campos que começam em “Selecionar”, tela “N agendamentos realizados com sucesso!”, “Editar Agendamento” com **Cancelar Agendamento** e **Salvar alterações**, e faixas escuras para “cancelado” e “alterado com sucesso”. O código segue esse desenho; o texto do requisito (calendário mensal, botão **Novo agendamento**) é que diverge, e a decisão cabe ao PO.
- O índice do épico indicava a UI da HU-013 como “fora desta entrega”; esta suíte a acrescenta, com nove casos de foco funcional.
- Registrar dispositivos, mensagens e o resultado de cada variação somente durante a execução na tela.
