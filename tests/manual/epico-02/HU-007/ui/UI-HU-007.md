# Testes manuais de UI — HU-007 — Gerenciamento de Bairros e Pontos de Parada

## Identificação da suíte

| Campo           | Valor |
| --------------- | ----- |
| Módulo          | Gestão de Cadastros Base (EP-002) |
| Funcionalidade  | HU-007 — Gerenciamento de Bairros e Pontos de Parada |
| Camada          | UI |
| Tipo de teste   | Funcional manual — suíte essencial (baseada em risco) |
| Tela            | Painel do administrador → aba **Cadastros** → **Bairros e pontos de parada** (listagem **Bairros e Pontos**, **Novo Bairro** e **Editar Bairro**) |
| Ambiente        | Desenvolvimento — app no celular (Expo Go) ou versão web (`http://localhost:3000`) |
| Total de casos  | 13 |
| Última execução | 2026-10-26 (em andamento) |
| Testador        | Cauan Ricardo |

## Resultado geral

| Situação        | Total | ✅ Passaram | ❌ Falharam | 🚫 Bloqueados | ⏳ Pendentes |
| --------------- | ----: | ----------: | ----------: | ------------: | -----------: |
| ⏳ Em execução | 13 | 4 | 6 | 0 | 3 |

## Pré-condições

| ID    | Descrição |
| ----- | --------- |
| PC-01 | Aplicativo aberto com a API e o banco disponíveis. |
| PC-02 | **Administrador A** logado: aba **Cadastros** → **Bairros e pontos de parada**. |
| PC-03 | Credenciais de um **aluno ativo** e de um **representante**, para o CT-011. |
| PC-04 | Massa criada pela própria suíte: **Campo Velho** (CT-002), **Centro** (CT-002) e **Planalto Universitário** (CT-003). Se algum nome já existir no banco de desenvolvimento, acrescentar um sufixo (ex.: `Campo Velho QA`) e usar o mesmo nome em todos os casos. |
| PC-05 | Apoio da IA (Claude Code) para conferir na API ou no banco, quando o caso pedir, se o que a tela mostra foi mesmo gravado. |
| PC-06 | Se uma ação falhar com “não autorizado” por sessão vencida, sair, entrar de novo e repetir o caso. |

## Resumo da execução

Executar na ordem abaixo. São **13 casos essenciais**, em três seções. Os IDs completos usam o prefixo `CT-HU007-UI-`, numerados de 001 a 013.

### Seção A — Listagem e cadastro

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU007-UI-001 | Acessar a gestão de bairros | Cadastros → Bairros e pontos de parada | Listagem só de ativos com seus pontos; busca; chave “Mostrar inativos” desligada; botão Novo | ❌ FALHOU | A chave “Mostrar inativos” já vem ligada; a seta de voltar leva ao Painel, não a Cadastros. Busca por nome funciona. |
| CT-HU007-UI-002 | Cadastrar bairro com pontos de parada | `Campo Velho` + 1 ponto; `Centro` + 3 pontos | “Operação realizada com sucesso”; bairro na listagem; dado continua após reabrir o app e existe na API | ❌ FALHOU | Gravou certo na API, mas o formulário de Novo Bairro e o modal de ponto não limpam os campos depois de salvar. |
| CT-HU007-UI-003 | Mesmo nome de ponto em outro bairro | `Planalto Universitário` + `Posto de Saúde` | Cadastro aceito | ❌ FALHOU | Bloqueado com “Esta localidade já está cadastrada.” (API devolve 409). Mesma causa da #210. |
| CT-HU007-UI-004 | Cadastro duplicado | `Centro`, `centro`, `CENTRO`, `" Centro "`; ponto repetido no formulário | “Esta localidade já está cadastrada.”; nada criado | ✅ PASSOU | Variações de maiúsculas e espaços bloqueadas com a mensagem correta. Observações: nome sem acento (`RODOVIARIA`) é aceito como ponto diferente; modal do ponto com rótulo e placeholder repetidos. |
| CT-HU007-UI-005 | Campos obrigatórios, limites e caracteres | Nome vazio; sem ponto; nome `Ab`; ponto com 1 letra; número, emoji e símbolos no bairro e no ponto | Campos destacados com mensagem; nada salvo | ❌ FALHOU | Tamanho mínimo e obrigatórios funcionam; número, emoji e símbolos são aceitos no bairro e no ponto (sem regra de caracteres, AC-12). |

### Seção B — Edição, inativação e reativação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU007-UI-006 | Editar bairro | Renomear `Campo Velho` e adicionar ponto; renomear para `Centro` | Sucesso e listagem atualizada; nome em uso bloqueado | ✅ PASSOU | Edição gravada na API; nome em uso bloqueado. |
| CT-HU007-UI-007 | Inativar ponto e último ponto | Retirar `Mercado Público` do Centro; retirar o único ponto de outro bairro | Ponto vira inativo (não some); último ponto bloqueado | ❌ FALHOU | A lixeira do ponto o apaga do banco: não aparece em “Mostrar inativos” e pode ser cadastrado de novo. Último ponto bloqueado corretamente. Mesma causa da #211. |
| CT-HU007-UI-008 | Inativar bairro | Cancelar e depois confirmar a inativação do `Campo Velho II` | Cancelar não muda nada; confirmar mostra sucesso e tira o bairro dos ativos | ✅ PASSOU | Inativação confirmada, gravada e auditada; mensagem de sucesso só em toast preto; pontos do bairro inativo seguem ativos no banco. |
| CT-HU007-UI-009 | Mostrar inativos e reativar | Ligar a chave; reativar `Campo Velho II` | Inativos identificados; reativação com sucesso | ✅ PASSOU | Reativação gravada, auditada e mantida após recarregar. Erro de reativação só vai ao console (risco do código). |
| CT-HU007-UI-010 | Sair sem salvar | Alterar nome em Editar Bairro e tocar na seta | Pedir confirmação; nada salvo; ao reabrir, dados salvos | ❌ FALHOU | A seta volta sem pedir confirmação e, ao reabrir, a tela mostra o texto digitado e não salvo (não recarrega do banco). Nada é gravado. |

### Seção C — Integração, acesso e robustez

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU007-UI-011 | Aluno e representante sem acesso | Menu do aluno e do representante; link `bairros` | Menu não exibido; link mostra Acesso Negado | ⏳ PENDENTE | Não executado. |
| CT-HU007-UI-012 | Bairros no cadastro de aluno | Bairro novo e bairro inativo na etapa 3 do cadastro | Bairro ativo novo aparece; bairro inativo não aparece | ⏳ PENDENTE | Não executado. |
| CT-HU007-UI-013 | Falha de conexão ao salvar | Wi-Fi e dados desligados ao cadastrar e ao inativar | Mensagem de conexão; nada “salvo” só na tela; dados mantidos para nova tentativa | ⏳ PENDENTE | Não executado. |

## Detalhamento dos casos

### Seção A — Listagem e cadastro

#### CT-HU007-UI-001 — Acessar a gestão de bairros

**Dados de entrada:** Administrador A logado no Painel.

**Passos**

1. Tocar na aba **Cadastros** e em **Bairros e pontos de parada**.
2. Conferir os elementos da tela e a posição inicial da chave **Mostrar inativos**.
3. Digitar parte do nome de um bairro em **Buscar por bairro** e depois um nome que não existe.
4. Tocar na seta de voltar.

**Resultado esperado**

- Abrir a listagem com os **bairros ativos e seus pontos de parada ativos** (AC-01), o campo de busca, a chave **Mostrar inativos** e o botão **Novo**.
- A chave **Mostrar inativos** começa **desligada**: inativos só aparecem quando ela é ligada (AC-01, AC-09).
- A busca filtra pelo nome; sem resultado, aparece uma mensagem de lista vazia.
- A seta volta para **Cadastros**.
- Registrar se a listagem mostra os nomes dos pontos ou só a quantidade.

**Resultado obtido**

- A listagem abre e a busca por nome filtra corretamente.
- A chave **Mostrar inativos** já vem **ligada** por padrão; o esperado é desligada (AC-01, AC-09).
- A seta de voltar leva ao **Painel**, e não a **Cadastros**. O mesmo ocorre na tela **Novo Bairro**: a seta leva ao Painel, e não à listagem **Bairros e Pontos**.
- A listagem mostra o nome do bairro e só a **quantidade** de pontos (o `Centro` aparece com 0 pontos, igual ao banco), e não os nomes dos pontos.
- Busca por um nome que não existe: aparece a mensagem de lista vazia.
- Status: ❌ Falhou.

---

#### CT-HU007-UI-002 — Cadastrar bairro com pontos de parada

**Dados de entrada:** Bairro `Campo Velho` com o ponto `Escola Coronel Virgílio Távora`. Bairro `Centro` com os pontos `Praça José de Barros`, `Mercado Público` e `Posto de Saúde`.

**Passos**

1. Tocar em **Novo**, preencher **Nome do Bairro** e tocar em **Adicionar ponto de parada**; no modal, preencher **Nome do Ponto** e confirmar.
2. Tocar em **Finalizar cadastro** e conferir a confirmação; confirmar.
3. Anotar a mensagem exibida e conferir a listagem.
4. Repetir para o Centro (três pontos).
5. **Fechar o app por completo e abrir de novo** (na web, recarregar a página); voltar à listagem.
6. Pedir à IA para conferir na API (`GET /bairros`) se os dois bairros foram gravados com os pontos.

**Resultado esperado**

- Pedir confirmação antes de salvar, com um texto coerente (o cadastro pode ser editado e inativado depois).
- Exibir a confirmação de sucesso e voltar à listagem com o bairro entre os ativos (AC-02, AC-07). Registrar o texto exato (o requisito pede “Operação realizada com sucesso”).
- Depois de reabrir o app, os bairros continuam na listagem.
- Os bairros e seus pontos existem na API: o cadastro foi gravado no banco, e não só na tela.

**Resultado obtido**

- Usados `Campo Velho QA` (1 ponto) e `Centro QA` (3 pontos), pois o `Centro` já existia por seed da migration (PC-04).
- Antes de salvar aparece o pop-up “Realizar cadastro?” com o texto “Essa ação não poderá ser desfeita.”. Depois de confirmar, o sucesso aparece só como uma **barra preta (toast) na parte de baixo da tela**, com o texto “Bairro cadastrado com sucesso” e um X para fechar; não há pop-up de sucesso. A tela volta para a listagem em cerca de 1,2 segundo, então a mensagem some rápido. O bairro entra na listagem e continua depois de recarregar a página.
- Conferido na API (`GET /bairros`) e no banco: `Campo Velho QA` (id 2) com 1 ponto e `Centro QA` (id 3) com 3 pontos, todos ativos e com os nomes exatos digitados.
- **Defeito:** ao tocar em **Novo** de novo depois de cadastrar (ou de confirmar/voltar no meio do cadastro), a tela continua com o nome do bairro e os pontos do cadastro anterior, sem limpar. O mesmo ocorre no modal **Novo ponto de parada**, que mantém o nome digitado antes.
- **Defeito:** o pop-up de erro “Esta localidade já está cadastrada.” aparece **por baixo** da tela de cadastro (e, no modal de ponto, por baixo do modal). Só fica visível depois de fechar o modal do ponto.
- **Defeito:** a tela de Novo Bairro já abre com o ponto `Praça da Matriz` preenchido (sobra de dado de exemplo: `cadastrar.tsx` inicia o estado e o `defaultValues` com esse nome). Se o administrador não remover, o ponto é gravado sem ter sido digitado por ele. Como a tela não é recriada, às vezes ele aparece e às vezes não.
- Campos vazios e limites (CT-005) ainda não foram testados.
- Status: ❌ Falhou.

---

#### CT-HU007-UI-003 — Mesmo nome de ponto em outro bairro

**Dados de entrada:** Bairro `Planalto Universitário` com o ponto `Posto de Saúde` (nome já usado no Centro).

**Passos**

1. Tocar em **Novo**, preencher o bairro e o ponto e finalizar o cadastro.
2. Conferir a listagem e abrir o Centro em **Editar** para ver se o ponto dele continua igual.

**Resultado esperado**

- Cadastro aceito com a mensagem de sucesso: o nome do ponto só precisa ser único **dentro do mesmo bairro** (AC-02).
- O ponto `Posto de Saúde` do Centro não muda.

**Resultado obtido**

- O cadastro de `Planalto Universitário` com o ponto `Posto de Saúde` foi **bloqueado** com o pop-up “Esta localidade já está cadastrada.”; o bairro não foi criado (conferido no banco). A API respondeu 409.
- Contraria o requisito e o BDD (AC-02): o nome do ponto só precisa ser único **dentro do mesmo bairro**. A tela só compara os pontos do próprio formulário; o bloqueio vem do backend (`bairro_repository.py`, `ponto_existe_no_sistema`), que procura o nome em **todos** os bairros. É o defeito já aberto na **#210** (CT-HU007-API-003).
- O ponto `Posto de Saúde` do `Centro QA` não foi alterado.
- Status: ❌ Falhou.

---

#### CT-HU007-UI-004 — Cadastro duplicado

**Dados de entrada:**

1. Novo bairro com o nome `Centro`, depois `centro`, `CENTRO` e `" Centro "` (com espaços), sempre com o ponto `Rodoviária`.
2. Novo bairro `Bairro Novo`: adicionar o ponto `Rodoviária` e depois `rodoviária` no mesmo formulário.

**Passos**

1. Preencher cada tentativa e finalizar o cadastro.
2. Anotar a mensagem de cada uma.
3. Voltar e conferir que nenhum bairro novo apareceu.

**Resultado esperado**

- Bloquear com “Esta localidade já está cadastrada.” (AC-03, FA-002), sem diferenciar maiúsculas, minúsculas e espaços nas pontas.
- No item 2, o segundo ponto não é adicionado e a mesma mensagem aparece.
- Nenhum bairro criado.

**Resultado obtido**

- Os nomes de bairro `Centro` com maiúsculas, minúsculas e espaços nas pontas foram bloqueados com “Esta localidade já está cadastrada.”, e nenhum bairro foi criado.
- No formulário de `Bairro Novo`, o segundo ponto `rodoviária` (mesmo nome do `Rodoviária`, só em minúsculas) foi bloqueado com a mesma mensagem.
- **Observação (decisão de produto):** `RODOVIARIA` (maiúsculas e **sem acento**) foi aceito no mesmo formulário ao lado de `Rodoviária`. O requisito só desconsidera maiúsculas, minúsculas e espaços nas pontas (AC-03); acento não está coberto, então o app seguiu o texto do requisito. Levar ao #207 para decidir se `Rodoviária` e `Rodoviaria` contam como o mesmo nome.
- **Defeito de interface (não bloqueante):** ao abrir **Novo ponto de parada**, o campo mostra o rótulo “Nome do Ponto *” e, ao mesmo tempo, o texto de ajuda “Nome do ponto de parada”, repetindo a informação.
- **Defeito (regra de caracteres):** o nome do bairro aceita números, emoji e caracteres especiais. Não existe regra para isso nos requisitos nem no código (`bairroSchema.ts` só valida tamanho). Regra proposta no CT-005.
- Status: ✅ Passou.

---

#### CT-HU007-UI-005 — Campos obrigatórios e limites

**Dados de entrada:** Tentativas em **Novo**: nome vazio com um ponto; nome `Bairro Teste` sem ponto; nome `Ab` com um ponto; nomes de bairro `Centro 2`, `Centro 😀` e `Centro @#$%`; no modal de ponto, os nomes `A`, `Escola 😀` e `Posto @#$%`, e depois `Parada 12` (aceito).

**Passos**

1. Preencher a tentativa e tocar em **Finalizar cadastro** (ou confirmar o modal, no último item).
2. Anotar o que aparece em cada campo.

**Resultado esperado**

- Nome vazio e sem ponto: os campos ficam destacados com mensagem em português e o cadastro não é enviado (AC-08, FA-003).
- Nome `Ab`: alerta de tamanho mínimo no campo.
- Ponto `A`: o modal não aceita e mostra a orientação no campo.
- Bairro com número, emoji ou símbolo: bloqueado com “Use apenas letras, espaços, hífen ou apóstrofo” (AC-12).
- Ponto com emoji ou símbolo: bloqueado com “Use apenas letras, números, espaços, hífen, apóstrofo ou ponto”; `Parada 12` é aceito (AC-12).
- Nenhum bairro criado.

**Resultado obtido**

- Nome do bairro vazio: o campo é destacado com “Informe o nome do bairro com pelo menos 3 caracteres” e nada é enviado.
- Ponto de parada com menos de 2 caracteres: o modal bloqueia com “Informe um nome válido com pelo menos 2 caracteres.”.
- Os limites mínimos (3 no bairro, 2 no ponto) e a obrigatoriedade funcionam como esperado.
- **Defeito:** o app aceita **emoji, números e caracteres especiais** no nome do bairro e no nome do ponto. Não há bloqueio nem mensagem (esperado no AC-12: números, emoji e símbolos bloqueados no bairro; emoji e símbolos bloqueados no ponto).
- Por leitura do código, a API também não valida caracteres (`BairroCreateDTO` só limita o tamanho máximo a 100 e não há mínimo de 3), então o mesmo dado passaria direto pela API.
- Status: ❌ Falhou.

### Seção B — Edição, inativação e reativação

#### CT-HU007-UI-006 — Editar bairro

**Dados de entrada:** Bairro `Campo Velho`. Primeira edição: nome `Campo Velho II` e novo ponto `Posto de Saúde`. Segunda edição: nome `Centro`.

**Passos**

1. Na listagem, tocar no lápis do Campo Velho e conferir que os campos vêm preenchidos.
2. Alterar o nome, adicionar o ponto e tocar em **Salvar alterações**; conferir a mensagem e a listagem.
3. Abrir de novo, trocar o nome para `Centro` e salvar.

**Resultado esperado**

- Primeira edição: mensagem de sucesso e listagem com `Campo Velho II` e os dois pontos (AC-04, AC-07). Registrar o texto exato.
- Segunda edição: bloqueada com “Esta localidade já está cadastrada.”; o nome continua `Campo Velho II` (AC-03).

**Resultado obtido**

- Os campos vêm preenchidos ao abrir o lápis. A primeira edição foi salva com sucesso: o bairro passou a se chamar `Campo Velho QA II` e ganhou o ponto `Praça chalé`; o ponto original `Escola Coronel Virgílio Távora` continua ativo. Conferido no banco (bairro 2, pontos 1 e 9).
- A mensagem de sucesso é “Bairro alterado com sucesso”, exibida na barra preta (toast) embaixo, e a tela volta para a listagem (`editar.tsx`).
- A tentativa de usar um nome já cadastrado foi bloqueada com “Esta localidade já está cadastrada.” e o nome não mudou; o log da API mostra o `PATCH /bairros/2` com 409 antes do 200.
- Não há registro de auditoria da edição (já coberto pela #212).
- Status: ✅ Passou.

---

#### CT-HU007-UI-007 — Inativar ponto e último ponto

**Dados de entrada:** Bairro `Centro` (três pontos); bairro `Planalto Universitário` (um ponto).

**Passos**

1. Abrir o Centro em **Editar**, inativar ou retirar o ponto `Mercado Público` e salvar.
2. Ligar **Mostrar inativos** na listagem e localizar o ponto.
3. Abrir o Centro de novo e tentar adicionar outra vez o ponto `Mercado Público`.
4. Abrir o Planalto Universitário, retirar o único ponto e salvar.

**Resultado esperado**

- O ponto `Mercado Público` fica **inativo**, e não apagado: com **Mostrar inativos** ligado, ele aparece identificado como inativo (AC-04, AC-05, AC-09). O Centro continua ativo com os outros dois pontos.
- Readicionar `Mercado Público` no Centro: bloqueado com “Esta localidade já está cadastrada.” (o ponto inativo conta, AC-03), ou o app oferece reativá-lo. Registrar o comportamento.
- Retirar o último ponto: o campo de pontos fica destacado e o salvamento é bloqueado (AC-08).

**Resultado obtido**

- Retirar `Mercado Público` do `Centro QA` e salvar funciona (“Bairro alterado com sucesso”, em toast preto, sem pop-up).
- **Defeito:** o ponto retirado **não fica inativo, é apagado**. Com **Mostrar inativos** ligado, ele não aparece em lugar nenhum. No banco, o `Mercado Público` original (id 3) deixou de existir.
- **Defeito:** como foi apagado, foi possível adicionar `Mercado Público` de novo ao mesmo bairro, sem bloqueio nem oferta de reativar (esperado: bloqueio ou reativação, AC-03). No banco, o ponto voltou como um registro novo (id 10).
- Causa no código: a tela só tira o ponto da lista (a lixeira não inativa) e a API, ao receber a lista de pontos, remove do bairro os que não vieram (`bairro_repository.py`, bloco “Remover pontos que não foram mantidos”). É a **#211** (CT-HU007-API-002).
- Retirar o único ponto de um bairro é **bloqueado** como esperado (AC-08).
- Status: ❌ Falhou.

---

#### CT-HU007-UI-008 — Inativar bairro

**Dados de entrada:** Bairro `Campo Velho II` ativo.

**Passos**

1. Na listagem, tocar na lixeira do Campo Velho II e ler a confirmação.
2. Tocar em **Cancelar** e conferir que nada mudou.
3. Repetir e tocar em **Inativar**.
4. Conferir a mensagem e a listagem de ativos.

**Resultado esperado**

- Pedir confirmação; **Cancelar** mantém o bairro ativo.
- Ao confirmar, exibir a mensagem de sucesso e tirar o bairro da lista de ativos (AC-05, AC-07). Registrar o texto exato.
- O bairro não é apagado: aparece entre os inativos no CT-009.

**Resultado obtido**

- A lixeira abre o pop-up “Inativar bairro?” com “O bairro e seus pontos ficarão inativos no sistema.”. **Cancelar** não muda nada (nenhuma chamada à API).
- Ao confirmar, o bairro sai da lista de ativos e a mensagem de sucesso aparece só como **barra preta (toast) embaixo da tela**, sem pop-up. Texto no código: “Bairro <nome> inativado”, e não “Operação realizada com sucesso” (AC-07).
- O bairro não é apagado: `Campo Velho QA II` e `Planalto Universitário QA` estão com `ativo = false` no banco e aparecem no título **Inativos** quando a chave está ligada.
- O log de auditoria registrou as duas inativações (`INATIVAR`, bairro 2 e 7, usuário 1).
- **Observação (formato da mensagem):** o app mistura dois padrões de sucesso. Cadastros de administrador, perfil do aluno e fluxos de autenticação usam pop-up de sucesso; bairros, faculdades, motoristas e representantes usam o toast preto. A decisão sobre o padrão é do time de Front.
- **Observação (pontos):** o pop-up promete que “seus pontos ficarão inativos”, mas no banco os pontos do bairro inativo continuam com `ativo = true`. Conferir na API se eles ficam indisponíveis para uso (requisitos, AC-05).
- Status: ✅ Passou.

---

#### CT-HU007-UI-009 — Mostrar inativos e reativar

**Dados de entrada:** Bairro `Campo Velho II` inativo (CT-008).

**Passos**

1. Ligar **Mostrar inativos** e localizar o Campo Velho II.
2. Tocar na ação de reativar (seta circular), ler a confirmação e confirmar.
3. Desligar a chave e conferir a listagem de ativos.
4. Fechar e abrir o app de novo e conferir o status.

**Resultado esperado**

- Com a chave ligada, bairros e pontos inativos aparecem **identificados como inativos** (AC-09).
- A reativação pede confirmação, exibe a mensagem de sucesso e devolve o bairro aos ativos (AC-05, AC-07).
- Se a reativação falhar, o app mostra uma mensagem (não pode falhar em silêncio).
- O status continua igual depois de reabrir o app.

**Resultado obtido**

- Com a chave ligada, os bairros inativos aparecem sob o título **Inativos**. A reativação pede confirmação (“Reativar bairro?”), mostra o toast “Bairro <nome> reativado” e devolve o bairro à lista de ativos.
- Depois de recarregar a página o status continua igual. No banco, `Campo Velho QA II` está com `ativo = true` e `Planalto Universitário QA` segue inativo.
- O log de auditoria registrou a reativação (`ATIVAR`, bairro 2, inativo → ativo).
- **Risco no código (não reproduzido):** se a reativação falhar, o erro só vai para o `console.error` e o usuário não vê mensagem (`index.tsx`, `handleReativar`), ao contrário da inativação, que mostra pop-up de erro.
- A chave **Mostrar inativos** só traz bairros; como não existe inativação de ponto na tela (CT-007), não há ponto inativo para mostrar.
- Status: ✅ Passou.

---

#### CT-HU007-UI-010 — Sair sem salvar

**Dados de entrada:** Bairro `Centro` em **Editar Bairro**; nome alterado para `Centro Teste`, sem salvar.

**Passos**

1. Abrir o Centro em **Editar**, alterar o nome e não salvar.
2. Tocar na seta de voltar.
3. Conferir a listagem e abrir o Centro de novo.

**Resultado esperado**

- A seta pede confirmação antes de descartar as alterações (mesmo padrão cobrado em #156).
- Nada é salvo: a listagem mantém `Centro`.
- Ao reabrir, os campos mostram os dados salvos, e não o texto digitado antes.

**Resultado obtido**

- **Defeito:** a seta de voltar não pede confirmação antes de descartar as alterações (`editar.tsx` só chama `router.back()`; não há aviso de alterações não salvas).
- **Defeito:** ao abrir o mesmo bairro de novo, o formulário mostra o nome e os pontos digitados antes, sem salvar, em vez dos dados gravados. A tela não é recriada e só recarrega os dados quando o `id` muda (`useEffect` com `[id]`), então a edição antiga continua na tela. Mesma causa do formulário de cadastro que não limpa (CT-002) e da seta que leva ao Painel (CT-001).
- Nada é gravado: o banco continua com `Centro QA` e seus três pontos, e o log da API não mostra nenhum `PATCH` desse bairro. O que engana é só a tela.
- Status: ❌ Falhou.

### Seção C — Integração, acesso e robustez

#### CT-HU007-UI-011 — Aluno e representante sem acesso

**Dados de entrada:** Aluno ativo e representante (PC-03); link direto da tela: na web, `http://localhost:3000/bairros`; no Expo Go, `exp://<IP do computador>:8081/--/bairros`.

**Passos**

1. Entrar como aluno e conferir os menus disponíveis.
2. Abrir o link direto da tela de bairros.
3. Repetir com o representante.

**Resultado esperado**

- O menu de bairros não aparece para aluno nem para representante (RN-006).
- O link direto mostra **Acesso Negado**, sem exibir a listagem nem por um instante.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU007-UI-012 — Bairros no cadastro de aluno

**Dados de entrada:** Bairro ativo `Planalto Universitário` (CT-003); bairro inativo `Campo Velho II` (inativar de novo, se foi reativado no CT-009).

**Passos**

1. Sair da conta (ou fechar o app) e, no login, tocar em **Criar conta de aluno**.
2. Avançar até a etapa de contato e vínculo e abrir a seleção de **Bairro**.
3. Procurar os dois bairros na lista.
4. Ao final, reativar o Campo Velho II.

**Resultado esperado**

- A lista de bairros vem do cadastro feito pelo administrador: `Planalto Universitário` aparece (AC-11).
- `Campo Velho II`, inativo, não aparece (AC-11).
- Se a lista for fixa no app (não reflete o cadastro), registrar como falha e relacionar à #192.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU007-UI-013 — Falha de conexão ao salvar

**Dados de entrada:** Duas tentativas com Wi-Fi e dados móveis desligados: cadastrar o bairro `Serra do Estêvão` com o ponto `Igreja Matriz`; inativar o `Planalto Universitário`.

**Passos**

1. Preencher o cadastro, desligar a conexão e finalizar.
2. Anotar a mensagem e conferir a listagem.
3. Religar a conexão, fechar e abrir o app e conferir a listagem de novo.
4. Repetir a ideia com a inativação.

**Resultado esperado**

- Mensagem clara de falha de conexão, em português, sem travar o app.
- O app **não mostra sucesso** nem coloca o bairro na listagem enquanto não houver gravação na API.
- No cadastro, os campos continuam preenchidos para nova tentativa.
- Na inativação, o bairro continua ativo.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 — listagem de ativos com pontos | Administrador visualiza os bairros ativos | CT-001 |
| AC-02 — cadastro e ponto repetido em outro bairro | Cadastra novo bairro; ponto com nome usado em outro bairro | CT-002, CT-003 |
| AC-03 / FA-002 — duplicidade | Bloqueia bairro duplicado; ponto duplicado no bairro; edição duplicada | CT-004, CT-006, CT-007 |
| AC-04 — edição | Edita nome e pontos | CT-006, CT-007 |
| AC-05 — inativar e reativar | Inativa bairro; inativa ponto; reativa | CT-007, CT-008, CT-009 |
| AC-06 / FA-001 — rota ativa | Bloqueia inativação vinculada a rota ativa | Não coberto na UI nesta rodada (depende da HU-011); ver CT-HU007-API-012 |
| AC-07 — mensagem de sucesso | Todos os cenários de sucesso | CT-002, 006, 008, 009 |
| AC-08 / FA-003 — obrigatórios | Campo obrigatório; bairro sem ponto ativo | CT-005, CT-007 |
| AC-12 — caracteres permitidos (proposto) | Bloqueia número, emoji e símbolos no bairro e no ponto | CT-004, CT-005 |
| AC-09 — Mostrar inativos | Visualiza inativos | CT-001, CT-007, CT-009 |
| AC-10 — auditoria | Log de auditoria | Conferido na API (CT-HU007-API-009) |
| AC-11 — inativos fora da seleção | Bairro inativo fora do cadastro de aluno | CT-012 |
| RN-006 — exclusividade administrativa | Menu não exibido para outros perfis | CT-011 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Referências: [HU-007, seção 7.3.1](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-02/HU-007.feature), [telas de bairros](../../../../../frontend/src/app/%28administrador%29/bairros/) e [suíte de API](../api/API-HU-007.md).
- **Riscos mapeados no código**, que orientaram a escolha dos casos:
  - `frontend/src/services/bairroService.ts` **não chama a API**: lista, cadastro, edição e inativação usam dados de exemplo em memória. O CT-002 confere a gravação reabrindo o app e consultando a API;
  - a chave **Mostrar inativos** começa ligada e a listagem mostra só a quantidade de pontos (CT-001);
  - as mensagens de sucesso são “Bairro cadastrado com sucesso”, “Bairro alterado com sucesso” etc., e não “Operação realizada com sucesso” (CT-002, 006, 008);
  - a confirmação do cadastro diz “Essa ação não poderá ser desfeita.”, o que não é verdade para um cadastro editável (CT-002);
  - na edição, a lixeira do ponto só o retira da lista; não há inativação nem reativação de ponto individual (CT-007);
  - o erro da reativação só vai para o console (CT-009);
  - a lista de bairros do cadastro de aluno é fixa no app (#192) (CT-012).
- O bloqueio por rota ativa (AC-06) depende da HU-011 e fica para quando as rotas estiverem na develop.
- Ocultar senhas e dados pessoais nas evidências.
