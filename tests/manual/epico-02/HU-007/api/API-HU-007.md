# Testes manuais de API — HU-007 — Gerenciamento de Bairros e Pontos de Parada

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Gestão de Cadastros Base (EP-002) |
| Funcionalidade | HU-007 — Gerenciamento de Bairros e Pontos de Parada |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial (baseada em risco) |
| Endpoints | `GET /bairros`, `GET /bairros/{id}`, `POST /bairros`, `PATCH /bairros/{id}`, `PATCH /bairros/{id}/inativar` e `PATCH /bairros/{id}/ativar` — `application/json`. Corpo: `{"nome": "...", "pontos_de_parada": ["..."]}` (a API também aceita `nome_bairro`) |
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
| PC-01 | API e banco disponíveis, de preferência em **stack isolada com banco limpo** (o mesmo padrão das suítes do épico 01). Usar Postman, Insomnia ou o Swagger em `/docs`. |
| PC-02 | Token do **administrador A** (o executor): `POST /auth/login` com o administrador padrão do seed. Anotar o `id` dele para conferir a auditoria. |
| PC-03 | Token de um **aluno ativo** e de um **representante** (aluno promovido pela HU-030), para o CT-010. Se o login do representante ainda não funcionar (ver PR #195), executar só a parte do aluno e registrar a outra como 🚫. |
| PC-04 | Acesso de leitura ao banco para conferir as tabelas `bairro`, `ponto_de_parada`, `log_auditoria` e `aluno`. |
| PC-05 | Massa criada pela própria suíte: o CT-002 cria **Campo Velho** (ponto `Escola Coronel Virgílio Távora`) e **Centro** (pontos `Praça José de Barros`, `Mercado Público` e `Posto de Saúde`); o CT-004 cria e inativa **Alto São Francisco**. Os casos seguintes usam esses bairros. |
| PC-06 | Para o CT-011: os dados de um cadastro de aluno válido (mesma massa da suíte de API da HU-001) e os arquivos dos comprovantes. |

## Resumo da execução

Executar na ordem abaixo. São **12 casos essenciais**. Todas as chamadas usam o token do administrador A, exceto onde indicado.

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU007-API-001 | Listar bairros e filtrar por status | Sem filtro; `ativo=true`; `ativo=false`; sem token | HTTP 200; bairros com seus pontos; filtro respeitado; sem token só ativos | ⏳ PENDENTE | Não executado. |
| CT-HU007-API-002 | Cadastrar bairro com pontos de parada | `Campo Velho` (1 ponto); `"  Centro  "` (3 pontos) | HTTP 201 “Operação realizada com sucesso”; bairro e pontos ativos; nome sem espaços | ⏳ PENDENTE | Não executado. |
| CT-HU007-API-003 | Mesmo nome de ponto em outro bairro | `Planalto Universitário` com o ponto `Posto de Saúde` (já usado no Centro) | HTTP 201; ponto criado no novo bairro | ⏳ PENDENTE | Não executado. |
| CT-HU007-API-004 | Cadastro e edição duplicados | `Centro`, `centro`, `CENTRO`, `" Centro "`; bairro inativo; edição para nome em uso; ponto repetido no mesmo bairro | HTTP 409 “Esta localidade já está cadastrada.”; nada criado nem alterado | ⏳ PENDENTE | Não executado. |
| CT-HU007-API-005 | Campos obrigatórios e limites | Sem nome; nome vazio; sem pontos; lista vazia; ponto em branco; nome com 101 caracteres; edição esvaziando | HTTP 422 com campo e motivo em português; nada gravado | ⏳ PENDENTE | Não executado. |
| CT-HU007-API-006 | Editar bairro | Renomear `Campo Velho` e adicionar ponto; id inexistente | HTTP 200 “Operação realizada com sucesso”; ponto antigo mantém o id; 404 no inexistente | ⏳ PENDENTE | Não executado. |
| CT-HU007-API-007 | Inativar um ponto de parada (soft delete) | Edição do Centro sem `Mercado Público`; depois readicionar o mesmo nome | Ponto fica `ativo: false` e continua no banco; readição bloqueada com 409 | ⏳ PENDENTE | Não executado. |
| CT-HU007-API-008 | Inativar e reativar bairro | `Campo Velho II`: inativar, repetir, ativar, repetir; id inexistente | HTTP 200 nas operações válidas; registro mantido; 409 nas repetidas; 404 no inexistente | ⏳ PENDENTE | Não executado. |
| CT-HU007-API-009 | Auditoria das operações de escrita | Registros gerados nos CT-002, 006 e 008 | Um registro por cadastro, edição, inativação e reativação, com usuário, ação e data/hora | ⏳ PENDENTE | Não executado. |
| CT-HU007-API-010 | Acesso sem privilégio | Token de aluno; token de representante; sem token | HTTP 403 (aluno e representante) e 401 (sem token) nas rotas de escrita; nada gravado | ⏳ PENDENTE | Não executado. |
| CT-HU007-API-011 | Bairro inativo fora de novos vínculos e histórico preservado | Aluno vinculado ao Centro; inativar o Centro; novo cadastro com o Centro inativo | Aluno existente mantém o vínculo; novo cadastro com bairro inativo é recusado | ⏳ PENDENTE | Não executado. |
| CT-HU007-API-012 | Bloqueio de inativação por rota ativa | Bairro e ponto usados em rota ativa (HU-011) | HTTP 409 com as mensagens do AC-06; nada inativado | ⏳ PENDENTE | Depende da HU-011 (rotas). Sem rotas na develop, marcar 🚫. |

## Detalhamento dos casos

### CT-HU007-API-001 — Listar bairros e filtrar por status

**Dados de entrada:** quatro chamadas: `GET /bairros`; `GET /bairros?ativo=true`; `GET /bairros?ativo=false` (as três com o token do administrador A); `GET /bairros?ativo=false` sem o cabeçalho `Authorization`.

**Passos**

1. Executar depois do CT-004 (quando já existem bairros ativos e o inativo **Alto São Francisco**).
2. Enviar as quatro chamadas e conferir os campos de cada item.

**Resultado esperado**

- HTTP `200` em todas, com uma lista de bairros contendo `id`, `nome`, `ativo` e `pontos_de_parada` (cada ponto com `id`, `nome`, `bairro_id` e `ativo`) (AC-01).
- Administrador: sem filtro, ativos e inativos; `ativo=true`, só ativos; `ativo=false`, só inativos (AC-09).
- Sem token (uso no cadastro de aluno): só bairros ativos, mesmo pedindo `ativo=false` (AC-11).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU007-API-002 — Cadastrar bairro com pontos de parada

**Dados de entrada:** duas criações em `POST /bairros`:

1. `{"nome": "Campo Velho", "pontos_de_parada": ["Escola Coronel Virgílio Távora"]}`.
2. `{"nome": "  Centro  ", "pontos_de_parada": ["Praça José de Barros", " Mercado Público ", "Posto de Saúde"]}`.

**Passos**

1. Enviar as duas criações.
2. Conferir os bairros em `GET /bairros/{id}`.

**Resultado esperado**

- HTTP `201`, `success: true`, `message: "Operação realizada com sucesso"` e `data` com `ativo: true` (AC-02, AC-07).
- Todos os pontos criados com `ativo: true` e vinculados ao bairro.
- Espaços do início e do fim removidos: `Centro` e `Mercado Público`.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU007-API-003 — Mesmo nome de ponto em outro bairro

**Dados de entrada:** `POST /bairros` com `{"nome": "Planalto Universitário", "pontos_de_parada": ["Posto de Saúde"]}` (o Centro já tem um ponto `Posto de Saúde`).

**Passos**

1. Enviar a criação.
2. Conferir em `GET /bairros` que os dois bairros têm o ponto `Posto de Saúde`.

**Resultado esperado**

- HTTP `201` com “Operação realizada com sucesso”: o nome do ponto só precisa ser único **dentro do mesmo bairro** (AC-02).
- O ponto `Posto de Saúde` do Centro não é alterado.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU007-API-004 — Cadastro e edição duplicados

**Dados de entrada:**

1. `POST /bairros` com o nome `Centro`, depois `centro`, `CENTRO` e `" Centro "`, sempre com o ponto `Rodoviária`.
2. Criar `{"nome": "Alto São Francisco", "pontos_de_parada": ["Rodoviária Velha"]}`, inativá-lo (`PATCH /bairros/{id}/inativar`) e tentar criar `Alto São Francisco` de novo.
3. `PATCH /bairros/{id do Campo Velho}` com `{"nome": "Centro"}`.
4. `POST /bairros` com `{"nome": "Bairro Novo", "pontos_de_parada": ["Rodoviária", "rodoviária "]}`.
5. `PATCH /bairros/{id do Centro}` com a lista atual de pontos mais `"mercado público"`.

**Passos**

1. Enviar cada tentativa separadamente.
2. Ao final, conferir em `GET /bairros` que nenhum bairro novo foi criado (exceto o Alto São Francisco do item 2), que o Campo Velho manteve o nome e que o Centro continua com 3 pontos.

**Resultado esperado**

- Itens 1 a 5: HTTP `409` com “Esta localidade já está cadastrada.” (AC-03, FA-002). A comparação ignora maiúsculas/minúsculas e espaços nas pontas e considera bairros inativos.
- Nenhum `500` e nenhum registro criado ou alterado pelas tentativas.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU007-API-005 — Campos obrigatórios e limites

**Dados de entrada:** em `POST /bairros`:

1. `{}`.
2. `{"nome": "", "pontos_de_parada": ["Praça"]}` e `{"nome": "   ", "pontos_de_parada": ["Praça"]}`.
3. `{"nome": "Bairro Teste"}` (sem pontos).
4. `{"nome": "Bairro Teste", "pontos_de_parada": []}`.
5. `{"nome": "Bairro Teste", "pontos_de_parada": ["   "]}`.
6. Nome com 101 caracteres e um ponto válido.

Em `PATCH /bairros/{id do Campo Velho}`: `{"nome": ""}` e `{"pontos_de_parada": []}`.

**Passos**

1. Enviar cada tentativa e anotar o status, o campo e a mensagem.
2. Conferir que nada foi criado nem alterado.

**Resultado esperado**

- HTTP `422` em todas, indicando o campo (`nome` ou `pontos_de_parada`) e o motivo **em português** (AC-08, FA-003), por exemplo “O nome do bairro é obrigatório.” e “Ao menos um ponto de parada é obrigatório.”.
- A edição não pode deixar o bairro sem nome nem sem ponto de parada ativo (AC-08).
- Nenhum `500`, nenhum bairro criado e o Campo Velho sem alteração.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU007-API-006 — Editar bairro

**Dados de entrada:**

1. `PATCH /bairros/{id do Campo Velho}` com `{"nome": "Campo Velho II", "pontos_de_parada": ["Escola Coronel Virgílio Távora", "Posto de Saúde"]}`.
2. `PATCH /bairros/999999` com `{"nome": "Inexistente"}`.

**Passos**

1. Anotar o `id` do ponto `Escola Coronel Virgílio Távora` antes da edição.
2. Enviar as duas chamadas e conferir o bairro em `GET /bairros/{id}`.

**Resultado esperado**

- Chamada 1: HTTP `200`, “Operação realizada com sucesso”, nome `Campo Velho II` e os dois pontos ativos (AC-04, AC-07). O ponto que já existia mantém o mesmo `id` (não é apagado e recriado).
- Chamada 2: HTTP `404` “Bairro não encontrado.”

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU007-API-007 — Inativar um ponto de parada (soft delete)

**Dados de entrada:** `PATCH /bairros/{id do Centro}` com `{"pontos_de_parada": ["Praça José de Barros", "Posto de Saúde"]}` (sem `Mercado Público`). Depois, a mesma chamada com os três nomes de novo.

**Passos**

1. Anotar o `id` do ponto `Mercado Público` e conferir que ele existe na tabela `ponto_de_parada`.
2. Enviar a primeira edição e conferir o Centro com o token do administrador e sem token.
3. Consultar a tabela `ponto_de_parada` pelo `id` anotado.
4. Enviar a segunda edição (readicionando `Mercado Público`).

**Resultado esperado**

- O ponto `Mercado Público` fica com `ativo: false`: continua no banco com o mesmo `id` e aparece para o administrador como inativo; não aparece na consulta sem token (AC-04, AC-05, AC-09, RF-014).
- O Centro continua ativo, com os outros dois pontos ativos.
- Readicionar `Mercado Público`: HTTP `409` “Esta localidade já está cadastrada.”, pois existe um ponto com esse nome (inativo) no mesmo bairro (AC-03). Se o produto preferir reativar o ponto nesse caso, registrar como divergência.
- Se a API não tiver forma de inativar ou reativar um ponto individual, registrar como defeito do AC-05.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU007-API-008 — Inativar e reativar bairro

**Dados de entrada:** `id` do `Campo Velho II`; `id` `999999`.

**Passos**

1. `PATCH /bairros/{id}/inativar` e conferir o retorno.
2. Conferir o bairro em `GET /bairros?ativo=false` (administrador), em `GET /bairros` sem token e em `GET /bairros/{id}` sem token.
3. Consultar as tabelas `bairro` e `ponto_de_parada` pelo `id`.
4. Repetir a inativação.
5. `PATCH /bairros/{id}/ativar` e conferir; repetir a reativação.
6. `PATCH /bairros/999999/inativar`.

**Resultado esperado**

- Inativação: HTTP `200`, “Operação realizada com sucesso”, `data.ativo: false` (AC-05, AC-07).
- O bairro continua no banco (soft delete), com seus pontos; aparece para o administrador entre os inativos e não aparece sem token (`GET /bairros/{id}` sem token: `404`). Enquanto inativo, seus pontos ficam indisponíveis (AC-05).
- Repetir a inativação: HTTP `409` com mensagem clara em português; nada muda.
- Reativação: HTTP `200`, “Operação realizada com sucesso”, `data.ativo: true`; repetir: `409`.
- Id inexistente: HTTP `404` “Bairro não encontrado.”

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU007-API-009 — Auditoria das operações de escrita

**Dados de entrada:** operações já feitas: cadastro do Campo Velho (CT-002), edição para Campo Velho II (CT-006), inativação e reativação (CT-008).

**Passos**

1. Consultar `log_auditoria` filtrando `entidade = 'bairro'` e o `entidade_id` do Campo Velho II, ordenando por `criado_em`.
2. Conferir também que as tentativas recusadas (CT-004 e CT-005) não geraram registro.

**Resultado esperado**

- Quatro registros: cadastro, edição, inativação e reativação, cada um com `usuario_id` do administrador A, a ação e a data/hora (AC-10, RNF-013).
- Nenhum registro para operações recusadas.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU007-API-010 — Acesso sem privilégio

**Dados de entrada:** `POST /bairros` (corpo válido, nome `Bairro Proibido`), `PATCH /bairros/{id do Centro}`, `PATCH /bairros/{id do Centro}/inativar` e `PATCH /bairros/{id do Centro}/ativar`, enviados com o token do aluno, com o token do representante e sem token. Também `GET /bairros?ativo=false` com o token do aluno.

**Passos**

1. Enviar as quatro rotas de escrita com cada credencial.
2. Enviar a listagem com o token do aluno.
3. Conferir com o token do administrador que nada mudou.

**Resultado esperado**

- Token de aluno e de representante: HTTP `403` nas quatro rotas de escrita (RN-006).
- Sem token: HTTP `401` nas quatro rotas.
- Listagem com token de aluno: só bairros ativos (o filtro `ativo=false` é ignorado).
- Nenhum bairro criado ou alterado.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU007-API-011 — Bairro inativo fora de novos vínculos e histórico preservado

**Dados de entrada:** um aluno vinculado ao bairro **Centro** (cadastrado pela API com o `bairro_id` do Centro ou ajustado pelo banco); dados de um novo cadastro de aluno (PC-06).

**Passos**

1. Conferir o `bairro_id` do aluno vinculado.
2. Inativar o Centro (`PATCH /bairros/{id}/inativar`).
3. Conferir de novo o `bairro_id` do aluno (banco ou `GET /alunos/{id}`).
4. Enviar `POST /alunos` com o `bairro_id` do Centro inativo e os demais dados válidos.
5. Reativar o Centro ao final.

**Resultado esperado**

- O aluno já vinculado continua com o `bairro_id` do Centro (RN-004, AC-11).
- O novo cadastro com bairro inativo é recusado (HTTP `422` com mensagem clara sobre o bairro) e nenhum aluno é criado (AC-11).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU007-API-012 — Bloqueio de inativação por rota ativa

**Dados de entrada:** uma rota ativa (HU-011) que use o bairro **Centro** e o ponto **Praça José de Barros**.

**Passos**

1. Conferir se a gestão de rotas (HU-011) já está na branch testada. Se não estiver, marcar 🚫 e registrar a dependência.
2. Com a rota criada, `PATCH /bairros/{id do Centro}/inativar`.
3. Tentar inativar o ponto `Praça José de Barros` pela edição do Centro.

**Resultado esperado**

- Bairro: HTTP `409` com “Este bairro não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar.” (AC-06, FA-001).
- Ponto: HTTP `409` com “Este ponto de parada não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar.”
- Bairro e ponto continuam ativos e nenhum registro de auditoria é criado.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 — listagem de ativos com pontos | Administrador visualiza os bairros ativos | CT-001 |
| AC-02 — cadastro e ponto repetido em outro bairro | Cadastra novo bairro; ponto com nome usado em outro bairro | CT-002, CT-003 |
| AC-03 / FA-002 — duplicidade | Bloqueia bairro duplicado (cadastro e edição); ponto duplicado no bairro | CT-004, CT-007 |
| AC-04 — edição | Edita nome e pontos | CT-006, CT-007 |
| AC-05 / RF-014 — inativar e reativar (soft delete) | Inativa bairro; inativa ponto; reativa; soft delete | CT-007, CT-008 |
| AC-06 / FA-001 — rota ativa | Bloqueia inativação vinculada a rota ativa | CT-012 |
| AC-07 — mensagem de sucesso | Todos os cenários de sucesso | CT-002, 006, 008 |
| AC-08 / FA-003 — obrigatórios | Campo obrigatório no cadastro; bairro sem ponto ativo na edição | CT-005 |
| AC-09 — inativos | Mostrar inativos | CT-001, CT-007, CT-008 |
| AC-10 / RNF-013 — auditoria | Registro no log de auditoria | CT-009 |
| AC-11 / RN-004 — inativos fora da seleção e histórico | Bairro inativo fora da seleção; preservação de vínculos | CT-001, CT-011 |
| RN-006 — exclusividade administrativa | API nega gestão a outros perfis | CT-010 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Referências: [HU-007, seção 7.3.1](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-02/HU-007.feature), [suíte de UI](../ui/UI-HU-007.md) e [issue #185](https://github.com/GOUOCE/GOUCE-app/issues/185) (pontos do épico 02 em discussão).
- **Riscos mapeados no código** (backend em `backend/src/modulos/crud_basicos/`), que orientaram a escolha dos casos:
  - a unicidade do ponto de parada é verificada **no sistema inteiro** (`ponto_existe_no_sistema`), e não dentro do bairro: o CT-003 tende a responder `409`;
  - a edição troca a lista inteira de pontos e o relacionamento usa `delete-orphan`: o ponto retirado da lista tende a ser **apagado** do banco (CT-006 e CT-007). Não há rota para inativar ou reativar um ponto individual;
  - só a inativação e a reativação gravam `log_auditoria`; cadastro e edição não (CT-009);
  - o verificador de rota ativa (`rota_ativa_checker`) não é injetado na rota, então o bloqueio do AC-06 nunca dispara (CT-012);
  - o cadastro de aluno não confere se o bairro está ativo (CT-011);
  - os erros `422` do DTO passam pelo tradutor genérico (`validation_details`) e podem perder a mensagem específica (ex.: “Valor inválido.”) (CT-005).
- A listagem e a consulta por id são públicas (sem token devolvem só ativos), pois o cadastro de aluno precisa delas. Não é falha.
- Ao final, deixar os bairros de teste ativos ou inativos conforme combinado com o líder, sem apagar registros.
