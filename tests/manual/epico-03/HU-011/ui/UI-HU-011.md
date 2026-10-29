# Testes manuais de UI — HU-011 — Gerenciamento de Rotas Principais e Horários

## Identificação da suíte

| Campo           | Valor |
| --------------- | ----- |
| Módulo          | Gestão de Rotas e Horários (EP-003) |
| Funcionalidade  | HU-011 — Gerenciamento de Rotas Principais e Horários |
| Camada          | UI |
| Tipo de teste   | Funcional manual — suíte essencial (baseada em risco) |
| Tela            | Painel do administrador → aba **Cadastros** → **Rotas principais** (listagem **Rotas Principais**, **Cadastrar Rota** e **Editar Rota**) |
| Ambiente        | Desenvolvimento — app web (`http://localhost:3000`) e API local (`http://127.0.0.1:18011`), branch `test/execucao-ui-hu-011` a partir da `develop` (`e5d620d8`), com o front do [PR #194](https://github.com/GOUOCE/GOUCE-app/pull/194) (`feat/front-hu011`, `e7343e40`) aplicado só no working tree (sem as mudanças de `package.json` e `app.json` do PR, que sobem o Expo para o SDK 58) |
| Total de casos  | 14 |
| Última execução | 2026-10-29 |
| Testador        | Cauan Ricardo |

## Resultado geral

| Situação        | Total | ✅ Passaram | ❌ Falharam | 🚫 Bloqueados | ⏳ Pendentes |
| --------------- | ----: | ----------: | ----------: | ------------: | -----------: |
| ❌ Reprovada | 14 | 2 | 12 | 0 | 0 |

## Pré-condições

| ID    | Descrição |
| ----- | --------- |
| PC-01 | Aplicativo aberto com a API e o banco disponíveis. **Banco de teste sem rotas cadastradas**, para o CT-001 e o CT-010 poderem expor o uso de dados de exemplo no app (a primeira rota criada recebe o `id` 1). |
| PC-02 | **Administrador A** logado: aba **Cadastros** → **Rotas principais**. |
| PC-03 | Credenciais de um **aluno aprovado e ativo** e de um **representante**, para o CT-013. |
| PC-04 | Massa de base preparada pela IA antes da execução: bairros **Centro** e **Campo Velho** ativos e **Alto São Francisco** inativo; faculdades **UFC**, **IFCE** e **UECE** (Campus Quixadá) ativas e **Unicatólica** inativa. |
| PC-05 | Massa de rotas criada pela própria suíte: **Rota Centro - UFC** (CT-002) e **Rota Integrada** (CT-003). Depois do CT-003, a IA cria pela API da HU-012 a complementar ativa **Van Trevo** ligada à **Rota Integrada** (usada nos CT-007 e CT-011). |
| PC-06 | Apoio da IA (Claude Code) para conferir na API ou no banco, quando o caso pedir, se o que a tela mostra foi mesmo gravado. |
| PC-07 | Se uma ação falhar com “não autorizado” por sessão vencida, sair, entrar de novo e repetir o caso. |

## Resumo da execução

Executar na ordem abaixo. São **14 casos essenciais**, em três seções. Os IDs completos usam o prefixo `CT-HU011-UI-`, numerados de 001 a 014. As regras marcadas com **#208** vêm das decisões do PO na [issue #208](https://github.com/GOUOCE/GOUCE-app/issues/208).

### Seção A — Listagem e cadastro

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU011-UI-001 | Acessar a gestão de rotas principais | Cadastros → Rotas principais, banco sem rotas | Listagem só de ativas com horários; busca; “Mostrar inativos” desligada; sem dados de exemplo | ❌ FALHOU | Chave **Mostrar inativos** começa ligada (@@C@@); lista de exemplo `Linha 01–03` no código (@@A@@); seta volta ao Painel (@@K@@). |
| CT-HU011-UI-002 | Cadastrar rota principal | `Rota Centro - UFC`; saída e retorno; UFC na ida e na volta; Centro | “Operação realizada com sucesso”; na listagem; continua após reabrir o app e existe na API | ❌ FALHOU | Gravou certo (rota `id` 1); sucesso em barra preta, texto fora do padrão (@@D@@); tela guarda dados antigos (@@I@@). |
| CT-HU011-UI-003 | Vários vínculos e volta independente | `Rota Integrada`: 3 faculdades na ida, 1 na volta; 2 bairros | Seleções mantidas; ida e volta gravadas separadas | ❌ FALHOU | Volta gravada como IFCE por pré-seleção (@@E@@); nome completo no lugar de `SIGLA - Campus` (@@L@@); checkbox lento (@@M@@); modal de bairro e lixeira (@@N@@). |
| CT-HU011-UI-004 | Seleções só com bairros e faculdades ativos | Listas de faculdades (ida e volta) e de bairros | Ativos da base aparecem; inativos e nomes inexistentes no banco não aparecem | ❌ FALHOU | Só ativos aparecem ✅ (conferido na API); as listas só carregam ao abrir a tela e há lista de exemplo (@@A@@). |
| CT-HU011-UI-005 | Campos obrigatórios | Formulário vazio; sem faculdade na volta; sem bairro; nome em branco | Campos destacados com mensagem; nada salvo | ❌ FALHOU | Tudo vem pré-marcado e só o nome basta para salvar (@@E@@); nome sem máscara (@@F@@, @@G@@); erro reaparece ao apagar (@@F@@). |
| CT-HU011-UI-006 | Horários livres e retorno depois da saída (#208) | Saída 13:15 e retorno 22:40; retorno antes da saída | Qualquer horário `HH:mm` pode ser escolhido; retorno ≤ saída sinalizado no campo | ❌ FALHOU | Horários só em lista de 6 opções (@@H@@). Retorno antes da saída: 🚫 bloqueado, a lista não permite montar o cenário. |
| CT-HU011-UI-007 | Nome de rota duplicado (#208) | Nome igual com variação de maiúsculas e espaços; nome de complementar | Mensagem de nome em uso; nada criado | ❌ FALHOU | A API bloqueia as 4 variações ✅; o app mostra outro texto e esconde a mensagem da API (@@O@@). |

### Seção B — Edição, inativação e reativação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU011-UI-008 | Editar rota | Trocar nome, horários, faculdades e bairros; nome em uso | Sucesso e listagem atualizada; dados carregados certos; nome em uso bloqueado | ❌ FALHOU | Gravou certo; sucesso em barra preta (@@D@@); checkbox lento (@@M@@); texto do nome em uso (@@O@@). |
| CT-HU011-UI-009 | Sair sem salvar | Alterar o nome em Editar e tocar na seta | Pedir confirmação; nada salvo | ❌ FALHOU | Edição sai e salva sem nenhuma confirmação (@@J@@). |
| CT-HU011-UI-010 | Inativar, mostrar inativos e reativar | Cancelar e confirmar a inativação da rota `id` 1; ligar a chave; reativar | Sucesso nas duas; inativa identificada; nenhum bloqueio por dado de exemplo | ❌ FALHOU | Rota `id` 1 barrada por dado de exemplo (@@B@@); sucesso em barra preta (@@D@@). |
| CT-HU011-UI-011 | Bloqueios de inativação e reativação (#208) | Rota com complementar ativa; rota com bairro inativo | Mensagem clara de cada bloqueio; rota mantém o estado | ❌ FALHOU | A API devolve a mensagem certa; o app mostra texto técnico e, na reativação, nenhum aviso (@@P@@). |
| CT-HU011-UI-012 | Bairro e faculdade usados em rota ativa (#208) | Inativar Centro e UFC nas telas de Bairros e Faculdades | Bloqueio com as mensagens definidas; base continua ativa | ✅ PASSOU | Os dois bloqueios aparecem como “Inativação Bloqueada” e a base continua ativa. |

### Seção C — Acesso e robustez

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU011-UI-013 | Aluno e representante sem acesso | Menus do aluno e do representante; link `rotas-principais` | Menu não exibido; link mostra Acesso Negado | ✅ PASSOU | Aluno e representante não veem o menu e os três links mostram acesso negado (403). |
| CT-HU011-UI-014 | Falha de conexão e dados de exemplo | Servidor/Wi-Fi desligado ao listar, cadastrar, editar e inativar | Mensagem de conexão; app não finge sucesso nem mostra rotas que não existem | ❌ FALHOU | Sem servidor, o app finge sucesso e mostra rotas de exemplo (@@A@@). |

## Detalhamento dos casos

### Seção A — Listagem e cadastro

#### CT-HU011-UI-001 — Acessar a gestão de rotas principais

**Dados de entrada:** Administrador A logado no Painel, com o banco sem rotas (PC-01). Repetir os passos 3 e 4 depois do CT-003.

**Passos**

1. Tocar na aba **Cadastros** e no card **Rotas principais**.
2. Conferir os elementos da tela e a posição inicial da chave **Mostrar inativos**.
3. Digitar parte de um nome em **Buscar por nome**; depois o mesmo texto em maiúsculas; depois um texto inexistente.
4. Conferir o que cada rota mostra.
5. Tocar na seta de voltar.

**Resultado esperado**

- O card abre a listagem **Rotas Principais** (não uma tela de erro ou “não encontrada”).
- Com o banco **sem rotas**, a listagem fica vazia com “Nenhuma rota principal ativa encontrada.”. Se aparecerem `Linha 01 - Centro`, `Linha 02 - Bairro Novo` ou `Linha 03 - Vila Antiga`, que não existem no banco, são dados de exemplo do app: registrar como falha.
- A chave **Mostrar inativos** começa **desligada**; só ativas aparecem (AC-01, AC-09).
- Cada rota mostra nome e horários de saída e retorno (AC-01).
- A busca filtra sem diferenciar maiúsculas; sem resultado, aparece a mensagem de lista vazia.
- O botão **Nova** leva ao cadastro e a seta volta para **Cadastros**.

**Resultado obtido**

- Card abre a listagem; busca filtra sem diferenciar maiúsculas e sem resultado mostra lista vazia ✅.
- A chave **Mostrar inativos** abriu **ligada** (esperado: desligada) → @@C@@.
- A seta de voltar leva ao **Painel**, não a **Cadastros** → @@K@@.
- Com o banco sem rotas, o código mostra `Linha 01 - Centro`, `Linha 02 - Bairro Novo` e `Linha 03 - Vila Antiga` (`listaApi.length > 0 ? listaApi : ROTAS_PRINCIPAIS_MOCK`) → @@A@@. Resultado por leitura do código e conferência na API; o testador dispensou a execução na tela por a falha já estar clara no código.
- Status: ❌ FALHOU.

---

#### CT-HU011-UI-002 — Cadastrar rota principal

**Dados de entrada:** Nome `Rota Centro - UFC`; saída `06:30`; retorno `17:30`; **Faculdades de Ida** UFC; **Faculdades de Volta** UFC; bairro vinculado Centro.

**Passos**

1. Tocar em **Nova**, preencher os campos e vincular o bairro em **Vincular bairro**.
2. Tocar em **Finalizar cadastro**, conferir a confirmação e confirmar; anotar a mensagem exibida.
3. Conferir a listagem.
4. **Fechar o app por completo e abrir de novo** (na web, recarregar a página); voltar à listagem.
5. Pedir à IA para conferir na API (`GET /rotas-principais`) se a rota foi gravada com horários, faculdades e bairro.

**Resultado esperado**

- Pedir confirmação antes de salvar.
- Exibir “Operação realizada com sucesso” e voltar à listagem com a rota entre as ativas (AC-02, AC-07). Registrar o texto exato.
- Depois de reabrir o app, a rota continua na listagem.
- A rota existe na API com os dados da tela: o cadastro foi gravado no banco, e não só no app.

**Resultado obtido**

- Rota cadastrada e conferida na API: `Rota Centro - UFC`, 06:30 / 17:30, UFC na ida e na volta, bairro Centro ✅.
- A confirmação aparece como barra preta (Snackbar) com “Rota cadastrada com sucesso”, em vez do pop-up “Operação realizada com sucesso” → @@D@@.
- Ao abrir **Nova** de novo, o formulário guarda o que foi digitado antes → @@I@@.
- Status: ❌ FALHOU.

---

#### CT-HU011-UI-003 — Vários vínculos e volta independente

**Dados de entrada:** Nome `Rota Integrada`; saída e retorno quaisquer válidos; **Faculdades de Ida** UFC, IFCE e UECE; **Faculdades de Volta** só UFC; bairros Centro e Campo Velho.

**Passos**

1. Tocar em **Nova** e marcar as três faculdades na ida e só a UFC na volta.
2. Vincular os dois bairros, um de cada vez; tentar vincular o Centro de novo.
3. Desvincular e vincular de novo o Campo Velho.
4. Finalizar o cadastro e abrir a rota em **Editar**.
5. Pedir à IA para conferir na API as listas de ida, volta e bairros.

**Resultado esperado**

- O resumo de cada campo de faculdades mostra a quantidade e as instituições marcadas, identificáveis pelo nome ou sigla.
- Marcar a ida **não** marca nem limita a volta (AC-10; #208, item 3).
- O mesmo bairro não entra duas vezes; desvincular retira só o bairro escolhido.
- Na edição e na API: três faculdades na ida, uma na volta e dois bairros (AC-02).

**Resultado obtido**

- Rota `Rota Integrada` cadastrada com 3 faculdades na ida e 2 bairros ✅, mas a API mostra a **volta = IFCE** (esperado: só UFC). A volta já vinha marcada com a primeira faculdade e não foi desmarcada → @@E@@.
- Os campos de faculdade mostram o nome completo, sem o formato `SIGLA - Campus` da HU-010/HU-030 → @@L@@.
- Os checkboxes das faculdades de ida e volta demoram muito para marcar → @@M@@.
- O modal **Vincular bairro** lista os nomes como texto azul/negrito, sem marcação de escolhido (parece uma chave); a lixeira remove o bairro sem pedir confirmação → @@N@@.
- Status: ❌ FALHOU.

---

#### CT-HU011-UI-004 — Seleções só com bairros e faculdades ativos

**Dados de entrada:** Massa da PC-04 (Alto São Francisco e Unicatólica inativos).

**Passos**

1. Em **Nova**, abrir **Faculdades de Ida**, **Faculdades de Volta** e **Vincular bairro**; anotar as opções.
2. Pedir à IA para cadastrar uma faculdade nova ativa pela API; voltar e abrir **Nova** de novo.
3. Comparar as opções com `GET /rotas-principais/opcoes`.

**Resultado esperado**

- Aparecem só bairros e faculdades **ativos** do banco; Alto São Francisco e Unicatólica não aparecem (AC-03, FA-002; #207, item 7).
- A faculdade nova aparece sem reiniciar o app.
- Não aparecem instituições ou bairros que não existem no banco (por exemplo `Universidade Estadual do Ceará` sem cadastro, `Uniateneu Inativa`, `Vila Antiga Inativa`): seriam dados de exemplo do app.

**Resultado obtido**

- `GET /rotas-principais/opcoes` devolve só UFC, IFCE, UECE e Centro, Campo Velho (ativos), e a tela mostra as mesmas opções ✅.
- As opções são carregadas uma única vez ao abrir a tela (`useEffect` sem recarga): uma faculdade criada depois não aparece sem recarregar → @@A@@.
- Se `/opcoes` falhar, o serviço troca por `FACULDADES_MOCK` e `BAIRROS_MOCK` (inclui `Uniateneu Inativa`) → @@A@@. Resultado por leitura do código e conferência na API; o testador dispensou a execução na tela por a falha já estar clara no código.
- Status: ❌ FALHOU.

---

#### CT-HU011-UI-005 — Campos obrigatórios

**Dados de entrada:**

1. Formulário vazio.
2. Tudo preenchido, menos a faculdade da volta.
3. Tudo preenchido, sem bairro vinculado.
4. Nome só com espaços.

**Passos**

1. Tocar em **Finalizar cadastro** em cada situação.
2. Conferir se a listagem e a API continuam sem rota nova.

**Resultado esperado**

- O cadastro não é enviado; cada campo vazio fica **destacado** com mensagem própria (AC-08, FA-003): nome, horário de saída, horário de retorno, faculdade da ida, faculdade da **volta** (#208, item 3) e bairro.
- Nome só com espaços conta como vazio.
- Ao preencher o campo, o destaque some.
- Nenhuma rota é criada.

**Resultado obtido**

- Ao abrir **Nova**, já vêm marcadas todas as faculdades na ida, a primeira na volta, o primeiro bairro e os horários 06:40 / 17:30. Por isso não foi possível testar os obrigatórios → @@E@@.
- Foi salva a rota `wwww@@@2` (`id` 3) digitando só o nome: horários 06:40 / 17:30, bairro Campo Velho, 3 faculdades na ida e volta IFCE. O nome aceita símbolos e não tem máscara; a API também aceitou → @@F@@, @@G@@.
- A mensagem de erro de um campo reaparece ao apagar o texto, em vez de sumir e voltar só ao tocar em finalizar → @@F@@.
- Status: ❌ FALHOU.

---

#### CT-HU011-UI-006 — Horários livres e retorno depois da saída (#208)

**Dados de entrada:** cadastro `Rota Noturna Teste`: saída `13:15` e retorno `22:40`; depois saída `18:00` e retorno `17:00`; depois saída e retorno iguais.

**Passos**

1. Em **Nova**, tocar em **Horário de Saída** e tentar escolher `13:15`; fazer o mesmo no retorno com `22:40`.
2. Tentar escolher um retorno anterior à saída e um retorno igual à saída e salvar.
3. Repetir o passo 2 em **Editar** de `Rota Centro - UFC`.

**Resultado esperado**

- O administrador consegue informar **qualquer horário válido `HH:mm`**: não há horário mínimo nem máximo (#208, item 2b; RF-013). Se o app só oferece uma lista fixa de horários, registrar como falha.
- Retorno igual ou anterior à saída é sinalizado no campo de retorno e o salvamento é bloqueado (#208, item 2a).
- Se a lista fixa impedir montar o retorno antes da saída, registrar essa parte como 🚫 e citar o CT-HU011-API-006.

**Resultado obtido**

- Saída aceita só 06:00, 06:10, 06:20, 06:30, 06:40 e 07:00; retorno só 11:30, 12:00, 17:00, 17:30, 18:00 e 22:00. Não dá para escolher `13:15` nem `22:40`, que a API aceita (qualquer `HH:mm`) e o PO definiu na #208, item 2 → @@H@@.
- O campo mostra o placeholder “Selecionar” muito escuro e o horário escolhido em cinza (campo `editable={false}`), fora do padrão dos campos do app → @@H@@.
- 🚫 Retorno antes ou igual à saída: não é possível informar o horário; coberto na API em `CT-HU011-API-006`.
- Status: ❌ FALHOU.

---

#### CT-HU011-UI-007 — Nome de rota duplicado (#208)

**Dados de entrada:** nome `Rota Centro - UFC` (igual ao do CT-002), `ROTA CENTRO - UFC` e `  rota centro - ufc  `; depois, `Van Trevo` (nome da complementar da PC-05).

**Passos**

1. Cadastrar uma rota com cada nome e os demais dados válidos.
2. Conferir a listagem e pedir à IA para conferir na API.

**Resultado esperado**

- O cadastro é bloqueado com mensagem clara de que o nome já está em uso. Registrar o texto exato.
- Vale para maiúsculas, espaços nas pontas, rota inativa e nome de rota complementar (#208, item 1).
- A tela continua com os dados preenchidos para correção; nenhuma rota nova é criada.

**Resultado obtido**

- Na API, `Rota Centro - UFC`, `ROTAS CENTRO - UFC`, `  rota centro - ufc  ` e `Van Trevo` (nome da complementar) devolvem `409` “Já existe uma rota com este nome.”; nada foi criado ✅.
- No app, qualquer `409` do cadastro vira “Esta rota já está cadastrada.” em pop-up (visto ao salvar `Rota Integrada` no CT-008). O requisito (HU-011, item 11) manda exibir “Já existe uma rota com este nome.” → @@O@@. O testador considerou o pop-up adequado; o desvio é só de texto.
- Status: ❌ FALHOU.

---

### Seção B — Edição, inativação e reativação

#### CT-HU011-UI-008 — Editar rota

**Dados de entrada:** `Rota Centro - UFC`: nome `Rota Centro - UFC Manhã`; outros horários; ida IFCE; volta UECE; trocar o bairro Centro por Campo Velho. Depois, nome `Rota Integrada` (em uso).

**Passos**

1. Tocar no ícone de editar da rota e conferir se os dados carregados batem com a API.
2. Fazer as alterações e tocar em **Salvar alterações**; anotar a mensagem.
3. Conferir a listagem e abrir **Editar** de novo.
4. Tentar salvar com o nome `Rota Integrada`.
5. Pedir à IA para conferir na API.

**Resultado esperado**

- A tela abre com nome, horários, faculdades e bairros da rota.
- Exibir “Operação realizada com sucesso” e voltar à listagem com os dados novos (AC-04, AC-07).
- Ao reabrir, as faculdades e bairros antigos não ficam marcados.
- O nome em uso é bloqueado com mensagem clara; nada é alterado.
- Na API, a mesma rota (mesmo `id`) com os dados novos.

**Resultado obtido**

- Rota `id` 1 alterada e conferida na API: `Rota Centro - UFC Manhã`, 06:10 / 11:30, ida só IFCE, volta só UECE ✅. O bairro continuou Centro (a troca por Campo Velho não foi confirmada).
- Sucesso exibido em barra preta → @@D@@. Checkboxes das faculdades demoram muito → @@M@@.
- Salvar com o nome `Rota Integrada` foi bloqueado em pop-up com “Esta rota já está cadastrada.” (texto difere do requisito) → @@O@@.
- Status: ❌ FALHOU.

---

#### CT-HU011-UI-009 — Sair sem salvar

**Dados de entrada:** `Rota Integrada` aberta em **Editar**, com o nome trocado para `Rota Integrada Teste`, sem salvar.

**Passos**

1. Alterar o nome e tocar na seta de voltar (no Android, também no botão voltar do aparelho).
2. Responder à confirmação, se houver, escolhendo sair.
3. Abrir a rota em **Editar** de novo.

**Resultado esperado**

- O app pede confirmação antes de descartar as alterações (padrão das telas de edição do épico 02).
- Ao sair, nada é salvo: a rota continua `Rota Integrada`.

**Resultado obtido**

- `editar.tsx` salva direto e a seta chama `router.back()` sem aviso de alterações não salvas → @@J@@. Resultado por leitura do código e conferência na API; o testador dispensou a execução na tela por a falha já estar clara no código.
- Status: ❌ FALHOU.

---

#### CT-HU011-UI-010 — Inativar, mostrar inativos e reativar

**Dados de entrada:** `Rota Centro - UFC` (a primeira cadastrada no banco limpo, `id` 1), sem complementar e sem agendamentos.

**Passos**

1. Tocar no ícone de inativar e **cancelar**; conferir que nada mudou.
2. Tocar de novo e **confirmar**; anotar a mensagem.
3. Ligar **Mostrar inativos** e conferir como a rota aparece.
4. Reativar a rota, confirmar e anotar a mensagem.
5. Pedir à IA para conferir na API que a rota continua no banco nos dois estados.

**Resultado esperado**

- Pedir confirmação; cancelar não muda nada.
- Confirmar exibe “Operação realizada com sucesso”, tira a rota dos ativos e atualiza a listagem (AC-05, AC-07).
- Com a chave ligada, a rota aparece identificada como **inativa** (AC-09).
- A reativação exibe “Operação realizada com sucesso” e devolve a rota aos ativos.
- A rota nunca some do banco (soft delete).
- Se a inativação for barrada com “agendamentos pendentes” sem existir agenda (HU-013 ainda não existe), é regra de exemplo do app: registrar como falha.

**Resultado obtido**

- Inativar `Rota Centro - UFC` (`id` 1) foi barrado com “Inativação bloqueada” de agendamentos pendentes, sem existir agenda: o app confere a lista de exemplo (`Linha 01`, `id` 1) antes da API → @@B@@.
- A rota 3 (`wwww@@@2`) foi inativada: aparece com a chave **Mostrar inativos** ligada ✅ e continua no banco como `ativo: false` (soft delete ✅). A reativação não foi executada na tela.
- A confirmação de sucesso usa barra preta (“Rota inativada”) → @@D@@.
- Status: ❌ FALHOU.

---

#### CT-HU011-UI-011 — Bloqueios de inativação e reativação (#208)

**Dados de entrada:**

1. `Rota Integrada` com a complementar ativa `Van Trevo` ligada a ela (PC-05).
2. `Rota Integrada` inativa (depois de inativar `Van Trevo`), com o bairro Centro inativado pela IA via API (depois do CT-008, o Centro só está nesta rota).

**Passos**

1. Tentar inativar `Rota Integrada` com a complementar ativa; anotar a mensagem.
2. Pedir à IA para inativar `Van Trevo`; inativar a rota; pedir à IA para inativar o bairro Centro.
3. Ligar **Mostrar inativos** e tentar reativar `Rota Integrada`; anotar a mensagem.
4. Pedir à IA para reativar o Centro e reativar a rota.

**Resultado esperado**

- Passo 1: a inativação é bloqueada com “Esta rota possui rotas complementares ativas vinculadas. Inative ou desvincule as rotas complementares antes de continuar.” (#208, item 5); a rota continua ativa.
- Passo 3: a reativação é bloqueada com mensagem clara sobre o bairro ou faculdade inativo; a rota continua inativa.
- Nenhuma mensagem técnica (como `Request failed with status code 409`) nem ausência de aviso.
- Passo 4: a rota volta a ficar ativa.

**Resultado obtido**

- Na API, inativar a `Rota Integrada` com a complementar ativa devolve `409` com a mensagem do PO (#208, item 5), e nada mudou ✅.
- No app, a inativação lê `error.response.data.detail`, mas a API manda `error.message`: o aviso exibido é “Request failed with status code 409”. A reativação recusada só grava `console.error`, sem aviso na tela → @@P@@. Resultado por leitura do código e conferência na API; o testador dispensou a execução na tela por a falha já estar clara no código.
- Status: ❌ FALHOU.

---

#### CT-HU011-UI-012 — Bairro e faculdade usados em rota ativa (#208)

**Dados de entrada:** `Rota Integrada` ativa, com o bairro Centro e a faculdade UFC (na ida e na volta).

**Passos**

1. Em **Cadastros → Bairros**, tentar inativar o Centro; anotar a mensagem.
2. Em **Cadastros → Faculdades**, tentar inativar a UFC; anotar a mensagem.
3. Conferir que os dois continuam ativos.

**Resultado esperado**

- Bairro: “Este bairro não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar.” (HU-007, CA 6).
- Faculdade: “Esta faculdade não pode ser inativada pois pertence a uma rota ativa. Remova-a da rota antes de continuar.” (#208, item 7).
- Os dois continuam ativos e a rota não muda.

**Resultado obtido**

- Em **Cadastros → Bairros**, inativar o Centro foi bloqueado (“Inativação Bloqueada”) com a mensagem da API: “Este bairro não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar.” ✅.
- Em **Cadastros → Faculdades**, inativar a UFC foi bloqueado do mesmo modo (“Esta faculdade não pode ser inativada pois pertence a uma rota ativa. Remova-a da rota antes de continuar.”) ✅.
- Conferido na API: Centro e UFC seguem ativos e a rota não mudou ✅.
- Status: ✅ PASSOU.

---

### Seção C — Acesso e robustez

#### CT-HU011-UI-013 — Aluno e representante sem acesso

**Dados de entrada:** conta de aluno aprovado e de representante (PC-03); na web, os endereços `/rotas-principais`, `/rotas-principais/cadastrar` e `/rotas-principais/editar?id=1`.

**Passos**

1. Entrar como aluno e procurar a gestão de rotas nos menus.
2. Na web, abrir os endereços diretos.
3. Repetir como representante.

**Resultado esperado**

- O menu de gestão de rotas não aparece para aluno nem representante (RN-006).
- O link direto mostra **Acesso Negado** (ou volta ao Início), sem exibir dados de rotas nem permitir salvar.

**Resultado obtido**

- O menu de gestão de rotas não aparece para a aluna nem para a representante ✅.
- `/rotas-principais`, `/rotas-principais/cadastrar` e `/rotas-principais/editar?id=1` mostraram acesso negado (403) para os dois perfis, sem dados de rotas ✅.
- Status: ✅ PASSOU.

---

#### CT-HU011-UI-014 — Falha de conexão e dados de exemplo

**Dados de entrada:** servidor parado (ou Wi-Fi do celular desligado) com o app aberto na listagem.

**Passos**

1. Atualizar a listagem (sair e voltar à tela).
2. Tentar cadastrar `Rota Sem Conexão`, editar uma rota e inativar outra.
3. Religar o servidor, voltar à listagem e pedir à IA para conferir na API.

**Resultado esperado**

- O app avisa que não conseguiu falar com o servidor.
- Não mostra rotas, faculdades ou bairros que não existem no banco.
- Cadastrar, editar e inativar **não** exibem sucesso; depois de religar, nada disso aparece na API.

**Resultado obtido**

- O serviço captura qualquer falha e cai nas listas de exemplo: listar mostra `Linha 01–03`; cadastrar, editar, inativar e reativar alteram só a lista local e devolvem sucesso (ids `Date.now()`); o erro de conexão não usa o pop-up “Erro de Conexão” → @@A@@. Resultado por leitura do código e conferência na API; o testador dispensou a execução na tela por a falha já estar clara no código.
- Status: ❌ FALHOU.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 — listagem de ativas com horários | Visualiza as rotas ativas com horários | CT-001 |
| AC-02 — cadastro com vários vínculos | Cadastra rota; vários bairros e faculdades | CT-002, CT-003 |
| AC-03 / FA-002 — só base ativa | Não oferece bairro/faculdade inativos | CT-004 |
| AC-04 — edição | Edita nome, horários, faculdades e bairros | CT-008 |
| AC-05 — inativar e reativar | Inativa; reativa | CT-010 |
| AC-06 / FA-001 — agendamentos futuros | Bloqueia inativação | Não coberto na UI nesta rodada (depende da HU-013); ver CT-HU011-API-014 e CT-010 |
| AC-07 — mensagem de sucesso | Cenários de sucesso | CT-002, CT-008, CT-010 |
| AC-08 / FA-003 — obrigatórios | Cadastro sem obrigatório | CT-005 |
| AC-09 — Mostrar inativos | Visualiza inativas | CT-001, CT-010 |
| AC-10 — volta independente | Faculdades da volta diferentes da ida | CT-003 |
| AC-05 / RNF-013 — auditoria | Log de auditoria | Conferido na API (CT-HU011-API-012) |
| #208 item 1 — nome único | — (decisão do PO) | CT-007, CT-008 |
| #208 item 2 — horários | — (decisão do PO) | CT-006 |
| #208 item 3 — volta obrigatória | — (decisão do PO) | CT-005 |
| #208 item 5 — complementar ativa | — (decisão do PO) | CT-011 |
| #208 item 7 — base em rota ativa | — (decisão do PO) | CT-012 |
| RN-006 — exclusividade administrativa | Menu não exibido para outros perfis | CT-013 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-001, 004, 014 | Dados de exemplo (`Linha 01–03`, faculdades e bairros inventados) aparecem com o banco vazio e quando o servidor falha; cadastrar, editar, inativar e reativar dão sucesso falso sem conexão; as opções só carregam ao abrir a tela | @@A@@ |
| CT-010 | Inativar a rota de `id` 1 é barrado por “agendamentos pendentes” vindo da lista de exemplo | @@B@@ |
| CT-001 | A chave **Mostrar inativos** abre ligada | @@C@@ |
| CT-002, 008, 010 | Sucesso em barra preta (Snackbar) e com textos fora do padrão “Operação realizada com sucesso” | @@D@@ |
| CT-003, 005 | Campos obrigatórios vêm pré-marcados; só o nome basta para salvar e a volta foi gravada errada | @@E@@ |
| CT-005 | Nome da rota sem máscara; erro de validação reaparece ao apagar | @@F@@ |
| CT-005 | A API aceita nome de rota com símbolos (`wwww@@@2`) | @@G@@ |
| CT-006 | Horários só em lista fixa de 6 opções; campo com placeholder escuro e texto cinza; retorno antes da saída não conferido | @@H@@ |
| CT-002, 008 | Telas de cadastro e edição guardam os dados digitados antes | @@I@@ |
| CT-009 | Edição sai e salva sem confirmação de alterações não salvas | @@J@@ |
| CT-001 a 008 | A seta de voltar leva ao Painel em vez da listagem de origem | @@K@@ |
| CT-003 | Faculdades aparecem com o nome completo, sem `SIGLA - Campus` | @@L@@ |
| CT-003, 008 | Checkbox das faculdades demora muito para marcar | @@M@@ |
| CT-003 | Modal **Vincular bairro** sem marcação de escolhido; lixeira remove sem confirmar | @@N@@ |
| CT-007, 008 | Qualquer `409` do cadastro vira “Esta rota já está cadastrada.” (requisito: “Já existe uma rota com este nome.”) | @@O@@ |
| CT-011 | Inativação bloqueada mostra “Request failed with status code 409”; reativação recusada sem aviso | @@P@@ |

## Observações gerais

- Referências: [HU-011, seção 7.4.1](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-03/HU-011.feature), [decisões do PO (#208)](https://github.com/GOUOCE/GOUCE-app/issues/208), [PR #194](https://github.com/GOUOCE/GOUCE-app/pull/194) e [suíte de API](../api/API-HU-011.md).
- **Riscos mapeados no código** do PR #194 (`frontend/src/services/rotaPrincipalService.ts` e telas em `frontend/src/app/(administrador)/rotas-principais/`), que orientaram a escolha dos casos:
  - o serviço mantém uma **lista de exemplo** (`Linha 01 - Centro`, `Linha 02 - Bairro Novo`, `Linha 03 - Vila Antiga`, ids 1 a 3) e a mostra quando a API devolve lista **vazia** ou falha (CT-001, CT-014);
  - a inativação confere a lista de exemplo **antes** da API: a rota de `id` 1 é barrada com “Esta rota possui agendamentos pendentes de alunos. Não é possível inativar no momento.” mesmo sem agenda, e esse texto difere do requisito (CT-010);
  - sem resposta do servidor, cadastrar, editar, inativar e reativar alteram só a lista de exemplo e **parecem ter dado certo** (CT-014);
  - faculdades e bairros de exemplo (`Universidade Estadual do Ceará`, `Uniateneu Inativa`, `Vila Antiga Inativa`) entram nas seleções quando `/rotas-principais/opcoes` falha (CT-004);
  - a chave **Mostrar inativos** começa **ligada** (CT-001);
  - os horários são escolhidos em listas fixas (saída: 06:00 a 07:00; retorno: 11:30 a 22:00, seis opções cada); não dá para informar outro horário e o app não confere retorno depois da saída (CT-006);
  - as mensagens de sucesso são “Rota cadastrada com sucesso”, “Rota alterada com sucesso”, “Rota inativada” e “Rota reativada”, e não “Operação realizada com sucesso” (CT-002, 008, 010);
  - o bloqueio da inativação lê `detail` da resposta, mas a API devolve a mensagem em `error.message`: o aviso pode mostrar `Request failed with status code 409` (CT-011);
  - a reativação recusada só registra o erro no console, sem aviso na tela (CT-011);
  - a edição salva sem pedir confirmação e não há aviso ao sair sem salvar (CT-009);
  - o resumo das faculdades usa a `sigla`, que a API de rotas não devolve: o app mostra o nome no lugar (CT-003);
  - no PR #194, o card **Rotas complementares** aponta para `/(administrador)/cadastros/rotas-complementares`, e no PR #182 é o card **Rotas principais** que aponta para `/cadastros/...`: conferir os dois cards depois do merge dos dois PRs (CT-001).
- O bloqueio por agendamentos futuros (AC-06) e a rota inativa fora do agendamento (#208, item 8) dependem da HU-013 e ficam para quando a agenda estiver na `develop`.
- Ocultar senhas e dados pessoais nas evidências.
- **Execução (28 e 29/10/2026):** o testador executou na tela os CT-001 a 003, 004 (parte das opções), 005, 006 (parte dos campos), 008, 010 (inativação), 012 e 013. Os CT-007, 009, 011 e 014 e o que sobrou dos CT-001, 004 e 006 foram fechados por leitura do código e conferência na API, a pedido do testador, porque a falha já estava clara no código (o PR #194 repete os padrões já reprovados nas HUs 007 a 010 e 030).
- **Massa criada pela IA:** a complementar `Van Trevo` (`id` 1, ligada à `Rota Integrada`) pela API da HU-012. A rota 3 (`wwww@@@2`) foi mantida como evidência do CT-005 e está inativa.
- O PR #194 está com conflito com a `develop` (`DIRTY`) e traz, além do front da HU-011, a subida do Expo para o SDK 58 e versões antigas dos documentos de `tests/manual/epico-03`, que apagariam este planejamento. Não deve ser mesclado como está.
