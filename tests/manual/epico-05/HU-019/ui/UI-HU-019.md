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
| Ambiente | A preencher — navegador (versão web) ou celular, URL e SHAs do front e da API da `develop` `1eb2818d`; banco limpo, fuso America/Fortaleza |
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
| CT-HU019-UI-001 | Resumo da viagem do dia no Início | Aluno A com reserva de hoje distribuída (ida com complementar e volta direta); depois sem reserva de hoje. | Início mostra a viagem de hoje com ônibus e motorista; sem reserva, o resumo não aparece. | ⏳ PENDENTE | BDD: aluno visualiza os dados da alocação; AC-01. |
| CT-HU019-UI-002 | Agenda: cartão do dia com a situação da alocação | Reservas de A em D+1 (alocada), D+2 (sem distribuição) e D+3 (parcial); aba Agenda → Próximas viagens. | Cada cartão mostra a situação e, quando alocado, ônibus e motorista. | ⏳ PENDENTE | BDD: dados por turno; aguardando alocação. |
| CT-HU019-UI-003 | Detalhes: ônibus, rota, motorista, horário, ponto e faculdade por turno | Reserva de A com ida (V1/M1) e volta (V3/M2) em D+1; Ver detalhes. | Ida e volta separadas com todos os campos do AC-01. | ⏳ PENDENTE | BDD: dados da alocação por turno; horário saída/retorno. |

### Seção B — Situações sem alocação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU019-UI-004 | Aguardando alocação do veículo, sem dados de frota | Reserva de A em dia sem distribuição; depois excedente da HU-016. | Mensagem de espera e nenhuma informação de ônibus ou motorista. | ⏳ PENDENTE | BDD: aguardando e excedente aguardando; AC-02 e FA-001. |
| CT-HU019-UI-005 | Alocação parcial: cada turno com a sua situação | Reserva de A com a ida alocada e a volta sem alocação. | Ida com frota e volta aguardando. | ⏳ PENDENTE | BDD: alocação do turno concluído e espera do outro. |
| CT-HU019-UI-006 | Aluno realocado: aviso destacado | Aluno realocado para ônibus de outra rota (distribuição ou fixture isolada documentada pela LLM). | Aviso visual destacado com o texto do requisito. | ⏳ PENDENTE | Risco de leitura: a realocação pode não ser criável pela distribuição regular. BDD: realocado; FA-002. |

### Seção C — Atualidade e desempenho

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU019-UI-007 | Dado atualizado depois de nova distribuição | A alocado em V1/M1; a LLM confirma nova distribuição que passa A para V3/M2; reabrir a Agenda e os detalhes. | Tela mostra o ônibus e o motorista novos. | ⏳ PENDENTE | Risco de leitura: o cache local pode manter o ônibus antigo. BDD: alocação mais atual; AC-04. |
| CT-HU019-UI-008 | Falha na consulta da alocação, offline e troca de conta | A alocado e já sincronizado; derrubar apenas a consulta de alocação (API ou rede); modo offline; logout de A e login de B. | Sem falso “Aguardando”; offline mostra o último dado sincronizado; B não vê dados de A. | ⏳ PENDENTE | Risco de leitura: erro na consulta da alocação vira dado nulo e a tela mostra “Aguardando alocação do veículo”. |
| CT-HU019-UI-009 | Tempo de abertura da Agenda com várias reservas (RNF-001) | A com 7 e depois 22 reservas ativas, parte delas distribuídas; abrir a Agenda e o Início em rede normal. | Telas utilizáveis em até 3 segundos. | ⏳ PENDENTE | Risco de leitura: a lista chama `minha-viagem` uma vez por reserva. BDD: tempo de resposta até 3 s. |

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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
| — | Nenhuma execução realizada. Os riscos de leitura estão no [guia de execução da API](../api/README.md). | — |

## Observações gerais

- Referências: [requisitos, seção 7.6](../../../../../docs/requisitos.md), [BDD do épico 05](../../../../../bdd/features/epico-05/README.md) e as [decisões do PO na #465](https://github.com/GOUOCE/GOUCE-app/issues/465).
- A realocação só é exibida se existir no banco; registrar a origem da massa de cada caso.
- Nenhum caso foi executado nesta entrega.
