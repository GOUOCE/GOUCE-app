# Testes manuais de UI — HU-031 — Consultar Pendência de Cadastro

## Identificação da suíte

| Campo           | Valor |
| --------------- | ----- |
| Módulo          | Autenticação e Gestão de Conta (EP-001) |
| Funcionalidade  | HU-031 — Consultar Pendência de Cadastro |
| Camada          | UI |
| Tipo de teste   | Funcional manual — suíte essencial (baseada em risco) |
| Tela            | Login do aluno → **Status do Cadastro** (tela de cadastro reprovado) → **Corrigir documentação** (tela **Reenviar solicitação**) |
| Ambiente        | Desenvolvimento — versão web (`http://localhost:3031`) e API local (`http://localhost:8030`), na `develop` (`3e3bb13c`), em stack isolada com banco limpo |
| Total de casos  | 8 |
| Última execução | 09/11/2026 |
| Testador        | Cauan Ricardo |

## Resultado geral

| Situação        | Total | ✅ Passaram | ❌ Falharam | 🚫 Bloqueados | ⏳ Pendentes |
| --------------- | ----: | ----------: | ----------: | ------------: | -----------: |
| ❌ Reprovada (1 passou, 2 falharam, 5 bloqueados) | 8 | 1 | 2 | 5 | 0 |

## Pré-condições

| ID    | Descrição |
| ----- | --------- |
| PC-01 | Aplicativo aberto com a API e o banco disponíveis. |
| PC-02 | Massa preparada pela IA (cadastro real e reprovação pela API da HU-027): **R1** reprovado com **Comprovante de Matrícula** (“Comprovante de matrícula desatualizado.”) e **Comprovante de Residência** (“Comprovante com mais de 3 meses.”); **R2** reprovado só com **Foto de Perfil** (“Foto com baixa resolução.”); **P1** pendente; **AP** aprovado. |
| PC-03 | No celular ou no computador: um PDF válido de 1 MB, uma foto JPG, um PDF de 6 MB e um arquivo `.txt`. |
| PC-04 | Apoio da IA (Claude Code) para conferir na API ou no banco, quando o caso pedir, se o que a tela mostra foi mesmo gravado. |

## Resumo da execução

Executar na ordem abaixo. São **8 casos essenciais**, em três seções. Os IDs completos usam o prefixo `CT-HU031-UI-`, numerados de 001 a 008.

### Seção A — Consultar o status

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU031-UI-001 | Abrir o Status do Cadastro depois do login | Login de R1 | App leva à tela de status com “Reprovado” | ❌ FALHOU | Depois do login, o R1 cai na home; nenhuma tela leva ao Status do Cadastro. Perfil mostra “Aprovado”. |
| CT-HU031-UI-002 | Status pendente e aprovado | Login de P1 e AP | Status “Pendente de aprovação” e “Aprovado” visíveis | ✅ PASSOU | P1 entra e vê “Cadastro enviado para análise” (sem o texto “Pendente de aprovação”); AP vê “Aprovado” no Perfil. |
| CT-HU031-UI-003 | Documentos reprovados e motivos | R1 e R2 na tela de status | Só os documentos reprovados, com o motivo do administrador | 🚫 BLOQUEADO | Bloqueado pelo CT-001: a tela de status não é acessível. |
| CT-HU031-UI-004 | Sem pendências | AP na tela de status | Mensagem de que não há pendências | ❌ FALHOU | AP só vê o selo “Aprovado” no Perfil; não há mensagem de “não há pendências”. |

### Seção B — Reenviar documentos

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU031-UI-005 | Reenviar documentos reprovados | R1: novos comprovantes | Mensagem de sucesso; status “Pendente de Aprovação”; arquivos gravados na API | 🚫 BLOQUEADO | Bloqueado pelo CT-001: **Corrigir documentação** fica dentro da tela de status. |
| CT-HU031-UI-006 | Documento não reprovado não pode ser trocado | R2: tela de reenvio | Só a foto pode ser trocada; comprovantes bloqueados ou ocultos | 🚫 BLOQUEADO | Bloqueado pelo CT-001: a tela de reenvio não é acessível. |

### Seção C — Falhas e situação final

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU031-UI-007 | Falha no envio | R2: foto de 6 MB, `.txt`, servidor desligado | Mensagem de erro; status continua “Reprovado”; nada gravado | 🚫 BLOQUEADO | Bloqueado pelo CT-001: a tela de reenvio não é acessível. |
| CT-HU031-UI-008 | Status depois do reenvio | R1 depois do CT-005: fechar e abrir o app; novo login | Continua vendo “Pendente de Aprovação”; admin vê os documentos novos | 🚫 BLOQUEADO | Bloqueado pelo CT-005. |

## Detalhamento dos casos

### Seção A — Consultar o status

#### CT-HU031-UI-001 — Abrir o Status do Cadastro depois do login

**Dados de entrada:** e-mail e senha de R1.

**Passos**

1. Entrar com R1.
2. Anotar a tela que abre e procurar **Status do Cadastro** nos menus, se ela não abrir sozinha.

**Resultado esperado**

- Depois do login, o aluno chega à tela **Status do Cadastro** (AC-01), sem erro de “acesso negado” ou de sessão.
- A tela mostra o status **Reprovado** (AC-02).
- Se o app abrir a tela inicial do aluno e não houver caminho para o status, registrar como falha.

**Resultado obtido**

- Login do R1 abriu a home do aluno normalmente, sem a tela **Status do Cadastro** e sem item de menu que leve a ela.
- No **Perfil**, o selo mostrou **Aprovado** (azul), embora a API devolva `status_cadastro: rejeitado` no login do R1.
- Abrindo `http://localhost:3031/cadastro-rejeitado` com o R1 logado, a tela apareceu por uma fração de segundo (com o ícone verde de “sem pendências”) e o app redirecionou para o painel.
- Código: nenhuma tela navega para `cadastro-rejeitado`; o `AuthContext` manda o usuário logado que cai em rota de autenticação para a home; o selo do Perfil trata como “Aprovado” tudo que não é expirado nem pendente.
- Status: ❌ Falhou. Issues: #392 (sem caminho), #393 (selo “Aprovado”).

---

#### CT-HU031-UI-002 — Status pendente e aprovado

**Dados de entrada:** e-mail e senha de P1 e de AP.

**Passos**

1. Entrar com P1 e anotar a tela e a mensagem.
2. Sair e entrar com AP; procurar o status do cadastro.

**Resultado esperado**

- P1 vê o status **Pendente de aprovação** (AC-02, FA-002).
- AP vê o status **Aprovado** (AC-02, FA-001).
- Se o login de P1 for recusado com “Sua conta está pendente de aprovação pela coordenação.”, registrar como falha do AC-01: a mensagem informa o status, mas o aluno não chega à tela de status.

**Resultado obtido**

- P1 entrou (o login não foi recusado) e viu a tela “Cadastro enviado para análise”, com botão de voltar ao login.
- AP entrou e viu **Aprovado** (azul) no Perfil.
- Observação: a tela do P1 não escreve “Pendente de aprovação”; não foi aberta issue porque o aluno chega e vê que o cadastro está em análise.
- Status: ✅ Passou (com observação).

---

#### CT-HU031-UI-003 — Documentos reprovados e motivos

**Dados de entrada:** R1 e depois R2 na tela de status.

**Passos**

1. Com R1, anotar cada documento listado e o motivo exibido.
2. Repetir com R2.
3. Comparar com os motivos da PC-02.

**Resultado esperado**

- R1 vê **Comprovante de Matrícula** e **Comprovante de Residência**, cada um com o motivo exato digitado pelo administrador (AC-03, AC-04).
- R2 vê só **Foto de Perfil**, com “Foto com baixa resolução.”.
- Nenhum motivo inventado. Se aparecer “Documento estava ilegível, cortado ou com baixa resolução” ou “O comprovante enviado é muito antigo...”, que não foram escritos pelo administrador, são textos padrão do app: registrar como falha.

**Resultado obtido**

- Bloqueado: os motivos só aparecem na tela de status, que o aluno não alcança (CT-001).
- Na API, `GET /usuarios/me` responde `403` para R1 e R2, o que impede a tela de ler os motivos (#394).
- Status: 🚫 Bloqueado.

---

#### CT-HU031-UI-004 — Sem pendências

**Dados de entrada:** AP logado.

**Passos**

1. Abrir o status do cadastro com AP.

**Resultado esperado**

- O app informa que **não há pendências** (AC-08), sem listar documentos nem o botão **Corrigir documentação**.
- Se não houver tela de status para o aluno aprovado, marcar como 🚫 e citar o CT-002.

**Resultado obtido**

- AP entrou e só tem o selo **Aprovado** no Perfil. Não há tela nem mensagem de “não há pendências”.
- A tela de status (que traz o texto “Nenhuma pendência encontrada”) não é acessível ao aluno aprovado nem ao reprovado.
- Status: ❌ Falhou. Issue: #395.

---

### Seção B — Reenviar documentos

#### CT-HU031-UI-005 — Reenviar documentos reprovados

**Dados de entrada:** R1; novo **Comprovante de Matrícula** (PDF de 1 MB) e novo **Comprovante de Residência** (JPG).

**Passos**

1. Na tela de status, tocar em **Corrigir documentação**.
2. Anexar os dois arquivos e enviar; anotar a mensagem.
3. Pedir à IA para conferir na API o status do R1 e os ids dos comprovantes.
4. Pedir à IA para conferir se R1 voltou à fila do administrador.

**Resultado esperado**

- O aluno escolhe os documentos reprovados para reenviar (AC-05).
- Mensagem de sucesso e status **Pendente de Aprovação** (AC-06).
- Na API, R1 está `pendente` com os comprovantes **novos** (fluxo principal, passo 16). Se a tela mostrar sucesso e a API continuar `rejeitado` com os arquivos antigos, registrar como falha: o app simulou o envio.

**Resultado obtido**

- Bloqueado: o botão **Corrigir documentação** fica dentro da tela de status, inacessível (CT-001).
- Conferido no código e na API, sem executar pela tela: `userService.reenviarDocumentos` chama `PATCH /usuarios/me/reenviar`, rota que **não existe** na API (existe `/usuarios/reenvio_documento`), e `reenviar-documentos.tsx` engole o erro, mostra “Documentos Reenviados” e troca o status para pendente só no app (#396).
- Status: 🚫 Bloqueado. Reexecutar depois da correção das issues.

---

#### CT-HU031-UI-006 — Documento não reprovado não pode ser trocado

**Dados de entrada:** R2 (só a foto foi reprovada).

**Passos**

1. Abrir **Corrigir documentação** com R2.
2. Anotar quais campos aparecem e quais estão marcados como obrigatórios (`*`).
3. Tentar anexar um novo **Comprovante de Matrícula** e enviar.

**Resultado esperado**

- A tela oferece só a **Foto de Perfil**; os comprovantes, que não foram reprovados, ficam ocultos ou bloqueados (AC-07).
- Se o app deixar anexar o comprovante, o envio é recusado com mensagem clara e nada é trocado.
- Campos que não precisam ser reenviados não aparecem como obrigatórios.

**Resultado obtido**

- Bloqueado: a tela de reenvio só abre pelo botão da tela de status (CT-001).
- Status: 🚫 Bloqueado.

---

### Seção C — Falhas e situação final

#### CT-HU031-UI-007 — Falha no envio

**Dados de entrada:** R2; foto com o PDF de 6 MB, depois o `.txt`, depois uma foto válida com o servidor da API parado (pedir à IA) ou Wi-Fi desligado.

**Passos**

1. Tentar enviar cada arquivo; anotar a mensagem.
2. Religar a conexão e conferir o status de R2 na tela e na API.

**Resultado esperado**

- Para cada falha, o app mostra mensagem em português: limite de 5 MB, formato inválido e falha de conexão (FA-003).
- Não aparece “Documentos Reenviados” nem o status **Pendente de Aprovação** sem resposta de sucesso do servidor.
- R2 continua **Reprovado** na tela e na API, com a mesma pendência.

**Resultado obtido**

- Bloqueado: a tela de reenvio só abre pelo botão da tela de status (CT-001).
- No código, o erro de envio é engolido e o app simula sucesso (#396), o que contraria este caso.
- Status: 🚫 Bloqueado.

---

#### CT-HU031-UI-008 — Status depois do reenvio

**Dados de entrada:** R1 depois do CT-005.

**Passos**

1. **Fechar o app por completo e abrir de novo** (na web, recarregar a página).
2. Se for levado ao login, entrar de novo com R1.
3. Com o administrador, abrir R1 na fila e tocar nos documentos.

**Resultado esperado**

- R1 continua vendo o status **Pendente de Aprovação**, vindo do servidor (AC-06, FA-002).
- Os motivos antigos não aparecem mais como pendência.
- O administrador vê R1 na fila com os documentos novos (fluxo principal, passo 17).
- Se o novo login for recusado como “pendente de aprovação”, registrar junto com o CT-002.

**Resultado obtido**

- Bloqueado pelo CT-005 (sem reenvio não há como validar o status depois dele).
- Status: 🚫 Bloqueado.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 — acessar o status depois do login | — (HU sem arquivo `.feature`) | CT-001 |
| AC-02 / FA-001 / FA-002 — status atual | — | CT-001, CT-002, CT-008 |
| AC-03 — documentos reprovados | — | CT-003 |
| AC-04 — motivo de cada documento | — | CT-003 |
| AC-05 — reenviar documento reprovado | — | CT-005 |
| AC-06 — status volta para pendente | — | CT-005, CT-008 |
| AC-07 — não alterar documento aprovado | — | CT-006 |
| AC-08 — sem pendências | — | CT-004 |
| FA-003 — falha no envio | — | CT-007 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-001 | Nenhuma tela leva ao **Status do Cadastro** nem ao **Corrigir documentação**; o aluno reprovado cai na home. | #392 |
| CT-001 | O Perfil mostra o selo **Aprovado** para aluno reprovado. | #393 |
| CT-003 | A tela de status mostra “Nenhuma pendência encontrada” para aluno reprovado, porque `GET /usuarios/me` responde `403`. | #394 |
| CT-004 | O aluno aprovado não tem mensagem de “não há pendências”. | #395 |
| CT-005 | O reenvio chama `PATCH /usuarios/me/reenviar` (inexistente) e simula sucesso no app. Achado por leitura do código e da API; a tela não foi executada. | #396 |

## Observações gerais

- Referências: [HU-031, seção 7.2.10](../../../../../docs/requisitos.md), [suíte de API](../api/API-HU-031.md) e a [HU-027](../../HU-027/ui/UI-HU-027.md), que gera a reprovação. A HU-031 **não tem** arquivo de BDD.
- **Riscos mapeados no código** (`frontend/src/app/(autenticacao)/cadastro-rejeitado.tsx`, `reenviar-documentos.tsx`, `frontend/src/contexts/AuthContext.tsx` e `frontend/src/services/userService.ts`, `develop` `939921e3`), que orientaram a escolha dos casos:
  - nenhuma tela leva à `cadastro-rejeitado` (Status do Cadastro): o aluno rejeitado é mandado para a tela inicial do aluno (CT-001);
  - a tela de status lê os motivos em `GET /usuarios/me`, que a API recusa para aluno rejeitado; quando falha, mostra **motivos padrão** escritos no app (CT-003);
  - a tela de status mostra sempre “Status do Cadastro: Reprovado” e só é usada para rejeitados; não existe tela de status para pendente e aprovado (CT-002, CT-004);
  - o reenvio chama `PATCH /usuarios/me/reenviar`, que não existe (a API usa `/usuarios/reenvio_documento`), e **simula sucesso** quando a chamada falha: troca o status só no app (CT-005, CT-007);
  - a tela de reenvio mostra sempre os três documentos como obrigatórios, sem olhar quais foram reprovados (CT-006);
  - o login recusa aluno pendente, e o backend derruba a sessão do aluno logo depois do reenvio (CT-002, CT-008).
- Ocultar senhas e dados pessoais nas evidências.
- **Execução de 09/11/2026:** stack isolada (web 3031, API 8030, Mailpit 8031) na `develop` `3e3bb13c`, que já inclui a correção do login do pendente (#319). Massa pelo fluxo real: R1, R2, P1 e AP. R1 e R2 seguem reprovados, sem reenvio. Os CT-003 e CT-005 a CT-008 ficam para **reteste** depois da correção das issues #392, #394 e #396 (e #393 e #395 no reteste do CT-001 e do CT-004).
