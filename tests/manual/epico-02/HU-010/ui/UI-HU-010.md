# Testes manuais de UI — HU-010 — Gerenciamento de Motoristas

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Gestão de Cadastros Base (EP-002) |
| Funcionalidade | HU-010 — Gerenciamento de Motoristas |
| Camada | UI |
| Tipo de teste | Funcional manual — suíte essencial (baseada em risco) |
| Tela | Painel do administrador → Cadastros → **Motoristas**; **Cadastrar Motorista** e **Editar Motorista** |
| Ambiente 
| Total de casos | 13 |
| Última execução | 2026-10-27 |
| Testador | Cauan Ricardo |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: |
| ❌ Concluída com falhas | 13 | 7 | 6 | 0 | 0 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | Aplicativo/API/banco de teste disponíveis na branch da própria implementação, com nome/commit anotados. Começar sem motoristas para a parte vazia do CT-001. |
| PC-02 | Administrador A logado; abrir **Cadastros → Motoristas**. |
| PC-03 | Credenciais de aluno e representante; login de representante indisponível bloqueia só a respectiva parte do CT-011. Sessão vencida: entrar novamente e repetir o passo. |
| PC-04 | Depois da lista vazia, pedir à IA para preparar Raimundo Costa inativo, telefone `88998223344`. Como inativar retorna 503 hoje, usar banco local se necessário e registrar a origem. Não usar a preparação para aprovar a inativação. CT-002/003 criam os ativos; CT-007 altera Francisco para `88996007788`. |
| PC-05 | **Apoio da IA (Claude Code)** para conferir na API/banco se os dados mostrados foram gravados, validar auditoria e preparar massa quando a UI não permitir. Cauan executa os passos da tela. |
| PC-06 | Links: web `http://localhost:3000/motoristas`, `/motoristas/cadastrar`, `/motoristas/editar?id=<id real>`; Expo Go `exp://<IP do computador>:8081/--/motoristas`, com os mesmos sufixos. |
| PC-07 | Para CT-013, HU-017 e histórico reais disponíveis. Sem dependências, marcar as partes como 🚫; não usar os exemplos do app como alocação real. |

## Resumo da execução

São **13 casos essenciais**, em três seções, executados na ordem abaixo. CT-001 repete a busca depois do cadastro do CT-002. Registrar cada entrada, mensagem e impedimento; uma variação falha não pode ser ocultada pelas demais.

### Seção A — Listagem e cadastro

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU010-UI-001 | Abrir listagem e buscar por nome | Lista vazia; ativos; capacidades de pesquisa e inativos | Só ativos por padrão; nome/telefone corretos; busca e vazio reais | ❌ FALHOU | Com o código do PR #243, a lista vazia mostra motoristas de exemplo que não existem no banco, e a chave “Mostrar inativos” vem ligada. Com o código antigo da `develop` a lista vazia estava correta. |
| CT-HU010-UI-002 | Cadastrar celular e conferir persistência | Celular válido, confirmação e reabertura | Sucesso; máscara; ativo persistido na API | ❌ FALHOU | O cadastro funciona e persiste (`Francisco Alves`, `(88) 99811-2233`, ativo, um único `POST`), mas a mensagem de sucesso é uma barra preta fora do padrão. |
| CT-HU010-UI-003 | Cadastrar fixo, homônimo e número dos exemplos | Fixo; mesmo nome; telefone presente só nos exemplos | Todos aceitos; ids distintos; nenhum bloqueio por exemplo | ✅ PASSOU | Os três cadastros foram aceitos (fixo, homônimo e o telefone dos exemplos), com ids distintos e máscara correta. Observação: a tela de cadastro reabre com dados da vez anterior. |
| CT-HU010-UI-004 | Bloquear telefone duplicado de ativo e inativo | Duplicidade com máscara e sem máscara, ativo/inativo | “Este profissional já está registrado.”; nada criado | ✅ PASSOU | As quatro tentativas (celular do Francisco com e sem máscara; telefone do Raimundo inativo com e sem máscara) foram barradas pelo servidor (`409`). Nenhum registro novo. |
| CT-HU010-UI-005 | Campos obrigatórios no cadastro e na edição | Nome/telefone ausentes ou esvaziados | Campo destacado; português; nenhum salvamento | ✅ PASSOU | Nome e telefone vazios ou só com espaços foram destacados e bloqueados no cadastro e na edição, e nenhum dado foi alterado. O testador também apontou que o campo Nome aceita números, emoji e símbolos (vai para a issue). |
| CT-HU010-UI-006 | Máscara e validação de telefone por dígitos | 3/9/12/15 dígitos; letras; fixo/celular e máscara | “Informe um telefone válido com DDD”; inválidos bloqueados | ❌ FALHOU | O app barra só telefones com menos de 10 caracteres. Telefones de 12 e 15 dígitos e com letras são aceitos no cadastro e na edição, e o valor original do Francisco foi sobrescrito. Só texto sem nenhum número é barrado, e pela API, com mensagem fora do requisito. |

### Seção B — Edição, inativação e reativação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU010-UI-007 | Editar nome e telefone sem trocar o motorista | Edição válida e colisão de telefone | Sucesso persistido; duplicidade bloqueada sem alteração parcial | ✅ PASSOU | A edição válida do Francisco foi gravada no mesmo registro (id 1) e o Antônio ficou intacto. A tentativa de colisão com o telefone do Antônio foi relatada como barrada, mas não aparece no log. |
| CT-HU010-UI-008 | Cancelar inativação sem alterar dados nem auditoria | Abrir modal e cancelar | Ativo mantido e nenhum novo log | ✅ PASSOU | Cancelar a inativação manteve o Francisco ativo, sem chamada de inativação e sem registro novo na auditoria. |
| CT-HU010-UI-009 | Inativar motorista sem alocação futura | Confirmar inativação sem alocação real | Sucesso e soft delete; código tende a 503 ou bloqueio fictício | ❌ FALHOU | O Francisco (id 1) não pode ser inativado: o app o bloqueia com uma regra fictícia de “alocações pendentes” antes de chamar a API. O Antônio (id 3) foi inativado normalmente, com sucesso em barra preta. |
| CT-HU010-UI-010 | Mostrar inativos e reativar com persistência | Ligar chave; cancelar e confirmar reativação | Inativo identificado; reativação persistida; erro visível se falhar | ✅ PASSOU | Os dois inativos (Raimundo e Antônio) foram reativados pela rota `PATCH /motoristas/{id}/reativar`, com persistência e auditoria. A mensagem de sucesso segue na barra preta. |

### Seção C — Integração, acesso e robustez

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU010-UI-011 | Aluno e representante sem acesso à gestão | Menus e links diretos para aluno/representante | Sem menu; Acesso Negado sem exposição de dados | ✅ PASSOU | Aluno: os três links diretos levaram a Acesso Negado, sem abrir a lista nem o formulário e sem chamar a API de motoristas. Representante: 🚫 bloqueado, pois o login dele não funciona (“Perfil incompatível”, #190). |
| CT-HU010-UI-012 | Falha de conexão sem exemplos nem sucesso falso | Lista, cadastro, edição e status sem resposta da API | Erro claro; sem dados inventados nem sucesso apenas local | ❌ FALHOU | Reprovado pela leitura do código (a API não foi derrubada): sem conexão a lista mostra motoristas de exemplo como reais e o cadastro, a edição e a mudança de status devolvem sucesso falso. |
| CT-HU010-UI-013 | Alocação futura, seleção de inativos e histórico | Futuro × passado; seleção da escalação | Bloqueio real na futura; histórico mantido; inativo fora da seleção | ❌ FALHOU | Reprovado pela leitura do código, sem execução: o app usa a lista de exemplo para o bloqueio de alocação e não há escalação nem alocação reais no ambiente. |

## Detalhamento dos casos

### Seção A — Listagem e cadastro

#### CT-HU010-UI-001 — Abrir listagem e buscar por nome

**Dados de entrada:** Banco vazio antes da massa; depois Francisco Alves ativo e Raimundo Costa inativo; buscas `Francisco`, `FRANCISCO` e `SEMRESULTADO`.

**Passos**

1. Como administrador, abrir **Cadastros → Motoristas** e conferir lista vazia antes da massa.
2. Pedir à IA para preparar PC-04; depois CT-002, voltar à lista e observar nome, telefone, **+ Novo**, busca e estado inicial de **Mostrar inativos**.
3. Buscar parte do nome, variação de caixa e texto inexistente; limpar e voltar pela seta.

**Resultado esperado**

- Lista vazia real, sem exemplos; o service atual respeita resposta `[]` e só usa exemplos quando a chamada falha.
- Inicialmente só ativos e chave desligada; nome/telefone corretos e inativos fora da seção de ativos (AC-01, AC-09).
- Busca pelo nome encontra os itens e texto inexistente mostra vazio. O código também busca telefone: registrar como comportamento adicional, sem considerá-lo defeito por si só.

**Resultado obtido**

- **Lista vazia, código antigo da `develop` (sem o PR):** o banco estava vazio e a tela mostrou “Nenhum motorista ativo encontrado”, como esperado. Nessa execução o navegador ainda usava o pacote antigo do app (as chamadas no log não tinham parâmetros), e foi preciso reiniciar o Expo para carregar o PR.
- **Lista vazia, com o PR #243 carregado:** o log passou a registrar `GET /motoristas?incluir_inativos=true` e, na busca, `...&nome=a`, `nome=aa` e `nome=aaa`, todas com `200` e lista vazia (o banco tinha 0 motoristas). Mesmo assim, a tela exibiu motoristas de teste. Eles vêm do `MOTORISTAS_MOCK` do app (José Almeida, Ana Souza e Paulo Ferreira): o PR trocou `response.data` por `listaApi.length > 0 ? listaApi : MOTORISTAS_MOCK` em `listarMotoristas`. É um erro novo do PR, pois na `develop` a lista vazia era respeitada.
- **Chave “Mostrar inativos”:** vem **ligada** ao abrir a tela (`index.tsx`: `useState(true)`), contrariando o esperado “chave desligada”.
- **Consulta:** o app pede sempre `incluir_inativos=true` e filtra os inativos na tela; a chave não muda a chamada à API.
- **Busca com dados reais** (`Francisco`, `FRANCISCO` e `SEMRESULTADO`), com Francisco ativo e Raimundo inativo na lista, e a seta de voltar: o testador relatou que a busca, o filtro e o comportamento estavam corretos. O log da API não registrou nenhuma busca por esses termos (só `nome=a`, `aa` e `aaa`, feitas com o banco vazio), então esse trecho fica como relato do testador, sem comprovação em log.
- Status: ❌ Falhou.

---

#### CT-HU010-UI-002 — Cadastrar celular e conferir persistência

**Dados de entrada:** **Nome Completo** `Francisco Alves`; **Telefone** `88998112233`.

**Passos**

1. Tocar **+ Novo**, preencher os campos e observar a máscara automática; tocar **Finalizar cadastro**.
2. No diálogo, cancelar e pedir à IA para confirmar que nada foi criado (PC-05); repetir e confirmar.
3. Anotar mensagem e listagem; fechar e reabrir o app (recarregar na web).
4. Pedir à IA para conferir nome, telefone, status e id na API/banco (PC-05).

**Resultado esperado**

- Cadastro com celular de 11 dígitos aceito e máscara correta (AC-02, AC-10).
- Confirmação de sucesso e lista atualizada; o AC-07 e o BDD não fixam um único texto de sucesso.
- Registro ativo continua após reabrir e existe no banco. Cancelar a confirmação não cria motorista.

**Resultado obtido**

- **Cancelar:** o log não registrou `POST /motoristas` entre o cancelamento e a confirmação.
- **Confirmar:** `POST /motoristas` com `201`. No banco e na API, `Francisco Alves` (id 1) ativo, com o telefone guardado como `(88) 99811-2233`. Foi criado um único registro; a lista foi atualizada, e o motorista continua após recarregar a página.
- A máscara do telefone digitado e o comportamento do cancelar na tela não foram detalhados pelo testador; o valor gravado mostra a máscara correta para 11 dígitos.
- **Defeito:** o sucesso aparece como **barra preta** (toast) que some rápido, e o testador não conseguiu ler o texto. Pelo código (`motoristas/cadastrar.tsx`) é “Motorista cadastrado com sucesso”. O texto é coerente com o exemplo do AC-07 (“Motorista alterado com sucesso”); o defeito é o formato: barra preta no rodapé, fora do padrão de pop-up de sucesso do app, enquanto o fluxo pede a mensagem no topo da tela. Mesmo defeito da [#278](https://github.com/GOUOCE/GOUCE-app/issues/278) (frota) e da [#260](https://github.com/GOUOCE/GOUCE-app/issues/260) (faculdades). Edição, inativação e reativação usam o mesmo toast.
- O cadastro não gerou registro em `log_auditoria`, já aberto na suíte de API ([#233](https://github.com/GOUOCE/GOUCE-app/issues/233)).
- Observação: o telefone guardado pela tela vem com máscara, e o guardado pela API direta (`88998223344`, Raimundo Costa) vem sem máscara.
- Status: ❌ Falhou.

---

#### CT-HU010-UI-003 — Cadastrar fixo, homônimo e número dos exemplos

**Dados de entrada:** Três cadastros: `Antônio Lima`/`8834125566`; `Francisco Alves`/`88997004455`; `Motorista Exemplo Legítimo`/`88999999999` (ausente do banco).

**Passos**

1. Pedir à IA para confirmar que os três telefones ainda não existem no banco (PC-05).
2. Cadastrar cada motorista pela UI, observando máscara de fixo e celular.
3. Reabrir e pedir à IA para conferir os três registros, inclusive o homônimo (PC-05).

**Resultado esperado**

- Fixo de 10 dígitos aceito, com máscara de fixo; homônimos permitidos com números diferentes (AC-02, AC-10).
- O número `(88) 9 9999-9999` dos exemplos não pode bloquear cadastro quando não existe no banco; esse bloqueio é risco real do service.
- Se uma criação falhar, registrar a variação e preparar o homônimo necessário por API/banco para os demais casos, sem aprovar a criação pela UI.

**Resultado obtido**

- **Preparo:** nenhum dos três telefones existia no banco antes (só Francisco e Raimundo).
- `Antônio Lima` / `8834125566`: `POST /motoristas` com `201`; id 3, guardado como `(88) 3412-5566` (máscara de fixo).
- `Francisco Alves` (homônimo) / `88997004455`: `201`; id 4, guardado como `(88) 99700-4455`. O nome repetido não foi barrado.
- `Motorista Exemplo Legítimo` / `88999999999`: `201`; id 5, guardado como `(88) 99999-9999`. O telefone dos exemplos do app não bloqueou o cadastro.
- Os três ids são distintos e os registros continuam na API após recarregar.
- **Observação do testador (não reprova o caso):** a tela de cadastro reabre com os dados da vez anterior, o mesmo defeito de telas não recriadas visto nas HUs-007 a 009 ([#275](https://github.com/GOUOCE/GOUCE-app/issues/275) na frota). A mensagem de sucesso continua sendo a barra preta (CT-002).
- Status: ✅ Passou.

---

#### CT-HU010-UI-004 — Bloquear telefone duplicado de ativo e inativo

**Dados de entrada:** Telefone de Francisco `(88) 99811-2233` e `88998112233`; telefone de Raimundo inativo `(88) 99822-3344` e `88998223344`; nomes diferentes.

**Passos**

1. Tentar cadastrar cada combinação, com nome válido diferente.
2. Anotar a mensagem e pedir à IA para conferir que não houve novo registro (PC-05).

**Resultado esperado**

- Bloqueio com “Este profissional já está registrado.” em todas as variações (AC-03, FA-002).
- Comparação só por dígitos e incluindo inativos. A máscara não pode permitir duplicar o número.
- Telefone único; nomes não são chave. Edição duplicada está no CT-007.

**Resultado obtido**

- Foram feitas as quatro tentativas, com nomes diferentes: telefone do Francisco como `88998112233` e `(88) 99811-2233`, e o do Raimundo (inativo) como `88998223344` e `(88) 99822-3344`. O testador relatou o bloqueio com a mensagem de duplicidade em todas.
- O log da API registrou quatro `POST /motoristas` com `409 Conflict` (na primeira, antes, um `401` e a renovação automática do login). O banco continuou com 5 motoristas, sem nenhum dos nomes de teste: a duplicidade foi decidida pelo servidor, comparando os dígitos e considerando também o inativo (o Raimundo foi guardado sem máscara pela API e foi reconhecido com máscara).
- Status: ✅ Passou.

---

#### CT-HU010-UI-005 — Campos obrigatórios no cadastro e na edição

**Dados de entrada:** Campos vazios e só espaços; no cadastro deixar nome ou telefone vazio por vez; na edição apagar um por vez.

**Passos**

1. Em **Cadastrar Motorista**, tentar finalizar cada entrada com o outro campo válido.
2. No lápis de Francisco, apagar nome e tentar **Salvar alterações**; reabrir e repetir com telefone.
3. Pedir à IA para conferir que nenhum cadastro nem edição foi gravado (PC-05).

**Resultado esperado**

- Destacar o campo obrigatório e bloquear cadastro e edição até preencher (AC-08, FA-003).
- Espaços não contam como nome ou telefone válido. Os dados salvos permanecem anteriores.
- O frontend exige nome mínimo de 3 caracteres, enquanto API aceita 1; anotar essa divergência de contrato sem declarar uma nova regra de negócio aprovada.

**Resultado obtido**

- O testador executou as tentativas A1 a A5 (nome vazio, nome só com espaços, telefone vazio, telefone só com espaços e nome de 2 letras) no cadastro e B1/B2 (apagar nome e telefone) na edição do Francisco, e relatou que todas foram destacadas e bloqueadas.
- O log não registrou nenhum `PATCH /motoristas` e `Francisco Alves` continua `(88) 99811-2233`, ativo; nenhuma edição foi gravada.
- **Divergência de contrato (conforme previsto no caso):** o app exige nome com no mínimo 3 caracteres; a API (`_validar_texto_obrigatorio`) aceita qualquer texto não vazio.
- **Defeito fora do critério deste caso:** o campo **Nome Completo** não tem regra de caracteres, nem no app (`motoristaSchema.ts` só limita 3 a 150 caracteres) nem na API. Durante a execução foi criado o motorista id 6 com o nome `333333333333` (`POST /motoristas` com `201`), e o testador relatou que emoji e símbolos também são aceitos. O padrão do sistema para nome de pessoa (cadastro de aluno, `nomeSchema`) é de 3 a 150 caracteres, apenas letras (com acento), espaços, hífen e apóstrofo, com nome e sobrenome; o critério 12 da HU-010 não define essa regra, então ela vai como proposta na issue.
- Status: ✅ Passou.

---

#### CT-HU010-UI-006 — Máscara e validação de telefone por dígitos

**Dados de entrada:** Inválidos `123`, `998112233` (9), `889981122334` (12), `889981122334455` (15), `abcdefghijk` e `(88) abcdef`; válidos de 10/11 dígitos nos CT-002/003.

**Passos**

1. No cadastro, digitar ou colar cada entrada com nome válido e tentar finalizar; repetir os valores de 3 e 15 dígitos e letras misturadas na edição.
2. Observar o valor antes e depois de sair do campo; não contar caracteres da máscara como dígitos.
3. Se o teclado impedir uma entrada, registrar e tentar colar ou usar a web. Pedir à IA para conferir que nada inválido foi salvo (PC-05).

**Resultado esperado**

- Mensagem “Informe um telefone válido com DDD”; aceitar apenas DDD + 8 ou 9 dígitos, com máscara automática (AC-10).
- Não aprovar entrada porque tem 10 caracteres, letras ou símbolos; o valor não deve ser truncado silenciosamente para outro telefone.
- Risco confirmado no código: o schema conta caracteres e a máscara devolve a entrada original fora de 10/11 dígitos. `(88) abcdef` possui tamanho suficiente para expor isso; conferir se o teclado permite a entrada.

**Resultado obtido**

- **Barrados pelo app:** `123` e `998112233` (menos de 10 caracteres); o log não registrou chamada para eles.
- **Aceitos no cadastro** (`POST /motoristas` com `201`): `889981122334` (12 dígitos, motorista id 7), `889981122334455` (15 dígitos, id 8) e `aaaaaaaaaw33333` (letras e números, id 9). A máscara só formata quando há exatamente 10 ou 11 dígitos e devolve o texto original nos demais casos; o schema do app conta caracteres e não dígitos (`motoristaSchema.ts`: `min(10)`, `max(20)`).
- **A5, `abcdefghijk`:** o app deixou enviar e a API respondeu `422` com a mensagem “Telefone deve conter ao menos um dígito.”, exibida no pop-up de aviso. Segundo o testador, a mensagem não corresponde ao requisito (“Informe um telefone válido com DDD”) e confunde, porque a regra real é DDD de 2 dígitos mais 8 ou 9 dígitos. O testador também relatou que o texto vermelho abaixo do campo aparece distorcido nessa tentativa; isso foi observado na tela e não foi reproduzido na conferência.
- **A API só exige um dígito** (`_validar_telefone` verifica apenas `normalizar_telefone`), o que explica a aceitação de 12 e 15 dígitos e de texto misturado ([#231](https://github.com/GOUOCE/GOUCE-app/issues/231), aberta na suíte de API; a mensagem genérica da API está na [#234](https://github.com/GOUOCE/GOUCE-app/issues/234)).
- **Edição:** o log registrou três `PATCH /motoristas/1`, dois com `409` (telefones que já pertenciam a outros motoristas) e um com `200`. O `200` gravou no Francisco o telefone `88998112233422` (14 dígitos), perdendo o `(88) 99811-2233`. Dado inválido sobrescreve um dado correto.
- **Preparo posterior (PC-05):** o telefone do Francisco foi restaurado pela API (`PATCH /motoristas/1` com `(88) 99811-2233`, `200`) para os próximos casos. Os motoristas de teste id 6 a 9 permanecem no banco.
- Status: ❌ Falhou.

---

### Seção B — Edição, inativação e reativação

#### CT-HU010-UI-007 — Editar nome e telefone sem trocar o motorista

**Dados de entrada:** Francisco → `Francisco Alves QA` e `(88) 99600-7788`; depois telefone de Antônio `8834125566`.

**Passos**

1. Abrir o lápis de Francisco e conferir os campos preenchidos.
2. Alterar nome/telefone e salvar; reabrir e pedir à IA para conferir mesmo id e dados corretos (PC-05).
3. Tentar mudar nome para `Não deve salvar` junto com telefone de Antônio; anotar bloqueio.
4. Fechar/reabrir o app e pedir à IA para confirmar que os dados anteriores à colisão e os de Antônio foram mantidos (PC-05).

**Resultado esperado**

- Edição válida mostra confirmação e atualiza a lista (AC-04, AC-07).
- Telefone em uso: “Este profissional já está registrado.”; nem o nome da tentativa recusada pode persistir (AC-03).
- Apenas o motorista escolhido muda; reabertura confirma persistência, não alteração apenas da lista local.

**Resultado obtido**

- **Edição válida:** `PATCH /motoristas/1` com `200`. No banco, o id 1 passou a `Francisco Alves QA`, com o telefone `(31) 76244-3333` (o testador usou esse número em vez de `(88) 99600-7788` do plano). Mesmo id, nenhum registro novo.
- **Antônio Lima** (id 3) continua `(88) 3412-5566`, ativo e com o nome original.
- **Colisão com o telefone do Antônio (passo 3):** o testador relatou o bloqueio, e o nome `Não deve salvar` não está em nenhum registro do banco. Porém o log da API não registrou nenhum `PATCH` com `409` para essa tentativa (o último `PATCH` é o `200` da edição válida). Fica sem comprovação em log; vale repetir se for preciso uma evidência firme.
- A edição não gerou registro em `log_auditoria` (já aberto na suíte de API, [#233](https://github.com/GOUOCE/GOUCE-app/issues/233)). A mensagem de sucesso é a barra preta já descrita no CT-002.
- Status: ✅ Passou (dados corretos); defeitos da mensagem e da auditoria seguem nas issues próprias.

---

#### CT-HU010-UI-008 — Cancelar inativação sem alterar dados nem auditoria

**Dados de entrada:** Francisco ativo; id e logs anteriores conferidos pela IA.

**Passos**

1. Pedir à IA para registrar status e logs de Francisco (PC-05).
2. Tocar na lixeira, ler **Inativar motorista?** e tocar **Cancelar**.
3. Reabrir a listagem e pedir à IA para conferir estado e auditoria novamente (PC-05).

**Resultado esperado**

- Motorista continua ativo com mesmo nome/telefone e id (AC-05).
- Nenhum registro de inativação no log e nenhuma confirmação de sucesso de inativação (AC-11; cenário BDD de cancelamento).
- Cancelar não depende de a inativação do backend já estar implementada; pode ser verificado separadamente do CT-009.

**Resultado obtido**

- **Antes:** `Francisco Alves QA` (id 1) ativo; última linha de auditoria de motoristas: `INATIVAR` do id 2 (id 35 do log).
- O testador tocou na lixeira, viu o pop-up de confirmação e cancelou; relatou que o motorista continuou ativo na lista.
- **Depois (conferido):** o log da API não registrou nenhum `PATCH .../inativar` para ele, o motorista continua ativo no banco e a auditoria segue no mesmo id 35. Nenhuma confirmação de sucesso de inativação.
- Status: ✅ Passou.

---

#### CT-HU010-UI-009 — Inativar motorista sem alocação futura

**Dados de entrada:** Motorista real sem alocações futuras, inclusive um id que coincida com id de exemplo se houver.

**Passos**

1. Pedir à IA para confirmar id e ausência de alocações futuras reais (PC-05).
2. Tocar na lixeira, confirmar **Inativar** e anotar a mensagem exata.
3. Pedir à IA para conferir resposta da API, registro, status e auditoria; fechar e reabrir o app (PC-05).

**Resultado esperado**

- Pelo requisito: confirmação de sucesso, saída dos ativos, registro mantido como inativo e log da operação (AC-05, AC-07, AC-11).
- O backend atual retorna 503 para existente. Registrar a **falha do fluxo**, sem aprovar o caso por exibir um alerta.
- O id 1 dos exemplos pode bloquear antes da API com alocação fictícia; isso também é falha se o motorista real não tem alocação. Erro da API deve ser claro, sem sucesso falso nem inativação de outro registro.

**Resultado obtido**

- **Francisco Alves QA (id 1):** ao confirmar **Inativar**, o app mostra o pop-up “Inativação Bloqueada” com “Este profissional possui alocações pendentes e não pode ser inativado no momento.” O log da API **não registrou nenhum `PATCH /motoristas/1/inativar`** e o banco mantém o id 1 ativo. Não existe alocação real alguma (o banco nem tem tabela de alocação de motoristas): a mensagem vem do exemplo interno do app. `inativarMotorista` procura o id 1 no `MOTORISTAS_MOCK`, encontra “José Almeida” com `alocacoes_pendentes: true` e lança o erro. Como o primeiro motorista cadastrado em qualquer banco recebe o id 1, ele nunca poderá ser inativado pela tela.
- **Antônio Lima (id 3):** `PATCH /motoristas/3/inativar` com `200`; no banco, `ativo = false`, e a auditoria ganhou o registro `INATIVAR` do id 3 (id 36 do log). O testador relatou o sucesso e uma barra preta com o texto “Motorista inativado” (`motoristas/index.tsx`), fora do padrão de pop-up e diferente do requisito (“Operação realizada com sucesso”).
- O backend atual **não** devolve mais o 503 citado no plano: inativa e audita. O caso não depende mais dessa falha.
- Status: ❌ Falhou (bloqueio fictício no id 1 e mensagem fora do padrão).

---

#### CT-HU010-UI-010 — Mostrar inativos e reativar com persistência

**Dados de entrada:** Raimundo Costa inativo preparado por API/banco (PC-04), independentemente do CT-009.

**Passos**

1. Ligar **Mostrar inativos** e localizar Raimundo na seção **Inativos**.
2. Tocar no ícone de restauração; cancelar e conferir o estado; repetir e confirmar **Reativar**.
3. Anotar mensagem e resultado; desligar chave e reabrir o app.
4. Pedir à IA para conferir rota solicitada, status, logs e dados na API/banco (PC-05).

**Resultado esperado**

- Inativo identificado corretamente (AC-09); cancelar preserva o estado e não gera log.
- Confirmar deveria reativar o mesmo id, mostrar sucesso, voltar aos ativos e persistir (AC-05, AC-07, AC-11).
- O app chama `/ativar`, mas a API declara `/reativar`: provável 404/405 na UI, ainda não executado. A tela só registra erro no console; exigir feedback visível. Preparo de massa não aprova a inativação falha.

**Resultado obtido**

- Com a chave ligada, o testador localizou os inativos e reativou **Raimundo Costa** (id 2) e **Antônio Lima** (id 3); relatou que o caso passou.
- **Log:** `PATCH /motoristas/2/reativar` (primeiro um `401` e a renovação automática do login, depois `200`) e `PATCH /motoristas/3/reativar` com `200`. O app usa a rota certa da API; o `/ativar` citado no plano não é mais usado desde o PR #243.
- **Banco e auditoria:** os ids 2 e 3 voltaram a `ativo = true`, com os registros `REATIVAR` (ids 37 e 38 do log) e `valor_anterior = inativo`. Nenhum outro motorista foi alterado.
- **Pontos já anotados:** a chave “Mostrar inativos” abre ligada (CT-001) e a mensagem “Motorista reativado” é a barra preta fora do padrão (CT-002). A falha de reativação mostra só `console.error` no código (`index.tsx`); como a reativação funcionou, esse caminho não foi exercitado.
- Status: ✅ Passou.

---

### Seção C — Integração, acesso e robustez

#### CT-HU010-UI-011 — Aluno e representante sem acesso à gestão

**Dados de entrada:** Contas PC-03; web `/motoristas`, `/motoristas/cadastrar`, `/motoristas/editar?id=<id>`; Expo Go com os mesmos sufixos.

**Passos**

1. Entrar como aluno e conferir menus; abrir os três links da PC-06.
2. Repetir como representante, registrando bloqueio de login separadamente se houver.

**Resultado esperado**

- Opção **Motoristas** não aparece; links mostram **Acesso Negado**, sem lista ou formulário nem por um instante (RN-006).
- Sem possibilidade de escrita ou leitura administrativa pelo app. A API é verificada em CT-HU010-API-012.
- Se não for possível autenticar o representante, bloquear só essa parte, sem substituir pela conta de aluno.

**Resultado obtido**

- **Aluno** (`qa.hu007.aluno@teste.com`): os links `/motoristas`, `/motoristas/cadastrar` e `/motoristas/editar?id=1` levaram à tela **Acesso Negado**, com o texto “Erro 403 - Forbidden” (`acesso-negado.tsx`). O console do Expo registrou três redirecionamentos do perfil `ALUNO` para `acesso-negado` e nenhuma abertura de tela de motoristas, e o log da API não tem nenhuma chamada a `/motoristas` do aluno: a lista e o formulário não foram exibidos.
- **Representante** (`qa.hu007.rep@teste.com`): 🚫 **bloqueado**. O login com “Sou representante” é recusado com “Perfil incompatível” porque o login da conta devolve `role: "aluno"` (ver [#190](https://github.com/GOUOCE/GOUCE-app/issues/190), reaberta, com comentário de que persiste). A verificação desse perfil não foi feita e não é substituída pela conta de aluno.
- Status: ✅ Passou para o aluno; representante 🚫 bloqueado, pendente de nova execução.

---

#### CT-HU010-UI-012 — Falha de conexão sem exemplos nem sucesso falso

**Dados de entrada:** API inacessível; cadastro `Motorista Offline`/`88996558877`; edição de real; ativo/inativo para transições.

**Passos**

1. Na execução futura, tornar só a API inacessível, mantendo acesso ao bundle Expo se necessário.
2. Abrir a lista e tentar cadastrar; para edição/status, carregar a tela com conexão e retirar acesso antes de confirmar a ação, se necessário.
3. Anotar mensagens e alterações visuais; restaurar acesso e reabrir o app.
4. Pedir à IA para conferir registros e logs no banco após reconectar (PC-05).

**Resultado esperado**

- Erro de conexão em português, sem travamento; não mostrar exemplos como motoristas reais.
- Sem confirmação de sucesso para escrita não confirmada; formulários preservados para tentar novamente.
- Ao reconectar, lista reconciliada com a API e sem duplicação. Registrar separadamente eventual resposta perdida após gravação; não presumir ausência de escrita sem conferência da IA.

**Resultado obtido**

- **Não foi derrubada a API.** O código de `frontend/src/services/motoristaService.ts` (com o PR #243) usa a lista de exemplo (`MOTORISTAS_MOCK`) nos caminhos de escrita, e o resultado seria sucesso falso. O caso foi avaliado pela leitura do código. Nada foi alterado no banco por este caso.
- **Listagem:** em `listarMotoristas`, o `catch` devolve `MOTORISTAS_MOCK` (José Almeida, Ana Souza, Paulo Ferreira) sem aviso, como se fossem os motoristas reais. O PR #243 também faz isso quando a API responde com lista vazia (CT-001).
- **Cadastro:** em `criarMotorista`, sem resposta da API (`!error.response`), o app faz `MOTORISTAS_MOCK.unshift(novoMotorista)` e devolve sucesso; a tela mostra “Motorista cadastrado com sucesso” sem nada gravado.
- **Edição, inativação e reativação:** `atualizarMotorista`, `inativarMotorista` e `reativarMotorista` alteram o item de exemplo de mesmo `id` e retornam sem erro. Como os ids 1 a 3 do exemplo coincidem com os primeiros motoristas reais, essas três ações dariam sucesso falso para eles. Para os demais ids o app lança o erro de conexão.
- A mesma família já aparece na frota ([#283](https://github.com/GOUOCE/GOUCE-app/issues/283)), nas faculdades ([#263](https://github.com/GOUOCE/GOUCE-app/issues/263)) e nos bairros ([#249](https://github.com/GOUOCE/GOUCE-app/issues/249)).
- Status: ❌ Falhou (por análise do código).

---

#### CT-HU010-UI-013 — Alocação futura, seleção de inativos e histórico

**Dados de entrada:** A alocado amanhã; B com histórico só do passado; C inativo. Massa real conferida pela IA, com datas/fuso.

**Passos**

1. Conferir as dependências PC-07; sem a funcionalidade, registrar a parte dependente como 🚫.
2. Tentar inativar A e B pela UI; pedir à IA para conferir estados, vínculos históricos e auditoria (PC-05).
3. Abrir a seleção real de motorista da escalação e procurar C.

**Resultado esperado**

- A: “Este profissional possui alocações pendentes e não pode ser inativado no momento.”, mantém ativo (AC-06, FA-001).
- B: histórico passado preservado e sem bloqueio por alocação futura; C fora de nova escalação (AC-12, RN-004).
- 503 geral ou bloqueio da lista de exemplo não comprova a regra; ver CT-HU010-API-013 para tentativa direta de novo vínculo com inativo.

**Resultado obtido**

- **Não executado na tela**, a pedido do testador, porque o app usa exemplos no lugar da regra real.
- **Dependências (passo 1):** o banco não tem tabela de escalação, alocação ou viagem ligada a motoristas, e o app não tem tela de escalação (HU-016/017). Não há como montar os motoristas A, B e C reais.
- **Regra de alocação:** o app decide por `alocacoes_pendentes` do `MOTORISTAS_MOCK` (a mesma fictícia do CT-009, que bloqueia o id 1 sem alocação alguma), e o backend só inativa; ele não consulta alocações futuras antes de inativar, apesar do critério AC-06.
- A regra AC-06/FA-001 e o AC-12/RN-004 não foram verificados.
- Status: ❌ Falhou (por análise do código; a parte real fica para quando as HU-016/017 existirem).

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 — listagem e busca | Visualiza ativos com nome/telefone; filtra pelo nome | CT-001 |
| AC-02 — cadastro e homônimos | Cadastra com sucesso; aceita fixo/celular; permite nomes iguais | CT-002, CT-003 |
| AC-03 / FA-002 — telefone único | Bloqueia duplicidade no cadastro e na edição | CT-004, CT-007 |
| AC-04 — edição | Edita dados existentes | CT-007 |
| AC-05 / RF-014 — inativar e reativar | Inativa; cancela modal; reativa; mantém registro | CT-008, CT-009, CT-010, com apoio da IA |
| AC-06 / FA-001 — alocação futura | Bloqueia inativação com rota futura | CT-013 — depende da HU-017 |
| AC-07 — confirmação | Cenários de sucesso | CT-002, CT-003, CT-007, CT-009, CT-010 |
| AC-08 / FA-003 — obrigatórios | Cadastro/edição sem obrigatório | CT-005 |
| AC-09 — Mostrar inativos | Visualiza seção Inativos | CT-001, CT-010 |
| AC-10 — formato e máscara | Aceita fixo/celular; bloqueia telefone incompleto | CT-002, CT-003, CT-006 |
| AC-11 / RNF-013 — auditoria | Escritas auditadas; cancelar não gera log | CT-008, CT-009, CT-010 e CT-HU010-API-010, com apoio da IA |
| AC-12 / RN-004 — escalação e histórico | Inativo fora da seleção; histórico preservado | CT-013 — dependências explícitas |
| RN-006 — exclusividade administrativa | Menu não exibido para aluno/representante | CT-011; API em CT-HU010-API-012 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-001 | Com a lista vazia, a tela mostra motoristas de exemplo que não existem no banco (erro introduzido pelo PR #243). **Bloqueante** | [#286](https://github.com/GOUOCE/GOUCE-app/issues/286) |
| CT-001, CT-010 | Chave “Mostrar inativos” já vem ligada; a consulta pede sempre `incluir_inativos=true` | [#287](https://github.com/GOUOCE/GOUCE-app/issues/287) |
| CT-001, CT-003 | Telas não recriadas: formulário reabre com dados anteriores e a seta volta ao Painel | [#288](https://github.com/GOUOCE/GOUCE-app/issues/288) |
| CT-002, CT-007, CT-009, CT-010 | Mensagens de sucesso em barra preta no rodapé, fora do padrão de pop-up | [#289](https://github.com/GOUOCE/GOUCE-app/issues/289) |
| CT-005 | Nome Completo aceita números, emoji e símbolos, no app e na API | [#290](https://github.com/GOUOCE/GOUCE-app/issues/290) |
| CT-006 | Telefone aceita 12 e 15 dígitos e letras; a edição sobrescreve com valor inválido; mensagem do A5 não orienta; sem máscara nem limitador | [#291](https://github.com/GOUOCE/GOUCE-app/issues/291); relacionada às [#231](https://github.com/GOUOCE/GOUCE-app/issues/231) e [#234](https://github.com/GOUOCE/GOUCE-app/issues/234) |
| CT-009 | O motorista de id 1 não pode ser inativado: alocação pendente fictícia do exemplo. **Bloqueante** | [#292](https://github.com/GOUOCE/GOUCE-app/issues/292) |
| CT-012, CT-013 | Sem resposta da API, o app mostra sucesso falso e exemplos como reais. **Bloqueante** | [#293](https://github.com/GOUOCE/GOUCE-app/issues/293) |
| CT-011 | Representante não consegue entrar (“Perfil incompatível”) | Já registrado na [#190](https://github.com/GOUOCE/GOUCE-app/issues/190), reaberta, com comentário |
| CT-002 | Cadastro e edição sem registro de auditoria | Já aberto na suíte de API ([#233](https://github.com/GOUOCE/GOUCE-app/issues/233)) |

## Observações gerais

- Referências: [HU-010, seção 7.3.4](../../../../../docs/requisitos.md), [BDD](../../../../../bdd/features/epico-02/HU-010.feature), [README do BDD](../../../../../bdd/features/epico-02/README.md) e [issue #185](https://github.com/GOUOCE/GOUCE-app/issues/185).
- **Riscos mapeados no código**:
  - Backend em `backend/src/modulos/motoristas/`: telefone só precisa conter um dígito; não valida DDD nem 10/11 dígitos (API CT-006; UI CT-006).
  - Inativação de motorista existente retorna 503 porque o caso de uso não fornece a confirmação real de alocações exigida pelo repository. O esperado continua sendo inativação válida sem alocação; a execução deve registrar essa falha. O cenário com alocação real depende da HU-017 (API CT-008/013; UI CT-009/013).
  - Cadastro/edição não gravam auditoria; reativação grava `REATIVAR`; repeti-la retorna 200 sem novo log (API CT-009/010).
  - Telefone é único por hash dos dígitos e índice único; nomes iguais são permitidos. Nome/telefone ficam cifrados; conferir valores pela API/ORM, sem esperar texto puro nas colunas. A busca de nome ocorre após descriptografia (API CT-001/004).
  - Frontend em `frontend/src/services/motoristaService.ts`: valida duplicidade contra exemplos antes da API; todos usam `(88) 9 9999-9999`. Também usa exemplos quando a chamada falha e pode fingir sucesso sem resposta (UI CT-003/012). Lista vazia recebida da API é respeitada, diferentemente do service de frota.
  - O app chama `/motoristas/{id}/ativar`; a API só declara `/reativar`. O erro da reativação só vai ao console (UI CT-010).
  - A chave Mostrar inativos começa ligada; a inativação do id 1 pode ser barrada pela alocação fictícia do exemplo, mesmo quando o id real não tem vínculo futuro (UI CT-001/009).
  - `motoristaSchema.ts` valida tamanho de caracteres, não quantidade de dígitos. `formatarTelefone.ts` só transforma entradas com 10/11 dígitos; nas demais devolve o texto original, permitindo investigar letras e números longos na UI (UI CT-006).
- Técnicas: **partição de equivalência** de telefones, perfis e obrigatórios; **valor-limite** em 9/10/11/12 dígitos, além de 3/15 para expor o backend; **transição de estado** e repetição de reativação; **tabela de decisão** sem alocação / somente passado / futuro. Prioridade em validação, persistência, autorização e auditoria.
- **Dúvidas/divergências para alinhamento**:
  - RF-009 exige número/categoria da CNH, mas ACs, BDD e código usam nome/telefone e não têm CNH. Os casos seguem o recorte da HU; a cobertura de CNH está **pendente de decisão**, não implementada nem aprovada por este planejamento.
  - O BDD ainda comenta FA-002 com CNH/CPF e mensagem de telefone sem definição; o requisito atual já define unicidade por telefone e “Informe um telefone válido com DDD”. Seguir o requisito e manter a divergência documental anotada.
  - API permite nome de 1 caractere e o frontend exige pelo menos 3; não há esse mínimo nos critérios. Confirmar o contrato antes de classificar nome curto apenas por essa diferença.
  - A issue #185 continua aberta, sem comentários na consulta de 24/10/2026. Aprovação das regras de telefone, duplicidade com inativos e seleção de inativos segue **pendente**, conforme orientação do responsável; os casos usam os requisitos atuais como referência provisória.
- **Execução (27/10/2026):** 7 casos passaram (CT-003, 004, 005, 007, 008, 010 e 011, este só para o aluno) e 6 falharam (CT-001, 002, 006, 009, 012 e 013). CT-012 e CT-013 foram reprovados pela leitura do código, sem executar. O representante não conseguiu entrar (CT-011, #190).
- **Atualização sobre o planejamento acima:** o backend da `develop` já inativa motorista (`PATCH /motoristas/{id}/inativar` com `200` e auditoria `INATIVAR`) e o app usa `PATCH /motoristas/{id}/reativar`, então o 503 e o `/ativar` citados nos riscos acima já não valem. A issue [#232](https://github.com/GOUOCE/GOUCE-app/issues/232) (503 ao inativar) está aberta e deve ser retestada.
- Suíte complementar: [API-HU-010.md](../api/API-HU-010.md). Ocultar senhas, tokens e dados pessoais nas evidências.
