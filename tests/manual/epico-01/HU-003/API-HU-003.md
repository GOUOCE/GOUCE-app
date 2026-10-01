# Testes manuais de API — HU-003 — Controle de Acesso por Perfil

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Autenticação e Gestão de Conta |
| Funcionalidade | HU-003 — Controle de Acesso por Perfil |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial |
| Endpoints | `GET /usuarios/me` (somente aluno); `GET /usuarios/alunos`, `PATCH /usuarios/alunos/{id}/aprovar` e `PATCH /usuarios/alunos/{id}/status` (somente administrador) |
| Ambiente | A preencher — URL e commit testado |
| Total de casos | 6 |
| Última execução | Não realizada |
| Testador | Radlei Doroth |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 6 | 0 | 0 | 6 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API e banco disponíveis. Usar Postman, Insomnia ou Swagger em `/docs`, com a URL do ambiente. |
| PC-02 | Ter contas fictícias: **aluno ativo A**, **aluno ativo B** (alvo das ações administrativas), **administrador ativo** e, se existir, **representante ativo** (perfil `supervisor` no token). |
| PC-03 | Obter um `token_acesso` de cada perfil por `POST /auth/login` (ver HU-002) e enviá-lo em `Authorization: Bearer <token>`. Anotar o `id` do aluno B. |
| PC-04 | Anotar o estado inicial do aluno B (`GET /usuarios/alunos` com o token do administrador) para comparar depois das tentativas bloqueadas. |

## Resumo da execução

Executar na ordem abaixo. São **6 casos essenciais**; o CT-005 altera o estado do aluno A, então deve ser o penúltimo a rodar.

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU003-API-001 | Cada perfil acessa o que lhe pertence | Token do aluno em `/usuarios/me`; token do administrador em `/usuarios/alunos` | HTTP 200 nos dois | ⏳ PENDENTE | Não executado. |
| CT-HU003-API-002 | Aluno bloqueado em rotas administrativas | Token do aluno em `GET /usuarios/alunos` e `PATCH .../aprovar` | HTTP 403; sem dados; estado do alvo inalterado | ⏳ PENDENTE | Não executado. |
| CT-HU003-API-003 | Administrador bloqueado em rota de aluno | Token do administrador em `GET /usuarios/me` | HTTP 403 | ⏳ PENDENTE | Não executado. |
| CT-HU003-API-004 | Requisição sem token ou com token inválido | Sem token; token adulterado; `token_atualizacao` no lugar do acesso | HTTP 401 | ⏳ PENDENTE | Não executado. |
| CT-HU003-API-005 | Conta inativada durante a sessão | Token do aluno A emitido antes de a conta ser inativada | HTTP 401 na requisição seguinte; novo login negado | ⏳ PENDENTE | Não executado. |
| CT-HU003-API-006 | Representante bloqueado | Token do representante em rotas de aluno e de administrador | HTTP 403 nas duas | ⏳ PENDENTE | Não executado. |

## Detalhamento dos casos

### CT-HU003-API-001 — Cada perfil acessa o que lhe pertence

**Dados de entrada:** token do aluno A e token do administrador.

**Passos**

1. Enviar `GET /usuarios/me` com o token do aluno A.
2. Enviar `GET /usuarios/alunos` com o token do administrador.

**Resultado esperado**

- Aluno em `/usuarios/me`: HTTP `200` com o perfil do próprio aluno A.
- Administrador em `/usuarios/alunos`: HTTP `200` com a lista de cadastros, sem campos de senha (`senha`, `email_hash`).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU003-API-002 — Aluno bloqueado em rotas administrativas

**Dados de entrada:** token do aluno A; `aluno_id` do aluno B.

**Passos**

1. Enviar `GET /usuarios/alunos` com o token do aluno.
2. Enviar `PATCH /usuarios/alunos/{id_do_aluno_B}/aprovar` com o mesmo token.
3. Enviar `PATCH /usuarios/alunos/{id_do_aluno_B}/status` com corpo `{"status_cadastro": "inativado"}` e o mesmo token.
4. Com o token do administrador, conferir que o aluno B continua como estava na PC-04.

**Resultado esperado**

- HTTP `403` nas três requisições, com mensagem de acesso negado (hoje: `detail: "Acesso negado"`).
- Nenhum dado de outros usuários no corpo da resposta e nenhuma alteração no aluno B.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU003-API-003 — Administrador bloqueado em rota de aluno

**Dados de entrada:** token do administrador.

**Passos**

1. Enviar `GET /usuarios/me` com o token do administrador.

**Resultado esperado**

- HTTP `403` com mensagem de acesso negado e nenhum dado de perfil.
- Os endpoints de aluno aceitam somente o perfil `aluno`; qualquer resposta diferente deve ser registrada.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU003-API-004 — Requisição sem token ou com token inválido

**Dados de entrada:** três tentativas em `GET /usuarios/alunos`: sem cabeçalho de autorização; token com um caractere alterado; `token_atualizacao` do administrador no lugar do `token_acesso`.

**Passos**

1. Enviar cada requisição separadamente, sem cookies de sessão do cliente.
2. Conferir status e corpo.

**Resultado esperado**

- HTTP `401` nas três, com mensagem de sessão inválida ou não autenticada.
- Nenhum dado retornado. Não deve haver `403` nem `200` (o token de renovação não serve como acesso).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU003-API-005 — Conta inativada durante a sessão

**Dados de entrada:** token do aluno A (emitido antes) e token do administrador.

**Passos**

1. Com o token do aluno A, confirmar `GET /usuarios/me` com `200`.
2. Com o administrador, enviar `PATCH /usuarios/alunos/{id_do_aluno_A}/status` com `{"status_cadastro": "inativado", "motivo_reprovacao": "Teste manual HU-003"}`.
3. Repetir `GET /usuarios/me` com o **mesmo** token do aluno A.
4. Tentar novo login do aluno A em `POST /auth/login`.
5. Se possível, reativar o aluno A pelo administrador para não afetar as demais suítes.

**Resultado esperado**

- Passo 3: HTTP `401` (sessão revogada), mesmo com o token ainda dentro da validade.
- Passo 4: HTTP `401` com mensagem de conta inativada.
- A validação lê o estado atual do banco, não apenas o token (AC-07 e AC-08).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU003-API-006 — Representante bloqueado

**Preparação específica**

- Exige conta de representante. Sem ela, registrar o caso como pendente por falta de massa.

**Dados de entrada:** token do representante (`role: "supervisor"`).

**Passos**

1. Enviar `GET /usuarios/alunos` com o token do representante.
2. Enviar `GET /usuarios/me` com o mesmo token.

**Resultado esperado**

- HTTP `403` nas duas requisições, sem dados (AC-03 e AC-05).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Referências: [HU-003, seção 7.2.3](../../../../docs/requisitos.md) e [dependências de autorização](../../../../backend/src/shared/auth/dependencies.py). Conferir a versão implantada; esta suíte não foi executada durante sua criação.
- A API só tem rotas protegidas para aluno e administrador; as rotas de lista de embarque e frequência do representante (AC-03) ainda não existem, então o bloqueio do representante é verificado apenas contra as rotas atuais.
- Menus e telas por perfil (AC-01, AC-02, AC-04) e a mensagem "Acesso Negado" do app são de UI e ficam para a suíte de interface. Promoção de perfil durante a sessão e rotas de arquivos (`/arquivos/*`) ficam para outra rodada. Aprovar estes 6 casos não significa cobertura total da HU.
- Registrar status e resposta obtidos em cada CT; ocultar senhas, tokens e dados pessoais nas evidências.
