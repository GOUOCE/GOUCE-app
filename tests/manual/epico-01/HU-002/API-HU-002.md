# Testes manuais de API — HU-002 — Login de Usuários

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Autenticação e Gestão de Conta |
| Funcionalidade | HU-002 — Login de Usuários |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial |
| Endpoint | `POST /auth/login` — `application/json` |
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
| PC-01 | API e banco disponíveis. Usar Postman, Insomnia ou Swagger em `/docs`, com a URL do ambiente. O login não exige autenticação prévia. |
| PC-02 | Ter contas fictícias prontas: **aluno ativo** (`status_cadastro = ativado`), **aluno pendente** (cadastro recém-criado pela HU-001, ainda não aprovado), **aluno inativado** (reprovado/inativado via `PATCH /usuarios/alunos/{id}/status`) e **administrador ativo**. |
| PC-03 | Enviar o corpo como **Body → raw → JSON**. Corpo base: `{"email": "<email>", "senha": "<senha>", "lembrar_me": false}`. |
| PC-04 | Alterar somente o dado indicado em cada caso. Ocultar senhas e tokens nas evidências. |

## Resumo da execução

Executar na ordem abaixo. São **6 casos essenciais**; registrar cada variação antes de marcar o caso como aprovado.

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU002-API-001 | Login válido de aluno ativo | E-mail e senha corretos do aluno ativo | HTTP 200; tokens, perfil `aluno` e cookies HttpOnly | ⏳ PENDENTE | Não executado. |
| CT-HU002-API-002 | Login válido de administrador | E-mail e senha corretos do administrador | HTTP 200; perfil `administrador` identificado sem o cliente informá-lo | ⏳ PENDENTE | Não executado. |
| CT-HU002-API-003 | Credenciais inválidas | Senha errada; depois e-mail não cadastrado | HTTP 401; mensagem idêntica nos dois casos | ⏳ PENDENTE | Não executado. |
| CT-HU002-API-004 | Campos obrigatórios ausentes ou inválidos | Sem `senha`; sem `email`; `email=maria@` | HTTP 422; sem gerar token | ⏳ PENDENTE | Não executado. |
| CT-HU002-API-005 | Conta pendente ou inativada | Credenciais corretas de aluno pendente; depois de aluno inativado | HTTP 401; acesso negado com mensagem específica | ⏳ PENDENTE | Não executado. |
| CT-HU002-API-006 | Renovação da sessão | `token_atualizacao` obtido no CT-001 | HTTP 200 com novo `token_acesso`; token inválido rejeitado | ⏳ PENDENTE | Não executado. |

## Detalhamento dos casos

### CT-HU002-API-001 — Login válido de aluno ativo

**Dados de entrada:** e-mail e senha corretos do aluno ativo, `lembrar_me=false`.

**Passos**

1. Enviar `POST /auth/login` com o corpo base.
2. Registrar status, JSON, cabeçalhos `Set-Cookie` e o tempo de resposta.
3. Usar o `token_acesso` em `GET /usuarios/me` (`Authorization: Bearer <token>`) para confirmar que a sessão funciona.

**Resultado esperado**

- HTTP `200` com `token_acesso`, `token_atualizacao`, `tipo_token: "bearer"` e `usuario` contendo `id`, `nome`, `email`, `role: "aluno"` e `status_cadastro: "ativado"`.
- Cookies `access_token` e `refresh_token` definidos com `HttpOnly`.
- `GET /usuarios/me` responde `200` com o perfil do mesmo aluno.
- Não retornar senha nem hash. Tempo de resposta de até 3 segundos (RNF-001).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU002-API-002 — Login válido de administrador

**Dados de entrada:** e-mail e senha corretos do administrador ativo.

**Passos**

1. Enviar `POST /auth/login` sem nenhum campo de perfil.
2. Usar o `token_acesso` em `GET /usuarios/alunos` para confirmar acesso administrativo.

**Resultado esperado**

- HTTP `200` e `usuario.role: "administrador"`, sem campos exclusivos de aluno (`status_cadastro`, `curso`).
- `GET /usuarios/alunos` responde `200`.
- O perfil é definido pelo banco, não por escolha do cliente. O AC-08 prevê escolha de perfil na tela; a API atual não recebe esse dado. Registrar como observação, não como falha da API.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU002-API-003 — Credenciais inválidas

**Dados de entrada:** duas tentativas: e-mail do aluno ativo com senha incorreta; depois e-mail inexistente (`naoexiste@example.com`) com qualquer senha.

**Passos**

1. Enviar cada tentativa separadamente.
2. Comparar status e mensagem das duas respostas.

**Resultado esperado**

- HTTP `401` nas duas, sem `token_acesso` nem cookies.
- Mensagem **idêntica** nas duas e sem indicar qual campo está errado (hoje: `detail: "Email ou senha inválidos"`), conforme AC-03. A frase da interface ("E-mail ou senha incorretos. Tente novamente.") pode ser tratada no app; mensagens diferentes entre as tentativas são falha.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU002-API-004 — Campos obrigatórios ausentes ou inválidos

**Dados de entrada:** três tentativas: corpo sem `senha`; corpo sem `email`; `email=maria@` com senha qualquer.

**Passos**

1. Enviar cada corpo separadamente.
2. Conferir status e detalhe do erro.

**Resultado esperado**

- HTTP `422` com detalhe de validação que identifique o campo (`senha`, `email`).
- Nenhum token ou cookie gerado e nenhum `500`.
- Observação: `senha` vazia (`""`) passa pela validação do formato e deve ser rejeitada com `401`; registrar o status obtido.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU002-API-005 — Conta pendente ou inativada

**Dados de entrada:** credenciais corretas do aluno pendente; depois do aluno inativado (ou administrador inativo, se disponível).

**Passos**

1. Enviar o login de cada conta.
2. Conferir status, mensagem e ausência de tokens.

**Resultado esperado**

- HTTP `401` nas duas, sem tokens nem cookies, mesmo com senha correta.
- Pendente: mensagem de que a conta aguarda aprovação da coordenação.
- Inativado: mensagem de conta inativada orientando contato com a coordenação, conforme AC-04.
- Administrador inativo: a mensagem atual não cita a coordenação; se for o caso, registrar a divergência com o AC-04.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU002-API-006 — Renovação da sessão

**Dados de entrada:** `token_atualizacao` do CT-HU002-API-001; depois um valor adulterado.

**Passos**

1. Enviar `POST /auth/refresh` com `{"token_atualizacao": "<token>"}` e sem cookies.
2. Repetir com o token alterado em um caractere e anotar a resposta.

**Resultado esperado**

- Token válido: HTTP `200` com novo `token_acesso` e `tipo_token: "bearer"`.
- Token adulterado: HTTP `401`, sem novo token.
- Enviar o `token_acesso` no lugar do `token_atualizacao` deve ser rejeitado (tipo de token incorreto); registrar o resultado.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Referências: [HU-002, seção 7.2.2](../../../../docs/requisitos.md) e [contrato atual das rotas](../../../../backend/src/modulos/auth/api/http/auth_routes.py). Conferir a versão implantada; esta suíte não foi executada durante sua criação.
- A suíte cobre o login e a renovação básica. Bloqueio temporário por tentativas, `lembrar_me` (duração do refresh), HTTPS, hash de senha (RNF-002/003) e falha de conexão no app (AC-06) ficam para outra rodada. Aprovar estes 6 casos não significa cobertura total da HU.
- Erros de login usam o formato padrão `{"detail": "..."}`, diferente do envelope `success/error` dos demais módulos; não tratar isso como falha desta suíte.
- Registrar status e resposta obtidos em cada CT; ocultar senhas, tokens e dados pessoais nas evidências.
