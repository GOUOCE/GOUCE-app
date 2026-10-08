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
| Última execução | Não realizada                                                                           |
| Testador        | Cauan Ricardo                                                                           |

## Resultado geral

| Situação        | Total | ✅ Passaram | ❌ Falharam | ⏳ Pendentes |
| --------------- | ----: | ----------: | ----------: | -----------: |
| ⏳ Não executada | 10 | 0 | 0 | 10 |

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
| CT-HU006-UI-001 | Acessar a gestão de administradores | Painel → Gestão de administradores | Listagem com busca, filtro de inativos e botão Novo | ⏳ PENDENTE | Não executado. |
| CT-HU006-UI-002 | Cadastrar novo administrador | Nome e e-mail novos | Confirmação, sucesso e B na listagem; e-mail com senha | ⏳ PENDENTE | Não executado. |
| CT-HU006-UI-003 | Cadastro rejeitado | E-mail de aluno; nome `Ab`; e-mail `carlos@`; campos vazios | Mensagem do AC-03 no duplicado; alerta no campo nos demais | ⏳ PENDENTE | Não executado. |
| CT-HU006-UI-004 | Editar administrador | Nome novo; e-mail em uso | Sucesso e listagem atualizada; duplicado bloqueado | ⏳ PENDENTE | Não executado. |

### Seção B — Inativação e controle de acesso

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU006-UI-005 | Inativar outro administrador | Administrador B | Confirmação, sucesso, B entre os inativos; B não entra | ⏳ PENDENTE | Não executado. |
| CT-HU006-UI-006 | Auto-inativação bloqueada | Administrador A | Alerta “Não é possível inativar a conta atualmente em uso.” | ⏳ PENDENTE | Não executado. |
| CT-HU006-UI-007 | Aluno tenta abrir a gestão por link | Aluno logado; link `administradores` | Acesso Negado, sem dados de administradores | ⏳ PENDENTE | Não executado. |

### Seção C — Regressões e robustez

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU006-UI-008 | E-mail com espaços e maiúsculas | `" Carla.Mendes@Example.com "` | Aceito e salvo como `carla.mendes@example.com` | ⏳ PENDENTE | Não executado. |
| CT-HU006-UI-009 | Sair sem salvar | Alterar nome em Editar e tocar na seta | Pedir confirmação; nada salvo; ao reabrir, dados do banco | ⏳ PENDENTE | Não executado. |
| CT-HU006-UI-010 | Falha de conexão ao salvar | Wi-Fi e dados desligados ao cadastrar e ao inativar | Mensagem de conexão, sem travar; dados mantidos para nova tentativa | ⏳ PENDENTE | Não executado.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Referências: [HU-006, seção 7.2.6](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-01/HU-006.feature), [telas de gestão](../../../../../frontend/src/app/%28administrador%29/administradores/) e [suíte de API](../api/API-HU-006.md).
- A tela **Cadastrar Administrador** também permite buscar um aluno aprovado e torná-lo administrador (“Tornar administrador?”), e a listagem permite **reativar** um inativo. Essas ações não estão no requisito da HU-006 e ficam fora desta rodada; levar ao líder se devem ganhar casos.
- O log de auditoria da inativação (AC-05) não aparece na tela; é conferido na suíte de API (CT-HU006-API-005).
- Para trocar de conta: o administrador ainda não tem botão de sair acessível (#101); fechar o app para trocar de usuário.
- Ao final, manter B inativo para não interferir em outras suítes. Ocultar senhas e dados pessoais nas evidências.
