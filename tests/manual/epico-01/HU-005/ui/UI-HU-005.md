# Testes manuais de UI — HU-005 — Edição de Perfil do Aluno

## Identificação da suíte

| Campo           | Valor                                                                                   |
| --------------- | --------------------------------------------------------------------------------------- |
| Módulo          | Autenticação e Gestão de Conta                                                          |
| Funcionalidade  | HU-005 — Edição de Perfil do Aluno                                                      |
| Camada          | UI                                                                                      |
| Tipo de teste   | Funcional manual — suíte essencial                                                      |
| Tela            | Meu Perfil, Editar Perfil e Alterar e-mail                                              |
| Ambiente        | Desenvolvimento — app mobile no iPhone (Expo Go)                                        |
| Total de casos  | 7 |
| Última execução | 06/10/2026                                                                              |
| Testador        | Cauan Ricardo                                                                           |

## Resultado geral

| Situação        | Total | ✅ Passaram | ❌ Falharam | ⏳ Pendentes |
| --------------- | ----: | ----------: | ----------: | -----------: |
| ⏳ Em execução | 7 | 4 | 1 | 2 |

## Pré-condições

| ID    | Descrição |
| ----- | --------- |
| PC-01 | Aplicativo aberto no iPhone pelo **Expo Go**, com a API disponível e conexão ativa (exceto no CT-007). |
| PC-02 | Dois alunos **ativos**: **aluno A** (o testado, logado no app) e **aluno B** (dono de um e-mail já em uso). Anotar e-mail, senha, telefone e bairro do aluno A. |
| PC-03 | Caminho: área do aluno → aba **Perfil** (**Meu Perfil**) → **Editar perfil** ou **Alterar endereço de e-mail**. |
| PC-04 | Usar dados fictícios. O CT-005 troca o e-mail do aluno A; usar o novo e-mail nos casos seguintes. |

## Resumo da execução

Executar na ordem abaixo. São **7 casos essenciais**, em duas seções. Os IDs completos usam o prefixo `CT-HU005-UI-`, numerados de 001 a 007.

### Seção A — Visualização e edição de telefone e bairro

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU005-UI-001 | Visualizar o próprio perfil | Aluno A logado; aba Perfil | Exibir os dados cadastrais atuais do aluno A | ✅ APROVADO | Meu Perfil exibiu foto, nome completo, status Aprovado, e-mail, telefone, instituição, curso, período de ingresso e turno do aluno A, sem valores de exemplo, e as ações Editar perfil, Alterar endereço de e-mail, Ver carteirinha digital e Renovar vínculo. Observação: telefone sem máscara (ex.: `31997814542`), ver [MELHORIA-HU005-UI-002](issues/MELHORIA-HU005-UI-002-mascara-telefone-no-perfil.md). Confirmado pelo testador em 06/10/2026. |
| CT-HU005-UI-002 | Editar telefone e bairro | (85) 98888-1111; outro bairro | Mensagem de sucesso e dados atualizados no perfil | ✅ APROVADO | Exibiu “Perfil atualizado — Suas informações de perfil foram atualizadas com sucesso!” e voltou a Meu Perfil com o telefone novo; telefone `85988881111` e bairro Serra confirmados no banco pela API. Observação: campo Telefone sem máscara ([MELHORIA-HU005-UI-002](issues/MELHORIA-HU005-UI-002-mascara-telefone-no-perfil.md)). Confirmado pelo testador em 06/10/2026. |
| CT-HU005-UI-003 | Telefone inválido | 8599; 85abc123456; vazio | Bloquear e alertar no campo Telefone | ❌ REPROVADO | `8599` e vazio foram bloqueados com “O telefone deve ter pelo menos 10 dígitos com DDD”; o teclado não aceita letras. Porém, com mais de 20 dígitos o app enviou à API e exibiu o erro em inglês “String should have at most 20 characters”: a tela não limita nem valida o formato como o cadastro. Ver [BUG-HU005-UI-003](issues/BUG-HU005-UI-003-validacao-telefone-fraca-no-perfil.md). Executado pelo testador em 06/10/2026. |
| CT-HU005-UI-004 | Campos acadêmicos somente leitura | Meu Perfil e Editar Perfil | Instituição, curso, período e turno não editáveis | ✅ APROVADO | Em Meu Perfil os dados acadêmicos aparecem só para leitura, sem ícone de edição; em Editar perfil só Telefone e Bairro são editáveis. O e-mail é alterado em tela própria (CT-005). Confirmado pelo testador em 06/10/2026. |

### Seção B — Alteração de e-mail e conexão

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU005-UI-005 | Alterar e-mail com senha correta | qa.hu005.novo@example.com; senha atual | Sucesso; login só com o novo e-mail | ✅ APROVADO | Exibiu “E-mail alterado — Endereço de e-mail alterado com sucesso. Utilize o novo e-mail no próximo login.” (pop-up do app); o perfil mostrou o novo e-mail; o login com o e-mail antigo falhou e com o novo entrou. A primeira tentativa falhou com “E-mail não autorizado” porque o token da sessão tinha vencido (15 min) — ver [BUG-HU005-UI-005](issues/BUG-HU005-UI-005-sessao-expira-em-15-minutos-sem-renovacao.md). Confirmado pelo testador em 06/10/2026. |
| CT-HU005-UI-006 | Alteração de e-mail rejeitada | Sem senha; senha errada; e-mail do aluno B; maria.souzaufc.br | Bloquear com a mensagem de cada situação; e-mail inalterado | ⏳ PENDENTE | Não executado. |
| CT-HU005-UI-007 | Falha de conexão ao salvar | Telefone alterado; Wi-Fi e dados móveis desligados | Mensagem de conexão e dados mantidos na tela | ⏳ PENDENTE | Não executado. |

## Detalhamento dos casos

### Seção A — Visualização e edição de telefone e bairro

#### CT-HU005-UI-001 — Visualizar o próprio perfil

**Dados de entrada:** Aluno A logado.

**Passos**

1. Abrir a aba **Perfil**.
2. Comparar os dados exibidos com os anotados na PC-02.

**Resultado esperado**

- Exibir **Meu Perfil** com nome, status, e-mail, telefone, instituição/campus, curso, período de ingresso e turno **do aluno A** (AC-01).
- Nenhum valor de exemplo (ex.: “João Neves”, “joao@email.com”) no lugar dos dados reais.
- Exibir as ações **Editar perfil** e **Alterar endereço de e-mail**.

**Resultado obtido**

- **Meu Perfil** exibiu foto de perfil, nome completo, status **Aprovado** e as informações gerais do aluno A: e-mail, telefone, instituição, curso, período de ingresso e turno. Nenhum valor de exemplo no lugar dos dados reais.
- Ações da conta: **Editar perfil**, **Alterar endereço de e-mail**, **Ver carteirinha digital** e **Renovar vínculo**.
- Observação de UX: o telefone aparece sem máscara (ex.: `31997814542`), enquanto o cadastro formata como `(31) 99781-4542`.
- Observação: o bairro não aparece em **Meu Perfil** (não faz parte do AC-01); será conferido na tela **Editar perfil** (CT-HU005-UI-002).
- Execução confirmada pelo testador em 06/10/2026.
- Status: ✅ Aprovado.

---

#### CT-HU005-UI-002 — Editar telefone e bairro

**Dados de entrada:** Telefone `(85) 98888-1111`; bairro diferente do atual na lista **Bairro / Localidade**.

**Passos**

1. Em **Meu Perfil**, tocar em **Editar perfil** e conferir que os campos vêm preenchidos com os dados atuais.
2. Alterar o telefone e o bairro.
3. Tocar em **Salvar alterações** e confirmar o aviso.
4. Conferir **Meu Perfil**; fechar e reabrir o app e conferir de novo.

**Resultado esperado**

- Exibir “Perfil atualizado com sucesso” e voltar para **Meu Perfil** (AC-02, AC-08).
- Telefone e bairro novos aparecem no perfil e continuam após reabrir o app.

**Resultado obtido**

- **Editar perfil** abriu com os campos preenchidos com os dados atuais.
- Telefone alterado para `(85) 98888-1111` e bairro para **Serra**.
- Ao tocar em **Salvar alterações**: “Perfil atualizado — Suas informações de perfil foram atualizadas com sucesso!”, e o app voltou a **Meu Perfil** com o telefone novo.
- Persistência confirmada pela API (`GET /usuarios/me`): `telefone: 85988881111` e `bairro_id: Serra`.
- Observação de UX: o campo **Telefone** de **Editar perfil** não tem máscara, assim como a exibição em **Meu Perfil**; no cadastro (HU-001) o telefone é formatado ao sair do campo. Registrado como melhoria: [MELHORIA-HU005-UI-002](issues/MELHORIA-HU005-UI-002-mascara-telefone-no-perfil.md).
- Execução confirmada pelo testador em 06/10/2026.
- Status: ✅ Aprovado.

---

#### CT-HU005-UI-003 — Telefone inválido

**Dados de entrada:** Três tentativas em **Editar perfil**: `8599` (incompleto); `85abc123456` (com letras); campo vazio.

**Passos**

1. Informar o valor da tentativa no campo **Telefone (WhatsApp)**.
2. Tocar em **Salvar alterações**.
3. Ao final, voltar a **Meu Perfil** sem salvar e conferir o telefone.

**Resultado esperado**

- As três bloqueadas, com alerta em português no campo **Telefone (WhatsApp)** (AC-05, FA-001).
- O teclado ou o campo não deve aceitar letras; se aceitar, o salvamento ainda deve ser bloqueado.
- O telefone salvo continua o do CT-002.

**Resultado obtido**

- `8599`: bloqueado com “O telefone deve ter pelo menos 10 dígitos com DDD”. ✅
- `85abc123456`: não foi possível digitar letras; o teclado do campo é numérico. ✅
- Campo vazio: bloqueado com a mesma mensagem do `8599` (não há mensagem específica de campo obrigatório). ✅
- **Teste adicional do testador**, mais de 20 dígitos: o app não bloqueou, enviou à API e exibiu o erro do backend em inglês, “String should have at most 20 characters”. ❌
- Causa aparente: **Editar perfil** usa `perfilSchema` (`frontend/src/schemas/perfilSchema.ts`), que só exige mínimo de 10 caracteres. O cadastro usa `telefoneSchema` (`alunoSchema.ts:78`), que exige DDD válido + 9 dígitos começando com 9. O backend limita o campo a 20 caracteres e responde 422 com a mensagem padrão em inglês.
- Ao final, o telefone salvo continuou `85988881111` (conferido pela API).
- Sugestão do testador: usar no perfil a mesma máscara e as mesmas mensagens do cadastro ([MELHORIA-HU005-UI-002](issues/MELHORIA-HU005-UI-002-mascara-telefone-no-perfil.md)).
- Execução confirmada pelo testador em 06/10/2026.
- Status: ❌ Reprovado — [BUG-HU005-UI-003](issues/BUG-HU005-UI-003-validacao-telefone-fraca-no-perfil.md).

---

#### CT-HU005-UI-004 — Campos acadêmicos somente leitura

**Dados de entrada:** Nenhum.

**Passos**

1. Em **Meu Perfil**, tocar nos valores de instituição, curso, período de ingresso e turno.
2. Abrir **Editar perfil** e conferir quais campos aparecem.

**Resultado esperado**

- Instituição, curso, período de ingresso e turno são apenas exibidos, sem permitir edição (AC-06, FA-002).
- **Editar perfil** oferece somente telefone e bairro; e-mail só pela opção **Alterar endereço de e-mail**, com senha.

**Resultado obtido**

- **Meu Perfil**: instituição, curso, período de ingresso e turno aparecem só para leitura; tocar neles não faz nada e não há ícone de edição.
- **Editar perfil**: só **Telefone (WhatsApp)** e **Bairro / Localidade** são editáveis. Os dados acadêmicos não aparecem para edição.
- O e-mail não é editado nessa tela: tem fluxo próprio, **Alterar endereço de e-mail**, com confirmação de senha (CT-HU005-UI-005).
- Observações do testador nesta tela, registradas no [BUG-HU005-UI-004](issues/BUG-HU005-UI-004-editar-perfil-mantem-valores-nao-salvos.md):
  - a seta de voltar de **Editar perfil** sai sem pedir confirmação e leva à aba **Início**, e não a **Meu Perfil**;
  - depois da falha do CT-003 (mais de 20 dígitos), ao voltar e abrir **Editar perfil** de novo, o campo Telefone ainda mostra o número inválido não salvo, embora o banco tenha o telefone correto.
- Execução confirmada pelo testador em 06/10/2026.
- Status: ✅ Aprovado.

### Seção B — Alteração de e-mail e conexão

#### CT-HU005-UI-005 — Alterar e-mail com senha correta

**Dados de entrada:** Novo e-mail `qa.hu005.novo@example.com`; senha atual do aluno A.

**Passos**

1. Em **Meu Perfil**, tocar em **Alterar endereço de e-mail**.
2. Preencher **E-mail atual**, **Novo E-mail** e **Senha atual**.
3. Salvar e confirmar o aviso.
4. Conferir **Meu Perfil**; sair da conta e tentar login com o e-mail antigo e depois com o novo.

**Resultado esperado**

- Mensagem de sucesso e novo e-mail exibido no perfil (AC-03, AC-04).
- Login com o e-mail antigo rejeitado; login com o novo entra na área do aluno.

**Resultado obtido**

- **1ª tentativa** (sessão aberta havia mais de 15 minutos): “Falha ao alterar — E-mail não autorizado”. O backend respondeu `401` porque o token de acesso tinha vencido; com um login novo, a mesma troca é aceita pela API. O app não renova o token. Registrado no [BUG-HU005-UI-005](issues/BUG-HU005-UI-005-sessao-expira-em-15-minutos-sem-renovacao.md).
- **2ª tentativa** (logo após sair e entrar de novo): pop-up do app “E-mail alterado — Endereço de e-mail alterado com sucesso. Utilize o novo e-mail no próximo login.” ✅
- **Meu Perfil** passou a exibir `qa.hu005.novo@example.com`. ✅
- Login com o e-mail antigo (`cauanrricardo@gmail.com`): recusado. ✅ Login com o novo: entrou na área do aluno. ✅ (Também conferido pela API.)
- Execução confirmada pelo testador em 06/10/2026.
- Status: ✅ Aprovado.

---

#### CT-HU005-UI-006 — Alteração de e-mail rejeitada

**Dados de entrada:** Quatro tentativas em **Alterar e-mail**: novo e-mail válido sem senha; novo e-mail válido com senha errada; e-mail do aluno B com a senha correta; `maria.souzaufc.br` com a senha correta.

**Passos**

1. Preencher os campos conforme a tentativa e salvar.
2. Anotar a mensagem exibida.
3. Ao final, conferir em **Meu Perfil** que o e-mail não mudou.

**Resultado esperado**

- Sem senha: bloquear e pedir a senha atual (AC-04).
- Senha errada: bloquear e informar que a senha está incorreta.
- E-mail do aluno B: “Este e-mail já está em uso no sistema.” (AC-03).
- `maria.souzaufc.br`: alerta de e-mail inválido no campo **Novo E-mail** (AC-05).
- E-mail do aluno A inalterado nas quatro tentativas; nenhuma mensagem técnica ou em inglês.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU005-UI-007 — Falha de conexão ao salvar

**Dados de entrada:** Telefone `(85) 97777-2222`; Wi-Fi e dados móveis desligados.

**Passos**

1. Abrir **Editar perfil** com conexão e alterar o telefone.
2. Desligar Wi-Fi e dados móveis.
3. Tocar em **Salvar alterações** e fechar o aviso.
4. Religar a conexão e tocar em **Salvar alterações** de novo.

**Resultado esperado**

- Exibir “Não foi possível salvar as alterações. Verifique sua conexão e tente novamente.” (AC-07, FA-003).
- O app não trava e o telefone digitado continua no campo.
- Com a conexão de volta, salvar sem redigitar.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-HU005-UI-003 | Telefone com mais de 20 dígitos chega à API e o erro aparece em inglês; Editar perfil não valida o formato como o cadastro. | [BUG-HU005-UI-003-validacao-telefone-fraca-no-perfil](issues/BUG-HU005-UI-003-validacao-telefone-fraca-no-perfil.md) |
| CT-HU005-UI-005 | A sessão vence em 15 minutos e o app não renova o token: ações passam a falhar com “não autorizado”. | [BUG-HU005-UI-005-sessao-expira-em-15-minutos-sem-renovacao](issues/BUG-HU005-UI-005-sessao-expira-em-15-minutos-sem-renovacao.md) |
| CT-HU005-UI-004 | Editar perfil mantém valores não salvos ao reabrir; a seta volta para Início sem confirmação. | [BUG-HU005-UI-004-editar-perfil-mantem-valores-nao-salvos](issues/BUG-HU005-UI-004-editar-perfil-mantem-valores-nao-salvos.md) |
| CT-HU005-UI-001, CT-HU005-UI-002 | Melhoria: telefone sem máscara em Meu Perfil e em Editar perfil, diferente do cadastro. | [MELHORIA-HU005-UI-002-mascara-telefone-no-perfil](issues/MELHORIA-HU005-UI-002-mascara-telefone-no-perfil.md) |

## Observações gerais

- Referências: [HU-005, seção 7.2.5](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-01/HU-005.feature) e [suíte de API](../api/API-HU-005.md).
- Divergência de requisito: o AC-02 e o AC-04 permitem editar o e-mail mediante senha, mas o FA-002 cita o e-mail como não editável. O app implementa a troca com senha (CT-005); levar a dúvida ao líder antes de classificar como defeito.
- Fora desta rodada: HTTPS (RNF-003) e LGPD (RNF-010), validados na API ou no backend. Aprovar estes 7 casos não significa cobertura total da HU.
- Restaurar e-mail, telefone e bairro originais do aluno A ao final, para não afetar outras suítes.
- Ocultar senhas e dados pessoais nas evidências.
