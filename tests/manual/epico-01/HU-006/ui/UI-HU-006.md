# Testes manuais de UI — HU-006 — Gerenciamento de Administradores

## Identificação da suíte

| Campo           | Valor                                                                                   |
| --------------- | --------------------------------------------------------------------------------------- |
| Módulo          | Autenticação e Gestão de Conta                                                          |
| Funcionalidade  | HU-006 — Gerenciamento de Administradores                                               |
| Camada          | UI                                                                                      |
| Tipo de teste   | Funcional manual — suíte essencial                                                      |
| Tela            | Painel do administrador → Gestão de administradores (listagem, Cadastrar Administrador e Editar Administrador) |
| Ambiente        | Desenvolvimento — app mobile no iPhone (Expo Go)                                        |
| Total de casos  | 10 |
| Última execução | 06/10/2026                                                                              |
| Testador        | Cauan Ricardo                                                                           |

## Resultado geral

| Situação        | Total | ✅ Passaram | ❌ Falharam | ⏳ Pendentes |
| --------------- | ----: | ----------: | ----------: | -----------: |
| ⏳ Em execução | 10 | 6 | 3 | 1 |

## Pré-condições

| ID    | Descrição |
| ----- | --------- |
| PC-01 | Aplicativo aberto no iPhone pelo **Expo Go**, com a API e o serviço de e-mail (SMTP) disponíveis. Sem e-mail, o cadastro de administrador falha (a senha temporária é enviada por e-mail). Em ambiente local, usar uma caixa de teste (ex.: Mailpit). |
| PC-02 | **Administrador A** (o testador) logado: Painel → **Gestão de administradores**. |
| PC-03 | E-mail de um **aluno já cadastrado**, para o CT-003, e credenciais de um **aluno ativo**, para o CT-007. |
| PC-04 | Dados fictícios do novo administrador **B**: nome `Carlos Andrade`, e-mail `carlos.andrade@example.com` (caixa de teste). O CT-002 cria B; os casos seguintes usam B. |
| PC-05 | O token de acesso dura 15 minutos e o app ainda não o renova (#123). Se uma ação falhar com “não autorizado”, sair, entrar de novo e repetir o caso. |

## Resumo da execução

Executar na ordem abaixo. São **10 casos essenciais**, em três seções. Os IDs completos usam o prefixo `CT-HU006-UI-`, numerados de 001 a 010.

### Seção A — Listagem, cadastro e edição

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU006-UI-001 | Acessar a gestão de administradores | Painel → Gestão de administradores | Listagem com busca, filtro de inativos e botão Novo | ✅ APROVADO | A tela Administradores exibiu a lista, o campo Buscar por nome, a chave Mostrar inativos e o botão Novo; a busca filtra e informa quando não há resultado; a seta voltou ao Painel. O filtro de inativos será conferido no CT-005, quando houver inativo. Confirmado pelo testador em 06/10/2026. |
| CT-HU006-UI-002 | Cadastrar novo administrador | Nome e e-mail novos | Confirmação, sucesso e B na listagem; e-mail com senha | ❌ REPROVADO | O administrador foi criado (HTTP 201) após a confirmação “Finalizar cadastro?” e o e-mail com a senha temporária chegou. Porém a listagem não foi atualizada (B só apareceu depois de fechar e reabrir o app), o formulário manteve os dados ao abrir Novo de novo, e a confirmação foi um aviso rápido sem estilo (“Cadastro realizado com sucesso”). Ver [BUG-HU006-UI-002](issues/BUG-HU006-UI-002-lista-e-formulario-nao-atualizam.md) e [MELHORIA-HU006-UI-002](issues/MELHORIA-HU006-UI-002-confirmacao-sem-padrao.md). Executado pelo testador em 06/10/2026. |
| CT-HU006-UI-003 | Cadastro rejeitado | E-mail de aluno; nome `Ab`; e-mail `carlos@`; campos vazios | Mensagem do AC-03 no duplicado; alerta no campo nos demais | ✅ APROVADO | E-mail de aluno: “Este e-mail já está em uso por outro usuário no sistema.” (409); nome `Ab`: “Informe seu nome completo”; e-mail `carlos@`: “E-mail inválido”; campos vazios: obrigatoriedade. Os três últimos foram barrados no app, sem chamar a API. Confirmado pelo testador em 06/10/2026. |
| CT-HU006-UI-004 | Editar administrador | Nome novo; e-mail em uso | Sucesso e listagem atualizada; duplicado bloqueado | ❌ REPROVADO | O nome foi salvo (HTTP 200) e o e-mail de aluno foi bloqueado com a mensagem do AC-03 (409), sem alterar o e-mail. Porém a listagem só mostrou o nome novo depois de fechar e reabrir o app, e a confirmação foi o aviso rápido sem estilo. Ver [BUG-HU006-UI-002](issues/BUG-HU006-UI-002-lista-e-formulario-nao-atualizam.md) e [MELHORIA-HU006-UI-002](issues/MELHORIA-HU006-UI-002-confirmacao-sem-padrao.md). Executado pelo testador em 06/10/2026. |

### Seção B — Inativação e controle de acesso

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU006-UI-005 | Inativar outro administrador | Administrador B | Confirmação, sucesso, B entre os inativos; B não entra | ✅ APROVADO | Pediu confirmação (cancelar manteve B ativo); ao confirmar, a listagem atualizou na hora e B passou a inativo, só com a ação Reativar; o filtro Mostrar inativos funcionou; auditoria gravada e login de B recusado. A confirmação foi o aviso rápido “Administrador inativado” ([MELHORIA-HU006-UI-002](issues/MELHORIA-HU006-UI-002-confirmacao-sem-padrao.md)). Confirmado pelo testador em 06/10/2026. |
| CT-HU006-UI-006 | Auto-inativação bloqueada | Administrador A | Alerta “Não é possível inativar a conta atualmente em uso.” | ✅ APROVADO | Ao tocar na lixeira do próprio administrador, o app mostrou direto “Ação Bloqueada — Não é possível inativar a conta atualmente em uso.”, sem pedir confirmação; a conta continuou ativa. Sugestão do testador: esconder ou desabilitar a ação na própria conta ([MELHORIA-HU006-UI-006](issues/MELHORIA-HU006-UI-006-acao-de-inativar-na-propria-conta.md)). Confirmado pelo testador em 06/10/2026. |
| CT-HU006-UI-007 | Aluno tenta abrir a gestão por link | Aluno logado; link `administradores` | Acesso Negado, sem dados de administradores | ✅ APROVADO | Com o aluno logado, o link `administradores` abriu Acesso Negado (“Erro 403 - Forbidden”), sem exibir a listagem; Voltar levou ao Início do aluno. Confirmado pelo testador em 06/10/2026. |

### Seção C — Regressões e robustez

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU006-UI-008 | E-mail com espaços e maiúsculas | `" Carla.Mendes@Example.com "` | Aceito e salvo como `carla.mendes@example.com` | ✅ APROVADO | O e-mail `" Carla.Mendes@Example.com "` foi aceito e exibido na listagem como `carla.mendes@example.com` (confirmado pela API). Com o app recém-aberto, a listagem atualizou logo após o cadastro. Confirmado pelo testador em 06/10/2026. |
| CT-HU006-UI-009 | Sair sem salvar | Alterar nome em Editar e tocar na seta | Pedir confirmação; nada salvo; ao reabrir, dados do banco | ❌ REPROVADO | A seta saiu sem confirmação e foi para o Painel, não para a listagem. Nada foi salvo (a API manteve “Carla mendes”), mas ao abrir Editar de novo o campo ainda mostrava o texto não salvo “Carla teste”. Ver [BUG-HU006-UI-009](issues/BUG-HU006-UI-009-editar-sai-sem-confirmar-e-guarda-texto.md). Executado pelo testador em 06/10/2026. |
| CT-HU006-UI-010 | Falha de conexão ao salvar | Wi-Fi e dados desligados ao cadastrar e ao inativar | Mensagem de conexão, sem travar; dados mantidos para nova tentativa | ⏳ PENDENTE | Não executado. |

## Detalhamento dos casos

### Seção A — Listagem, cadastro e edição

#### CT-HU006-UI-001 — Acessar a gestão de administradores

**Dados de entrada:** Administrador A logado no **Painel**.

**Passos**

1. No **Painel**, tocar em **Gestão de administradores**.
2. Conferir os elementos da tela.
3. Ligar e desligar **Mostrar inativos**; digitar parte de um nome em **Buscar por nome**.

**Resultado esperado**

- Abrir a tela **Administradores** com a lista de administradores cadastrados, o campo **Buscar por nome**, o filtro **Mostrar inativos** e o botão **Novo** (AC-01).
- Com **Mostrar inativos** ligado, os inativos aparecem; desligado, só os ativos (AC-08).
- A busca filtra a lista pelo nome.
- A seta de voltar retorna ao **Painel**.

**Resultado obtido**

- **Painel → Gestão de administradores** abriu a tela **Administradores**, com a lista (apenas o administrador padrão), o campo **Buscar por nome**, a chave **Mostrar inativos** e o botão **Novo**. ✅
- A busca filtrou a lista pelo nome; com um termo sem correspondência, a tela informou que não há resultados. ✅
- **Mostrar inativos** ligado e desligado não alterou a lista, pois ainda não havia administrador inativo; o efeito do filtro é conferido no CT-HU006-UI-005.
- A seta de voltar retornou ao **Painel**. ✅
- Execução confirmada pelo testador em 06/10/2026.
- Status: ✅ Aprovado.

---

#### CT-HU006-UI-002 — Cadastrar novo administrador

**Dados de entrada:** Nome `Carlos Andrade`; e-mail `carlos.andrade@example.com`.

**Passos**

1. Tocar em **Novo** e preencher **Nome Completo** e **E-mail** do novo administrador.
2. Tocar em salvar e conferir a confirmação **Finalizar cadastro?**; confirmar.
3. Conferir a mensagem e a listagem.
4. Abrir a caixa de teste e localizar o e-mail com a senha temporária.
5. (Opcional) Fechar o app, entrar com o e-mail de B e a senha temporária e tocar em **Sou administrador**.

**Resultado esperado**

- Pedir confirmação antes de criar.
- Exibir a confirmação de sucesso e voltar para a listagem, com **Carlos Andrade** entre os ativos (AC-02, AC-07). Registrar o texto exato da mensagem (o requisito pede “Operação realizada com sucesso”).
- E-mail com a senha temporária recebido; B consegue entrar no Painel.

**Resultado obtido**

- Dados usados pelo testador: nome `Carlos Andrade`, e-mail `carlos@gmail.com` (no lugar do sugerido `carlos.andrade@example.com`).
- **Novo** → formulário preenchido → salvar: apareceu a confirmação **Finalizar cadastro?** (“Essa ação não poderá ser desfeita”). ✅
- Ao confirmar, o administrador foi criado: o backend registrou `POST /administradores` → 201, e B (id 5) consta no banco como ativo. ✅
- O e-mail **Acesso de administrador - GOUCE** chegou na caixa de teste para `carlos@gmail.com`, com a senha temporária. ✅
- A confirmação foi um aviso preto rápido (Snackbar, cerca de 1,5 s), sem o estilo do app, com “Cadastro realizado com sucesso” — não “Operação realizada com sucesso” (AC-07). O testador não conseguiu ler a tempo. ❌
- De volta à listagem, **Carlos Andrade não apareceu**. Voltando ao **Painel** e entrando de novo em **Gestão de administradores**, continuou sem aparecer; só apareceu depois de fechar e reabrir o app. ❌
- Ao tocar em **Novo** de novo, o formulário ainda estava preenchido com os dados do cadastro anterior; após reabrir o app, veio limpo. ❌
- Causa aparente: a listagem só é carregada na montagem da tela (`useEffect` em `frontend/src/app/(administrador)/administradores/index.tsx`) e só é recarregada após inativar/reativar; as telas da gestão ficam dentro de uma aba oculta (`href: null` em `(administrador)/_layout.tsx`) e não são desmontadas, então o formulário guarda o estado (mesmo padrão das #125 e #135).
- Execução confirmada pelo testador em 06/10/2026.
- Status: ❌ Reprovado — [BUG-HU006-UI-002](issues/BUG-HU006-UI-002-lista-e-formulario-nao-atualizam.md).

---

#### CT-HU006-UI-003 — Cadastro rejeitado

**Dados de entrada:** Quatro tentativas em **Novo**: e-mail de um aluno já cadastrado (PC-03) com nome `Pedro Lima`; nome `Ab` com e-mail novo; e-mail `carlos@` com nome `Pedro Lima`; os dois campos vazios.

**Passos**

1. Preencher a tentativa e tocar em salvar (confirmar, se pedir).
2. Anotar a mensagem de cada tentativa.
3. Ao final, voltar e conferir que nenhum administrador novo apareceu na listagem.

**Resultado esperado**

- E-mail de aluno: bloquear com “Este e-mail já está em uso por outro usuário no sistema.” (AC-03, FA-001).
- Nome curto, e-mail inválido e campos vazios: alerta em português no próprio campo, sem enviar.
- Nenhum administrador criado.

**Resultado obtido**

- E-mail de aluno (`qa.hu005@gmail.com`): “Este e-mail já está em uso por outro usuário no sistema.” — o backend respondeu 409. ✅
- Nome `Ab`: alerta no campo, “Informe seu nome completo”. ✅
- E-mail `carlos@`: alerta no campo, “E-mail inválido”. ✅
- Campos vazios: o app pediu o preenchimento dos campos obrigatórios. ✅
- As tentativas 2 a 4 foram barradas no próprio app (nenhum `POST /administradores` no log do backend); conferido pela API que nenhuma delas criou administrador.
- Teste adicional do testador: e-mail com espaços nas pontas e nome `pedro lima` — aceito e salvo sem espaços (`c@gmail.xom`, com erro de digitação no domínio, mas formato válido). Relaciona-se ao CT-HU006-UI-008.
- Execução confirmada pelo testador em 06/10/2026.
- Status: ✅ Aprovado.

---

#### CT-HU006-UI-004 — Editar administrador

**Dados de entrada:** Administrador B. Primeira tentativa: nome `Carlos Andrade Filho`. Segunda: e-mail de um aluno já cadastrado.

**Passos**

1. Na listagem, tocar em **Carlos Andrade** para abrir **Editar Administrador** e conferir que os campos vêm preenchidos.
2. Alterar o nome e salvar; conferir a mensagem e a listagem.
3. Abrir B de novo, trocar o e-mail pelo de um aluno e salvar.

**Resultado esperado**

- Nome alterado com mensagem de sucesso e listagem atualizada com **Carlos Andrade Filho** (AC-04).
- E-mail de aluno bloqueado com a mensagem do AC-03; o e-mail de B não muda.

**Resultado obtido**

- Após fechar e reabrir o app, **Carlos Andrade** abriu em **Editar Administrador**.
- Nome alterado para `Carlos Andrade Filho`: salvo (backend `PATCH /administradores/5` → 200; nome confirmado pela API). A confirmação foi um aviso preto rápido, sem o estilo do app, com “Alterações realizadas com sucesso” (texto do código, `editar.tsx`). ✅ / ❌
- A listagem **não** mostrou o nome novo; só depois de fechar e reabrir o app. ❌
- E-mail trocado para o de um aluno (`qa.hu005@gmail.com`): bloqueado com “Este e-mail já está em uso por outro usuário no sistema.” (backend 409); o e-mail de B continuou `carlos@gmail.com`. ✅
- Execução confirmada pelo testador em 06/10/2026.
- Status: ❌ Reprovado — [BUG-HU006-UI-002](issues/BUG-HU006-UI-002-lista-e-formulario-nao-atualizam.md).

### Seção B — Inativação e controle de acesso

#### CT-HU006-UI-005 — Inativar outro administrador

**Dados de entrada:** Administrador B ativo.

**Passos**

1. Na listagem, tocar na ação de inativar de B e conferir a confirmação **Inativar administrador?**.
2. Escolher cancelar e conferir que B continua ativo.
3. Repetir e confirmar.
4. Ligar **Mostrar inativos** e localizar B.
5. (Opcional) Tentar entrar com as credenciais de B.

**Resultado esperado**

- Pedir confirmação; cancelar não altera nada.
- Ao confirmar, exibir a confirmação de sucesso e mover B para os inativos (AC-05, AC-07). Registrar o texto exato (o requisito pede “Operação realizada com sucesso”).
- B continua listado como inativo (o registro não é apagado) e não consegue mais entrar.

**Resultado obtido**

- A ação de inativar pediu a confirmação **Inativar administrador?**; cancelar manteve B ativo. ✅
- Ao confirmar, apareceu o aviso preto rápido “Administrador inativado” (sem o estilo do app; ver [MELHORIA-HU006-UI-002](issues/MELHORIA-HU006-UI-002-confirmacao-sem-padrao.md)) e a listagem **atualizou na hora**: B passou a inativo, sem as ações de editar e excluir, apenas com **Reativar** (“Reativar Carlos?”, usando o primeiro nome). ✅
- **Mostrar inativos**: desligado, só os ativos; ligado, B aparece entre os inativos — o registro não foi apagado (soft delete). ✅ (completa a verificação do CT-HU006-UI-001)
- Conferências pela API e pelo banco: `GET /administradores?ativo=false` → B; `log_auditoria` com `usuario_id` 1, ação `INATIVAR`, `administrador` 5, `ativo` → `inativo` e data/hora; login de B com a senha temporária → HTTP 401 “Usuário administrativo inativo.” ✅
- Execução confirmada pelo testador em 06/10/2026.
- Status: ✅ Aprovado.

---

#### CT-HU006-UI-006 — Auto-inativação bloqueada

**Dados de entrada:** Administrador A (o próprio usuário logado).

**Passos**

1. Na listagem, localizar o próprio administrador A.
2. Tocar na ação de inativar.

**Resultado esperado**

- Bloquear com o alerta “Não é possível inativar a conta atualmente em uso.” (AC-06, FA-002).
- A continua ativo e logado.

**Resultado obtido**

- Na linha do **Administrador Padrao** (o próprio usuário logado), tocar na ação de inativar (ícone de lixeira) mostrou direto o pop-up **Ação Bloqueada** — “Não é possível inativar a conta atualmente em uso.” —, sem a pergunta de confirmação. ✅
- A conta continuou ativa e logada. ✅
- Sugestão de UX do testador: a ação não deveria ser oferecida na própria conta; e o ícone de lixeira sugere exclusão, embora a ação seja inativar (soft delete). Registrado em [MELHORIA-HU006-UI-006](issues/MELHORIA-HU006-UI-006-acao-de-inativar-na-propria-conta.md).
- Execução confirmada pelo testador em 06/10/2026.
- Status: ✅ Aprovado.

---

#### CT-HU006-UI-007 — Aluno tenta abrir a gestão por link

**Dados de entrada:** Aluno ativo logado (PC-03); link `exp://<IP do computador>:8081/--/administradores`, aberto no Safari do iPhone (mesmo IP e porta mostrados pelo Expo no terminal).

**Passos**

1. Entrar como aluno.
2. Abrir o link no Safari e confirmar a abertura no Expo Go.
3. Observar a tela exibida e tocar em **Voltar**.

**Resultado esperado**

- Exibir **Acesso Negado** (“Erro 403 - Forbidden”), sem mostrar a listagem de administradores, nem por um instante (AC-09, FA-003, RN-006).
- **Voltar** leva à área do aluno.
- Se a lista aparecer por um instante antes do bloqueio, registrar e relacionar à #111.

**Resultado obtido**

- Aluno `qa.hu005@gmail.com` logado; link `exp://<IP>:8081/--/administradores` aberto pelo Safari.
- O app exibiu **Acesso Negado** com “Erro 403 - Forbidden”, sem mostrar a listagem de administradores (o testador não percebeu a lista antes do bloqueio). ✅
- **Voltar** levou ao **Início** do aluno. ✅
- Execução confirmada pelo testador em 06/10/2026.
- Status: ✅ Aprovado.

### Seção C — Regressões e robustez

#### CT-HU006-UI-008 — E-mail com espaços e maiúsculas

**Dados de entrada:** Nome `Carla Mendes`; e-mail `" Carla.Mendes@Example.com "` (com espaço no início e no fim e letras maiúsculas).

**Passos**

1. Tocar em **Novo**, preencher e salvar (confirmar).
2. Conferir o e-mail exibido na listagem.

**Resultado esperado**

- O cadastro é aceito: os espaços das pontas são removidos e o e-mail é salvo e exibido como `carla.mendes@example.com`.
- Regressão do defeito já encontrado em outras telas (cadastro #51, login #97, alterar e-mail #122). Se recusar por causa dos espaços, relacionar a essas issues.
- Ao final, inativar Carla Mendes para não interferir em outras suítes.

**Resultado obtido**

- Com o app recém-aberto, **Novo** com nome `Carla Mendes` e e-mail `" Carla.Mendes@Example.com "` (espaços nas pontas e maiúsculas): cadastro aceito. ✅
- A listagem mostrou o e-mail como `carla.mendes@example.com`, em minúsculas e sem espaços; confirmado pela API (`GET /administradores`). ✅
- Desta vez, a listagem atualizou logo após o cadastro, sem reabrir o app. Diferença em relação ao CT-HU006-UI-002: lá, a gestão já tinha sido aberta antes na mesma sessão; aqui, foi a primeira abertura. O defeito do [BUG-HU006-UI-002](issues/BUG-HU006-UI-002-lista-e-formulario-nao-atualizam.md) é intermitente e depende do caminho percorrido.
- Ao final, Carla Mendes deve ser inativada para não interferir em outras suítes.
- Execução confirmada pelo testador em 06/10/2026.
- Status: ✅ Aprovado.

---

#### CT-HU006-UI-009 — Sair sem salvar

**Dados de entrada:** Administrador B em **Editar Administrador**; nome alterado para `Carlos Teste`, sem salvar.

**Passos**

1. Abrir B em **Editar Administrador** e alterar o nome, sem salvar.
2. Tocar na seta de voltar.
3. Conferir a listagem e abrir B de novo.

**Resultado esperado**

- A seta pede confirmação antes de descartar as alterações (padrão do login e do cadastro).
- Nada é salvo: a listagem mantém o nome anterior.
- Ao reabrir **Editar Administrador**, os campos mostram os dados salvos, e não o texto digitado antes (mesmo padrão do defeito #125 da HU-005).

**Resultado obtido**

- Em **Editar Administrador** da Carla, o nome foi alterado para `Carla teste`, sem salvar.
- A seta de voltar saiu **sem pedir confirmação** e levou ao **Painel**, e não à listagem de administradores. ❌
- Nada foi salvo: a listagem e a API continuaram com “Carla mendes”. ✅
- Ao abrir a Carla em **Editar** de novo, o campo ainda mostrava o texto não salvo **“Carla teste”**; um toque em salvar gravaria o valor descartado. ❌
- Causa aparente: `editar.tsx` chama `router.back()` direto na seta, sem confirmação; e as telas da gestão não são desmontadas (aba oculta), então o formulário guarda o que foi digitado — mesmo padrão da #125 (Editar perfil do aluno).
- Execução confirmada pelo testador em 06/10/2026.
- Status: ❌ Reprovado — [BUG-HU006-UI-009](issues/BUG-HU006-UI-009-editar-sai-sem-confirmar-e-guarda-texto.md).

---

#### CT-HU006-UI-010 — Falha de conexão ao salvar

**Dados de entrada:** Duas tentativas com Wi-Fi e dados móveis desligados: cadastrar um administrador (`Rita Souza`, `rita.souza@example.com`); inativar um administrador ativo.

**Passos**

1. Preencher o cadastro, desligar a conexão e confirmar o salvamento.
2. Fechar o aviso e conferir a tela; religar a conexão e salvar de novo.
3. Repetir a ideia com a inativação.

**Resultado esperado**

- Mensagem clara de falha de conexão, em português, sem travar o app.
- No cadastro, os campos continuam preenchidos para nova tentativa; com a conexão de volta, o cadastro é concluído sem redigitar.
- Na inativação, nada muda enquanto estiver sem conexão.
- Ao final, inativar Rita Souza.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-HU006-UI-002 | Após cadastrar, a listagem não mostra o novo administrador e o formulário mantém os dados até reabrir o app. | [BUG-HU006-UI-002](issues/BUG-HU006-UI-002-lista-e-formulario-nao-atualizam.md) |
| CT-HU006-UI-009 | Editar administrador: a seta sai sem confirmação, vai para o Painel e, ao reabrir, mostra o texto não salvo. | [BUG-HU006-UI-009](issues/BUG-HU006-UI-009-editar-sai-sem-confirmar-e-guarda-texto.md) |
| CT-HU006-UI-006 | Melhoria: a ação de inativar aparece na própria conta (e usa ícone de lixeira para uma inativação). | [MELHORIA-HU006-UI-006](issues/MELHORIA-HU006-UI-006-acao-de-inativar-na-propria-conta.md) |
| CT-HU006-UI-002 | Melhoria: confirmação do cadastro é um aviso rápido sem estilo e com texto diferente do AC-07. | [MELHORIA-HU006-UI-002](issues/MELHORIA-HU006-UI-002-confirmacao-sem-padrao.md) |

## Observações gerais

- Referências: [HU-006, seção 7.2.6](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-01/HU-006.feature), [telas de gestão](../../../../../frontend/src/app/%28administrador%29/administradores/) e [suíte de API](../api/API-HU-006.md).
- A tela **Cadastrar Administrador** também permite buscar um aluno aprovado e torná-lo administrador (“Tornar administrador?”), e a listagem permite **reativar** um inativo. Essas ações não estão no requisito da HU-006 e ficam fora desta rodada; levar ao líder se devem ganhar casos.
- O log de auditoria da inativação (AC-05) não aparece na tela; é conferido na suíte de API (CT-HU006-API-005).
- Para trocar de conta: o administrador ainda não tem botão de sair acessível (#101); fechar o app para trocar de usuário.
- Ao final, manter B inativo para não interferir em outras suítes. Ocultar senhas e dados pessoais nas evidências.
