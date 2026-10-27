# Testes manuais de API — HU-012 — Gerenciamento de Rotas Complementares

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Gestão de Rotas e Horários (EP-003) |
| Funcionalidade | HU-012 — Gerenciamento de Rotas Complementares |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial (baseada em risco) |
| Endpoints | `GET /rotas-complementares`, `GET /rotas-complementares/opcoes`, `GET /rotas-complementares/{id}`, `POST /rotas-complementares`, `PATCH /rotas-complementares/{id}`, `PATCH /rotas-complementares/{id}/inativar` e `PATCH /rotas-complementares/{id}/reativar` — `application/json`. Corpo: `{"nome": "...", "horario_saida": "HH:MM", "ponto_conexao": "...", "rota_principal_id": 1}` |
| Ambiente | HTTP local `http://127.0.0.1:18812`; PostgreSQL 15/MinIO QA isolados; branch `feat/front-hu012`, aplicação `23d1063f09f13cc195da7e45422581f73e2ae6da`; plano `939921e3` |
| Total de casos | 13 |
| Última execução | 2026-10-27 — HTTP real com evidências JSON e consultas ao PostgreSQL |
| Testador | Cauan Ricardo — execução com apoio do Codex |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ⏳ Em execução | 13 | 6 | 2 | 1 | 0 | 4 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API e banco disponíveis em **stack isolada com banco limpo** (ver [README](README.md)). Usar Postman, Insomnia ou Swagger em `/docs`. |
| PC-02 | Token do **administrador A** (executor): `POST /auth/login` com o administrador padrão do seed. Anotar o `id` dele para conferir a auditoria. |
| PC-03 | Token de um **aluno aprovado e ativo** e de um **representante ativo**, para o CT-012. Se o login do representante não funcionar, executar só o aluno e marcar a outra parte como 🚫. |
| PC-04 | Acesso de leitura ao banco: tabelas `rota_complementar`, `rota_principal` e `log_auditoria`. |
| PC-05 | Rotas principais preparadas pela IA via `POST /rotas-principais` antes do CT-001 (anotar os ids): **RP1 Rota Centro - UFC** (06:30/17:30) e **RP2 Rota Campo Velho - IFCE** (06:40/18:00) ativas; **RP0 Rota Antiga** criada e inativada. |
| PC-06 | Massa de complementares criada pela própria suíte: **RC1 Van 2 - Bairro Novo** e **RC2 Van 5 - Trevo da BR** (CT-002); **RC3 Van Sítio** (CT-008, para a reativação). |
| PC-07 | Agendamento de alunos (HU-013) **não existe** na base analisada: o CT-013 fica 🚫 até a agenda estar na `develop`. |

## Resumo da execução

Executar na ordem abaixo. São **13 casos essenciais**. Todas as chamadas usam o token do administrador A, exceto onde indicado; itens que dependem de um caso posterior trazem essa indicação no próprio caso. As regras marcadas com **#208** vêm das decisões do PO na [issue #208](https://github.com/GOUOCE/GOUCE-app/issues/208).

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU012-API-001 | Listar, filtrar e consultar complementares | Sem filtro; `incluir_inativos=true`; `nome`; `rota_principal_id`; `GET /{id}`; `/opcoes` | HTTP 200; padrão só ativas; filtros respeitados; opções só com principais ativas | ✅ APROVADO | Lista vazia 200/[]; padrão só ativas, filtro de inativos, nome e principal conferidos; filtro com id 0 retornou 422. Consultas ativa/inativa e 404 conferidos; /opcoes só oferece RP1/RP2 ativas. [JSON](evidencias/CT-HU012-API-001.json) |
| CT-HU012-API-002 | Cadastrar rota complementar válida | RC1 ligada a RP1; RC2 ligada a RP2, com espaços nas pontas | HTTP 201 “Operação realizada com sucesso”; ativa; vínculo e dados corretos | ✅ APROVADO | RC1/RC2 criadas ativas, nome/ponto normalizados e vínculos persistidos; GET e PostgreSQL conferidos. As principais não foram alteradas. [JSON](evidencias/CT-HU012-API-002.json) |
| CT-HU012-API-003 | Horário de retorno da complementar (#208) | `horario_saida` e `horario_retorno`; retorno igual e anterior à saída | Retorno aceito e gravado; retorno ≤ saída recusado com 422 | ❌ FALHOU | Cadastro com retorno 17:40 e edição de retorno 17:45 retornaram 422/Campo não permitido., em vez de 201/200. Retorno igual/anterior também cai no erro de campo desconhecido; consulta não devolve horario_retorno. [JSON](evidencias/CT-HU012-API-003.json) [#310](https://github.com/GOUOCE/GOUCE-app/issues/310) |
| CT-HU012-API-004 | Nome único entre todas as rotas (#208) | Nome de RC1 com variações; de complementar inativa; de rota principal; edição para nome em uso | HTTP 409; nada criado nem alterado | ❌ FALHOU | Duplicidade dentro das complementares funcionou, inclusive case/trim e inativa. Porém, cadastrar complementar Rota Centro - UFC, nome de uma principal existente, retornou 201; esperado 409. O registro indevido foi inativado via API após preservar a evidência. [JSON](evidencias/CT-HU012-API-004.json) [#309](https://github.com/GOUOCE/GOUCE-app/issues/309) |
| CT-HU012-API-005 | Obrigatórios, formato e limites | Sem cada campo; em branco; 151 caracteres; horário fora de `HH:MM`; edição com `null` | HTTP 422 com campo e mensagem em português; nada gravado | ✅ APROVADO | Obrigatórios, corpo vazio, campos em branco, 151 caracteres, horários inválidos e edição com null foram recusados com 422/campo/mensagem. Controles de 150 aceitos, persistidos e depois inativados via API. [JSON](evidencias/CT-HU012-API-005.json) |
| CT-HU012-API-006 | Vínculo com rota principal inativa ou inexistente | RP0 inativa; id inexistente; id `0`, negativo e texto; cadastro e edição | HTTP 422 no `rota_principal_id`; nenhum vínculo inválido | ✅ APROVADO | Principal inativa/inexistente e IDs zero/negativo/string recusados com 422; edição com nome + vínculo inválido não aplicou nenhuma alteração. [JSON](evidencias/CT-HU012-API-006.json) |
| CT-HU012-API-007 | Editar dados e trocar a rota principal | RC1: só nome; horário e ponto; trocar para RP2; `{}`; campo `ativo`; id inexistente | HTTP 200 no mesmo id; 422 sem campo ou com campo extra; 404 inexistente | ✅ APROVADO | Nome, horário/ponto e troca de principal refletidos no mesmo id e no filtro; corpo vazio/ativo retornaram 422 e inexistente 404. Vínculo restaurado a RP1. [JSON](evidencias/CT-HU012-API-007.json) |
| CT-HU012-API-008 | Inativar e reativar (soft delete) | RC3: inativar, repetir, reativar, repetir; id inexistente | HTTP 200 nas válidas; registro mantido; 409 nas repetidas; 404 | ✅ APROVADO | Inativar/reativar 200, repetições 409, inexistente 404; linha preservada. RC3 foi deixada inativa para os casos dependentes e reativada no CT-010. [JSON](evidencias/CT-HU012-API-008.json) |
| CT-HU012-API-009 | Complementar ativa protege a principal | RP2 com RC2 ativa; trocar RC2 para RP1; inativar RP2 | Com RC2 ativa, 409; depois de trocar o vínculo, 200 | ⚠️ PARCIAL | Principal com RC2 ativa foi protegida com 409; depois de trocar RC2 para RP1, RP2 pôde ser inativada mesmo com RC3 inativa. Mensagem de bloqueio diverge da #208; mesma causa do CT-HU011-API-010. [JSON](evidencias/CT-HU012-API-009.json) [#311](https://github.com/GOUOCE/GOUCE-app/issues/311) |
| CT-HU012-API-010 | Reativar complementar com principal inativa (#208) | RC3 inativa ligada a RP2; RP2 inativada; reativar RC3; trocar para RP1 e reativar | HTTP 409 com a mensagem do PO; depois de trocar o vínculo, 200 | ⏳ PENDENTE | Não executado. |
| CT-HU012-API-011 | Auditoria das operações de escrita | Operações dos CT-002, 007 e 008; recusas dos CT-004 a 009 | Um registro por escrita efetiva; nenhum para recusa ou edição sem mudança | ⏳ PENDENTE | Não executado. |
| CT-HU012-API-012 | Acesso sem privilégio | Token de aluno; token de representante; sem token | HTTP 403 (aluno e representante) e 401 (sem token) em todas as rotas | ⏳ PENDENTE | Não executado. |
| CT-HU012-API-013 | Agendamentos futuros e complementar inativa no agendamento | Complementar com aluno agendado para amanhã; complementar inativa na agenda | HTTP 409 “Esta rota possui agendamentos pendentes e não pode ser inativada no momento.”; inativa fora da agenda | ⏳ PENDENTE | Depende da HU-013. Sem ela, marcar 🚫. |

## Detalhamento dos casos

### CT-HU012-API-001 — Listar, filtrar e consultar complementares

**Dados de entrada:** `GET /rotas-complementares`; `?incluir_inativos=true`; `?nome=van` e `?nome=VAN 2`; `?rota_principal_id={RP1}`; `?rota_principal_id=0`; `GET /rotas-complementares/{id}` de RC1, de RC3 inativa e de id `999999`; `GET /rotas-complementares/opcoes`.

**Passos**

1. Antes do CT-002, enviar `GET /rotas-complementares` com o banco sem complementares.
2. Executar de novo depois do CT-008 (RC3 inativa) e enviar as demais chamadas.

**Resultado esperado**

- Banco sem complementares: HTTP `200` com lista vazia `[]`.
- Sem filtro: só **ativas**, cada uma com `id`, `nome`, `horario_saida`, `ponto_conexao`, `ativo` e `rota_principal` (`id`, `nome`, `ativo`) (AC-01).
- `incluir_inativos=true`: ativas e inativas, com `ativo` indicando o estado (AC-09).
- `nome` filtra por parte do nome sem diferenciar maiúsculas; `rota_principal_id` traz só as complementares daquela principal; `rota_principal_id=0`: HTTP `422` “Informe um ID de rota principal válido.”
- `GET /{id}` devolve a ativa ou inativa; id inexistente: HTTP `404` “Rota complementar não encontrada.”
- `/opcoes` lista só **rotas principais ativas** (RP1 e RP2; RP0 ausente), com nome e horários (AC-03, FA-002).

**Resultado obtido**

- Lista vazia 200/[]; padrão só ativas, filtro de inativos, nome e principal conferidos; filtro com id 0 retornou 422. Consultas ativa/inativa e 404 conferidos; /opcoes só oferece RP1/RP2 ativas.
- 11 chamadas HTTP; 22 verificações registradas. Status observados: 200 (9×), 404 (1×), 422 (1×).
- Evidência: [CT-HU012-API-001.json](evidencias/CT-HU012-API-001.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Status: ✅ APROVADO.

---

### CT-HU012-API-002 — Cadastrar rota complementar válida

**Dados de entrada:**

1. RC1: `{"nome": "Van 2 - Bairro Novo", "horario_saida": "06:00", "ponto_conexao": "Trevo do Bairro Novo", "rota_principal_id": RP1}`.
2. RC2: `{"nome": "  Van 5 - Trevo da BR ", "horario_saida": "06:10", "ponto_conexao": "  Posto da BR-122 ", "rota_principal_id": RP2}`.

**Passos**

1. Enviar `POST /rotas-complementares` com cada corpo e anotar os ids.
2. Conferir em `GET /rotas-complementares/{id}` e pedir à IA para conferir a linha em `rota_complementar`.

**Resultado esperado**

- HTTP `201` com `success: true`, `message` “Operação realizada com sucesso” e a rota em `data` (AC-02, AC-07).
- Criadas **ativas**, com nome e ponto de conexão sem os espaços das pontas e o horário em `HH:MM`.
- `rota_principal` aponta para a principal enviada; a rota principal não é alterada.

**Resultado obtido**

- RC1/RC2 criadas ativas, nome/ponto normalizados e vínculos persistidos; GET e PostgreSQL conferidos. As principais não foram alteradas.
- 4 chamadas HTTP; 17 verificações registradas. Status observados: 200 (2×), 201 (2×).
- Evidência: [CT-HU012-API-002.json](evidencias/CT-HU012-API-002.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Status: ✅ APROVADO.

---

### CT-HU012-API-003 — Horário de retorno da complementar (#208)

**Dados de entrada:**

1. Cadastro `Van Retorno` ligado a RP1, com `"horario_saida": "06:00"` e `"horario_retorno": "17:40"`.
2. O mesmo com retorno `06:00` (igual) e `05:30` (anterior).
3. Edição de RC1 com `{"horario_retorno": "17:45"}`.

**Passos**

1. Enviar cada chamada e conferir em `GET /rotas-complementares/{id}`.

**Resultado esperado**

- Cada complementar tem **1 ponto de conexão, 1 horário de saída (ida) e 1 horário de retorno (volta)** (#208, item 4), porque o aluno pode usar a complementar na ida e na volta (HU-013, CA 6 e CA 9).
- Item 1 e item 3: HTTP `201` / `200`, com `horario_retorno` gravado e devolvido na consulta.
- Item 2: HTTP `422` no `horario_retorno`: o retorno precisa ser **depois** da saída (#208, item 2a).
- Se a API recusar o campo `horario_retorno` (“Campo não permitido.”), registrar ❌: a complementar não guarda o horário da volta.

**Resultado obtido**

- Cadastro com retorno 17:40 e edição de retorno 17:45 retornaram 422/Campo não permitido., em vez de 201/200. Retorno igual/anterior também cai no erro de campo desconhecido; consulta não devolve horario_retorno.
- 5 chamadas HTTP; 21 verificações registradas. Status observados: 200 (1×), 422 (4×).
- Evidência: [CT-HU012-API-003.json](evidencias/CT-HU012-API-003.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Defeito(s): [#310](https://github.com/GOUOCE/GOUCE-app/issues/310).
- Status: ❌ FALHOU.

---

### CT-HU012-API-004 — Nome único entre todas as rotas (#208)

**Dados de entrada:**

1. Cadastro com o nome `Van 2 - Bairro Novo` (igual a RC1), com `van 2 - bairro novo` e com `"  VAN 2 - BAIRRO NOVO "`.
2. Depois do CT-008: cadastro com o nome de RC3 inativa (`Van Sítio`).
3. Cadastro com o nome `Rota Centro - UFC` (nome de RP1).
4. Edição de RC2 com `{"nome": "Van 2 - Bairro Novo"}`; edição de RC1 com o próprio nome.

**Passos**

1. Enviar cada chamada.
2. Pedir à IA para conferir que nenhuma complementar nova foi criada e que RC2 manteve o nome.

**Resultado esperado**

- Itens 1, 2 e edição de RC2: HTTP `409` com `error.code` `CONFLICT` e “Já existe uma rota complementar com este nome.” Comparação **sem diferenciar maiúsculas, sem os espaços das pontas e contra ativas e inativas** (#208, item 1).
- Item 3: HTTP `409`. O nome é único **entre rotas principais e complementares** (#208, item 1).
- Edição de RC1 com o próprio nome: HTTP `200`.
- Nenhuma complementar nova; RC2 mantém o nome.

**Resultado obtido**

- Duplicidade dentro das complementares funcionou, inclusive case/trim e inativa. Porém, cadastrar complementar Rota Centro - UFC, nome de uma principal existente, retornou 201; esperado 409. O registro indevido foi inativado via API após preservar a evidência.
- 8 chamadas HTTP; 23 verificações registradas. Status observados: 200 (2×), 201 (1×), 409 (5×).
- Evidência: [CT-HU012-API-004.json](evidencias/CT-HU012-API-004.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Defeito(s): [#309](https://github.com/GOUOCE/GOUCE-app/issues/309).
- Status: ❌ FALHOU.

---

### CT-HU012-API-005 — Obrigatórios, formato e limites

**Dados de entrada:** a partir do corpo válido de RC1, com outro nome:

1. Sem `nome`; sem `horario_saida`; sem `ponto_conexao`; sem `rota_principal_id`; corpo `{}`.
2. `nome` `"   "` e `ponto_conexao` `"   "`.
3. `nome` e `ponto_conexao` com 150 caracteres (controle) e com 151.
4. `horario_saida` `6:00`, `24:00`, `06:60` e `manhã`.
5. Edição de RC1 com `{"ponto_conexao": null}` e com `{"rota_principal_id": null}`.

**Passos**

1. Enviar cada variação, uma por vez.
2. Pedir à IA para conferir que nada foi criado e que RC1 não mudou.

**Resultado esperado**

- HTTP `422` com `error.code` `REQUEST_VALIDATION_ERROR` e `error.details` indicando o campo, com mensagens em português (AC-08, FA-003):
  - “Nome da rota complementar é obrigatório.”, “Horário de saída é obrigatório.”, “Ponto de conexão é obrigatório.” e “Rota principal vinculada é obrigatória.”;
  - 151 caracteres: “… deve ter no máximo 150 caracteres.”;
  - horário inválido: “Horário deve estar no formato HH:MM.”
- Corpo `{}`: um erro para cada campo obrigatório, sem erro interno.
- 150 caracteres: HTTP `201`.
- Edição com `null`: HTTP `422`; RC1 não muda.

**Resultado obtido**

- Obrigatórios, corpo vazio, campos em branco, 151 caracteres, horários inválidos e edição com null foram recusados com 422/campo/mensagem. Controles de 150 aceitos, persistidos e depois inativados via API.
- 19 chamadas HTTP; 89 verificações registradas. Status observados: 200 (2×), 201 (2×), 422 (15×).
- Evidência: [CT-HU012-API-005.json](evidencias/CT-HU012-API-005.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Status: ✅ APROVADO.

---

### CT-HU012-API-006 — Vínculo com rota principal inativa ou inexistente

**Dados de entrada:**

1. Cadastro com `rota_principal_id` igual a RP0 (inativa) e igual a `999999`.
2. Cadastro com `rota_principal_id` `0`, `-1` e `"1"`.
3. Edição de RC1 com `{"nome": "Van 2 - Editada", "rota_principal_id": RP0}`.

**Passos**

1. Enviar cada chamada.
2. Pedir à IA para conferir que nenhuma complementar ficou ligada a RP0 e que RC1 manteve nome e vínculo.

**Resultado esperado**

- Item 1: HTTP `422` no `rota_principal_id`, com “Rota principal inativa ou inexistente.” (AC-03, FA-002, RNF-012).
- Item 2: HTTP `422` com “Informe um ID de rota principal válido.”
- Item 3: HTTP `422`; **nada** da edição é aplicado (nem o nome).
- Nenhum erro `500`.

**Resultado obtido**

- Principal inativa/inexistente e IDs zero/negativo/string recusados com 422; edição com nome + vínculo inválido não aplicou nenhuma alteração.
- 7 chamadas HTTP; 36 verificações registradas. Status observados: 200 (1×), 422 (6×).
- Evidência: [CT-HU012-API-006.json](evidencias/CT-HU012-API-006.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Status: ✅ APROVADO.

---

### CT-HU012-API-007 — Editar dados e trocar a rota principal

**Dados de entrada:** em RC1:

1. `{"nome": "Van 2 - Bairro Novo Manhã"}`.
2. `{"horario_saida": "05:50", "ponto_conexao": "Praça do Bairro Novo"}`.
3. `{"rota_principal_id": RP2}` e depois `{"rota_principal_id": RP1}`.
4. `{}`.
5. `{"ativo": false}`.
6. `PATCH /rotas-complementares/999999` com `{"nome": "Qualquer"}`.

**Passos**

1. Enviar cada edição e conferir em `GET /rotas-complementares/{id}`.
2. Conferir `GET /rotas-complementares?rota_principal_id={RP2}` depois da troca.

**Resultado esperado**

- Itens 1 a 3: HTTP `200` “Operação realizada com sucesso”, no **mesmo id** (AC-04, AC-07). Só os campos enviados mudam; a troca de principal aparece no filtro por `rota_principal_id`.
- Item 4: HTTP `422` “Informe ao menos um campo para atualização.”
- Item 5: HTTP `422` “Campo não permitido.”; a complementar continua ativa.
- Item 6: HTTP `404` “Rota complementar não encontrada.”

**Resultado obtido**

- Nome, horário/ponto e troca de principal refletidos no mesmo id e no filtro; corpo vazio/ativo retornaram 422 e inexistente 404. Vínculo restaurado a RP1.
- 12 chamadas HTTP; 41 verificações registradas. Status observados: 200 (9×), 404 (1×), 422 (2×).
- Evidência: [CT-HU012-API-007.json](evidencias/CT-HU012-API-007.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Status: ✅ APROVADO.

---

### CT-HU012-API-008 — Inativar e reativar (soft delete)

**Dados de entrada:** criar RC3 `{"nome": "Van Sítio", "horario_saida": "05:40", "ponto_conexao": "Entrada do Sítio Riacho", "rota_principal_id": RP2}`. Depois: `PATCH /rotas-complementares/{RC3}/inativar` duas vezes; `PATCH /rotas-complementares/{RC3}/reativar` duas vezes; `PATCH /rotas-complementares/999999/inativar`.

**Passos**

1. Inativar RC3 e conferir a listagem sem filtro e com `incluir_inativos=true`.
2. Pedir à IA para conferir que a linha continua no banco.
3. Repetir a inativação; reativar; repetir a reativação.
4. Ao final, deixar RC3 **inativa** para os CT-001, CT-004 e CT-010.

**Resultado esperado**

- Inativar e reativar: HTTP `200` “Operação realizada com sucesso”, com `data.ativo` `false` / `true` (AC-05, AC-07).
- Inativa sai da listagem padrão e aparece com `incluir_inativos=true` (AC-09); linha mantida no banco (soft delete).
- Repetição: HTTP `409` “Rota complementar já está inativa.” / “Rota complementar já está ativa.”, sem nova auditoria.
- Id inexistente: HTTP `404` “Rota complementar não encontrada.”

**Resultado obtido**

- Inativar/reativar 200, repetições 409, inexistente 404; linha preservada. RC3 foi deixada inativa para os casos dependentes e reativada no CT-010.
- 7 chamadas HTTP; 16 verificações registradas. Status observados: 200 (3×), 201 (1×), 404 (1×), 409 (2×).
- Evidência: [CT-HU012-API-008.json](evidencias/CT-HU012-API-008.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Status: ✅ APROVADO.

---

### CT-HU012-API-009 — Complementar ativa protege a principal

**Dados de entrada:** RP2 com RC2 ativa: `PATCH /rotas-principais/{RP2}/inativar`; `PATCH /rotas-complementares/{RC2}` com `{"rota_principal_id": RP1}`; de novo `PATCH /rotas-principais/{RP2}/inativar` (RC3 inativa não conta); reativar RP2.

**Passos**

1. Enviar as chamadas na ordem e conferir o status de RP2 depois de cada uma.

**Resultado esperado**

- Com RC2 ativa ligada a RP2: HTTP `409` com “Esta rota possui rotas complementares ativas vinculadas. Inative ou desvincule as rotas complementares antes de continuar.” (#208, item 5). RP2 continua ativa.
- Depois de trocar RC2 para RP1: HTTP `200`. Uma complementar **inativa** (RC3) não impede a inativação da principal.
- A mensagem é conferida em detalhe no CT-HU011-API-010; aqui o foco é o efeito da troca de vínculo.

**Resultado obtido**

- Principal com RC2 ativa foi protegida com 409; depois de trocar RC2 para RP1, RP2 pôde ser inativada mesmo com RC3 inativa. Mensagem de bloqueio diverge da #208; mesma causa do CT-HU011-API-010.
- 4 chamadas HTTP; 8 verificações registradas. Status observados: 200 (3×), 409 (1×).
- Evidência: [CT-HU012-API-009.json](evidencias/CT-HU012-API-009.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Defeito(s): [#311](https://github.com/GOUOCE/GOUCE-app/issues/311).
- Status: ⚠️ PARCIAL.

---

### CT-HU012-API-010 — Reativar complementar com principal inativa (#208)

**Dados de entrada:** RC3 inativa ligada a RP2. RC2 já foi trocada para RP1 no CT-009, então RP2 não tem complementar ativa. Depois: `PATCH /rotas-principais/{RP2}/inativar`; `PATCH /rotas-complementares/{RC3}/reativar`; `PATCH /rotas-complementares/{RC3}` com `{"rota_principal_id": RP1}`; reativar RC3 de novo.

**Passos**

1. Inativar RP2 e tentar reativar RC3.
2. Trocar o vínculo de RC3 para RP1 (complementar inativa pode ser editada) e reativar.
3. Ao final, reativar RP2.

**Resultado esperado**

- Reativação com RP2 inativa: HTTP `409` com a mensagem definida pelo PO: “Não é possível reativar esta rota complementar pois a rota principal vinculada está inativa.” (#208, item 6). RC3 continua inativa.
- Troca de vínculo para RP1: HTTP `200`; reativação depois disso: HTTP `200`.
- Registrar o texto exato: se o bloqueio acontecer com outro texto, o caso é ⚠️ (regra certa, mensagem diferente da decisão).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU012-API-011 — Auditoria das operações de escrita

**Dados de entrada:** operações efetivas dos CT-002 (cadastro), CT-007 (edições) e CT-008 (inativação e reativação); recusas dos CT-004 a CT-010; edição de RC1 reenviando o mesmo nome.

**Passos**

1. Pedir à IA para consultar `log_auditoria` com `entidade = 'rota_complementar'` no intervalo da execução.
2. Relacionar cada operação efetiva com um registro.
3. Enviar a edição sem mudança e consultar de novo.

**Resultado esperado**

- Um registro por cadastro, edição, inativação e reativação efetiva, com o `id` do administrador A, a ação, o id da complementar e a data/hora (AC-05, RNF-013).
- A troca de rota principal aparece no valor anterior e no novo da edição.
- Nenhum registro para operação recusada nem para edição que não muda nada.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU012-API-012 — Acesso sem privilégio

**Dados de entrada:** as sete rotas da HU com o token do aluno, com o token do representante e sem o cabeçalho `Authorization`. Corpo válido e alvo RC1 nas escritas.

**Passos**

1. Enviar cada chamada com cada credencial.
2. Pedir à IA para conferir que RC1 não mudou e que não há auditoria nova.

**Resultado esperado**

- Aluno e representante: HTTP `403` em todas as rotas, inclusive as de leitura e `/opcoes` (RN-006).
- Sem token: HTTP `401`.
- Nenhuma complementar criada, editada ou com status alterado.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU012-API-013 — Agendamentos futuros e complementar inativa no agendamento

**Dados de entrada:** complementar A com aluno agendado para amanhã; complementar B só com agendamento passado; complementar C inativa.

**Passos**

1. Conferir se a HU-013 (agendamento) está na `develop`. Se não estiver, marcar 🚫 e não preparar agenda pelo banco.
2. Com a agenda disponível: tentar inativar A e B.
3. Consultar as opções de agendamento do aluno (ida e volta) e procurar a complementar C.

**Resultado esperado**

- Complementar A: HTTP `409` “Esta rota possui agendamentos pendentes e não pode ser inativada no momento.”; continua ativa (AC-06, FA-001).
- Complementar B: HTTP `200`.
- Complementar C não aparece nas opções de novo agendamento; agendamentos antigos continuam no histórico (#208, item 8; RN-004).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 — listagem de ativas | Visualiza as complementares ativas com horário e ponto de conexão | CT-001 |
| AC-02 — cadastro ligado a uma principal | Cadastra rota complementar | CT-002 |
| AC-03 / FA-002 — só principal ativa | Não oferece rota principal inativa | CT-001 (`/opcoes`), CT-006 |
| AC-04 — edição | Edita dados e rota principal vinculada | CT-007 |
| AC-05 — inativar e reativar (soft delete) | Inativa; reativa; registro permanece | CT-008 |
| AC-06 / FA-001 — agendamentos futuros | Bloqueia inativação com alunos agendados | CT-013 (depende da HU-013) |
| AC-07 — mensagem de sucesso | Cenários de sucesso | CT-002, CT-007, CT-008 |
| AC-08 / FA-003 — obrigatórios | Cadastro sem obrigatório; edição esvaziando | CT-005 |
| AC-09 — inativas | Mostrar inativos | CT-001, CT-008 |
| AC-05 / RNF-013 — auditoria | Registra cada operação de escrita | CT-011 |
| #208 item 1 — nome único | — (decisão do PO) | CT-004 |
| #208 item 2 e 4 — saída, retorno e ponto únicos | — (decisão do PO) | CT-003, CT-005 |
| #208 item 5 — principal com complementar ativa | — (decisão do PO) | CT-009 |
| #208 item 6 — reativar com principal inativa | — (decisão do PO) | CT-010 |
| #208 item 8 / RN-004 — inativa fora do agendamento | Inativa fora do agendamento do aluno | CT-013 (depende da HU-013) |
| RN-006 — exclusividade administrativa | API nega gestão a outros perfis | CT-012 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Referências: [HU-012, seção 7.4.2](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-03/HU-012.feature), [decisões do PO (#208)](https://github.com/GOUOCE/GOUCE-app/issues/208) e [suíte de UI](../ui/UI-HU-012.md).
- **O que mudou desde o planejamento anterior** (base `5554bc90`, 24/10/2026): o PO respondeu a #208 (nome único entre todas as rotas, um ponto e um par saída/retorno, bloqueio da reativação com principal inativa, mensagens definidas); os requisitos passaram a exigir o nome e a chave “Mostrar inativos”; e o backend de rotas complementares entrou na `develop`.
- **Riscos mapeados no código** (backend em `backend/src/modulos/rotas/`, `develop` `7c3d72d8`), que orientaram a escolha dos casos:
  - a tabela `rota_complementar` e o DTO têm **só `horario_saida`**; não há horário de retorno, que o item 4 da #208 exige. Como o DTO recusa campos extras, o `horario_retorno` deve voltar 422 (CT-003);
  - o nome é conferido só entre **complementares**; uma complementar com o nome de uma principal é aceita (CT-004);
  - a mensagem da reativação bloqueada é “A rota principal vinculada está inativa. Reative-a ou altere o vínculo antes.”, diferente do texto do PO (CT-010);
  - a checagem de agendamentos futuros sempre responde “sem agendamentos” até a HU-013 existir (`TODO(HU-013)`): o bloqueio do AC-06 nunca dispara hoje (CT-013);
  - a edição de complementar **inativa** permite trocar a principal, o que é o caminho para reativá-la quando a principal original está inativa (CT-010).
- O ponto de conexão é texto livre (até 150 caracteres), sem ligação com os pontos de parada da HU-007.
- Ao final, deixar RP1 e RP2 ativas, RP0 inativa e RC1, RC2 e RC3 ativas, sem apagar registros.
- Ocultar senhas e tokens nas evidências.
