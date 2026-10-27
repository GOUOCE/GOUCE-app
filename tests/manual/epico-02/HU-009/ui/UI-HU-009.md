# Testes manuais de UI — HU-009 — Gerenciamento de Frota (Ônibus)

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Gestão de Cadastros Base (EP-002) |
| Funcionalidade | HU-009 — Gerenciamento de Frota (Ônibus) |
| Camada | UI |
| Tipo de teste | Funcional manual — suíte essencial (baseada em risco) |
| Tela | Painel do administrador → aba **Cadastros** → **Frota**; **Cadastrar Ônibus** e **Editar Ônibus**. Implementação do PR #179 (mesclado em 26/10/2026). |
| Ambiente | Desenvolvimento — versão web (`http://localhost:3000`), API e banco locais em Docker; branch `test/manual-ui-hu-009` criada a partir da `develop` no commit `1edaf2aa` |
| Total de casos | 13 |
| Última execução | 2026-10-26 |
| Testador | Cauan Ricardo |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: |
| ❌ Concluída com falhas | 13 | 2 | 10 | 1 | 0 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | **Antes da execução, confirmar se a tela está disponível.** Em 24/10/2026, `gh pr view 179` indicou `OPEN`, branch `feat/front-hu009`, commit `63fe38e466a7b5a39af88854b5c66b17a47f81fb`. A branch de planejamento não contém `frontend/src/app/(administrador)/frota/`; o card atual aponta para `/cadastros/frota`, sem tela correspondente. Executar os casos completos somente em ambiente que contenha a implementação do PR, por merge ou checkout preparado para execução. Sem a tela, registrar o impedimento e marcar os casos dependentes como 🚫; não tratar rota ausente como acesso negado aprovado. Nenhum checkout é feito por este planejamento. **Confirmado na execução (26/10/2026):** o PR #179 foi mesclado (`9801dc53`) e as telas de frota estão na `develop`. |
| PC-02 | App, API e banco de teste disponíveis, administrador A logado; celular com Expo Go ou web. Começar com banco sem ônibus para a parte vazia do CT-001. |
| PC-03 | Credenciais de aluno ativo e representante, para o CT-011. Se o representante não conseguir entrar, registrar o motivo e bloquear só a parte dependente. Sessão vencida: entrar novamente e repetir o passo. |
| PC-04 | Depois de conferir a lista vazia no CT-001, pedir à IA para preparar `ABC1D23` ativo (44 assentos/20 em pé) e `XYZ9K87` inativo (32/0), sem alocações futuras. CT-002 cria `QXD2E45`; CT-003 cria placas distintas. Se a UI não permitir montar o cenário, preparar via API/banco local, registrar a origem da massa e não contar isso como sucesso da função testada. |
| PC-05 | **Apoio da IA (Claude Code)** para conferir na API/banco se cadastros, edições, status e auditoria foram realmente gravados, quando os passos pedirem. Cauan executa a UI. |
| PC-06 | Na implementação do PR, links diretos: web `http://localhost:3000/frota`, `/frota/cadastrar` e `/frota/editar?id=<id exibido pelo app>`; Expo Go `exp://<IP do computador>:8081/--/frota`, com os mesmos sufixos. O id de navegação pode ser artificial: pedir à IA para identificar o item pela placa real, que é a chave da API. |
| PC-07 | CT-013 depende de escalação real (HU-016/017) e histórico disponível. Registrar datas/fuso e massa pela API/banco quando a UI não permitir prepará-la. Sem a dependência, marcar 🚫 na execução. |

## Resumo da execução

Executar na ordem abaixo, respeitando PC-01. São **13 casos essenciais**, em três seções. Os IDs completos usam `CT-HU009-UI-`, de 001 a 013. Nas variações, registrar cada resultado; não marcar o caso como aprovado se uma entrada falhar. Os passos descrevem a implementação do PR #179 e devem ser conferidos no commit escolhido para execução.

### Seção A — Listagem e cadastro

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU009-UI-001 | Abrir a frota, buscar e conferir lista vazia | Banco vazio; depois um ativo e um inativo; placa/nome e busca inexistente | Sem exemplos inventados; só ativos por padrão; capacidades e busca corretas | ❌ FALHOU | Com o banco vazio a lista mostra os ônibus de exemplo (`OCR-1234`, `OCR-5521`, `OCR-8890`), a chave “Mostrar inativos” vem ligada e a seta volta ao Painel. Busca e massa corretas. |
| CT-HU009-UI-002 | Cadastrar e conferir persistência | `QXD2E45`, 44 assentos, 20 em pé | Confirmação, sucesso, listagem atualizada e registro na API após reabrir | ❌ FALHOU | Cancelar não grava e confirmar cria o ônibus corretamente, mas a mensagem de sucesso é uma barra preta, fora do padrão de pop-up, e o texto difere do requisito. |
| CT-HU009-UI-003 | Normalizar placa e evitar duplicidade contra exemplos | `ABC-1234`, `def-2g34`, `OCR-1234` inexistentes no banco | Maiúsculas/sem hífen; formatos aceitos; exemplo interno não bloqueia cadastro legítimo | ❌ FALHOU | `ABC-1234` e `def-2g34` são gravadas sem hífen e em maiúsculas, mas `OCR-1234` é bloqueada pelo app com “Este veículo já está registrado.” por causa da lista de exemplo, sem chamar a API. |
| CT-HU009-UI-004 | Bloquear duplicidade de placa ativa e inativa | `QXD2E45` e variações; `XYZ9K87` inativo | “Este veículo já está registrado.”; nenhum novo registro | ✅ PASSOU | As seis tentativas (`QXD2E45`, `qxd2e45`, `QXD-2E45`, com espaços, `XYZ9K87`, `xyz-9k87`) foram barradas pelo servidor (`409`). Nenhum registro novo. |
| CT-HU009-UI-005 | Obrigatórios no cadastro e na edição | Cada campo vazio; placa só com espaços; capacidade em pé apagada versus zero | Destaque e bloqueio; apagar não vira zero; dados anteriores preservados | ❌ FALHOU | Placa e assentos vazios são destacados e barrados, mas a capacidade em pé vazia (ou só com espaços) é aceita e gravada como `0`, no cadastro e na edição. Na edição, `QXD2E45` passou de 20 para 0 em pé sem aviso. |
| CT-HU009-UI-006 | Rejeitar formato inválido de placa | Letras, números, tamanho, posição e símbolo incorretos | “Placa inválida.”; sem cadastro nem edição | ❌ FALHOU | `ABCDEFG`, `1234567`, `AB1234`, `ABC12345`, `A1C1D23` e `ABC@1D2` foram barradas, mas `GHI@3J45` foi aceita e gravada como `GHI3J45`: o app apagou o `@` e transformou a placa inválida em outra válida. |
| CT-HU009-UI-007 | Validar fronteiras e inteiros das capacidades | Assentos −1/0/1; em pé −1/0/1; texto e decimal | Inválidos bloqueados no campo; 1 assento/0 em pé aceitos | ❌ FALHOU | Decimais (`4.5`, `2.5`) passam pelo app e só a API recusa, com mensagem sem o nome do campo (repetida quando os dois campos são inválidos). Número grande (`883833333333`) causa erro 500 na API sem CORS e o app mostra sucesso falso. |

### Seção B — Edição, inativação e reativação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU009-UI-008 | Editar placa e capacidades; impedir colisão | `QXD2E45` → `QXD2E46`, 40/15; tentar `ABC1D23` | Sucesso persistido; só ônibus escolhido muda; duplicidade bloqueada | ❌ FALHOU | A edição funciona e persiste (`QXD2E45` virou `QXD2E46`, 40/15, sem criar segundo cadastro) e as placas duplicadas foram barradas pelo servidor (`409`), mas a mensagem de sucesso é a barra preta fora do padrão (“Ônibus alterado com sucesso”). |
| CT-HU009-UI-009 | Cancelar e confirmar inativação do ônibus correto | Ônibus real sem alocação futura; outro veículo para comparação | Cancelar não muda; confirmar inativa só o selecionado e preserva o registro | ❌ FALHOU | Cancelar não inativa, mas confirmar a inativação falha: o app chama `PATCH /onibus/7/inativar` (número da linha, não a placa), a API responde `404` e o pop-up mostra “Request failed with status code 404”. Não é possível inativar um ônibus real pela tela. |
| CT-HU009-UI-010 | Mostrar inativos e reativar | `XYZ9K87` inativo; cancelar e confirmar reativação | Inativo identificado; só selecionado reativado; persistência e erro visível se falhar | ❌ FALHOU | Confirmar a reativação de `XYZ9K87` falha: o app chama `PATCH /onibus/8/ativar` (número da linha, não a placa) e a API responde `404`; o ônibus continua inativo. Mesma causa do CT-009. |

### Seção C — Integração, acesso e robustez

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU009-UI-011 | Impedir acesso de aluno e representante | Menus e links diretos de lista/cadastro/edição | Sem menu; Acesso Negado; sem dados ou ações administrativas | ✅ PASSOU | Aluno: o testador relatou que o menu Frota não aparece e que os links diretos levam a Acesso Negado. Representante: não foi possível entrar (“Perfil incompatível”); essa parte ficou bloqueada e é registrada à parte, a pedido do testador. |
| CT-HU009-UI-012 | Falha de conexão sem sucesso falso | Abrir lista, cadastrar, editar e mudar status com API inacessível | Mensagem clara; sem exemplos nem sucesso não persistido; recuperação consistente | ❌ FALHOU | Reprovado pela leitura do código (não derrubado na tela, a pedido do testador): sem API a lista mostra os exemplos como dados reais e o cadastro devolve sucesso falso criando o ônibus só na memória. O sucesso falso do cadastro já foi visto na tela no CT-007. |
| CT-HU009-UI-013 | Bloquear alocação futura, excluir inativos da seleção e preservar histórico | Alocação amanhã; só histórico passado; ônibus inativo | Bloqueio correto na futura; passado preservado; inativo fora de nova escala | 🚫 BLOQUEADO | Sem escalação nem alocação no ambiente (HU-016/017 não implementadas), a regra de alocação futura e a seleção de ônibus na escalação não podem ser exercitadas pela tela. |

## Detalhamento dos casos

### Seção A — Listagem e cadastro

#### CT-HU009-UI-001 — Abrir a frota, buscar e conferir lista vazia

**Dados de entrada:** banco sem ônibus; depois massa PC-04; buscas `ABC1`, parte do nome/apelido real e `SEMRESULTADO`.

**Passos**

1. Conferir PC-01. Como administrador, tocar em **Cadastros** → **Frota**.
2. Com banco vazio, observar a listagem e pedir à IA para confirmar `GET /onibus` vazio (PC-05).
3. Pedir à IA para preparar PC-04; sair e voltar à tela. Conferir placa, assentos, capacidade em pé, busca, botão **+ Novo** e chave **Mostrar inativos**.
4. Sem tocar na chave, conferir os registros exibidos. Buscar parte da placa, limpar, buscar parte de um nome real e depois um texto inexistente.
5. Tocar na seta de voltar.

**Resultado esperado**

- Banco vazio: mensagem de lista vazia; não mostrar `OCR-1234`, `OCR-5521` ou `OCR-8890` que não existam no banco.
- Com massa: listagem inicial só de ativos, com placa e capacidades corretas; **Mostrar inativos** começa desligada (AC-01, AC-11).
- Busca encontra o item correspondente; texto inexistente mostra lista vazia, sem inventar outro veículo.
- A seta volta a **Cadastros**. Se a tela não existir na versão escolhida, registrar impedimento de ambiente; não seguir os passos internos como se tivessem sido executados.

**Resultado obtido**

- **Banco vazio** (`GET /onibus` devolveu `[]`): a listagem mostrou os ônibus de exemplo `OCR-1234`, `OCR-5521` e `OCR-8890`, que não existem no banco, um deles na lista de inativos. Pelo código, `frotaService.listarOnibus` usa a lista de exemplo (`ONIBUS_MOCK`) sempre que a API devolve lista vazia.
- A chave **Mostrar inativos** já vem **ligada**; o esperado é desligada (AC-01, AC-11). Na tela, `frota/index.tsx` inicia o estado com `useState(true)`.
- **Com a massa** (PC-04, preparada pela API: `ABC1D23` ativo, 44 assentos e 20 em pé; `XYZ9K87` inativo, 32 e 0): a listagem mostra os dois ônibus, o ativo entre as ativas e o inativo identificado; os exemplos somem porque a API deixou de devolver lista vazia. A busca filtra corretamente.
- **Defeito:** a seta de voltar leva ao **Painel**, e não a **Cadastros**; ao abrir **Novo** e **Editar**, a seta também leva ao Painel, e não à listagem **Frota**. As telas **Cadastrar** e **Editar** reabrem com os dados da vez anterior, sem limpar. É o mesmo defeito da HU-007 ([#245](https://github.com/GOUOCE/GOUCE-app/issues/245)) e da HU-008 ([#256](https://github.com/GOUOCE/GOUCE-app/issues/256)): as telas ficam numa aba oculta e `router.back()` cai na primeira aba (`frota/index.tsx`, `cadastrar.tsx` e `editar.tsx`).
- Status: ❌ Falhou.

---

#### CT-HU009-UI-002 — Cadastrar e conferir persistência

**Dados de entrada:** placa `QXD2E45`, **Qtd. de Assentos** `44`, **Capac. Máxima em Pé** `20`.

**Passos**

1. Tocar em **+ Novo**; conferir **Cadastrar Ônibus** e preencher os três campos, sem foto.
2. Tocar em **Finalizar cadastro**; no diálogo, cancelar e conferir que os campos continuam preenchidos. Pedir à IA para confirmar que não houve criação (PC-05).
3. Repetir e tocar em **Confirmar**; anotar a mensagem e conferir a listagem.
4. Fechar completamente o app e abrir novamente; na web, recarregar a página.
5. Pedir à IA para conferir `GET /onibus/QXD2E45` e o registro no banco (PC-05).

**Resultado esperado**

- Cancelar não grava; confirmar cria o veículo ativo, com 44 assentos e 20 em pé (AC-02).
- Exibir “Operação realizada com sucesso” e atualizar a listagem (AC-07). Registrar o texto exato se a tela usar outra mensagem.
- O registro continua após reabrir e existe na API com os valores corretos. Sucesso apenas na memória do app não aprova o caso.
- Foto não exigida pelo fluxo principal da HU.

**Resultado obtido**

- Ao tocar em **Finalizar cadastro** aparece o diálogo “Realizar cadastro?” (“Essa ação não poderá ser desfeita.”). Em **Cancelar**, os campos continuam preenchidos e nada é criado: o log da API não registrou `POST /onibus` até a confirmação.
- Em **Confirmar**, o cadastro é feito: `POST /onibus` com `201`; no banco, `QXD2E45` com 44 assentos e 20 em pé, ativo, sem foto. Foi criado um único registro.
- **Defeito:** o sucesso aparece como uma **barra preta (toast)** na parte de baixo da tela, que some rápido, com o texto “Ônibus cadastrado com sucesso” (`frota/cadastrar.tsx`), fora do padrão de pop-up de sucesso do app e diferente da mensagem do requisito (“Operação realizada com sucesso”, AC-07). A edição segue o mesmo padrão (“Ônibus alterado com sucesso”, `frota/editar.tsx`), e a inativação e a reativação mostram “Ônibus inativado” e “Ônibus reativado” na mesma barra. Mesmo defeito da HU-008 ([#260](https://github.com/GOUOCE/GOUCE-app/issues/260)).
- O cadastro não gerou registro em `log_auditoria` (só a inativação feita na preparação da massa): já aberto na suíte de API ([#230](https://github.com/GOUOCE/GOUCE-app/issues/230)).
- Status: ❌ Falhou.

---

#### CT-HU009-UI-003 — Normalizar placa e evitar duplicidade contra exemplos

**Dados de entrada:** três cadastros separados, com 44 assentos e 0 em pé: `ABC-1234`, `def-2g34` e `OCR-1234`. Pedir à IA para confirmar antes que nenhuma das três placas existe na API/banco (PC-05).

**Passos**

1. Cadastrar a placa antiga `ABC-1234` e conferir a listagem.
2. Cadastrar `def-2g34`, usando minúsculas e hífen, e conferir.
3. Tentar cadastrar `OCR-1234`, que existe na lista de exemplo do PR, mas deve estar ausente do banco neste cenário.
4. Reabrir o app e pedir à IA para conferir as placas guardadas na API/banco (PC-05).

**Resultado esperado**

- Os três cadastros são válidos: `ABC1234`, `DEF2G34` e `OCR1234`, ativos, com 44/0 (AC-02, AC-03, AC-09, AC-10).
- A placa fica em maiúsculas e sem hífen; não confundir a apresentação com o valor gravado.
- A presença de `OCR-1234` em um exemplo interno não pode bloquear um cadastro legítimo. Bloqueio sem registro real é falha, não duplicidade aprovada.

**Resultado obtido**

- Antes de começar, nenhuma das três placas existia no banco.
- `ABC-1234` (44 assentos, 0 em pé): cadastrada. No banco ficou `ABC1234`, ativo, 44/0 (`POST /onibus` com `201`).
- `def-2g34`: cadastrada e gravada como `DEF2G34`, ativa. O testador usou 33 assentos e 343 em pé em vez de 44/0, então o caso vale apenas para a normalização da placa (minúsculas e hífen removidos). O sistema não impõe limite de capacidade em pé em relação aos assentos.
- `OCR-1234`: o app bloqueia com o pop-up “Este veículo já está registrado.” O log da API não registrou nenhum `POST /onibus` e o banco não tem `OCR1234`. A causa está em `frotaService.criarOnibus`, que compara a placa com a lista de exemplo do app (`ONIBUS_MOCK`: `OCR-1234`, `OCR-5521`, `OCR-8890`) antes de chamar a API. Isso impede o cadastro legítimo dessas três placas, exatamente o que o caso proíbe.
- A listagem mostra a placa junta, sem hífen (`ABC1234`), o que está correto: o requisito pede a placa guardada normalizada (AC-02/AC-03).
- **Sugestão do testador (melhoria, sem requisito):** o campo hoje só põe em maiúsculas ao digitar. Ao enviar, o `frotaSchema` apaga tudo que não é letra ou número e só então valida. Pedir limite de 7 caracteres e bloquear emoji e caracteres especiais já na digitação (mesma linha da [#261](https://github.com/GOUOCE/GOUCE-app/issues/261)).
- Status: ❌ Falhou.

---

#### CT-HU009-UI-004 — Bloquear duplicidade de placa ativa e inativa

**Dados de entrada:** novas tentativas com `QXD2E45`, `qxd2e45`, `QXD-2E45`, `  QXD2E45  ` e `XYZ9K87`/`xyz-9k87` (inativo), sempre com capacidades válidas.

**Passos**

1. Preencher e tentar finalizar cada cadastro separadamente.
2. Anotar a mensagem de cada variação; voltar à listagem.
3. Pedir à IA para conferir a quantidade de registros e se algum duplicado foi criado (PC-05).

**Resultado esperado**

- Bloquear todas as tentativas com “Este veículo já está registrado.” (AC-03, FA-002).
- Ignorar caixa, hífen e espaços nas pontas; considerar também o registro inativo.
- Nenhum cadastro novo nem mudança nos existentes. A duplicidade na edição é coberta no CT-008.

**Resultado obtido**

- Foram feitas as seis tentativas, uma por vez, com 40 assentos e 5 em pé: `QXD2E45`, `qxd2e45`, `QXD-2E45`, `  QXD2E45  `, `XYZ9K87` (inativa) e `xyz-9k87`. Em todas o testador relatou o bloqueio com a mensagem de duplicidade (no código: “Este veículo já está registrado.”, `frota/cadastrar.tsx`).
- O log da API registrou seis `POST /onibus` com `409 Conflict`, ou seja, quem barrou foi o servidor, não uma regra do app. (Na primeira tentativa houve antes um `401` e a renovação automática do login, seguida do `409`.)
- Banco depois dos testes: continua com as mesmas cinco placas (`ABC1234`, `ABC1D23`, `DEF2G34`, `QXD2E45`, `XYZ9K87`), uma só `QXD2E45` e `XYZ9K87` ainda inativa com 32/0. Nenhum duplicado foi criado e nada existente mudou.
- Status: ✅ Passou.

---

#### CT-HU009-UI-005 — Obrigatórios no cadastro e na edição

**Dados de entrada:** no cadastro, todos vazios; depois deixar só um obrigatório vazio por tentativa e os demais válidos (`OBR1A01`, 44, 20); placa só com espaços. Na edição de `QXD2E45`, apagar separadamente placa, assentos e capacidade em pé.

**Passos**

1. No cadastro, tocar em **Finalizar cadastro** em cada situação; observar destaque e orientação de cada campo.
2. Abrir o lápis de `QXD2E45`; apagar um campo por tentativa e tocar em **Salvar alterações**. Reabrir o registro entre variações para recuperar os dados originais.
3. Comparar capacidade em pé apagada com o número `0` digitado explicitamente.
4. Pedir à IA para conferir ausência de criação e de alteração dos dados da edição (PC-05).

**Resultado esperado**

- Campo vazio ou placa só com espaços é destacado com mensagem em português; salvamento bloqueado no cadastro e na edição (AC-08, FA-003).
- Apagar capacidade em pé não pode virar `0` automaticamente. Zero **digitado** é válido, conforme CT-007.
- Nenhum ônibus incompleto criado; a edição recusada mantém placa e capacidades anteriores. Não basta exibir um aviso e ainda salvar.

**Resultado obtido**

- **Cadastro (parte A):** com placa vazia, assentos vazios, placa só com espaços e tudo vazio, o testador relatou os campos obrigatórios destacados e o salvamento bloqueado. Com a **capacidade em pé vazia** (placa `HDO0009`, 33 assentos), o app **aceitou**, mostrou o pop-up de confirmação e criou o ônibus: `POST /onibus` com `201` e, no banco, `HDO0009` com 33 assentos e **0 em pé**.
- **Edição (parte B):** apagar placa e assentos foi barrado, segundo o testador. Apagar a **capacidade em pé** (ou deixá-la só com espaços) salvou: o log tem `PATCH /onibus/QXD2E45` com `200` e `QXD2E45` passou de **20 para 0** em pé no banco, sem nenhum aviso. Foram dois `PATCH` com `200` no log, e não foi possível separar qual variação gerou cada um.
- **Causa:** `frotaSchema.ts` usa `z.coerce.number()` na capacidade em pé, que converte o campo vazio (e `"  "`) em `0`, e `0` é um valor válido. O formulário nunca vê o campo como vazio. Cadastro e edição usam o mesmo schema. Na API, `Form(0, ...)` (`onibus_routes.py:224`) também assume `0` quando o campo não vem ([#226](https://github.com/GOUOCE/GOUCE-app/issues/226)).
- **Divergência com o requisito:** o AC-08 e o resultado esperado deste caso pedem campo vazio destacado e salvamento bloqueado; apagar não pode virar `0` sozinho. O testador considera o comportamento coerente (vazio = 0, a listagem mostra `0`), mas ele não foi aprovado pelo requisito atual. Fica como decisão de produto: manter o `0` automático e ajustar o AC-08, ou exigir o campo preenchido.
- A mensagem de sucesso da edição e do cadastro é a barra preta fora do padrão (defeito já registrado no CT-002).
- Status: ❌ Falhou.

---

#### CT-HU009-UI-006 — Rejeitar formato inválido de placa

**Dados de entrada:** cadastro com placa `ABCDEFG`, `1234567`, `AB1234`, `ABC12345`, `A1C1D23`, `ABC@1D2` e `GHI@3J45`, uma por tentativa; 44 assentos/20 em pé. Na edição de `QXD2E45`, repetir `AB1234` e `GHI@3J45`.

**Passos**

1. Digitar ou colar cada placa e tentar salvar; anotar o texto e o campo destacado.
2. Repetir as duas variações na edição.
3. Pedir à IA para conferir que nada foi criado ou renomeado (PC-05).

**Resultado esperado**

- Exibir “Placa inválida.” e bloquear o salvamento, mantendo os outros campos preenchidos (AC-09).
- Aceitar apenas formato Mercosul ou antigo; não apagar silenciosamente símbolos para transformar uma placa inválida em outra válida.
- `QXD2E45` mantém os dados. Caso o teclado impeça alguma entrada no celular, registrar essa proteção e conferir a variação na web, se disponível, sem declarar a validação de servidor aprovada por isso.

**Resultado obtido**

- **Cadastro:** `ABCDEFG`, `1234567`, `AB1234`, `ABC12345`, `A1C1D23` e `ABC@1D2` foram barradas na tela, segundo o testador, e o log não registrou `POST /onibus` para elas.
- **`GHI@3J45` foi aceita.** O log registrou `POST /onibus` com `201` e o banco ganhou `GHI3J45` (33 assentos, 9 em pé; o testador usou esses valores em vez de 44/20). O `@` foi apagado e a placa inválida virou outra válida no formato Mercosul, o que o caso proíbe.
- **Causa:** `frotaSchema.ts` aplica `.replace(/[^A-Za-z0-9]/g, '')` antes de validar o formato, então qualquer símbolo é descartado em silêncio. Só `ABC@1D2` foi barrada porque, sem o `@`, sobram 6 caracteres (`ABC1D2`). A API tem o mesmo problema ([#225](https://github.com/GOUOCE/GOUCE-app/issues/225), [#227](https://github.com/GOUOCE/GOUCE-app/issues/227)).
- **Edição (parte B):** não executada, porque o caso já está reprovado. O `editar.tsx` usa o mesmo `frotaSchema`, então o comportamento esperado é o mesmo, mas isso não foi testado na tela.
- Status: ❌ Falhou.

---

#### CT-HU009-UI-007 — Validar fronteiras e inteiros das capacidades

**Dados de entrada:** cadastro com placa válida ainda inexistente `LIM1A01`; depois edição do veículo criado. Alterar um campo por tentativa, mantendo o outro válido.

| Campo | Inválidos | Fronteiras válidas |
| --- | --- | --- |
| Qtd. de Assentos | `-1`, `0`, `abc`, `4.5` | `1` |
| Capac. Máxima em Pé | `-1`, `abc`, `2.5` | `0`, `1` |

**Passos**

1. Tentar cadastrar cada variação inválida; usar digitação/colar ou a web para texto e decimal, anotando restrições do teclado.
2. Cadastrar com `1` assento e `0` em pé; conferir o sucesso e reabrir.
3. Na edição, repetir assentos `0` e `4.5` e em pé `-1` e `2.5`; depois salvar em pé `1`.
4. Pedir à IA para conferir os valores válidos e a ausência de alteração pelas tentativas inválidas (PC-05). Se um inválido do cadastro for aceito, registrar e usar placa nova na próxima tentativa para evitar duplicidade mascarando o problema.

**Resultado esperado**

- Só inteiros: assentos ≥ 1 e em pé ≥ 0; inválidos destacados e bloqueados, sem truncar ou arredondar (AC-10).
- `1` assento/`0` em pé aceitos e persistidos; edição para `1` em pé também aceita.
- Não há texto exato definido para erro numérico: verificar clareza, português e indicação do campo, sem criar regra de limite máximo.
- Se o frontend aceitar decimal e a API rejeitar, registrar falha na validação do campo; o erro retornado ainda deve ser mostrado ao usuário.

**Resultado obtido**

*Visto na tela (cadastro)*

- Assentos `0`/negativo e capacidade em pé negativa são barrados pelo app (`frotaSchema.ts`: “A quantidade de assentos deve ser maior que zero” e “A capacidade em pé não pode ser negativa”).
- **Decimal passa pelo app:** o `frotaSchema` não exige inteiro (sem `.int()`). Com `4.5` em assentos ou `2.5` em pé, o app aceita, abre a confirmação e envia; quem recusa é a API (`422`). O requisito (AC-10) pede que o campo seja destacado como inválido na tela.
- **Mensagem sem o campo:** a API devolve `{"field":"assentos","message":"Informe um número válido."}`, mas `getErrorMessage` (`utils/errorUtils.ts`) exibe só o texto no pop-up “Aviso”, sem dizer qual campo está errado. Com os dois campos inválidos, a mesma frase aparece **duas vezes**. Reproduzido também chamando a API direto.
- **Número grande, `883833333333` em pé:** a API responde `500 Internal Server Error` (`psycopg2.errors.NumericValueOutOfRange: integer out of range`; as colunas são `integer`) e a resposta de 500 sai **sem cabeçalho CORS**, então o navegador entrega “Network Error” ao app. `frotaService.criarOnibus` trata “sem resposta” como API fora do ar, cria o ônibus só na memória (`ONIBUS_MOCK.unshift`) e **mostra a barra preta de sucesso**. O ônibus não foi gravado (conferido no banco) e não aparece na listagem após recarregar. O mesmo 500 acontece com assentos grandes.
- **Número gigante, `333333333333333333333353`:** a API recusa com `422` e o app mostra o pop-up “Informe um número válido.” (mesma falta de nome do campo).
- Cadastro `LIM1A01` com 1 assento e 10 em pé: `201`. Em seguida o testador editou a mesma placa para 0 em pé: `PATCH /onibus/LIM1A01` com `200`, e o banco ficou com 1 assento e 0 em pé (fronteira válida aceita e persistida). O cadastro direto com 1/0 não foi repetido na tela; pelo código usa o mesmo schema (assentos ≥ 1, em pé ≥ 0).

*Confirmado pela API e pelo código (não repetido na tela)*

- **Edição:** `editar.tsx` usa o mesmo `frotaSchema`, então decimais passam pelo app. Chamando `PATCH /onibus/LIM1A01` com assentos `0`, `-1`, `4.5` e em pé `-1`, `2.5`, a API responde `422` e o banco permanece 1/0 (nada foi alterado). Com em pé `883833333333` responde `500`; como `atualizarOnibus` só cai no exemplo interno quando o ônibus está na lista de exemplo, a tela deve mostrar erro de conexão enganoso, e não sucesso.
- A edição para em pé `1` não foi executada.
- Não foi criada regra de limite máximo: o que falta é tratar o estouro e devolver erro claro (`422`) em vez de `500`.
- Status: ❌ Falhou.

### Seção B — Edição, inativação e reativação

#### CT-HU009-UI-008 — Editar placa e capacidades; impedir colisão

**Dados de entrada:** `QXD2E45` → `QXD2E46`, 40 assentos/15 em pé; depois tentar mudar para `ABC1D23` e `ABC-1D23`, já usadas por outro veículo.

**Passos**

1. No lápis de `QXD2E45`, conferir os valores preenchidos e o ônibus selecionado.
2. Alterar placa e capacidades, tocar em **Salvar alterações** e anotar a mensagem.
3. Reabrir pela listagem e conferir; fechar o app e abrir novamente.
4. Tentar editar para cada placa duplicada e conferir o bloqueio.
5. Alterar um campo sem salvar, voltar e reabrir; conferir que a mudança não foi persistida.
6. Pedir à IA para conferir `GET /onibus/QXD2E46`, ausência da placa antiga e os dados de `ABC1D23` (PC-05).

**Resultado esperado**

- Edição válida: “Operação realizada com sucesso”, listagem atualizada e valores persistidos após reabrir (AC-04, AC-07).
- Somente o ônibus selecionado muda; não nasce um segundo cadastro. A identificação artificial do app não pode levar a editar outro veículo.
- Duplicidade: “Este veículo já está registrado.”; manter `QXD2E46` e 40/15 (AC-03, FA-002).
- Sair sem salvar mantém os dados gravados. Não se exige neste caso um diálogo de descarte que não está definido nos critérios da HU.

**Resultado obtido**

- **Edição válida:** o lápis de `QXD2E45` abriu o ônibus correto. Salvando `QXD2E46`, 40 assentos e 15 em pé, o log registrou `PATCH /onibus/QXD2E45` com `200`. No banco, a placa antiga não existe mais e `QXD2E46` está ativa com 40/15; os demais ônibus não mudaram (`ABC1D23` continua 44/20) e não nasceu um segundo cadastro. Houve ainda um segundo `PATCH /onibus/QXD2E46` com `200` (novo salvamento do mesmo registro, que terminou com os valores esperados).
- **Duplicidade:** as tentativas de mudar para `ABC1D23` e `ABC-1D23` geraram dois `PATCH /onibus/QXD2E46` com `409 Conflict`; o servidor barrou e `QXD2E46` manteve 40/15.
- **Reabrir, recarregar e sair sem salvar:** relatados como corretos pelo testador; não há marca no log para isso.
- **Defeito:** a mensagem de sucesso da edição é a barra preta “Ônibus alterado com sucesso” (`frota/editar.tsx`), fora do padrão de pop-up e diferente do requisito (“Operação realizada com sucesso”, AC-07); mesmo defeito registrado no CT-002.
- A edição não gerou registro de auditoria (já aberto na API, [#230](https://github.com/GOUOCE/GOUCE-app/issues/230)).
- Status: ❌ Falhou apenas pela mensagem; as regras de dados (AC-03, AC-04) foram atendidas.

---

#### CT-HU009-UI-009 — Cancelar e confirmar inativação do ônibus correto

**Dados de entrada:** `QXD2E46` ativo, sem alocações futuras, e `ABC1D23` ativo para comparação. Se a edição anterior falhou, pedir à IA para preparar um ônibus real com placa identificada e registrar o preparo (PC-05).

**Passos**

1. Pedir à IA para confirmar placas/status e ausência de alocação futura no banco (PC-05).
2. Tocar na lixeira do veículo escolhido; ler **Inativar ônibus?**; tocar em **Cancelar** e conferir que continua ativo.
3. Repetir e confirmar **Inativar**; anotar mensagem e resultado na listagem.
4. Pedir à IA para conferir o registro, o status e a auditoria do escolhido e do outro veículo na API/banco (PC-05).
5. Fechar e reabrir o app; ligar **Mostrar inativos** e localizar o escolhido.

**Resultado esperado**

- Cancelar não altera status nem gera log de inativação.
- Confirmar mostra “Operação realizada com sucesso”; só o veículo escolhido sai dos ativos e permanece no banco como inativo, inclusive após reabrir (AC-05, AC-07, AC-12).
- O outro ônibus continua ativo. Mensagem de alocação pendente sem vínculo futuro real é falha; o exemplo “Ônibus 04” não substitui uma consulta de alocações.
- Se a rota errada ou a auditoria causar erro, exibir uma mensagem clara; não mostrar sucesso nem alterar outro ônibus. Registrar retorno real com apoio da IA, sem atribuir automaticamente o erro à coluna Integer.

**Resultado obtido**

- **Preparo (PC-05):** `QXD2E46` e `ABC1D23` ativos; nenhuma tabela do banco liga ônibus a viagem ou alocação, então não havia alocação futura. A auditoria de ônibus tinha só a inativação de `XYZ9K87` feita na preparação (id 34).
- **Cancelar:** o pop-up “Inativar ônibus?” (“O ônibus não estará mais disponível para alocações.”) foi cancelado e `QXD2E46` continuou ativo na lista; o log não registrou nenhum `PATCH .../inativar` nessa etapa.
- **Confirmar:** pop-up de erro “Inativação Bloqueada” com o texto técnico **“Request failed with status code 404”**. O log registrou três `PATCH /onibus/7/inativar` com `404 Not Found` (uma por tentativa). O banco manteve `QXD2E46` ativo e a auditoria não ganhou registro; nenhum outro ônibus foi alterado.
- **Causa:** a API não devolve `id` para ônibus (a chave é a placa). Na listagem, `frotaService.listarOnibus` inventa `id: o.id || idx + 1` e `frota/index.tsx` chama `inativarOnibus(item.id)`. `QXD2E46` é a 7ª linha, então a URL virou `/onibus/7/inativar`, mas a rota espera a placa (`/onibus/{placa}/inativar`). O app só troca o número pela placa se o ônibus estiver na lista de exemplo (`ONIBUS_MOCK`, ids 1 a 3); pelo código, as três primeiras linhas da lista usariam as placas de exemplo (`OCR-1234`, `OCR-5521`, `OCR-8890`) e não as reais (não testado na tela).
- **Efeito:** a inativação (AC-05) não funciona pela tela com dados reais; a reativação usa o mesmo caminho e deve falhar igual (CT-010).
- **Mensagem:** o texto do pop-up é o erro técnico do Axios, sem orientação ao usuário.
- Passos 3 a 5 (mensagem de sucesso, auditoria do escolhido e conferência após reabrir) não puderam ser executados, porque a inativação não acontece.
- Status: ❌ Falhou (bloqueia a inativação).

---

#### CT-HU009-UI-010 — Mostrar inativos e reativar

**Dados de entrada:** `XYZ9K87` inativo da PC-04. Usar massa preparada se o CT-009 falhar, registrando a origem; isso não aprova a inativação.

**Passos**

1. Ligar **Mostrar inativos** e localizar `XYZ9K87`, conferindo placa, capacidades e identificação de inativo.
2. Tocar no ícone de reativar; ler **Reativar ônibus?** e cancelar. Pedir à IA para confirmar status mantido e ausência de novo log (PC-05).
3. Repetir e confirmar **Reativar**; anotar mensagem e desligar a chave.
4. Fechar e reabrir o app. Pedir à IA para conferir o status na API/banco, o log e se outro ônibus foi afetado (PC-05).

**Resultado esperado**

- Chave ligada mostra inativos identificados; desligada, só ativos (AC-11).
- Cancelar mantém inativo; confirmar mostra “Operação realizada com sucesso” e devolve **o veículo selecionado** aos ativos, com persistência e auditoria (AC-05, AC-07, AC-12).
- Se a API recusar a reativação, a tela deve mostrar o erro. Falhar apenas no console, sem feedback visível, é falha de UI.

**Resultado obtido**

- **Massa:** `XYZ9K87` (32 assentos, 0 em pé), inativa desde a preparação (auditoria id 34, feita via API e não pela tela).
- **Cancelar:** o log não registrou nenhuma chamada além das tentativas de confirmação, e o ônibus permaneceu inativo.
- **Confirmar a reativação:** o log registrou duas vezes `PATCH /onibus/8/ativar` com `404 Not Found`. O número `8` é a posição de `XYZ9K87` na listagem, e não a placa. A causa é a mesma do CT-009 (`id: o.id || idx + 1` em `frotaService.listarOnibus`, repassado por `frota/index.tsx` a `reativarOnibus`, que só troca pelo valor correto se o ônibus estiver na lista de exemplo).
- **Resultado no banco:** `XYZ9K87` continua inativa (`ativo = f`); a auditoria não ganhou registro de reativação; nenhum outro ônibus foi alterado.
- A aparência da lista de inativos (identificação, chave ligada/desligada) e a mensagem exibida na tela de erro não foram detalhadas pelo testador nesta execução; a chave já vem ligada por padrão (defeito do CT-001).
- Status: ❌ Falhou (reativação impossível pela tela com dados reais).

### Seção C — Integração, acesso e robustez

#### CT-HU009-UI-011 — Impedir acesso de aluno e representante

**Dados de entrada:** credenciais PC-03 e links diretos PC-06 para lista, cadastro e edição de um item real.

**Passos**

1. Entrar como aluno e conferir os menus.
2. Abrir cada link direto; observar a tela desde o início.
3. Repetir com representante. Se o login não funcionar, registrar esse impedimento separadamente.

**Resultado esperado**

- Menu **Frota** não aparece para aluno nem representante (RN-006).
- Links direcionam para **Acesso Negado**, sem expor lista, formulário ou ações administrativas, nem brevemente.
- Rota inexistente não comprova proteção: só avaliar links quando a implementação da tela estiver presente (PC-01).
- A autorização das escritas na API é conferida em CT-HU009-API-012; não confundir leitura pública de ativos com permissão para gerenciar a frota.

**Resultado obtido**

- **Aluno** (`qa.hu007.aluno@teste.com`): o testador relatou que o menu **Frota** não aparece e que os links diretos `/frota`, `/frota/cadastrar` e `/frota/editar?id=2` levam a **Acesso Negado**. Não há marca no log da API que comprove ou desminta isso (a proteção é feita pelo app).
- **Representante** (`qa.hu007.rep@teste.com`): 🚫 **bloqueado**. Escolhendo “Sou representante”, o app mostra “Perfil incompatível. Sua conta é do perfil Aluno…”. Conferido: `POST /auth/login` dessa conta devolve `role: "aluno"`, embora ela tenha os dois tipos no banco (`usuario_tipo`: 2 = aluno e 4 = representante). O app compara o perfil escolhido com esse `role` (`AuthContext.tsx`, `signIn`) e recusa. É o mesmo comportamento descrito na [#190](https://github.com/GOUOCE/GOUCE-app/issues/190), que está fechada desde 2026-10-23, mas ainda se reproduz neste ambiente (develop atualizada). Sem entrar como representante, a verificação de Frota e dos links para esse perfil não foi feita.
- **Decisão do testador:** aprovar o caso pelo resultado do aluno e investigar o motivo do representante depois. A aprovação cobre apenas o aluno; o representante segue como pendência.
- Status: ✅ Passou (aluno); representante 🚫 bloqueado, pendente de nova execução.

---

#### CT-HU009-UI-012 — Falha de conexão sem sucesso falso

**Dados de entrada:** administrador; API temporariamente inacessível no ambiente de teste; cadastro `OFF1A01`/44/0; edição de ônibus real para 41 assentos; tentativas de inativar/reativar. Anotar placas e estados antes.

**Passos**

1. Na execução futura, tornar só a API inacessível ao app. No celular, manter o Expo acessível quando necessário; preferir interrupção controlada da API ou bloqueio de suas requisições no ambiente de teste, sem confundir a perda do bundle com falha do cadastro.
2. Abrir a listagem e observar erro/dados mostrados.
3. Tentar cadastrar `OFF1A01`, editar um ônibus real e mudar status de um ativo e de um inativo. Se a tela não permitir continuar após a falha da lista, registrar; carregar antes cada formulário com rede e retirar o acesso à API antes da ação.
4. Restaurar a conexão, reabrir a lista e pedir à IA para conferir os dados e logs na API/banco (PC-05).

**Resultado esperado**

- Mensagem clara de conexão em português, sem travamento. Não apresentar exemplos como dados reais nem informar sucesso de escrita sem confirmação da API.
- Campos do cadastro/edição preservados para nova tentativa; não alterar status localmente como se estivesse salvo.
- Após reconectar, `OFF1A01` não existe e dados/status dos ônibus reais continuam anteriores às tentativas sem resposta, conforme conferência da IA. Se houver resposta perdida após gravação, registrar a evidência e reconciliar a listagem com a API, sem duplicar o cadastro.
- Um erro de conexão não pode virar aprovação do fluxo principal por alteração apenas da lista de exemplos.

**Resultado obtido**

- **Não foi derrubada a API.** O testador pediu para não gastar tempo, porque o código da frota usa a lista de exemplo (`ONIBUS_MOCK`) nos caminhos de escrita e o resultado seria sucesso falso. O caso foi avaliado pela leitura de `frontend/src/services/frotaService.ts`. Nada foi alterado no banco; o estado antes é o do teste (`OFF1A01` inexistente, `QXD2E46` 40/15 ativo, `LIM1A01` 1/0 ativo, `XYZ9K87` 32/0 inativo).
- **Listagem:** em `listarOnibus`, o `catch` devolve `ONIBUS_MOCK` (`OCR-1234`, `OCR-5521`, `OCR-8890`) sem aviso, como se fossem os ônibus reais. Não há mensagem de falha de conexão.
- **Cadastro:** em `criarOnibus`, se a chamada não tem resposta (`!error.response`), o app faz `ONIBUS_MOCK.unshift(novoOnibus)` e devolve sucesso; a tela mostra “Ônibus cadastrado com sucesso”. O ônibus só existe na memória. Esse caminho já foi visto na tela no CT-007, quando um erro 500 da API (sem CORS) foi lido como “sem resposta”: sucesso na tela e nada no banco.
- **Edição:** em `atualizarOnibus`, sem resposta o app altera o item de exemplo e devolve sucesso quando o ônibus é encontrado no exemplo por `id` ou placa. Como a listagem numera as linhas de 1 em diante e o exemplo usa os ids 1 a 3, as três primeiras linhas da lista real coincidem com ele (pelo código, sucesso falso). Para as demais linhas, o app lança erro, e a mensagem de conexão aparece.
- **Inativar e reativar:** `inativarOnibus` e `reativarOnibus` têm o mesmo desenho (sem resposta, o exemplo muda para inativo/ativo e retorna sem erro). Valem para as três primeiras linhas; nas outras, erro de conexão. Observação: `OCR-1234` do exemplo tem `alocacoes_pendentes: true`, o que gera a mensagem de alocação pendente sem vínculo real (o caso trata isso como falha).
- **Conclusão:** o requisito de “não informar sucesso de escrita sem confirmação da API” não é atendido (mesma família da [#249](https://github.com/GOUOCE/GOUCE-app/issues/249) e da [#263](https://github.com/GOUOCE/GOUCE-app/issues/263)).
- Status: ❌ Falhou (por análise do código).

---

#### CT-HU009-UI-013 — Bloquear alocação futura, excluir inativos da seleção e preservar histórico

**Dados de entrada:** ônibus A com alocação real para amanhã, B com alocação/relatório somente do passado e C inativo. Preparar por API/banco com apoio da IA quando a UI não permitir, registrando placas, vínculos e fuso (PC-05, PC-07).

**Passos**

1. Conferir as funcionalidades dependentes. Se HU-016/017 ou histórico não estiverem disponíveis, marcar as partes correspondentes como 🚫; não usar `alocacoes_pendentes` da lista de exemplos como prova.
2. Na frota, tentar inativar A e confirmar.
3. Tentar inativar B; pedir à IA para conferir os vínculos/relatórios antes e depois (PC-05).
4. Abrir a seleção real de ônibus na escalação e procurar C; conferir que os ativos disponíveis continuam visíveis.

**Resultado esperado**

- A: bloqueio com “Este veículo possui alocações pendentes e não pode ser inativado no momento.”; mantém ativo, sem log de inativação bem-sucedida (AC-06, FA-001).
- B: passado não provoca bloqueio de alocação futura; inativação válida mantém histórico intacto (AC-05, AC-13, RN-004), conferido pela IA.
- C: ausente das opções de nova escalação (AC-13).
- Erro genérico/500 não prova aplicação da regra de alocação. Ver também CT-HU009-API-013 para a tentativa direta de criar novo vínculo com ônibus inativo.

**Resultado obtido**

- **Dependências (passo 1):** o banco local não tem tabela de escalação, alocação ou viagem ligada a ônibus (só `rota_principal*`, da HU-011, sem coluna de ônibus), a aplicação não tem tela de escalação (HU-016/017) e o `onibus_service.py` não consulta alocações antes de inativar. Sem esses elementos não há como montar o ônibus A (alocação para amanhã), o B (só passado) nem a seleção real de ônibus.
- A inativação pela tela também está quebrada para ônibus reais (CT-009: `404`), então o bloqueio de alocação nem seria alcançado. O `alocacoes_pendentes` dos exemplos não vale como prova (regra do caso).
- Os itens A, B e C ficam sem verificação: a regra AC-06/FA-001 e o AC-13/RN-004 não foram testados.
- Status: 🚫 Bloqueado. Executar de novo quando as HU-016/017 existirem e a inativação funcionar.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 — listagem de ativos e capacidades | Visualiza ônibus ativos com seus limites de ocupação | CT-001 |
| AC-02 — cadastro | Cadastra novo ônibus com sucesso | CT-002, CT-003 |
| AC-03 / FA-002 — normalização e duplicidade | Aceita minúsculas/hífen; bloqueia cadastro e edição duplicados | CT-003, CT-004, CT-008 |
| AC-04 — edição | Edita dados de ônibus existente | CT-008 |
| AC-05 / RF-014 — inativar, reativar e soft delete | Inativa sem alocações futuras; reativa; mantém o registro no banco | CT-009, CT-010, com apoio da IA |
| AC-06 / FA-001 — alocação futura | Bloqueia inativação de ônibus escalado em dia futuro | CT-013 — depende das HU-016/017 |
| AC-07 — mensagem e atualização | Cenários de sucesso | CT-002, CT-003, CT-008, CT-009, CT-010 |
| AC-08 / FA-003 — obrigatórios | Obrigatório ausente no cadastro e esvaziado na edição | CT-005 |
| AC-09 — formato da placa | Bloqueia placa em formato inválido | CT-006; formatos válidos no CT-003 |
| AC-10 — limites e inteiros | Bloqueia quantidade inválida | CT-007 |
| AC-11 — Mostrar inativos | Visualiza inativos; reativa ônibus previamente inativado | CT-001, CT-010 |
| AC-12 / RNF-013 — auditoria | Registra cada operação de escrita no log | CT-009, CT-010 e CT-HU009-API-010, com apoio da IA |
| AC-13 / RN-004 — escalação e histórico | Inativo fora da escalação; históricos preservados | CT-013 — dependências explícitas |
| RN-006 — exclusividade administrativa | Menu não exibido a aluno e representante | CT-011; API em CT-HU009-API-012 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-009, CT-010 | Inativar e reativar ônibus falham com `404`: o app envia o número da linha em vez da placa. **Bloqueante** | [#274](https://github.com/GOUOCE/GOUCE-app/issues/274) |
| CT-001, CT-002 | Telas de frota não recriadas: a seta volta ao Painel e Cadastrar/Editar reabrem com dados anteriores | [#275](https://github.com/GOUOCE/GOUCE-app/issues/275) |
| CT-001 | Chave “Mostrar inativos” já vem ligada na listagem | [#276](https://github.com/GOUOCE/GOUCE-app/issues/276) |
| CT-001, CT-003 | Com o banco vazio a lista mostra ônibus de exemplo, e `OCR-1234`, `OCR-5521` e `OCR-8890` não podem ser cadastradas. **Bloqueante** | [#277](https://github.com/GOUOCE/GOUCE-app/issues/277) |
| CT-002, CT-008 | Mensagens de sucesso em barra preta, fora do padrão de pop-up e com texto diferente do requisito | [#278](https://github.com/GOUOCE/GOUCE-app/issues/278) |
| CT-005 | Capacidade em pé vazia (ou só com espaços) é aceita e gravada como `0`, no cadastro e na edição (decisão de produto pendente) | [#279](https://github.com/GOUOCE/GOUCE-app/issues/279) |
| CT-003, CT-006 | Campo da placa sem limite de 7 caracteres e sem bloqueio de símbolos; `GHI@3J45` é aceita como `GHI3J45` | [#280](https://github.com/GOUOCE/GOUCE-app/issues/280) |
| CT-007 | Decimais passam pela validação do app; o erro da API sai sem o nome do campo e repetido | [#281](https://github.com/GOUOCE/GOUCE-app/issues/281) |
| CT-007 | Número acima do limite do banco causa `500` sem CORS na criação e na edição (Back + Front) | [#282](https://github.com/GOUOCE/GOUCE-app/issues/282) |
| CT-001, CT-007, CT-012 | Sem resposta da API (ou com `500`), o app mostra sucesso falso e usa a lista de exemplo como dado real. **Bloqueante** | [#283](https://github.com/GOUOCE/GOUCE-app/issues/283) |
| CT-011 | Representante não consegue entrar (“Perfil incompatível”) | Já registrado na [#190](https://github.com/GOUOCE/GOUCE-app/issues/190), reaberta, com comentário de que o problema persiste |

## Observações gerais

- Referências: [HU-009, seção 7.3.3](../../../../../docs/requisitos.md), [BDD](../../../../../bdd/features/epico-02/HU-009.feature), [README do BDD](../../../../../bdd/features/epico-02/README.md), [API](../api/API-HU-009.md), [PR #179](https://github.com/GOUOCE/GOUCE-app/pull/179) e [issue #185](https://github.com/GOUOCE/GOUCE-app/issues/185).
- **Atualização (26/10/2026):** o PR #179 foi mesclado e a suíte foi executada na `develop`. O texto abaixo registra a situação da época do planejamento.
- **Situação confirmada em 24/10/2026:** PR #179 aberto (`mergedAt=null`). A referência local `origin/feat/front-hu009` corresponde ao head consultado no GitHub, `63fe38e466a7b5a39af88854b5c66b17a47f81fb`; as telas foram lidas com `git show`, sem checkout, merge ou execução. A suíte descreve essa implementação como preparação para a execução futura, não como tela entregue na branch atual.
- Técnicas: **partição de equivalência** de placas e perfis (CT-003, 004, 006, 011), **valor-limite** (CT-007), **transição de estado** com cancelamento/confirmação (CT-009, 010) e **tabela de decisão** sem alocação / passado / futuro (CT-009, 013). Persistência com apoio da IA evita aprovar sucesso apenas visual.
- **Riscos mapeados no código** do PR #179 (`frontend/src/services/frotaService.ts`, `schemas/frotaSchema.ts` e telas `frota/`):
  - A lista usa exemplos `OCR-1234`, `OCR-5521`, `OCR-8890` quando a API retorna lista vazia ou falha. O cadastro valida duplicidade contra esses exemplos antes de consultar a API (CT-001, 003, 012).
  - Sem resposta da API, cadastro e certas edições/transições alteram exemplos locais e retornam como sucesso. Reabrir e pedir conferência à IA é essencial (CT-002, 008, 009, 010, 012).
  - Como a API não fornece id numérico, a listagem gera `id = idx + 1`. Inativar/reativar procuram esse número nos exemplos e podem usar **a placa do exemplo**, não a do veículo real; sem exemplo correspondente, podem enviar um número na URL. O primeiro id ainda encontra o bloqueio fictício de alocação pendente de “Ônibus 04” (CT-009, 010). Edição refaz a busca por id e também exige conferir a identidade do veículo (CT-008).
  - A chave **Mostrar inativos** começa ligada (CT-001). Mensagens são “Ônibus cadastrado com sucesso”, “Ônibus alterado com sucesso”, “Ônibus inativado” e “Ônibus reativado”, divergindo do texto do AC-07; registrar separadamente da persistência.
  - O schema usa coerção numérica, sem `.int()`: decimais podem passar no front, e capacidade em pé apagada pode virar zero. A normalização da placa remove qualquer caractere não alfanumérico, além do hífen; a rejeição de entradas inválidas merece conferência (CT-005, 006, 007).
  - O erro de reativação só é enviado ao console; a tela pode falhar sem feedback (CT-010).
  - O service envia JSON, mas o backend atual o adapta para Form. Isso é um ponto de integração a conferir, **não uma incompatibilidade confirmada**; ver CT-HU009-API-002.
  - A hipótese de erro na auditoria depende do schema efetivo: ORM Integer, com migration tentando converter para VARCHAR. Não inferir causa de uma falha apenas pela leitura do modelo (CT-009, 010 e suíte API).
- **Dúvidas/divergências para alinhamento:** os casos seguem os requisitos atuais, embora a issue #185 mantenha pendentes a aprovação das regras de placa, capacidades, unicidade com inativos e seleção de novos vínculos. O comentário do BDD sobre mensagem de placa indefinida está desatualizado em relação ao AC-09; texto exato de erro numérico segue sem definição. Confirmar qual versão com a tela do PR será usada na execução.
- **Execução (26/10/2026):** 2 casos passaram (CT-004 e CT-011, este só para o aluno), 10 falharam e 1 ficou bloqueado (CT-013). CT-012 foi avaliado pelo código, sem derrubar a API. Representante não conseguiu entrar (perfil incompatível), ver CT-011. Defeitos e issues na seção “Defeitos encontrados”. Credenciais e dados pessoais foram omitidos das evidências.
