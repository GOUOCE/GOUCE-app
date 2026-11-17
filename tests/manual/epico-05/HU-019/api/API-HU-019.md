# Testes manuais de API — HU-019 — Consulta de Alocação Diária

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Alocação e Distribuição Logística (EP-005) |
| Funcionalidade | HU-019 — Consulta de Alocação Diária |
| Camada | API |
| Tipo de teste | Funcional manual essencial, integração, isolamento de dados, autorização e desempenho básico — baseado em risco |
| Endpoints | `GET /alocacao-diaria/minha-viagem?data=YYYY-MM-DD` (aluno). Apoio: HU-016 (distribuição), HU-013/014 (reservas e cancelamento) e cadastros de frota, motoristas e rotas. |
| Base do planejamento | `develop` `1eb2818d` (módulo `backend/src/modulos/alocacao_diaria/`, `minha_viagem_service.py`) |
| Branch de planejamento | `test/planejamento-api-ui-hu-019`, com entrega para `develop` |
| Revisão do planejamento | 16/11/2026 — requisitos 7.6 com as decisões do PO (#465), BDD do épico 05 e leitura do código |
| Ambiente | HTTP real `http://127.0.0.1:8119`; Docker `atu-qa-hu019`; PostgreSQL 15.17 em banco novo; Alembic `82_create_alocacao_diaria`; `America/Fortaleza` |
| Total de casos | 9 |
| Última execução | 17/11/2026 — 9/9 casos concluídos; início `2026-11-17T14:24:47.865270-03:00` |
| Branch de execução | `test/execucao-api-hu-019`, criada da develop atualizada `7372b8d67165344545c1264ac936cd4c060ca245` |
| Código executado | Backend exato `7372b8d67165344545c1264ac936cd4c060ca245`, sem alterações de produto |
| Testador | LLM — execução de API; Cauan Ricardo — revisão |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Concluída com falhas e dependência | 9 | 6 | 2 | 1 | 0 | 0 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API e PostgreSQL reais em stack isolada, com as migrations da `develop` até `82_create_alocacao_diaria` (head única do código executado; inclui `82_updated_at_faculdade_ponto`). Registrar URL, SHA, data/fuso e acesso de leitura às tabelas `alocacao_diaria`, `alocacao_aluno`, `agendamento` e `log_auditoria`. Não usar `create_all` nem mock no lugar da integração HTTP. [Guia](README.md). |
| PC-02 | Tokens reais: administrador (seed `admin@gouce.app`); alunos A a F aprovados e com vínculo válido; representante R1 da UFC e R2 da IFCE; aluno pendente ou reprovado e representante inativo para os casos de acesso. Credenciais fora do Git. |
| PC-03 | Cadastros pela API administrativa: IES UFC e IFCE; bairros/pontos; **P1 Rota Centro - UFC** (06:30/17:30, atende UFC na ida e na volta) e **P2 Rota Campo - IFCE** (06:40/18:40, atende IFCE). Frota e escala: ônibus **V1 `ABC1D23`** (3 assentos e 2 em pé), **V2 `DEF4G56`** (2 assentos e 1 em pé), **V3 `HIJ7K89`** (4 assentos e 0 em pé) e **V4** inativo; motoristas **M1, M2, M3** ativos e **M4** inativo. |
| PC-04 | D = data local do servidor; anotar hora e fuso. Usar dias úteis válidos dentro da janela de agendamento (D+1 em diante) e registrar ids/datas reais; as datas fixas do BDD são exemplos. Sem alterar o relógio do host. |
| PC-05 | A distribuição automática considera **todos** os ônibus e motoristas ativos do sistema (e só usa tantos ônibus quantos forem os motoristas ativos). Para controlar o cenário, ativar/inativar ônibus e motoristas pela API administrativa (`PATCH /onibus/{placa}/inativar` e `/reativar`, `PATCH /motoristas/{id}/inativar` e `/reativar`) e devolver a frota ao estado base ao fim de cada caso. |
| PC-06 | Reservas de A em dias úteis distintos, com ida e volta, só ida e só volta, e uma reserva de B na mesma data com outro ônibus. Distribuições confirmadas pela HU-016 para as datas que pedem alocação e nenhuma para a data de espera. |
| PC-07 | Realocação para ônibus de outra rota pode não ser criável pela distribuição regular. Quando for preciso, criar a alocação por fixture **somente no banco isolado**, documentando origem e SQL no caso; não aprovar o fluxo completo da HU-016 por essa fixture. |

## Contrato de referência

- `MinhaViagemResponseDTO`: `data`, `possui_agendamento`, `agendamento_id`, `status_geral` (SEM_AGENDAMENTO, AGUARDANDO_ALOCACAO, PARCIALMENTE_ALOCADO ou ALOCADO), `mensagem`, `foi_realocado`, `aviso_realocacao`, `ida`, `volta` e `consultado_em`.
- `TurnoViagemDTO`: `status_alocacao` (ALOCADO ou AGUARDANDO_ALOCACAO), `mensagem_status`, `ponto`, `faculdade`, `rota_complementar`, `rota_id`, `nome_rota`, `horario`, `onibus_id`, `placa`, `apelido_onibus`, `motorista_id`, `nome_motorista`, `tipo_lugar`, `foi_realocado` e `aviso_realocacao`.
- O horário é o de saída da rota na ida e o de retorno na volta; a realocação é detectada quando a rota da alocação difere da rota original da reserva.
- Acesso restrito ao perfil aluno; a consulta sempre responde 200 (sem agendamento é indicado por `possui_agendamento`).

## Resumo da execução

Todas as chamadas usam o token de A, salvo indicação. As distribuições são criadas pela HU-016 e conferidas no banco; datas com e sem distribuição são preparadas separadamente.

### Seção A — Consulta da alocação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU019-API-001 | Alocação por turno com os dados do ônibus, rota, motorista e embarque | Aluno A com reserva em D+1 (ida e volta, P1) e distribuição confirmada (V1 e M1 na ida; V3 e M2 na volta); GET `/alocacao-diaria/minha-viagem?data=<D+1>` com A. | 200 ALOCADO com ônibus (placa e apelido), rota, motorista, horário, ponto e faculdade em cada turno. | ✅ PASSOU | BDD: dados da alocação separados por turno; AC-01. |
| CT-HU019-API-002 | Horário de saída na ida, retorno na volta e só um turno | Reservas de A: só ida, só volta e ida e volta em P1 (06:30/17:30), todas distribuídas. | Ida usa o horário de saída, volta o de retorno; turno não agendado não aparece. | ✅ PASSOU | BDD: horário de saída na ida e retorno na volta; somente o turno agendado. |

### Seção B — Situações sem alocação definitiva

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU019-API-003 | Distribuição ainda não concluída: aguardando alocação | A com reserva em D+2 sem distribuição do dia; GET `minha-viagem` de D+2. | AGUARDANDO_ALOCACAO sem dados de frota. | ✅ PASSOU | BDD: aguardando alocação do veículo; FA-001. |
| CT-HU019-API-004 | Excedente e alocação parcial | Aluno excedente da HU-016 (6 alunos em V1); aluno com ida alocada e volta sem alocação; aluno totalmente alocado. | Excedente aguarda; parcial mostra cada turno com a sua situação; status geral coerente. | ✅ PASSOU | BDD: excedente aguardando; alocação parcial; status geral. |
| CT-HU019-API-005 | Aluno realocado: aviso destacado | Aluno cuja reserva pertence a P1 alocado em ônibus de outra rota (P2) na mesma data, preparado pela distribuição ou por fixture isolada documentada. | `foi_realocado` verdadeiro e aviso com o texto do requisito. | ⚠️ PARCIAL | Risco de leitura: a distribuição pela API recusa aluno em rota diferente da sua. BDD: realocado; AC-03 e FA-002. |

### Seção C — Atualidade, isolamento e desempenho

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU019-API-006 | Dado mais atual depois de nova distribuição | A alocado em V1/M1; nova distribuição manual do mesmo dia trocando A para V3/M2; consulta antes e depois. | A segunda consulta devolve o ônibus e o motorista novos. | ✅ PASSOU | BDD: alocação mais atual depois de nova distribuição; AC-04. |
| CT-HU019-API-007 | Sem agendamento, reserva cancelada e parâmetro de data | Data sem reserva de A; reserva de A cancelada após a distribuição; `data` omitida; `data` `2026-02-30`, `16-11-2026` e `abc`. | 200 sem agendamento com a mensagem do requisito; data padrão hoje; datas inválidas recusadas. | ❌ FALHOU | Risco de leitura: o 422 de data inválida usa texto técnico do framework. BDD: sem viagem; aluno sem agendamento. |
| CT-HU019-API-008 | Isolamento entre alunos e perfis sem acesso | A e B com reservas na mesma data em ônibus diferentes; token de A, de B, de administrador, de representante, de aluno pendente, reprovado e com vínculo vencido, sem token e inválido. | Cada aluno vê só a própria alocação; 403 para administrador, representante e aluno sem acesso regular; 401 sem credencial. | ❌ FALHOU | Risco de leitura: a rota só exige o perfil aluno, sem a checagem de acesso regular das demais rotas do aluno. BDD: aluno visualiza somente a própria alocação; API nega o perfil e sem token. |
| CT-HU019-API-009 | Tempo de resposta da consulta (RNF-001) | Dez consultas seguidas de `minha-viagem` de A em dia alocado e em dia sem distribuição, com rede local. | Respostas dentro de 3 segundos em condições normais. | ✅ PASSOU | BDD: tempo de resposta não ultrapassa 3 segundos; AC-05. |

## Detalhamento dos casos

### Seção A — Consulta da alocação

#### CT-HU019-API-001 — Alocação por turno com os dados do ônibus, rota, motorista e embarque

**Técnica/tipo:** Integração de contrato; conferência com o banco.

**Dados de entrada:** Aluno A com reserva em D+1 (ida e volta, P1) e distribuição confirmada (V1 e M1 na ida; V3 e M2 na volta); GET `/alocacao-diaria/minha-viagem?data=<D+1>` com A.

**Passos**

1. Confirmar a distribuição de D+1 (HU-016) e anotar, no banco, ônibus, motorista, rota e `tipo_lugar` de A por turno.
2. Consultar `minha-viagem` com o token de A.
3. Comparar cada campo de `ida` e `volta` com o banco e com os cadastros.

**Resultado esperado**

- HTTP 200 com `possui_agendamento` verdadeiro, `status_geral` ALOCADO, `agendamento_id` e `consultado_em`.
- Em `ida` e `volta`: `status_alocacao` ALOCADO, `onibus_id`/`placa`, `apelido_onibus`, `nome_rota`, `nome_motorista`, `horario`, `ponto`, `faculdade` e `tipo_lugar`, iguais ao banco.
- Os dois turnos podem ter ônibus e motoristas diferentes (V1/M1 na ida e V3/M2 na volta).

**Resultado obtido**

- 200 ALOCADO; ida em V1/M1 e volta em V3/M2. Placa/apelido, rota, horários, ponto/IES, complementar e lugar conferidos em conexões novas do PostgreSQL; GET sem escrita.
- Status: ✅ PASSOU.

---

#### CT-HU019-API-002 — Horário de saída na ida, retorno na volta e só um turno

**Técnica/tipo:** Partição por turnos utilizados; tabela de decisão trecho × horário.

**Dados de entrada:** Reservas de A: só ida, só volta e ida e volta em P1 (06:30/17:30), todas distribuídas.

**Passos**

1. Distribuir as três reservas de A (datas distintas).
2. Consultar `minha-viagem` de cada data.
3. Conferir `horario` e a presença/ausência de `ida` e `volta`.

**Resultado esperado**

- `ida.horario` é 06:30 e `volta.horario` é 17:30 (horários da rota principal).
- Só ida: `volta` nulo; só volta: `ida` nulo; nenhum turno inexistente é inventado.

**Resultado obtido**

- Ida informa 06:30 e volta 17:30 da principal, mesmo com complementar 05:45/18:15. Só ida mantém volta nula e só volta mantém ida nula; ambas as combinações alocadas foram conferidas no banco.
- Status: ✅ PASSOU.

---

### Seção B — Situações sem alocação definitiva

#### CT-HU019-API-003 — Distribuição ainda não concluída: aguardando alocação

**Técnica/tipo:** Partição com/sem distribuição; funcional negativo.

**Dados de entrada:** A com reserva em D+2 sem distribuição do dia; GET `minha-viagem` de D+2.

**Passos**

1. Garantir que D+2 não tem distribuição confirmada.
2. Consultar `minha-viagem` de D+2 com A.

**Resultado esperado**

- `status_geral` AGUARDANDO_ALOCACAO e, em cada turno, `status_alocacao` AGUARDANDO_ALOCACAO com `mensagem_status` “Aguardando alocação do veículo”.
- `onibus_id`, `placa`, `apelido_onibus`, `motorista_id`, `nome_motorista`, `horario` e `nome_rota` nulos; `ponto` e `faculdade` da reserva preenchidos.

**Resultado obtido**

- Reserva de ida/volta sem distribuição retornou AGUARDANDO_ALOCACAO, mensagem prevista e campos de frota nulos; pontos/IES e complementar da reserva preservados.
- Status: ✅ PASSOU.

---

#### CT-HU019-API-004 — Excedente e alocação parcial

**Técnica/tipo:** Tabela de decisão por turno alocado × aguardando; estados do status geral.

**Dados de entrada:** Aluno excedente da HU-016 (6 alunos em V1); aluno com ida alocada e volta sem alocação; aluno totalmente alocado.

**Passos**

1. Confirmar a distribuição com excedente (HU-016, CT-007) e consultar o excedente.
2. Montar uma distribuição que aloque só a ida de um aluno e consultar.
3. Consultar o aluno totalmente alocado como controle.

**Resultado esperado**

- Excedente: AGUARDANDO_ALOCACAO nos turnos sem vínculo, sem dados de frota (AC-02).
- Parcial: `status_geral` PARCIALMENTE_ALOCADO, `ida` ALOCADO com frota e `volta` AGUARDANDO_ALOCACAO.
- Totalmente alocado: ALOCADO.

**Resultado obtido**

- Distribuição automática real de 6 alunos em V1 (capacidade 5) deixou um excedente sem vínculo/frota, em espera. Alocação só da ida retornou PARCIALMENTE_ALOCADO; controle ida/volta retornou ALOCADO. Frota e motoristas restaurados ao estado base.
- Status: ✅ PASSOU.

---

#### CT-HU019-API-005 — Aluno realocado: aviso destacado

**Técnica/tipo:** Tabela de decisão rota original × rota da alocação; integração com a HU-016.

**Dados de entrada:** Aluno cuja reserva pertence a P1 alocado em ônibus de outra rota (P2) na mesma data, preparado pela distribuição ou por fixture isolada documentada.

**Passos**

1. Tentar montar a realocação pela API de distribuição (HU-016, CT-008) e registrar o resultado.
2. Se a API recusar, criar a alocação por fixture apenas no banco isolado e documentar a origem.
3. Consultar `minha-viagem` do aluno.

**Resultado esperado**

- `foi_realocado` verdadeiro no turno e no nível geral, com `aviso_realocacao` “Atenção: Você foi realocado. Seu ônibus para hoje é o veículo <placa>”.
- Aluno não realocado: `foi_realocado` falso e `aviso_realocacao` nulo.
- Quando a realocação só puder ser criada por fixture, registrar a dependência da HU-016 e não marcar como aprovado o fluxo completo.

**Resultado obtido**

- Consulta HU-019 detectou a rota P2 e exibiu o aviso exato geral/ida após fixture SQL documentada, depois restaurada; controle sem realocação correto. Fluxo completo não aprovado: POST de distribuição recusou a troca de rota com 422, dependência já registrada na #478 e discutida na #473.
- Status: ⚠️ PARCIAL.

Fixture somente no banco isolado, após a recusa 422 da distribuição; a consulta permaneceu HTTP real:

```sql
UPDATE alocacao_diaria SET rota_id=:rota,onibus_id=:onibus,motorista_id=:motorista WHERE id=:id;
```

Parâmetros usados: `{'id': 8, 'rota': 2, 'onibus': 'DEF4G56', 'motorista': 2}`. Restauração com `{'id': 8, 'rota': 1, 'onibus': 'ABC1D23', 'motorista': 1}`; snapshot completo restabelecido. Dependência: [#478](https://github.com/GOUOCE/GOUCE-app/issues/478), discutida na [#473](https://github.com/GOUOCE/GOUCE-app/issues/473). Esta fixture aprova somente a leitura do estado preparado; o caso segue parcial.


---

### Seção C — Atualidade, isolamento e desempenho

#### CT-HU019-API-006 — Dado mais atual depois de nova distribuição

**Técnica/tipo:** Transição de estado; verificação de ausência de cache no servidor.

**Dados de entrada:** A alocado em V1/M1; nova distribuição manual do mesmo dia trocando A para V3/M2; consulta antes e depois.

**Passos**

1. Consultar `minha-viagem` de A e anotar ônibus e motorista.
2. Confirmar a nova distribuição manual que troca ônibus e motorista de A.
3. Consultar de novo e comparar com o banco.

**Resultado esperado**

- A segunda consulta traz V3 e M2 (e a nova `tipo_lugar`), iguais ao banco; não repete o dado anterior.
- `consultado_em` avança entre as consultas.

**Resultado obtido**

- Nova distribuição manual trocou V1/M1/em_pe por V3/M2/sentado na mesma rota. Consulta seguinte refletiu as três alterações, de acordo com o banco, e consultado_em avançou.
- Status: ✅ PASSOU.

---

#### CT-HU019-API-007 — Sem agendamento, reserva cancelada e parâmetro de data

**Técnica/tipo:** Partição de datas e estados da reserva; valor-limite do parâmetro.

**Dados de entrada:** Data sem reserva de A; reserva de A cancelada após a distribuição; `data` omitida; `data` `2026-02-30`, `16-11-2026` e `abc`.

**Passos**

1. Consultar uma data sem reserva e outra com reserva cancelada pela HU-014.
2. Consultar sem `data` e comparar com a reserva de hoje, se houver.
3. Consultar com cada data inválida e guardar HTTP e corpo.

**Resultado esperado**

- HTTP 200 com `possui_agendamento` falso, `status_geral` SEM_AGENDAMENTO e a mensagem “Você não possui agendamento confirmado para esta data.”
- Sem `data`, a consulta usa o dia de hoje do servidor.
- Datas inválidas: 422 (ou 400) com mensagem compreensível, sem erro 500. Se o texto for técnico e em inglês, registrar a divergência como no achado #403 da HU-015.

**Resultado obtido**

- Data vazia e reserva cancelada retornaram 200 SEM_AGENDAMENTO com a mensagem prevista; vínculos CANCELADO e ausência de dados antigos confirmados. Data omitida usou o dia local do servidor. Três datas inválidas retornaram 422 com mensagem técnica em inglês, divergindo do esperado. Defeitos: [#486](https://github.com/GOUOCE/GOUCE-app/issues/486).
- Status: ❌ FALHOU.

---

#### CT-HU019-API-008 — Isolamento entre alunos e perfis sem acesso

**Técnica/tipo:** Partição por dono e por perfil; autorização.

**Dados de entrada:** A e B com reservas na mesma data em ônibus diferentes; token de A, de B, de administrador, de representante, de aluno pendente, reprovado e com vínculo vencido, sem token e inválido.

**Passos**

1. Consultar `minha-viagem` da data comum com A e com B e comparar com o banco.
2. Tentar enviar identificador de outro aluno (parâmetros extras) e conferir que é ignorado.
3. Consultar com administrador, representante, aluno pendente, reprovado e com vínculo vencido, sem token e com token inválido.

**Resultado esperado**

- A recebe apenas o agendamento e os dados de frota de A; B, os de B; nenhum dado cruzado.
- Administrador e representante: 403; sem token ou token inválido: 401.
- Aluno pendente, reprovado ou com vínculo vencido: 403, como nas demais consultas do aluno (HU-014 e HU-015); esperado inferido desse padrão, confirmar com o PO se a rota devolver 200 vazio.

**Resultado obtido**

- A/B viram só suas reservas/frotas; parâmetros extras não trocaram o dono. Admin/representante exclusivo 403; sem token/inválido 401. Pendentes, rejeitados e vencidos receberam 200 com a própria alocação, enquanto /meus recusou os mesmos tokens com 403. Estados restaurados; política inferida deve ser confirmada com o PO. Defeitos: [#487](https://github.com/GOUOCE/GOUCE-app/issues/487).
- Status: ❌ FALHOU.

---

#### CT-HU019-API-009 — Tempo de resposta da consulta (RNF-001)

**Técnica/tipo:** Medição básica de desempenho funcional; não substitui teste de carga.

**Dados de entrada:** Dez consultas seguidas de `minha-viagem` de A em dia alocado e em dia sem distribuição, com rede local.

**Passos**

1. Medir 10 consultas em cada situação e guardar o tempo de cada uma.
2. Registrar mediana e máximo e o tamanho da massa no momento.

**Resultado esperado**

- Todas as respostas em até 3 s em conexão normal (RNF-001); registrar mediana e máximo.
- A medição não substitui teste de carga nem mede a tela.

**Resultado obtido**

- Dez consultas no dia alocado e dez no dia sem distribuição, todas 200 e abaixo de 3 segundos. Mediana, máximo, cada amostra e tamanho da massa registrados; medição local sem simular teste de carga ou tela.
- Status: ✅ PASSOU.

| Situação | 10 amostras HTTP (ms) | Mediana (ms) | Máximo (ms) |
| --- | --- | ---: | ---: |
| completa | 26.501, 31.382, 40.797, 38.433, 34.133, 28.26, 22.711, 22.188, 23.563, 28.606 | 28.433 | 40.797 |
| espera | 25.273, 21.096, 21.046, 20.568, 23.975, 22.679, 20.569, 22.084, 23.333, 29.953 | 22.381 | 29.953 |

Massa no momento: `{'agendamento': 18, 'alocacao_diaria': 13, 'alocacao_aluno': 19}`. Medição local HTTP contra o servidor real; sem simular rede móvel, carga concorrente ou tela.


---

## Rastreabilidade

| Critério/regra | Casos API | Complemento |
| --- | --- | --- |
| AC-01 / fluxo principal — dados por turno | 001, 002 | UI-001, UI-002, UI-003 |
| AC-02 / FA-001 — aguardando alocação do veículo | 003, 004 | UI-002, UI-004, UI-005 |
| AC-03 / FA-002 — realocação | 005 | UI-006 |
| AC-04 — dado mais atual | 006 | UI-007 |
| AC-05 / RNF-001 — até 3 s | 009 | UI-009 |
| Sem agendamento e parâmetros | 007 | UI-001 |
| RN-001 / RN-003 / RN-007 — isolamento e regras de alocação | 001, 005, 008 | UI-008 |
| RNF-012 — consistência | 006 | UI-007 |

## Defeitos encontrados

| Caso | Defeito ou dependência | Issue |
| --- | --- | --- |
| CT-HU019-API-005 | Leitura com fixture confirmada; fluxo de realocação entre rotas ainda recusado pela HU-016. | [#478](https://github.com/GOUOCE/GOUCE-app/issues/478), dependência existente; sem nova issue duplicada |
| CT-HU019-API-007 | Datas inválidas retornam mensagem técnica em inglês. | [#486](https://github.com/GOUOCE/GOUCE-app/issues/486) — JSON de falha no corpo |
| CT-HU019-API-008 | Alunos sem acesso regular recebem 200 com a própria alocação; esperado 403 é inferido do padrão do aluno, sujeito à confirmação do PO. | [#487](https://github.com/GOUOCE/GOUCE-app/issues/487) — JSON de falha no corpo |

## Observações gerais

- Referências: [requisitos, seção 7.6](../../../../../docs/requisitos.md), [BDD do épico 05](../../../../../bdd/features/epico-05/README.md) e as [decisões do PO na #465](https://github.com/GOUOCE/GOUCE-app/issues/465). O README do BDD não aponta divergências relevantes para a HU-019; os riscos abaixo vêm de integração com a HU-016.
- A HU-019 existe na `develop` e é consumida pelas telas do aluno; a leitura do código não aprova caso.
- Execução real em 17/11/2026: cadastros, reservas, distribuição automática/manual, nova distribuição e cancelamento por HTTP; contas e documentos sintéticos por fixture ORM. Sem mocks ou substituição de dependências. A fixture de realocação e os estados de acesso foram preparados somente no banco isolado e restaurados.

## Registro desta execução

**9/9 casos concluídos: 6 passaram, 2 falharam e 1 parcial; 0 pendentes.** 128 chamadas HTTP incluindo preparação/logins; 371 verificações registradas, 365 satisfeitas. GETs e recusas conferidos com snapshots completos em conexões novas: reservas, alocações e auditoria preservadas.

Somente falhas têm JSON de evidência, no corpo das issues. Sem pasta ou arquivo de evidência no repositório. Os 9 casos de UI permanecem pendentes.

Aluno/representante exclusivo por fixtures ORM e login real; representante não tem perfil aluno, isolando o papel. Estados pendente/rejeitado/vencido por fixtures SQL após reservar/alocar por HTTP como aprovados. Estados restaurados depois. Esperado 403 de acesso regular é inferido do padrão HU-014/HU-015 e está sujeito à confirmação do PO, conforme o planejamento.
