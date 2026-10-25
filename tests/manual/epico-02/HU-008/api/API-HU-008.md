# Testes manuais de API — HU-008 — Gerenciamento de Faculdades

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Gestão de Cadastros Base (EP-002) |
| Funcionalidade | HU-008 — Gerenciamento de Faculdades |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial (baseada em risco) |
| Endpoints | `GET /faculdades`, `GET /faculdades/{id}`, `POST /faculdades`, `PATCH /faculdades/{id}`, `PATCH /faculdades/{id}/inativar` e `PATCH /faculdades/{id}/ativar` — `application/json`. Corpo: `{"nome_faculdade": "...", "campus_faculdade": "...", "sigla": "..."}` (a API também aceita `nome` e `campus`; `sigla` é opcional) |
| Ambiente | A preencher — URL, branch e commit testados |
| Total de casos | 12 |
| Última execução | Não realizada |
| Testador | Cauan Ricardo — execução com apoio de IA (Claude Code) |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 12 | 0 | 0 | 0 | 0 | 12 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API e banco disponíveis, de preferência em **stack isolada com banco limpo**. Usar Postman, Insomnia ou Swagger em `/docs`. |
| PC-02 | Token do **administrador A** (o executor): `POST /auth/login` com o administrador padrão do seed. Anotar o `id` dele para conferir a auditoria. |
| PC-03 | Token de um **aluno ativo** e de um **representante**, para o CT-010. Se o login do representante ainda não funcionar (PR #195), executar só o aluno e registrar a outra parte como 🚫. |
| PC-04 | Acesso de leitura ao banco: tabelas `faculdade`, `log_auditoria` e `representante`. |
| PC-05 | Massa criada pela própria suíte: o CT-002 cria **UFC / Quixadá** e **IFCE / Quixadá**; o CT-003 cria **UFC / Fortaleza**; o CT-007 cria e inativa **Uniateneu / Ocara**. |
| PC-06 | Para o CT-011: um aluno aprovado e ativo (para promover a representante) e os dados de um cadastro de aluno válido. |

## Resumo da execução

Executar na ordem abaixo. São **12 casos essenciais**. Todas as chamadas usam o token do administrador A, exceto onde indicado.

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU008-API-001 | Listar faculdades e filtrar por status | Sem filtro; `ativo=true`; `ativo=false`; sem token | HTTP 200; filtro respeitado; sem token só ativas | ⏳ PENDENTE | Não executado. |
| CT-HU008-API-002 | Cadastrar faculdade válida | `UFC` / `Quixadá`; `"  IFCE  "` / `"  Quixadá "` | HTTP 201 “Operação realizada com sucesso”; criada ativa; espaços removidos | ⏳ PENDENTE | Não executado. |
| CT-HU008-API-003 | Mesmo nome em outro campus | `UFC` / `Fortaleza` | HTTP 201 | ⏳ PENDENTE | Não executado. |
| CT-HU008-API-004 | Duplicidade no cadastro e na edição | `UFC`/`Quixadá` em variações; faculdade inativa; edição para nome+campus em uso | HTTP 409 “Esta faculdade já está cadastrada.”; nada criado nem alterado | ⏳ PENDENTE | Não executado. |
| CT-HU008-API-005 | Obrigatórios e limites | Sem nome; sem campus; em branco; 256 caracteres; edição esvaziando | HTTP 422 com campo e motivo em português; nada gravado | ⏳ PENDENTE | Não executado. |
| CT-HU008-API-006 | Editar faculdade | Trocar só o campus; trocar só o nome; id inexistente | HTTP 200; 404 “Faculdade não encontrada.”; conflito detectado com o outro campo atual | ⏳ PENDENTE | Não executado. |
| CT-HU008-API-007 | Inativar e reativar (soft delete) | `Uniateneu`/`Ocara`: inativar, repetir, ativar, repetir; id inexistente | 200 nas válidas; registro mantido; 409 ou resposta clara nas repetidas; 404 no inexistente | ⏳ PENDENTE | Não executado. |
| CT-HU008-API-008 | Inativação pelo `PATCH` com `ativo` | `{"ativo": false}` na edição | Mesmas regras e auditoria da rota de inativar (ou campo não aceito) | ⏳ PENDENTE | Não executado. |
| CT-HU008-API-009 | Auditoria das operações de escrita | Operações dos CT-002, 006 e 007 | Um registro por cadastro, edição, inativação e reativação | ⏳ PENDENTE | Não executado. |
| CT-HU008-API-010 | Acesso sem privilégio | Token de aluno; token de representante; sem token | HTTP 403 (aluno e representante) e 401 (sem token) nas rotas de escrita | ⏳ PENDENTE | Não executado. |
| CT-HU008-API-011 | Faculdade inativa fora de novos vínculos e histórico preservado | Promover representante em faculdade inativa; cadastro de aluno com faculdade inativa; aluno já vinculado | Novos vínculos recusados; vínculo existente mantido | ⏳ PENDENTE | Não executado. |
| CT-HU008-API-012 | Bloqueio por alunos agendados no futuro | Faculdade com agendamento futuro | HTTP 409 “Esta instituição possui viagens programadas pendentes. Não é possível inativar no momento.” | ⏳ PENDENTE | Depende da HU-013 (agenda). Sem ela, marcar 🚫. |

## Detalhamento dos casos

### CT-HU008-API-001 — Listar faculdades e filtrar por status

**Dados de entrada:** quatro chamadas: `GET /faculdades`; `GET /faculdades?ativo=true`; `GET /faculdades?ativo=false` (as três com o token do administrador A); `GET /faculdades?ativo=false` sem o cabeçalho `Authorization`.

**Passos**

1. Executar depois do CT-007 (quando já existe uma faculdade inativa).
2. Enviar as quatro chamadas e conferir os campos de cada item.
3. Enviar `GET /faculdades/{id}` da faculdade inativa com e sem token.

**Resultado esperado**

- HTTP `200` com uma lista de objetos `id_faculdade`, `nome_faculdade`, `campus_faculdade`, `sigla` e `ativo` (AC-01).
- Administrador: sem filtro, ativas e inativas; `ativo=true`, só ativas; `ativo=false`, só inativas (AC-09).
- Sem token (uso no cadastro de aluno): só faculdades ativas, mesmo pedindo `ativo=false` (AC-11).
- `GET /faculdades/{id}` da inativa: HTTP `200` para o administrador e `404` “Faculdade não encontrada.” sem token.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU008-API-002 — Cadastrar faculdade válida

**Dados de entrada:**

1. `{"nome_faculdade": "UFC", "campus_faculdade": "Quixadá", "sigla": "UFC"}`.
2. `{"nome_faculdade": "  IFCE  ", "campus_faculdade": "  Quixadá ", "sigla": " IFCE "}`.
3. `{"nome_faculdade": "UNILAB", "campus_faculdade": "Redenção"}` (sem sigla).

**Passos**

1. Enviar as três criações.
2. Conferir cada faculdade em `GET /faculdades/{id}`.

**Resultado esperado**

- HTTP `201`, `success: true`, `message: "Operação realizada com sucesso"` e `data.ativo: true` (AC-02, AC-07).
- Espaços do início e do fim removidos de nome, campus e sigla.
- A criação sem sigla é aceita e a sigla fica vazia (`null`), ou a API rejeita com mensagem clara. Registrar o comportamento: a tela exige a sigla.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU008-API-003 — Mesmo nome em outro campus

**Dados de entrada:** `{"nome_faculdade": "UFC", "campus_faculdade": "Fortaleza", "sigla": "UFC"}` (já existe `UFC` / `Quixadá`).

**Passos**

1. Enviar a criação.
2. Conferir em `GET /faculdades` que as duas existem.

**Resultado esperado**

- HTTP `201` com “Operação realizada com sucesso”: a unicidade vale para a **combinação nome + campus** (AC-02).
- A faculdade `UFC` / `Quixadá` não é alterada.
- Se a sigla repetida causar `409`, registrar como defeito (o requisito não pede sigla única).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU008-API-004 — Duplicidade no cadastro e na edição

**Dados de entrada:**

1. `POST /faculdades` com `UFC` / `Quixadá`, depois `ufc` / `quixadá`, `UFC` / `QUIXADÁ` e `" UFC "` / `" Quixadá "`.
2. Criar `Uniateneu` / `Ocara`, inativá-la e tentar criar `Uniateneu` / `Ocara` de novo.
3. `PATCH /faculdades/{id da UFC/Fortaleza}` com `{"campus_faculdade": "Quixadá"}`.
4. `PATCH /faculdades/{id da IFCE/Quixadá}` com `{"nome_faculdade": "UFC"}`.

**Passos**

1. Enviar cada tentativa separadamente.
2. Ao final, conferir em `GET /faculdades` que nada foi criado (além da Uniateneu do item 2) e que as faculdades editadas mantiveram os dados.

**Resultado esperado**

- Itens 1 a 4: HTTP `409` com “Esta faculdade já está cadastrada.” (AC-03, FA-002). A comparação ignora maiúsculas/minúsculas e espaços nas pontas e considera faculdades inativas.
- Nenhum `500` e nenhum registro criado ou alterado.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU008-API-005 — Obrigatórios e limites

**Dados de entrada:** em `POST /faculdades`:

1. `{}`.
2. `{"nome_faculdade": "", "campus_faculdade": "Quixadá"}` e `{"nome_faculdade": "   ", "campus_faculdade": "Quixadá"}`.
3. `{"nome_faculdade": "Faculdade Teste", "campus_faculdade": ""}` e só espaços.
4. Nome com 256 caracteres; campus com 256 caracteres; sigla com 51 caracteres.

Em `PATCH /faculdades/{id da IFCE}`: `{"nome_faculdade": ""}` e `{"campus_faculdade": "   "}`.

**Passos**

1. Enviar cada tentativa e anotar o status, o campo e a mensagem.
2. Conferir que nada foi criado nem alterado.

**Resultado esperado**

- HTTP `422` em todas, indicando o campo e o motivo **em português** (AC-08, FA-003), sem o texto cru do framework em inglês.
- Nenhum `500`, nenhuma faculdade criada e a IFCE sem alteração.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU008-API-006 — Editar faculdade

**Dados de entrada:**

1. `PATCH /faculdades/{id da IFCE}` com `{"campus_faculdade": "Quixadá Centro"}`.
2. `PATCH /faculdades/{id da IFCE}` com `{"nome_faculdade": "Instituto Federal do Ceará"}`.
3. `PATCH /faculdades/999999` com `{"nome_faculdade": "Inexistente"}`.

**Passos**

1. Enviar as três chamadas e conferir a faculdade em `GET /faculdades/{id}` depois de cada uma.

**Resultado esperado**

- Chamadas 1 e 2: HTTP `200`, “Operação realizada com sucesso” e dados atualizados; os campos não enviados não mudam (AC-04, AC-07).
- Chamada 3: HTTP `404` “Faculdade não encontrada.”
- A edição de um campo isolado também verifica a duplicidade com o **outro campo atual** (já coberto no CT-004).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU008-API-007 — Inativar e reativar (soft delete)

**Dados de entrada:** `id` da `Uniateneu` / `Ocara`; `id` `999999`.

**Passos**

1. `PATCH /faculdades/{id}/inativar` e conferir o retorno.
2. Conferir a faculdade em `GET /faculdades?ativo=false` (administrador) e em `GET /faculdades` sem token.
3. Consultar a tabela `faculdade` pelo `id`.
4. Repetir a inativação.
5. `PATCH /faculdades/{id}/ativar` e conferir; repetir a reativação.
6. `PATCH /faculdades/999999/inativar` e `/ativar`.

**Resultado esperado**

- Inativação: HTTP `200`, “Operação realizada com sucesso”, `data.ativo: false` (AC-05, AC-07).
- O registro continua no banco (soft delete) e aparece para o administrador entre as inativas, mas não sem token.
- Repetir a inativação ou a reativação: HTTP `409` com mensagem clara em português, **sem gravar novo registro de auditoria**. Se responder `200` e gravar auditoria duplicada, registrar.
- Reativação: HTTP `200` e `data.ativo: true`.
- Id inexistente: HTTP `404` “Faculdade não encontrada.”

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU008-API-008 — Inativação pelo `PATCH` com `ativo`

**Dados de entrada:** `PATCH /faculdades/{id da IFCE}` com `{"ativo": false}`; depois `{"ativo": true}`.

**Passos**

1. Enviar a primeira chamada e conferir `ativo` e o `log_auditoria`.
2. Enviar a segunda e conferir de novo.

**Resultado esperado**

- A mudança de status deve seguir as mesmas regras da rota de inativar/reativar: auditoria gravada (AC-10) e bloqueio por agendamentos futuros (AC-06).
- Se a API aceitar o campo e mudar o status **sem registrar auditoria**, registrar como defeito (caminho que contorna a rastreabilidade e o bloqueio). Se o campo for ignorado ou recusado, o caso passa.
- Ao final, deixar a IFCE ativa.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU008-API-009 — Auditoria das operações de escrita

**Dados de entrada:** operações da `IFCE` / `Quixadá`: cadastro (CT-002), edição (CT-006), e da `Uniateneu`: inativação e reativação (CT-007).

**Passos**

1. Consultar `log_auditoria` com `entidade = 'faculdade'`, ordenando por `criado_em`.
2. Conferir também que as tentativas recusadas (CT-004 e CT-005) não geraram registro.

**Resultado esperado**

- Um registro para cada cadastro, edição, inativação e reativação, com `usuario_id` do administrador A, a ação e a data/hora (AC-10, RNF-013).
- Nenhum registro para operações recusadas.
- Registrar quais operações **não** geraram registro.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU008-API-010 — Acesso sem privilégio

**Dados de entrada:** `POST /faculdades` (corpo válido, `Faculdade Proibida` / `Quixadá`), `PATCH /faculdades/{id da IFCE}`, `PATCH .../inativar` e `PATCH .../ativar`, enviados com o token do aluno, com o token do representante e sem token. Também `GET /faculdades?ativo=false` com o token do aluno.

**Passos**

1. Enviar as quatro rotas de escrita com cada credencial.
2. Enviar a listagem com o token do aluno.
3. Conferir com o token do administrador que nada mudou.

**Resultado esperado**

- Token de aluno e de representante: HTTP `403` nas quatro rotas de escrita (RN-006).
- Sem token: HTTP `401`.
- Listagem com token de aluno: só faculdades ativas.
- Nenhuma faculdade criada ou alterada.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU008-API-011 — Faculdade inativa fora de novos vínculos e histórico preservado

**Dados de entrada:** um aluno já vinculado à `UFC` / `Quixadá`; um aluno aprovado e ativo para promover a representante (PC-06); os dados de um novo cadastro de aluno.

**Passos**

1. Conferir o `faculdade_id` do aluno vinculado.
2. Inativar a `UFC` / `Quixadá`.
3. Conferir de novo o `faculdade_id` do aluno (banco ou `GET /alunos/{id}`).
4. `POST /representantes/promover` com a `UFC` inativa e o aluno do PC-06.
5. `POST /alunos` com o `faculdade_id` da `UFC` inativa e os demais dados válidos.
6. Reativar a `UFC` ao final.

**Resultado esperado**

- O aluno já vinculado continua com o mesmo `faculdade_id` (RN-004, AC-11).
- Promoção em faculdade inativa: HTTP `422` “Faculdade inativa.” e nada gravado.
- Novo cadastro de aluno com faculdade inativa: recusado com mensagem clara; nenhum aluno criado (AC-11). Se for aceito, registrar como defeito.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU008-API-012 — Bloqueio por alunos agendados no futuro

**Dados de entrada:** uma faculdade com alunos agendados para datas futuras (HU-013).

**Passos**

1. Conferir se a agenda de viagens (HU-013) já existe na branch testada. Se não existir, marcar 🚫 e registrar a dependência.
2. Com o agendamento criado, `PATCH /faculdades/{id}/inativar`.

**Resultado esperado**

- HTTP `409` com “Esta instituição possui viagens programadas pendentes. Não é possível inativar no momento.” (AC-06, FA-001).
- A faculdade continua ativa e nenhum registro de auditoria é criado.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 — listagem de ativas | Administrador visualiza as faculdades ativas | CT-001 |
| AC-02 — cadastro e outro campus | Cadastra nova faculdade; mesmo nome em outro campus | CT-002, CT-003 |
| AC-03 / FA-002 — duplicidade | Bloqueia cadastro e edição duplicados | CT-004, CT-006 |
| AC-04 — edição | Edita dados | CT-006 |
| AC-05 — inativar e reativar (soft delete) | Inativa; reativa; soft delete | CT-007, CT-008 |
| AC-06 / FA-001 — agendamentos futuros | Bloqueia inativação | CT-012 |
| AC-07 — mensagem de sucesso | Cenários de sucesso | CT-002, 006, 007 |
| AC-08 / FA-003 — obrigatórios | Campo obrigatório no cadastro e na edição | CT-005 |
| AC-09 — inativas | Mostrar inativos | CT-001, CT-007 |
| AC-10 / RNF-013 — auditoria | Registro no log de auditoria | CT-009, CT-008 |
| AC-11 / RN-004 — inativas fora da seleção e histórico | Faculdade inativa fora da seleção; preserva vínculos | CT-001, CT-011 |
| RN-006 — exclusividade administrativa | API nega gestão a outros perfis | CT-010 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Referências: [HU-008, seção 7.3.2](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-02/HU-008.feature), [suíte de UI](../ui/UI-HU-008.md) e [issue #185](https://github.com/GOUOCE/GOUCE-app/issues/185) (pontos do épico 02 em discussão).
- **Riscos mapeados no código** (backend em `backend/src/modulos/crud_basicos/`), que orientaram a escolha dos casos:
  - a inativação e a reativação **não verificam** agendamentos futuros nem o status atual: o bloqueio do AC-06 nunca dispara e repetir a operação grava auditoria duplicada (CT-007, CT-012);
  - o `PATCH` aceita o campo `ativo`, que muda o status **sem auditoria** (CT-008);
  - cadastro e edição não gravam `log_auditoria`; só inativar e ativar gravam (CT-009);
  - a faculdade é comparada por nome + campus em minúsculas, o que cobre o AC-03, mas não há índice único no banco para impedir duas requisições simultâneas (fora do escopo manual);
  - o cadastro de aluno não confere se a faculdade está ativa; a promoção a representante confere (CT-011);
  - `sigla` é opcional na API e obrigatória na tela (CT-002).
- A listagem e a consulta por id são públicas (sem token devolvem só ativas), pois o cadastro de aluno precisa delas. Não é falha.
- A decisão sobre a duplicidade valer também para faculdades inativas está registrada na [issue #185](https://github.com/GOUOCE/GOUCE-app/issues/185); os casos seguem o AC-03.
- Ao final, deixar as faculdades de teste ativas ou inativas conforme combinado com o líder, sem apagar registros.
