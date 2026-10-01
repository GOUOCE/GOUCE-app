# Testes manuais de API — HU-005 — Edição de Perfil do Aluno

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Autenticação e Gestão de Conta |
| Funcionalidade | HU-005 — Edição de Perfil do Aluno |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial |
| Endpoints | `GET /usuarios/me`, `PATCH /usuarios/me` (telefone e bairro) e `PATCH /usuarios/me/email` — `application/json`, com token de aluno |
| Ambiente | A preencher — URL e commit testado |
| Total de casos | 7 |
| Última execução | Não realizada |
| Testador | Radlei Doroth |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 7 | 0 | 0 | 7 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API e banco disponíveis. Usar Postman, Insomnia ou Swagger em `/docs`, com a URL do ambiente. |
| PC-02 | Ter dois alunos **ativos**: **aluno A** (o testado) e **aluno B** (dono de um e-mail já em uso). Ter também um token de administrador. |
| PC-03 | Obter o `token_acesso` do aluno A por `POST /auth/login` (ver HU-002) e enviá-lo em `Authorization: Bearer <token>`. Anotar senha atual, e-mail, telefone e bairro do aluno A. |
| PC-04 | Usar dados fictícios, um e-mail novo por tentativa de alteração bem-sucedida e alterar somente o dado indicado em cada caso. |

**Dados de referência**

| Campo | Valor |
| --- | --- |
| telefone válido | 85988887777 |
| bairro_id válido | Aldeota |
| novo e-mail | qa.hu005.novo@example.com |

## Resumo da execução

Executar na ordem abaixo. São **7 casos essenciais**; o CT-005 troca o e-mail do aluno A, então rodar por último os casos que dependem do e-mail original.

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU005-API-001 | Consultar o próprio perfil | Token do aluno A | HTTP 200 com os dados cadastrais atuais | ⏳ PENDENTE | Não executado. |
| CT-HU005-API-002 | Atualizar telefone e bairro | `telefone` e `bairro_id` válidos; depois só um dos dois | HTTP 200; dados persistidos | ⏳ PENDENTE | Não executado. |
| CT-HU005-API-003 | Telefone ou bairro inválidos | Telefone curto, com letras e DDD inexistente; bairro em branco | HTTP 400; nada alterado | ⏳ PENDENTE | Não executado. |
| CT-HU005-API-004 | Campos não editáveis | `curso`, `faculdade_id` e `nome` em `PATCH /usuarios/me` | Rejeitar; dados acadêmicos inalterados | ⏳ PENDENTE | Não executado. |
| CT-HU005-API-005 | Alterar e-mail com senha correta | Novo e-mail e senha atual | HTTP 200; login com o novo e-mail | ⏳ PENDENTE | Não executado. |
| CT-HU005-API-006 | Alteração de e-mail rejeitada | Senha incorreta; e-mail de outro usuário; e-mail inválido; e-mail igual ao atual | HTTP 400, 409 ou 422; e-mail inalterado | ⏳ PENDENTE | Não executado. |
| CT-HU005-API-007 | Acesso sem permissão | Sem token; token de administrador | HTTP 401; HTTP 403 | ⏳ PENDENTE | Não executado. |

## Detalhamento dos casos

### CT-HU005-API-001 — Consultar o próprio perfil

**Dados de entrada:** token do aluno A.

**Passos**

1. Enviar `GET /usuarios/me`.
2. Comparar os campos com o cadastro do aluno A.

**Resultado esperado**

- HTTP `200` com `id`, `nome`, `email`, `telefone`, `status_cadastro`, `faculdade_id`, `campus`, `bairro_id`, `curso`, `semestre_atual`, `periodo_ingresso` e `turno_curso` iguais aos cadastrados.
- Os dados retornados são somente os do próprio aluno. Não retornar senha nem hash.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU005-API-002 — Atualizar telefone e bairro

**Dados de entrada:** `{"telefone": "85988887777", "bairro_id": "Aldeota"}`; depois `{"telefone": "85977776666"}` isolado.

**Passos**

1. Enviar `PATCH /usuarios/me` com os dois campos.
2. Enviar `PATCH /usuarios/me` apenas com `telefone`.
3. Após cada envio, conferir com `GET /usuarios/me`.

**Resultado esperado**

- Passo 1: HTTP `200`, retornando `telefone` e `bairro_id` novos; `GET /usuarios/me` os reflete.
- Passo 2: HTTP `200`; o telefone muda e o bairro continua `Aldeota` (atualização parcial).
- Nenhum outro dado do aluno foi alterado.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU005-API-003 — Telefone ou bairro inválidos

**Dados de entrada:** tentativas isoladas em `PATCH /usuarios/me`: `telefone=1234`; `telefone=85abc123456`; `telefone=00999990000` (DDD inexistente); `bairro_id="   "` (só espaços).

**Passos**

1. Enviar cada tentativa separadamente.
2. Conferir status e corpo e, ao final, `GET /usuarios/me`.

**Resultado esperado**

- HTTP `400`, `success: false`, `error.code: "VALIDATION_ERROR"` e `error.details` identificando `telefone` ou `bairro_id`, conforme AC-05.
- Nenhum `500` e nenhuma alteração: telefone e bairro iguais aos do CT-002.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU005-API-004 — Campos não editáveis

**Dados de entrada:** três tentativas em `PATCH /usuarios/me`: `{"curso": "Medicina"}`; `{"faculdade_id": "UECE"}`; `{"nome": "Outro Nome"}`.

**Passos**

1. Enviar cada tentativa separadamente.
2. Conferir a resposta e comparar `GET /usuarios/me` com o CT-001.

**Resultado esperado**

- Rejeitar as três com HTTP `422` (campo não permitido neste endpoint) e nenhum dado acadêmico ou de identificação alterado, conforme AC-06.
- Se a API responder `200`, conferir no `GET` se o valor mudou e registrar como falha de segurança.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU005-API-005 — Alterar e-mail com senha correta

**Dados de entrada:** `{"novo_email": "qa.hu005.novo@example.com", "senha": "<senha atual do aluno A>"}`.

**Passos**

1. Enviar `PATCH /usuarios/me/email`.
2. Fazer `POST /auth/login` com o novo e-mail e a senha atual.
3. Fazer `POST /auth/login` com o e-mail antigo.

**Resultado esperado**

- HTTP `200` com `id`, `nome_completo`, `email` (o novo, em minúsculas) e `telefone`.
- Login com o novo e-mail: HTTP `200`. Login com o e-mail antigo: HTTP `401`.
- Não retornar senha nem hash.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU005-API-006 — Alteração de e-mail rejeitada

**Dados de entrada:** quatro tentativas em `PATCH /usuarios/me/email`: senha incorreta com e-mail novo; e-mail do aluno B com a senha correta; `novo_email=maria@` com a senha correta; e-mail igual ao atual do aluno A com a senha correta.

**Passos**

1. Enviar cada tentativa separadamente.
2. Conferir status, `error.code` e o campo indicado em `error.details`.
3. Conferir com `GET /usuarios/me` que o e-mail não mudou.

**Resultado esperado**

- Senha incorreta: HTTP `400`, `VALIDATION_ERROR`, campo `senha`.
- E-mail do aluno B: HTTP `409`, `error.code: "EMAIL_ALREADY_REGISTERED"` (AC-03).
- E-mail inválido: HTTP `422`, `REQUEST_VALIDATION_ERROR`.
- E-mail igual ao atual: HTTP `400`, `VALIDATION_ERROR`, campo `novo_email`.
- E-mail do aluno A inalterado nos quatro casos.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU005-API-007 — Acesso sem permissão

**Dados de entrada:** `GET /usuarios/me` e `PATCH /usuarios/me` sem token; os mesmos com token de administrador.

**Passos**

1. Enviar as duas requisições sem cabeçalho de autorização.
2. Repetir com o token do administrador.

**Resultado esperado**

- Sem token: HTTP `401`, sem dados.
- Token de administrador: HTTP `403`, sem dados e sem alterar cadastro algum.
- O aluno só edita o próprio perfil; a API não aceita `id` de outro usuário nessas rotas.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Referências: [HU-005, seção 7.2.5](../../../../docs/requisitos.md) e [contrato atual das rotas](../../../../backend/src/modulos/usuarios/interface/http/usuario_routes.py). Conferir a versão implantada; esta suíte não foi executada durante sua criação.
- Divergência de requisito: o AC-02 e o AC-04 permitem editar o e-mail mediante senha, mas o AC-06 e o FA-002 pedem o e-mail somente leitura. A API atual implementa a troca com senha (CT-005); levar a dúvida ao líder antes de classificar como defeito.
- A mensagem do AC-03 ("Este e-mail já está em uso no sistema.") é exibida pelo app; na API, validar status e código. Falha de comunicação (AC-07), campos desabilitados na tela, limites extensos (`telefone` com mais de 20 caracteres) e a troca do e-mail com o token anterior ficam para outra rodada ou para a suíte de UI. Aprovar estes 7 casos não significa cobertura total da HU.
- Restaurar e-mail, telefone e bairro originais do aluno A ao final, para não afetar outras suítes.
- Registrar status e resposta obtidos em cada CT; ocultar senhas, tokens e dados pessoais nas evidências.
