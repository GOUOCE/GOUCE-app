# Testes manuais de API — HU-011 — Gerenciamento de Rotas Principais e Horários

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Gestão de Rotas e Horários (EP-003) |
| Funcionalidade | HU-011 — Gerenciamento de Rotas Principais e Horários |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial (baseada em risco) |
| Endpoints | `GET /rotas-principais`, `GET /rotas-principais/opcoes`, `GET /rotas-principais/{id}`, `POST /rotas-principais`, `PATCH /rotas-principais/{id}`, `PATCH /rotas-principais/{id}/inativar` e `PATCH /rotas-principais/{id}/reativar` — `application/json`. Corpo: `{"nome": "...", "horario_saida": "HH:MM", "horario_retorno": "HH:MM", "bairros_ids": [..], "faculdades_ida_ids": [..], "faculdades_volta_ids": [..]}` |
| Ambiente | HTTP local `http://127.0.0.1:18811`; PostgreSQL 15/MinIO QA isolados; branch `feat/front-hu011`, aplicação `671a6e0df3d00016e87477deb326dfdb7c33b364`; plano `939921e3` |
| Total de casos | 14 |
| Última execução | 2026-10-27 — HTTP real com evidências JSON e consultas ao PostgreSQL |
| Testador | Cauan Ricardo — execução com apoio do Codex |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ⏳ Em execução | 14 | 11 | 1 | 1 | 0 | 1 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API e banco disponíveis em **stack isolada com banco limpo** (ver [README](README.md)). Usar Postman, Insomnia ou Swagger em `/docs`. |
| PC-02 | Token do **administrador A** (executor): `POST /auth/login` com o administrador padrão do seed. Anotar o `id` dele para conferir a auditoria. |
| PC-03 | Token de um **aluno aprovado e ativo** e de um **representante ativo**, para o CT-013. Se o login do representante não funcionar, executar só o aluno e marcar a outra parte como 🚫. |
| PC-04 | Acesso de leitura ao banco: tabelas `rota_principal`, `rota_principal_bairro`, `rota_principal_faculdade_ida`, `rota_principal_faculdade_volta`, `rota_complementar` e `log_auditoria`. |
| PC-05 | Massa de base preparada pela IA via API antes do CT-001 (anotar os ids reais): **B1 Centro** (seed) e **B2 Campo Velho** ativos; **B0 Alto São Francisco** criado e inativado; **F1 UFC / Campus Quixadá** (seed), **F2 IFCE / Quixadá** e **F3 UECE / Quixadá** ativas; **F0 Unicatólica / Quixadá** criada e inativada. |
| PC-06 | Massa de rotas criada pela própria suíte: **RP1 Rota Centro - UFC** (CT-002), **RP2 Rota Integrada** e **RP3 Rota Centro - Faculdades** (CT-003). O CT-010 cria a complementar **RC1 Van Trevo** pela API da HU-012. |
| PC-07 | Agendamento de alunos (HU-013) **não existe** na base analisada: o CT-014 fica 🚫 até a agenda estar na `develop`. |

## Resumo da execução

Executar na ordem abaixo. São **14 casos essenciais**. Todas as chamadas usam o token do administrador A, exceto onde indicado; itens que dependem de um caso posterior trazem essa indicação no próprio caso. As regras marcadas com **#208** vêm das decisões do PO na [issue #208](https://github.com/GOUOCE/GOUCE-app/issues/208).

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU011-API-001 | Listar, filtrar e consultar rotas | Sem filtro; `incluir_inativos=true`; `nome`; `GET /{id}`; `/opcoes` | HTTP 200; padrão só ativas; inativas com o filtro; opções só com base ativa | ✅ APROVADO | Lista vazia retornou 200/[]; filtros por nome respeitam maiúsculas/minúsculas, padrão oculta inativas e /opcoes exclui B0/F0. Consulta por id existente/inativo e 404 conferidos. [JSON](evidencias/CT-HU011-API-001.json) |
| CT-HU011-API-002 | Cadastrar rota principal válida | RP1: `Rota Centro - UFC`, 06:30/17:30, B1, F1 na ida e na volta | HTTP 201 “Operação realizada com sucesso”; ativa; vínculos e horários corretos | ✅ APROVADO | RP1 criada ativa, nome normalizado, 06:30/17:30 preservados e os três vínculos conferidos no GET e PostgreSQL. [JSON](evidencias/CT-HU011-API-002.json) |
| CT-HU011-API-003 | Vários vínculos e volta independente da ida | RP2: B1+B2, ida F1+F2+F3, volta F1; RP3: ida F1+F2, volta F3 | HTTP 201; cada lista gravada como enviada, sem copiar a ida na volta | ✅ APROVADO | RP2 gravou dois bairros, três faculdades na ida e uma na volta; RP3 voltou por F3 sem copiá-la da ida. RP1 permaneceu inalterada. [JSON](evidencias/CT-HU011-API-003.json) |
| CT-HU011-API-004 | Nome único entre todas as rotas (#208) | Nome igual; maiúsculas/espaços; nome de rota inativa; nome de complementar; edição para nome em uso | HTTP 409; nada criado nem alterado | ❌ FALHOU | Duplicidades no mesmo tipo foram recusadas, inclusive com case/trim e rota inativa. Porém, criar principal Van Trevo, nome já usado por complementar inativa, retornou 201 e persistiu o nome duplicado entre tabelas; esperado 409. [JSON](evidencias/CT-HU011-API-004.json) [#309](https://github.com/GOUOCE/GOUCE-app/issues/309) |
| CT-HU011-API-005 | Obrigatórios, listas vazias e limites | Sem cada campo; nome em branco; listas `[]`; nome com 151 caracteres; edição esvaziando lista | HTTP 422 com campo e mensagem em português; nada gravado | ✅ APROVADO | Obrigatórios, nome em branco/nulo, listas ausentes/vazias, nome 151 e edição esvaziando vínculos foram recusados com 422/campo/mensagem. Controle de 150 aceito e inativado via API após captura. [JSON](evidencias/CT-HU011-API-005.json) |
| CT-HU011-API-006 | Formato e ordem dos horários (#208) | `6:30`, `24:00`, `06:60`, `06:30:00`, texto; retorno igual e anterior à saída; 00:00/23:59 | Fora de `HH:MM` ou retorno ≤ saída: 422; sem faixa mínima/máxima | ✅ APROVADO | Formatos inválidos e retorno igual/anterior recusados; edição parcial usa o horário salvo. 00:00/23:59 e 13:15/13:16 aceitos sem conversão de fuso; controles inativados via API. [JSON](evidencias/CT-HU011-API-006.json) |
| CT-HU011-API-007 | Vínculo com bairro ou faculdade inativo ou inexistente | B0; F0 na ida e na volta; id inexistente; ids repetidos; id `0`, negativo e texto | HTTP 422 no campo da lista; nenhuma rota nem vínculo inválido gravado | ✅ APROVADO | Bairro/faculdade inativos ou inexistentes, IDs repetidos, zero, negativo e string foram recusados com 422. A edição com nome + vínculo inválido permaneceu atômica; nome e vínculos originais preservados. [JSON](evidencias/CT-HU011-API-007.json) |
| CT-HU011-API-008 | Editar dados e vínculos da rota | RP1: só nome; só horários; trocar listas; `{}`; campo `ativo`; id inexistente | HTTP 200 no mesmo id; 422 sem campo ou com campo extra; 404 inexistente | ✅ APROVADO | Nome, horários e listas editados no mesmo id; listas substituíram as antigas. Corpo vazio/campo ativo retornaram 422 e id inexistente 404. RP2/RP3 não mudaram. [JSON](evidencias/CT-HU011-API-008.json) |
| CT-HU011-API-009 | Inativar e reativar (soft delete) | RP2: inativar, repetir, reativar, repetir; id inexistente | HTTP 200 nas válidas; registro e vínculos mantidos; 409 nas repetidas; 404 | ✅ APROVADO | Inativar/reativar retornaram 200; repetições 409 e inexistente 404. Linha e vínculos preservados no PostgreSQL; RP2 foi deixada inativa. [JSON](evidencias/CT-HU011-API-009.json) |
| CT-HU011-API-010 | Bloquear inativação com complementar ativa (#208) | RP1 com RC1 ativa; depois RC1 inativada | HTTP 409 com a mensagem do PO; rota segue ativa; sem RC1 ativa, inativa | ⚠️ PARCIAL | Complementar ativa bloqueou a principal com 409 e sem auditoria da recusa; após inativar a complementar, a principal pôde ser inativada/reativada. Texto diferente do definido pelo PO: “Esta rota possui rotas complementares ativas e não pode ser inativada. Inative ou reassocie as complementares antes.” [JSON](evidencias/CT-HU011-API-010.json) [#311](https://github.com/GOUOCE/GOUCE-app/issues/311) |
| CT-HU011-API-011 | Bairro e faculdade em rota ativa (#208) | Inativar B1 e F1 usados por RP3 ativa; inativar RP3 e repetir; reativar RP3 | 409 com as mensagens da HU-007 e do PO; liberados com a rota inativa | ✅ APROVADO | B1 e F3 (somente na volta) protegidos por 409/mensagens corretas; liberados quando não havia rota ativa usando a base. Reativação com base inativa foi recusada. Base, RP1 e RP3 restauradas ativas por API. [JSON](evidencias/CT-HU011-API-011.json) |
| CT-HU011-API-012 | Auditoria das operações de escrita | Operações dos CT-002, 008 e 009; recusas dos CT-004 a 011 | Um registro por escrita efetiva; nenhum para recusa ou edição sem mudança | ✅ APROVADO | Auditados cadastro, edição, inativação e reativação: uma linha por operação efetiva, executor correto, ação/id/data e snapshots de campos/vínculos. Recusas e edição sem mudança não criaram logs. [JSON](evidencias/CT-HU011-API-012.json) |
| CT-HU011-API-013 | Acesso sem privilégio | Token de aluno; token de representante; sem token | HTTP 403 (aluno e representante) e 401 (sem token) em todas as rotas | ✅ APROVADO | As sete operações negaram 403 à conta de aluno e à conta ativa de representante, e 401 sem token; rotas e auditoria preservadas. O login da conta de representante devolve roles legados aluno/supervisor; a evidência registra esse contrato real, não um JWT fabricado nem teste do seletor visual de perfil. [JSON](evidencias/CT-HU011-API-013.json) |
| CT-HU011-API-014 | Agendamentos futuros e rota inativa no agendamento | Rota com aluno agendado para amanhã; rota inativa na agenda do aluno | HTTP 409 “Esta rota possui agendamentos pendentes e não pode ser inativada no momento.”; inativa fora da agenda | ⏳ PENDENTE | Depende da HU-013. Sem ela, marcar 🚫. |

## Detalhamento dos casos

### CT-HU011-API-001 — Listar, filtrar e consultar rotas

**Dados de entrada:** `GET /rotas-principais`; `GET /rotas-principais?incluir_inativos=true`; `GET /rotas-principais?nome=centro` e `?nome=CENTRO`; `GET /rotas-principais/{id}` de RP1, de RP2 inativa e de id `999999`; `GET /rotas-principais/opcoes`.

**Passos**

1. Antes do CT-002, enviar `GET /rotas-principais` com o banco sem rotas.
2. Executar de novo depois do CT-009 (RP1 ativa e RP2 inativa) e enviar as demais chamadas.
3. Conferir `GET /rotas-principais/opcoes` com a massa da PC-05 (B0 e F0 inativos).

**Resultado esperado**

- Banco sem rotas: HTTP `200` com lista vazia `[]`.
- Sem filtro: só rotas **ativas**, cada uma com `id`, `nome`, `horario_saida`, `horario_retorno` (`HH:MM`), `ativo`, `bairros`, `faculdades_ida` e `faculdades_volta` (AC-01).
- `incluir_inativos=true`: ativas e inativas, com `ativo` indicando o estado (AC-09).
- `nome` filtra por parte do nome, sem diferenciar maiúsculas.
- `GET /{id}` devolve a rota ativa ou inativa; id inexistente: HTTP `404` “Rota não encontrada.”.
- `/opcoes` lista só **bairros e faculdades ativos** (B0 e F0 ausentes), que são as escolhas válidas do formulário (AC-03, FA-002).

**Resultado obtido**

- Lista vazia retornou 200/[]; filtros por nome respeitam maiúsculas/minúsculas, padrão oculta inativas e /opcoes exclui B0/F0. Consulta por id existente/inativo e 404 conferidos.
- 9 chamadas HTTP; 30 verificações registradas. Status observados: 200 (8×), 404 (1×).
- Evidência: [CT-HU011-API-001.json](evidencias/CT-HU011-API-001.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Status: ✅ APROVADO.

---

### CT-HU011-API-002 — Cadastrar rota principal válida

**Dados de entrada:** `{"nome": "  Rota Centro - UFC  ", "horario_saida": "06:30", "horario_retorno": "17:30", "bairros_ids": [B1], "faculdades_ida_ids": [F1], "faculdades_volta_ids": [F1]}`.

**Passos**

1. Enviar `POST /rotas-principais` e anotar o `id` (RP1).
2. Conferir em `GET /rotas-principais/{id}`.
3. Pedir à IA para conferir a linha em `rota_principal` e as três tabelas de vínculo.

**Resultado esperado**

- HTTP `201` com `success: true`, `message` “Operação realizada com sucesso” e a rota em `data` (AC-02, AC-07).
- Rota criada **ativa**, com o nome sem os espaços das pontas e horários `06:30` / `17:30`.
- Um vínculo de bairro (B1), um de ida (F1) e um de volta (F1), cada um na sua tabela.
- Bairros e faculdades da base não são alterados.

**Resultado obtido**

- RP1 criada ativa, nome normalizado, 06:30/17:30 preservados e os três vínculos conferidos no GET e PostgreSQL.
- 2 chamadas HTTP; 11 verificações registradas. Status observados: 200 (1×), 201 (1×).
- Evidência: [CT-HU011-API-002.json](evidencias/CT-HU011-API-002.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Status: ✅ APROVADO.

---

### CT-HU011-API-003 — Vários vínculos e volta independente da ida

**Dados de entrada:**

1. RP2: `Rota Integrada`, 06:40/18:00, `bairros_ids` [B1, B2], `faculdades_ida_ids` [F1, F2, F3], `faculdades_volta_ids` [F1].
2. RP3: `Rota Centro - Faculdades`, 06:20/22:00, [B1], ida [F1, F2], volta [F3].

**Passos**

1. Cadastrar RP2 e RP3.
2. Conferir cada uma em `GET /rotas-principais/{id}` e pedir à IA para conferir as tabelas de vínculo.
3. Reler RP1 para confirmar que não mudou.

**Resultado esperado**

- HTTP `201` nas duas (AC-02).
- Todos os vínculos gravados uma única vez, sem guardar só o último item.
- **Ida e volta independentes** (AC-10; #208, item 3): RP2 com três faculdades na ida e só F1 na volta; RP3 com volta em F3, que não está na ida. A API não copia nem restringe uma lista pela outra.
- RP1 continua como no CT-002.

**Resultado obtido**

- RP2 gravou dois bairros, três faculdades na ida e uma na volta; RP3 voltou por F3 sem copiá-la da ida. RP1 permaneceu inalterada.
- 6 chamadas HTTP; 13 verificações registradas. Status observados: 200 (4×), 201 (2×).
- Evidência: [CT-HU011-API-003.json](evidencias/CT-HU011-API-003.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Status: ✅ APROVADO.

---

### CT-HU011-API-004 — Nome único entre todas as rotas (#208)

**Dados de entrada:**

1. Cadastro com o nome `Rota Centro - UFC` (igual a RP1) e os demais dados válidos.
2. Cadastro com `rota centro - ufc` e com `"   ROTA CENTRO - UFC "`.
3. Depois do CT-009 (RP2 inativa): cadastro com o nome `Rota Integrada`.
4. Depois do CT-010 (RC1 existe): cadastro de rota principal com o nome `Van Trevo`.
5. Edição de RP3 com `{"nome": "Rota Centro - UFC"}`; edição de RP1 com o próprio nome.

**Passos**

1. Enviar cada chamada.
2. Pedir à IA para conferir que nenhuma rota nova foi criada e que RP3 manteve o nome.

**Resultado esperado**

- Itens 1 a 3 e edição de RP3: HTTP `409` com `error.code` `CONFLICT` e mensagem informando que o nome já está em uso. Comparação **sem diferenciar maiúsculas, sem os espaços das pontas e contra rotas ativas e inativas** (#208, item 1).
- Item 4: HTTP `409`. O nome é único **entre rotas principais e complementares** (#208, item 1).
- Edição de RP1 com o próprio nome: HTTP `200` (não conflita consigo mesma).
- Nenhuma rota nova; RP3 mantém o nome.
- Registrar o texto exato da mensagem. A API usa “Já existe uma rota com este nome.” e o app troca por “Esta rota já está cadastrada.”: anotar a diferença, sem reprovar por ela (o requisito não define o texto).

**Resultado obtido**

- Duplicidades no mesmo tipo foram recusadas, inclusive com case/trim e rota inativa. Porém, criar principal Van Trevo, nome já usado por complementar inativa, retornou 201 e persistiu o nome duplicado entre tabelas; esperado 409.
- 8 chamadas HTTP; 23 verificações registradas. Status observados: 200 (2×), 201 (1×), 409 (5×).
- Evidência: [CT-HU011-API-004.json](evidencias/CT-HU011-API-004.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Defeito(s): [#309](https://github.com/GOUOCE/GOUCE-app/issues/309).
- Status: ❌ FALHOU.

---

### CT-HU011-API-005 — Obrigatórios, listas vazias e limites

**Dados de entrada:** a partir do corpo válido do CT-002, com outro nome:

1. Sem `nome`; com `nome` `"   "`; com `nome` `null`.
2. Sem `horario_saida`; sem `horario_retorno`.
3. `bairros_ids: []`; `faculdades_ida_ids: []`; `faculdades_volta_ids: []`; cada lista ausente.
4. Corpo `{}`.
5. Nome com 150 caracteres (controle) e com 151.
6. Edição de RP1 com `{"bairros_ids": []}` e com `{"faculdades_volta_ids": []}`.

**Passos**

1. Enviar cada variação, uma por vez.
2. Pedir à IA para conferir que nenhuma rota foi criada e que RP1 manteve os vínculos.

**Resultado esperado**

- HTTP `422` com `error.code` `REQUEST_VALIDATION_ERROR` e `error.details` indicando o campo, com mensagens em português (AC-08, FA-003):
  - “Nome da rota é obrigatório.”;
  - “Horário de saída é obrigatório.” / “Horário de retorno é obrigatório.”;
  - “Vincule ao menos um bairro.”, “Informe ao menos uma faculdade na ida.” e “Informe ao menos uma faculdade na volta.” (volta obrigatória: #208, item 3);
  - 151 caracteres: “Nome da rota deve ter no máximo 150 caracteres.”
- Corpo `{}`: um erro para cada campo obrigatório, sem erro interno.
- 150 caracteres: HTTP `201`.
- Edição esvaziando lista: HTTP `422`; RP1 mantém os vínculos.

**Resultado obtido**

- Obrigatórios, nome em branco/nulo, listas ausentes/vazias, nome 151 e edição esvaziando vínculos foram recusados com 422/campo/mensagem. Controle de 150 aceito e inativado via API após captura.
- 17 chamadas HTTP; 87 verificações registradas. Status observados: 200 (1×), 201 (1×), 422 (15×).
- Evidência: [CT-HU011-API-005.json](evidencias/CT-HU011-API-005.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Status: ✅ APROVADO.

---

### CT-HU011-API-006 — Formato e ordem dos horários (#208)

**Dados de entrada:** cadastros com outro nome e os demais dados válidos:

1. `horario_saida` `6:30`, `24:00`, `06:60`, `06:30:00`, `manhã` e o número `630`.
2. Saída `07:00` e retorno `07:00`; saída `23:00` e retorno `01:00`.
3. Saída `00:00` e retorno `23:59`; saída `13:15` e retorno `13:16`.
4. Edição de RP1 (06:30/17:30) com só `{"horario_retorno": "06:00"}` e com só `{"horario_saida": "18:00"}`.

**Passos**

1. Enviar cada variação.
2. Conferir em `GET /rotas-principais/{id}` as rotas aceitas e que RP1 não mudou nas recusas.

**Resultado esperado**

- Item 1: HTTP `422` no campo, com “Horário deve estar no formato HH:MM.” (#208, item 2b).
- Item 2: HTTP `422` no `horario_retorno`, com “Horário de retorno deve ser maior que o horário de saída.”: o retorno precisa ser **estritamente depois** da saída (#208, item 2a).
- Item 3: HTTP `201`. Não há horário mínimo nem máximo (#208, item 2b); os horários voltam iguais aos enviados, sem conversão de fuso.
- Item 4: HTTP `422`. A ordem é conferida com o horário já salvo quando só um dos dois é editado.

**Resultado obtido**

- Formatos inválidos e retorno igual/anterior recusados; edição parcial usa o horário salvo. 00:00/23:59 e 13:15/13:16 aceitos sem conversão de fuso; controles inativados via API.
- 16 chamadas HTTP; 64 verificações registradas. Status observados: 200 (4×), 201 (2×), 422 (10×).
- Evidência: [CT-HU011-API-006.json](evidencias/CT-HU011-API-006.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Status: ✅ APROVADO.

---

### CT-HU011-API-007 — Vínculo com bairro ou faculdade inativo ou inexistente

**Dados de entrada:** cadastros com outro nome e os demais dados válidos:

1. `bairros_ids: [B0]`; `faculdades_ida_ids: [F0]`; `faculdades_volta_ids: [F0]`.
2. `bairros_ids: [B1, 999999]`.
3. `bairros_ids: [B1, B1]`; `faculdades_ida_ids: [F1, F1]`.
4. `bairros_ids: [0]`, `[-1]` e `["1"]`.
5. Edição de RP1 com `{"nome": "Rota Centro - UFC Editada", "faculdades_ida_ids": [F0]}`.

**Passos**

1. Enviar cada variação.
2. Pedir à IA para conferir que nenhuma rota nova nem vínculo com B0/F0 foi gravado e que RP1 manteve nome e vínculos.

**Resultado esperado**

- Itens 1 e 2: HTTP `422` no campo da lista, com “Bairro inativo ou inexistente (ids: …).” ou “Faculdade inativa ou inexistente (ids: …).” (AC-03, FA-002, RNF-012).
- Item 3: HTTP `422` informando o item duplicado (cada bairro e faculdade só uma vez por lista).
- Item 4: HTTP `422` com “Informe IDs válidos (números inteiros positivos).”
- Item 5: HTTP `422`; **nada** da edição é aplicado (nem o nome).
- Nenhum erro `500`.

**Resultado obtido**

- Bairro/faculdade inativos ou inexistentes, IDs repetidos, zero, negativo e string foram recusados com 422. A edição com nome + vínculo inválido permaneceu atômica; nome e vínculos originais preservados.
- 11 chamadas HTTP; 60 verificações registradas. Status observados: 200 (1×), 422 (10×).
- Evidência: [CT-HU011-API-007.json](evidencias/CT-HU011-API-007.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Status: ✅ APROVADO.

---

### CT-HU011-API-008 — Editar dados e vínculos da rota

**Dados de entrada:** em RP1:

1. `{"nome": "Rota Centro - UFC Manhã"}`.
2. `{"horario_saida": "06:00", "horario_retorno": "18:00"}`.
3. `{"bairros_ids": [B2], "faculdades_ida_ids": [F2], "faculdades_volta_ids": [F3]}`.
4. `{}`.
5. `{"ativo": false}`.
6. `PATCH /rotas-principais/999999` com `{"nome": "Qualquer"}`.

**Passos**

1. Enviar cada edição e conferir em `GET /rotas-principais/{id}` depois de cada uma.
2. Pedir à IA para conferir as tabelas de vínculo depois do item 3 e reler RP2 e RP3.

**Resultado esperado**

- Itens 1 a 3: HTTP `200` “Operação realizada com sucesso”, no **mesmo id** (AC-04, AC-07). Só os campos enviados mudam; listas enviadas **substituem** as anteriores (B1 e F1 saem de RP1).
- Item 4: HTTP `422` “Informe ao menos um campo para atualização.”
- Item 5: HTTP `422` “Campo não permitido.”; a rota continua ativa. O status só muda pelas rotas de inativar/reativar.
- Item 6: HTTP `404` “Rota não encontrada.”
- RP2, RP3 e a base não mudam.

**Resultado obtido**

- Nome, horários e listas editados no mesmo id; listas substituíram as antigas. Corpo vazio/campo ativo retornaram 422 e id inexistente 404. RP2/RP3 não mudaram.
- 13 chamadas HTTP; 40 verificações registradas. Status observados: 200 (10×), 404 (1×), 422 (2×).
- Evidência: [CT-HU011-API-008.json](evidencias/CT-HU011-API-008.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Status: ✅ APROVADO.

---

### CT-HU011-API-009 — Inativar e reativar (soft delete)

**Dados de entrada:** RP2 (sem complementar e sem agendamentos): `PATCH /rotas-principais/{id}/inativar` duas vezes, `PATCH /rotas-principais/{id}/reativar` duas vezes; `PATCH /rotas-principais/999999/inativar`.

**Passos**

1. Inativar RP2 e conferir `GET /rotas-principais` (sem filtro e com `incluir_inativos=true`).
2. Pedir à IA para conferir que a linha e os vínculos continuam no banco.
3. Repetir a inativação; reativar; repetir a reativação.
4. Ao final, deixar RP2 **inativa** para os CT-001 e CT-004.

**Resultado esperado**

- Inativar e reativar: HTTP `200` “Operação realizada com sucesso”, com `data.ativo` `false` / `true` (AC-05, AC-07, RF-014).
- Rota inativa sai da listagem padrão e aparece com `incluir_inativos=true` (AC-09).
- Linha e vínculos **mantidos** no banco (soft delete).
- Repetição: HTTP `409` “Rota já está inativa.” / “Rota já está ativa.”, sem nova auditoria.
- Id inexistente: HTTP `404` “Rota não encontrada.”

**Resultado obtido**

- Inativar/reativar retornaram 200; repetições 409 e inexistente 404. Linha e vínculos preservados no PostgreSQL; RP2 foi deixada inativa.
- 8 chamadas HTTP; 18 verificações registradas. Status observados: 200 (5×), 404 (1×), 409 (2×).
- Evidência: [CT-HU011-API-009.json](evidencias/CT-HU011-API-009.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Status: ✅ APROVADO.

---

### CT-HU011-API-010 — Bloquear inativação com complementar ativa (#208)

**Dados de entrada:** criar RC1 pela API da HU-012: `POST /rotas-complementares` com `{"nome": "Van Trevo", "horario_saida": "06:00", "ponto_conexao": "Trevo do Bairro Novo", "rota_principal_id": RP1}`. Depois: `PATCH /rotas-principais/{RP1}/inativar`; `PATCH /rotas-complementares/{RC1}/inativar`; de novo `PATCH /rotas-principais/{RP1}/inativar`.

**Passos**

1. Criar RC1 e tentar inativar RP1.
2. Conferir que RP1 segue ativa.
3. Inativar RC1 e tentar inativar RP1 de novo.
4. Ao final, reativar RP1 (deixar RC1 inativa).

**Resultado esperado**

- Com RC1 ativa: HTTP `409` com a mensagem definida pelo PO: “Esta rota possui rotas complementares ativas vinculadas. Inative ou desvincule as rotas complementares antes de continuar.” (#208, item 5; RNF-012). RP1 continua ativa e sem auditoria de inativação.
- Com RC1 inativa: HTTP `200`; RP1 inativada.
- Registrar o texto exato: se o bloqueio acontecer com outro texto, o caso é ⚠️ (regra certa, mensagem diferente da decisão).

**Resultado obtido**

- Complementar ativa bloqueou a principal com 409 e sem auditoria da recusa; após inativar a complementar, a principal pôde ser inativada/reativada. Texto diferente do definido pelo PO: “Esta rota possui rotas complementares ativas e não pode ser inativada. Inative ou reassocie as complementares antes.”
- 6 chamadas HTTP; 11 verificações registradas. Status observados: 200 (4×), 201 (1×), 409 (1×).
- Evidência: [CT-HU011-API-010.json](evidencias/CT-HU011-API-010.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Defeito(s): [#311](https://github.com/GOUOCE/GOUCE-app/issues/311).
- Status: ⚠️ PARCIAL.

---

### CT-HU011-API-011 — Bairro e faculdade em rota ativa (#208)

**Dados de entrada:** RP3 ativa com B1, ida F1/F2 e volta F3:

1. `PATCH /bairros/{B1}/inativar`; `PATCH /faculdades/{F3}/inativar` (F3 só está na volta de RP3).
2. Inativar RP1 e RP3 (RP2 já inativa); repetir as duas inativações do item 1.
3. `PATCH /rotas-principais/{RP3}/reativar` com F3 inativa.
4. Reativar F3 e B1; reativar RP3 e RP1.

**Passos**

1. Enviar as chamadas na ordem e conferir o status de B1, F3 e RP3 depois de cada uma.

**Resultado esperado**

- Item 1 (rota ativa usando a base): HTTP `409`, com “Este bairro não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar.” (HU-007, CA 6) e “Esta faculdade não pode ser inativada pois pertence a uma rota ativa. Remova-a da rota antes de continuar.” (#208, item 7). A faculdade é bloqueada por estar na volta, não só na ida.
- Item 2 (nenhuma rota ativa usando a base): HTTP `200`.
- Item 3: a rota não volta a ficar ativa ligada a faculdade inativa. A API responde HTTP `409` “Esta rota possui bairro ou faculdade inativo e não pode ser reativada. Atualize os vínculos antes.” (regra do código, coerente com RNF-012; registrar como comportamento observado).
- Item 4: HTTP `200` em todas.

**Resultado obtido**

- B1 e F3 (somente na volta) protegidos por 409/mensagens corretas; liberados quando não havia rota ativa usando a base. Reativação com base inativa foi recusada. Base, RP1 e RP3 restauradas ativas por API.
- 11 chamadas HTTP; 19 verificações registradas. Status observados: 200 (8×), 409 (3×).
- Evidência: [CT-HU011-API-011.json](evidencias/CT-HU011-API-011.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Status: ✅ APROVADO.

---

### CT-HU011-API-012 — Auditoria das operações de escrita

**Dados de entrada:** operações efetivas dos CT-002 (cadastro), CT-008 (edições) e CT-009 (inativação e reativação); recusas dos CT-004 a CT-011; edição de RP1 reenviando o mesmo nome.

**Passos**

1. Pedir à IA para consultar `log_auditoria` com `entidade = 'rota_principal'` no intervalo da execução.
2. Relacionar cada operação efetiva com um registro.
3. Enviar a edição sem mudança e consultar de novo.

**Resultado esperado**

- Um registro por cadastro, edição, inativação e reativação efetiva, com o `id` do administrador A, a ação (`CRIAR`, `EDITAR`, `INATIVAR`, `REATIVAR`), o id da rota e a data/hora (AC-05, RNF-013).
- Cadastro e edição guardam o valor anterior e o novo (nome, horários e ids dos vínculos).
- Nenhum registro para operação recusada (409, 422, 404) nem para edição que não muda nada.

**Resultado obtido**

- Auditados cadastro, edição, inativação e reativação: uma linha por operação efetiva, executor correto, ação/id/data e snapshots de campos/vínculos. Recusas e edição sem mudança não criaram logs.
- 2 chamadas HTTP; 166 verificações registradas. Status observados: 200 (2×).
- Evidência: [CT-HU011-API-012.json](evidencias/CT-HU011-API-012.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Status: ✅ APROVADO.

---

### CT-HU011-API-013 — Acesso sem privilégio

**Dados de entrada:** as sete rotas da HU com o token do aluno, com o token do representante e sem o cabeçalho `Authorization`. Corpo válido e alvo RP1 nas escritas.

**Passos**

1. Enviar cada chamada com cada credencial.
2. Pedir à IA para conferir que RP1 não mudou e que não há auditoria nova.

**Resultado esperado**

- Aluno e representante: HTTP `403` em todas as rotas, inclusive as de leitura e `/opcoes` (RN-006).
- Sem token: HTTP `401`.
- Nenhuma rota criada, editada ou com status alterado.

**Resultado obtido**

- As sete operações negaram 403 à conta de aluno e à conta ativa de representante, e 401 sem token; rotas e auditoria preservadas. O login da conta de representante devolve roles legados aluno/supervisor; a evidência registra esse contrato real, não um JWT fabricado nem teste do seletor visual de perfil.
- 21 chamadas HTTP; 68 verificações registradas. Status observados: 401 (7×), 403 (14×).
- Evidência: [CT-HU011-API-013.json](evidencias/CT-HU011-API-013.json), com corpos reais, sequência/horário, verificações e consultas de persistência/auditoria.
- Status: ✅ APROVADO.

---

### CT-HU011-API-014 — Agendamentos futuros e rota inativa no agendamento

**Dados de entrada:** rota A com aluno agendado para amanhã; rota B só com agendamento passado; rota C inativa.

**Passos**

1. Conferir se a HU-013 (agendamento) está na `develop`. Se não estiver, marcar 🚫 e não preparar agenda pelo banco.
2. Com a agenda disponível: tentar inativar A e B.
3. Consultar as opções de agendamento do aluno e procurar a rota C.

**Resultado esperado**

- Rota A: HTTP `409` “Esta rota possui agendamentos pendentes e não pode ser inativada no momento.”; continua ativa (AC-06, FA-001).
- Rota B: agendamento passado não bloqueia; HTTP `200`.
- Rota C não aparece nas opções de novo agendamento; agendamentos antigos dela continuam no histórico (#208, item 8; RN-004).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 — listagem de ativas com horários | Visualiza as rotas ativas com horários | CT-001 |
| AC-02 — cadastro com vários vínculos | Cadastra rota; vários bairros e faculdades | CT-002, CT-003 |
| AC-03 / FA-002 — só base ativa | Não oferece bairro/faculdade inativos | CT-001 (`/opcoes`), CT-007 |
| AC-04 — edição | Edita nome, horários, faculdades e bairros | CT-008 |
| AC-05 / RF-014 — inativar e reativar (soft delete) | Inativa; reativa; registro permanece | CT-009 |
| AC-06 / FA-001 — agendamentos futuros | Bloqueia inativação com alunos agendados | CT-014 (depende da HU-013) |
| AC-07 — mensagem de sucesso | Cenários de sucesso | CT-002, CT-008, CT-009 |
| AC-08 / FA-003 — obrigatórios | Cadastro sem obrigatório; edição esvaziando | CT-005 |
| AC-09 — inativas | Mostrar inativos | CT-001, CT-009 |
| AC-10 — volta independente | Configura faculdades da volta diferentes da ida | CT-003 |
| AC-05 / RNF-013 — auditoria | Registra cada operação de escrita | CT-012 |
| RF-013 / #208 item 2 — horários | — (decisão do PO) | CT-006 |
| #208 item 1 — nome único | — (decisão do PO) | CT-004 |
| #208 item 3 — volta obrigatória | — (decisão do PO) | CT-005 |
| #208 item 5 / RNF-012 — complementar ativa | — (decisão do PO) | CT-010 |
| #208 item 7 — base em rota ativa | — (decisão do PO; HU-007 CA 6) | CT-011 |
| #208 item 8 / RN-004 — inativa fora do agendamento | Inativa fora do agendamento do aluno | CT-014 (depende da HU-013) |
| RN-006 — exclusividade administrativa | API nega gestão a outros perfis | CT-013 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Referências: [HU-011, seção 7.4.1](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-03/HU-011.feature), [decisões do PO (#208)](https://github.com/GOUOCE/GOUCE-app/issues/208), [decisões do épico 02 (#207)](https://github.com/GOUOCE/GOUCE-app/issues/207) e [suíte de UI](../ui/UI-HU-011.md).
- **O que mudou desde o planejamento anterior** (base `5554bc90`, 24/10/2026): o PO respondeu a #208 e confirmou todas as sugestões; os requisitos passaram a listar só ativas com a chave “Mostrar inativos”, auditoria das quatro operações, nome obrigatório e a mensagem de bloqueio por agendamentos; e o backend de rotas entrou na `develop`. Os casos agora usam o contrato real e as regras decididas, sem “a confirmar”.
- **Riscos mapeados no código** (backend em `backend/src/modulos/rotas/`, `develop` `7c3d72d8`), que orientaram a escolha dos casos:
  - o nome é conferido só entre **rotas principais**; uma principal com o nome de uma complementar é aceita, o que contraria o item 1 da #208 (CT-004);
  - a mensagem de bloqueio por complementar ativa é “Esta rota possui rotas complementares ativas e não pode ser inativada. Inative ou reassocie as complementares antes.”, diferente do texto definido pelo PO (CT-010);
  - a checagem de agendamentos futuros sempre responde “sem agendamentos” até a HU-013 existir (`TODO(HU-013)` no repository): o bloqueio do AC-06 nunca dispara hoje (CT-014);
  - a reativação de rota com bairro ou faculdade inativo é bloqueada; a regra não está no requisito, mas evita vínculo inválido (CT-011);
  - na edição, vínculos que já existiam podem ser mantidos mesmo que a base tenha sido inativada depois; só vínculos novos exigem registro ativo (CT-007, CT-008);
  - a rota vincula **bairros**, não pontos de parada; o ponto é considerado “em rota ativa” pelo bairro dele.
- Diferente do épico 02, a API **recusa** o campo `ativo` na edição (`extra="forbid"`): o CT-008 confirma isso.
- Ao final, deixar RP1 e RP3 ativas, RP2 e RC1 inativas e a base (B1, F1, F3) ativa, sem apagar registros.
- Ocultar senhas e tokens nas evidências.
