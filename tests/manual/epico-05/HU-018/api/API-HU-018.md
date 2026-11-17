# Testes manuais de API — HU-018 — Visualização da Lista de Embarque

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Alocação e Distribuição Logística (EP-005) |
| Funcionalidade | HU-018 — Visualização da Lista de Embarque |
| Camada | API |
| Tipo de teste | Funcional manual essencial, integração, autorização e privacidade de dados — baseado em risco |
| Endpoints | `GET /alocacao-diaria/rotas-do-dia?data=YYYY-MM-DD` e `GET /alocacao-diaria/lista-embarque?data=&rota_id=&turno=`. Apoio: HU-016 (distribuição), HU-013/014 (reservas e cancelamento) e cadastros de frota, motoristas e rotas. |
| Base do planejamento | `develop` `1eb2818d` (módulo `backend/src/modulos/alocacao_diaria/`, `lista_embarque_service.py`) |
| Branch de planejamento | `test/planejamento-api-ui-hu-018`, com entrega para `develop` |
| Revisão do planejamento | 16/11/2026 — requisitos 7.6 com as decisões do PO (#465), BDD do épico 05 e leitura do código |
| Ambiente | HTTP real `http://127.0.0.1:8118`; Docker `atu-qa-hu018`; PostgreSQL 15.17 em banco novo; Alembic `82_create_alocacao_diaria` (inclui `82_updated_at_faculdade_ponto`); `America/Fortaleza` |
| Total de casos | 9 |
| Última execução | 17/11/2026 — 5/9 casos concluídos; início `2026-11-17T13:30:52.368725-03:00` |
| Branch de execução | `test/execucao-api-hu-018`, criada da `develop` atualizada `7372b8d67165344545c1264ac936cd4c060ca245` |
| Código executado | Backend exato do commit `7372b8d67165344545c1264ac936cd4c060ca245`, sem alterações de produto |
| Testador | LLM — execução de API; Cauan Ricardo — revisão |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Em execução | 9 | 2 | 3 | 0 | 0 | 4 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API e PostgreSQL reais em stack isolada, com as migrations da `develop` até `82_create_alocacao_diaria` (head única do commit executado, incluindo `82_updated_at_faculdade_ponto`). Registrar URL, SHA, data/fuso e acesso de leitura às tabelas `alocacao_diaria`, `alocacao_aluno`, `agendamento` e `log_auditoria`. Não usar `create_all` nem mock no lugar da integração HTTP. [Guia](README.md). |
| PC-02 | Tokens reais: administrador (seed `admin@gouce.app`); alunos A a F aprovados e com vínculo válido; representante R1 da UFC e R2 da IFCE; aluno pendente ou reprovado e representante inativo para os casos de acesso. Credenciais fora do Git. |
| PC-03 | Cadastros pela API administrativa: IES UFC e IFCE; bairros/pontos; **P1 Rota Centro - UFC** (06:30/17:30, atende UFC na ida e na volta) e **P2 Rota Campo - IFCE** (06:40/18:40, atende IFCE). Frota e escala: ônibus **V1 `ABC1D23`** (3 assentos e 2 em pé), **V2 `DEF4G56`** (2 assentos e 1 em pé), **V3 `HIJ7K89`** (4 assentos e 0 em pé) e **V4** inativo; motoristas **M1, M2, M3** ativos e **M4** inativo. |
| PC-04 | D = data local do servidor; anotar hora e fuso. Usar dias úteis válidos dentro da janela de agendamento (D+1 em diante) e registrar ids/datas reais; as datas fixas do BDD são exemplos. Sem alterar o relógio do host. |
| PC-05 | A distribuição automática considera **todos** os ônibus e motoristas ativos do sistema (e só usa tantos ônibus quantos forem os motoristas ativos). Para controlar o cenário, ativar/inativar ônibus e motoristas pela API administrativa (`PATCH /onibus/{placa}/inativar` e `/reativar`, `PATCH /motoristas/{id}/inativar` e `/reativar`) e devolver a frota ao estado base ao fim de cada caso. |
| PC-06 | Representantes: R1 vinculado à UFC e R2 à IFCE (promoção pela HU-030); um representante com vínculo inativo e outro sem IES responsável. A lista usa o vínculo ativo e a IES responsável do representante. |
| PC-07 | A lista depende de distribuição confirmada (HU-016) sobre reservas da HU-013, com alunos de nomes distintos (inclusive acentuados e fora de ordem), de IES diferentes e com as quatro combinações de turno. |

## Contrato de referência

- `rotas-do-dia`: `{ data, rotas: [{ rota_id, nome_rota, horario_saida }] }`, ordenado pelo nome; acesso de administrador, representante e supervisor (apelido do representante).
- `lista-embarque`: `data`, `rota_id`, `nome_rota`, horários, `veiculos_escalados`, `total_alunos_alocados`, `texto_contador`, `permite_imprimir`, `mensagem`, `ultima_sincronizacao`, `indicador_sincronizacao` e `alunos` com `indicacao_turno`, lugar, ônibus e motorista por turno.
- Administrador exige `rota_id` (422 `ROTA_ID_OBRIGATORIO`); representante descobre a rota pela IES (404 `SEM_ROTA_NO_DIA`, 422 `MULTIPLAS_ROTAS`) e vê só alunos da IES do turno (RN-015).
- Só entram alunos com vínculo `ALOCADO` e reserva `ATIVO`; o cancelamento da HU-014 marca o vínculo como `CANCELADO`.

## Resumo da execução

Usar o token do administrador, salvo indicação. A lista depende da distribuição do dia: criar a distribuição (HU-016) antes dos casos de lista e conferir o banco em nova conexão.

### Seção A — Seletor e lista da rota

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU018-API-001 | Rotas do dia para o seletor “Rota *” | D+1 com distribuição confirmada (HU-016) em P1 e P2; data sem alocação; GET `/alocacao-diaria/rotas-do-dia?data=` com administrador e com R1 (UFC). | 200 com `data` e `rotas` (`rota_id`, `nome_rota`, `horario_saida`) por perfil, ordenadas pelo nome. | ✅ PASSOU | BDD: API informa as rotas do dia para o seletor. |
| CT-HU018-API-002 | Lista de embarque da rota: contador, ordenação e dados dos alunos | P1 com 5 alunos alocados (nomes fora de ordem alfabética e nomes com acento) em V1 e M1; GET `/alocacao-diaria/lista-embarque?data=&rota_id=<P1>`; depois uma rota com 1 aluno. | 200; contador e texto corretos; lista ordenada pelo nome; dados e veículos conferem com o banco. | ❌ FALHOU | BDD: seleciona a rota; contador; ordenação por nome. |
| CT-HU018-API-003 | Indicação do turno agendado e filtro por turno | Alunos com só ida, só volta, ida e volta na mesma IES e ida e volta em IES distintas; consultas sem filtro e com `turno=ida`, `turno=volta` e `turno=noite`. | Quatro indicações corretas; filtro por turno restringe os dados; valor inválido recusado. | ❌ FALHOU | BDD: indicação do turno agendado do aluno. |
| CT-HU018-API-004 | Rota sem alunos alocados | Rota ativa sem alocação na data; rota cuja alocação só tem aluno com reserva cancelada. | 200 com contador zero, mensagem do requisito e impressão desabilitada. | ✅ PASSOU | BDD: rota sem alunos; AC-04 e FA-002. |

### Seção B — Representante e parâmetros

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU018-API-005 | Parâmetros do administrador: rota obrigatória, inexistente e data inválida | Administrador sem `rota_id`; `rota_id` 999999, 0, -1 e `abc`; `data` `2026-02-30`, `16-11-2026` e ausente. | 422 sem rota; 404 rota inexistente; 422 para entradas inválidas; nenhuma resposta 500. | ❌ FALHOU | Risco de leitura: a data inexistente passa pelo padrão da consulta e falha ao converter. BDD: rota obrigatória; rota inexistente. |
| CT-HU018-API-006 | Representante: apenas alunos da sua faculdade e descoberta automática da rota | R1 (UFC) e R2 (IFCE); P1 com alunos da UFC e da IFCE; GET lista sem `rota_id` com 1 rota, com 2 rotas e sem rota; com `rota_id` de rota sem alunos da IES; representante sem vínculo ativo e sem IES. | Só alunos da própria IES; rota descoberta; 422 com várias rotas; 404 sem rota; 403 sem vínculo. | ⏳ PENDENTE | BDD: representante vê só os alunos da faculdade; descoberta da rota; várias rotas; sem rota; sem vínculo. |

### Seção C — Atualização e acesso

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU018-API-007 | Cancelamento e realocação refletidos na lista | P1 com 5 alunos alocados; cancelar a reserva de um aluno pela HU-014; depois nova distribuição manual que muda o ônibus de dois alunos. | Aluno cancelado some e o contador cai; realocação aparece com o novo ônibus. | ⏳ PENDENTE | BDD: atualização por cancelamento e realocação; AC-06 e FA-003. |
| CT-HU018-API-008 | Somente alunos alocados e ativos; indicador de sincronização | Alunos com reserva ativa e alocados, excedentes sem alocação e vínculos CANCELADOS; duas consultas separadas por alguns minutos. | Só ALOCADO com reserva ATIVA; `ultima_sincronizacao` e `indicador_sincronizacao` coerentes. | ⏳ PENDENTE | BDD: lista apenas alunos alocados com agendamento ativo; indicador de sincronização. |
| CT-HU018-API-009 | Autenticação e perfis sem acesso (RNF-010) | GET `/rotas-do-dia` e `/lista-embarque` sem token, com token inválido, aluno, representante com vínculo e administrador (controle). | 401 sem credencial válida; 403 para aluno; representante e administrador com acesso restrito ao perfil. | ⏳ PENDENTE | BDD: API nega a lista ao usuário sem perfil; sem token. O perfil `supervisor` é apelido do representante. |

## Detalhamento dos casos

### Seção A — Seletor e lista da rota

#### CT-HU018-API-001 — Rotas do dia para o seletor “Rota *”

**Técnica/tipo:** Partição por perfil (administrador, representante) e por data com e sem alocação.

**Dados de entrada:** D+1 com distribuição confirmada (HU-016) em P1 e P2; data sem alocação; GET `/alocacao-diaria/rotas-do-dia?data=` com administrador e com R1 (UFC).

**Passos**

1. Confirmar a distribuição de D+1 e anotar as rotas com alocação.
2. Consultar `rotas-do-dia` de D+1 e de uma data sem alocação com o administrador.
3. Repetir de D+1 com R1 e comparar com as rotas que atendem a UFC.

**Resultado esperado**

- Administrador: 200 com as rotas com alocação na data e as rotas ativas, ordenadas pelo nome, cada uma com `horario_saida` em HH:MM.
- Representante: somente as rotas com alunos da sua IES na data (ou, sem alocação, as rotas ativas que atendem a IES).
- Data sem alocação não gera erro e devolve a lista de rotas ativas permitidas para o perfil.

**Resultado obtido**

- Rotas com alocação e fallback em data vazia corretos para administrador e R1; ordenação/horários e ausência de escrita confirmados.
- Status: ✅ PASSOU.

---

#### CT-HU018-API-002 — Lista de embarque da rota: contador, ordenação e dados dos alunos

**Técnica/tipo:** Integração de contrato e partição por quantidade (1, N); conferência com o banco.

**Dados de entrada:** P1 com 5 alunos alocados (nomes fora de ordem alfabética e nomes com acento) em V1 e M1; GET `/alocacao-diaria/lista-embarque?data=&rota_id=<P1>`; depois uma rota com 1 aluno.

**Passos**

1. Distribuir os alunos (HU-016) e anotar nomes, pontos, IES e ônibus no banco.
2. Consultar a lista da rota com o administrador e guardar HTTP e corpo.
3. Comparar cada campo com o banco; consultar também uma rota com 1 aluno.

**Resultado esperado**

- 200 com `data`, `rota_id`, `nome_rota`, `horario_saida`, `horario_retorno`, `veiculos_escalados`, `total_alunos_alocados`, `texto_contador`, `permite_imprimir` e `alunos`.
- `texto_contador` é “5 alunos alocados” e, com um aluno, “1 aluno alocado”; `permite_imprimir` verdadeiro.
- `alunos` ordenados alfabeticamente pelo nome; cada item traz nome, ponto de embarque/desembarque, IES de ida/volta, lugar e ônibus por turno.
- `veiculos_escalados` traz placa, motorista, sentados e em pé de cada alocação, iguais ao banco.

**Resultado obtido**

- Listas com cinco e um aluno, contador, pontos/IES e ônibus/motoristas conferidos no PostgreSQL. Ordem obtida desloca Ágata para depois de Zuleica; divergência registrada. Defeitos: ordenacao_acentos.
- Status: ❌ FALHOU.

---

#### CT-HU018-API-003 — Indicação do turno agendado e filtro por turno

**Técnica/tipo:** Tabela de decisão ida × volta × IES; partição do filtro `turno`.

**Dados de entrada:** Alunos com só ida, só volta, ida e volta na mesma IES e ida e volta em IES distintas; consultas sem filtro e com `turno=ida`, `turno=volta` e `turno=noite`.

**Passos**

1. Distribuir ao menos um aluno de cada combinação na mesma rota.
2. Consultar sem filtro, com `turno=ida`, com `turno=volta` e com `turno=noite`.
3. Conferir `indicacao_turno`, `tipo_lugar_*`, `onibus_*` e `motorista_*` por aluno.

**Resultado esperado**

- `indicacao_turno` é APENAS_IDA, APENAS_VOLTA, IDA_E_VOLTA_MESMA_IES ou IDA_E_VOLTA_IES_DISTINTAS conforme a reserva.
- Com `turno=ida` só dados de ida são preenchidos e `veiculos_escalados` só traz alocações de ida; idem para volta.
- `turno=noite` é recusado com 422 de validação.

**Resultado obtido**

- As quatro indicações e o filtro de alunos/veículos funcionam; turno=noite retorna 422. Contudo, filtro ida/volta preserva ponto e IES do turno excluído. Defeitos: filtro_turno.
- Status: ❌ FALHOU.

---

#### CT-HU018-API-004 — Rota sem alunos alocados

**Técnica/tipo:** Partição vazio × preenchido; funcional negativo.

**Dados de entrada:** Rota ativa sem alocação na data; rota cuja alocação só tem aluno com reserva cancelada.

**Passos**

1. Consultar a lista de uma rota sem alocação na data.
2. Cancelar a reserva do único aluno de outra rota (HU-014) e consultar essa rota.

**Resultado esperado**

- HTTP 200 com `total_alunos_alocados` 0, `texto_contador` “0 alunos alocados” e `alunos` vazio.
- `mensagem` “Essa rota não possui nenhum aluno alocado para este dia.” e `permite_imprimir` falso.

**Resultado obtido**

- Rota sem alocação e rota após cancelamento do único aluno retornaram 200, zero alunos, mensagem prevista e impressão desabilitada.
- Status: ✅ PASSOU.

---

### Seção B — Representante e parâmetros

#### CT-HU018-API-005 — Parâmetros do administrador: rota obrigatória, inexistente e data inválida

**Técnica/tipo:** Partição de entradas inválidas; mensagens e códigos HTTP.

**Dados de entrada:** Administrador sem `rota_id`; `rota_id` 999999, 0, -1 e `abc`; `data` `2026-02-30`, `16-11-2026` e ausente.

**Passos**

1. Enviar cada variação com o token do administrador e guardar HTTP e corpo.
2. Conferir que as respostas não expõem dados de alunos.

**Resultado esperado**

- Sem `rota_id`: 422 com o código `ROTA_ID_OBRIGATORIO` e a mensagem “O parâmetro rota_id é obrigatório para administradores.”
- `rota_id` 999999: 404 com “Rota não encontrada.”; 0, -1 e `abc`: 422 de validação.
- `data` `2026-02-30`: recusa 422 com mensagem da API, sem erro 500; `16-11-2026` ou ausente: 422 de validação.

**Resultado obtido**

- Rota obrigatória/inexistente e ids/formato/query inválidos recusados corretamente. Data 2026-02-30 provocou HTTP 500 em lista-embarque e rotas-do-dia, com reservas/alocações/auditoria preservadas. Defeitos: data_inexistente.
- Status: ❌ FALHOU.

---

#### CT-HU018-API-006 — Representante: apenas alunos da sua faculdade e descoberta automática da rota

**Técnica/tipo:** Partição por IES e tabela de decisão de rotas do dia (0, 1, várias); RN-015 e RNF-010.

**Dados de entrada:** R1 (UFC) e R2 (IFCE); P1 com alunos da UFC e da IFCE; GET lista sem `rota_id` com 1 rota, com 2 rotas e sem rota; com `rota_id` de rota sem alunos da IES; representante sem vínculo ativo e sem IES.

**Passos**

1. Distribuir alunos da UFC e da IFCE na mesma rota e consultar a lista com R1 e com R2.
2. Consultar sem `rota_id` nos três cenários de quantidade de rotas.
3. Desativar o vínculo do representante e consultar; consultar com representante sem IES responsável.

**Resultado esperado**

- R1 vê somente alunos cuja IES do turno é a UFC e R2 somente os da IFCE; nenhum nome, ponto ou IES de outra IES aparece.
- Sem `rota_id` e com uma rota, a lista dessa rota é devolvida; com duas, 422 `MULTIPLAS_ROTAS` com `rotas_disponiveis`; sem nenhuma, 404 `SEM_ROTA_NO_DIA`.
- Representante sem vínculo ativo ou sem IES: 403, sem dados.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção C — Atualização e acesso

#### CT-HU018-API-007 — Cancelamento e realocação refletidos na lista

**Técnica/tipo:** Transição de estado e consistência entre HUs (HU-014, HU-016 e HU-018).

**Dados de entrada:** P1 com 5 alunos alocados; cancelar a reserva de um aluno pela HU-014; depois nova distribuição manual que muda o ônibus de dois alunos.

**Passos**

1. Consultar a lista e anotar contador e `veiculos_escalados`.
2. Cancelar a reserva de um aluno com `DELETE /transporte/agendamentos/{id}` e consultar de novo.
3. Confirmar uma nova distribuição manual que troque o ônibus de dois alunos e consultar de novo.

**Resultado esperado**

- Depois do cancelamento a lista tem um aluno a menos, `texto_contador` recalculado, o vínculo marcado CANCELADO no banco e os totais de sentados e em pé coerentes.
- Depois da nova distribuição, `onibus_ida`/`onibus_volta` e `veiculos_escalados` refletem os novos ônibus.
- Nenhuma resposta traz aluno com reserva cancelada.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU018-API-008 — Somente alunos alocados e ativos; indicador de sincronização

**Técnica/tipo:** Partição por status (ALOCADO, CANCELADO) e verificação de metadado de atualização.

**Dados de entrada:** Alunos com reserva ativa e alocados, excedentes sem alocação e vínculos CANCELADOS; duas consultas separadas por alguns minutos.

**Passos**

1. Preparar alunos alocados, um excedente e um vínculo cancelado na mesma rota.
2. Consultar a lista e comparar com o banco.
3. Repetir após alguns minutos e comparar `ultima_sincronizacao`.

**Resultado esperado**

- A lista contém apenas alunos com vínculo ALOCADO e reserva ATIVA; excedentes sem alocação e vínculos cancelados ficam de fora.
- `ultima_sincronizacao` é um instante UTC recente e avança a cada consulta; `indicador_sincronizacao` informa a atualização para a tela exibir “Atualizado há X min”.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU018-API-009 — Autenticação e perfis sem acesso (RNF-010)

**Técnica/tipo:** Partição por perfil; proteção de dados pessoais.

**Dados de entrada:** GET `/rotas-do-dia` e `/lista-embarque` sem token, com token inválido, aluno, representante com vínculo e administrador (controle).

**Passos**

1. Enviar as duas consultas com cada credencial e guardar HTTP e corpo.
2. Conferir que as recusas não trazem nome, ponto ou IES de alunos.

**Resultado esperado**

- Sem token ou token inválido: 401.
- Aluno: 403, sem dados pessoais na resposta.
- Administrador e representante com vínculo: 200, o representante limitado à sua IES.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

## Rastreabilidade

| Critério/regra | Casos API | Complemento |
| --- | --- | --- |
| AC-01 / fluxo principal — seletor e lista | 001, 002 | UI-001, UI-002 |
| AC-03 — contador, ordenação e turnos | 002, 003 | UI-002, UI-003 |
| AC-04 / FA-002 — rota sem alunos | 004 | UI-004 |
| AC-02 / FA-001 — acesso direto e representante | 005, 006 | UI-006, UI-007 |
| AC-06 / FA-003 — cancelamento, realocação e sincronização | 007, 008 | UI-008 |
| AC-07 / RNF-010 — acesso restrito | 006, 009 | UI-007, UI-010 |
| RN-015 — representante vê só a sua IES | 006 | UI-007 |
| RNF-012 — consistência | 007 | UI-008 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-HU018-API-002 | Nomes acentuados aparecem depois de Z na lista. | Reproduzido; publicação ao concluir a execução |
| CT-HU018-API-003 | Filtro por turno mantém ponto/IES do trecho excluído. | Reproduzido; publicação ao concluir a execução |
| CT-HU018-API-005 | Data civil impossível causa HTTP 500 nas duas consultas. | Reproduzido; publicação ao concluir a execução |

## Observações gerais

- Referências: [requisitos, seção 7.6](../../../../../docs/requisitos.md), [BDD do épico 05](../../../../../bdd/features/epico-05/README.md) e as [decisões do PO na #465](https://github.com/GOUOCE/GOUCE-app/issues/465). O README do BDD não aponta divergências relevantes para a HU-018.
- Mensagens de API vêm do código; as de interface, dos requisitos ou das telas.
- Execução real solicitada em 17/11/2026. Cadastros, reservas, promoção/revogação de representantes, distribuição manual, cancelamento e realocação preparados por HTTP. Contas/documentos sintéticos por fixture ORM; estado legado de representante sem IES por fixture SQL isolada, restaurada após as consultas. Não há mocks nem substituição de dependências.

## Registro desta execução

**5/9 casos concluídos: 2 passaram e 3 falharam; 4 pendentes.** 76 chamadas HTTP no total, incluindo preparação/logins; 146 verificações, 141 satisfeitas. Reservas, alocações e auditoria conferidas em conexões novas; GETs sem escrita: confirmado.

Conforme solicitado por Cauan, somente as falhas têm JSON de evidência, inserido no corpo das issues. Sem arquivo JSON de evidência no repositório e sem pasta de evidências. Os 10 casos de UI seguem pendentes.
