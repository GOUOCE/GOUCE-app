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
| Última execução | Data não informada — CT-HU002-API-001 a CT-HU002-API-006 registrados |
| Testador | Radlei Doroth |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: |
| ✅ Execução concluída | 6 | 6 | 0 | 0 | 0 |

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
| CT-HU002-API-001 | Login válido de aluno ativo | E-mail e senha corretos do aluno ativo | HTTP 200; tokens, perfil `aluno` e cookies HttpOnly | ✅ APROVADO | HTTP 200; `usuario.role: "aluno"`; `usuario.status_cadastro: "ativado"`; tokens presentes; `tipo_token: "bearer"`; cookies HttpOnly; senha/hash ausentes; `GET /usuarios/me` respondeu HTTP 200 e confirmou o perfil; tempo de resposta de até 3 segundos. |
| CT-HU002-API-002 | Login válido de administrador | E-mail e senha corretos do administrador | HTTP 200; perfil `administrador` identificado sem o cliente informá-lo | ✅ APROVADO | HTTP 200; `usuario.role: "administrador"`; `GET /usuarios/alunos` respondeu HTTP 200; os seis campos exclusivos de aluno estavam ausentes; consulta SQL confirmou `perfil_administrador_confirmado`. |
| CT-HU002-API-003 | Credenciais inválidas | Senha errada; depois e-mail não cadastrado | HTTP 401; mensagem idêntica nos dois casos | ✅ APROVADO | Os dois cenários responderam HTTP 401; as mensagens de erro foram idênticas; nenhuma resposta retornou tokens de autenticação. |
| CT-HU002-API-004 | Campos obrigatórios ausentes ou inválidos | Sem `senha`; sem `email`; `email=maria@` | HTTP 422; sem gerar token | ✅ APROVADO | Os três cenários responderam HTTP 422; `detail` identificou `body.senha` e `body.email` conforme o caso; nenhuma resposta retornou tokens ou `Set-Cookie`; formato de validação esperado pelo FastAPI. |
| CT-HU002-API-005 | Conta pendente ou inativada | Credenciais corretas de aluno pendente; depois de aluno inativado | HTTP 401; acesso negado com mensagem específica | ✅ APROVADO | O cenário pendente e o cenário inativado responderam HTTP 401 com as mensagens específicas; nenhum token foi retornado e as respostas 401 não enviaram `Set-Cookie`. |
| CT-HU002-API-006 | Renovação da sessão | `token_atualizacao` obtido no CT-001 | HTTP 200 com novo `token_acesso`; token inválido rejeitado | ✅ APROVADO | Cookie Jar limpo; refresh válido respondeu HTTP 200 com novo `token_acesso` e `tipo_token: "bearer"`; refresh adulterado e access token usado como refresh responderam HTTP 401, sem novo token. |

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

- Verificado: `POST /auth/login` respondeu HTTP `200 OK`.
- Verificado: `usuario.role` retornou `"aluno"`.
- Verificado: `usuario.status_cadastro` retornou `"ativado"`.
- Verificado: os campos `token_acesso` e `token_atualizacao` estavam presentes.
- Verificado: `tipo_token` retornou `"bearer"`.
- Verificado: os cookies de acesso e atualização possuíam o atributo `HttpOnly`.
- Verificado: senha e hash estavam ausentes da resposta.
- Verificado: `GET /usuarios/me`, autenticado com o token do aluno, respondeu HTTP `200`.
- Verificado: o perfil retornado por `GET /usuarios/me` correspondeu ao aluno autenticado.
- Verificado: o tempo de resposta do login foi de até 3 segundos.
- Status: ✅ Aprovado.

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

- Verificado: `POST /auth/login` respondeu HTTP `200 OK`.
- Verificado: `usuario.role` retornou `"administrador"`.
- Verificado: `GET /usuarios/alunos` respondeu HTTP `200 OK` usando a autenticação do administrador.
- Verificado: os seis campos exclusivos de aluno estavam ausentes na resposta do login.
- Verificado: a consulta SQL somente leitura retornou `perfil_administrador_confirmado`.
- Status: ✅ Aprovado.

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

- Verificado: o cenário com senha incorreta respondeu HTTP `401 Unauthorized`.
- Verificado: o cenário com e-mail inexistente respondeu HTTP `401 Unauthorized`.
- Verificado: as mensagens de erro foram idênticas nos dois cenários.
- Verificado: nenhuma das respostas retornou tokens de autenticação.
- Status: ✅ Aprovado.

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

- Verificado: o login sem senha respondeu HTTP `422` e `detail` identificou `body.senha` como campo obrigatório.
- Verificado: o login sem e-mail respondeu HTTP `422` e `detail` identificou `body.email` como campo obrigatório.
- Verificado: o login com e-mail inválido respondeu HTTP `422` e `detail` identificou `body.email` com erro de validação.
- Verificado: nenhuma das três respostas retornou tokens.
- Verificado: nenhuma das três respostas apresentou cabeçalhos `Set-Cookie`.
- Verificado: as três respostas seguiram o formato de validação esperado pelo FastAPI.
- Observação: a mensagem em inglês não viola os requisitos identificados da HU-002.
- Status: ✅ Aprovado.

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

- Verificado: no cenário pendente, `POST /auth/login` respondeu HTTP `401`.
- Verificado: a resposta do cenário pendente informou que a conta estava pendente de aprovação pela coordenação.
- Verificado: no cenário inativado, o cadastro foi alterado para `status_cadastro = "inativado"` pela funcionalidade administrativa, com resposta HTTP `200`.
- Verificado: após a inativação, `POST /auth/login` com as credenciais corretas respondeu HTTP `401`.
- Verificado: a resposta do cenário inativado informou que a conta estava inativada e orientou contato com a coordenação.
- Verificado: nenhum dos dois cenários retornou `token_acesso` ou `token_atualizacao`.
- Verificado: as respostas `401` não enviaram o cabeçalho `Set-Cookie`.
- Observação: cookies previamente armazenados no Cookie Jar do Insomnia não foram enviados pelas respostas `401`.
- Status: ✅ Aprovado.

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

- Verificado: o Cookie Jar do Insomnia foi limpo antes dos testes necessários.
- Verificado: com refresh token válido, `POST /auth/refresh` respondeu HTTP `200`, retornou novo `token_acesso` e `tipo_token: "bearer"`.
- Verificado: não houve rotação nem retorno de novo `token_atualizacao`.
- Verificado: com refresh token adulterado, a resposta foi HTTP `401`, com mensagem indicando token de atualização inválido ou sessão revogada, sem novo `token_acesso`.
- Verificado: com access token enviado no campo `token_atualizacao`, a resposta foi HTTP `401`, sem novo `token_acesso`.
- Status: ✅ Aprovado.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma falha ou defeito registrado. | — |

## Observações gerais

- Referências: [HU-002, seção 7.2.2](../../../../../docs/requisitos.md) e [contrato atual das rotas](../../../../../backend/src/modulos/auth/api/http/auth_routes.py). A execução registrada foi realizada manualmente no Insomnia; conferir a versão implantada no campo Ambiente.
- A suíte cobre o login e a renovação básica. Bloqueio temporário por tentativas, `lembrar_me` (duração do refresh), HTTPS, hash de senha (RNF-002/003) e falha de conexão no app (AC-06) ficam para outra rodada. Aprovar estes 6 casos não significa cobertura total da HU.
- Erros de login usam o formato padrão `{"detail": "..."}`, diferente do envelope `success/error` dos demais módulos; não tratar isso como falha desta suíte.
- Registrar status e resposta obtidos em cada CT; ocultar senhas, tokens e dados pessoais nas evidências.
