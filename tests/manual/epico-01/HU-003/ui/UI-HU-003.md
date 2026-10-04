# Testes manuais de UI — HU-003 — Controle de Acesso por Perfil

## Identificação da suíte

| Campo           | Valor                                                                                   |
| --------------- | --------------------------------------------------------------------------------------- |
| Módulo          | Autenticação e Gestão de Conta                                                          |
| Funcionalidade  | HU-003 — Controle de Acesso por Perfil                                                  |
| Camada          | UI                                                                                      |
| Tipo de teste   | Funcional manual                                                                        |
| Tela            | Áreas do aluno, do representante e do administrador; tela Acesso Negado                 |
| Ambiente        | Desenvolvimento — app mobile no iPhone (Expo Go)                                        |
| Total de casos  | 10 |
| Última execução | Não realizada                                                                           |
| Testador        | Cauan Ricardo                                                                           |

## Resultado geral

| Situação        | Total | ✅ Passaram | ❌ Falharam | ⏳ Pendentes |
| --------------- | ----: | ----------: | ----------: | -----------: |
| ⏳ Não executada | 10 | 0 | 0 | 10 |

## Pré-condições

| ID    | Descrição |
| ----- | --------- |
| PC-01 | Aplicativo aberto no iPhone pelo **Expo Go**, com a API disponível e conexão ativa. |
| PC-02 | Contas de teste fictícias: **aluno ativo**, **administrador ativo** e, se existir, **representante ativo**. Para o CT-010, ter acesso a um segundo aparelho ou ao Swagger (`/docs`) com o token do administrador. |
| PC-03 | **Acesso por link direto:** para simular uma pessoa tentando abrir uma tela de outro perfil, abrir no Safari do iPhone o link `exp://<IP do computador>:8081/--/<tela>` (o mesmo IP e porta mostrados pelo Expo no terminal). Telas usadas: `cadastros` (somente administrador), `carteirinha-digital` (somente aluno) e `rota` (somente representante). Confirmar com o time se outra forma de link direto está disponível. |
| PC-04 | Nos casos de link direto, fazer login com o perfil indicado antes de abrir o link, exceto no CT-009. |

## Resumo da execução

Executar na ordem abaixo. São **10 casos**, em três seções. Os IDs completos usam o prefixo `CT-HU003-UI-`, numerados de 001 a 010.

### Seção A — Interface por perfil

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU003-UI-001 | Menus do aluno | Login como aluno ativo | Exibir só funções de aluno, sem telas administrativas | ⏳ PENDENTE | Não executado. |
| CT-HU003-UI-002 | Menus do administrador | Login como administrador | Exibir os menus de gestão | ⏳ PENDENTE | Não executado. |
| CT-HU003-UI-003 | Menus do representante | Login como representante | Exibir só chamada e rota, sem funções administrativas | ⏳ PENDENTE | Não executado. |

### Seção B — Acesso direto a telas de outro perfil

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU003-UI-004 | Aluno abre tela administrativa por link | Aluno logado; link para `cadastros` | Exibir Acesso Negado, sem dados administrativos | ⏳ PENDENTE | Não executado. |
| CT-HU003-UI-005 | Representante abre tela administrativa por link | Representante logado; link para `cadastros` | Exibir Acesso Negado | ⏳ PENDENTE | Não executado. |
| CT-HU003-UI-006 | Administrador abre tela do aluno por link | Administrador logado; link para `carteirinha-digital` | Exibir Acesso Negado, sem dados de aluno | ⏳ PENDENTE | Não executado. |
| CT-HU003-UI-007 | Aluno abre tela do representante por link | Aluno logado; link para `rota` | Exibir Acesso Negado | ⏳ PENDENTE | Não executado. |
| CT-HU003-UI-008 | Voltar da tela Acesso Negado | Tela Acesso Negado aberta pelo CT-004 e pelo CT-006 | Voltar para a tela inicial do próprio perfil | ⏳ PENDENTE | Não executado. |

### Seção C — Sessão e mudança de perfil

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU003-UI-009 | Link de área protegida sem login | Sem sessão; link para `cadastros` e `carteirinha-digital` | Levar para a tela de login, sem exibir a área | ⏳ PENDENTE | Não executado. |
| CT-HU003-UI-010 | Conta inativada durante a sessão | Aluno logado; administrador inativa a conta | Na próxima ação, encerrar o acesso e exigir novo login | ⏳ PENDENTE | Não executado. |

## Detalhamento dos casos

### Seção A — Interface por perfil

#### CT-HU003-UI-001 — Menus do aluno

**Dados de entrada:** Credenciais do aluno ativo.

**Passos**

1. Fazer login como aluno (**Sou aluno**).
2. Conferir as abas inferiores e os atalhos da tela **Início**.
3. Percorrer as abas e telas disponíveis procurando qualquer função administrativa.

**Resultado esperado**

- Abas **Início**, **Agenda**, **Avisos** e **Perfil**; atalhos como **Agendar Transporte**, **Meus Agendamentos**, **Mural de Avisos** e **Carteirinha Digital** (AC-02).
- Nenhum menu, botão ou tela administrativa (cadastros, frota, aprovação de alunos, gestão de administradores).
- Registrar quais abas ou atalhos aparecem desabilitados e se isso fica claro para o usuário.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU003-UI-002 — Menus do administrador

**Dados de entrada:** Credenciais do administrador ativo.

**Passos**

1. Fazer login como administrador (**Sou administrador**).
2. Conferir as abas inferiores e os atalhos do **Painel**.

**Resultado esperado**

- Abas **Painel**, **Cadastros**, **Logística** e **Mais**; atalhos de gestão como **Fila de solicitações** e **Gestão de administradores** (AC-04).
- Nenhuma função exclusiva de aluno, como agendamento ou carteirinha.
- Registrar quais itens aparecem desabilitados.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU003-UI-003 — Menus do representante

**Preparação específica**

- Exige uma conta de representante. Sem ela, manter o caso pendente e registrar o motivo.

**Dados de entrada:** Credenciais do representante ativo.

**Passos**

1. Fazer login como representante (**Sou representante**).
2. Conferir as abas e as funções disponíveis.

**Resultado esperado**

- Abas **Chamada**, **Minha Rota** e **Perfil**, com lista de embarque e frequência (AC-03).
- Nenhuma função administrativa.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

### Seção B — Acesso direto a telas de outro perfil

#### CT-HU003-UI-004 — Aluno abre tela administrativa por link

**Dados de entrada:** Aluno logado; link `exp://<IP>:8081/--/cadastros` (ver PC-03).

**Passos**

1. Com o aluno logado, abrir o link no Safari e voltar ao Expo Go quando ele abrir.
2. Observar a tela exibida.

**Resultado esperado**

- Exibir a tela **Acesso Negado**, com “Você não tem permissão para acessar esta área.” e “Erro 403 - Forbidden” (AC-05 e AC-06).
- Não exibir, nem por um instante, dados ou componentes da tela administrativa.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU003-UI-005 — Representante abre tela administrativa por link

**Preparação específica**

- Exige uma conta de representante. Sem ela, manter o caso pendente e registrar o motivo.

**Dados de entrada:** Representante logado; link `exp://<IP>:8081/--/cadastros`.

**Passos**

1. Com o representante logado, abrir o link.
2. Observar a tela exibida.

**Resultado esperado**

- Exibir a tela **Acesso Negado**, sem dados administrativos (AC-05).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU003-UI-006 — Administrador abre tela do aluno por link

**Dados de entrada:** Administrador logado; link `exp://<IP>:8081/--/carteirinha-digital`.

**Passos**

1. Com o administrador logado, abrir o link.
2. Observar a tela exibida.

**Resultado esperado**

- Exibir a tela **Acesso Negado**, sem dados de carteirinha ou de qualquer aluno.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU003-UI-007 — Aluno abre tela do representante por link

**Dados de entrada:** Aluno logado; link `exp://<IP>:8081/--/rota`.

**Passos**

1. Com o aluno logado, abrir o link.
2. Observar a tela exibida.

**Resultado esperado**

- Exibir a tela **Acesso Negado**, sem a lista de embarque nem dados da rota.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU003-UI-008 — Voltar da tela Acesso Negado

**Dados de entrada:** Tela **Acesso Negado** aberta pelo CT-004 (aluno) e pelo CT-006 (administrador).

**Passos**

1. Na tela **Acesso Negado**, tocar em **Voltar**.
2. Conferir a tela exibida em cada perfil.

**Resultado esperado**

- Aluno volta para a tela **Início** do aluno; administrador volta para o **Painel**.
- A sessão continua ativa: não pede login de novo.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

### Seção C — Sessão e mudança de perfil

#### CT-HU003-UI-009 — Link de área protegida sem login

**Dados de entrada:** App sem sessão ativa (fazer **Sair** antes); links para `cadastros` e `carteirinha-digital`.

**Passos**

1. Sem estar logado, abrir cada link.
2. Observar a tela exibida.

**Resultado esperado**

- Levar para a tela de login, sem exibir a área protegida nem dados (AC-07).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU003-UI-010 — Conta inativada durante a sessão

**Dados de entrada:** Aluno logado no iPhone; administrador em outro aparelho ou no Swagger (PC-02).

**Passos**

1. Com o aluno logado, abrir **Perfil** e conferir que os dados carregam.
2. Pelo administrador, inativar o aluno (no Swagger: `PATCH /usuarios/alunos/{id}/status` com `{"status_cadastro": "inativado"}`).
3. No iPhone, sem sair do app, abrir uma função que consulta a API (ex.: **Carteirinha Digital** ou atualizar o **Perfil**).
4. Navegar pelas abas e, em seguida, fechar e reabrir o app.
5. Ao final, reativar o aluno pelo administrador para não afetar outros testes.

**Resultado esperado**

- Na próxima ação que consulta a API, o app identifica que o acesso foi revogado, encerra a sessão e leva para a tela de login (AC-08, FA-002).
- Não deve continuar exibindo a área do aluno como se nada tivesse mudado.
- Ao tentar entrar de novo, recebe a mensagem de conta inativada (ver CT-HU002-UI-014).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Defeitos encontrados

| Caso | Defeito | Issue |
| ---- | ------- | ----- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Referências: [HU-003, seção 7.2.3](../../../../../docs/requisitos.md), [contexto de autenticação (redirecionamento por perfil)](../../../../../frontend/src/contexts/AuthContext.tsx), [tela Acesso Negado](../../../../../frontend/src/app/acesso-negado.tsx) e [interceptador da API](../../../../../frontend/src/api/api.ts). A suíte de API correspondente está em [`../api/API-HU-003.md`](../api/API-HU-003.md), que cobre o bloqueio 403 diretamente nos endpoints.
- As telas **Início** do aluno e do administrador têm o mesmo nome de rota (`home`), por isso os links diretos usam telas exclusivas de cada perfil (`cadastros`, `carteirinha-digital` e `rota`).
- No código atual, quando a API responde 401 (sessão inválida), o app apaga o token salvo, mas não atualiza a tela nem leva para o login. O CT-010 verifica se o usuário fica preso numa área sem acesso.
- Promoção de perfil durante a sessão (ex.: aluno virar administrador) não tem caso, porque o app atual não oferece essa operação; incluir quando existir.
- Registrar o texto exato de cada tela e mensagem. Ocultar senhas, tokens e dados pessoais nas evidências.
