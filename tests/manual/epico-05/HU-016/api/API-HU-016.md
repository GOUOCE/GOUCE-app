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
| Branch de planejamento | `test/planejamento-api-ui-hu-016`, entregue em `develop` (PR #468) |
| Branch de execução | `test/execucao-api-hu-016`, criada da `develop` `7372b8d6` |
| Revisão do planejamento | 16/11/2026 — requisitos 7.6 com as decisões do PO (#465), BDD do épico 05 e leitura do código |
| Ambiente | Docker isolado `atu-api016` (API `http://localhost:8116`, PostgreSQL 15 em banco novo); `develop` `7372b8d6` (já com o front do PR #457); Alembic head `82_create_alocacao_diaria`; `America/Fortaleza` (`TZ=BRT3`); data de execução 17/11/2026. [Resumo JSON](EVIDENCIAS-HU-016.json) |
| Total de casos | 11 |
| Última execução | 17/11/2026 — 6 passaram e 5 falharam |
| Testador | LLM — execução de API; Cauan Ricardo — revisão |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Executada em 17/11/2026 | 11 | 6 | 5 | 0 | 0 | 0 |

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
| CT-HU016-API-001 | Prévia: demanda por rota, contrato e ausência de gravação | D+1 com reservas ativas de A (ida, P1), B (ida e volta, P1), C (volta, P1) e D (ida, P2), mais uma reserva cancelada e outra de outro dia; V1, V2, V3 e M1, M2, M3 ativos; GET `/alocacao-diaria/distribuicao-automatica?data=<D+1>` com administrador. | 200 com demanda real por rota e alocações sugeridas; nada gravado no banco. | ✅ PASSOU | Prévia coerente com o banco; nada gravado. BDD: demanda por rota; prévia não grava. |
| CT-HU016-API-002 | Dia sem demanda, sem motoristas e data inválida | Data sem reservas ativas; stack com todos os motoristas inativos e ao menos um ônibus ativo; datas `2026-02-30` e `16-11-2026`; parâmetro `data` ausente. | 200 vazio sem demanda; 422 sem motoristas ativos; 422 para data inválida, sem erro 500. | ✅ PASSOU | Passou; mensagem de data inexistente em inglês (observação). BDD: sem alunos; API recusa a prévia sem motoristas ativos. |

### Seção B — Capacidade e excedentes

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU016-API-003 | Sentados e em pé no limite da capacidade | Somente V1 ativo (3 assentos e 2 em pé) e um motorista; P1 na ida com 2, 3, 5 e 6 alunos, uma rodada por quantidade. | 2→2/0, 3→3/0, 5→3 sentados e 2 em pé; 6→5 alocados e 1 excedente; nunca acima da capacidade. | ✅ PASSOU | Limites de capacidade respeitados. BDD: sentados e em pé (2, 3 e 5); excedentes; RN-001. |
| CT-HU016-API-004 | Outro ônibus com assento livre antes de aluno em pé | V1 (3 assentos e 2 em pé) e V3 (4 assentos e 0 em pé) com dois motoristas e P1 na ida com 5 alunos; depois com 8 alunos; depois só V1 com 5 alunos; por fim 10 alunos para 9 lugares. | Nenhum aluno em pé enquanto outro ônibus tiver assento; em pé só sem vaga; excedentes sinalizados. | ❌ FALHOU | Aluno em pé com assento livre em outro ônibus (5 e 8 alunos). Risco de leitura: o algoritmo enche assentos e vagas em pé do primeiro ônibus antes de usar o outro. |
| CT-HU016-API-005 | Rota com faculdade sem demanda no turno | P3 Rota Multi - UECE/Católica (atende as duas IES na ida e na volta, sem IES em comum com P1/P2) com reservas só de alunos da UECE na volta; V1 e M1. | Prévia e confirmação normais, sem exigir parada na IES sem alunos. | ✅ PASSOU | P3 com demanda só da UECE na volta funciona. BDD: faculdade sem aluno no turno; AC-16. |

### Seção C — Confirmação e persistência

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU016-API-006 | Confirmar a distribuição automática e persistir | POST `/alocacao-diaria/distribuicao` com `{"data": "<D+1>", "modo": "automatico"}` para a massa do CT-001; depois nova confirmação do mesmo dia. | 201 “Distribuição realizada com sucesso”, status DISTRIBUIDO e linhas corretas; reconfirmar substitui sem duplicar. | ✅ PASSOU | Confirmação automática persiste e reconfirmar substitui. BDD: confirmar; API persiste; nova confirmação substitui. |
| CT-HU016-API-007 | Confirmar com excedentes informa a lista | V1 e M1 ativos; P1 na ida com 6 alunos (5 cabem e 1 excede); POST `modo: automatico`; depois `GET /alocacao-diaria/minha-viagem` do aluno excedente. | 201; 5 gravados; resposta informa o excedente; o aluno excedente aguarda alocação. | ❌ FALHOU | A resposta da confirmação não informa os excedentes. Risco de leitura: `persist` devolve só mensagem, data, status e alocações, sem os excedentes. BDD: excedentes na confirmação. |

### Seção D — Ajuste manual e realocação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU016-API-008 | Distribuição manual: trocar ônibus/motorista e realocar excedente | Distribuição do CT-007 confirmada; POST `modo: manual` trocando o ônibus (V1→V3) e o motorista (M1→M2) de P1; mover o excedente para um ônibus com vaga do mesmo grupo e, depois, para V2, que atende P2. | Troca aceita e persistida; excedente realocado com vaga; realocação para outra rota conforme AC-09. | ❌ FALHOU | Falhou na variação de realocar para a rota P2 (recusada); a regra será confirmada com o PO, mas o caso segue ❌ até lá. Risco de leitura: a validação exige que a alocação seja da rota da reserva e o ônibus não repete no turno. BDD: realocação; distribuição manual. |

### Seção E — Conflitos, recursos e acesso

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU016-API-009 | Capacidade e conflito de ônibus na distribuição manual | V1 (3 assentos e 2 em pé); POST manual com 6 alunos (3 sentados e 3 em pé), com 4 sentados e 0 em pé, com V1 em duas rotas no mesmo turno e com V1 na ida e na volta; prévia automática com um só ônibus e demanda de ida e de volta. | 422/409 com as mensagens do código, nada gravado; ida e volta com o mesmo ônibus aceitas. | ❌ FALHOU | Falhou na prévia com um só ônibus, que não atende a volta. Risco de leitura: na prévia automática o ônibus usado na ida não volta a ser candidato na volta. BDD: capacidade; ônibus em duas rotas; mesmo ônibus na ida e na volta. |
| CT-HU016-API-010 | Recursos e alunos inválidos e atomicidade | Ônibus, rota e motorista inexistentes ou inativos; agendamento cancelado ou de outro dia, sem o turno informado, de outra rota e repetido; lista de alocações vazia em modo manual, com uma distribuição já confirmada. | 422 com a mensagem de cada causa; qualquer recusa preserva a distribuição anterior. | ❌ FALHOU | Falhou na lista vazia no modo manual, que apaga o dia. Risco de leitura: com `alocacoes: []` o modo manual apaga as alocações da data e responde sucesso. BDD: recursos inativos; alunos inválidos; atomicidade. |
| CT-HU016-API-011 | Autenticação e perfis sem acesso | GET prévia e POST confirmação sem token, com token inválido, aluno, representante e administrador (controle). | 401 sem credencial válida; 403 para aluno e representante; administrador com acesso; nada gravado. | ✅ PASSOU | 401 e 403 corretos; nada gravado. BDD: API nega a distribuição sem perfil administrativo e sem token; RN-006. |

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

- D=18/11 (dia útil seguinte), V1, V2, V3 e M1, M2, M3 ativos. Reservas ativas: A (ida, P1, id 7), B (ida e volta, P1, id 8), C (volta, P1, id 9) e Hugo (ida, P2, id 10); a reserva da Iara foi cancelada pela API da HU-014 (id 11) e a do aluno D é de 19/11 (id 12).
- GET da prévia com o administrador: 200, com `data`, `demanda_por_rota` P1=4 e P2=1 (ida e volta somadas; a cancelada e a de outro dia ficaram de fora), `alocacoes` com `rota_id`, `onibus_id`, `motorista_id`, `turno`, `capacidade`, `sentados`, `em_pe` e `alunos` com `tipo_lugar`, `excedentes_globais` e `alertas` vazios.
- Sugestão: P1 ida em V1 (A e B sentados), P1 volta em V3 (B e C) e P2 ida em V2 (Hugo). Observação: a volta de P1 usou V3 embora V1 estivesse livre; é a regra do conjunto `usados` (relato BUG-HU016-API-003).
- `alocacao_diaria` e `alocacao_aluno` com 0 linhas antes e depois. Status: ✅ Passou.

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

- Data sem reservas (25/11): 200 com `demanda_por_rota`, `alocacoes`, `excedentes_globais` e `alertas` vazios.
- Com M1, M2, M3 (e M4) inativos e ônibus ativos: 422 `DISTRIBUICAO_INVALIDA` “Não há motoristas ativos disponíveis.”, tanto na data com demanda (18/11) quanto na sem demanda. Motoristas reativados em seguida.
- `2026-02-30`: 422 `DISTRIBUICAO_INVALIDA` com a mensagem “day is out of range for month” (texto técnico em inglês vindo da exceção do Python; sem erro 500). `16-11-2026` e parâmetro ausente: 422 de validação do FastAPI (`string_pattern_mismatch` e `missing`).
- Nada gravado. Observação para a UI/produto: a mensagem da data inexistente não é amigável nem está em português (relato BUG-HU016-API-005, baixa).
- Status: ✅ Passou.

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

- Somente V1 e M1 ativos; P1 na ida em 20/11 (reservas refeitas a cada rodada). Prévia: 2 alunos → 2 sentados e 0 em pé; 3 → 3 e 0; 5 → 3 sentados e 2 em pé; 6 → 5 alocados (3 sentados e 2 em pé) e 1 em `excedentes_globais` (turno ida).
- `capacidade` sempre 3 assentos e 2 em pé; os `tipo_lugar` somam `sentados` e `em_pe`; o ônibus nunca passa de 5. Frota devolvida ao estado base.
- Status: ✅ Passou.

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

- V1 (3+2) e V3 (4+0), M1 e M2 ativos, P1 na ida em 20/11 (uma rodada por quantidade):
  - 5 alunos: só V1 é usado, com **3 sentados e 2 em pé**, enquanto V3 fica vazio com 4 assentos livres. Esperado: ninguém em pé (RN-007). ❌
  - 8 alunos: V1 com 3 sentados e 2 em pé e V3 com 3 sentados; sobra 1 assento em V3 e 2 alunos vão em pé. Esperado: 7 sentados e 1 em pé. ❌
  - 10 alunos (9 lugares): V1 3+2 e V3 4+0, 9 alocados e 1 excedente em `excedentes_globais`. ✅ (coincide com o esperado porque tudo está cheio).
  - Só V1 com 5 alunos: 3 sentados e 2 em pé; a quantidade em pé aparece em `em_pe`, `alertas` vem vazio. ✅
- Em nenhuma rodada a capacidade foi ultrapassada. O risco de leitura se confirmou: o algoritmo enche assentos e vagas em pé do primeiro ônibus antes de usar o seguinte. Relato BUG-HU016-API-001.
- Status: ❌ Falhou (2 das 4 variações).

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

- P3 Rota Multi - UECE/Católica (UECE e Católica ida e volta) com reservas só de alunos da UECE na volta (23/11), V1 e M1 ativos.
- Prévia 200: demanda P3=2 e alocação de P3 na **volta** em V1 com os 2 alunos sentados, sem alocação de ida. Confirmação `modo: automatico` 201 “Distribuição realizada com sucesso”; banco com 1 linha em `alocacao_diaria` e 2 em `alocacao_aluno` (ALOCADO).
- Nenhuma exigência de aluno na Católica nem recusa por parada sem demanda.
- Status: ✅ Passou.

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

- Massa do CT-001 (18/11), 3 ônibus e 3 motoristas ativos. POST `modo: automatico`: 201 “Distribuição realizada com sucesso”, `status_logistico` DISTRIBUIDO, 3 alocações.
- Banco em nova conexão: 3 linhas em `alocacao_diaria` e 5 em `alocacao_aluno` (todas ALOCADO, `sentado`), idênticas à prévia (rota, ônibus, motorista, turno, agendamento e `tipo_lugar`); sem ônibus ou motorista repetido no dia/turno.
- Segunda confirmação do mesmo dia: 201, mesmas 3 e 5 linhas, conteúdo idêntico. Os 4 agendamentos continuam ATIVO.
- Status: ✅ Passou.

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

- V1 e M1 ativos, P1 na ida com 6 alunos (24/11, ids 59 a 64). POST `modo: automatico`: 201 com 5 alunos alocados (3 sentados e 2 em pé), gravados no banco.
- A resposta só traz `mensagem`, `data`, `status_logistico` e `alocacoes` (cada uma com `excedentes: []`); **não há lista de alunos excedentes** (o aluno 64 ficou de fora). Esperado: informar os excedentes (decisão do PO na #465, AC-13). ❌
- O excedente não tem linha em `alocacao_aluno`, a reserva 64 segue ATIVO e `minha-viagem` mostra `AGUARDANDO_ALOCACAO` e “Aguardando alocação do veículo”. ✅
- Relato BUG-HU016-API-002.
- Status: ❌ Falhou (1 de 3 verificações).

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

- Partindo da distribuição do CT-007 (24/11, mais a reserva do Hugo em P2, id 65):
  - Troca V1→V3 e M1→M2 em P1 (4 alunos sentados) com Hugo em V2/M3: 201, banco com a troca só na data enviada (18/11 continua com 3 e 5 linhas). ✅
  - Excedente (id 64) e o aluno 63 movidos para V1/M1 com vaga, em P1: 201; `minha-viagem` do aluno mostra ALOCADO, V1, sentado, Marcos Alfa; a lista de embarque da rota 1 passa a mostrar 6 alunos em 2 veículos. `foi_realocado` fica `false` (é a mesma rota). ✅
  - Excedente de P1 (64) enviado para V2 na alocação da rota 2 (P2): 422 `DISTRIBUICAO_INVALIDA` “alocação 2: agendamento 64 não pertence à rota 2.”, nada gravado. Esperado pelo AC-09/AC-10: admin realoca para ônibus de outra rota com vaga. ⚠️
  - Variação: os mesmos alunos em P1 usando o ônibus V2 (que era de P2) é aceita com 201, pois o ônibus não é preso a uma rota; porém o Hugo precisou trocar para V1. A realocação “para o ônibus de outra rota mantendo as duas rotas” só vale se o aluno entrar numa alocação de **outra** rota, o que a validação proíbe.
- Conforme o próprio caso, não abri defeito: registrar a regra para o PO (BUG-HU016-API-004, a confirmar).
- Status: ❌ Falhou (variação de realocar para outra rota; confirmar a regra com o PO).

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

- Distribuição base confirmada em 25/11 (V3 com 4 alunos e V2 com Hugo). Cada recusa deixou o banco idêntico à base:
  - 6 alunos em V1 (3 sentados + 3 em pé): 422 “alocação 0: capacidade total do ônibus excedida.” ✅
  - 4 sentados e 0 em pé em V1: 422 “alocação 0: capacidade de assentos ou em pé excedida.” ✅
  - V1 em duas rotas no mesmo turno: 409 “alocação 1: ônibus ABC1D23 conflitante no turno ida.”; mesma regra com V3 na terceira alocação: 409 “alocação 2: ...”. ✅
  - V1 na ida e na volta (aluno B): 201 e as duas linhas gravadas com o mesmo ônibus. ✅
- Prévia automática com um só ônibus (V1/M1) e demanda de ida (A, C, B) e de volta (B): 200 com V1 só na ida (3 alunos) e **a volta inteira em `excedentes_globais`** (agendamento 75, turno volta). Esperado: V1 atende também a volta. ❌ O risco de leitura (`usados` único para ida e volta) se confirmou. Relato BUG-HU016-API-003.
- Status: ❌ Falhou (1 de 5 variações: a prévia com um só ônibus).

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

- Distribuição base em 26/11. Cada recusa abaixo respondeu 422 com a mensagem do código e deixou o banco idêntico à base:
  - ônibus inexistente e inativo (V4): “alocação 0: ônibus … inexistente ou inativo.”; rota inexistente e rota inativa (P3 inativada pela API): “alocação 0: rota inexistente ou inativa.”; motorista inexistente e inativo (M4): “alocação 0: motorista inexistente ou inativo.” ✅
  - agendamento cancelado e de outro dia: “alocação 0: agendamento N não está ativo nessa data.”; sem o turno volta: “não usa o turno volta.”; de outra rota: “não pertence à rota 2.”; repetido em duas alocações: “alocação 1: agendamento 76 alocado mais de uma vez.” (e na mesma alocação: “alocação 0: ...”); inexistente: “não está ativo nessa data.” ✅
  - `tipo_lugar` e `turno` inválidos: 422 de validação do FastAPI, banco intacto. ✅
- `modo: manual` com `alocacoes: []` (e sem o campo): **201 “Distribuição realizada com sucesso” e a distribuição do dia foi apagada** (0 linhas). Esperado (inferido de RNF-012): não apagar. ❌ Relato BUG-HU016-API-004.
- Status: ❌ Falhou (variação da lista vazia; o esperado é inferido e deve ser confirmado com o PO, mas o caso segue ❌ até lá).

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

- GET e POST sem token: 401 “Não autenticado”; token inválido: 401 “Sessão inválida ou expirada”; aluno e representante (UFC): 403 “Acesso negado”, sem dados de alocação; o aluno pendente (que consegue logar, HU-003) também recebe 403.
- Contagem das alocações de 18/11 e total igual antes e depois dos negados (3 e 5 linhas). Administrador: GET 200 e POST 201.
- Status: ✅ Passou.

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

Relatos em [`issues/`](issues/). Publicados como issues no GitHub. As decisões do PO dos relatos 004 e 005 estão pendentes na [#473](https://github.com/GOUOCE/GOUCE-app/issues/473); seguimos a recomendação como regra provisória.

| Caso | Defeito | Relato / issue |
| --- | --- | --- |
| CT-HU016-API-004 | A prévia coloca aluno em pé enquanto outro ônibus tem assento livre (5 e 8 alunos) | [BUG-HU016-API-001](issues/BUG-HU016-API-001-aluno-em-pe-com-assento-livre.md) — [#474](https://github.com/GOUOCE/GOUCE-app/issues/474) |
| CT-HU016-API-007 | A confirmação com excedentes não informa a lista de excedentes | [BUG-HU016-API-002](issues/BUG-HU016-API-002-confirmacao-nao-informa-excedentes.md) — [#475](https://github.com/GOUOCE/GOUCE-app/issues/475) |
| CT-HU016-API-009 | A prévia com um só ônibus não atende a volta (vira excedente) | [BUG-HU016-API-003](issues/BUG-HU016-API-003-previa-nao-reaproveita-onibus-na-volta.md) — [#476](https://github.com/GOUOCE/GOUCE-app/issues/476) |
| CT-HU016-API-010 | Distribuição manual com lista vazia apaga a distribuição do dia | [BUG-HU016-API-004](issues/BUG-HU016-API-004-lista-vazia-apaga-distribuicao.md) — [#477](https://github.com/GOUOCE/GOUCE-app/issues/477) |
| CT-HU016-API-008 | Realocar excedente para a rota de outro ônibus é recusado (decisão pendente do PO, #473) | [BUG-HU016-API-005](issues/BUG-HU016-API-005-realocacao-entre-rotas-recusada.md) — [#478](https://github.com/GOUOCE/GOUCE-app/issues/478) |
| CT-HU016-API-002 | Data inexistente (`2026-02-30`) responde com mensagem técnica em inglês | [BUG-HU016-API-006](issues/BUG-HU016-API-006-mensagem-data-inexistente-em-ingles.md) — [#479](https://github.com/GOUOCE/GOUCE-app/issues/479) |

## Observações gerais

- Referências: [requisitos, seção 7.6](../../../../../docs/requisitos.md), [BDD do épico 05](../../../../../bdd/features/epico-05/README.md) e as [decisões do PO na #465](https://github.com/GOUOCE/GOUCE-app/issues/465). Mensagens de API vêm do código; as de interface vêm dos requisitos ou das telas.
- A confirmação substitui todas as alocações da data; cada caso deve montar o payload completo do dia.
- Execução de 17/11/2026 pela LLM, por HTTP e com conferência no banco em nova conexão, em stack isolada. A massa foi montada pela API (IES, rotas P1/P2/P3, frota, motoristas, alunos aprovados e representantes) e as reservas pela API da HU-013; entre as rodadas de um mesmo caso, as linhas de reserva e de alocação da data foram limpas direto no banco e a frota devolvida ao estado base.
- Os riscos de leitura de capacidade (CT-004), excedentes (CT-007), realocação (CT-008), um só ônibus (CT-009) e lista vazia (CT-010) foram reproduzidos por HTTP; os demais riscos não se confirmaram nos casos da API.
- Aluno com cadastro pendente consegue autenticar (comportamento da HU-003, fora do escopo) e recebe 403 nesta API.
