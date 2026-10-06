# Testes manuais de UI — HU-028 — Renovação de Vínculo Institucional

## Identificação da suíte

| Campo           | Valor                                                                                   |
| --------------- | --------------------------------------------------------------------------------------- |
| Módulo          | Autenticação e Gestão de Conta                                                          |
| Funcionalidade  | HU-028 — Renovação de Vínculo Institucional                                             |
| Camada          | UI                                                                                      |
| Tipo de teste   | Funcional manual — suíte essencial                                                      |
| Tela            | Início do aluno, Meu Perfil → Renovar vínculo (aviso e passos 1 a 4) e Agenda           |
| Ambiente        | Desenvolvimento — app mobile no iPhone (Expo Go)                                        |
| Total de casos  | 9 |
| Última execução | 06/10/2026                                                                              |
| Testador        | Cauan Ricardo                                                                           |

## Resultado geral

| Situação        | Total | ✅ Passaram | ❌ Falharam | ⏳ Pendentes |
| --------------- | ----: | ----------: | ----------: | -----------: |
| ⏳ Em execução | 9 | 1 | 2 | 6 |

## Pré-condições

| ID    | Descrição |
| ----- | --------- |
| PC-01 | Aplicativo aberto no iPhone pelo **Expo Go**, com a API e o armazenamento de arquivos disponíveis e conexão ativa (exceto no CT-005). |
| PC-02 | **Aluno A** com cadastro **aprovado** e **vínculo vencido** (`validade_acesso` no passado). Em ambiente local, preparar pelo banco ou pela API e registrar a preparação. Se o login do aluno com vínculo vencido for recusado, executar os casos 002 a 006 com um aluno aprovado sem vínculo vencido e registrar a falha no CT-001. |
| PC-03 | Arquivos no iPhone (app **Arquivos**) e na galeria: `comprovante.pdf` (~2 MB), `comprovante.docx` (~2 MB) e `comprovante-grande.pdf` (~8 MB). Documentos fictícios. |
| PC-04 | Caminho: aba **Perfil** → **Renovar vínculo** → **Iniciar renovação** → passos 1 a 4 (dados básicos, perfil demográfico, contato e vínculo, documentação). |
| PC-05 | O token de acesso dura 15 minutos e o app ainda não o renova (#123). Entrar de novo antes de cada caso que envia dados. |

## Resumo da execução

Executar na ordem abaixo. São **9 casos essenciais**, em três seções. Os IDs completos usam o prefixo `CT-HU028-UI-`, numerados de 001 a 009. O CT-004 muda o status do aluno para “Em análise”; os casos 002, 003 e 005 vêm antes dele.

### Seção A — Aviso e validação do comprovante

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU028-UI-001 | Aviso de renovação após o login | Aluno com vínculo vencido | Login permitido e aviso destacado com a opção de renovar | ❌ REPROVADO | O login foi barrado com o pop-up “Falha na autenticação — A validade de acesso da sua conta expirou.” e o botão Tentar novamente; o aluno não chega à área do aluno nem à renovação. Mesmo defeito do CT-HU028-API-004 (BUG-HU028-API-002). Executado pelo testador em 06/10/2026. |
| CT-HU028-UI-002 | Envio sem comprovante | Passo 4 sem arquivo | Bloquear e alertar que o comprovante é obrigatório | ✅ APROVADO | O envio foi bloqueado com “Envie PDF ou imagem (PNG, JPG ou WEBP) de até 10 MB”. Observações: o botão continua habilitado antes do toque, e o texto não diz que o comprovante é obrigatório e cita 10 MB (o AC-03 fala em 5 MB) — ver [MELHORIA-HU028-UI-002](issues/MELHORIA-HU028-UI-002-mensagem-e-limite-do-comprovante.md). Confirmado pelo testador em 06/10/2026. |
| CT-HU028-UI-003 | Arquivo inválido | `comprovante.docx`; `comprovante-grande.pdf` (8 MB) | Bloquear com “Formato inválido” / “Arquivo excede o limite de tamanho” | ❌ REPROVADO | O DOCX aparece apagado no seletor e não pode ser escolhido. O PDF de 8,4 MB foi aceito: a renovação foi enviada e o status passou a “Pendente: vínculo em análise”. O app e a API aceitam até 10 MB, e não 5 MB. Ver [BUG-HU028-API-001](../api/issues/BUG-HU028-API-001-limite-de-5mb-nao-aplicado.md). Executado pelo testador em 06/10/2026. |

### Seção B — Envio e status “Em análise”

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU028-UI-004 | Renovação válida | `comprovante.pdf` (2 MB) | “Comprovante enviado com sucesso”; status “Em análise” | ⏳ PENDENTE | Não executado. |
| CT-HU028-UI-005 | Falha de conexão no envio | Wi-Fi e dados móveis desligados no envio | Mensagem de falha; tela mantida para nova tentativa | ⏳ PENDENTE | Não executado. |
| CT-HU028-UI-006 | Agendamento bloqueado em análise | Aluno “Em análise”; aba Agenda e atalhos | Agendamento bloqueado com informativo | ⏳ PENDENTE | Não executado. |

### Seção C — Formulário da renovação e reenvio

Executar o CT-007 e o CT-008 **antes** do CT-004, e o CT-009 **depois** dele.

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU028-UI-007 | Dados atuais e validação nos passos | Passos 1 a 3; telefone `8599` no passo 3 | Campos preenchidos com os dados atuais; passo inválido não avança | ⏳ PENDENTE | Não executado. |
| CT-HU028-UI-008 | Cancelar a renovação no meio | Passo 3 → X → Cancelar renovação? | Confirmação; nada enviado; status inalterado | ⏳ PENDENTE | Não executado. |
| CT-HU028-UI-009 | Nova renovação estando em análise | Aluno “Em análise” abre Renovar vínculo | Informar que a renovação já está em análise e não permitir novo envio | ⏳ PENDENTE | Não executado.

## Detalhamento dos casos

### Seção A — Aviso e validação do comprovante

#### CT-HU028-UI-001 — Aviso de renovação após o login

**Dados de entrada:** Credenciais do aluno A com vínculo vencido (PC-02).

**Passos**

1. Entrar com o aluno A (**Sou aluno**).
2. Observar a tela **Início**: há aviso de renovação?
3. Abrir **Perfil → Renovar vínculo** e conferir a tela inicial.

**Resultado esperado**

- O login é permitido e o aluno vê, logo ao entrar, um **aviso destacado** de necessidade de renovação, com a opção de iniciar a revalidação (AC-01, RN-013).
- A tela **Renovar Vínculo** mostra o aviso “Vínculo expirado — renovação necessária” e o botão **Iniciar renovação**.
- Se o login for recusado, ou se o aviso só existir dentro de **Perfil → Renovar vínculo** (sem destaque ao entrar), registrar como falha.

**Resultado obtido**

- Preparação: `validade_acesso` do aluno A ajustada para o dia anterior no banco local (restaurada após o caso).
- Ao tocar em **Sou aluno**, o app exibiu o pop-up do app “Falha na autenticação — A validade de acesso da sua conta expirou.”, com o botão **Tentar novamente**. A mensagem é clara, mas o aluno é barrado no login. ❌
- O aluno não chega à tela **Início** nem a **Perfil → Renovar vínculo**: não há como iniciar a renovação (AC-01, RN-013).
- Mesma causa do CT-HU028-API-004 ([BUG-HU028-API-002](../api/issues/BUG-HU028-API-002-aluno-com-vinculo-vencido-nao-entra.md)): o backend recusa o login quando a validade venceu.
- Execução confirmada pelo testador em 06/10/2026.
- Status: ❌ Reprovado.

---

#### CT-HU028-UI-002 — Envio sem comprovante

**Dados de entrada:** Passos 1 a 3 com os dados atuais; passo 4 sem selecionar o comprovante de matrícula.

**Passos**

1. Tocar em **Iniciar renovação** e avançar os passos 1 a 3 sem alterar os dados.
2. No passo 4, não anexar o comprovante de matrícula.
3. Observar o botão de envio e tocar nele.

**Resultado esperado**

- O envio fica bloqueado (botão desabilitado ou bloqueio ao tocar) e aparece um alerta de que o comprovante é obrigatório (AC-02).
- Nada é enviado e o status do aluno não muda.

**Resultado obtido**

- No passo 4, sem anexar o comprovante de matrícula, o botão de envio continuou habilitado (azul).
- Ao tocar, o envio foi bloqueado e o campo exibiu “Envie PDF ou imagem (PNG, JPG ou WEBP) de até 10 MB”. Nada foi enviado. ✅
- Observações: o texto não diz que o comprovante é **obrigatório** (só orienta formato e tamanho) e informa limite de **10 MB**, enquanto o AC-03 define 5 MB — mesma divergência do CT-HU028-API-003 ([BUG-HU028-API-001](../api/issues/BUG-HU028-API-001-limite-de-5mb-nao-aplicado.md)), agora também no app (`fileSchema` em `frontend/src/schemas/alunoSchema.ts`). Registrado como melhoria: [MELHORIA-HU028-UI-002](issues/MELHORIA-HU028-UI-002-mensagem-e-limite-do-comprovante.md).
- Passos 1 a 3 vieram preenchidos com os dados atuais do aluno (registrado também no CT-HU028-UI-007).
- Execução confirmada pelo testador em 06/10/2026.
- Status: ✅ Aprovado.

---

#### CT-HU028-UI-003 — Arquivo inválido

**Dados de entrada:** Duas tentativas no passo 4: `comprovante.docx` (2 MB); `comprovante-grande.pdf` (8 MB).

**Passos**

1. No passo 4, tocar para anexar o comprovante e tentar escolher o `.docx` no app **Arquivos**.
2. Repetir com o PDF de 8 MB e tocar em enviar.

**Resultado esperado**

- DOCX: o seletor não permite escolher o arquivo **ou** o app bloqueia com “Formato inválido” (AC-03). Registrar qual dos dois aconteceu.
- PDF de 8 MB: bloqueado com “Arquivo excede o limite de tamanho” (limite de 5 MB, AC-03), de preferência ainda no app, antes do envio.
- Mensagens em português; status do aluno inalterado.

**Resultado obtido**

- `comprovante.docx`: aparece apagado no seletor do app **Arquivos** e não pode ser escolhido. ✅
- `comprovante-grande.pdf` (8,4 MB): o app aceitou o anexo. Na primeira tentativa, a API recusou por outro motivo: “O semestre atual não pode ser maior que 1, considerando o período de ingresso” (dados antigos da conta: ingresso 2026.2 com semestre 6). O passo 3 deixou avançar com os dados incoerentes; o erro só apareceu no envio final.
- Com o semestre corrigido para 1 no passo 3, o envio com o PDF de 8,4 MB foi **aceito**: apareceu um aviso rápido de sucesso (Snackbar preto, sem o estilo do app) e **Meu Perfil** passou a mostrar “Pendente: vínculo em análise”. O arquivo de 8 MB ficou salvo como comprovante (conferido no banco). ❌
- O app (`fileSchema`, 10 MB) e a API (BUG-HU028-API-001, 10 MB) não aplicam o limite de 5 MB do AC-03.
- Após o caso, o aluno A voltou para aprovado pela API, para seguir os demais casos.
- Execução confirmada pelo testador em 06/10/2026.
- Status: ❌ Reprovado — [BUG-HU028-API-001](../api/issues/BUG-HU028-API-001-limite-de-5mb-nao-aplicado.md).

### Seção B — Envio e status “Em análise”

#### CT-HU028-UI-004 — Renovação válida

**Dados de entrada:** Passos 1 a 3 com os dados atuais; passo 4 com `comprovante.pdf` (2 MB).

**Passos**

1. Percorrer os passos 1 a 3 e anexar o PDF no passo 4.
2. Tocar em enviar e anotar a mensagem.
3. Conferir para onde o app volta e o status exibido em **Meu Perfil**.
4. Fechar e reabrir o app, entrar de novo e conferir o status.

**Resultado esperado**

- Exibir “Comprovante enviado com sucesso” (AC-05). Registrar o texto exato exibido.
- O status do aluno passa a **Em análise** em **Meu Perfil**, e continua após entrar de novo.
- O aluno entra na fila de análise do administrador (conferido na suíte de API, CT-HU028-API-001).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU028-UI-005 — Falha de conexão no envio

**Dados de entrada:** Renovação preenchida até o passo 4 com `comprovante.pdf`; Wi-Fi e dados móveis desligados antes de enviar.

**Passos**

1. Preencher os passos 1 a 4 e anexar o PDF.
2. Desligar Wi-Fi e dados móveis e tocar em enviar.
3. Fechar o aviso e conferir a tela.
4. Religar a conexão e tocar em enviar de novo (pode ser feito como o CT-004, se ele ainda não tiver sido executado).

**Resultado esperado**

- Exibir “Falha no envio. Verifique sua conexão e tente novamente” sem travar (AC-04, FA-001).
- A tela de renovação continua aberta no passo 4, com os dados e o arquivo mantidos.
- Com a conexão de volta, o envio é concluído sem redigitar.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU028-UI-006 — Agendamento bloqueado em análise

**Dados de entrada:** Aluno A com status **Em análise** (após o CT-004).

**Passos**

1. Abrir a aba **Agenda**.
2. Na tela **Início**, tocar em **Agendar Transporte** e em **Meus Agendamentos**.

**Resultado esperado**

- O acesso ao agendamento fica bloqueado, com um informativo de que a liberação depende da validação do documento (AC-06, RN-011).
- Se a tela de agendamento ainda não existir no app, marcar o caso como bloqueado e registrar o motivo.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

### Seção C — Formulário da renovação e reenvio

#### CT-HU028-UI-007 — Dados atuais e validação nos passos

**Dados de entrada:** Aluno A antes de renovar; no passo 3, telefone `8599`.

**Passos**

1. Tocar em **Iniciar renovação** e conferir os campos dos passos 1 a 3.
2. No passo 3, trocar o telefone por `8599` e tocar em avançar.
3. Corrigir o telefone e avançar.

**Resultado esperado**

- Os passos 1 a 3 vêm preenchidos com os dados atuais do cadastro; o aluno só revisa.
- Campos inválidos bloqueiam o avanço com alerta em português no próprio campo (mesmas regras do cadastro da HU-001).
- Corrigido o campo, o passo avança.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU028-UI-008 — Cancelar a renovação no meio

**Dados de entrada:** Renovação aberta no passo 3.

**Passos**

1. Tocar no **X** do topo e conferir a confirmação **Cancelar renovação?**.
2. Escolher continuar e conferir que o passo 3 é mantido.
3. Tocar no **X** de novo e confirmar o cancelamento.
4. Conferir o status em **Meu Perfil** e abrir **Renovar vínculo** de novo.

**Resultado esperado**

- O app pede confirmação antes de cancelar; continuar mantém os dados.
- Ao confirmar, nada é enviado e o status do aluno não muda.
- Ao abrir **Renovar vínculo** de novo, a renovação começa do início (tela de aviso), sem dados de um envio que não aconteceu.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU028-UI-009 — Nova renovação estando em análise

**Dados de entrada:** Aluno A com status **Em análise** (após o CT-004).

**Passos**

1. Abrir **Perfil → Renovar vínculo**.
2. Se o app permitir, percorrer os passos e enviar de novo com `comprovante.pdf`.

**Resultado esperado**

- O app informa que a renovação já foi enviada e está em análise, sem oferecer um novo envio (AC-05, AC-06).
- Se o app aceitar um segundo envio, registrar como falha: o aluno pode substituir o comprovante enquanto o administrador analisa.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-HU028-UI-003 | Comprovante de 8,4 MB aceito pelo app e pela API (limite real de 10 MB, requisito de 5 MB). | [BUG-HU028-API-001](../api/issues/BUG-HU028-API-001-limite-de-5mb-nao-aplicado.md) |
| CT-HU028-UI-003 | Melhoria: a confirmação de envio é um aviso rápido sem estilo (Snackbar); padronizar com o pop-up do app. | [MELHORIA-HU028-UI-003](issues/MELHORIA-HU028-UI-003-confirmacao-do-envio-sem-estilo.md) |
| CT-HU028-UI-002 | Melhoria: a mensagem sem comprovante não diz que é obrigatório e cita 10 MB (requisito: 5 MB). | [MELHORIA-HU028-UI-002](issues/MELHORIA-HU028-UI-002-mensagem-e-limite-do-comprovante.md) |
| CT-HU028-UI-001 | O aluno com vínculo vencido é barrado no login e não consegue renovar. | BUG-HU028-API-002 (mesma causa, suíte de API) |

## Observações gerais

- Referências: [HU-028, seção 7.2.8](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-01/HU-028.feature), [tela Renovar vínculo](../../../../../frontend/src/app/%28aluno%29/renovar-vinculo.tsx) e [suíte de API](../api/API-HU-028.md).
- Divergência de escopo: o requisito fala apenas em enviar o comprovante, mas o app pede para revisar todos os dados do cadastro em 4 passos. Registrar a percepção de uso e levar ao líder.
- A aprovação da renovação pelo administrador pertence à HU-027 e fica fora desta suíte.
- Restaurar o status e a validade do aluno A ao final (pelo administrador ou pelo banco local). Ocultar dados pessoais e documentos nas evidências.
