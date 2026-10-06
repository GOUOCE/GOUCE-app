# Testes manuais de API — HU-006 — Gerenciamento de Administradores

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Autenticação e Gestão de Conta |
| Funcionalidade | HU-006 — Gerenciamento de Administradores |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial |
| Endpoints | `GET /administradores`, `POST /administradores`, `PATCH /administradores/{id}` e `PATCH /administradores/{id}/inativar` — `application/json`, com token de administrador |
| Ambiente | A preencher — URL e commit testado |
| Total de casos | 9 |
| Última execução | Não realizada |
| Testador | A definir |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 9 | 0 | 0 | 9 |

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
| CT-HU006-API-001 | Listar administradores | Sem filtro; `ativo=true`; `ativo=false` | HTTP 200; lista com ativos e inativos; filtro respeitado | ⏳ PENDENTE | Não executado. |
| CT-HU006-API-002 | Criar administrador válido | Nome e e-mail novos | HTTP 201; criado ativo; senha enviada por e-mail; login funciona | ⏳ PENDENTE | Não executado. |
| CT-HU006-API-003 | Criação rejeitada | E-mail de aluno; e-mail de admin; nome `Ab`; e-mail `carlos@` | HTTP 409 com a mensagem do AC-03; 422 nos inválidos; nada criado | ⏳ PENDENTE | Não executado. |
| CT-HU006-API-004 | Editar administrador | Nome novo; e-mail em uso; id inexistente | HTTP 200 “Operação realizada com sucesso”; 409; 404 | ⏳ PENDENTE | Não executado. |
| CT-HU006-API-005 | Inativar outro administrador | `id` do administrador B | HTTP 200; `ativo: false`; registro mantido; auditoria gravada; B não entra | ⏳ PENDENTE | Não executado. |
| CT-HU006-API-006 | Auto-inativação bloqueada | `id` do administrador A | HTTP 409 “Não é possível inativar a conta atualmente em uso.” | ⏳ PENDENTE | Não executado. |
| CT-HU006-API-007 | Acesso sem privilégio | Token de aluno; sem token | HTTP 403 com aluno; 401 sem token; em todas as rotas | ⏳ PENDENTE | Não executado. |
| CT-HU006-API-008 | E-mail com espaços e maiúsculas | `" Carla.Mendes@Example.com "` | HTTP 201; salvo como `carla.mendes@example.com`; duplicado detectado sem diferenciar maiúsculas | ⏳ PENDENTE | Não executado. |
| CT-HU006-API-009 | Sessão do administrador inativado | Token de B emitido antes do CT-005 | HTTP 401/403 nas rotas administrativas após a inativação | ⏳ PENDENTE | Não executado. |

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Referências: [HU-006, seção 7.2.6](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-01/HU-006.feature) e [suíte de UI](../ui/UI-HU-006.md).
- A API também tem `POST /administradores/promover` (transformar um aluno aprovado em administrador). Essa rota não está no requisito da HU-006 e fica fora desta rodada; levar ao líder se deve ganhar casos próprios.
- Divergência a observar: o requisito pede “Operação realizada com sucesso” para todas as operações, mas a criação responde uma mensagem sobre o envio da senha. Registrar o texto exato no CT-002.
- A senha temporária é gerada pelo sistema e enviada por e-mail; nunca registrá-la nas evidências.
- Ao final, manter o administrador B inativo (ou removê-lo pelo líder) para não interferir em outras suítes.
