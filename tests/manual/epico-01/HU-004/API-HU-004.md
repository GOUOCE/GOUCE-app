# Testes manuais de API — HU-004 — Recuperação de Senha

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Autenticação e Gestão de Conta |
| Funcionalidade | HU-004 — Recuperação de Senha |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial |
| Endpoints | `POST /auth/solicitar-recuperacao`, `POST /auth/validar-token` e `POST /auth/redefinir-senha` — `application/json` |
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
| PC-01 | API, banco e serviço de e-mail (SMTP) disponíveis. Usar Postman, Insomnia ou Swagger em `/docs`. As três rotas não exigem autenticação. |
| PC-02 | Ter uma conta de aluno **ativo** cujo e-mail seja uma caixa de teste que você consiga abrir, para ler o link/token enviado. O token é salvo apenas como hash no banco; sem acesso à caixa de e-mail, os casos 3 a 7 ficam pendentes. |
| PC-03 | Anotar a senha atual da conta (`SenhaAtual1`) e definir a nova senha de teste `NovaSenha123`. |
| PC-04 | O token vale 15 minutos. Planejar o CT-007 com antecedência e não reutilizar o mesmo token entre casos, exceto onde indicado. |

## Resumo da execução

Executar na ordem abaixo. São **7 casos essenciais**; cada solicitação válida gera um token novo e invalida os anteriores da mesma conta.

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU004-API-001 | Solicitação com e-mail cadastrado | E-mail da conta de teste | HTTP 200; mensagem genérica; e-mail recebido com token | ⏳ PENDENTE | Não executado. |
| CT-HU004-API-002 | E-mail não cadastrado ou inválido | E-mail inexistente; e-mail `maria@`; corpo sem e-mail | Mesma resposta do CT-001 para o inexistente; erro de validação nos demais | ⏳ PENDENTE | Não executado. |
| CT-HU004-API-003 | Validação do token | Token recebido; depois token adulterado | HTTP 200 `valido: true`; HTTP 400 `TOKEN_INVALID` | ⏳ PENDENTE | Não executado. |
| CT-HU004-API-004 | Senha fora das regras | `Abcd123`, `abcdefg1`, `ABCDEFG1`, `Abcdefgh` | Rejeitar conforme AC-05; token continua válido | ⏳ PENDENTE | Não executado. |
| CT-HU004-API-005 | Redefinição válida | Token válido e `NovaSenha123` | HTTP 200; login só com a nova senha | ⏳ PENDENTE | Não executado. |
| CT-HU004-API-006 | Token já utilizado ou substituído | Token do CT-005; token anterior a uma nova solicitação | HTTP 400; senha não alterada | ⏳ PENDENTE | Não executado. |
| CT-HU004-API-007 | Token expirado | Token com mais de 15 minutos | HTTP 400 `TOKEN_EXPIRED` | ⏳ PENDENTE | Não executado. |

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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
- Passo 3: o primeiro token é rejeitado com HTTP `400` e o segundo continua válido.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Referências: [HU-004, seção 7.2.4](../../../../docs/requisitos.md) e [contrato atual das rotas](../../../../backend/src/modulos/auth/api/http/auth_routes.py). Conferir a versão implantada; esta suíte não foi executada durante sua criação.
- A suíte cobre os três endpoints principais. Falha de SMTP (AC-07, `EMAIL_SEND_FAILED`, exige indisponibilizar o serviço de e-mail), divergência entre "Nova Senha" e "Confirmar Nova Senha" (validada só no app) e a rota ponte `GET /auth/redefinir-senha` ficam para outra rodada ou para a suíte de UI. Aprovar estes 7 casos não significa cobertura total da HU.
- Se o e-mail de teste não estiver acessível, executar apenas os CT-001 e CT-002 e registrar os demais como pendentes por falta de massa.
- Registrar status e resposta obtidos em cada CT; ocultar senhas, tokens e dados pessoais nas evidências.
