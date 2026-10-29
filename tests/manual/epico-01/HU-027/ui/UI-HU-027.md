# Testes manuais de UI — HU-027 — Avaliação de Solicitação de Cadastro

## Identificação da suíte

| Campo           | Valor |
| --------------- | ----- |
| Módulo          | Autenticação e Gestão de Conta (EP-001) |
| Funcionalidade  | HU-027 — Avaliação de Solicitação de Cadastro |
| Camada          | UI |
| Tipo de teste   | Funcional manual — suíte essencial (baseada em risco) |
| Tela            | Painel do administrador → **Acesso Rápido** → **Fila de solicitações** (telas **Fila de Solicitações** e **Analisar Solicitação**) |
| Ambiente        | Desenvolvimento — app no celular (Expo Go) ou versão web (`http://localhost:3000`), na `develop` (`84681c3a`), API local `http://127.0.0.1:18027` e Mailpit `http://localhost:8025` |
| Total de casos  | 10 |
| Última execução | 2026-10-29 |
| Testador        | Cauan Ricardo |

## Resultado geral

| Situação        | Total | ✅ Passaram | ❌ Falharam | 🚫 Bloqueados | ⏳ Pendentes |
| --------------- | ----: | ----------: | ----------: | ------------: | -----------: |
| ❌ Reprovada | 10 | 5 | 5 | 0 | 0 |

## Pré-condições

| ID    | Descrição |
| ----- | --------- |
| PC-01 | Aplicativo aberto com a API e o banco disponíveis e o **Mailpit** ligado (`http://localhost:8025`) para conferir as notificações. |
| PC-02 | **Administrador A** logado no Painel. |
| PC-03 | Massa preparada pela IA pelo fluxo real de cadastro, **nesta ordem**: **A1 Zuleide**, **A2 Bruno**, **A3 Marta** e **A4 Ana**, todos pendentes, com comprovantes de matrícula e residência e foto. A ordem de envio é diferente da ordem alfabética. |
| PC-04 | Credenciais de um **aluno aprovado** e de um **representante**, para o CT-009. |
| PC-05 | Apoio da IA (Claude Code) para conferir na API ou no banco, quando o caso pedir, se o que a tela mostra foi mesmo gravado. |
| PC-06 | Se uma ação falhar com “não autorizado” por sessão vencida, sair, entrar de novo e repetir o caso. |

## Resumo da execução

Executar na ordem abaixo. São **10 casos essenciais**, em três seções. Os IDs completos usam o prefixo `CT-HU027-UI-`, numerados de 001 a 010.

### Seção A — Fila e análise

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU027-UI-001 | Acessar a fila de solicitações | Painel → Fila de solicitações; busca; filtros | Só pendentes, do mais antigo para o mais recente; busca e filtros funcionam | ✅ PASSOU | Fila só com pendentes, do mais antigo ao mais recente; busca e filtros funcionam. |
| CT-HU027-UI-002 | Ver os dados do aluno | Tocar em A1 | Todos os dados do cadastro, com nomes (não ids) e sem valores inventados | ❌ FALHOU | Bairro aparece `-` (@@A@@); etiqueta fixa e iniciais `AL` antes de carregar (@@B@@). |
| CT-HU027-UI-003 | Abrir os documentos anexados | Tocar em cada documento de A1 | Cada documento abre para visualizar ou baixar | ❌ FALHOU | Os cards de comprovante não abrem (@@C@@). |

### Seção B — Aprovação e reprovação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU027-UI-004 | Aprovar solicitação | A1: cancelar e depois confirmar | “Solicitação avaliada com sucesso”; fila recarregada sem A1 | ❌ FALHOU | Aprovação correta, mas a mensagem não é a do AC-08 (@@D@@). |
| CT-HU027-UI-005 | Aluno avisado da aprovação | E-mail do A1; login do A1 | Aviso de acesso liberado; A1 entra no app | ✅ PASSOU | E-mail “Cadastro aprovado - GOUCE” recebido e A1 entra no app. |
| CT-HU027-UI-006 | Reprovar com motivo | A2: matrícula e residência; motivo preenchido | “Solicitação avaliada com sucesso”; fila sem A2; aluno avisado com o motivo | ❌ FALHOU | Reprovação correta, mas a mensagem não é a do AC-08 (@@D@@). |
| CT-HU027-UI-007 | Motivo obrigatório | A3: motivo vazio, só espaços, curto | Confirmação bloqueada e campo destacado; nada enviado | ✅ PASSOU | Vazio, só espaços e `Ruim` bloqueados; A3 continua pendente. |
| CT-HU027-UI-008 | Documentos indicados na reprovação | A3: nenhum documento marcado; motivos diferentes por documento | Exige indicar o documento; motivo de cada um gravado como digitado | ❌ FALHOU | Sem documento marcado, o app indica a matrícula sozinho; um só motivo para todos os documentos (@@E@@); e-mail sem acento (@@F@@). |

### Seção C — Acesso e robustez

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU027-UI-009 | Aluno e representante sem acesso | Menus do aluno e do representante; link `/solicitacoes` | Menu não exibido; link mostra Acesso Negado | ✅ PASSOU | Sem menu da fila para aluna e representante; o link deu 403. |
| CT-HU027-UI-010 | Falha de conexão | Servidor/Wi-Fi desligado ao abrir a fila, aprovar e reprovar | Mensagem de conexão; app não finge sucesso | ✅ PASSOU | Mensagem de erro de conexão; nada de sucesso falso; A4 continua pendente. |

## Detalhamento dos casos

### Seção A — Fila e análise

#### CT-HU027-UI-001 — Acessar a fila de solicitações

**Dados de entrada:** Administrador A no Painel, com A1 a A4 pendentes (PC-03).

**Passos**

1. Conferir o número no card **Fila de solicitações** e tocar nele.
2. Anotar a ordem dos alunos e o texto abaixo de cada nome.
3. Digitar parte do nome de A2 em **Buscar por aluno**; depois um nome inexistente; limpar.
4. Tocar nos filtros **Novos** e **Renovações**.

**Resultado esperado**

- O card mostra a quantidade de pendentes e abre a **Fila de Solicitações**.
- Aparecem só alunos aguardando avaliação, do **mais antigo para o mais recente**: Zuleide, Bruno, Marta, Ana (AC-02). Se a ordem for alfabética, registrar como falha.
- Cada linha indica se é **cadastro novo** ou **renovação**.
- A busca filtra por nome; sem resultado, aparece “Nenhuma solicitação pendente encontrada.”.
- Os filtros separam cadastros novos de renovações.

**Resultado obtido**

- A fila mostrou só A1 a A4, na ordem de envio: Zuleide, Bruno, Marta, Ana ✅.
- Busca e filtros **Novos**/**Renovações** funcionaram ✅ (não havia renovação na massa).
- Status: ✅ PASSOU.

---

#### CT-HU027-UI-002 — Ver os dados do aluno

**Dados de entrada:** A1 na fila.

**Passos**

1. Tocar em A1 e anotar cada campo da tela **Analisar Solicitação**.
2. Pedir à IA os dados do A1 na API (`GET /alunos/{id}`) para comparar.

**Resultado esperado**

- A tela mostra foto, nome, e-mail, telefone, faculdade e campus, curso, período de ingresso, turno, data de nascimento e bairro (AC-03).
- Faculdade e bairro aparecem pelo **nome**, não por número.
- Campos sem informação mostram `-`, nunca um valor inventado. Se aparecer **UFC - Quixadá** para um aluno de outra faculdade ou sem faculdade, registrar como falha.
- A etiqueta de status corresponde à situação real (cadastro novo ou renovação).

**Resultado obtido**

- E-mail, telefone, `UFC - Quixadá`, curso, período, turno e nascimento batem com a API (`GET /alunos/2`) ✅.
- **Bairro** aparece `-`, mas a API tem `bairro: "Centro"`: a tela lê `bairro_id`, que a API não manda → @@A@@.
- A etiqueta é sempre “Pendente: vínculo em análise”, mesmo para cadastro novo; e o avatar mostra `AL` antes de carregar a foto → @@B@@.
- A foto exibida é a do aluno (imagem de teste com o nome dele) ✅.
- Status: ❌ FALHOU.

---

#### CT-HU027-UI-003 — Abrir os documentos anexados

**Dados de entrada:** A1 aberto em **Analisar Solicitação**.

**Passos**

1. Tocar no card **Comprovante de Matrícula**.
2. Voltar e tocar em **Comprovante de Residência**.
3. Repetir na web, se estiver no celular.

**Resultado esperado**

- Cada card abre o documento enviado pelo aluno, para visualizar ou baixar (AC-03, fluxo principal passo 11).
- O documento aberto é o do A1, e não de outro aluno.
- Se o toque não fizer nada, registrar como falha: o administrador não consegue conferir os documentos.

**Resultado obtido**

- Os cards **Comprovante de Matrícula** e **Comprovante de Residência** não têm ação de toque (`[id].tsx`, sem `onPress`), embora a API tenha `id_comprovante_*` e as rotas `/arquivos/{id}/view` e `/download` → @@C@@. Fechado por leitura do código e conferência na API: a falha já estava clara no código.
- Status: ❌ FALHOU.

---

### Seção B — Aprovação e reprovação

#### CT-HU027-UI-004 — Aprovar solicitação

**Dados de entrada:** A1 aberto em **Analisar Solicitação**.

**Passos**

1. Tocar em **Aprovar cadastro** e depois em cancelar no aviso.
2. Tocar de novo em **Aprovar cadastro** e confirmar; anotar a mensagem exibida.
3. Tocar no botão do aviso e conferir a fila.
4. Pedir à IA para conferir o status do A1 na API.

**Resultado esperado**

- Cancelar fecha o aviso sem aprovar.
- Confirmar exibe **“Solicitação avaliada com sucesso”** (AC-08). Registrar o texto exato; outra mensagem é falha do AC-08.
- O app volta para a fila **recarregada**, sem A1 (AC-04, AC-08).
- A1 está `ativado` na API.

**Resultado obtido**

- Cancelar fechou o aviso; confirmar aprovou, o pop-up de sucesso apareceu e a fila recarregou sem A1 ✅. Na API, A1 está `ativado` ✅.
- Texto exibido: “O cadastro do aluno foi aprovado com sucesso!” (título “Solicitação Aprovada”); o AC-08 pede “Solicitação avaliada com sucesso” → @@D@@.
- Status: ❌ FALHOU.

---

#### CT-HU027-UI-005 — Aluno avisado da aprovação

**Dados de entrada:** e-mail do A1 no Mailpit; credenciais do A1.

**Passos**

1. Abrir o Mailpit e procurar mensagens para o A1.
2. Sair do administrador e entrar com o A1.

**Resultado esperado**

- Um e-mail (ou push) informando que o cadastro foi aprovado e o acesso liberado (AC-04).
- O A1 entra no app e chega à tela inicial do aluno.

**Resultado obtido**

- Mailpit: e-mail “Cadastro aprovado - GOUCE” para A1, informando que o acesso foi liberado ✅.
- A1 entrou no app ✅.
- Status: ✅ PASSOU.

---

#### CT-HU027-UI-006 — Reprovar com motivo

**Dados de entrada:** A2; marcar **Comprovante de Matrícula** e **Comprovante de Residência**; motivo `Comprovante de matrícula desatualizado.`.

**Passos**

1. Abrir A2 e tocar em **Reprovar cadastro**.
2. Marcar os dois documentos, escrever o motivo e confirmar; anotar a mensagem.
3. Conferir a fila e o e-mail do A2 no Mailpit.
4. Pedir à IA para conferir na API o status e os documentos indicados.

**Resultado esperado**

- O app não reprova de imediato: abre a tela **Detalhar Recusa** pedindo o motivo (AC-05).
- Exibe **“Solicitação avaliada com sucesso”** e volta para a fila recarregada, sem A2 (AC-08).
- A2 está `rejeitado`, com os dois documentos e o motivo (AC-07).
- O e-mail ao A2 informa o motivo (AC-07).

**Resultado obtido**

- Abriu **Detalhar Recusa**; após confirmar, a fila recarregou sem A2 ✅. Na API, A2 está `rejeitado` com os dois documentos e o motivo ✅.
- E-mail “Documentos pendentes de reenvio” recebido com o motivo ✅ (o texto do e-mail tem problemas registrados no CT-008).
- Texto exibido: “A solicitação foi recusada com sucesso e o aluno foi notificado para ajuste.” (título “Solicitação Recusada”), em vez de “Solicitação avaliada com sucesso” → @@D@@.
- Status: ❌ FALHOU.

---

#### CT-HU027-UI-007 — Motivo obrigatório

**Dados de entrada:** A3; em **Detalhar Recusa**, marcar **Comprovante de Matrícula** e tentar confirmar com: motivo vazio; motivo com 5 espaços; motivo `Ruim`.

**Passos**

1. Tentar confirmar com cada motivo.
2. Fechar a tela sem confirmar e conferir que o A3 continua na fila.

**Resultado esperado**

- A confirmação é bloqueada e o campo fica destacado com a mensagem de preenchimento obrigatório (AC-06).
- Motivo só com espaços conta como vazio.
- Nenhuma chamada de reprovação é feita: A3 continua pendente e na fila.

**Resultado obtido**

- Os três motivos foram bloqueados com o campo destacado ✅.
- Na API, A3 continua `pendente`, sem documentos indicados ✅.
- Status: ✅ PASSOU.

---

#### CT-HU027-UI-008 — Documentos indicados na reprovação

**Dados de entrada:** A3; em **Detalhar Recusa**:

1. Nenhum documento marcado, motivo `Foto está desfocada.`.
2. Se o item 1 for bloqueado: marcar matrícula e foto, com o motivo `Foto desfocada e matrícula vencida.`.

**Passos**

1. Tentar confirmar o item 1.
2. Pedir à IA para conferir na API quais documentos foram indicados e com qual motivo.

**Resultado esperado**

- Sem documento marcado, o app pede para marcar ao menos um, como o próprio formulário prevê (“Selecione ao menos um documento para reenvio”).
- O app não indica para o aluno um documento que o administrador não marcou. Se a API mostrar `comprovante_matricula` depois do item 1, registrar como falha.
- A HU-031 mostra **o motivo de cada documento** (AC-04). Registrar se a tela permite um motivo por documento ou só um motivo repetido para todos.

**Resultado obtido**

- Sem documento marcado, o código envia `comprovante_matricula` por conta própria, em vez de pedir para marcar → @@E@@. Fechado por leitura do código e conferência na API: a falha já estava clara no código.
- O motivo é um só e vai para todos os documentos marcados: no CT-006 a residência do A2 foi indicada com “Comprovante de matrícula desatualizado.” (API e e-mail) → @@E@@.
- O e-mail escreve “Comprovante Matricula” e “Comprovante Residencia”, sem acento (`email_service.py`, `replace('_', ' ').title()`) → @@F@@.
- Status: ❌ FALHOU.

---

### Seção C — Acesso e robustez

#### CT-HU027-UI-009 — Aluno e representante sem acesso

**Dados de entrada:** aluno aprovado e representante (PC-04).

**Passos**

1. Entrar como aluno e procurar a fila nos menus.
2. Na web, abrir `http://localhost:3000/solicitacoes` com o aluno logado.
3. Repetir com o representante.

**Resultado esperado**

- O menu da fila não aparece para aluno nem representante (AC-01, RN-006).
- O link direto mostra **Acesso Negado** ou leva ao login, sem mostrar a fila nem os dados de alunos.

**Resultado obtido**

- Larissa (aluna) e Pedro (representante): a fila não aparece nos menus ✅.
- `localhost:3000/solicitacoes` mostrou acesso negado (403) para os dois ✅.
- Status: ✅ PASSOU.

---

#### CT-HU027-UI-010 — Falha de conexão

**Dados de entrada:** A4 na fila; servidor da API parado (pedir à IA) ou Wi-Fi do celular desligado.

**Passos**

1. Com a conexão cortada, abrir a fila.
2. Religar, abrir A4, cortar de novo e tentar aprovar.
3. Repetir tentando reprovar com motivo válido.
4. Religar e conferir A4 na API.

**Resultado esperado**

- O app mostra mensagem de falha de conexão em português, sem texto técnico.
- Não aparece “Solicitação Aprovada” nem “Solicitação Recusada” sem resposta do servidor.
- A4 continua pendente na API e na fila.

**Resultado obtido**

- Com a API parada, a fila, a aprovação e a reprovação mostraram erro de servidor/conexão, sem “Solicitação Aprovada” nem “Solicitação Recusada” ✅.
- Na API, A4 continua `pendente` ✅.
- Status: ✅ PASSOU.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 / RN-006 — acesso só do administrador | Acesso restrito ao perfil Administrador | CT-009 |
| AC-02 — fila do mais antigo para o mais recente | Fila ordenada do pedido mais antigo | CT-001 |
| AC-03 — dados e documentos | Visualiza os dados e documentos | CT-002, CT-003 |
| AC-04 — aprovar, sair da fila e notificar | Aprova uma solicitação | CT-004, CT-005 |
| AC-05 — reprovar pede o motivo | Reprova informando o motivo | CT-006 |
| AC-06 — motivo obrigatório | Bloqueia a reprovação sem motivo | CT-007 |
| AC-07 — reprovar, guardar motivo e notificar | Reprova informando o motivo | CT-006, CT-008 |
| AC-08 — mensagem e fila recarregada | Aprova; reprova | CT-004, CT-006 |
| RNF-013 — auditoria | — | Conferido na API (CT-HU027-API-009) |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-002 | Bairro aparece `-` na análise (a tela lê `bairro_id`; a API manda `bairro`) | @@A@@ |
| CT-002 | Etiqueta fixa “Pendente: vínculo em análise” e iniciais `AL` antes de carregar | @@B@@ |
| CT-003 | Comprovantes de matrícula e residência não abrem | @@C@@ |
| CT-004, 006 | Mensagens de sucesso diferentes de “Solicitação avaliada com sucesso” (AC-08) | @@D@@ |
| CT-006, 008 | Sem documento marcado, o app indica a matrícula; um único motivo repetido para todos os documentos | @@E@@ |
| CT-006, 008 | E-mail de reenvio com “Comprovante Matricula/Residencia” sem acento | @@F@@ |

## Observações gerais

- Referências: [HU-027, seção 7.2.7](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-01/HU-027.feature) e [suíte de API](../api/API-HU-027.md).
- **Riscos mapeados no código** (`frontend/src/app/(administrador)/solicitacoes/` e `frontend/src/services/solicitacaoService.ts`, `develop` `939921e3`), que orientaram a escolha dos casos:
  - os cards **Comprovante de Matrícula** e **Comprovante de Residência** não têm ação de toque: os documentos não abrem (CT-003);
  - **Instituição - Campus** mostra `UFC - Quixadá` quando o dado falta, e faculdade e bairro aparecem pelo id (CT-002);
  - a etiqueta **Pendente: vínculo em análise** é fixa para todo aluno, novo ou renovação (CT-002);
  - as mensagens de sucesso são “O cadastro do aluno foi aprovado com sucesso!” e “A solicitação foi recusada com sucesso e o aluno foi notificado para ajuste.”, e não “Solicitação avaliada com sucesso” (CT-004, CT-006);
  - a aprovação não dispara e-mail no backend (CT-005);
  - sem documento marcado, o app envia `comprovante_matricula` por conta própria, e usa o mesmo motivo para todos os documentos marcados (CT-008);
  - a fila carrega duas vezes ao abrir (efeito e foco); anotar se a lista pisca ou duplica (CT-001).
- As renovações de vínculo aparecem na mesma fila, mas a avaliação delas é testada na HU-028.
- Ocultar senhas e dados pessoais nas evidências.
- **Execução (29/10/2026):** massa montada pela IA pelo fluxo real de cadastro (A1 a A4 pendentes; Larissa aprovada; Pedro representante), cada aluno com documentos e foto próprios (imagens de teste com o nome escrito). CT-003 e parte do CT-008 fechados por leitura do código, a pedido do testador; os demais executados na web, com conferência na API e no Mailpit.
