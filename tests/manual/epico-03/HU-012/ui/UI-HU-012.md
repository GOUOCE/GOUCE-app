# Testes manuais de UI — HU-012 — Gerenciamento de Rotas Complementares

## Identificação da suíte

| Campo           | Valor |
| --------------- | ----- |
| Módulo          | Gestão de Rotas e Horários (EP-003) |
| Funcionalidade  | HU-012 — Gerenciamento de Rotas Complementares |
| Camada          | UI |
| Tipo de teste   | Funcional manual — suíte essencial (baseada em risco) |
| Tela            | Painel do administrador → aba **Cadastros** → **Rotas complementares** (listagem **Rotas Complementares**, **Cadastrar Rota Complementar** e **Editar Rota Complementar**) |
| Ambiente        | Desenvolvimento — app web (`http://localhost:3012`) e API local (`http://127.0.0.1:18012`), branch `test/execucao-ui-hu-012` a partir da `develop` (`c1a067c4`, com as correções das issues #309–#312), com o front do [PR #182](https://github.com/GOUOCE/GOUCE-app/pull/182) (`feat/front-hu012`, `6b32e98d`) aplicado só no working tree; para o CT-011, as telas de rotas principais do [PR #194](https://github.com/GOUOCE/GOUCE-app/pull/194) (`feat/front-hu011`) |
| Total de casos  | 13 |
| Última execução | 2026-10-29 |
| Testador        | Cauan Ricardo |

## Resultado geral

| Situação        | Total | ✅ Passaram | ❌ Falharam | 🚫 Bloqueados | ⏳ Pendentes |
| --------------- | ----: | ----------: | ----------: | ------------: | -----------: |
| ❌ Reprovada | 13 | 1 | 12 | 0 | 0 |

## Pré-condições

| ID    | Descrição |
| ----- | --------- |
| PC-01 | Aplicativo aberto com a API e o banco disponíveis. **Banco de teste sem rotas complementares**, para o CT-001 e o CT-009 poderem expor o uso de dados de exemplo no app (a primeira complementar criada recebe o `id` 1). |
| PC-02 | **Administrador A** logado: aba **Cadastros** → **Rotas complementares**. |
| PC-03 | Credenciais de um **aluno aprovado e ativo** e de um **representante**, para o CT-012. |
| PC-04 | Rotas principais preparadas pela IA via API antes da execução: **Rota Centro - UFC** e **Rota Campo Velho - IFCE** ativas; **Rota Antiga** inativa. Se a tela de rotas principais estiver no mesmo build, elas podem ser usadas para conferir a listagem. |
| PC-05 | Massa de complementares criada pela própria suíte: **Van 2 - Bairro Novo** (CT-002) e **Van Sítio** (CT-009). |
| PC-06 | Apoio da IA (Claude Code) para conferir na API ou no banco, quando o caso pedir, se o que a tela mostra foi mesmo gravado. |
| PC-07 | Se uma ação falhar com “não autorizado” por sessão vencida, sair, entrar de novo e repetir o caso. |

## Resumo da execução

Executar na ordem abaixo. São **13 casos essenciais**, em três seções. Os IDs completos usam o prefixo `CT-HU012-UI-`, numerados de 001 a 013. As regras marcadas com **#208** vêm das decisões do PO na [issue #208](https://github.com/GOUOCE/GOUCE-app/issues/208).

### Seção A — Listagem e cadastro

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU012-UI-001 | Acessar a gestão de rotas complementares | Cadastros → Rotas complementares, banco sem complementares | Listagem só de ativas com principal, horário e ponto; “Mostrar inativos” desligada; sem dados de exemplo | ❌ FALHOU | Dados de exemplo com o banco vazio; chave ligada; sem ponto de conexão; sem indicador de carregamento; seta volta ao Painel. |
| CT-HU012-UI-002 | Cadastrar rota complementar | `Van 2 - Bairro Novo`; Rota Centro - UFC; saída, retorno e ponto | “Operação realizada com sucesso”; na listagem; continua após reabrir o app e existe na API | ❌ FALHOU | Formulário sem horário de retorno: a API recusa (422) e nenhum cadastro é possível. Nome e ponto sem máscara. |
| CT-HU012-UI-003 | Horário de saída e de retorno (#208) | Saída 06:00 e retorno 17:40; retorno antes da saída; horário fora da lista | Formulário tem saída e retorno com qualquer `HH:mm`; retorno ≤ saída sinalizado | ❌ FALHOU | Só horário de saída, em lista fixa de 6 opções; sem retorno. Fechado por código e API. |
| CT-HU012-UI-004 | Seleção só com rotas principais ativas | Lista de **Rota Principal Vinculada** | Ativas aparecem; Rota Antiga e nomes inexistentes no banco não aparecem | ❌ FALHOU | Só ativas ✅; 1ª rota já vem marcada; opções não recarregam; falha mostra `Linha 01/02`. Fechado por código e API. |
| CT-HU012-UI-005 | Campos obrigatórios | Formulário vazio; sem rota principal; sem horário; nome e ponto em branco | Campos destacados com mensagem; nada salvo | ❌ FALHOU | Horário `06:10` e rota principal já marcados; sem campo de retorno. Fechado por código. |
| CT-HU012-UI-006 | Nome duplicado (#208) | Nome igual com variações; nome de rota principal | Mensagem de nome em uso; nada criado | ❌ FALHOU | Cadastro cai no 422 do retorno; na edição todo 409 vira texto fixo. Fechado por código e API. |

### Seção B — Edição, inativação e reativação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU012-UI-007 | Editar rota complementar | Trocar nome, horário, ponto e rota principal | Dados carregados certos; sucesso e listagem atualizada | ❌ FALHOU | Gravou certo na API (mesmo `id`); sucesso em barra preta com “Rota complementar alterada com sucesso”. |
| CT-HU012-UI-008 | Sair sem salvar | Alterar o ponto em Editar e tocar na seta | Pedir confirmação; nada salvo | ❌ FALHOU | Seta volta sem pedir confirmação. Fechado por código. |
| CT-HU012-UI-009 | Inativar, mostrar inativos e reativar | Cancelar e confirmar a inativação da complementar `id` 1; ligar a chave; reativar | Sucesso nas duas; inativa identificada; nenhum bloqueio por dado de exemplo | ❌ FALHOU | `id` 1 barrado por “agendamentos pendentes” sem chamar a API; sucesso em barra preta. |
| CT-HU012-UI-010 | Reativar com rota principal inativa (#208) | `Van Sítio` inativa com a principal inativada; trocar a principal e reativar | Mensagem do PO; depois da troca, reativação com sucesso | ❌ FALHOU | Reativação recusada só no console; inativas sem botão de editar. Fechado por código e API. |
| CT-HU012-UI-011 | Complementar ativa protege a rota principal (#208) | Inativar a principal pela tela de rotas principais | Bloqueio com a mensagem do PO; liberado depois de inativar a complementar | ❌ FALHOU | Tela de principais: `id` 1 barrado pelo exemplo; 409 vira “Request failed…”. Fechado por código e API. |

### Seção C — Acesso e robustez

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU012-UI-012 | Aluno e representante sem acesso | Menus do aluno e do representante; link `rotas-complementares` | Menu não exibido; link mostra Acesso Negado | ✅ PASSOU | Aluno e representante: menu ausente e links com 403. |
| CT-HU012-UI-013 | Falha de conexão e dados de exemplo | Servidor/Wi-Fi desligado ao listar, cadastrar, editar e inativar | Mensagem de conexão; app não finge sucesso nem mostra rotas que não existem | ❌ FALHOU | Sem servidor, mostra exemplos e finge sucesso. Fechado por código. |

## Detalhamento dos casos

### Seção A — Listagem e cadastro

#### CT-HU012-UI-001 — Acessar a gestão de rotas complementares

**Dados de entrada:** Administrador A logado no Painel, com o banco sem complementares (PC-01). Repetir os passos 3 e 4 depois do CT-002.

**Passos**

1. Tocar na aba **Cadastros** e no card **Rotas complementares**.
2. Conferir os elementos da tela e a posição inicial da chave **Mostrar inativos**.
3. Digitar parte de um nome em **Buscar por nome**; depois em maiúsculas; depois um texto inexistente.
4. Conferir o que cada complementar mostra.
5. Voltar e tocar no card **Rotas principais**, para conferir que os dois cards abrem a tela certa.

**Resultado esperado**

- O card abre a listagem **Rotas Complementares** (não uma tela de erro ou “não encontrada”).
- Com o banco **sem complementares**, a listagem fica vazia com “Nenhuma rota complementar ativa encontrada.”. Se aparecerem `Van 2 - Bairro Novo`, `Van 5 - Trevo da BR` ou `Rota complementar inativa`, que não existem no banco, são dados de exemplo do app: registrar como falha.
- A chave **Mostrar inativos** começa **desligada**; só ativas aparecem (AC-01, AC-09).
- Cada complementar mostra nome, rota principal vinculada, horário e **ponto de conexão** (AC-01 e cenário BDD).
- A busca filtra sem diferenciar maiúsculas; sem resultado, aparece a mensagem de lista vazia.
- Os cards **Rotas principais** e **Rotas complementares** abrem as suas telas.

**Resultado obtido**

- Com o banco **sem complementares**, a listagem mostrou dados de exemplo: ativas `Van 2 - Bairro Novo` (“Rota: Linha 01 - Centro | 06:10”) e `Van 5 - Trevo da BR` (“Rota: Linha 02 - Bairro Novo | 06:20”); em **Inativos**, `Rota complementar inativa` (“(inativa)”). Nenhuma delas existe no banco (`rotaComplementarService.ts`: com lista vazia ou falha da API, usa a lista de exemplo).
- Ao inativar a `Van 5` (exemplo, `id` 2), o app chamou a API real e mostrou “Inativação Bloqueada — Request failed with status code 404” (evidência em captura de tela).
- A chave **Mostrar inativos** começa **ligada** (`index.tsx:14`, `useState(true)`), mas funciona ao alternar.
- O item mostra só rota principal e horário de saída, **sem ponto de conexão** (`index.tsx:173-175`).
- Busca ✅ por nome, sem diferenciar maiúsculas. Por código: a API filtra só por `nome`; a busca por ponto ou por rota principal devolve `[]` e o app cai nos exemplos (ex.: “Trevo” mostraria a `Van 2` de exemplo). A busca chama a API a cada tecla.
- O carregamento “pula”: não há indicador de carregamento, então “Nenhuma rota complementar ativa encontrada.” aparece antes dos dados.
- Os cards **Rotas principais** e **Rotas complementares** abrem as telas certas ✅. A seta de voltar leva ao **Painel** (`router.back()`).
- Status: ❌ FALHOU.

---

#### CT-HU012-UI-002 — Cadastrar rota complementar

**Dados de entrada:** **Rota Principal Vinculada** `Rota Centro - UFC`; nome `Van 2 - Bairro Novo`; saída `06:00`; retorno `17:40` (se o campo existir; ver CT-003); ponto de conexão `Trevo do Bairro Novo`.

**Passos**

1. Tocar em **Nova**, preencher os campos e tocar em **Finalizar cadastro**.
2. Conferir a confirmação e confirmar; anotar a mensagem exibida.
3. Conferir a listagem.
4. **Fechar o app por completo e abrir de novo** (na web, recarregar a página); voltar à listagem.
5. Pedir à IA para conferir na API (`GET /rotas-complementares`) se a complementar foi gravada ligada à rota principal certa.

**Resultado esperado**

- Pedir confirmação antes de salvar.
- Exibir “Operação realizada com sucesso” e voltar à listagem com a complementar entre as ativas (AC-02, AC-07). Registrar o texto exato.
- Depois de reabrir o app, a complementar continua na listagem.
- Na API, a complementar existe com nome, horário, ponto e `rota_principal` iguais aos da tela.

**Resultado obtido**

- O formulário não tem **horário de retorno**. Ao finalizar, o app envia só `horario_saida` e a API (que exige o campo desde a #310) responde `422` “Horário de retorno é obrigatório.”; nada é gravado. Confirmado na API com o mesmo corpo que o app envia. **Erro grave: nenhuma complementar pode ser cadastrada pela tela.**
- Nome e ponto de conexão sem máscara: aceitam qualquer caractere (`rotaComplementarSchema.ts` só confere tamanho).
- Rota principal e horário (`06:10`) já vêm preenchidos e parecem valores digitados (ver CT-005).
- Para seguir a suíte, a IA criou `Van 2 - Bairro Novo` (`id` 1, Rota Centro - UFC, 06:00/17:40) e `Van Sítio` (`id` 2, Rota Campo Velho - IFCE) pela API.
- Status: ❌ FALHOU.

---

#### CT-HU012-UI-003 — Horário de saída e de retorno (#208)

**Dados de entrada:** cadastro `Van Retorno Teste`: saída `06:00` e retorno `17:40`; depois retorno `05:30`; depois saída `13:15`.

**Passos**

1. Em **Nova**, procurar os campos de horário de saída e de retorno.
2. Tentar escolher `13:15` na saída.
3. Escolher retorno anterior à saída e salvar.

**Resultado esperado**

- O formulário tem **horário de saída (ida)** e **horário de retorno (volta)**, um de cada, e um ponto de conexão (#208, item 4). Se só existir o horário de saída, registrar como falha.
- O administrador consegue informar qualquer horário válido `HH:mm`, sem faixa mínima ou máxima (#208, item 2b). Se o app só oferece uma lista fixa de horários, registrar como falha.
- Retorno igual ou anterior à saída é sinalizado no campo de retorno e o salvamento é bloqueado (#208, item 2a).
- Se o campo de retorno não existir, registrar as partes dele como 🚫 e citar o CT-HU012-API-003.

**Resultado obtido**

- Fechado por código e API (não executado na tela).
- Só existe **Horário de Saída**, escolhido numa lista fixa de seis opções (05:40, 06:00, 06:10, 06:20, 06:30, 07:00 — `cadastrar.tsx:232`, `editar.tsx:230`). O PO (#208, item 2b) pede qualquer `HH:mm`, e a API aceita (ex.: 06:15).
- Não há campo de retorno; por isso a regra “retorno depois da saída” (#208, item 2a) fica 🚫 na tela. A API já recusa retorno ≤ saída.
- O valor `06:10` e o texto “Selecionar” ficam no lugar do campo como se fossem digitados; não dá para distinguir placeholder de valor.
- Status: ❌ FALHOU.

---

#### CT-HU012-UI-004 — Seleção só com rotas principais ativas

**Dados de entrada:** massa da PC-04 (Rota Antiga inativa).

**Passos**

1. Em **Nova**, abrir **Rota Principal Vinculada** e anotar as opções.
2. Pedir à IA para cadastrar uma rota principal nova ativa pela API; voltar e abrir **Nova** de novo.
3. Comparar com `GET /rotas-complementares/opcoes`.

**Resultado esperado**

- Aparecem só as rotas principais **ativas** do banco; Rota Antiga não aparece (AC-03, FA-002).
- A rota principal nova aparece sem reiniciar o app.
- Não aparecem rotas que não existem no banco (por exemplo `Linha 01 - Centro`, `Linha 02 - Bairro Novo`): seriam dados de exemplo do app.
- O formulário de cadastro abre **sem** rota principal escolhida, para o administrador escolher.

**Resultado obtido**

- Fechado por código e API.
- A lista usa `GET /rotas-complementares/opcoes`, que devolve só **Rota Centro - UFC** e **Rota Campo Velho - IFCE**; **Rota Antiga** (inativa) não aparece ✅.
- O cadastro já abre com a **primeira rota principal marcada** (`cadastrar.tsx:65-67`).
- As opções carregam só ao montar a tela (`useEffect`); uma rota principal criada depois não aparece sem reiniciar.
- Se a chamada falhar, aparecem `Linha 01 - Centro` e `Linha 02 - Bairro Novo`, que não existem.
- Status: ❌ FALHOU.

---

#### CT-HU012-UI-005 — Campos obrigatórios

**Dados de entrada:**

1. Formulário recém-aberto, sem preencher nada.
2. Tudo preenchido, sem rota principal.
3. Tudo preenchido, sem horário.
4. Nome e ponto de conexão só com espaços.

**Passos**

1. Tocar em **Finalizar cadastro** em cada situação.
2. Conferir se a listagem e a API continuam sem complementar nova.

**Resultado esperado**

- O cadastro não é enviado; cada campo vazio fica **destacado** com mensagem própria (AC-08, FA-003): rota principal vinculada, nome, horários e ponto de conexão.
- O horário começa **vazio** (sem valor já marcado), para o administrador escolher. Se ele vier preenchido, registrar: o app escolhe o horário pelo administrador e o campo nunca fica vazio.
- Texto só com espaços conta como vazio.
- Nenhuma complementar é criada.

**Resultado obtido**

- Fechado por código.
- O horário de saída começa com `06:10` (`cadastrar.tsx:55`) e a rota principal já vem marcada: os cenários “sem rota principal” e “sem horário” não podem ser feitos.
- O horário de retorno não existe no formulário nem no schema.
- Nome e ponto só com espaços: o schema faz `trim` e exige 3 caracteres ✅.
- Status: ❌ FALHOU.

---

#### CT-HU012-UI-006 — Nome duplicado (#208)

**Dados de entrada:** nome `Van 2 - Bairro Novo` (igual ao do CT-002), `VAN 2 - BAIRRO NOVO` e `  van 2 - bairro novo  `; depois `Rota Centro - UFC` (nome de rota principal).

**Passos**

1. Cadastrar uma complementar com cada nome e os demais dados válidos.
2. Conferir a listagem e pedir à IA para conferir na API.

**Resultado esperado**

- O cadastro é bloqueado com mensagem clara de que o nome já está em uso. Registrar o texto exato.
- Vale para maiúsculas, espaços nas pontas, complementar inativa e nome de rota principal (#208, item 1).
- A tela continua com os dados preenchidos para correção; nenhuma complementar nova é criada.

**Resultado obtido**

- Fechado por código e API.
- Na API, `VAN 2 - BAIRRO NOVO`, `  van 2 - bairro novo  ` e `Rota Centro - UFC` são recusados com `409` “Já existe uma rota com este nome.” ✅ (#309).
- No cadastro pela tela, o pedido é recusado antes pelo `422` do horário de retorno (CT-002), então o duplicado nunca é avisado como tal.
- Na edição, todo `409` vira “Esta rota complementar já está cadastrada.” (`rotaComplementarService.ts`), escondendo a mensagem da API.
- Status: ❌ FALHOU.

---

### Seção B — Edição, inativação e reativação

#### CT-HU012-UI-007 — Editar rota complementar

**Dados de entrada:** `Van 2 - Bairro Novo`: nome `Van 2 - Bairro Novo Manhã`; outro horário; ponto `Praça do Bairro Novo`; rota principal `Rota Campo Velho - IFCE`.

**Passos**

1. Tocar no ícone de editar e conferir se os dados carregados batem com a API.
2. Fazer as alterações e tocar em **Salvar alterações**; anotar a mensagem.
3. Conferir a listagem e abrir **Editar** de novo.
4. Pedir à IA para conferir na API (mesmo `id`, nova rota principal).
5. Voltar a rota principal para `Rota Centro - UFC`.

**Resultado esperado**

- A tela abre com rota principal, nome, horários e ponto da complementar.
- Exibir “Operação realizada com sucesso” e voltar à listagem com os dados novos (AC-04, AC-07).
- Na listagem, a complementar aparece com a rota principal nova.
- Na API, a mesma complementar (mesmo `id`) com os dados novos.

**Resultado obtido**

- `Van 2 - Bairro Novo` (`id` 1) abriu com os dados da API e foi alterada para `Van 2 - Bairro Novo Manhã`, ponto `Praça do Bairro Novo` e rota principal `Rota Campo Velho - IFCE`. Conferido na API: mesmo `id`, dados novos, retorno 17:40 mantido ✅. A listagem mostrou a rota principal nova ✅.
- O sucesso apareceu em barra preta (Snackbar) com “Rota complementar alterada com sucesso”, e não no pop-up padrão com “Operação realizada com sucesso” (AC-07).
- O horário de retorno não aparece na edição.
- Status: ❌ FALHOU.

---

#### CT-HU012-UI-008 — Sair sem salvar

**Dados de entrada:** `Van 2 - Bairro Novo Manhã` aberta em **Editar**, com o ponto trocado para `Ponto Teste`, sem salvar.

**Passos**

1. Alterar o ponto e tocar na seta de voltar (no Android, também no botão voltar do aparelho).
2. Responder à confirmação, se houver, escolhendo sair.
3. Abrir a complementar em **Editar** de novo.

**Resultado esperado**

- O app pede confirmação antes de descartar as alterações (padrão das telas de edição do épico 02).
- Ao sair, nada é salvo: o ponto continua `Praça do Bairro Novo`.

**Resultado obtido**

- Fechado por código.
- A seta chama `router.back()` direto (`editar.tsx:116`), sem pedir confirmação e sem aviso de descarte; volta ao Painel.
- A edição também salva sem pedir confirmação.
- Status: ❌ FALHOU.

---

#### CT-HU012-UI-009 — Inativar, mostrar inativos e reativar

**Dados de entrada:** `Van 2 - Bairro Novo Manhã` (a primeira cadastrada no banco limpo, `id` 1), sem agendamentos; cadastrar também **Van Sítio** ligada à `Rota Campo Velho - IFCE`.

**Passos**

1. Tocar no ícone de inativar da `id` 1 e **cancelar**; conferir que nada mudou.
2. Tocar de novo e **confirmar**; anotar a mensagem.
3. Ligar **Mostrar inativos** e conferir como ela aparece.
4. Reativar, confirmar e anotar a mensagem.
5. Inativar **Van Sítio** e deixá-la inativa para o CT-010.
6. Pedir à IA para conferir na API que as complementares continuam no banco.

**Resultado esperado**

- Pedir confirmação; cancelar não muda nada.
- Confirmar exibe “Operação realizada com sucesso”, tira a complementar dos ativos e atualiza a listagem (AC-05, AC-07).
- Com a chave ligada, ela aparece identificada como **inativa** (AC-09).
- A reativação exibe “Operação realizada com sucesso” e devolve a complementar aos ativos.
- A complementar nunca some do banco (soft delete).
- Se a inativação for barrada com “agendamentos pendentes” sem existir agenda (HU-013 ainda não existe), é regra de exemplo do app: registrar como falha.

**Resultado obtido**

- Na lixeira da `Van 2 - Bairro Novo Manhã` (`id` 1), confirmar foi bloqueado com “Esta rota possui agendamentos pendentes de alunos. Não é possível inativar no momento.”, **sem chamar a API** (o log da API não registrou o pedido). O app confere a lista de exemplo antes, e o `id` 1 de exemplo tem agendamentos.
- Por código: inativar e reativar mostram “Rota complementar inativada” / “… reativada” em barra preta, não “Operação realizada com sucesso”; a inativa aparece só com “(inativa)”, sem rota principal.
- A API inativa e reativa normalmente (soft delete) ✅.
- Status: ❌ FALHOU.

---

#### CT-HU012-UI-010 — Reativar com rota principal inativa (#208)

**Dados de entrada:** `Van Sítio` inativa ligada à `Rota Campo Velho - IFCE`; a IA inativa a `Rota Campo Velho - IFCE` pela API (ela não tem outra complementar ativa).

**Passos**

1. Ligar **Mostrar inativos** e tentar reativar `Van Sítio`; anotar a mensagem.
2. Abrir `Van Sítio` em **Editar**, trocar a rota principal para `Rota Centro - UFC` e salvar.
3. Reativar `Van Sítio`.
4. Pedir à IA para reativar a `Rota Campo Velho - IFCE`.

**Resultado esperado**

- Passo 1: a reativação é bloqueada com “Não é possível reativar esta rota complementar pois a rota principal vinculada está inativa.” (#208, item 6); `Van Sítio` continua inativa. Nenhuma mensagem técnica nem ausência de aviso.
- Passo 2: a edição mostra só rotas principais ativas e salva com sucesso.
- Passo 3: reativação com “Operação realizada com sucesso”.

**Resultado obtido**

- Fechado por código e API.
- A API recusa com `409` “Não é possível reativar esta rota complementar pois a rota principal vinculada está inativa.” ✅ (#312).
- Na tela, a reativação recusada só vai para o console (`index.tsx:101-103`): nenhum aviso aparece.
- As complementares inativas não têm botão de editar (`index.tsx:207-216`): não dá para trocar a rota principal antes de reativar (passo 2).
- Status: ❌ FALHOU.

---

#### CT-HU012-UI-011 — Complementar ativa protege a rota principal (#208)

**Dados de entrada:** `Rota Centro - UFC` com as complementares ativas `Van 2 - Bairro Novo Manhã` e `Van Sítio`. Usar a tela **Rotas principais** se estiver no mesmo build; senão, a IA faz a inativação pela API e o caso registra só a parte da tela de complementares.

**Passos**

1. Na tela **Rotas principais**, tentar inativar `Rota Centro - UFC`; anotar a mensagem.
2. Inativar as duas complementares na tela **Rotas complementares**.
3. Tentar inativar `Rota Centro - UFC` de novo; depois reativá-la e reativar as complementares.

**Resultado esperado**

- Passo 1: bloqueio com “Esta rota possui rotas complementares ativas vinculadas. Inative ou desvincule as rotas complementares antes de continuar.” (#208, item 5); a rota principal continua ativa.
- Passo 3: sem complementares ativas, a inativação da principal funciona; ao final, tudo volta a ficar ativo.
- Enquanto a principal estiver inativa, ela não aparece em **Rota Principal Vinculada** (AC-03).

**Resultado obtido**

- Fechado por código e API, com as telas de rotas principais do PR #194.
- A API recusa a inativação da principal com complementar ativa: `409` “Esta rota possui rotas complementares ativas vinculadas. Inative ou desvincule as rotas complementares antes de continuar.” ✅ (#311); sem complementar ativa, inativa normalmente ✅.
- Na tela de principais, a `Rota Centro - UFC` (`id` 1) é barrada antes pela lista de exemplo (“agendamentos pendentes”, #334); nas demais, o app lê `detail`/`message` e mostra “Request failed with status code 409” (#348).
- A rota principal inativa sai da lista **Rota Principal Vinculada** ✅ (API `/opcoes`).
- Status: ❌ FALHOU.

---

### Seção C — Acesso e robustez

#### CT-HU012-UI-012 — Aluno e representante sem acesso

**Dados de entrada:** conta de aluno aprovado e de representante (PC-03); na web, os endereços `/rotas-complementares`, `/rotas-complementares/cadastrar` e `/rotas-complementares/editar?id=1`.

**Passos**

1. Entrar como aluno e procurar a gestão de rotas complementares nos menus.
2. Na web, abrir os endereços diretos.
3. Repetir como representante.

**Resultado esperado**

- O menu não aparece para aluno nem representante (RN-006).
- O link direto mostra **Acesso Negado** (ou volta ao Início), sem exibir dados nem permitir salvar.

**Resultado obtido**

- Aluno e representante não veem o menu de rotas complementares ✅.
- Os endereços `/rotas-complementares`, `/rotas-complementares/cadastrar` e `/rotas-complementares/editar?id=1` mostram 403, sem dados ✅.
- Status: ✅ PASSOU.

---

#### CT-HU012-UI-013 — Falha de conexão e dados de exemplo

**Dados de entrada:** servidor parado (ou Wi-Fi do celular desligado) com o app aberto na listagem.

**Passos**

1. Atualizar a listagem (sair e voltar à tela).
2. Tentar cadastrar `Van Sem Conexão`, editar uma complementar e inativar outra.
3. Religar o servidor, voltar à listagem e pedir à IA para conferir na API.

**Resultado esperado**

- O app avisa que não conseguiu falar com o servidor.
- Não mostra complementares nem rotas principais que não existem no banco.
- Cadastrar, editar e inativar **não** exibem sucesso; depois de religar, nada disso aparece na API.

**Resultado obtido**

- Fechado por código.
- Sem resposta do servidor, a listagem e a lista de rotas principais passam a mostrar os exemplos; cadastrar, editar, inativar e reativar alteram só a lista de exemplo e exibem sucesso (`rotaComplementarService.ts`, ramos `!error.response`).
- Status: ❌ FALHOU.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 — listagem de ativas | Visualiza as complementares ativas com horário e ponto de conexão | CT-001 |
| AC-02 — cadastro ligado a uma principal | Cadastra rota complementar | CT-002 |
| AC-03 / FA-002 — só principal ativa | Não oferece rota principal inativa | CT-004, CT-011 |
| AC-04 — edição | Edita dados e rota principal vinculada | CT-007 |
| AC-05 — inativar e reativar | Inativa; reativa | CT-009 |
| AC-06 / FA-001 — agendamentos futuros | Bloqueia inativação | Não coberto na UI nesta rodada (depende da HU-013); ver CT-HU012-API-013 e CT-009 |
| AC-07 — mensagem de sucesso | Cenários de sucesso | CT-002, CT-007, CT-009 |
| AC-08 / FA-003 — obrigatórios | Cadastro sem obrigatório | CT-005 |
| AC-09 — Mostrar inativos | Visualiza inativas | CT-001, CT-009 |
| AC-05 / RNF-013 — auditoria | Log de auditoria | Conferido na API (CT-HU012-API-011) |
| #208 item 1 — nome único | — (decisão do PO) | CT-006 |
| #208 item 2 e 4 — saída, retorno e ponto | — (decisão do PO) | CT-003 |
| #208 item 5 — principal com complementar ativa | — (decisão do PO) | CT-011 |
| #208 item 6 — reativar com principal inativa | — (decisão do PO) | CT-010 |
| RN-006 — exclusividade administrativa | Menu não exibido para outros perfis | CT-012 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Referências: [HU-012, seção 7.4.2](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-03/HU-012.feature), [decisões do PO (#208)](https://github.com/GOUOCE/GOUCE-app/issues/208), [PR #182](https://github.com/GOUOCE/GOUCE-app/pull/182) e [suíte de API](../api/API-HU-012.md).
- **Riscos mapeados no código** do PR #182 (`frontend/src/services/rotaComplementarService.ts` e telas em `frontend/src/app/(administrador)/rotas-complementares/`), que orientaram a escolha dos casos:
  - o serviço mantém uma **lista de exemplo** (`Van 2 - Bairro Novo`, `Van 5 - Trevo da BR`, `Rota complementar inativa`, ids 1 a 3, e rotas principais `Linha 01` a `Linha 03`) e a mostra quando a API devolve lista **vazia** ou falha (CT-001, CT-004, CT-013);
  - a inativação confere a lista de exemplo **antes** da API: a complementar de `id` 1 é barrada com “Esta rota possui agendamentos pendentes de alunos. Não é possível inativar no momento.” mesmo sem agenda, e esse texto difere do requisito (CT-009);
  - sem resposta do servidor, cadastrar, editar, inativar e reativar alteram só a lista de exemplo e **parecem ter dado certo** (CT-013);
  - o formulário tem **só horário de saída** (lista fixa de seis opções, de 05:40 a 07:00), já vem com `06:10` marcado e não tem horário de retorno; o backend também não tem esse campo (CT-003, CT-005);
  - a listagem mostra rota principal e horário, mas **não o ponto de conexão** (CT-001);
  - a chave **Mostrar inativos** começa **ligada** (CT-001);
  - as mensagens de sucesso são “Rota complementar cadastrada com sucesso”, “… alterada com sucesso”, “… inativada” e “… reativada”, e não “Operação realizada com sucesso” (CT-002, 007, 009);
  - a reativação recusada só registra o erro no console, sem aviso na tela (CT-010);
  - a edição salva sem pedir confirmação e não há aviso ao sair sem salvar (CT-008);
  - no PR #182 o card **Rotas principais** aponta para `/(administrador)/cadastros/rotas-principais` e, no PR #194, o card **Rotas complementares** aponta para `/cadastros/...`; os dois PRs mexem na mesma linha de `cadastros.tsx` e no `_layout.tsx` (CT-001).
- O bloqueio por agendamentos futuros (AC-06) e a complementar inativa fora do agendamento (#208, item 8) dependem da HU-013 e ficam para quando a agenda estiver na `develop`.
- Ocultar senhas e dados pessoais nas evidências.
