# Testes manuais de UI — HU-004 — Recuperação de Senha

## Identificação da suíte

| Campo           | Valor                                                                                   |
| --------------- | --------------------------------------------------------------------------------------- |
| Módulo          | Autenticação e Gestão de Conta                                                          |
| Funcionalidade  | HU-004 — Recuperação de Senha                                                           |
| Camada          | UI                                                                                      |
| Tipo de teste   | Funcional manual — suíte essencial                                                      |
| Tela            | Entrar, Esqueci minha senha, e-mail de recuperação e Redefinir Senha                    |
| Ambiente        | Desenvolvimento — app mobile no iPhone (Expo Go)                                        |
| Total de casos  | 7 |
| Última execução | 06/10/2026                                                                              |
| Testador        | Cauan Ricardo                                                                           |

## Resultado geral

| Situação        | Total | ✅ Passaram | ❌ Falharam | ⏳ Pendentes |
| --------------- | ----: | ----------: | ----------: | -----------: |
| ⏳ Em execução | 7 | 4 | 2 | 1 |

## Pré-condições

| ID    | Descrição |
| ----- | --------- |
| PC-01 | Aplicativo aberto no iPhone pelo **Expo Go**, sem sessão ativa, com a API e o serviço de e-mail (SMTP) disponíveis. |
| PC-02 | Conta de **aluno ativo** cujo e-mail seja uma caixa de teste acessível no iPhone. Anotar a senha atual (`Senha@123`, ou a real da conta). |
| PC-03 | **Abrir o link de recuperação:** tocar no link do e-mail no iPhone; ele deve abrir o app na tela **Redefinir Senha**. Se não abrir (o redirecionamento usa um IP fixo), copiar o `token` do link e abrir no Safari `exp://<IP do computador>:8081/--/redefinir-senha?token=<token>`. Registrar nas observações qual forma foi usada. |
| PC-04 | O link vale 15 minutos e cada nova solicitação invalida as anteriores. Solicitar um link novo para cada caso que precisar de link válido. |

## Resumo da execução

Executar na ordem abaixo. São **7 casos essenciais**, em duas seções. Os IDs completos usam o prefixo `CT-HU004-UI-`, numerados de 001 a 007.

### Seção A — Solicitação de recuperação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU004-UI-001 | Acesso à tela Esqueci minha senha | Entrar → Esqueci minha senha | Abrir a tela com campo E-mail e botão de envio | ✅ APROVADO | A tela abriu com a orientação “Informe o e-mail cadastrado para receber o link de redefinição”, o campo E-mail e o botão de envio; a seta de voltar pediu confirmação e respeitou a escolha. Confirmado pelo testador em 06/10/2026. |
| CT-HU004-UI-002 | Solicitação com e-mail cadastrado | E-mail da conta de teste | Mensagem genérica e e-mail com link recebido | ❌ REPROVADO | O e-mail chegou com o botão Redefinir minha senha (válido por 15 minutos). Porém a confirmação é só um aviso discreto no rodapé, escondido pelo teclado, que continua aberto: é preciso fechar o teclado para ler “E-mail enviado. Verifique sua caixa de entrada para continuar.” O texto também não é genérico. Ver [BUG-HU004-UI-002](issues/BUG-HU004-UI-002-confirmacao-escondida-pelo-teclado.md). Executado pelo testador em 06/10/2026. |
| CT-HU004-UI-003 | E-mail não cadastrado ou inválido | naoexiste@example.com; maria@; vazio | Mesma mensagem do CT-002 para o inexistente; alerta no campo nos demais | ✅ APROVADO | `naoexiste@example.com` exibiu exatamente a mesma mensagem do CT-002, sem revelar se a conta existe, e nenhum e-mail foi enviado. `maria@` e campo vazio exibiram alerta em português no campo, sem enviar solicitação. Confirmado pelo testador em 06/10/2026. |

### Seção B — Redefinição pelo link

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU004-UI-004 | Nova senha fora das regras | Abc123; abcdefgh1; ABCDEFGH1; Abcdefgh | Bloquear e indicar o critério não atendido | ✅ APROVADO | As quatro senhas foram bloqueadas, cada uma com a regra não atendida: mínimo de 8 caracteres, letra maiúscula, letra minúscula e número. Link aberto por `exp://<IP>:8081/--/redefinir-senha?token=...` (plano B do PC-03). Confirmado pelo testador em 06/10/2026. |
| CT-HU004-UI-005 | Senha e confirmação divergentes | NovaSenha@1 / NovaSenha@2 | Botão desabilitado e aviso de senhas diferentes | ❌ REPROVADO | O botão Salvar nova senha ficou sempre habilitado; o aviso “As senhas não coincidem” só apareceu depois de tocar nele. Nada foi enviado, e ao corrigir a confirmação o aviso sumiu. Ver [BUG-HU004-UI-005](issues/BUG-HU004-UI-005-botao-salvar-nao-desabilita.md). Executado pelo testador em 06/10/2026. |
| CT-HU004-UI-006 | Redefinição válida e login | NovaSenha@1 nos dois campos | Confirmação, volta ao login; entra só com a nova senha | ✅ APROVADO | Exibiu “Senha redefinida com sucesso” e levou à tela Entrar; a senha antiga foi recusada e a nova entrou na área do aluno. Observação de UX: a confirmação é o alerta nativo do iOS, sem o estilo dos pop-ups do app ([MELHORIA-HU004-UI-006](issues/MELHORIA-HU004-UI-006-padronizar-alertas-recuperacao.md)). Confirmado pelo testador em 06/10/2026. |
| CT-HU004-UI-007 | Link já utilizado ou expirado | Link do CT-006; link com mais de 15 min | Bloquear a tela de nova senha e orientar a solicitar novamente | ⏳ PENDENTE | Não executado. |

## Detalhamento dos casos

### Seção A — Solicitação de recuperação

#### CT-HU004-UI-001 — Acesso à tela Esqueci minha senha

**Dados de entrada:** Nenhum; app sem sessão ativa.

**Passos**

1. Na tela de boas-vindas, tocar em **Entrar**.
2. Tocar em **Esqueci minha senha**.
3. Conferir os elementos exibidos.

**Resultado esperado**

- Abrir a tela **Esqueci minha senha** com o campo **E-mail \*** e o botão **Enviar instruções** (AC-01).
- A seta de voltar pede confirmação antes de sair da tela.

**Resultado obtido**

- A tela **Esqueci minha senha** abriu com a orientação para informar o e-mail cadastrado e receber o link de redefinição, o campo **E-mail \*** e o botão **Enviar instruções**.
- A seta de voltar pediu confirmação; continuar manteve a tela e sair voltou para **Entrar**.
- Execução confirmada pelo testador em 06/10/2026.
- Status: ✅ Aprovado.

---

#### CT-HU004-UI-002 — Solicitação com e-mail cadastrado

**Dados de entrada:** E-mail da conta de teste (PC-02).

**Passos**

1. Na tela **Esqueci minha senha**, informar o e-mail.
2. Tocar em **Enviar instruções** e anotar a mensagem exibida.
3. Abrir a caixa de e-mail no iPhone e localizar a mensagem de recuperação.

**Resultado esperado**

- Exibir a mensagem genérica “Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação” (AC-02, AC-03).
- O e-mail chega com um link de recuperação.
- O app não trava e o botão não permite envios repetidos enquanto carrega.

**Resultado obtido**

- Funcional: o e-mail de recuperação chegou (caixa de teste Mailpit) com “Olá, <nome>”, o aviso da solicitação, o botão **Redefinir minha senha** e a validade de 15 minutos. ✅
- UX: depois de tocar em **Enviar instruções**, o teclado continua aberto e a confirmação aparece só como um aviso discreto (Snackbar) no rodapé, escondido pelo teclado. É preciso fechar o teclado para ler “E-mail enviado. Verifique sua caixa de entrada para continuar.” As outras telas usam pop-up para esse tipo de retorno. ❌
- O texto afirma que o e-mail foi enviado, em vez da mensagem genérica do AC-03 (“Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação”). Como a API responde sucesso para qualquer e-mail, o mesmo texto aparece para e-mails não cadastrados (verificar no CT-HU004-UI-003).
- Ao tocar em **Redefinir minha senha**, abriu a página intermediária do backend, que pediu para abrir o aplicativo. A página tenta abrir `exp://192.168.0.3:8081`, IP fixo no código; o fluxo do link segue no CT-HU004-UI-006.
- Execução confirmada pelo testador em 06/10/2026.
- Status: ❌ Reprovado — [BUG-HU004-UI-002](issues/BUG-HU004-UI-002-confirmacao-escondida-pelo-teclado.md).

---

#### CT-HU004-UI-003 — E-mail não cadastrado ou inválido

**Dados de entrada:** Três tentativas: `naoexiste@example.com`; `maria@`; campo vazio.

**Passos**

1. Informar cada valor em uma tentativa.
2. Tocar em **Enviar instruções**.
3. Comparar a mensagem da primeira tentativa com a do CT-002.

**Resultado esperado**

- `naoexiste@example.com`: **exatamente a mesma mensagem** do CT-002, sem revelar se a conta existe (AC-03, FA-001).
- `maria@` e vazio: alerta em português no campo **E-mail** e nenhuma solicitação enviada.

**Resultado obtido**

- `naoexiste@example.com`: exibiu exatamente a mesma mensagem do CT-HU004-UI-002, sem revelar se a conta existe. Nenhum e-mail foi enviado (conferido na caixa de teste).
- `maria@`: alerta de e-mail inválido em português no campo, sem enviar solicitação.
- Campo vazio: alerta de campo obrigatório, sem enviar solicitação.
- Observação: a mensagem igual atende ao AC-03, mas o texto “E-mail enviado” é enganoso para quem não tem conta; registrado no [BUG-HU004-UI-002](issues/BUG-HU004-UI-002-confirmacao-escondida-pelo-teclado.md).
- Execução confirmada pelo testador em 06/10/2026.
- Status: ✅ Aprovado.

### Seção B — Redefinição pelo link

#### CT-HU004-UI-004 — Nova senha fora das regras

**Dados de entrada:** Link válido (solicitar um novo). Uma tentativa por senha, repetida nos dois campos: `Abc123` (curta); `abcdefgh1` (sem maiúscula); `ABCDEFGH1` (sem minúscula); `Abcdefgh` (sem número).

**Passos**

1. Abrir o link de recuperação (PC-03).
2. Preencher **Nova senha** e **Confirmar nova senha** com a senha da tentativa.
3. Tocar em **Salvar nova senha**.

**Resultado esperado**

- As quatro bloqueadas, com mensagem indicando que a senha não atende aos critérios (mínimo 8 caracteres, maiúscula, minúscula e número) (AC-05).
- A senha da conta não é alterada.
- Se alguma senha for aceita, registrar como falha e solicitar novo link para os próximos casos, pois o link foi consumido.

**Resultado obtido**

- Link aberto pelo plano B do PC-03 (`exp://<IP>:8081/--/redefinir-senha?token=...` no Safari), porque o botão do e-mail aponta para um IP fixo no código.
- `Abc123`: bloqueada — “A senha deve ter pelo menos 8 caracteres”.
- `abcdefgh1`: bloqueada — deve conter uma letra maiúscula.
- `ABCDEFGH1`: bloqueada — deve conter uma letra minúscula.
- `Abcdefgh`: bloqueada — deve conter um número.
- A senha da conta não foi alterada.
- Execução confirmada pelo testador em 06/10/2026.
- Status: ✅ Aprovado.

---

#### CT-HU004-UI-005 — Senha e confirmação divergentes

**Dados de entrada:** Link válido; **Nova senha** `NovaSenha@1`; **Confirmar nova senha** `NovaSenha@2`.

**Passos**

1. Abrir o link de recuperação.
2. Preencher os dois campos com valores diferentes.
3. Observar o botão **Salvar nova senha** antes de tocar nele; depois tocar.

**Resultado esperado**

- O botão fica desabilitado e o app sinaliza que as senhas não coincidem (AC-06, FA-003).
- Nada é enviado; ao corrigir a confirmação, o botão é liberado.

**Resultado obtido**

- Com `NovaSenha@1` / `NovaSenha@2`, o botão **Salvar nova senha** continuou habilitado (azul) o tempo todo; não há aviso antes de tocar nele. ❌
- Ao tocar, apareceu “As senhas não coincidem” e nada foi enviado (a senha não mudou e o link continuou válido). ✅
- Ao corrigir a confirmação para `NovaSenha@1`, o aviso sumiu.
- Causa aparente: o formulário (`frontend/src/app/(autenticacao)/redefinir-senha.tsx`) valida só no envio (`useForm` sem `mode`) e o botão só fica desabilitado durante o carregamento (`disabled={isLoading}`).
- Execução confirmada pelo testador em 06/10/2026.
- Status: ❌ Reprovado — [BUG-HU004-UI-005](issues/BUG-HU004-UI-005-botao-salvar-nao-desabilita.md).

---

#### CT-HU004-UI-006 — Redefinição válida e login

**Dados de entrada:** Link válido; `NovaSenha@1` nos dois campos. Guardar o link para o CT-007.

**Passos**

1. Abrir o link e preencher os dois campos.
2. Tocar em **Salvar nova senha** e confirmar o aviso.
3. Na tela **Entrar**, tentar login com a senha antiga.
4. Fazer login com `NovaSenha@1`.

**Resultado esperado**

- Exibir “Senha redefinida com sucesso” e levar à tela **Entrar** (AC-08).
- Senha antiga rejeitada com “E-mail ou senha incorretos. Tente novamente.” (AC-09).
- Login com a nova senha entra na área do aluno.

**Resultado obtido**

- Link novo aberto pelo plano B do PC-03. A tela **Redefinir Senha**, que já estava aberta, foi reaproveitada com os campos ainda preenchidos da tentativa anterior; a redefinição usou o link novo.
- Ao tocar em **Salvar nova senha**, apareceu “Sucesso! Senha redefinida com sucesso. Você já pode realizar o login com sua nova senha.”; **OK** levou à tela **Entrar**. ✅
- Senha antiga (`Teste@1234`): recusada com “Falha na autenticação — E-mail ou senha inválidos”. ✅ O texto difere do AC-09 (“E-mail ou senha incorretos. Tente novamente.”), mas é genérico, como no CT-HU002-UI-011.
- Senha nova (`NovaSenha@1`): entrou na área do aluno. ✅
- Observação de UX: as mensagens desta tela usam o alerta nativo do iOS (`Alert.alert`), sem o estilo dos pop-ups do app (`AppPopup`). Registrado como melhoria: [MELHORIA-HU004-UI-006](issues/MELHORIA-HU004-UI-006-padronizar-alertas-recuperacao.md).
- Execução confirmada pelo testador em 06/10/2026.
- Status: ✅ Aprovado.

---

#### CT-HU004-UI-007 — Link já utilizado ou expirado

**Dados de entrada:** Duas tentativas: o link já usado no CT-006; um link novo aberto depois de mais de 15 minutos.

**Passos**

1. Abrir o link do CT-006 novamente.
2. Se a tela de nova senha abrir, preencher `OutraSenha@1` nos dois campos e tocar em **Salvar nova senha**.
3. Solicitar outro link, aguardar mais de 15 minutos e repetir os passos 1 e 2 com ele.
4. Conferir que o login continua só com `NovaSenha@1`.

**Resultado esperado**

- Bloquear o acesso à tela de nova senha e exibir “Link de recuperação expirado ou inválido. Por favor, solicite novamente.” (AC-04, FA-002).
- A senha não é alterada.
- Se a tela abrir e o erro só aparecer ao salvar, registrar como falha parcial nas observações.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-HU004-UI-005 | Com senha e confirmação diferentes, o botão Salvar nova senha continua habilitado e o aviso só aparece depois do toque. | [BUG-HU004-UI-005-botao-salvar-nao-desabilita](issues/BUG-HU004-UI-005-botao-salvar-nao-desabilita.md) |
| CT-HU004-UI-006 | Melhoria: mensagens da redefinição usam o alerta nativo do iOS, fora do padrão visual dos pop-ups do app. | [MELHORIA-HU004-UI-006-padronizar-alertas-recuperacao](issues/MELHORIA-HU004-UI-006-padronizar-alertas-recuperacao.md) |
| CT-HU004-UI-002 | Confirmação do envio é um aviso discreto escondido pelo teclado, e o texto “E-mail enviado” não é genérico. | [BUG-HU004-UI-002-confirmacao-escondida-pelo-teclado](issues/BUG-HU004-UI-002-confirmacao-escondida-pelo-teclado.md) |

## Observações gerais

- Referências: [HU-004, seção 7.2.4](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-01/HU-004.feature) e [suíte de API](../api/API-HU-004.md).
- Fora desta rodada: falha do SMTP (AC-07, exige derrubar o serviço de e-mail), hash da senha (RNF-002) e HTTPS (RNF-003), cobertos na API ou no backend. Aprovar estes 7 casos não significa cobertura total da HU.
- Ao final, anotar a senha final da conta de teste para não afetar outras suítes.
- Ocultar e-mail, senha e token nas evidências.
