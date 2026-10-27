# Testes manuais de UI — HU-011 — Gerenciamento de Rotas Principais e Horários

## Identificação da suíte

| Campo           | Valor |
| --------------- | ----- |
| Módulo          | Gestão de Rotas e Horários (EP-003) |
| Funcionalidade  | HU-011 — Gerenciamento de Rotas Principais e Horários |
| Camada          | UI |
| Tipo de teste   | Funcional manual — suíte essencial (baseada em risco) |
| Tela            | Painel do administrador → aba **Cadastros** → **Rotas principais** (listagem **Rotas Principais**, **Cadastrar Rota** e **Editar Rota**) |
| Ambiente        | Desenvolvimento — app no celular (Expo Go) ou versão web (`http://localhost:3000`), com o front do [PR #194](https://github.com/GOUOCE/GOUCE-app/pull/194) (`feat/front-hu011`) ou da `develop` depois do merge |
| Total de casos  | 14 |
| Última execução | Não realizada |
| Testador        | Cauan Ricardo |

## Resultado geral

| Situação        | Total | ✅ Passaram | ❌ Falharam | 🚫 Bloqueados | ⏳ Pendentes |
| --------------- | ----: | ----------: | ----------: | ------------: | -----------: |
| ⏳ Não executada | 14 | 0 | 0 | 0 | 14 |

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
| CT-HU011-UI-001 | Acessar a gestão de rotas principais | Cadastros → Rotas principais, banco sem rotas | Listagem só de ativas com horários; busca; “Mostrar inativos” desligada; sem dados de exemplo | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-002 | Cadastrar rota principal | `Rota Centro - UFC`; saída e retorno; UFC na ida e na volta; Centro | “Operação realizada com sucesso”; na listagem; continua após reabrir o app e existe na API | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-003 | Vários vínculos e volta independente | `Rota Integrada`: 3 faculdades na ida, 1 na volta; 2 bairros | Seleções mantidas; ida e volta gravadas separadas | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-004 | Seleções só com bairros e faculdades ativos | Listas de faculdades (ida e volta) e de bairros | Ativos da base aparecem; inativos e nomes inexistentes no banco não aparecem | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-005 | Campos obrigatórios | Formulário vazio; sem faculdade na volta; sem bairro; nome em branco | Campos destacados com mensagem; nada salvo | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-006 | Horários livres e retorno depois da saída (#208) | Saída 13:15 e retorno 22:40; retorno antes da saída | Qualquer horário `HH:mm` pode ser escolhido; retorno ≤ saída sinalizado no campo | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-007 | Nome de rota duplicado (#208) | Nome igual com variação de maiúsculas e espaços; nome de complementar | Mensagem de nome em uso; nada criado | ⏳ PENDENTE | Não executado. |

### Seção B — Edição, inativação e reativação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU011-UI-008 | Editar rota | Trocar nome, horários, faculdades e bairros; nome em uso | Sucesso e listagem atualizada; dados carregados certos; nome em uso bloqueado | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-009 | Sair sem salvar | Alterar o nome em Editar e tocar na seta | Pedir confirmação; nada salvo | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-010 | Inativar, mostrar inativos e reativar | Cancelar e confirmar a inativação da rota `id` 1; ligar a chave; reativar | Sucesso nas duas; inativa identificada; nenhum bloqueio por dado de exemplo | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-011 | Bloqueios de inativação e reativação (#208) | Rota com complementar ativa; rota com bairro inativo | Mensagem clara de cada bloqueio; rota mantém o estado | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-012 | Bairro e faculdade usados em rota ativa (#208) | Inativar Centro e UFC nas telas de Bairros e Faculdades | Bloqueio com as mensagens definidas; base continua ativa | ⏳ PENDENTE | Não executado. |

### Seção C — Acesso e robustez

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU011-UI-013 | Aluno e representante sem acesso | Menus do aluno e do representante; link `rotas-principais` | Menu não exibido; link mostra Acesso Negado | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-014 | Falha de conexão e dados de exemplo | Servidor/Wi-Fi desligado ao listar, cadastrar, editar e inativar | Mensagem de conexão; app não finge sucesso nem mostra rotas que não existem | ⏳ PENDENTE | Não executado. |

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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
| — | Nenhuma execução realizada. | — |

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
