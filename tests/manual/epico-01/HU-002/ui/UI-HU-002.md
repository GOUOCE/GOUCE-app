# Testes manuais de UI — HU-002 — Login de Usuários

## Identificação da suíte

| Campo           | Valor                                                                                   |
| --------------- | --------------------------------------------------------------------------------------- |
| Módulo          | Autenticação e Gestão de Conta                                                          |
| Funcionalidade  | HU-002 — Login de Usuários                                                              |
| Camada          | UI                                                                                      |
| Tipo de teste   | Funcional manual                                                                        |
| Tela            | Boas-vindas, Entrar (e-mail e senha), Como você quer entrar? (seleção de perfil) e telas iniciais de cada perfil |
| Ambiente        | Desenvolvimento — app mobile no iPhone (Expo)                                           |
| Total de casos  | 18 |
| Última execução | 05/10/2026                                                                           |
| Testador        | Cauan Ricardo                                                                           |

## Resultado geral

| Situação        | Total | ✅ Passaram | ❌ Falharam | 🚫 Bloqueados | ⏳ Pendentes |
| --------------- | ----: | ----------: | ----------: | ------------: | -----------: |
| ⏳ Em execução | 18 | 7 | 2 | 1 | 8 |

## Pré-condições

| ID    | Descrição |
| ----- | --------- |
| PC-01 | Aplicativo aberto no iPhone, sem sessão ativa, com a API disponível e conexão ativa (exceto no CT-017). |
| PC-02 | Contas de teste fictícias: **aluno ativo** (cadastro aprovado), **aluno pendente** (cadastro recém-feito, sem aprovação), **aluno inativado** (reprovado ou inativado pelo administrador), **administrador ativo** e, se existir, **representante ativo**. Anotar e-mail e senha de cada uma. |
| PC-03 | Fluxo de entrada atual: **Entrar** (boas-vindas) → tela **Entrar** (e-mail e senha) → botão **Entrar** → tela **Como você quer entrar?** (Sou aluno, Sou representante, Sou administrador). A autenticação acontece ao tocar no perfil. |
| PC-04 | Ter um cronômetro (do próprio iPhone) para o CT-006, e acesso às configurações de Wi-Fi e dados móveis para o CT-017. |

## Resumo da execução

Executar na ordem abaixo. São **18 casos**, agrupados em cinco seções. Não marcar um caso com várias entradas como aprovado se faltar alguma variação.

Os IDs completos usam o prefixo `CT-HU002-UI-`, numerados de 001 a 018 na ordem de leitura.

### Seção A — Tela de login e campos

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU002-UI-001 | Elementos da tela de login | Abrir Entrar a partir das boas-vindas | Exibir E-mail, Senha, Esqueci minha senha, Entrar e Criar conta de aluno | ✅ APROVADO | Todos os elementos esperados exibidos; senha inicialmente oculta. Confirmado pelo testador em 05/10/2026. |
| CT-HU002-UI-002 | Campos obrigatórios vazios | E-mail vazio; senha vazia; ambos vazios | Bloquear o avanço e indicar cada campo pendente | ✅ APROVADO | Nas três tentativas (apenas senha preenchida, apenas e-mail preenchido e ambos vazios), o avanço foi bloqueado e cada campo vazio foi indicado com a mensagem de obrigatoriedade em português. Confirmado pelo testador em 05/10/2026. |
| CT-HU002-UI-003 | E-mail em formato inválido | maria; maria@; maria@example | Indicar e-mail inválido e bloquear o avanço | ❌ REPROVADO | Os formatos inválidos foram recusados corretamente, mas um e-mail válido com espaço no início ou no fim (` aluno@gmail.com`, `aluno@gmail.com `) também é recusado com “Informe um e-mail válido”: o login não remove os espaços antes de validar, como o cadastro já faz. Ver [BUG-HU002-UI-003](issues/BUG-HU002-UI-003-email-com-espacos-recusado.md). Executado pelo testador em 05/10/2026. |
| CT-HU002-UI-004 | E-mail com caixa mista e espaços | E-mail do aluno com letras maiúsculas; depois com espaços nas pontas | Reconhecer o mesmo e-mail e autenticar | ✅ APROVADO | O aluno ativo autenticou com o e-mail em letras maiúsculas. A recusa do e-mail com espaços nas pontas está registrada no CT-003. Sugestão do testador: exibir o e-mail em minúsculas no campo ([MELHORIA-HU002-UI-004](issues/MELHORIA-HU002-UI-004-email-em-minusculas.md)). Confirmado pelo testador em 05/10/2026. |
| CT-HU002-UI-005 | Ocultar e exibir senha | Senha válida; ícone de olho | Alternar a visibilidade sem alterar o valor | ✅ APROVADO | O ícone de olho alternou a senha entre visível e oculta, sem alterar o valor digitado. Confirmado pelo testador em 05/10/2026. |

### Seção B — Seleção de perfil e redirecionamento

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU002-UI-006 | Login válido de aluno | Credenciais do aluno ativo; Sou aluno | Entrar na área do aluno em até 3 segundos | ✅ APROVADO | O aluno ativo entrou na área do aluno em menos de 3 segundos. A conta foi aprovada pela API, porque o painel do administrador ainda não tem a tela de aprovação. Confirmado pelo testador em 05/10/2026. |
| CT-HU002-UI-007 | Login válido de administrador | Credenciais do administrador; Sou administrador | Entrar no Painel do administrador | ✅ APROVADO | O administrador padrão autenticou e entrou no Painel, com as abas Painel, Cadastros, Logística e Mais. O conteúdo do painel ainda é provisório (fora do escopo da HU-002). Confirmado pelo testador em 05/10/2026. |
| CT-HU002-UI-008 | Login válido de representante | Credenciais do representante; Sou representante | Entrar na área de Chamada do representante | 🚫 BLOQUEADO | O perfil representante ainda não existe no backend: o login procura a tabela `representante`, que nenhuma migration cria, e não há rota para cadastrar representante. Nenhuma conta pode ter esse perfil. Registrado em 05/10/2026. |
| CT-HU002-UI-009 | Perfil escolhido diferente do perfil da conta | Aluno escolhe Sou administrador; administrador escolhe Sou aluno | Não entrar sem aviso em um perfil diferente do escolhido | ❌ REPROVADO | A escolha do perfil é ignorada: o aluno que toca em Sou administrador ou Sou representante entra na área do aluno, e o administrador que toca em Sou aluno ou Sou representante entra no Painel do administrador, sempre sem aviso. Ver [BUG-HU002-UI-009](issues/BUG-HU002-UI-009-perfil-escolhido-ignorado.md). Confirmado pelo testador em 05/10/2026. |
| CT-HU002-UI-010 | Voltar da seleção de perfil | Seta de voltar; Continuar aqui; Sim, sair | Pedir confirmação e respeitar a escolha | ✅ APROVADO | A seta exibiu a confirmação; Continuar aqui manteve a tela de seleção e Sim, sair voltou sem entrar no app. Confirmado pelo testador em 05/10/2026. |

### Seção C — Credenciais inválidas e status da conta

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU002-UI-011 | Senha incorreta | E-mail do aluno ativo; senha errada | Mensagem genérica, sem dizer qual campo está errado | ⏳ PENDENTE | Não executado. |
| CT-HU002-UI-012 | E-mail não cadastrado | naoexiste@example.com; qualquer senha | A mesma mensagem genérica do CT-011 | ⏳ PENDENTE | Não executado. |
| CT-HU002-UI-013 | Conta pendente de aprovação | Credenciais do aluno pendente | Exibir que o cadastro está em análise e não abrir a área do aluno | ⏳ PENDENTE | Não executado. |
| CT-HU002-UI-014 | Conta inativada | Credenciais do aluno inativado | Bloquear o acesso e orientar contato com a coordenação | ⏳ PENDENTE | Não executado. |

### Seção D — Sessão

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU002-UI-015 | Sessão mantida ao reabrir o app | Aluno logado; fechar e reabrir o app | Voltar logado, direto na área do aluno | ⏳ PENDENTE | Não executado. |
| CT-HU002-UI-016 | Sair da conta | Aluno: Perfil → Sair; administrador: Mais → Sair | Encerrar a sessão e voltar ao login; reabrir o app não entra logado | ⏳ PENDENTE | Não executado. |

### Seção E — Conexão e navegação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU002-UI-017 | Falha de conexão ao entrar | Credenciais válidas; Wi-Fi e dados móveis desligados | Informar erro de conexão e permitir nova tentativa sem redigitar | ⏳ PENDENTE | Não executado. |
| CT-HU002-UI-018 | Links e saída da tela de login | Esqueci minha senha; Criar conta de aluno; seta de voltar | Abrir as telas corretas e confirmar a saída | ⏳ PENDENTE | Não executado. |

## Detalhamento dos casos

### Seção A — Tela de login e campos

#### CT-HU002-UI-001 — Elementos da tela de login

**Dados de entrada:** Nenhum; app sem sessão ativa.

**Passos**

1. Na tela de boas-vindas, tocar em **Entrar**.
2. Conferir os elementos exibidos.

**Resultado esperado**

- Exibir o título **Entrar**, os campos **E-mail \*** e **Senha \***, o link **Esqueci minha senha** e os botões **Entrar** e **Criar conta de aluno**.
- O campo de senha começa com os caracteres ocultos.

**Resultado obtido**

- Exibidos o título **Entrar**, os campos **E-mail \*** e **Senha \***, o link **Esqueci minha senha** e os botões **Entrar** e **Criar conta de aluno**.
- A senha começa com os caracteres ocultos.
- Execução confirmada pelo testador em 05/10/2026.
- Status: ✅ Aprovado.

---

#### CT-HU002-UI-002 — Campos obrigatórios vazios

**Dados de entrada:** Três tentativas: só a senha preenchida; só o e-mail preenchido; os dois vazios.

**Passos**

1. Preencher apenas o campo indicado na tentativa.
2. Tocar em **Entrar**.

**Resultado esperado**

- Permanecer na tela de login, sem abrir a seleção de perfil.
- Destacar o campo vazio com mensagem em português: “O e-mail é obrigatório” e/ou “A senha é obrigatória” (AC-02).

**Resultado obtido**

- Nas três tentativas (apenas senha preenchida, apenas e-mail preenchido e ambos vazios), o avanço foi bloqueado e cada campo vazio foi indicado com a mensagem de obrigatoriedade em português.
- Execução confirmada pelo testador em 05/10/2026.
- Status: ✅ Aprovado.

---

#### CT-HU002-UI-003 — E-mail em formato inválido

**Dados de entrada:** `maria`; `maria@`; `maria@example`. Senha preenchida.

**Passos**

1. Informar cada e-mail em uma tentativa.
2. Tocar em **Entrar**.

**Resultado esperado**

- Exibir “Informe um e-mail válido” e não avançar para a seleção de perfil.

**Resultado obtido**

- Os e-mails `maria`, `maria@` e `maria@example` foram recusados com a mensagem “Informe um e-mail válido”, sem avançar para a seleção de perfil.
- Porém um e-mail válido com espaço no início ou no fim (` aluno@gmail.com`, `aluno@gmail.com `) também foi recusado com “Informe um e-mail válido”. O teclado do iPhone costuma inserir um espaço depois de uma sugestão, e o usuário recebe o erro sem entender o motivo.
- Causa: o `loginSchema` (`frontend/src/schemas/loginSchema.ts`) valida o e-mail sem remover os espaços, ao contrário do `emailSchema` do cadastro (`frontend/src/schemas/alunoSchema.ts:49`), corrigido pela issue #51.
- Execução confirmada pelo testador em 05/10/2026.
- Status: ❌ Reprovado — [BUG-HU002-UI-003](issues/BUG-HU002-UI-003-email-com-espacos-recusado.md).

---

#### CT-HU002-UI-004 — E-mail com caixa mista e espaços

**Dados de entrada:** Duas tentativas com a senha correta do aluno ativo: e-mail com letras maiúsculas (ex.: `Aluno.Teste@Example.com`); depois o e-mail com espaço no início e no fim.

**Passos**

1. Informar o e-mail da tentativa e a senha correta.
2. Tocar em **Entrar** e em **Sou aluno**.

**Resultado esperado**

- Reconhecer o e-mail independentemente de maiúsculas e minúsculas e autenticar.
- Ignorar os espaços das pontas, comuns ao colar o e-mail, e autenticar. Se o app recusar o e-mail por causa dos espaços, registrar como falha de UX.

**Resultado obtido**

- O aluno ativo autenticou com o e-mail em letras maiúsculas; o backend converte o e-mail para minúsculas antes da busca.
- A recusa do e-mail com espaços nas pontas está registrada no CT-HU002-UI-003.
- Sugestão do testador: exibir o e-mail em minúsculas no próprio campo — [MELHORIA-HU002-UI-004](issues/MELHORIA-HU002-UI-004-email-em-minusculas.md).
- Execução confirmada pelo testador em 05/10/2026.
- Status: ✅ Aprovado.

---

#### CT-HU002-UI-005 — Ocultar e exibir senha

**Dados de entrada:** Senha válida.

**Passos**

1. Digitar a senha e conferir que aparece oculta.
2. Tocar no ícone de olho; tocar novamente.

**Resultado esperado**

- Alternar entre senha visível e oculta, sem alterar o valor digitado.

**Resultado obtido**

- O ícone de olho alternou a senha entre visível e oculta, sem alterar o valor digitado.
- Execução confirmada pelo testador em 05/10/2026.
- Status: ✅ Aprovado.

### Seção B — Seleção de perfil e redirecionamento

#### CT-HU002-UI-006 — Login válido de aluno

**Dados de entrada:** Credenciais do aluno ativo.

**Passos**

1. Informar e-mail e senha e tocar em **Entrar**.
2. Na tela **Como você quer entrar?**, tocar em **Sou aluno** e iniciar o cronômetro.
3. Parar o cronômetro quando a tela inicial do aluno aparecer.

**Resultado esperado**

- Abrir a área do aluno, com as abas **Início**, **Agenda**, **Avisos** e **Perfil** (AC-05).
- Tempo até a tela inicial de até 3 segundos em conexão normal (AC-07, RNF-001). Registrar o tempo medido.

**Resultado obtido**

- O aluno ativo entrou na área do aluno em menos de 3 segundos.
- Preparação: a conta foi aprovada pela API (`PATCH /usuarios/alunos/{id}/aprovar`, como administrador), porque o painel do administrador ainda não tem a tela de aprovação.
- Execução confirmada pelo testador em 05/10/2026.
- Status: ✅ Aprovado.

---

#### CT-HU002-UI-007 — Login válido de administrador

**Dados de entrada:** Credenciais do administrador ativo.

**Passos**

1. Informar e-mail e senha, tocar em **Entrar** e em **Sou administrador**.

**Resultado esperado**

- Abrir a área do administrador, com as abas **Painel**, **Cadastros**, **Logística** e **Mais**.

**Resultado obtido**

- O administrador padrão autenticou e entrou no **Painel**, com as abas **Painel**, **Cadastros**, **Logística** e **Mais**.
- O conteúdo do painel ainda é provisório: os números são fixos no código, “Fila de solicitações” não abre nada e as abas Cadastros e Logística estão desativadas. Isso não faz parte da HU-002 e não reprova o caso.
- Execução confirmada pelo testador em 05/10/2026.
- Status: ✅ Aprovado.

---

#### CT-HU002-UI-008 — Login válido de representante

**Preparação específica**

- Exige uma conta de representante. Sem ela, manter o caso pendente e registrar o motivo.

**Dados de entrada:** Credenciais do representante ativo.

**Passos**

1. Informar e-mail e senha, tocar em **Entrar** e em **Sou representante**.

**Resultado esperado**

- Abrir a área do representante, com as abas **Chamada**, **Minha Rota** e **Perfil**.

**Resultado obtido**

- Não foi possível executar: o perfil representante ainda não existe no backend. O login reconhece representante pela tabela `representante` (`usuario_repository.py`, `buscar_contexto_autenticacao_por_id`), mas nenhuma migration cria essa tabela, e não há rota para cadastrar representante. Nenhuma conta pode ter esse perfil, nem preparada pela API.
- Não é defeito da HU-002: a funcionalidade ainda não foi implementada. Reexecutar quando o cadastro de representante existir.
- Registrado em 05/10/2026.
- Status: 🚫 Bloqueado.

---

#### CT-HU002-UI-009 — Perfil escolhido diferente do perfil da conta

**Dados de entrada:** Duas tentativas: credenciais do aluno escolhendo **Sou administrador**; credenciais do administrador escolhendo **Sou aluno**.

**Passos**

1. Informar as credenciais e tocar em **Entrar**.
2. Escolher o perfil que **não** corresponde à conta.
3. Observar a tela que abre.

**Resultado esperado**

- O AC-08 exige escolher o perfil antes de entrar. Ao escolher um perfil que não é o da conta, o app deve informar a divergência e não entrar, ou pedir para escolher o perfil correto.
- Não deve entrar em silêncio na área de outro perfil, como se a escolha não existisse.
- Ordem do fluxo: o requisito (AC-08) e o BDD (`HU-002.feature`) preveem que o perfil seja escolhido **antes** de informar e-mail e senha; no app atual, a escolha vem **depois**. Registrar a ordem observada como divergência, mesmo que o restante do caso passe.

**Resultado obtido**

- Aluno ativo tocando em **Sou administrador** ou **Sou representante**: entrou na área do aluno, sem aviso.
- Administrador tocando em **Sou aluno** ou **Sou representante**: entrou no Painel do administrador, sem aviso.
- A escolha do perfil não tem efeito: `handleSelectProfile` em `selecao-perfil.tsx` recebe o perfil e não o usa, e o `signIn` (`AuthContext.tsx`) redireciona sempre para o perfil que vem da conta.
- Divergência de ordem: o app pede o perfil **depois** de e-mail e senha; o AC-08 e o BDD preveem **antes**.
- Execução confirmada pelo testador em 05/10/2026.
- Status: ❌ Reprovado — [BUG-HU002-UI-009](issues/BUG-HU002-UI-009-perfil-escolhido-ignorado.md).

---

#### CT-HU002-UI-010 — Voltar da seleção de perfil

**Dados de entrada:** E-mail e senha preenchidos, tela **Como você quer entrar?** aberta.

**Passos**

1. Tocar na seta de voltar e conferir a confirmação.
2. Escolher **Continuar aqui**.
3. Tocar novamente na seta e escolher **Sim, sair**.

**Resultado esperado**

- Exibir a confirmação “Sair desta tela?”, avisando que as credenciais serão perdidas.
- **Continuar aqui** mantém a tela de seleção; **Sim, sair** volta para a tela anterior sem entrar no app.

**Resultado obtido**

- A seta de voltar exibiu a confirmação “Sair desta tela?”; **Continuar aqui** manteve a tela de seleção e **Sim, sair** voltou para a tela anterior sem entrar no app.
- Execução confirmada pelo testador em 05/10/2026.
- Status: ✅ Aprovado.

### Seção C — Credenciais inválidas e status da conta

#### CT-HU002-UI-011 — Senha incorreta

**Dados de entrada:** E-mail do aluno ativo e senha errada (ex.: `SenhaErrada1`).

**Passos**

1. Informar as credenciais, tocar em **Entrar** e em **Sou aluno**.
2. Ler a mensagem exibida e anotar o texto exato.

**Resultado esperado**

- Não entrar no app.
- Exibir mensagem genérica, sem indicar se o erro está no e-mail ou na senha, conforme o AC-03: “E-mail ou senha incorretos. Tente novamente.”
- Mensagem em português e permitir nova tentativa.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU002-UI-012 — E-mail não cadastrado

**Dados de entrada:** `naoexiste@example.com` e qualquer senha.

**Passos**

1. Informar as credenciais, tocar em **Entrar** e em **Sou aluno**.
2. Comparar a mensagem com a do CT-HU002-UI-011.

**Resultado esperado**

- Não entrar no app e exibir **exatamente a mesma mensagem** do CT-011, para não revelar se a conta existe (AC-03).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU002-UI-013 — Conta pendente de aprovação

**Dados de entrada:** Credenciais do aluno pendente.

**Passos**

1. Informar as credenciais, tocar em **Entrar** e em **Sou aluno**.
2. Conferir a tela exibida e tentar acessar a área do aluno.

**Resultado esperado**

- Exibir a tela **Cadastro enviado para análise**, informando que a coordenação vai avaliar a solicitação.
- Não abrir a área do aluno nem permitir acessar suas funções.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU002-UI-014 — Conta inativada

**Dados de entrada:** Credenciais do aluno inativado (e, se disponível, de um administrador inativo).

**Passos**

1. Informar as credenciais, tocar em **Entrar** e escolher o perfil.
2. Ler a mensagem exibida.

**Resultado esperado**

- Não entrar no app, mesmo com a senha correta.
- Exibir mensagem específica orientando o contato com a coordenação (AC-04). Texto de referência do FA-003: “Usuário inativo. Entre em contato com a coordenação.”

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

### Seção D — Sessão

#### CT-HU002-UI-015 — Sessão mantida ao reabrir o app

**Dados de entrada:** Aluno logado na área do aluno.

**Passos**

1. Fechar o app completamente (remover da lista de apps abertos).
2. Abrir o app novamente.

**Resultado esperado**

- Abrir direto na área do aluno, sem pedir login de novo, enquanto a sessão for válida.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU002-UI-016 — Sair da conta

**Dados de entrada:** Duas tentativas: aluno logado; administrador logado.

**Passos**

1. Aluno: abrir **Perfil**, tocar em **Sair**, conferir a confirmação, escolher **Continuar** e depois **Sim, sair**.
2. Administrador: abrir **Mais** e tocar em **Sair**.
3. Em cada tentativa, fechar e reabrir o app.

**Resultado esperado**

- Aluno: exibir “Sair do aplicativo?”; **Continuar** mantém a sessão; **Sim, sair** volta para a tela de login.
- Administrador: voltar para a tela de login.
- Ao reabrir o app, não entrar logado: é preciso fazer login de novo.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

### Seção E — Conexão e navegação

#### CT-HU002-UI-017 — Falha de conexão ao entrar

**Dados de entrada:** Credenciais válidas do aluno.

**Passos**

1. Na tela de login, preencher e-mail e senha e tocar em **Entrar**.
2. Antes de escolher o perfil, desligar Wi-Fi e dados móveis.
3. Tocar em **Sou aluno** e ler a mensagem.
4. Religar a conexão e tentar de novo.

**Resultado esperado**

- Exibir mensagem clara de erro de conexão, sem travar o app (AC-06, FA-004).
- Permitir nova tentativa **sem redigitar** e-mail e senha.
- Com a conexão restabelecida, entrar normalmente.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU002-UI-018 — Links e saída da tela de login

**Dados de entrada:** Tela de login aberta.

**Passos**

1. Tocar em **Esqueci minha senha** e voltar.
2. Tocar em **Criar conta de aluno** e voltar.
3. Tocar na seta de voltar da tela de login; escolher **Continuar no app** e, em seguida, repetir e escolher **Sim, sair**.

**Resultado esperado**

- **Esqueci minha senha** abre a tela de recuperação; **Criar conta de aluno** abre o cadastro.
- A seta de voltar exibe “Sair do aplicativo?”; **Continuar no app** mantém a tela de login e **Sim, sair** volta para as boas-vindas.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Defeitos encontrados

| Caso | Defeito | Issue |
| ---- | ------- | ----- |
| CT-HU002-UI-003 | E-mail válido com espaço no início ou no fim é recusado como inválido no login (e no Esqueci minha senha). | [BUG-HU002-UI-003-email-com-espacos-recusado](issues/BUG-HU002-UI-003-email-com-espacos-recusado.md) |
| CT-HU002-UI-009 | O perfil escolhido na tela “Como você quer entrar?” é ignorado: o app entra sempre no perfil da conta, sem aviso. A seleção ocorre depois das credenciais, e não antes (AC-08). | [BUG-HU002-UI-009-perfil-escolhido-ignorado](issues/BUG-HU002-UI-009-perfil-escolhido-ignorado.md) |
| CT-HU002-UI-004 | Melhoria: o campo de e-mail mantém as letras maiúsculas digitadas. | [MELHORIA-HU002-UI-004-email-em-minusculas](issues/MELHORIA-HU002-UI-004-email-em-minusculas.md) |

## Observações gerais

- Referências: [HU-002, seção 7.2.2](../../../../../docs/requisitos.md), [tela de login](../../../../../frontend/src/app/%28autenticacao%29/login.tsx), [seleção de perfil](../../../../../frontend/src/app/%28autenticacao%29/selecao-perfil.tsx) e [contexto de autenticação](../../../../../frontend/src/contexts/AuthContext.tsx). A suíte de API correspondente está em [`../api/API-HU-002.md`](../api/API-HU-002.md).
- No código atual, a escolha do perfil não é enviada para a API: o app entra no perfil que vem da conta. Por isso o CT-009 é importante para verificar o AC-08.
- O e-mail e a senha são passados da tela de login para a de seleção de perfil como parâmetros de navegação. No iPhone isso não aparece, mas na versão web pode expor a senha na barra de endereço. Fica registrado para uma eventual suíte web.
- “Lembrar de mim” (`lembrar_me`) existe na API, mas não aparece na tela; não há caso para ele nesta suíte.
- Recuperação de senha é coberta pela HU-004; aqui só se verifica que o link abre a tela correta (CT-018).
- Cenários BDD de referência: [`bdd/features/epico-01/HU-002.feature`](../../../../../bdd/features/epico-01/HU-002.feature). As mensagens esperadas dos CT-011, CT-012 e CT-014 seguem os textos do BDD. Os cenários de token de sessão e de HTTPS (RNF-003) são marcados no BDD como `@teste_api` e ficam fora desta suíte de UI.
- Registrar o texto exato de cada mensagem exibida. Ocultar senhas e dados pessoais nas evidências.
