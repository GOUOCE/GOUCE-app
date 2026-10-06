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
| Total de casos  | 11 |
| Última execução | 05/10/2026                                                                              |
| Testador        | Cauan Ricardo                                                                           |

## Resultado geral

| Situação        | Total | ✅ Passaram | ❌ Falharam | 🚫 Bloqueados | ⏳ Pendentes |
| --------------- | ----: | ----------: | ----------: | ------------: | -----------: |
| ⏳ Em execução | 11 | 4 | 2 | 3 | 2 |

## Pré-condições

| ID    | Descrição |
| ----- | --------- |
| PC-01 | Aplicativo aberto no iPhone pelo **Expo Go**, com a API disponível e conexão ativa. |
| PC-02 | Contas de teste fictícias: **aluno ativo**, **administrador ativo** e, se existir, **representante ativo**. Para o CT-011, ter acesso a um segundo aparelho ou ao Swagger (`/docs`) com o token do administrador. |
| PC-03 | **Acesso por link direto:** para simular uma pessoa tentando abrir uma tela de outro perfil, abrir no Safari do iPhone o link `exp://<IP do computador>:8081/--/<tela>` (o mesmo IP e porta mostrados pelo Expo no terminal). Telas usadas: `cadastros` (somente administrador), `carteirinha-digital` (somente aluno) e `rota` (somente representante). Confirmar com o time se outra forma de link direto está disponível. |
| PC-04 | Nos casos de link direto, fazer login com o perfil indicado antes de abrir o link, exceto no CT-010. |

## Resumo da execução

Executar na ordem abaixo. São **11 casos**, em três seções. Os IDs completos usam o prefixo `CT-HU003-UI-`, numerados de 001 a 011.

### Seção A — Interface por perfil

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU003-UI-001 | Menus do aluno | Login como aluno ativo | Exibir só funções de aluno, sem telas administrativas | ✅ APROVADO | Exibiu só funções de aluno: card Sua viagem hoje, atalhos Agendar Transporte, Meus Agendamentos, Mural de Avisos e Carteirinha Digital, e abas Início, Agenda, Avisos e Perfil. Nenhuma função administrativa. Minha Alocação não tem entrada própria; o card Sua viagem hoje é estático e Ver detalhes não funciona. Confirmado pelo testador em 05/10/2026. |
| CT-HU003-UI-002 | Menus do administrador | Login como administrador | Exibir os menus de gestão | ❌ REPROVADO | O Painel exibe apenas o Resumo de hoje e os atalhos Fila de solicitações e Gestão de administradores, que não abrem nada; as abas Cadastros, Logística e Mais não respondem. Nenhum dos menus de gestão do requisito existe. Ver [GAP-HU003-UI-002](issues/GAP-HU003-UI-002-menus-de-gestao-do-admin-inexistentes.md). Confirmado pelo testador em 05/10/2026. |
| CT-HU003-UI-003 | Menus do representante | Login como representante | Exibir só chamada e rota, sem funções administrativas | 🚫 BLOQUEADO | O perfil representante ainda não existe no backend (sem tabela `representante` e sem rota de cadastro), como no CT-HU002-UI-008. Nenhuma conta pode ter esse perfil. Registrado em 05/10/2026. |
| CT-HU003-UI-004 | Ações exclusivas do administrador | Cadastrar, editar e inativar ônibus; publicar aviso, com cada perfil | Só o administrador executa; aluno e representante não têm a ação | 🚫 BLOQUEADO | As telas de gestão de frota e de publicação no mural ainda não existem no app, então nenhuma das quatro ações pode ser executada. Ver CT-002. Registrado em 05/10/2026. |

### Seção B — Acesso direto a telas de outro perfil

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU003-UI-005 | Aluno abre tela administrativa por link | Aluno logado; link para `cadastros` | Exibir Acesso Negado, sem dados administrativos | ✅ APROVADO | O link abriu o app na tela Acesso Negado, com “Você não tem permissão para acessar esta área.” e “Erro 403 - Forbidden”, sem exibir a tela administrativa. O botão Voltar levou ao painel do aluno. Confirmado pelo testador em 05/10/2026. |
| CT-HU003-UI-006 | Representante abre tela administrativa por link | Representante logado; link para `cadastros` | Exibir Acesso Negado | 🚫 BLOQUEADO | Exige representante logado, perfil que ainda não existe no backend (ver CT-003). Registrado em 05/10/2026. |
| CT-HU003-UI-007 | Administrador abre tela do aluno por link | Administrador logado; link para `carteirinha-digital` | Exibir Acesso Negado, sem dados de aluno | ❌ REPROVADO | A tela da carteirinha chegou a carregar por um instante antes de o app trocar para Acesso Negado (“Erro 403 - Forbidden”). O bloqueio acontece só depois de a tela abrir. Ver [BUG-HU003-UI-007](issues/BUG-HU003-UI-007-tela-protegida-aparece-antes-do-bloqueio.md). Executado pelo testador em 05/10/2026. |
| CT-HU003-UI-008 | Aluno abre tela do representante por link | Aluno logado; link para `rota` | Exibir Acesso Negado | ✅ APROVADO | O link abriu direto a tela Acesso Negado (“Erro 403 - Forbidden”), sem exibir a tela Minha Rota; o botão Voltar levou ao painel do aluno. Confirmado pelo testador em 05/10/2026. |
| CT-HU003-UI-009 | Voltar da tela Acesso Negado | Tela Acesso Negado aberta pelo CT-005 e pelo CT-007 | Voltar para a tela inicial do próprio perfil | ✅ APROVADO | Aluno (CT-005 e CT-008): Voltar levou ao painel do aluno. Administrador (link para `carteirinha-digital`): Voltar levou ao Painel, sem pedir login. Confirmado pelo testador em 05/10/2026. |

### Seção C — Sessão e mudança de perfil

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU003-UI-010 | Link de área protegida sem login | Sem sessão; link para `cadastros` e `carteirinha-digital` | Levar para a tela de login, sem exibir a área | ⏳ PENDENTE | Não executado. |
| CT-HU003-UI-011 | Conta inativada durante a sessão | Aluno logado; administrador inativa a conta | Na próxima ação, encerrar o acesso e exigir novo login | ⏳ PENDENTE | Não executado. |

## Detalhamento dos casos

### Seção A — Interface por perfil

#### CT-HU003-UI-001 — Menus do aluno

**Dados de entrada:** Credenciais do aluno ativo.

**Passos**

1. Fazer login como aluno (**Sou aluno**).
2. Conferir as abas inferiores e os atalhos da tela **Início**.
3. Percorrer as abas e telas disponíveis procurando qualquer função administrativa.

**Resultado esperado**

- Acesso às funções de aluno previstas no requisito e no BDD: **Agendamento de Transporte**, **Minha Alocação**, **Mural de Avisos**, **Carteirinha Digital** e **Meu Perfil** (AC-02).
- No app atual, elas aparecem como abas **Início**, **Agenda**, **Avisos** e **Perfil** e atalhos **Agendar Transporte**, **Meus Agendamentos**, **Mural de Avisos** e **Carteirinha Digital**. Registrar qual função do requisito não tem entrada correspondente (ex.: **Minha Alocação**).
- Nenhum menu de gestão: **Gestão de Frota**, **Gestão de Motoristas**, **Gestão de Rotas** e **Relatórios** (BDD), nem aprovação de alunos ou gestão de administradores.
- Registrar quais abas ou atalhos aparecem desabilitados e se isso fica claro para o usuário.

**Resultado obtido**

- Tela **Início**: card **Sua viagem hoje** (ônibus, placa e rota) com o botão **Ver detalhes**; seção **Acesso rápido** com **Agendar Transporte**, **Meus Agendamentos**, **Mural de Avisos** e **Carteirinha Digital**.
- Abas inferiores: **Início**, **Agenda**, **Avisos** e **Perfil**.
- Nenhuma função administrativa encontrada (gestão de frota, motoristas, rotas, relatórios, aprovação de alunos ou gestão de administradores).
- **Minha Alocação** (AC-02) não tem entrada própria. O card **Sua viagem hoje** é o mais próximo, mas é estático: os dados (`Ônibus 04 - Placa OCR-1234`, `Rota Centro → UFC`) são fixos no código e **Ver detalhes** não faz nada. Funcionalidade de outra HU, ainda não implementada; não reprova este caso, que verifica apenas o que o perfil aluno exibe.
- Execução confirmada pelo testador em 05/10/2026.
- Status: ✅ Aprovado.

---

#### CT-HU003-UI-002 — Menus do administrador

**Dados de entrada:** Credenciais do administrador ativo.

**Passos**

1. Fazer login como administrador (**Sou administrador**).
2. Conferir as abas inferiores e os atalhos do **Painel**.

**Resultado esperado**

- Acesso aos menus de gestão previstos no requisito e no BDD: **Gestão de Frota**, **Gestão de Motoristas**, **Gestão de Rotas**, **Gestão de Faculdades**, **Relatórios** e **Mural de Avisos** (AC-04, RN-006).
- No app atual, a área do administrador tem as abas **Painel**, **Cadastros**, **Logística** e **Mais**, com atalhos como **Fila de solicitações** e **Gestão de administradores**. Registrar quais menus do requisito ainda não existem ou estão desabilitados.
- Nenhuma função exclusiva de aluno, como agendamento ou carteirinha.
- Registrar quais itens aparecem desabilitados.

**Resultado obtido**

- **Painel**: seção **Resumo de hoje** com os cards **Solicitações pendentes** e **Alunos ativos**, e **Acesso rápido** com **Fila de solicitações** e **Gestão de administradores**.
- Os números do resumo são fixos no código (`3` e `42`), não vêm do banco.
- Nenhum atalho abre tela. As abas **Cadastros**, **Logística** e **Mais** não respondem ao toque (`pointerEvents="none"` em `frontend/src/app/(administrador)/_layout.tsx`).
- Nenhum dos menus de gestão do requisito existe: **Gestão de Frota**, **Gestão de Motoristas**, **Gestão de Rotas**, **Gestão de Faculdades**, **Relatórios** e **Mural de Avisos** (AC-04, RN-006).
- Nenhuma função de aluno aparece para o administrador. ✅
- Execução confirmada pelo testador em 05/10/2026.
- Status: ❌ Reprovado — [GAP-HU003-UI-002](issues/GAP-HU003-UI-002-menus-de-gestao-do-admin-inexistentes.md).

---

#### CT-HU003-UI-003 — Menus do representante

**Preparação específica**

- Exige uma conta de representante. Sem ela, manter o caso pendente e registrar o motivo.

**Dados de entrada:** Credenciais do representante ativo.

**Passos**

1. Fazer login como representante (**Sou representante**).
2. Conferir as abas e as funções disponíveis.

**Resultado esperado**

- Somente **Lista de Embarque** e **Frequência da Rota do Dia**, dos alunos da universidade sob sua responsabilidade (AC-03, RN-015). No app atual: abas **Chamada**, **Minha Rota** e **Perfil**.
- Nenhuma função administrativa (**Gestão de Frota**, **Gestão de Administradores**) e nenhuma de aluno (**Agendamento de Transporte**).

**Resultado obtido**

- Não foi possível executar: o perfil representante ainda não existe no backend. O login reconhece representante pela tabela `representante`, que nenhuma migration cria, e não há rota para cadastrar representante (mesma situação do CT-HU002-UI-008).
- As telas do representante existem no app (`frontend/src/app/(representante)/`: `home`, `rota` e `perfil`), mas nenhuma conta consegue chegar a elas.
- Reexecutar quando o cadastro de representante existir.
- Registrado em 05/10/2026.
- Status: 🚫 Bloqueado.

---

#### CT-HU003-UI-004 — Ações exclusivas do administrador

**Preparação específica**

- Depende de as telas de gestão de frota e de mural de avisos estarem disponíveis. Se ainda não existirem no app, manter o caso pendente e registrar o motivo.

**Dados de entrada:** Login com cada perfil (administrador, aluno e representante); ações: cadastrar um ônibus, editar um ônibus, inativar um ônibus e publicar um aviso no mural.

**Passos**

1. Com o administrador, executar cada ação.
2. Com o aluno e com o representante, procurar cada ação na interface e, se possível, tentar executá-la (inclusive por link direto, como nos casos da Seção B).

**Resultado esperado**

- Administrador: as quatro ações são permitidas (RN-006).
- Aluno e representante: a ação não aparece na interface; se acessada por link direto, o app exibe **Acesso Negado** e nada é alterado.

**Resultado obtido**

- Não foi possível executar: não há no app telas para cadastrar, editar ou inativar ônibus, nem para publicar aviso no mural. A área do administrador ainda não tem os menus de gestão (ver CT-HU003-UI-002 e [GAP-HU003-UI-002](issues/GAP-HU003-UI-002-menus-de-gestao-do-admin-inexistentes.md)).
- Reexecutar quando as telas de gestão de frota e de mural existirem.
- Registrado em 05/10/2026.
- Status: 🚫 Bloqueado.

### Seção B — Acesso direto a telas de outro perfil

#### CT-HU003-UI-005 — Aluno abre tela administrativa por link

**Dados de entrada:** Aluno logado; link `exp://<IP>:8081/--/cadastros` (ver PC-03).

**Passos**

1. Com o aluno logado, abrir o link no Safari e voltar ao Expo Go quando ele abrir.
2. Observar a tela exibida.

**Resultado esperado**

- Exibir a tela **Acesso Negado**, com “Você não tem permissão para acessar esta área.” e “Erro 403 - Forbidden” (AC-05 e AC-06).
- Não exibir, nem por um instante, dados ou componentes da tela administrativa.

**Resultado obtido**

- Com o aluno logado, o link `exp://<IP>:8081/--/cadastros` abriu o app pelo Expo Go na tela **Acesso Negado**, com “Você não tem permissão para acessar esta área.”, “Erro 403 - Forbidden” e o botão **Voltar**.
- Nenhum dado ou componente da tela administrativa foi exibido.
- O botão **Voltar** levou ao painel do aluno (verificação do CT-HU003-UI-009).
- Execução confirmada pelo testador em 05/10/2026.
- Status: ✅ Aprovado.

---

#### CT-HU003-UI-006 — Representante abre tela administrativa por link

**Preparação específica**

- Exige uma conta de representante. Sem ela, manter o caso pendente e registrar o motivo.

**Dados de entrada:** Representante logado; link `exp://<IP>:8081/--/cadastros`.

**Passos**

1. Com o representante logado, abrir o link.
2. Observar a tela exibida.

**Resultado esperado**

- Exibir a tela **Acesso Negado**, sem dados administrativos (AC-05).

**Resultado obtido**

- Não foi possível executar: exige um representante logado, e o perfil representante ainda não existe no backend (ver CT-HU003-UI-003).
- Registrado em 05/10/2026.
- Status: 🚫 Bloqueado.

---

#### CT-HU003-UI-007 — Administrador abre tela do aluno por link

**Dados de entrada:** Administrador logado; link `exp://<IP>:8081/--/carteirinha-digital`.

**Passos**

1. Com o administrador logado, abrir o link.
2. Observar a tela exibida.

**Resultado esperado**

- Exibir a tela **Acesso Negado**, sem dados de carteirinha ou de qualquer aluno.

**Resultado obtido**

- Com o administrador logado, o link `exp://<IP>:8081/--/carteirinha-digital` abriu a tela da **carteirinha digital** por um instante; logo depois o app trocou para **Acesso Negado** (“Você não tem permissão para acessar esta área.” e “Erro 403 - Forbidden”).
- A API bloqueia corretamente: `GET /alunos/me/carteirinha` com o token do administrador responde `403 Acesso negado`.
- O problema está no app: o bloqueio por perfil (`AuthContext.tsx`) roda num `useEffect`, depois que a tela já foi desenhada. Enquanto isso, a carteirinha é montada com os dados da sessão (nome e e-mail do administrador) e valores de exemplo fixos no código (instituição, curso, foto), e o QR Code inclui o id, o e-mail e o início do token da sessão.
- Na repetição feita no CT-HU003-UI-009, a carteirinha não chegou a ser percebida: o defeito é intermitente e depende do tempo de carregamento, mas basta uma ocorrência para reprovar o caso.
- Execução confirmada pelo testador em 05/10/2026.
- Status: ❌ Reprovado — [BUG-HU003-UI-007](issues/BUG-HU003-UI-007-tela-protegida-aparece-antes-do-bloqueio.md).

---

#### CT-HU003-UI-008 — Aluno abre tela do representante por link

**Dados de entrada:** Aluno logado; link `exp://<IP>:8081/--/rota`.

**Passos**

1. Com o aluno logado, abrir o link.
2. Observar a tela exibida.

**Resultado esperado**

- Exibir a tela **Acesso Negado**, sem a lista de embarque nem dados da rota.

**Resultado obtido**

- Com o aluno logado, o link `exp://<IP>:8081/--/rota` abriu o app direto na tela **Acesso Negado**, com “Você não tem permissão para acessar esta área.” e “Erro 403 - Forbidden”.
- A tela **Minha Rota** não foi percebida antes do bloqueio. Ela só exibe um título, então um eventual instante de exibição, como o do CT-HU003-UI-007, é difícil de notar; a correção do [BUG-HU003-UI-007](issues/BUG-HU003-UI-007-tela-protegida-aparece-antes-do-bloqueio.md) também cobre este caso.
- O botão **Voltar** levou ao painel do aluno.
- Execução confirmada pelo testador em 05/10/2026.
- Status: ✅ Aprovado.

---

#### CT-HU003-UI-009 — Voltar da tela Acesso Negado

**Dados de entrada:** Tela **Acesso Negado** aberta pelo CT-005 (aluno) e pelo CT-007 (administrador).

**Passos**

1. Na tela **Acesso Negado**, tocar em **Voltar**.
2. Conferir a tela exibida em cada perfil.

**Resultado esperado**

- Aluno volta para a tela **Início** do aluno; administrador volta para o **Painel**.
- A sessão continua ativa: não pede login de novo.

**Resultado obtido**

- Aluno: nas telas Acesso Negado abertas pelo CT-HU003-UI-005 e pelo CT-HU003-UI-008, **Voltar** levou ao painel do aluno.
- Administrador: na tela Acesso Negado aberta pelo link `carteirinha-digital`, **Voltar** levou ao **Painel** do administrador.
- Nos dois perfis a sessão continuou ativa, sem pedir login de novo.
- Nesta repetição do link `carteirinha-digital` com o administrador, a carteirinha não chegou a ser percebida antes do Acesso Negado. O defeito do CT-HU003-UI-007 é intermitente: depende do tempo de carregamento.
- Execução confirmada pelo testador em 05/10/2026.
- Status: ✅ Aprovado.

### Seção C — Sessão e mudança de perfil

#### CT-HU003-UI-010 — Link de área protegida sem login

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

#### CT-HU003-UI-011 — Conta inativada durante a sessão

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
| CT-HU003-UI-007 | Tela de outro perfil aparece por um instante antes do Acesso Negado: o bloqueio só ocorre depois de a tela ser desenhada. | [BUG-HU003-UI-007-tela-protegida-aparece-antes-do-bloqueio](issues/BUG-HU003-UI-007-tela-protegida-aparece-antes-do-bloqueio.md) |
| CT-HU003-UI-002 | Área do administrador sem os menus de gestão do requisito: painel provisório, atalhos sem ação e abas desativadas. | [GAP-HU003-UI-002-menus-de-gestao-do-admin-inexistentes](issues/GAP-HU003-UI-002-menus-de-gestao-do-admin-inexistentes.md) |

## Observações gerais

- Referências: [HU-003, seção 7.2.3](../../../../../docs/requisitos.md), [contexto de autenticação (redirecionamento por perfil)](../../../../../frontend/src/contexts/AuthContext.tsx), [tela Acesso Negado](../../../../../frontend/src/app/acesso-negado.tsx) e [interceptador da API](../../../../../frontend/src/api/api.ts). A suíte de API correspondente está em [`../api/API-HU-003.md`](../api/API-HU-003.md), que cobre o bloqueio 403 diretamente nos endpoints.
- As telas **Início** do aluno e do administrador têm o mesmo nome de rota (`home`), por isso os links diretos usam telas exclusivas de cada perfil (`cadastros`, `carteirinha-digital` e `rota`).
- No código atual, quando a API responde 401 (sessão inválida), o app apaga o token salvo, mas não atualiza a tela nem leva para o login. O CT-011 verifica se o usuário fica preso numa área sem acesso.
- Cenários BDD de referência: [`bdd/features/epico-01/HU-003.feature`](../../../../../bdd/features/epico-01/HU-003.feature). Os nomes de menu esperados (CT-001 a CT-003) e as ações do CT-004 vêm do BDD; o cenário de validação de token em toda requisição (AC-07) é `@teste_api` e fica com a suíte de API.
- O BDD exemplifica o FA-002 com a **promoção** de um aluno a administrador durante a sessão. Como o app atual não oferece essa operação, o CT-011 usa a **inativação**, também prevista no AC-08. Incluir a promoção quando ela existir.
- Registrar o texto exato de cada tela e mensagem. Ocultar senhas, tokens e dados pessoais nas evidências.
