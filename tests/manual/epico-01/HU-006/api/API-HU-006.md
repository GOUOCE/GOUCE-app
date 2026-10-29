# Testes manuais de API — HU-006 — Gerenciamento de Administradores

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Autenticação e Gestão de Conta |
| Funcionalidade | HU-006 — Gerenciamento de Administradores |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial |
| Endpoints | `GET /administradores`, `POST /administradores`, `PATCH /administradores/{id}` e `PATCH /administradores/{id}/inativar` — `application/json`, com token de administrador |
| Ambiente | Docker local isolado — `http://localhost:8001` — branch `feature/testes-api-hu-006` — commit `a93d6e5d`; e-mails capturados pelo Mailpit |
| Total de casos | 9 |
| Última execução | 2026-10-06 — execução dos CT-HU006-API-001 a 009 |
| Testador | Cauan Ricardo — execução com apoio de IA (Claude Code) |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: |
| ⚠️ Execução parcial | 9 | 8 | 0 | 1 | 0 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API, banco e serviço de e-mail (SMTP) disponíveis. Usar Postman, Insomnia ou Swagger em `/docs`. **Sem SMTP, o `POST /administradores` responde `503` e não cria o administrador**: em ambiente local, usar uma caixa de teste (ex.: Mailpit) para receber a senha temporária. |
| PC-02 | Token do **administrador A** (o executor): `POST /auth/login` com o administrador padrão do seed. Anotar o `id` dele (aparece no `GET /administradores`). |
| PC-03 | Token de um **aluno ativo**, para o CT-007, e o e-mail de um aluno já cadastrado, para o CT-003. |
| PC-04 | Dados fictícios do novo administrador: nome `Carlos Andrade`, e-mail `carlos.andrade@example.com` (caixa de teste). O CT-002 cria esse administrador (**B**), usado nos casos seguintes. |
| PC-05 | Acesso de leitura ao banco (ou a quem possa consultá-lo) para conferir o log de auditoria no CT-005: tabela `log_auditoria`. |

## Resumo da execução

Executar na ordem abaixo. São **9 casos essenciais**. Todas as chamadas usam o token do administrador A, exceto onde indicado.

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU006-API-001 | Listar administradores | Sem filtro; `ativo=true`; `ativo=false` | HTTP 200; lista com ativos e inativos; filtro respeitado | ✅ APROVADO | HTTP 200 nas três chamadas, com `id`, `nome`, `email`, `ativo` e `criado_em`, sem senha nem hash. Com um inativo cadastrado: sem filtro, ativos e inativos; `ativo=true`, só ativos; `ativo=false`, só inativos. |
| CT-HU006-API-002 | Criar administrador válido | Nome e e-mail novos | HTTP 201; criado ativo; senha enviada por e-mail; login funciona | ✅ APROVADO | HTTP 201, administrador B criado ativo; e-mail “Acesso de administrador - GOUCE” recebido com a senha temporária; login de B com perfil `administrador`. A mensagem de sucesso fala do envio da senha, não “Operação realizada com sucesso”. |
| CT-HU006-API-003 | Criação rejeitada | E-mail de aluno; e-mail de admin; nome `Ab`; e-mail `carlos@` | HTTP 409 com a mensagem do AC-03; 422 nos inválidos; nada criado | ⚠️ PARCIAL | E-mail de aluno e de administrador: HTTP 409 com a mensagem do AC-03. Nome `Ab` e e-mail `carlos@`: HTTP 422 bloqueado, mas com o erro cru do framework em inglês (`String should have at least 3 characters`, `value is not a valid email address…`). Nenhum administrador criado. |
| CT-HU006-API-004 | Editar administrador | Nome novo; e-mail em uso; id inexistente | HTTP 200 “Operação realizada com sucesso”; 409; 404 | ✅ APROVADO | Nome: HTTP 200 “Operação realizada com sucesso” e nome atualizado; e-mail de aluno: HTTP 409 com a mensagem do AC-03, e-mail inalterado; id inexistente: HTTP 404 “Administrador não encontrado.” |
| CT-HU006-API-005 | Inativar outro administrador | `id` do administrador B | HTTP 200; `ativo: false`; registro mantido; auditoria gravada; B não entra | ✅ APROVADO | HTTP 200 “Operação realizada com sucesso”, `ativo: false`; B continua listado entre os inativos; `log_auditoria` com `usuario_id` 1, ação `INATIVAR`, entidade `administrador` 3 e data/hora; login de B recusado (HTTP 401 “Usuário administrativo inativo.”). |
| CT-HU006-API-006 | Auto-inativação bloqueada | `id` do administrador A | HTTP 409 “Não é possível inativar a conta atualmente em uso.” | ✅ APROVADO | HTTP 409 “Não é possível inativar a conta atualmente em uso.”; A continua ativo e nenhum registro de auditoria novo. |
| CT-HU006-API-007 | Acesso sem privilégio | Token de aluno; sem token | HTTP 403 com aluno; 401 sem token; em todas as rotas | ✅ APROVADO | Token de aluno: HTTP 403 nas quatro rotas; sem token: HTTP 401 nas quatro; nenhuma alteração gravada. |
| CT-HU006-API-008 | E-mail com espaços e maiúsculas | `" Carla.Mendes@Example.com "` | HTTP 201; salvo como `carla.mendes@example.com`; duplicado detectado sem diferenciar maiúsculas | ✅ APROVADO | HTTP 201 com `data.email: "carla.mendes@example.com"`; o mesmo e-mail em minúsculas e em maiúsculas foi recusado com HTTP 409. |
| CT-HU006-API-009 | Sessão do administrador inativado | Token de B emitido antes do CT-005 | HTTP 401/403 nas rotas administrativas após a inativação | ✅ APROVADO | Após a inativação, o token de B (que respondia 200 antes) recebeu HTTP 401 “Sessão inválida ou expirada” em `GET /administradores` e em `PATCH /administradores/1`; nada foi alterado. |

## Detalhamento dos casos

### CT-HU006-API-001 — Listar administradores

**Dados de entrada:** três chamadas: `GET /administradores`; `GET /administradores?ativo=true`; `GET /administradores?ativo=false`.

**Passos**

1. Enviar as três chamadas com o token do administrador A.
2. Conferir os campos de cada item e o efeito do filtro.

**Resultado esperado**

- HTTP `200` nas três, com uma lista de objetos `id`, `nome`, `email`, `ativo` e `criado_em` (AC-01).
- Sem filtro: ativos e inativos. `ativo=true`: só `ativo: true`. `ativo=false`: só `ativo: false` (AC-08).
- Nenhum campo sensível (senha, hash) na resposta.

**Resultado obtido**

- No início (só o administrador A): sem filtro e `ativo=true` → `[A]`; `ativo=false` → `[]`. HTTP `200` nas três.
- Depois do CT-005 (B inativo): sem filtro → `[A (ativo), B (inativo)]`; `ativo=true` → `[A]`; `ativo=false` → `[B]`. ✅
- Campos de cada item: `id`, `nome`, `email`, `ativo` e `criado_em`; nenhum campo de senha ou hash. ✅
- Status: ✅ Aprovado.

---

### CT-HU006-API-002 — Criar administrador válido

**Dados de entrada:** `{"nome": "Carlos Andrade", "email": "carlos.andrade@example.com"}`.

**Passos**

1. Enviar `POST /administradores`.
2. Abrir a caixa de teste e localizar o e-mail com a senha temporária (não registrar a senha nas evidências).
3. Fazer `POST /auth/login` com o e-mail e a senha temporária.
4. Conferir o novo registro em `GET /administradores`.

**Resultado esperado**

- HTTP `201`, `success: true`, `message` informando que a senha foi gerada e enviada por e-mail, e `data` com `ativo: true` (AC-02).
- E-mail recebido com a senha temporária.
- Login do administrador B com HTTP `200` e perfil `administrador`.
- O administrador B aparece na listagem.

**Resultado obtido**

- `POST /administradores` com `Carlos Andrade` / `carlos.andrade@example.com`: HTTP `201`, `success: true`, `data.id: 3`, `data.ativo: true`. ✅
- Mensagem: “Administrador criado com sucesso. A senha foi gerada automaticamente e enviada por e-mail.” O requisito pede “Operação realizada com sucesso” para as operações; aqui o texto é outro, mais informativo (registrado nas observações).
- Mailpit: e-mail “Acesso de administrador - GOUCE” para `carlos.andrade@example.com`, com o e-mail de acesso, a senha temporária e a orientação “Altere sua senha após o primeiro acesso.” (senha não registrada). ✅
- `POST /auth/login` de B com a senha temporária: HTTP `200`, `role: administrador`. ✅
- B aparece em `GET /administradores`. ✅
- Status: ✅ Aprovado.

---

### CT-HU006-API-003 — Criação rejeitada

**Dados de entrada:** quatro tentativas em `POST /administradores`:

1. E-mail de um aluno já cadastrado (PC-03), nome `Pedro Lima`.
2. E-mail do administrador B (`carlos.andrade@example.com`), nome `Carlos Andrade Filho`.
3. Nome `Ab` (primeiro nome com menos de 3 letras), e-mail novo.
4. E-mail `carlos@`, nome `Pedro Lima`.

**Passos**

1. Enviar cada tentativa separadamente.
2. Ao final, conferir em `GET /administradores` que nenhum registro novo foi criado.

**Resultado esperado**

- Tentativas 1 e 2: HTTP `409` com “Este e-mail já está em uso por outro usuário no sistema.” (AC-03, FA-001).
- Tentativas 3 e 4: HTTP `422`, com o campo e o motivo, em português.
- Nenhum `500` e nenhum administrador criado.

**Resultado obtido**

- E-mail de aluno (`qa.hu006.aluno@example.com`): HTTP `409`, “Este e-mail já está em uso por outro usuário no sistema.” ✅
- E-mail do administrador B: HTTP `409`, mesma mensagem. ✅
- Nome `Ab`: HTTP `422`, mas no formato cru do framework e em inglês: `{"detail":[{"type":"string_too_short","loc":["body","nome"],"msg":"String should have at least 3 characters",…}]}`. ⚠️
- E-mail `carlos@`: HTTP `422`, também cru e em inglês: `value is not a valid email address: There must be something after the @-sign.` ⚠️
- Nenhum administrador criado e nenhum e-mail enviado nas quatro tentativas. ✅
- Status: ⚠️ Parcial — [BUG-HU006-API-001](issues/BUG-HU006-API-001-erros-de-validacao-em-ingles.md).

---

### CT-HU006-API-004 — Editar administrador

**Dados de entrada:** três tentativas em `PATCH /administradores/{id}`:

1. `id` do administrador B, `{"nome": "Carlos Andrade Filho"}`.
2. `id` do administrador B, `{"email": "<e-mail de um aluno cadastrado>"}`.
3. `id` inexistente (ex.: `999999`), `{"nome": "Teste Inexistente"}`.

**Passos**

1. Enviar cada tentativa.
2. Conferir o administrador B em `GET /administradores`.

**Resultado esperado**

- Tentativa 1: HTTP `200`, `message: "Operação realizada com sucesso"` e `data.nome` atualizado (AC-04).
- Tentativa 2: HTTP `409` com a mensagem do AC-03; e-mail de B não muda.
- Tentativa 3: HTTP `404` “Administrador não encontrado.”

**Resultado obtido**

- `PATCH /administradores/3` com `{"nome": "Carlos Andrade Filho"}`: HTTP `200`, “Operação realizada com sucesso”, `data.nome` atualizado. ✅
- `PATCH /administradores/3` com o e-mail de um aluno: HTTP `409`, mensagem do AC-03; o e-mail de B continuou `carlos.andrade@example.com`. ✅
- `PATCH /administradores/999999`: HTTP `404`, “Administrador não encontrado.” ✅
- Status: ✅ Aprovado.

---

### CT-HU006-API-005 — Inativar outro administrador

**Dados de entrada:** `PATCH /administradores/{id do administrador B}/inativar`, com o token do administrador A.

**Passos**

1. Enviar a inativação.
2. Conferir B em `GET /administradores?ativo=false`.
3. Consultar a tabela `log_auditoria` pelo registro mais recente da entidade `administrador`.
4. Tentar `POST /auth/login` com as credenciais de B.

**Resultado esperado**

- HTTP `200`, `message: "Operação realizada com sucesso"` e `data.ativo: false` (AC-05, AC-07).
- B continua na listagem, agora entre os inativos: o registro não é apagado (soft delete).
- Log de auditoria com o usuário executor (administrador A), a ação `INATIVAR` e a data/hora (AC-05).
- Login de B recusado.

**Resultado obtido**

- `PATCH /administradores/3/inativar` com o token de A: HTTP `200`, “Operação realizada com sucesso”, `data.ativo: false`. ✅
- B continua em `GET /administradores?ativo=false`: soft delete, o registro não foi apagado. ✅
- `log_auditoria`: novo registro com `usuario_id = 1` (administrador A), `acao = INATIVAR`, `entidade = administrador`, `entidade_id = 3`, `valor_anterior = ativo`, `valor_novo = inativo` e `criado_em` preenchido. ✅
- Login de B: HTTP `401`, “Usuário administrativo inativo.” ✅
- Status: ✅ Aprovado.

---

### CT-HU006-API-006 — Auto-inativação bloqueada

**Dados de entrada:** `PATCH /administradores/{id do administrador A}/inativar`, com o token do próprio administrador A.

**Passos**

1. Enviar a inativação.
2. Conferir A em `GET /administradores`.

**Resultado esperado**

- HTTP `409` com “Não é possível inativar a conta atualmente em uso.” (AC-06, FA-002).
- A continua `ativo: true` e sem novo registro de auditoria.

**Resultado obtido**

- `PATCH /administradores/1/inativar` com o token do próprio A: HTTP `409`, “Não é possível inativar a conta atualmente em uso.” ✅
- A continuou `ativo: true`, e a tabela `log_auditoria` não ganhou registro novo. ✅
- Status: ✅ Aprovado.

---

### CT-HU006-API-007 — Acesso sem privilégio

**Dados de entrada:** as quatro rotas da suíte, primeiro com o token de um aluno ativo, depois sem o cabeçalho `Authorization`.

**Passos**

1. Chamar `GET /administradores`, `POST /administradores`, `PATCH /administradores/{id de B}` e `PATCH /administradores/{id de B}/inativar` com o token do aluno.
2. Repetir sem token.
3. Conferir que nada mudou em `GET /administradores` (com o token do administrador A).

**Resultado esperado**

- Com token de aluno: HTTP `403` em todas as rotas (AC-09, FA-003, RN-006).
- Sem token: HTTP `401` em todas as rotas.
- Nenhum dado de administrador na resposta e nenhuma alteração gravada.

**Resultado obtido**

- Token do aluno ativo: `GET /administradores` → 403; `POST /administradores` → 403; `PATCH /administradores/3` → 403; `PATCH /administradores/3/inativar` → 403. ✅
- Sem token: HTTP `401` nas mesmas quatro rotas. ✅
- A listagem, conferida com o token de A, não mudou. ✅
- Status: ✅ Aprovado.

---

### CT-HU006-API-008 — E-mail com espaços e maiúsculas

**Dados de entrada:** `POST /administradores` com `{"nome": "Carla Mendes", "email": " Carla.Mendes@Example.com "}`; depois outro `POST` com `{"nome": "Carla Mendes Filha", "email": "carla.mendes@example.com"}`.

**Passos**

1. Enviar a primeira criação e conferir o `data.email`.
2. Enviar a segunda criação, com o mesmo e-mail em minúsculas.
3. Ao final, inativar Carla Mendes.

**Resultado esperado**

- Primeira: HTTP `201` e `data.email: "carla.mendes@example.com"` (sem espaços, em minúsculas).
- Segunda: HTTP `409` com a mensagem do AC-03 (a unicidade não diferencia maiúsculas nem espaços).
- Regressão do padrão já encontrado em outras telas (#51, #97, #122).

**Resultado obtido**

- `POST /administradores` com `" Carla.Mendes@Example.com "`: HTTP `201`, `data.email: "carla.mendes@example.com"` (sem espaços e em minúsculas). ✅
- `carla.mendes@example.com` e `CARLA.MENDES@EXAMPLE.COM`: HTTP `409` com a mensagem do AC-03. ✅
- Carla Mendes foi inativada ao final.
- Status: ✅ Aprovado.

---

### CT-HU006-API-009 — Sessão do administrador inativado

**Dados de entrada:** token do administrador B obtido no CT-002, **antes** da inativação do CT-005.

**Passos**

1. Depois do CT-005, chamar `GET /administradores` com o token antigo de B.
2. Chamar `PATCH /administradores/{id de A}` com o token antigo de B.

**Resultado esperado**

- HTTP `401` ou `403` nas duas chamadas: o administrador inativado perde o acesso imediatamente, mesmo com um token ainda dentro da validade (RN-006).
- Nenhuma alteração gravada.

**Resultado obtido**

- Antes da inativação, o token de B respondia HTTP `200` em `GET /administradores`.
- Após o CT-005, com o mesmo token: `GET /administradores` → HTTP `401` “Sessão inválida ou expirada”; `PATCH /administradores/1` → HTTP `401`. ✅
- Nenhuma alteração gravada (o nome de A não mudou). ✅
- Status: ✅ Aprovado.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-HU006-API-003 | Erros de validação (nome curto, e-mail inválido) voltam no formato cru do framework e em inglês. | [BUG-HU006-API-001](issues/BUG-HU006-API-001-erros-de-validacao-em-ingles.md) — #141 |

## Observações gerais

- Referências: [HU-006, seção 7.2.6](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-01/HU-006.feature) e [suíte de UI](../ui/UI-HU-006.md).
- A API também tem `POST /administradores/promover` (transformar um aluno aprovado em administrador). Essa rota não está no requisito da HU-006 e fica fora desta rodada; levar ao líder se deve ganhar casos próprios.
- Divergência a observar: o requisito pede “Operação realizada com sucesso” para todas as operações, mas a criação responde uma mensagem sobre o envio da senha. Registrar o texto exato no CT-002.
- A senha temporária é gerada pelo sistema e enviada por e-mail; nunca registrá-la nas evidências.
- Execução em banco isolado e limpo, com Mailpit capturando os e-mails; massa criada pela API (aluno ativo `qa.hu006.aluno@example.com` e administradores B e Carla Mendes). Nenhum dado do ambiente de desenvolvimento foi alterado.
- Formato dos erros: as rotas de administradores respondem `{"detail": …}` (409, 404, 422), enquanto outras rotas da API usam o envelope `{"success": false, "error": {…}}`. Registrado no BUG-HU006-API-001.
- Fora do escopo: o e-mail orienta “Altere sua senha após o primeiro acesso”, mas não há troca obrigatória no primeiro login, e a senha temporária trafega em texto no e-mail. Levar ao líder.
- Ao final, manter o administrador B inativo (ou removê-lo pelo líder) para não interferir em outras suítes.
