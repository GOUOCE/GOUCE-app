# Testes manuais de UI — HU-019 — Consulta de Alocação Diária

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Alocação e Distribuição Logística (EP-005) |
| Funcionalidade | HU-019 — Consulta de Alocação Diária |
| Camada | UI — celular ou web |
| Tipo de teste | Funcional manual essencial, integração, atualização, consulta offline e desempenho percebido — baseado em risco |
| Telas | Início (Sua viagem hoje), Agenda (Próximas viagens) e Detalhes da viagem do aluno. |
| Base do planejamento | `develop` `1eb2818d` (`home.tsx`, `agenda.tsx`, `agendamento-detalhes.tsx` e `agendamentoService.ts`) |
| Branch de planejamento | `test/planejamento-api-ui-hu-019`, com entrega para `develop` |
| Revisão do planejamento | 16/11/2026 — requisitos 7.6 com as decisões do PO (#465), BDD do épico 05 e leitura do código |
| Ambiente | Versão web em http://localhost:3121, API em http://localhost:8121 (stack `atu-exec-hu019`, banco novo, fuso America/Fortaleza); front e API da `develop` `6059f33b`; massa `.qa/seed07.py` |
| Total de casos | 9 |
| Última execução | 19/11/2026 |
| Testador | Cauan Ricardo — execução manual; LLM — massa e conferência de API/banco |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ⚠️ Concluída com ressalvas | 9 | 7 | 1 | 1 | 0 | 0 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | Front e API da `develop` `1eb2818d`. A consulta de alocação já está integrada nas telas do aluno. Registrar URL, SHAs e navegador. |
| PC-02 | Cauan executa a UI; a LLM prepara a massa, confirma distribuições novas, cria a realocação por fixture documentada e confere API/banco depois de cada caso. |
| PC-03 | Usar a massa da [suíte de API](../api/API-HU-019.md): A e B, reservas em D+1 a D+3 e as distribuições correspondentes. |
| PC-04 | Para offline e troca de conta, sincronizar dados reais antes de desligar a rede e guardar captura; a LLM mantém acesso independente ao servidor. |
| PC-05 | Os esperados seguem requisitos 7.6, BDD e decisões do PO; os riscos de leitura do [guia da API](../api/README.md) não são defeitos reproduzidos. Toda a suíte está pendente. |

## Resumo da execução

Executar na ordem e registrar cada variação. A LLM prepara distribuições e mudanças entre os passos e confere a resposta correspondente da API.

### Seção A — Consulta na tela do aluno

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU019-UI-001 | Resumo da viagem do dia no Início | Aluno A com reserva de hoje distribuída (ida com complementar e volta direta); depois sem reserva de hoje. | Início mostra a viagem de hoje com ônibus e motorista; sem reserva, o resumo não aparece. | ✅ PASSOU | Executado em 19/11/2026 (aluna Alice, hoje). O Início mostra “Sua viagem hoje” com “Ida — Rota Centro - UFC” e “Volta — Rota Centro - UFC”, “Alocação confirmada”, “V1 - Placa ABC1D23 • Motorista: Marcos Alfa”, “Saída 06:30”, “Retorno 17:30” e, na ida, “Complementar: Van 2 • Conexão: Igreja Matriz”, iguais à API. A reserva de hoje foi criada para 26/11 e movida para 19/11 no banco (a API só aceita a partir de amanhã) e distribuída pela API. Depois a LLM cancelou a reserva pela API (SEM_AGENDAMENTO) e, ao recarregar, o cartão “Sua viagem hoje” sumiu. |
| CT-HU019-UI-002 | Agenda: cartão do dia com a situação da alocação | Reservas de A em D+1 (alocada), D+2 (sem distribuição) e D+3 (parcial); aba Agenda → Próximas viagens. | Cada cartão mostra a situação e, quando alocado, ônibus e motorista. | ✅ PASSOU | Executado em 19/11/2026 (aluna Alice, Agenda → Próximas viagens). 20/11/2026: ida “Alocação confirmada” V1 - Placa ABC1D23 • Marcos Alfa e volta “Alocação confirmada” V3 - Placa HIJ7K89 • Mauro Beta; 23/11/2026: ida e volta “Aguardando alocação do veículo”, sem dados de frota; 24/11/2026: ida “Alocação confirmada” V1 - Placa ABC1D23 • Marcos Alfa e volta “Aguardando alocação do veículo”. Tudo igual à API. |
| CT-HU019-UI-003 | Detalhes: ônibus, rota, motorista, horário, ponto e faculdade por turno | Reserva de A com ida (V1/M1) e volta (V3/M2) em D+1; Ver detalhes. | Ida e volta separadas com todos os campos do AC-01. | ✅ PASSOU | Executado em 19/11/2026 (Alice, detalhes de 20/11/2026). Ida: “V1 - Placa ABC1D23”, “Rota Centro - UFC (UFC)”, ponto de embarque Praça José de Barros, desembarque Universidade Federal do Ceará, motorista Marcos Alfa, Horário de Saída 06:30, “Alocação confirmada”. Volta: “V3 - Placa HIJ7K89”, “Rota Centro - UFC (UFC)”, embarque Universidade Federal do Ceará, desembarque Praça José de Barros, motorista Mauro Beta, 17:30, “Alocação confirmada”. Ida e volta separadas com os seus próprios ônibus e motoristas, iguais à API. Observações de UX: o rótulo da volta é “Horário de Saída” com o horário de retorno (17:30); deve ser corrigido para “Horário de Retorno” (decisão de Cauan). O título “Ida” parcialmente coberto no topo era só a rolagem da tela, sem defeito. Relato [BUG-HU019-UI-002](issues/BUG-HU019-UI-002.md) (issue #531, rótulo do horário na volta, Não bloqueante). |

### Seção B — Situações sem alocação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU019-UI-004 | Aguardando alocação do veículo, sem dados de frota | Reserva de A em dia sem distribuição; depois excedente da HU-016. | Mensagem de espera e nenhuma informação de ônibus ou motorista. | ✅ PASSOU | Executado em 19/11/2026. Parte 1 (Alice, detalhes de 23/11/2026, sem distribuição): “Aguardando alocação do veículo” na ida e na volta, sem ônibus, placa nem motorista (segundo o relato de Cauan e a API). Parte 2 (Gabriela, excedente da distribuição de 27/11/2026): os detalhes mostram só a Rota Centro - UFC, o ponto de embarque Praça José de Barros, o desembarque Universidade Federal do Ceará, o horário de saída 06:30 da rota e “Aguardando alocação do veículo”, sem ônibus, placa nem motorista; a API confirma AGUARDANDO_ALOCACAO. O excedente permanece aguardando. |
| CT-HU019-UI-005 | Alocação parcial: cada turno com a sua situação | Reserva de A com a ida alocada e a volta sem alocação. | Ida com frota e volta aguardando. | ✅ PASSOU | Executado em 19/11/2026 (Alice, 24/11/2026). Agenda e detalhes: a ida mostra “Alocação confirmada” com V1 - Placa ABC1D23 e Marcos Alfa; a volta mostra “Aguardando alocação do veículo” sem dados de frota, iguais à API (PARCIALMENTE_ALOCADO). O cartão da Agenda já tinha mostrado isso; Cauan relatou os detalhes sem diferença. |
| CT-HU019-UI-006 | Aluno realocado: aviso destacado | Aluno realocado para ônibus de outra rota (distribuição ou fixture isolada documentada pela LLM). | Aviso visual destacado com o texto do requisito. | ✅ PASSOU | Executado em 19/11/2026 (Carla, 25/11/2026, reserva da Rota Centro - UFC realocada pela distribuição manual para a Rota Campo - IFCE, V2/Mauro Beta). Os detalhes mostram, em caixa amarela destacada com ícone de alerta, “Atenção: Você foi realocado. Seu ônibus para hoje é o veículo V2 - Placa DEF4G56.”, e abaixo V2 - Placa DEF4G56, “Rota Campo - IFCE (UFC)”, Praça José de Barros → Universidade Federal do Ceará, motorista Mauro Beta, saída 06:40 e “Alocação confirmada”; no dia 27/11/2026 da Carla, sem realocação, o aviso não aparece (relato de Cauan). A realocação foi criada pela distribuição manual (a API passou a aceitar troca de rota após a #478), sem fixture em SQL. Observações de UX: a placa vem junto do apelido no aviso (“V2 - Placa DEF4G56”), o que poderia ser mais organizado; o texto diz “para hoje” mesmo para um dia futuro (texto do requisito). |

### Seção C — Atualidade e desempenho

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU019-UI-007 | Dado atualizado depois de nova distribuição | A alocado em V1/M1; a LLM confirma nova distribuição que passa A para V3/M2; reabrir a Agenda e os detalhes. | Tela mostra o ônibus e o motorista novos. | ✅ PASSOU | Executado em 19/11/2026 (Alice, 20/11/2026). Antes: ida no V1 - Placa ABC1D23 com Marcos Alfa. Às 00:50:07 a LLM confirmou nova distribuição manual que passou a ida da Alice para o V3 com Mauro Beta (API: V3 HIJ7K89, Mauro Beta na ida e na volta). Depois de voltar à Agenda e reabrir os detalhes, a tela mostra a ida em “V3 - Placa HIJ7K89”, motorista Mauro Beta, 06:30, e a volta em V3 - Placa HIJ7K89, Mauro Beta, 17:30, iguais à API, sem dado antigo (print). Não foi registrado se foi preciso recarregar a página; o risco de cache do plano não se confirmou neste caminho. |
| CT-HU019-UI-008 | Falha na consulta da alocação, offline e troca de conta | A alocado e já sincronizado; derrubar apenas a consulta de alocação (API ou rede); modo offline; logout de A e login de B. | Sem falso “Aguardando”; offline mostra o último dado sincronizado; B não vê dados de A. | ❌ FALHOU | Executado em 19/11/2026 por Cauan Ricardo (relato) e revalidado integralmente pela LLM no Chrome automatizado, em 19/11/2026 às 01:00 (conta de teste local, Alice e Bruno). Parte 1, consulta de alocação com erro e rede ligada: a LLM renomeou a tabela `alocacao_diaria` (01:00:21 a 01:00:29), `minha-viagem` devolveu 500 e `agendamentos/meus` seguiu em 200; ao recarregar a Agenda, o 20/11/2026, que está alocado (V3 HIJ7K89, Mauro Beta), passou a mostrar “Aguardando alocação do veículo” na ida e na volta, sem aviso de indisponibilidade. Com a tabela restaurada e a Agenda recarregada, a alocação voltou (V3 - Placa HIJ7K89, Mauro Beta). Causa no código: `obterMinhaViagem` captura qualquer erro e devolve `null` (`agendamentoService.ts`), e a tela monta o dia sem alocação. Parte 2, offline: com a API parada, a Agenda recarregada mostrou o banner “Visualização Offline (Dados salvos no dispositivo)” e manteve o 20/11 como “Alocação confirmada”, V3 - Placa HIJ7K89, Mauro Beta; passou. Parte 3, troca de conta: depois de sair da conta da Alice o armazenamento local ficou vazio (cache apagado no logout); entrando como Bruno, a Agenda mostrou só os dados dele (20/11: ida V1 ABC1D23 com Marcos Alfa e volta V2 DEF4G56 com Miguel Gama) e, com a API parada, o banner offline e os mesmos dados dele, sem nada da Alice; passou. Limite: o login offline não é possível, então o Bruno entrou com a API ligada antes de ela ser parada. Relato [BUG-HU019-UI-001](issues/BUG-HU019-UI-001.md) (issue #530, Bloqueante). |
| CT-HU019-UI-009 | Tempo de abertura da Agenda com várias reservas (RNF-001) | A com 7 e depois 22 reservas ativas, parte delas distribuídas; abrir a Agenda e o Início em rede normal. | Telas utilizáveis em até 3 segundos. | ⚠️ PARCIAL | Executado em 19/11/2026 pela LLM, a pedido de Cauan, no Chrome automatizado (web, localhost, sem latência de rede real; o tempo é de carga completa da página até a Agenda mostrar “Alocação confirmada” ou “Aguardando alocação do veículo”, medido com `performance.now()`). Com 7 reservas ativas da Alice (parte distribuída): Agenda 1017, 524 e 563 ms; Início 192, 185 e 178 ms. Com 20 reservas ativas (13 delas criadas pela LLM; a janela de agendamento de 30 dias impede chegar às 22 do plano, e o limite do sistema é 22): Agenda 1007, 845 e 952 ms; Início 200, 208 e 192 ms. Todos abaixo de 3 s. Chamadas a `minha-viagem`: 7 com 7 reservas e 20 com 20 reservas, tanto na Agenda quanto no Início (uma por reserva, em paralelo; cada uma levou de 170 a 530 ms, e a última terminou em cerca de 0,8 a 0,96 s). O Início também faz uma chamada por reserva mesmo sem viagem hoje. Ressalva: não foi possível chegar às 22 reservas e a medição é local, sem latência; o crescimento linear de chamadas (N+1) pode estourar 3 s em rede lenta ou com o limite de conexões simultâneas do navegador. Observação de desempenho, sem defeito confirmado. |

## Detalhamento dos casos

### Seção A — Consulta na tela do aluno

#### CT-HU019-UI-001 — Resumo da viagem do dia no Início

**Técnica/tipo:** Funcional positivo; consistência com a API.

**Dados de entrada:** Aluno A com reserva de hoje distribuída (ida com complementar e volta direta); depois sem reserva de hoje.

**Passos**

1. Entrar como A e abrir o Início.
2. Comparar o resumo com `minha-viagem` da API.
3. Cancelar a reserva de hoje pela API e reabrir o Início.

**Resultado esperado**

- O resumo mostra a rota, o horário do turno, o ônibus (apelido e placa) e o motorista, iguais à API.
- Sem reserva para hoje, o cartão “Sua viagem hoje” não aparece.

**Resultado obtido**

- Executado em 19/11/2026 (aluna Alice, hoje). O Início mostra “Sua viagem hoje” com “Ida — Rota Centro - UFC” e “Volta — Rota Centro - UFC”, “Alocação confirmada”, “V1 - Placa ABC1D23 • Motorista: Marcos Alfa”, “Saída 06:30”, “Retorno 17:30” e, na ida, “Complementar: Van 2 • Conexão: Igreja Matriz”, iguais à API. A reserva de hoje foi criada para 26/11 e movida para 19/11 no banco (a API só aceita a partir de amanhã) e distribuída pela API. Depois a LLM cancelou a reserva pela API (SEM_AGENDAMENTO) e, ao recarregar, o cartão “Sua viagem hoje” sumiu.
- Status: ✅ PASSOU.

---

#### CT-HU019-UI-002 — Agenda: cartão do dia com a situação da alocação

**Técnica/tipo:** Partição por situação (alocado, aguardando) × dia.

**Dados de entrada:** Reservas de A em D+1 (alocada), D+2 (sem distribuição) e D+3 (parcial); aba Agenda → Próximas viagens.

**Passos**

1. Abrir a Agenda e localizar os três cartões.
2. Comparar situação, ônibus e motorista de cada um com a API.

**Resultado esperado**

- D+1: situação de alocação confirmada com ônibus e motorista.
- D+2: “Aguardando alocação do veículo” sem dados de frota.
- D+3: cada turno com a sua situação (alocado e aguardando).

**Resultado obtido**

- Executado em 19/11/2026 (aluna Alice, Agenda → Próximas viagens). 20/11/2026: ida “Alocação confirmada” V1 - Placa ABC1D23 • Marcos Alfa e volta “Alocação confirmada” V3 - Placa HIJ7K89 • Mauro Beta; 23/11/2026: ida e volta “Aguardando alocação do veículo”, sem dados de frota; 24/11/2026: ida “Alocação confirmada” V1 - Placa ABC1D23 • Marcos Alfa e volta “Aguardando alocação do veículo”. Tudo igual à API.
- Status: ✅ PASSOU.

---

#### CT-HU019-UI-003 — Detalhes: ônibus, rota, motorista, horário, ponto e faculdade por turno

**Técnica/tipo:** Integração de contrato × tela; partição por turno.

**Dados de entrada:** Reserva de A com ida (V1/M1) e volta (V3/M2) em D+1; Ver detalhes.

**Passos**

1. Abrir os detalhes da reserva de D+1.
2. Ler, por turno, ônibus (número/apelido e placa), rota, motorista, horário, ponto de embarque e faculdade.
3. Comparar com a API e com o banco.

**Resultado esperado**

- Cada turno mostra ônibus com placa, nome da rota, motorista, horário (saída na ida e retorno na volta), ponto de embarque e faculdade corretos.
- Ida e volta mostram os seus próprios ônibus e motoristas; só os turnos agendados aparecem.

**Resultado obtido**

- Executado em 19/11/2026 (Alice, detalhes de 20/11/2026). Ida: “V1 - Placa ABC1D23”, “Rota Centro - UFC (UFC)”, ponto de embarque Praça José de Barros, desembarque Universidade Federal do Ceará, motorista Marcos Alfa, Horário de Saída 06:30, “Alocação confirmada”. Volta: “V3 - Placa HIJ7K89”, “Rota Centro - UFC (UFC)”, embarque Universidade Federal do Ceará, desembarque Praça José de Barros, motorista Mauro Beta, 17:30, “Alocação confirmada”. Ida e volta separadas com os seus próprios ônibus e motoristas, iguais à API. Observações de UX: o rótulo da volta é “Horário de Saída” com o horário de retorno (17:30); deve ser corrigido para “Horário de Retorno” (decisão de Cauan). O título “Ida” parcialmente coberto no topo era só a rolagem da tela, sem defeito.
- Status: ✅ PASSOU.

---

### Seção B — Situações sem alocação

#### CT-HU019-UI-004 — Aguardando alocação do veículo, sem dados de frota

**Técnica/tipo:** Partição com/sem distribuição; ocultação de campos.

**Dados de entrada:** Reserva de A em dia sem distribuição; depois excedente da HU-016.

**Passos**

1. Abrir Agenda e Detalhes da reserva sem distribuição.
2. Repetir com o aluno excedente.

**Resultado esperado**

- Aparece “Aguardando alocação do veículo” (ou texto equivalente) e não há campos de ônibus, placa ou motorista.
- O excedente permanece aguardando até ser realocado.

**Resultado obtido**

- Executado em 19/11/2026. Parte 1 (Alice, detalhes de 23/11/2026, sem distribuição): “Aguardando alocação do veículo” na ida e na volta, sem ônibus, placa nem motorista (segundo o relato de Cauan e a API). Parte 2 (Gabriela, excedente da distribuição de 27/11/2026): os detalhes mostram só a Rota Centro - UFC, o ponto de embarque Praça José de Barros, o desembarque Universidade Federal do Ceará, o horário de saída 06:30 da rota e “Aguardando alocação do veículo”, sem ônibus, placa nem motorista; a API confirma AGUARDANDO_ALOCACAO. O excedente permanece aguardando.
- Status: ✅ PASSOU.

---

#### CT-HU019-UI-005 — Alocação parcial: cada turno com a sua situação

**Técnica/tipo:** Tabela de decisão por turno.

**Dados de entrada:** Reserva de A com a ida alocada e a volta sem alocação.

**Passos**

1. Abrir a Agenda e os detalhes da reserva parcial.
2. Comparar cada turno com a API.

**Resultado esperado**

- A ida mostra ônibus e motorista; a volta mostra “Aguardando alocação do veículo”.
- Nenhum dado de frota é exibido no turno aguardando.

**Resultado obtido**

- Executado em 19/11/2026 (Alice, 24/11/2026). Agenda e detalhes: a ida mostra “Alocação confirmada” com V1 - Placa ABC1D23 e Marcos Alfa; a volta mostra “Aguardando alocação do veículo” sem dados de frota, iguais à API (PARCIALMENTE_ALOCADO). O cartão da Agenda já tinha mostrado isso; Cauan relatou os detalhes sem diferença.
- Status: ✅ PASSOU.

---

#### CT-HU019-UI-006 — Aluno realocado: aviso destacado

**Técnica/tipo:** Transição de estado; integração com a HU-016.

**Dados de entrada:** Aluno realocado para ônibus de outra rota (distribuição ou fixture isolada documentada pela LLM).

**Passos**

1. Pedir à LLM a realocação e abrir a Agenda e os detalhes da reserva.
2. Comparar o aviso e o veículo com a API.

**Resultado esperado**

- A tela exibe em destaque “Atenção: Você foi realocado. Seu ônibus para hoje é o veículo X” (AC-03 e FA-002).
- Sem realocação, o aviso não aparece. Se a realocação só puder ser criada por fixture, registrar a dependência.

**Resultado obtido**

- Executado em 19/11/2026 (Carla, 25/11/2026, reserva da Rota Centro - UFC realocada pela distribuição manual para a Rota Campo - IFCE, V2/Mauro Beta). Os detalhes mostram, em caixa amarela destacada com ícone de alerta, “Atenção: Você foi realocado. Seu ônibus para hoje é o veículo V2 - Placa DEF4G56.”, e abaixo V2 - Placa DEF4G56, “Rota Campo - IFCE (UFC)”, Praça José de Barros → Universidade Federal do Ceará, motorista Mauro Beta, saída 06:40 e “Alocação confirmada”; no dia 27/11/2026 da Carla, sem realocação, o aviso não aparece (relato de Cauan). A realocação foi criada pela distribuição manual (a API passou a aceitar troca de rota após a #478), sem fixture em SQL. Observações de UX: a placa vem junto do apelido no aviso (“V2 - Placa DEF4G56”), o que poderia ser mais organizado; o texto diz “para hoje” mesmo para um dia futuro (texto do requisito).
- Status: ✅ PASSOU.

---

### Seção C — Atualidade e desempenho

#### CT-HU019-UI-007 — Dado atualizado depois de nova distribuição

**Técnica/tipo:** Transição de estado; recarga de tela.

**Dados de entrada:** A alocado em V1/M1; a LLM confirma nova distribuição que passa A para V3/M2; reabrir a Agenda e os detalhes.

**Passos**

1. Abrir os detalhes e anotar ônibus e motorista.
2. Pedir à LLM a nova distribuição e voltar à Agenda; reabrir os detalhes.
3. Se a tela ainda mostrar o antigo, sair e entrar de novo e registrar.

**Resultado esperado**

- A consulta online mostra o ônibus e o motorista mais atuais, sem exigir sair do app (AC-04).
- O dado antigo não persiste depois de recarregar a Agenda.

**Resultado obtido**

- Executado em 19/11/2026 (Alice, 20/11/2026). Antes: ida no V1 - Placa ABC1D23 com Marcos Alfa. Às 00:50:07 a LLM confirmou nova distribuição manual que passou a ida da Alice para o V3 com Mauro Beta (API: V3 HIJ7K89, Mauro Beta na ida e na volta). Depois de voltar à Agenda e reabrir os detalhes, a tela mostra a ida em “V3 - Placa HIJ7K89”, motorista Mauro Beta, 06:30, e a volta em V3 - Placa HIJ7K89, Mauro Beta, 17:30, iguais à API, sem dado antigo (print). Não foi registrado se foi preciso recarregar a página; o risco de cache do plano não se confirmou neste caminho.
- Status: ✅ PASSOU.

---

#### CT-HU019-UI-008 — Falha na consulta da alocação, offline e troca de conta

**Técnica/tipo:** Transição online/offline; isolamento de cache; erro sem estado falso.

**Dados de entrada:** A alocado e já sincronizado; derrubar apenas a consulta de alocação (API ou rede); modo offline; logout de A e login de B.

**Passos**

1. Com A alocado e sincronizado, tornar a consulta de alocação indisponível e abrir a Agenda.
2. Colocar o aparelho offline e abrir os detalhes.
3. Sair, entrar como B (sem sincronizar) e abrir a Agenda offline.

**Resultado esperado**

- Falha na consulta de alocação não faz a tela afirmar “Aguardando alocação do veículo” para um aluno já alocado; informa indisponibilidade ou mantém os dados sincronizados com indicação.
- Offline mostra a última informação sincronizada de A com a indicação de dados salvos.
- B não vê dados de A (cache separado por conta).

**Resultado obtido**

- Executado em 19/11/2026 por Cauan Ricardo (relato) e revalidado integralmente pela LLM no Chrome automatizado, em 19/11/2026 às 01:00 (conta de teste local, Alice e Bruno). Parte 1, consulta de alocação com erro e rede ligada: a LLM renomeou a tabela `alocacao_diaria` (01:00:21 a 01:00:29), `minha-viagem` devolveu 500 e `agendamentos/meus` seguiu em 200; ao recarregar a Agenda, o 20/11/2026, que está alocado (V3 HIJ7K89, Mauro Beta), passou a mostrar “Aguardando alocação do veículo” na ida e na volta, sem aviso de indisponibilidade. Com a tabela restaurada e a Agenda recarregada, a alocação voltou (V3 - Placa HIJ7K89, Mauro Beta). Causa no código: `obterMinhaViagem` captura qualquer erro e devolve `null` (`agendamentoService.ts`), e a tela monta o dia sem alocação. Parte 2, offline: com a API parada, a Agenda recarregada mostrou o banner “Visualização Offline (Dados salvos no dispositivo)” e manteve o 20/11 como “Alocação confirmada”, V3 - Placa HIJ7K89, Mauro Beta; passou. Parte 3, troca de conta: depois de sair da conta da Alice o armazenamento local ficou vazio (cache apagado no logout); entrando como Bruno, a Agenda mostrou só os dados dele (20/11: ida V1 ABC1D23 com Marcos Alfa e volta V2 DEF4G56 com Miguel Gama) e, com a API parada, o banner offline e os mesmos dados dele, sem nada da Alice; passou. Limite: o login offline não é possível, então o Bruno entrou com a API ligada antes de ela ser parada.
- Status: ❌ Falhou.

---

#### CT-HU019-UI-009 — Tempo de abertura da Agenda com várias reservas (RNF-001)

**Técnica/tipo:** Medição percebida; carga mínima.

**Dados de entrada:** A com 7 e depois 22 reservas ativas, parte delas distribuídas; abrir a Agenda e o Início em rede normal.

**Passos**

1. Com 7 reservas, cronometrar a abertura da Agenda e do Início três vezes.
2. Repetir com 22 reservas e registrar quantas chamadas `minha-viagem` a LLM observa na API.

**Resultado esperado**

- A consulta de alocação aparece em até 3 s em conexão normal; registrar tempos e número de chamadas.
- Se estourar o limite com 22 reservas, registrar o defeito de desempenho com a contagem de chamadas.

**Resultado obtido**

- Executado em 19/11/2026 pela LLM, a pedido de Cauan, no Chrome automatizado (web, localhost, sem latência de rede real; o tempo é de carga completa da página até a Agenda mostrar “Alocação confirmada” ou “Aguardando alocação do veículo”, medido com `performance.now()`). Com 7 reservas ativas da Alice (parte distribuída): Agenda 1017, 524 e 563 ms; Início 192, 185 e 178 ms. Com 20 reservas ativas (13 delas criadas pela LLM; a janela de agendamento de 30 dias impede chegar às 22 do plano, e o limite do sistema é 22): Agenda 1007, 845 e 952 ms; Início 200, 208 e 192 ms. Todos abaixo de 3 s. Chamadas a `minha-viagem`: 7 com 7 reservas e 20 com 20 reservas, tanto na Agenda quanto no Início (uma por reserva, em paralelo; cada uma levou de 170 a 530 ms, e a última terminou em cerca de 0,8 a 0,96 s). O Início também faz uma chamada por reserva mesmo sem viagem hoje. Ressalva: não foi possível chegar às 22 reservas e a medição é local, sem latência; o crescimento linear de chamadas (N+1) pode estourar 3 s em rede lenta ou com o limite de conexões simultâneas do navegador. Observação de desempenho, sem defeito confirmado.
- Status: ⚠️ PARCIAL.

---

## Rastreabilidade

| Critério/regra | Casos UI | Complemento |
| --- | --- | --- |
| AC-01 — viagem do dia e dados por turno | UI-001, UI-002, UI-003 | API-001, API-002 |
| AC-02 / FA-001 — aguardando e parcial | UI-004, UI-005 | API-003, API-004 |
| AC-03 / FA-002 — aviso de realocação | UI-006 | API-005 |
| AC-04 — informação atual | UI-007 | API-006 |
| Falha, offline e isolamento de conta | UI-008 | API-008 |
| AC-05 / RNF-001 — tempo de resposta | UI-009 | API-009 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-HU019-UI-008 | [BUG-HU019-UI-001](issues/BUG-HU019-UI-001.md) — falha na consulta de alocação vira "Aguardando alocação do veículo" para o aluno já alocado (🟠 Alta, **Bloqueante**) | [#530](https://github.com/GOUOCE/GOUCE-app/issues/530) |
| CT-HU019-UI-003 | [BUG-HU019-UI-002](issues/BUG-HU019-UI-002.md) — "Horário de Saída" com o horário de retorno na volta (🟢 Baixa, Não bloqueante) | [#531](https://github.com/GOUOCE/GOUCE-app/issues/531) |
| CT-HU019-UI-009 | Observação de desempenho sem issue: uma chamada a `minha-viagem` por reserva, também no Início; 20 reservas abriram em até 1,0 s no ambiente local (`⚠️ PARCIAL`) | — |

**Reteste de 19/11/2026** (branch `fix/hu019-issue-530-falha-consulta-alocacao`): #530 e #531 ✅ corrigidas, executado por Cauan Ricardo; detalhes na seção "Reteste" de cada relato. Os casos CT-HU019-UI-003 e CT-HU019-UI-008 passam a ✅ nas partes corrigidas; as demais partes seguem como executadas.

## Observações gerais

- Referências: [requisitos, seção 7.6](../../../../../docs/requisitos.md), [BDD do épico 05](../../../../../bdd/features/epico-05/README.md) e as [decisões do PO na #465](https://github.com/GOUOCE/GOUCE-app/issues/465).
- A realocação só é exibida se existir no banco; registrar a origem da massa de cada caso.
- Execução de 19/11/2026 por Cauan Ricardo, com a LLM na massa e na conferência de API/banco; no CT-009 e na revalidação do CT-008 a LLM executou a tela no Chrome automatizado, a pedido de Cauan; build da `develop` `6059f33b`.
- A realocação do CT-006 foi criada pela distribuição manual (a #478 já está corrigida), sem fixture em SQL; a reserva "de hoje" do CT-001 foi criada para outro dia e movida por SQL para a data de hoje, porque a API só aceita reservas a partir de amanhã.
