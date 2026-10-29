# Testes manuais de API — HU-004 — Recuperação de Senha

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Autenticação e Gestão de Conta |
| Funcionalidade | HU-004 — Recuperação de Senha |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial |
| Endpoints | `POST /auth/solicitar-recuperacao`, `POST /auth/validar-token` e `POST /auth/redefinir-senha` — `application/json` |
| Ambiente | Docker local isolado — `http://localhost:8001` — branch `feature/testes-api-hu-004` — commit `ff0488e4`; e-mails capturados pelo Mailpit |
| Total de casos | 7 |
| Última execução | 2026-10-05 — execução dos CT-HU004-API-001 a 007 |
| Testador | Cauan Ricardo — execução com apoio de IA (Claude Code) |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: |
| ✅ Aprovada | 7 | 7 | 0 | 0 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API, banco e serviço de e-mail (SMTP) disponíveis. Usar Postman, Insomnia ou Swagger em `/docs`. As três rotas não exigem autenticação. |
| PC-02 | Ter uma conta de aluno **ativo** cujo e-mail seja uma caixa de teste que você consiga abrir, para ler o link/token enviado. O token é salvo apenas como hash no banco; sem acesso à caixa de e-mail, os casos 3 a 7 ficam pendentes. |
| PC-03 | Anotar a senha atual da conta (`SenhaAtual1`) e definir a nova senha de teste `NovaSenha123`. |
| PC-04 | O token vale 15 minutos. Planejar o CT-007 com antecedência e não reutilizar o mesmo token entre casos, exceto onde indicado. |

## Resumo da execução

Executar na ordem abaixo. São **7 casos essenciais**; cada solicitação válida gera um token novo e invalida os anteriores da mesma conta.

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU004-API-001 | Solicitação com e-mail cadastrado | E-mail da conta de teste | HTTP 200; mensagem genérica; e-mail recebido com token | ✅ PASSOU | HTTP 200, mensagem genérica; e-mail recebido; token fora da resposta. |
| CT-HU004-API-002 | E-mail não cadastrado ou inválido | E-mail inexistente; e-mail `maria@`; corpo sem e-mail | Mesma resposta do CT-001 para o inexistente; erro de validação nos demais | ✅ PASSOU | Inexistente igual ao CT-001; `maria@` 400; corpo vazio 422. Ver observações sobre tempo de resposta. |
| CT-HU004-API-003 | Validação do token | Token recebido; depois token adulterado | HTTP 200 `valido: true`; HTTP 400 `TOKEN_INVALID` | ✅ PASSOU | 200 `valido: true` duas vezes; adulterado 400 `TOKEN_INVALID`. |
| CT-HU004-API-004 | Senha fora das regras | `Abcd123`, `abcdefg1`, `ABCDEFG1`, `Abcdefgh` | Rejeitar conforme AC-05; token continua válido | ✅ PASSOU | Quatro senhas rejeitadas com 400 `PASSWORD_INVALID`; token e senha atual preservados. |
| CT-HU004-API-005 | Redefinição válida | Token válido e `NovaSenha123` | HTTP 200; login só com a nova senha | ✅ PASSOU | 200; login com a nova senha 200 e com a antiga 401. |
| CT-HU004-API-006 | Token já utilizado ou substituído | Token do CT-005; token anterior a uma nova solicitação | HTTP 400; senha não alterada | ✅ PASSOU | Reuso 400 `TOKEN_ALREADY_USED`; token substituído rejeitado e o novo válido. |
| CT-HU004-API-007 | Token expirado | Token com mais de 15 minutos | HTTP 400 `TOKEN_EXPIRED` | ✅ PASSOU | Validar e redefinir com token vencido: 400 `TOKEN_EXPIRED`; senha mantida. |

## Detalhamento dos casos

### CT-HU004-API-001 — Solicitação com e-mail cadastrado

**Dados de entrada:** `{"email": "<e-mail da conta de teste>"}`.

**Passos**

1. Enviar `POST /auth/solicitar-recuperacao`.
2. Registrar status e JSON.
3. Abrir a caixa de e-mail de teste e localizar a mensagem. Guardar o token (parâmetro `token` do link) sem expô-lo nas evidências.

**Resultado esperado**

- HTTP `200`, `success: true` e mensagem genérica: "Se o e-mail estiver cadastrado no sistema, você receberá as instruções para redefinição de senha."
- E-mail recebido pela conta com link/código de recuperação.
- A resposta não deve conter o token.

**Resultado obtido**

- HTTP `200`, `success: true` e `message`: "Se o e-mail estiver cadastrado no sistema, você receberá as instruções para redefinição de senha.", em cerca de 70 ms.
- O e-mail "Recuperação de Senha - GOUCE" chegou na caixa do aluno de teste (Mailpit), com o link `<APP_URL>/auth/redefinir-senha?token=<token>`, o código e o aviso de validade de 15 minutos.
- A resposta não contém o token.
- Status: ✅ Aprovado.

---

### CT-HU004-API-002 — E-mail não cadastrado ou inválido

**Dados de entrada:** três tentativas: `naoexiste@example.com`; `maria@`; corpo `{}` sem e-mail.

**Passos**

1. Enviar cada tentativa separadamente.
2. Comparar a primeira resposta com a do CT-HU004-API-001.
3. Conferir que nenhuma mensagem chegou a `naoexiste@example.com` (quando houver como verificar).

**Resultado esperado**

- E-mail inexistente: HTTP `200` com **status e corpo idênticos** aos do CT-001, sem revelar se a conta existe (AC-03).
- `maria@`: HTTP `400`, `error.code: "REQUEST_VALIDATION_ERROR"` e detalhe do campo `email`.
- Corpo sem e-mail: HTTP `422`, `error.code: "REQUEST_VALIDATION_ERROR"`.
- Nenhum `500`.

**Resultado obtido**

- `naoexiste@example.com`: HTTP `200`, status e corpo idênticos aos do CT-001. Nenhum e-mail foi gerado para esse endereço.
- `maria@`: HTTP `400`, `error.code: "REQUEST_VALIDATION_ERROR"`, campo `email`, mensagem "Formato de e-mail inválido.".
- Corpo `{}`: HTTP `422`, `error.code: "REQUEST_VALIDATION_ERROR"`, campo `email`. O detalhe veio em inglês ("Field required").
- Nenhum `500`.
- Tentativa extra: o e-mail cadastrado em caixa mista e com espaço no fim também gerou o e-mail de recuperação.
- Status: ✅ Aprovado. Ver observações sobre a diferença de tempo de resposta.

---

### CT-HU004-API-003 — Validação do token

**Dados de entrada:** token do CT-001; depois o mesmo token com um caractere alterado.

**Passos**

1. Enviar `POST /auth/validar-token` com `{"token": "<token>"}`.
2. Repetir com o token adulterado.

**Resultado esperado**

- Token válido: HTTP `200`, `valido: true` e `message: "Token válido."`. A validação não consome o token.
- Token adulterado: HTTP `400`, `success: false`, `error.code: "TOKEN_INVALID"`.

**Resultado obtido**

- Token válido: HTTP `200`, `success: true`, `valido: true` e `message: "Token válido."`. A segunda validação do mesmo token também retornou `200`; a validação não consome o token.
- Token com o último caractere alterado: HTTP `400`, `success: false`, `error.code: "TOKEN_INVALID"`, mensagem "Token de recuperação inválido.".
- Observação: o token do CT-001 foi substituído pela tentativa extra do CT-002; o teste usou o token mais recente.
- Status: ✅ Aprovado.

---

### CT-HU004-API-004 — Senha fora das regras

**Dados de entrada:** uma tentativa por senha em `POST /auth/redefinir-senha`, sempre com o token do CT-001: `Abcd123` (7 caracteres), `abcdefg1` (sem maiúscula), `ABCDEFG1` (sem minúscula) e `Abcdefgh` (sem número).

**Passos**

1. Enviar `{"token": "<token>", "nova_senha": "<senha>"}` para cada senha.
2. Conferir a resposta e, ao final, tentar login com a senha atual para confirmar que nada mudou.

**Resultado esperado**

- As quatro rejeitadas com HTTP `400`, `error.code: "PASSWORD_INVALID"` e detalhe no campo `nova_senha`, conforme AC-05 (mínimo de 8 caracteres, uma maiúscula, uma minúscula e um número).
- Senha atual continua funcionando e o token permanece válido.
- O validador atual é menos restritivo (mínimo de 6 caracteres, só exige letra e número). Se alguma senha for aceita, registrar como falha **e solicitar novo token**, pois o token foi consumido; não mudar o esperado.

**Resultado obtido**

- `Abcd123`: HTTP `400`, `PASSWORD_INVALID`, campo `nova_senha`, "A senha deve ter pelo menos 8 caracteres".
- `abcdefg1`: HTTP `400`, `PASSWORD_INVALID`, "A senha deve conter pelo menos uma letra maiúscula".
- `ABCDEFG1`: HTTP `400`, `PASSWORD_INVALID`, "A senha deve conter pelo menos uma letra minúscula".
- `Abcdefgh`: HTTP `400`, `PASSWORD_INVALID`, "A senha deve conter pelo menos um número".
- Depois das quatro tentativas o token continuou válido (`/auth/validar-token` 200) e o login com a senha atual retornou `200`.
- O validador já segue o AC-05; a nota da suíte sobre ele ser menos restritivo está desatualizada.
- Status: ✅ Aprovado.

---

### CT-HU004-API-005 — Redefinição válida

**Dados de entrada:** token válido (do CT-001, ou novo se foi consumido no CT-004) e `nova_senha: "NovaSenha123"`.

**Passos**

1. Enviar `POST /auth/redefinir-senha`.
2. Fazer `POST /auth/login` com a nova senha.
3. Fazer `POST /auth/login` com a senha antiga.

**Resultado esperado**

- HTTP `200`, `success: true` e `message: "Senha alterada com sucesso."`.
- Login com a nova senha: HTTP `200`. Login com a senha antiga: HTTP `401` (AC-09).
- A senha não deve aparecer em nenhuma resposta.

**Resultado obtido**

- HTTP `200`, `success: true`, `message: "Senha alterada com sucesso."`. A senha não aparece na resposta.
- Login com `NovaSenha123`: HTTP `200`. Login com a senha antiga: HTTP `401` ("Email ou senha inválidos").
- Conferência no banco: a senha está gravada como hash `argon2id` (RNF-002).
- Status: ✅ Aprovado.

---

### CT-HU004-API-006 — Token já utilizado ou substituído

**Dados de entrada:** token consumido no CT-005; depois dois tokens de solicitações consecutivas.

**Passos**

1. Reenviar `POST /auth/redefinir-senha` com o token do CT-005 e outra senha válida (`OutraSenha123`).
2. Enviar `POST /auth/validar-token` com o mesmo token.
3. Solicitar recuperação duas vezes seguidas, guardar os dois tokens e testar o **primeiro** em `/auth/validar-token`.

**Resultado esperado**

- Passos 1 e 2: HTTP `400` com `error.code` `TOKEN_ALREADY_USED` (ou `TOKEN_INVALID`, se o token já tiver sido invalidado). Registrar o código obtido.
- Login com `OutraSenha123` deve ser rejeitado; a senha continua `NovaSenha123`.
- Passo 3: o primeiro token é rejeitado com HTTP `400` e `error.code: "TOKEN_ALREADY_USED"` (cada nova solicitação marca os anteriores como usados); o segundo continua válido.

**Resultado obtido**

- Passo 1, reuso do token do CT-005 com `OutraSenha123`: HTTP `400`, `error.code: "TOKEN_ALREADY_USED"`, "Token de recuperação já utilizado.".
- Passo 2, validação do mesmo token: HTTP `400`, `TOKEN_ALREADY_USED`.
- Login com `OutraSenha123`: `401`; com `NovaSenha123`: `200`. A senha não foi alterada.
- Passo 3, duas solicitações seguidas: o primeiro token retornou HTTP `400` `TOKEN_ALREADY_USED`; o segundo, HTTP `200` `valido: true`.
- Status: ✅ Aprovado.

---

### CT-HU004-API-007 — Token expirado

**Dados de entrada:** token gerado há mais de 15 minutos.

**Passos**

1. Solicitar um novo token e aguardar 15 minutos e um pouco mais, sem usá-lo.
2. Enviar `POST /auth/validar-token` e, depois, `POST /auth/redefinir-senha` com senha válida.

**Resultado esperado**

- As duas respostas: HTTP `400`, `success: false` e `error.code: "TOKEN_EXPIRED"`.
- Senha não alterada.

**Resultado obtido**

- Token gerado às 21:18:14 UTC, com expiração às 21:33:14 UTC (15 minutos). Testado às 21:34:10 UTC, sem alterar dados no banco.
- `POST /auth/validar-token`: HTTP `400`, `success: false`, `error.code: "TOKEN_EXPIRED"`, "Token de recuperação expirado.".
- `POST /auth/redefinir-senha` com `OutraSenha123`: HTTP `400`, `TOKEN_EXPIRED`.
- Login com `OutraSenha123`: `401`; com `NovaSenha123`: `200`. A senha não foi alterada.
- Status: ✅ Aprovado.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhum defeito encontrado nos 7 casos. | — |

## Observações gerais

- Referências: [HU-004, seção 7.2.4](../../../../../docs/requisitos.md) e [contrato atual das rotas](../../../../../backend/src/modulos/auth/api/http/auth_routes.py). Execução de 2026-10-05 feita no commit `ff0488e4` da `develop`.
- A suíte cobre os três endpoints principais. Falha de SMTP (AC-07, `EMAIL_SEND_FAILED`, exige indisponibilizar o serviço de e-mail), divergência entre "Nova Senha" e "Confirmar Nova Senha" (validada só no app) e a rota ponte `GET /auth/redefinir-senha` ficam para outra rodada ou para a suíte de UI. Aprovar estes 7 casos não significa cobertura total da HU.
- Se o e-mail de teste não estiver acessível, executar apenas os CT-001 e CT-002 e registrar os demais como pendentes por falta de massa.
- **Preparação da massa:** o aluno de teste (`qa.hu004.aluno@example.com`, fictício) foi cadastrado por `POST /usuarios/cadastrar` e aprovado pelo administrador padrão em `PATCH /usuarios/alunos/{id}/aprovar`, pela API.
- **Ambiente:** stack Docker isolada (`docker compose -p atu-api`), com banco próprio, para não alterar o banco de desenvolvimento. O `.env` de desenvolvimento não tem `SMTP_USER` e `SMTP_PASSWORD`; com ele, o envio do e-mail falha. Por isso o backend apontou o SMTP para um Mailpit local, que capturou os e-mails e permitiu ler os tokens.
- **Observação de segurança (não reprovou o CT-002):** a resposta para e-mail cadastrado levou cerca de 64–70 ms e para e-mail inexistente cerca de 3 ms, porque o envio do e-mail é síncrono. Status e corpo são idênticos, mas a diferença de tempo permite inferir se a conta existe, o que vai contra a intenção do AC-03. Levar ao time para avaliar o envio assíncrono.
- **Observação:** o detalhe do erro `422` para corpo sem `email` vem em inglês ("Field required").
- Ocultar senhas, tokens e dados pessoais nas evidências; nenhum token foi registrado nesta suíte.
