# Testes manuais de API — HU-016 — Distribuição de Alunos nos Ônibus

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Alocação e Distribuição Logística (EP-005) |
| Funcionalidade | HU-016 — Distribuição de Alunos nos Ônibus |
| Camada | API |
| Tipo de teste | Funcional manual essencial, integração, regras de capacidade, integridade e autorização — baseado em risco |
| Endpoints | `GET /alocacao-diaria/distribuicao-automatica?data=YYYY-MM-DD` e `POST /alocacao-diaria/distribuicao` (`modo` automático ou manual). Apoio: `GET /alocacao-diaria/lista-embarque`, `GET /alocacao-diaria/minha-viagem`, HU-013/014 para a massa e cadastros de frota/motoristas/rotas. |
| Base do planejamento | `develop` `1eb2818d` (módulo `backend/src/modulos/alocacao_diaria/`) |
| Branch de planejamento | `test/planejamento-api-ui-hu-016`, com entrega para `develop` |
| Revisão do planejamento | 16/11/2026 — requisitos 7.6 com as decisões do PO (#465), BDD do épico 05 e leitura do código |
| Ambiente | A preencher — URL, SHA testado, banco e fuso; base analisada `develop` `1eb2818d`, PostgreSQL 15, Alembic `82_updated_at_faculdade_ponto`, `America/Fortaleza` |
| Total de casos | 11 |
| Última execução | Não realizada |
| Testador | LLM — execução de API; Cauan Ricardo — revisão |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 11 | 0 | 0 | 0 | 0 | 11 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API e PostgreSQL reais em stack isolada, com as migrations da `develop` até `82_updated_at_faculdade_ponto` (head única). Registrar URL, SHA, data/fuso e acesso de leitura às tabelas `alocacao_diaria`, `alocacao_aluno`, `agendamento` e `log_auditoria`. Não usar `create_all` nem mock no lugar da integração HTTP. [Guia](README.md). |
| PC-02 | Tokens reais: administrador (seed `admin@gouce.app`); alunos A a F aprovados e com vínculo válido; representante R1 da UFC e R2 da IFCE; aluno pendente ou reprovado e representante inativo para os casos de acesso. Credenciais fora do Git. |
| PC-03 | Cadastros pela API administrativa: IES UFC e IFCE; bairros/pontos; **P1 Rota Centro - UFC** (06:30/17:30, atende UFC na ida e na volta) e **P2 Rota Campo - IFCE** (06:40/18:40, atende IFCE). Frota e escala: ônibus **V1 `ABC1D23`** (3 assentos e 2 em pé), **V2 `DEF4G56`** (2 assentos e 1 em pé), **V3 `HIJ7K89`** (4 assentos e 0 em pé) e **V4** inativo; motoristas **M1, M2, M3** ativos e **M4** inativo. |
| PC-04 | D = data local do servidor; anotar hora e fuso. Usar dias úteis válidos dentro da janela de agendamento (D+1 em diante) e registrar ids/datas reais; as datas fixas do BDD são exemplos. Sem alterar o relógio do host. |
| PC-05 | A distribuição automática considera **todos** os ônibus e motoristas ativos do sistema (e só usa tantos ônibus quantos forem os motoristas ativos). Para controlar o cenário, ativar/inativar ônibus e motoristas pela API administrativa (`PATCH /onibus/{placa}/inativar` e `/reativar`, `PATCH /motoristas/{id}/inativar` e `/reativar`) e devolver a frota ao estado base ao fim de cada caso. |
| PC-06 | Reservas ativas preparadas pela API da HU-013 para D+1 em P1 e P2 (e P3 no CT-005), com ids reais; reservas canceladas pela API da HU-014 quando o caso pedir. A prévia só considera agendamentos `ATIVO` da data. |
| PC-07 | Cada caso devolve a frota ao estado base. Conferir sempre `alocacao_diaria` e `alocacao_aluno` em nova conexão; a confirmação substitui **todas** as alocações da data. |

## Contrato de referência

- Prévia: `GET /alocacao-diaria/distribuicao-automatica?data=` (administrador) devolve `demanda_por_rota`, `alocacoes` (`rota_id`, `onibus_id`, `motorista_id`, `turno`, `capacidade`, `sentados`, `em_pe`, `alunos`), `excedentes_globais` e `alertas`.
- Confirmação: `POST /alocacao-diaria/distribuicao` com `data`, `modo` (`automatico` ou `manual`, padrão `manual`) e `alocacoes` com `rota_id`, `onibus_id` (placa), `motorista_id`, `turno` e `alunos` (`agendamento_id` e `tipo_lugar` `sentado` ou `em_pe`). Responde 201 com `mensagem`, `data`, `status_logistico` e `alocacoes`.
- Recusas: `DISTRIBUICAO_INVALIDA` com 422 (capacidade, recurso inexistente/inativo, aluno inválido) e 409 (ônibus ou motorista repetido no mesmo turno do dia). A confirmação **substitui** todas as alocações da data.
- Banco: `alocacao_diaria` (única por data, ônibus e turno e por data, motorista e turno) e `alocacao_aluno` (única por agendamento e turno; `status` ALOCADO ou CANCELADO).

## Resumo da execução

Todas as chamadas usam o token do administrador, salvo indicação. Executar na ordem: os CT-006 e CT-007 criam a distribuição usada pelas HU-017, HU-018 e HU-019. Os códigos HTTP refletem o contrato analisado; as regras vêm dos requisitos e do BDD.

### Seção A — Prévia e demanda

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU016-API-001 | Prévia: demanda por rota, contrato e ausência de gravação | D+1 com reservas ativas de A (ida, P1), B (ida e volta, P1), C (volta, P1) e D (ida, P2), mais uma reserva cancelada e outra de outro dia; V1, V2, V3 e M1, M2, M3 ativos; GET `/alocacao-diaria/distribuicao-automatica?data=<D+1>` com administrador. | 200 com demanda real por rota e alocações sugeridas; nada gravado no banco. | ⏳ PENDENTE | BDD: demanda por rota; prévia não grava. |
| CT-HU016-API-002 | Dia sem demanda, sem motoristas e data inválida | Data sem reservas ativas; stack com todos os motoristas inativos e ao menos um ônibus ativo; datas `2026-02-30` e `16-11-2026`; parâmetro `data` ausente. | 200 vazio sem demanda; 422 sem motoristas ativos; 422 para data inválida, sem erro 500. | ⏳ PENDENTE | BDD: sem alunos; API recusa a prévia sem motoristas ativos. |

### Seção B — Capacidade e excedentes

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU016-API-003 | Sentados e em pé no limite da capacidade | Somente V1 ativo (3 assentos e 2 em pé) e um motorista; P1 na ida com 2, 3, 5 e 6 alunos, uma rodada por quantidade. | 2→2/0, 3→3/0, 5→3 sentados e 2 em pé; 6→5 alocados e 1 excedente; nunca acima da capacidade. | ⏳ PENDENTE | BDD: sentados e em pé (2, 3 e 5); excedentes; RN-001. |
| CT-HU016-API-004 | Outro ônibus com assento livre antes de aluno em pé | V1 (3 assentos e 2 em pé) e V3 (4 assentos e 0 em pé) com dois motoristas e P1 na ida com 5 alunos; depois com 8 alunos; depois só V1 com 5 alunos; por fim 10 alunos para 9 lugares. | Nenhum aluno em pé enquanto outro ônibus tiver assento; em pé só sem vaga; excedentes sinalizados. | ⏳ PENDENTE | Risco de leitura: o algoritmo enche assentos e vagas em pé do primeiro ônibus antes de usar o outro. |
| CT-HU016-API-005 | Rota com faculdade sem demanda no turno | P3 Rota Multi - UECE/Católica (atende as duas IES na ida e na volta, sem IES em comum com P1/P2) com reservas só de alunos da UECE na volta; V1 e M1. | Prévia e confirmação normais, sem exigir parada na IES sem alunos. | ⏳ PENDENTE | BDD: faculdade sem aluno no turno; AC-16. |

### Seção C — Confirmação e persistência

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU016-API-006 | Confirmar a distribuição automática e persistir | POST `/alocacao-diaria/distribuicao` com `{"data": "<D+1>", "modo": "automatico"}` para a massa do CT-001; depois nova confirmação do mesmo dia. | 201 “Distribuição realizada com sucesso”, status DISTRIBUIDO e linhas corretas; reconfirmar substitui sem duplicar. | ⏳ PENDENTE | BDD: confirmar; API persiste; nova confirmação substitui. |
| CT-HU016-API-007 | Confirmar com excedentes informa a lista | V1 e M1 ativos; P1 na ida com 6 alunos (5 cabem e 1 excede); POST `modo: automatico`; depois `GET /alocacao-diaria/minha-viagem` do aluno excedente. | 201; 5 gravados; resposta informa o excedente; o aluno excedente aguarda alocação. | ⏳ PENDENTE | Risco de leitura: `persist` devolve só mensagem, data, status e alocações, sem os excedentes. BDD: excedentes na confirmação. |

### Seção D — Ajuste manual e realocação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU016-API-008 | Distribuição manual: trocar ônibus/motorista e realocar excedente | Distribuição do CT-007 confirmada; POST `modo: manual` trocando o ônibus (V1→V3) e o motorista (M1→M2) de P1; mover o excedente para um ônibus com vaga do mesmo grupo e, depois, para V2, que atende P2. | Troca aceita e persistida; excedente realocado com vaga; realocação para outra rota conforme AC-09. | ⏳ PENDENTE | Risco de leitura: a validação exige que a alocação seja da rota da reserva e o ônibus não repete no turno. BDD: realocação; distribuição manual. |

### Seção E — Conflitos, recursos e acesso

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU016-API-009 | Capacidade e conflito de ônibus na distribuição manual | V1 (3 assentos e 2 em pé); POST manual com 6 alunos (3 sentados e 3 em pé), com 4 sentados e 0 em pé, com V1 em duas rotas no mesmo turno e com V1 na ida e na volta; prévia automática com um só ônibus e demanda de ida e de volta. | 422/409 com as mensagens do código, nada gravado; ida e volta com o mesmo ônibus aceitas. | ⏳ PENDENTE | Risco de leitura: na prévia automática o ônibus usado na ida não volta a ser candidato na volta. BDD: capacidade; ônibus em duas rotas; mesmo ônibus na ida e na volta. |
| CT-HU016-API-010 | Recursos e alunos inválidos e atomicidade | Ônibus, rota e motorista inexistentes ou inativos; agendamento cancelado ou de outro dia, sem o turno informado, de outra rota e repetido; lista de alocações vazia em modo manual, com uma distribuição já confirmada. | 422 com a mensagem de cada causa; qualquer recusa preserva a distribuição anterior. | ⏳ PENDENTE | Risco de leitura: com `alocacoes: []` o modo manual apaga as alocações da data e responde sucesso. BDD: recursos inativos; alunos inválidos; atomicidade. |
| CT-HU016-API-011 | Autenticação e perfis sem acesso | GET prévia e POST confirmação sem token, com token inválido, aluno, representante e administrador (controle). | 401 sem credencial válida; 403 para aluno e representante; administrador com acesso; nada gravado. | ⏳ PENDENTE | BDD: API nega a distribuição sem perfil administrativo e sem token; RN-006. |

## Detalhamento dos casos

### Seção A — Prévia e demanda

#### CT-HU016-API-001 — Prévia: demanda por rota, contrato e ausência de gravação

**Técnica/tipo:** Integração de contrato; partição por rota/turno; verificação de efeito colateral.

**Dados de entrada:** D+1 com reservas ativas de A (ida, P1), B (ida e volta, P1), C (volta, P1) e D (ida, P2), mais uma reserva cancelada e outra de outro dia; V1, V2, V3 e M1, M2, M3 ativos; GET `/alocacao-diaria/distribuicao-automatica?data=<D+1>` com administrador.

**Passos**

1. Contar as linhas de `alocacao_diaria` e `alocacao_aluno` da data e, no banco, as reservas ativas por rota e turno.
2. Consultar a prévia com o token do administrador, guardando HTTP e corpo sem credenciais.
3. Comparar `demanda_por_rota` com a demanda do banco (ida e volta somadas por rota) e conferir os campos de cada item de `alocacoes`.
4. Contar de novo as tabelas de alocação.

**Resultado esperado**

- HTTP 200 com `data`, `demanda_por_rota` (`rota_id` e `total_alunos`), `alocacoes`, `excedentes_globais` e `alertas`.
- O total por rota é a soma dos agendamentos ativos de ida e de volta; a reserva cancelada e a de outro dia não entram.
- Cada alocação traz `rota_id`, `onibus_id`, `motorista_id`, `turno`, `capacidade` (assentos e em pé), `sentados`, `em_pe` e `alunos` com `tipo_lugar`.
- Nenhuma linha é gravada em `alocacao_diaria` nem em `alocacao_aluno`; reservas e contadores continuam intactos.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU016-API-002 — Dia sem demanda, sem motoristas e data inválida

**Técnica/tipo:** Partição de equivalência (vazio, inválido) e tabela de decisão de pré-condições.

**Dados de entrada:** Data sem reservas ativas; stack com todos os motoristas inativos e ao menos um ônibus ativo; datas `2026-02-30` e `16-11-2026`; parâmetro `data` ausente.

**Passos**

1. Consultar a prévia de uma data sem reservas ativas.
2. Inativar M1, M2 e M3, consultar a data com demanda e reativar os motoristas.
3. Consultar com `2026-02-30`, `16-11-2026` e sem o parâmetro `data`.
4. Conferir que nenhuma variação gravou alocação.

**Resultado esperado**

- Sem demanda: 200 com `demanda_por_rota`, `alocacoes` e `excedentes_globais` vazios (a UI informa “Nenhum aluno agendado para este dia.”).
- Sem motoristas ativos e com ônibus ativo: 422 com código `DISTRIBUICAO_INVALIDA` e a mensagem “Não há motoristas ativos disponíveis.”
- `2026-02-30` (data inexistente): recusa 422 com mensagem da API, sem erro 500; formato inválido ou ausente: 422 de validação.
- Nada é gravado em nenhuma variação.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção B — Capacidade e excedentes

#### CT-HU016-API-003 — Sentados e em pé no limite da capacidade

**Técnica/tipo:** Valor-limite de capacidade (abaixo, no limite, acima).

**Dados de entrada:** Somente V1 ativo (3 assentos e 2 em pé) e um motorista; P1 na ida com 2, 3, 5 e 6 alunos, uma rodada por quantidade.

**Passos**

1. Deixar só V1 e M1 ativos e, ao fim, devolver a frota ao estado base.
2. Para cada quantidade, preparar as reservas de P1 na ida e consultar a prévia.
3. Conferir `sentados`, `em_pe`, `excedentes_globais` e a soma de `tipo_lugar` dos alunos.

**Resultado esperado**

- 2 alunos: 2 sentados e 0 em pé; 3 alunos: 3 e 0; 5 alunos: 3 sentados e 2 em pé.
- 6 alunos: 5 alocados (3 sentados e 2 em pé) e 1 em `excedentes_globais`; o ônibus nunca passa de assentos + em pé.
- `capacidade` informa 3 assentos e 2 em pé; os `tipo_lugar` somam `sentados` e `em_pe`.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU016-API-004 — Outro ônibus com assento livre antes de aluno em pé

**Técnica/tipo:** Tabela de decisão: ônibus com assento livre × demanda × capacidade em pé.

**Dados de entrada:** V1 (3 assentos e 2 em pé) e V3 (4 assentos e 0 em pé) com dois motoristas e P1 na ida com 5 alunos; depois com 8 alunos; depois só V1 com 5 alunos; por fim 10 alunos para 9 lugares.

**Passos**

1. Com V1 e V3 ativos e 5 alunos em P1, consultar a prévia e somar sentados e em pé de cada ônibus.
2. Repetir com 8 alunos e, depois, com 10 alunos (acima dos 9 lugares).
3. Deixar só V1 ativo e repetir com 5 alunos.
4. Anotar os alertas devolvidos e confirmar que nenhuma ocupação passa da capacidade.

**Resultado esperado**

- V1 + V3 com 5 alunos: ninguém em pé, pois outro ônibus tem assento livre (RN-007, decisão do PO na #465); os 5 ficam sentados entre os dois ônibus.
- V1 + V3 com 8 alunos (7 assentos): 7 sentados e 1 em pé; só vai em pé quem não couber nos assentos de nenhum ônibus.
- 10 alunos para 9 lugares (7 assentos + 2 em pé): 9 alocados e 1 excedente sinalizado.
- Somente V1 com 5 alunos: 3 sentados e 2 em pé, com a quantidade de alunos em pé sinalizada (AC-07).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU016-API-005 — Rota com faculdade sem demanda no turno

**Técnica/tipo:** Partição por faculdade atendida × demanda do turno.

**Dados de entrada:** P3 Rota Multi - UECE/Católica (atende as duas IES na ida e na volta, sem IES em comum com P1/P2) com reservas só de alunos da UECE na volta; V1 e M1.

**Passos**

1. Cadastrar as IES UECE e Católica e a rota P3; reservar alunos da UECE só na volta.
2. Consultar a prévia e confirmar a distribuição do dia.
3. Conferir a alocação de P3 e os alunos incluídos.

**Resultado esperado**

- A prévia e a confirmação funcionam (200 e 201); a alocação de P3 existe para o turno da volta com os alunos da UECE.
- O sistema não exige aluno na Católica nem recusa por parada sem demanda (AC-16).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção C — Confirmação e persistência

#### CT-HU016-API-006 — Confirmar a distribuição automática e persistir

**Técnica/tipo:** Transição de estado (prévia → persistida) e integridade; persistência verificada no banco.

**Dados de entrada:** POST `/alocacao-diaria/distribuicao` com `{"data": "<D+1>", "modo": "automatico"}` para a massa do CT-001; depois nova confirmação do mesmo dia.

**Passos**

1. Confirmar a distribuição automática e guardar HTTP e corpo.
2. Comparar `alocacao_diaria` e `alocacao_aluno` com a prévia: rota, ônibus, motorista, turno, `tipo_lugar` e `status`.
3. Repetir a confirmação do mesmo dia e contar as linhas.
4. Conferir que os agendamentos continuam ATIVOS e sem outro efeito.

**Resultado esperado**

- HTTP 201 com `mensagem` “Distribuição realizada com sucesso”, `data`, `status_logistico` `DISTRIBUIDO` e `alocacoes`.
- `alocacao_diaria` tem uma linha por rota, ônibus e turno, com motorista; `alocacao_aluno` tem uma linha por aluno e turno com `tipo_lugar` e `status` ALOCADO; sem ônibus nem motorista repetido no mesmo dia e turno.
- A nova confirmação substitui a anterior: mesma quantidade de linhas, sem duplicidade.
- Os agendamentos continuam ATIVOS e os contadores das reservas não mudam.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU016-API-007 — Confirmar com excedentes informa a lista

**Técnica/tipo:** Tabela de decisão capacidade × confirmação; funcional negativo permitido.

**Dados de entrada:** V1 e M1 ativos; P1 na ida com 6 alunos (5 cabem e 1 excede); POST `modo: automatico`; depois `GET /alocacao-diaria/minha-viagem` do aluno excedente.

**Passos**

1. Confirmar a distribuição automática com 6 alunos e guardar HTTP e corpo.
2. Conferir no banco os 5 alunos gravados e a ausência de linha para o excedente.
3. Consultar `minha-viagem` do aluno excedente na data.

**Resultado esperado**

- HTTP 201: a confirmação com excedentes é permitida e grava os 5 alunos alocados.
- A resposta informa os alunos excedentes (decisão do PO na #465, AC-13), para a tela exibir o aviso com a lista.
- O excedente não tem linha em `alocacao_aluno` e a reserva continua ativa; `minha-viagem` mostra AGUARDANDO_ALOCACAO e “Aguardando alocação do veículo”.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção D — Ajuste manual e realocação

#### CT-HU016-API-008 — Distribuição manual: trocar ônibus/motorista e realocar excedente

**Técnica/tipo:** Transição de estado e partição de destino (mesma rota × rota diferente); persistência.

**Dados de entrada:** Distribuição do CT-007 confirmada; POST `modo: manual` trocando o ônibus (V1→V3) e o motorista (M1→M2) de P1; mover o excedente para um ônibus com vaga do mesmo grupo e, depois, para V2, que atende P2.

**Passos**

1. A partir da prévia, montar o payload manual completo do dia (a confirmação substitui todas as alocações da data).
2. Trocar V1 por V3 e M1 por M2 na rota P1 e confirmar; conferir o banco.
3. Mover o excedente para um ônibus com vaga e confirmar; consultar a lista de embarque (HU-018) e `minha-viagem` (HU-019).
4. Tentar alocar o excedente de P1 em um ônibus de P2 (rota diferente) e registrar a resposta.

**Resultado esperado**

- A troca de ônibus e de motorista é aceita com 201 e persistida somente para a data enviada.
- O excedente alocado em ônibus com vaga recebe `tipo_lugar` coerente com a capacidade e passa a aparecer na lista de embarque e em `minha-viagem`.
- O administrador consegue realocar excedente para ônibus de outra rota que ainda tenha vaga (AC-09 e AC-10) e o aluno passa a ver em qual ônibus deve embarcar (HU-019, FA-002).
- Nenhuma capacidade é ultrapassada. Se a API recusar a realocação entre rotas, registrar a mensagem e confirmar a regra com o PO antes de abrir defeito.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção E — Conflitos, recursos e acesso

#### CT-HU016-API-009 — Capacidade e conflito de ônibus na distribuição manual

**Técnica/tipo:** Valor-limite de capacidade; tabela de decisão ônibus × rota × turno (RN-001, RN-003).

**Dados de entrada:** V1 (3 assentos e 2 em pé); POST manual com 6 alunos (3 sentados e 3 em pé), com 4 sentados e 0 em pé, com V1 em duas rotas no mesmo turno e com V1 na ida e na volta; prévia automática com um só ônibus e demanda de ida e de volta.

**Passos**

1. Enviar cada payload manual com o token do administrador, um por vez, guardando HTTP e corpo.
2. Contar as linhas de alocação antes e depois de cada recusa.
3. Com um só ônibus ativo, consultar a prévia de um dia com demanda na ida e na volta.

**Resultado esperado**

- 6 alunos em V1: 422 “alocação 0: capacidade total do ônibus excedida.”
- 4 sentados: 422 “alocação 0: capacidade de assentos ou em pé excedida.”
- V1 em duas rotas no mesmo dia e turno: 409 “alocação 1: ônibus ABC1D23 conflitante no turno ida.” (RN-003).
- V1 na ida e na volta (RN-003): 201; a prévia automática com um só ônibus também atende ida e volta com o mesmo veículo.
- Em toda recusa nada é gravado e a distribuição já confirmada do dia continua igual.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU016-API-010 — Recursos e alunos inválidos e atomicidade

**Técnica/tipo:** Partição de entradas inválidas e rollback; integridade (RNF-012).

**Dados de entrada:** Ônibus, rota e motorista inexistentes ou inativos; agendamento cancelado ou de outro dia, sem o turno informado, de outra rota e repetido; lista de alocações vazia em modo manual, com uma distribuição já confirmada.

**Passos**

1. Confirmar uma distribuição válida e anotar ids e contagens.
2. Enviar, um por vez, os payloads inválidos de cada variação e guardar HTTP e corpo.
3. Depois de cada envio, comparar o banco com a distribuição anterior.
4. Enviar `modo: manual` com `alocacoes: []` e conferir o efeito.

**Resultado esperado**

- 422 com “alocação 0: ônibus X inexistente ou inativo.”, “alocação 0: rota inexistente ou inativa.” e “alocação 0: motorista inexistente ou inativo.”
- 422 com “alocação 0: agendamento 99 não está ativo nessa data.”, “alocação 0: agendamento 99 não usa o turno volta.”, “alocação 0: agendamento 99 não pertence à rota 2.” e “alocação 1: agendamento 99 alocado mais de uma vez.”
- Toda recusa deixa a distribuição anterior idêntica (rollback total).
- A lista vazia em modo manual não apaga a distribuição confirmada do dia (RNF-012; esperado inferido, confirmar com o PO se divergir).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU016-API-011 — Autenticação e perfis sem acesso

**Técnica/tipo:** Partição por perfil; autorização.

**Dados de entrada:** GET prévia e POST confirmação sem token, com token inválido, aluno, representante e administrador (controle).

**Passos**

1. Enviar GET `/alocacao-diaria/distribuicao-automatica` e POST `/alocacao-diaria/distribuicao` com cada credencial.
2. Para os perfis negados, conferir que nenhuma linha de alocação foi criada.

**Resultado esperado**

- Sem token ou com token inválido: 401.
- Aluno e representante: 403, sem dados de alocação na resposta.
- Administrador: 200 na prévia e 201 na confirmação.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

## Rastreabilidade

| Critério/regra | Casos API | Complemento |
| --- | --- | --- |
| AC-01 / AC-12 — demanda por rota e prévia sem gravar | 001, 002 | UI-002, UI-003 |
| AC-03 / AC-04 — distribuição respeitando a capacidade; sentados e em pé | 001, 003 | UI-003 |
| AC-05 a AC-08 / RN-001 e RN-007 — em pé, outro ônibus, excedentes | 003, 004 | UI-003, UI-005 |
| AC-09 / AC-10 / FA-001 — realocar excedentes | 008 | UI-007; HU-019 (aviso de realocação) |
| AC-02 — trocar ônibus e motorista antes de confirmar | 008 | UI-006 |
| AC-11 / AC-14 / FA-002 / RN-003 — conflito de ônibus, ida e volta | 009 | UI-006 |
| AC-13 — confirmação, mensagem, status e excedentes | 006, 007 | UI-004, UI-005 |
| AC-16 — faculdade sem demanda no turno | 005 | — |
| AC-15 — alerta de rodízio (adiado com a HU-020) | Não se aplica | UI-001 (cartão oculto) |
| RNF-012 — consistência e atomicidade | 006, 009, 010 | UI-004, UI-008 |
| RN-006 / RF-017 — somente administrador | 011 | UI-009 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. Os riscos de leitura estão no [guia de execução da API](README.md). | — |

## Observações gerais

- Referências: [requisitos, seção 7.6](../../../../../docs/requisitos.md), [BDD do épico 05](../../../../../bdd/features/epico-05/README.md) e as [decisões do PO na #465](https://github.com/GOUOCE/GOUCE-app/issues/465). Mensagens de API vêm do código; as de interface vêm dos requisitos ou das telas.
- A confirmação substitui todas as alocações da data; cada caso deve montar o payload completo do dia.
- Nenhum caso foi executado nesta entrega. Preencher os resultados por variação, sem confundir defeito reproduzido, risco de leitura e dependência ausente.
