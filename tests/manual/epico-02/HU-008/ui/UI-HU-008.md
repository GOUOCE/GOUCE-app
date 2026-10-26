# Testes manuais de UI — HU-008 — Gerenciamento de Faculdades

## Identificação da suíte

| Campo           | Valor |
| --------------- | ----- |
| Módulo          | Gestão de Cadastros Base (EP-002) |
| Funcionalidade  | HU-008 — Gerenciamento de Faculdades |
| Camada          | UI |
| Tipo de teste   | Funcional manual — suíte essencial (baseada em risco) |
| Tela            | Painel do administrador → aba **Cadastros** → **Faculdades** (listagem **Faculdades**, **Cadastrar Faculdade** e **Editar**) |
| Ambiente        | Desenvolvimento — app no celular (Expo Go) ou versão web (`http://localhost:3000`) |
| Total de casos  | 12 |
| Última execução | 2026-10-26 |
| Testador        | Cauan Ricardo |

## Resultado geral

| Situação        | Total | ✅ Passaram | ❌ Falharam | 🚫 Bloqueados | ⏳ Pendentes |
| --------------- | ----: | ----------: | ----------: | ------------: | -----------: |
| 🔄 Em andamento | 12 | 1 | 4 | 0 | 7 |

## Pré-condições

| ID    | Descrição |
| ----- | --------- |
| PC-01 | Aplicativo aberto com a API e o banco disponíveis. **Banco de teste sem faculdades cadastradas** (ou com nomes diferentes dos usados aqui), para o CT-003 e o CT-007 poderem expor o uso de dados de exemplo no app. |
| PC-02 | **Administrador A** logado: aba **Cadastros** → **Faculdades**. |
| PC-03 | Credenciais de um **aluno ativo** e de um **representante**, para o CT-010. |
| PC-04 | Massa criada pela própria suíte: **Universidade Federal do Ceará / sigla UFC / Campus Quixadá** (CT-002), a mesma instituição em **Campus Fortaleza** (CT-003) e **Uniateneu / Ocara** (CT-007). |
| PC-05 | Apoio da IA (Claude Code) para conferir na API ou no banco, quando o caso pedir, se o que a tela mostra foi mesmo gravado. |
| PC-06 | Se uma ação falhar com “não autorizado” por sessão vencida, sair, entrar de novo e repetir o caso. |

## Resumo da execução

Executar na ordem abaixo. São **12 casos essenciais**, em três seções. Os IDs completos usam o prefixo `CT-HU008-UI-`, numerados de 001 a 012.

### Seção A — Listagem e cadastro

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU008-UI-001 | Acessar a gestão de faculdades | Cadastros → Faculdades | Listagem só de ativas; busca; chave “Mostrar inativos” desligada; botão para cadastrar | ❌ FALHOU | A chave “Mostrar inativos” já vem ligada; a seta de voltar leva ao Painel, não a Cadastros. Listagem, busca e mensagem de lista vazia funcionam. |
| CT-HU008-UI-002 | Cadastrar faculdade | `Universidade Federal do Ceará` / `UFC` / `Campus Quixadá` | Sucesso; na listagem; continua após reabrir o app e existe na API | ❌ FALHOU | Com os dados do caso o app barra o cadastro (lista de exemplo interna) e nada chega à API. Com outro nome o cadastro é gravado, mas a sigla não é salva e o sucesso aparece numa barra preta, fora do padrão de pop-up. |
| CT-HU008-UI-003 | Mesmo nome em outro campus | Mesma instituição em `Campus Fortaleza` | Cadastro aceito | ✅ PASSOU | Cadastro aceito; conferido no banco. A sigla continua sem ser gravada (defeito do CT-002). |
| CT-HU008-UI-004 | Cadastro duplicado | Nome e campus iguais, com variação de maiúsculas e espaços | “Esta faculdade já está cadastrada.”; nada criado | ⏳ PENDENTE | Tentativas 1 a 4 passaram (bloqueio vem da API, `409`). Falta a tentativa 5 (faculdade inativa), que depende do CT-007. |
| CT-HU008-UI-005 | Campos obrigatórios e limites | Campos vazios; nome de 2 letras; textos longos | Campos destacados com mensagem; nada salvo | ❌ FALHOU | Nome, sigla e campus aceitam emoji e símbolos. Relatado: nome de 151 caracteres aceito e uma tentativa sem mensagem no campo (a conferir). |

### Seção B — Edição, inativação e reativação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU008-UI-006 | Editar faculdade | Trocar campus; trocar para nome+campus em uso | Sucesso e listagem atualizada; combinação em uso bloqueada | ❌ FALHOU | Edições de campus gravadas (`PATCH 200`), mas a sigla editada não é salva. Falta executar a edição duplicada (passo 3): não houve `409` no log. |
| CT-HU008-UI-007 | Inativar faculdade | Cancelar e confirmar a inativação | Cancelar não muda nada; confirmar mostra sucesso e tira a faculdade dos ativos | ⏳ PENDENTE | Não executado. |
| CT-HU008-UI-008 | Mostrar inativos e reativar | Ligar a chave; reativar | Inativas identificadas; reativação com sucesso | ⏳ PENDENTE | Não executado. |
| CT-HU008-UI-009 | Sair sem salvar | Alterar o nome em Editar e tocar na seta | Pedir confirmação; nada salvo; ao reabrir, dados salvos | ⏳ PENDENTE | Não executado. |

### Seção C — Integração, acesso e robustez

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU008-UI-010 | Aluno e representante sem acesso | Menus do aluno e do representante; link `faculdades` | Menu não exibido; link mostra Acesso Negado | ⏳ PENDENTE | Não executado. |
| CT-HU008-UI-011 | Faculdades na seleção de cadastro | Faculdade nova ativa e faculdade inativa | Ativa aparece; inativa não aparece (cadastro de aluno e de representante) | ⏳ PENDENTE | Não executado. |
| CT-HU008-UI-012 | Falha de conexão e dados de exemplo | Servidor/Wi-Fi desligado ao listar, cadastrar e inativar | Mensagem de conexão; app não finge sucesso nem mostra dados que não existem | ⏳ PENDENTE | Não executado. |

## Detalhamento dos casos

### Seção A — Listagem e cadastro

#### CT-HU008-UI-001 — Acessar a gestão de faculdades

**Dados de entrada:** Administrador A logado no Painel. Para ver a listagem com dados, executar depois do CT-002 ou cadastrar antes pela API.

**Passos**

1. Tocar na aba **Cadastros** e em **Faculdades**.
2. Conferir os elementos da tela e a posição inicial da chave **Mostrar inativos**.
3. Digitar parte de um nome, de uma sigla e de um campus em **Buscar por nome**; depois um texto inexistente.
4. Tocar na seta de voltar.

**Resultado esperado**

- Abrir a listagem com as **faculdades ativas** (AC-01), a busca, a chave **Mostrar inativos** e o botão de cadastrar.
- A chave **Mostrar inativos** começa **desligada**; inativas só aparecem quando ela é ligada (AC-01, AC-09).
- A busca filtra a lista; sem resultado, aparece uma mensagem de lista vazia.
- Com o banco **sem faculdades**, a listagem fica vazia. Se aparecerem `UFC`, `IFCE` ou `Uniateneu` que não existem no banco, são dados de exemplo do app: registrar como falha.
- A seta volta para **Cadastros**.

**Resultado obtido**

- A listagem abre, a busca filtra a lista e, sem resultado, aparece a mensagem de lista vazia.
- A chave **Mostrar inativos** já vem **ligada** por padrão; o esperado é desligada (AC-01, AC-09). Na tela, `faculdades/index.tsx` inicia o estado com `useState(true)`. É o mesmo defeito da HU-007 ([#246](https://github.com/GOUOCE/GOUCE-app/issues/246)).
- A seta de voltar da listagem leva ao **Painel**, e não a **Cadastros**. Observado também ao abrir **Cadastrar Faculdade** e **Editar**: a seta leva ao Painel, e não à listagem **Faculdades**. É o mesmo defeito da HU-007 ([#245](https://github.com/GOUOCE/GOUCE-app/issues/245)): as telas ficam numa aba oculta e o `router.back()` cai na primeira aba. As setas de **Cadastrar** e **Editar** serão conferidas de novo no CT-002 e no CT-006.
- Status: ❌ Falhou.

---

#### CT-HU008-UI-002 — Cadastrar faculdade

**Dados de entrada:** Nome da instituição `Universidade Federal do Ceará`; sigla `UFC`; campus `Campus Quixadá`.

**Passos**

1. Tocar no botão de cadastrar, preencher os três campos e tocar em **Finalizar cadastro**.
2. Conferir a confirmação e confirmar; anotar a mensagem exibida.
3. Conferir a listagem.
4. **Fechar o app por completo e abrir de novo** (na web, recarregar a página); voltar à listagem.
5. Pedir à IA para conferir na API (`GET /faculdades`) se a faculdade foi gravada com nome, campus e sigla.

**Resultado esperado**

- Pedir confirmação antes de salvar.
- Exibir a confirmação de sucesso e voltar à listagem com a faculdade entre as ativas (AC-02, AC-07). Registrar o texto exato (o requisito pede “Operação realizada com sucesso”).
- Depois de reabrir o app, a faculdade continua na listagem.
- A faculdade existe na API com nome, campus e sigla corretos: o cadastro foi gravado no banco, e não só na tela.

**Resultado obtido**

- **Com os dados do caso** (`Universidade Federal do Ceará` / `UFC` / `Campus Quixadá`): ao confirmar, aparece “Esta faculdade já está cadastrada.” e nada é criado. O banco só tinha a `UFC` / `Campus Quixadá` do seed, e o log da API não registrou nenhum `POST /faculdades`. A causa está em `faculdadeService.ts`: `criarFaculdade` compara os dados com a lista de exemplo interna (`FACULDADES_MOCK`, cujo primeiro item é exatamente esses dados) antes de chamar a API. Defeito já mapeado como risco (nome + campus **ou** sigla + campus).
- **Com outro nome** (`Universidade Mineira` / `Campus Centro`, que não bate com a lista de exemplo): antes de salvar aparece o pop-up “Realizar cadastro?”; depois de confirmar, a API responde `201 Created` e a faculdade é gravada no banco (id 2, ativa, nome e campus corretos).
- **Defeito:** a **sigla não é gravada**. No banco o campo `sigla` da faculdade criada está vazio. `criarFaculdade` envia à API só `nome_faculdade` e `campus_faculdade`, sem a sigla (o `faculdade_dto.py` aceita o campo).
- **Defeito:** o sucesso aparece como uma **barra preta (toast)** com o texto “Faculdade cadastrada com sucesso”, fora do padrão de pop-up de sucesso usado no resto do app (por exemplo, em administradores). O requisito pede “Operação realizada com sucesso”.
- **Defeito:** as telas **Cadastrar Faculdade** e **Editar** não são recriadas. Ao sair sem salvar, ou ao salvar e voltar, a tela reabre com os dados da vez anterior (nome, sigla e campus), sem limpar. Mesmo defeito da HU-007 ([#245](https://github.com/GOUOCE/GOUCE-app/issues/245)).
- Listagem após o cadastro e persistência depois de recarregar a página: ainda não relatadas neste caso.
- Status: ❌ Falhou.

---

#### CT-HU008-UI-003 — Mesmo nome em outro campus

**Dados de entrada:** Nome `Universidade Federal do Ceará`; sigla `UFC`; campus `Campus Fortaleza`.

**Passos**

1. Cadastrar a faculdade com os dados acima.
2. Conferir a listagem: as duas devem aparecer, uma por campus.

**Resultado esperado**

- Cadastro aceito com a mensagem de sucesso: a unicidade vale para a **combinação nome + campus** (AC-02).
- Atenção: o app compara o que foi digitado com uma **lista de exemplo interna** (UFC e IFCE no `Campus Quixadá`). Se o cadastro de `UFC` / `Campus Quixadá` no CT-002 foi barrado com “Esta faculdade já está cadastrada.” mesmo com o banco vazio, registrar como defeito.

**Resultado obtido**

- O cadastro de `Universidade Federal do Ceará` em `Campus Fortaleza` foi aceito e a API respondeu `201 Created`. Conferido no banco: a faculdade existe, ativa, com o nome e o campus digitados (id 4). Como `UFC` / `Campus Fortaleza` não consta na lista de exemplo do app, o bloqueio do CT-002 não ocorreu.
- A unicidade vale para nome + campus: o banco tem `Universidade Federal do Ceará` ativa em dois campi diferentes (`Campus Fortaleza` e `Campus Cratéus`), sem conflito.
- A **sigla** continua vazia no banco, como no CT-002 (defeito já registrado).
- Status: ✅ Passou.

---

#### CT-HU008-UI-004 — Cadastro duplicado

**Dados de entrada:** Cinco tentativas de novo cadastro: `Universidade Federal do Ceará` / `Campus Quixadá` (igual); o mesmo em letras minúsculas; o mesmo em maiúsculas; o mesmo com espaços no início e no fim; a faculdade **inativa** do CT-007 repetida (executar depois do CT-007 ou repetir a ordem).

**Passos**

1. Preencher cada tentativa (sigla qualquer) e finalizar o cadastro.
2. Anotar a mensagem de cada uma.
3. Voltar e conferir que nenhuma faculdade nova apareceu.

**Resultado esperado**

- Bloquear com “Esta faculdade já está cadastrada.” (AC-03, FA-002), sem diferenciar maiúsculas, minúsculas e espaços nas pontas, inclusive quando a existente está inativa.
- Nenhuma faculdade criada.
- Registrar se o bloqueio veio da API ou só da verificação interna do app (a conferência na API é feita no CT-HU008-API-004).

**Resultado obtido**

- Tentativas 1 a 4 feitas sobre a faculdade já gravada `Universidade Federal do Ceará` / `Campus Fortaleza` (id 4), e não sobre `Campus Quixadá`, que cairia na lista de exemplo do app e esconderia o bloqueio da API: igual, minúsculas, maiúsculas e com dois espaços no início e no fim (nome e campus). Nas quatro apareceu “Esta faculdade já está cadastrada.”.
- O bloqueio vem da **API**: o log registrou `POST /faculdades` com `409 Conflict` nas tentativas, e o banco não ganhou nenhuma faculdade com esses dados.
- Fora do roteiro, a diferença de **acento** foi testada: `UFC` / `Campus Quixadá` foi bloqueada com `409`, mas `UFC` / `Campus Quixada` (sem o acento) foi **aceita** e gravada como uma faculdade nova (id 10). A comparação de duplicidade diferencia acentos; o requisito (AC-03) só manda desconsiderar maiúsculas, minúsculas e espaços nas pontas. Decisão de produto pendente: tratar `Quixada` e `Quixadá` como a mesma faculdade ou não.
- Falta a **tentativa 5** (repetir uma faculdade inativa): executar depois do CT-007, com a faculdade inativada pela tela.
- Status: ⏳ Pendente (1 a 4 passaram).

---

#### CT-HU008-UI-005 — Campos obrigatórios e limites

**Dados de entrada:** Tentativas no cadastro: todos os campos vazios; só o nome preenchido; nome de 2 letras (`UF`); sigla de 1 letra; campus de 1 letra; nome com mais de 150 caracteres; só espaços nos campos.

**Passos**

1. Tocar em **Finalizar cadastro** em cada tentativa.
2. Anotar o destaque e a mensagem de cada campo.

**Resultado esperado**

- Campos vazios ou só com espaços ficam destacados com mensagem em português e o cadastro não é enviado (AC-08, FA-003).
- Nome, sigla e campus abaixo do mínimo ou acima do máximo mostram a orientação no próprio campo.
- Nenhuma faculdade criada.

**Resultado obtido**

- **Defeito:** nome, sigla e campus **aceitam emoji e caracteres especiais**. Não há regra de caracteres na tela (`faculdadeSchema.ts` só confere o tamanho) nem na API (`faculdade_dto.py`). É o mesmo defeito da HU-007 ([#251](https://github.com/GOUOCE/GOUCE-app/issues/251)). A regra proposta para a HU-008 está na branch `docs/regra-caracteres-faculdade` (critério 12 e cenários BDD).
- **Relatado pelo testador:** o nome com 151 caracteres foi aceito e uma das tentativas não mostrou mensagem em nenhum campo. **A confirmar:** no banco a faculdade criada (id 9) tem nome de exatamente 150 caracteres, sigla vazia e campus `C  s`; pelo código, 151 caracteres deveriam ser bloqueados com “O nome da instituição deve ter no máximo 150 caracteres” (a tela apara espaços no início e no fim antes de contar). Repetir a tentativa com um texto de 151 caracteres sem espaços nas pontas e anotar qual tentativa ficou sem mensagem.
- Pelo código, os limites da tela e da API **não coincidem**: a tela exige nome de 3 a 150, sigla de 2 a 20 e campus de 2 a 100; a API aceita de 1 a 255 (nome e campus) e até 50 (sigla). Quem chamar a API direto passa por cima da tela.
- Status: ❌ Falhou.

### Seção B — Edição, inativação e reativação

#### CT-HU008-UI-006 — Editar faculdade

**Dados de entrada:** Faculdade `UFC` / `Campus Fortaleza`. Primeira edição: campus `Campus Fortaleza Centro`. Segunda edição: campus `Campus Quixadá` (combinação já existente).

**Passos**

1. Na listagem, tocar no lápis e conferir que os campos vêm preenchidos.
2. Alterar o campus e tocar em **Salvar Alterações**; conferir a mensagem e a listagem.
3. Abrir de novo, trocar o campus para `Campus Quixadá` e salvar.
4. Fechar o app, abrir de novo e conferir a faculdade editada.

**Resultado esperado**

- Primeira edição: mensagem de sucesso e listagem atualizada (AC-04, AC-07). Registrar o texto exato.
- Segunda edição: bloqueada com “Esta faculdade já está cadastrada.” (AC-03); os dados continuam como estavam.
- Depois de reabrir o app, a alteração continua (foi gravada na API).
- A sigla editada também é salva e exibida.

**Resultado obtido**

- Edições feitas na faculdade `Universidade Federal do Ceará` (id 4), e não em `UFC` / `Campus Fortaleza`, que não existe no banco. O log da API registrou `PATCH /faculdades/4` com `200` quatro vezes; a primeira tentativa voltou `401` (sessão vencida, PC-06) e foi repetida depois de entrar de novo. No banco o campus da faculdade 4 ficou `Campus Quixadá`: a alteração foi gravada na API.
- A mensagem de sucesso da edição, pelo código (`editar.tsx`), é “Faculdade alterada com sucesso”, exibida na mesma barra preta (toast) do cadastro, e não “Operação realizada com sucesso”.
- **Defeito:** a **sigla editada não é salva**. `atualizarFaculdade` envia à API só nome e campus, e a coluna `sigla` da faculdade 4 continua vazia. Depois de salvar, a tela mostra a sigla digitada ou, se ela estiver vazia, o nome da instituição, e não o que está no banco. Mesma causa do CT-002.
- **Não verificado:** a edição para uma combinação já existente (passo 3). Não houve nenhum `PATCH` com `409` no log, e a edição do campus da faculdade 4 para `Campus Quixadá` foi aceita porque não existe outra `Universidade Federal do Ceará` nesse campus. A tela não tem checagem própria de duplicidade na edição, então o bloqueio depende da API. Repetir com uma combinação que exista de fato.
- Nenhum registro de auditoria da edição: `log_auditoria` não tem ação de edição de faculdade (mesmo defeito do cadastro e da edição já registrado na suíte de API, CT-HU008-API-009).
- Status: ❌ Falhou (passo 3 pendente).

---

#### CT-HU008-UI-007 — Inativar faculdade

**Dados de entrada:** Faculdade `Uniateneu` / `Ocara` (cadastrar antes, se necessário) e, separadamente, a primeira faculdade cadastrada no banco (`id` 1).

**Passos**

1. Na listagem, tocar na lixeira da `Uniateneu` e ler a confirmação.
2. Tocar em **Cancelar** e conferir que nada mudou.
3. Repetir e tocar em **Inativar**; conferir a mensagem e a listagem de ativas.
4. Pedir à IA para conferir na API (`GET /faculdades?ativo=false`) se a faculdade ficou inativa.
5. Tentar inativar a faculdade de `id` 1 (a `UFC` do CT-002, se for a primeira do banco) e anotar o que aparece.

**Resultado esperado**

- Pedir confirmação; **Cancelar** mantém a faculdade ativa.
- Ao confirmar, mensagem de sucesso e a faculdade sai da lista de ativas (AC-05, AC-07). Registrar o texto exato.
- A faculdade não é apagada: aparece entre as inativas no CT-008 e na API.
- A inativação da faculdade de `id` 1 só pode ser bloqueada se ela **realmente** tiver alunos agendados para datas futuras (AC-06), o que hoje não existe. Se aparecer “Esta instituição possui viagens programadas pendentes…” sem nenhum agendamento, é a regra de exemplo do app: registrar como defeito.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU008-UI-008 — Mostrar inativos e reativar

**Dados de entrada:** Faculdade `Uniateneu` inativa (CT-007).

**Passos**

1. Ligar **Mostrar inativos** e localizar a Uniateneu.
2. Tocar na ação de reativar, ler a confirmação e confirmar.
3. Desligar a chave e conferir a listagem de ativas.
4. Fechar e abrir o app de novo e conferir o status.

**Resultado esperado**

- Com a chave ligada, as inativas aparecem **identificadas como inativas** (AC-09).
- A reativação pede confirmação, exibe a mensagem de sucesso e devolve a faculdade às ativas (AC-05, AC-07).
- O status continua igual depois de reabrir o app (foi gravado na API).
- Se a reativação falhar, o app mostra uma mensagem (não pode falhar em silêncio).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU008-UI-009 — Sair sem salvar

**Dados de entrada:** Faculdade `UFC` / `Campus Quixadá` em **Editar**; nome alterado para `UFC Teste`, sem salvar.

**Passos**

1. Abrir a faculdade em **Editar**, alterar o nome e não salvar.
2. Tocar na seta de voltar.
3. Conferir a listagem e abrir a faculdade de novo.

**Resultado esperado**

- A seta pede confirmação antes de descartar as alterações (padrão cobrado em #156).
- Nada é salvo: a listagem mantém o nome anterior.
- Ao reabrir, os campos mostram os dados salvos, e não o texto digitado antes.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

### Seção C — Integração, acesso e robustez

#### CT-HU008-UI-010 — Aluno e representante sem acesso

**Dados de entrada:** Aluno ativo e representante (PC-03); link direto da tela: na web, `http://localhost:3000/faculdades`; no Expo Go, `exp://<IP do computador>:8081/--/faculdades`.

**Passos**

1. Entrar como aluno e conferir os menus disponíveis.
2. Abrir o link direto da tela de faculdades.
3. Repetir com o representante.

**Resultado esperado**

- O menu de faculdades não aparece para aluno nem para representante (RN-006).
- O link direto mostra **Acesso Negado**, sem exibir a listagem nem por um instante.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU008-UI-011 — Faculdades na seleção de cadastro

**Dados de entrada:** Faculdade ativa `UFC` / `Campus Fortaleza` e faculdade inativa `Uniateneu` / `Ocara`.

**Passos**

1. Como administrador, abrir **Representantes** → cadastrar e abrir a seleção de **Instituição de Ensino**.
2. Procurar as duas faculdades.
3. Sair da conta e, no login, tocar em **Criar conta de aluno**; avançar até a etapa de contato e vínculo e abrir a seleção de **Instituição de Ensino**.
4. Procurar as duas faculdades.

**Resultado esperado**

- As faculdades ativas cadastradas pelo administrador aparecem na seleção de representante e no cadastro de aluno; a inativa **não** aparece (AC-11).
- Se a lista do cadastro de aluno for fixa (`UFC`, `IFCE`, `UNILAB`, `Estácio`, `Outra`) e não refletir o que o administrador cadastrou, registrar como falha e relacionar à #192.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU008-UI-012 — Falha de conexão e dados de exemplo

**Dados de entrada:** Três situações com a API indisponível (parar o backend ou desligar Wi-Fi e dados): abrir a listagem; cadastrar `Faculdade Offline` / `Campus Teste`; inativar uma faculdade.

**Passos**

1. Com a API fora do ar, abrir a listagem de faculdades.
2. Tentar cadastrar `Faculdade Offline` e finalizar.
3. Tentar inativar uma faculdade da lista.
4. Religar a API, abrir a listagem de novo e conferir se `Faculdade Offline` existe.

**Resultado esperado**

- Mensagem clara de falha de conexão, em português, sem travar o app.
- O app **não mostra sucesso** nem altera a listagem quando a API não gravou, e **não exibe faculdades de exemplo** que não existem no banco.
- No cadastro, os campos continuam preenchidos para nova tentativa.
- Depois que a API volta, só existe o que foi realmente gravado.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 — listagem de ativas | Administrador visualiza as faculdades ativas | CT-001 |
| AC-02 — cadastro e outro campus | Cadastra nova faculdade; mesmo nome em outro campus | CT-002, CT-003 |
| AC-03 / FA-002 — duplicidade | Bloqueia cadastro e edição duplicados | CT-004, CT-006 |
| AC-04 — edição | Edita dados | CT-006 |
| AC-05 — inativar e reativar | Inativa; reativa | CT-007, CT-008 |
| AC-06 / FA-001 — agendamentos futuros | Bloqueia inativação | Não coberto na UI nesta rodada (depende da HU-013); ver CT-HU008-API-012 e CT-007 |
| AC-07 — mensagem de sucesso | Cenários de sucesso | CT-002, 006, 007, 008 |
| AC-08 / FA-003 — obrigatórios | Campo obrigatório no cadastro e na edição | CT-005, CT-006 |
| AC-09 — Mostrar inativos | Visualiza inativas | CT-001, CT-008 |
| AC-10 — auditoria | Log de auditoria | Conferido na API (CT-HU008-API-009) |
| AC-11 — inativas fora da seleção | Faculdade inativa fora do cadastro de aluno | CT-011 |
| RN-006 — exclusividade administrativa | Menu não exibido para outros perfis | CT-010 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-001, CT-002 | Telas de faculdades não recriadas: a seta volta ao Painel (listagem, Cadastrar e Editar) e Cadastrar/Editar reabrem com os dados da vez anterior | [#245](https://github.com/GOUOCE/GOUCE-app/issues/245) cobre bairros e sugere corrigir também faculdades; issue própria a abrir ao final da suíte |
| CT-005 | Nome, sigla e campus aceitam emoji e caracteres especiais (sem regra na tela nem na API) | [#251](https://github.com/GOUOCE/GOUCE-app/issues/251) é de bairros; issue própria a abrir ao final da suíte |
| CT-005 | Limites de tamanho: relatado 151 caracteres aceito e tentativa sem mensagem (a confirmar); limites da API diferentes dos da tela | Issue própria a abrir ao final da suíte, depois de confirmar |
| CT-002 | Cadastro com `Universidade Federal do Ceará` / `UFC` / `Campus Quixadá` é barrado pela lista de exemplo do app, sem chamar a API | Issue própria a abrir ao final da suíte |
| CT-002 | A sigla não é enviada à API nem gravada no banco | Issue própria a abrir ao final da suíte |
| CT-006 | A sigla editada não é salva nem exibida a partir do banco | Mesma causa do CT-002; issue própria a abrir ao final da suíte |
| CT-002 | Mensagem de sucesso é uma barra preta, fora do padrão de pop-up, e o texto difere do requisito | Issue própria a abrir ao final da suíte |
| CT-001 | Chave “Mostrar inativos” já vem ligada na listagem de faculdades | [#246](https://github.com/GOUOCE/GOUCE-app/issues/246) é de bairros; issue própria a abrir ao final da suíte |

## Observações gerais

- Referências: [HU-008, seção 7.3.2](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-02/HU-008.feature), [telas de faculdades](../../../../../frontend/src/app/%28administrador%29/faculdades/) e [suíte de API](../api/API-HU-008.md).
- **Riscos mapeados no código**, que orientaram a escolha dos casos:
  - `frontend/src/services/faculdadeService.ts` mantém uma **lista de exemplo** (`UFC`, `IFCE`, `Uniateneu`, todas com `id` 1 a 3) e a usa em três lugares: quando a API falha, a listagem mostra os dados de exemplo; o cadastro confere duplicidade contra a lista de exemplo **antes** de chamar a API; a inativação do `id` 1 é barrada pela regra de exemplo (“viagens programadas pendentes”) (CT-001, 003, 004, 007, 012);
  - sem resposta do servidor, cadastro, edição, inativação e reativação **alteram só a lista de exemplo e parecem ter dado certo** (CT-012);
  - a chave **Mostrar inativos** começa ligada, e a edição devolve `ativo: true` ao app mesmo que a faculdade esteja inativa (CT-001, 006);
  - as mensagens de sucesso são “Faculdade cadastrada com sucesso” etc., e não “Operação realizada com sucesso” (CT-002);
  - a lista de instituições do cadastro de aluno é fixa no app (#192) (CT-011).
- O bloqueio por agendamentos futuros (AC-06) depende da HU-013 e fica para quando a agenda estiver na develop.
- Ocultar senhas e dados pessoais nas evidências.
