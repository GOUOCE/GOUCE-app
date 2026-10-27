# Testes manuais de UI — HU-030 — Gerenciamento de Representantes

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Gestão de Cadastros Base (EP-002) |
| Funcionalidade | HU-030 — Gerenciamento de Representantes |
| Camada | UI |
| Tipo de teste | Funcional manual — suíte essencial (baseada em risco) |
| Tela | Administrador → Cadastros → **Representantes** → **+ Novo** / **Cadastrar Representante**; login Sou representante/Sou aluno e área de representante |
| Ambiente | Versão web (`http://localhost:3000`), API e banco locais em Docker; branch `test/manual-ui-hu-030` a partir da `develop` (`88eb19dc`), com as mudanças do [PR #195](https://github.com/GOUOCE/GOUCE-app/pull/195) (`fix/issues-hu030`, `12aae7c3`) aplicadas na execução |
| Total de casos | 13 |
| Última execução | 2026-10-27 |
| Testador | Cauan Ricardo |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: |
| 🔄 Em andamento | 13 | 1 | 0 | 0 | 12 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | Na execução futura, app/API/banco disponíveis na **branch da própria implementação/correção**, com branch/commit anotados. Para retestar login e remoção de exemplos, usar PR #195 (`fix/issues-hu030`) ou versão equivalente. PR aberto em 24/10/2026; não pressupor essas correções no código atual. Começar sem representações para a parte vazia do CT-001. |
| PC-02 | Administrador A logado para gestão. Manter uma segunda sessão independente (outro dispositivo ou navegador privado) para a conta do representante durante CT-010. Não compartilhar sessão administrativa e de aluno no mesmo armazenamento. |
| PC-03 | Credenciais originais de Larissa, aluno comum e representantes Ana/Bruno. Sessão vencida: entrar de novo e repetir o passo; registrar falha de seleção de perfil sem atribuí-la a senha errada. |
| PC-04 | **Massa após conferir vazio:** F1 = UFC / Campus Quixadá ativa; F2 = IFCE / Campus Quixadá ativa, com **id diferente de 1**; F3 = faculdade inativa. Alunos de teste com credenciais conhecidas: Larissa Mendes aprovada (`ativado`), usuário ativo, validade futura e matrícula F2, ainda sem função; Ana Beatriz representante ativa F1; Pedro Henrique revogado F1; Bruno representante ativo F2; aluno aprovado livre para recusas; alunos pendente, rejeitado, vínculo vencido e inativado. “Reprovado” do BDD corresponde a `rejeitado`; “vínculo vencido” é `ativado` + usuário ativo + `validade_acesso` no passado, não um novo status textual. Anotar ids reais, datas/fuso e origem de cada preparo via API/banco local. Não usar preparo como evidência de operação aprovada. |
| PC-05 | **Apoio da IA (Claude Code)** para preparar massa quando a UI não permitir e conferir na API/banco se atribuição, instituição, status e logs foram realmente gravados. Cauan executa a UI; comparar também dados originais do aluno. |
| PC-06 | Links web `http://localhost:3000/representantes` e `/representantes/cadastrar`; Expo Go `exp://<IP do computador>:8081/--/representantes`, com o mesmo sufixo de cadastro. A área do representante é acessada pelo login **Sou representante**. |
| PC-07 | Para CT-013 e parte do CT-010, HU-018/021 reais disponíveis. Sem lista/presença funcional, registrar 🚫 na parte dependente. Tela estática de passageiros não comprova permissões nem isolamento. |

## Resumo da execução

São **13 casos essenciais**, em três seções e na ordem abaixo. CT-003 promove Larissa para F2; CT-007 revoga; CT-008 reatribui F1; CT-009 testa perfis; CT-010 revoga novamente. Registrar cada variação e origem de massa; ação preparada pela IA não aprova o fluxo de UI.

### Seção A — Listagem e atribuição

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU030-UI-001 | Listar ativos e revogados sem representantes fictícios | Lista vazia; ativos/revogados reais | Sem exemplos; ambos os status identificados e dados reais | ⏳ PENDENTE | Não executado. |
| CT-HU030-UI-002 | Localizar aluno real e tratar pesquisa sem resultado | Busca real, nomes semelhantes e lista de elegíveis vazia | Aluno correto; vazio informado; sem João/Clara fictícios | ⏳ PENDENTE | Não executado. |
| CT-HU030-UI-003 | Atribuir a instituição escolhida e preservar cadastro de aluno | Promover Larissa para F2 ≠ 1; confirmação e persistência | Sucesso; F2 correta no banco; mesmo aluno | ⏳ PENDENTE | Não executado. |
| CT-HU030-UI-004 | Exigir instituição válida e impedir seleção inativa | Instituição vazia/inativa; seleção válida | Bloqueio compreensível; nenhum perfil ou instituição padrão indevida | ⏳ PENDENTE | Não executado. |
| CT-HU030-UI-005 | Impedir atribuição nos quatro estados inelegíveis | Quatro estados do BDD, inclusive validade vencida | Sem promoção; orientação de somente aprovados/ativos | ⏳ PENDENTE | Não executado. |
| CT-HU030-UI-006 | Impedir atribuição repetida ao representante ativo | Já representante; tentativa repetida e resposta 409 | Bloqueio por função ativa; sem duplicação nem troca de instituição | ⏳ PENDENTE | Não executado. |

### Seção B — Revogação e reatribuição

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU030-UI-007 | Cancelar e confirmar revogação mantendo aluno e revogado na lista | Modal cancelar/confirmar; função revogada, aluno preservado | Cancelar não grava; confirmar revoga só a função e mantém linha visível | ⏳ PENDENTE | Não executado. |
| CT-HU030-UI-008 | Reatribuir ao revogado em instituição diferente | Revogada → ativa; responsabilidade F2 → F1 | Sucesso; mesma identidade; nova instituição correta | ⏳ PENDENTE | Não executado. |

### Seção C — Perfis, acesso e robustez

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU030-UI-009 | Entrar como representante e como aluno com a mesma conta | Sou representante e Sou aluno após promoção | Ambos os acessos funcionam; dados originais e menus corretos | ✅ PASSOU | Com o PR #195, a mesma conta entra como representante (“Sou representante”) e como aluno (“Sou aluno”). |
| CT-HU030-UI-010 | Perder funções de representante após revogação | Sessão existente e novo login após revogação | Sem funções de representante; aluno continua acessando | ⏳ PENDENTE | Não executado. |
| CT-HU030-UI-011 | Ocultar gestão a aluno e representante e bloquear links diretos | Menus e links para não administradores | Sem menu de gestão; Acesso Negado; sem privilégios administrativos | ⏳ PENDENTE | Não executado. |
| CT-HU030-UI-012 | Falha de conexão sem exemplos nem atribuição/revogação falsa | Listas e escritas sem resposta da API | Erro visível; sem exemplos; estado reconciliado com o banco | ⏳ PENDENTE | Não executado. |
| CT-HU030-UI-013 | Ver somente sua universidade e registrar presença real | Consulta/presença da própria instituição e de outra | Só próprios alunos; presença persiste; outra instituição bloqueada | ⏳ PENDENTE | Depende das HU-018/021; marcar 🚫 se ausentes. |

## Detalhamento dos casos

### Seção A — Listagem e atribuição

#### CT-HU030-UI-001 — Listar ativos e revogados sem representantes fictícios

**Dados de entrada:** Banco sem representações; depois Ana ativa F1, Pedro revogado F1 e Bruno ativo F2 (PC-04).

**Passos**

1. Como administrador, abrir **Cadastros → Representantes** antes da massa; pedir à IA para confirmar lista vazia na API (PC-05).
2. Preparar PC-04 e reabrir; conferir nome, email, instituição, status e busca por nome.
3. Buscar Pedro revogado e voltar à lista.

**Resultado esperado**

- Banco vazio mostra vazio real; não inventar Ana/Pedro dos exemplos antigos.
- Com massa, exibir ativos **e revogados**, identificados (AC-01), com instituição verdadeira.
- A tela atual faz `filter(r => r.ativo)` e não é alterada pelo PR #195: revogados ausentes são risco persistente, ainda não executado.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU030-UI-002 — Localizar aluno real e tratar pesquisa sem resultado

**Dados de entrada:** Larissa Mendes aprovada/ativa na F2; F1 e F2 no mesmo campus; `Nome Inexistente da Silva`; instituição sem candidato elegível.

**Passos**

1. Tocar **+ Novo**; abrir **Instituição de Ensino** e escolher F2; buscar o nome completo de Larissa e conferir o card **Discente selecionado**.
2. Pedir à IA para comparar nome/email/id e dados institucionais com o cadastro real (PC-05); testar busca parcial e nome inexistente.
3. Com massa preparada pela IA, conferir instituição sem candidato elegível; se não puder montar pela UI, registrar o preparo e restaurar a massa ao final.

**Resultado esperado**

- Localizar o aluno real e permitir conferir sua identidade antes de promover (AC-02). Busca inexistente informa nenhum aluno e não mantém o anterior selecionado (FA-004).
- Sem elegíveis, não mostrar João Neves/Clara Meireles de exemplos nem permitir promover aluno inexistente.
- O PR #195 remove listas fictícias e ajusta o filtro; ainda usa correspondência por qualquer palavra, como Campus/Quixadá. Anotar candidatos de outra instituição e conferir a responsabilidade efetivamente enviada no CT-003, sem inventar regra de que aluno só pode representar a própria faculdade.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU030-UI-003 — Atribuir a instituição escolhida e preservar cadastro de aluno

**Dados de entrada:** Larissa Mendes, F2 ativa com id diferente de 1; dados pessoais/curso/matrícula e credenciais conhecidos.

**Passos**

1. Pedir à IA para registrar dados de Larissa e id real da F2 (PC-05). Escolher F2 e conferir o aluno selecionado.
2. Tocar **Tornar representante**, ler a confirmação e cancelar; pedir à IA para conferir que nada foi gravado (PC-05).
3. Repetir e confirmar; anotar mensagem e listagem; fechar/reabrir o app ou recarregar a web.
4. Pedir à IA para conferir representação, instituição, cadastro original e log no banco/API (PC-05).

**Resultado esperado**

- Cancelar não promove; confirmar mostra sucesso e lista Larissa ativa na **F2 selecionada** (AC-03, AC-04, AC-12).
- Não basta o texto do seletor: `faculdade_id` gravado deve corresponder à F2, sem cair no padrão 1.
- Mesmos ids, dados e credenciais do aluno, sem duplicações; log PROMOVER com administrador e horário (AC-05, AC-10). Acesso do promovido é testado no CT-009.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU030-UI-004 — Exigir instituição válida e impedir seleção inativa

**Dados de entrada:** Aluno elegível livre; instituição não selecionada; F3 inativa; F2 ativa.

**Passos**

1. Abrir cadastro e tentar deixar Instituição de Ensino sem seleção, com aluno válido; tentar atribuir.
2. Se não existir ação para limpar e o campo vier preenchido, registrar a impossibilidade dessa variação pela UI e a seleção inicial, sem afirmar que validou campo vazio.
3. Pedir à IA para preparar/conferir F3 inativa; abrir o seletor e verificar se pode ser usada. Se puder, tentar atribuir com aluno livre.
4. Pedir à IA para conferir ausência de promoção nas recusas e o retorno da API (PC-05).

**Resultado esperado**

- Vazio é destacado e impede atribuição (AC-12); ver CT-HU030-API-003 se o vazio não puder ser montado na UI.
- Faculdade inativa não pode gerar representação; eventual recusa da API deve ser mostrada de forma clara, sem sucesso falso.
- Não usar silenciosamente F1 porque o service possui parâmetro padrão. Os critérios não definem seleção inicial obrigatoriamente vazia; registrar esse comportamento para alinhamento, sem criar regra nova.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU030-UI-005 — Impedir atribuição nos quatro estados inelegíveis

**Dados de entrada:** Alunos pendente, rejeitado, vínculo vencido e inativado; F1 ativa. Massa detalhada em PC-04 e CT-HU030-API-005.

**Passos**

1. Pedir à IA para conferir status/atividade/validade de cada aluno (PC-05); buscar cada um no cadastro.
2. Se a UI não permitir selecioná-lo, registrar a barreira e o motivo apresentado; não considerar isso prova do bloqueio de API.
3. Para avaliar mudança após seleção, a IA pode preparar aluno aprovado, Cauan seleciona e a IA restaura o estado inelegível antes da confirmação; registrar essa preparação. Executar uma variação por vez.
4. Pedir à IA para conferir ausência de perfil e de log de promoção indevida (PC-05).

**Resultado esperado**

- Não atribuir função a pendente, rejeitado, vínculo vencido nem inativo (AC-03, FA-002).
- Se houver tentativa de confirmar, mostrar orientação com o sentido de somente alunos aprovados e ativos poderem representar; texto literal não está definido.
- O filtro só por status `ativado` pode incluir vínculo vencido; a validação de backend também não olha a validade. Se a UI impedir montar alguma variação, registrar e usar a cobertura API, sem forçar um resultado aprovado.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU030-UI-006 — Impedir atribuição repetida ao representante ativo

**Dados de entrada:** Larissa ativa do CT-003; tentativa de nova atribuição na mesma instituição e em outra.

**Passos**

1. Abrir novo cadastro e buscar Larissa; conferir se a UI informa/exclui quem já tem função ativa.
2. Para testar a recusa na confirmação, selecionar um aluno livre e pedir à IA para promovê-lo antes de Cauan confirmar a mesma atribuição; registrar o preparo (PC-05).
3. Confirmar na UI; pedir à IA para conferir que existe só uma representação e que a instituição anterior foi mantida (PC-05).

**Resultado esperado**

- Impedir nova função ativa e informar que o aluno já é representante, conforme o fluxo disponível (AC-11, FA-003).
- Nenhum sucesso falso, duplicação ou troca silenciosa de instituição; resposta de conflito deve ser compreensível.
- O PR #195 ignora falha da consulta de representantes ao listar elegíveis (`catch(() => [])`): a proteção final da API precisa permanecer efetiva.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção B — Revogação e reatribuição

#### CT-HU030-UI-007 — Cancelar e confirmar revogação mantendo aluno e revogado na lista

**Dados de entrada:** Larissa representante ativa; sessão do administrador; cadastro do aluno previamente registrado.

**Passos**

1. Tocar na ação de revogar Larissa; ler **Revogar representação?**; tocar **Cancelar** e pedir à IA para conferir estado e ausência de novo log (PC-05).
2. Repetir e confirmar. O código atual chama o botão de **Inativar**; registrar o rótulo e conferir que a mensagem se refere à função.
3. Anotar confirmação, reabrir a lista e procurar Larissa como revogada.
4. Pedir à IA para conferir representação, usuário/aluno, perfis e log de revogação (PC-05).

**Resultado esperado**

- Cancelar mantém representação ativa e não gera log.
- Confirmar revoga só a função, mantém aluno ativo/dados originais e gera log REVOGAR (AC-06, AC-07, AC-10; FA-001).
- Larissa permanece visível como **revogada** (AC-01). Rótulo Inativar deve ser avaliado pela clareza; a operação não pode inativar o aluno. Falha só no console, sem feedback, também deve ser registrada.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU030-UI-008 — Reatribuir ao revogado em instituição diferente

**Dados de entrada:** Larissa revogada no CT-007, antes F2; nova atribuição à F1.

**Passos**

1. Abrir **+ Novo**, selecionar F1 e localizar Larissa; a ausência na lista de revogados não deve impedir conferir a busca no cadastro.
2. Confirmar, reabrir o app e pedir à IA para conferir instituição F1, status, linha e auditoria (PC-05).

**Resultado esperado**

- Larissa volta como representante ativa na F1, com sucesso (AC-13).
- Mesmo aluno e linha de representação, sem duplicações e sem permanecer ativa em F2; novo log PROMOVER (AC-05, AC-10).
- Se a busca não a disponibilizar, registrar impedimento/falha; o resultado esperado continua sendo reatribuição permitida segundo o requisito atual, ainda pendente de aprovação na issue #185.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção C — Perfis, acesso e robustez

#### CT-HU030-UI-009 — Entrar como representante e como aluno com a mesma conta

**Dados de entrada:** Larissa ativa após CT-008; email/senha originais; implementação com PR #195 ou correção equivalente, identificada em PC-01.

**Passos**

1. Sair da sessão administrativa. Na tela de login, escolher **Sou representante** e entrar com as credenciais de Larissa.
2. Conferir área do representante e perfil; fechar/reabrir para verificar sessão.
3. Sair, escolher **Sou aluno** e entrar com as mesmas credenciais; comparar os dados do cadastro.
4. Pedir à IA para conferir `usuario.roles` retornado pela API caso algum acesso falhe (PC-05).

**Resultado esperado**

- Acesso como representante após promoção e como aluno quando essa opção for escolhida (AC-04, AC-05).
- Não exigir nova conta/senha e não perder os dados originais. Não expor funções administrativas.
- Na versão sem PR #195, o app usa apenas perfil principal e pode bloquear representante promovido. Registrar falha da versão, não troca indevida de credenciais. Abrir a tela estática não aprova lista/presença real do CT-013.

**Resultado obtido**

- **Conta usada:** a conta de teste que é aluno e representante (`qa.hu007.rep`), no lugar da Larissa do plano.
- **API:** `POST /auth/login` devolve `role: "aluno"` e `roles: ["aluno", "representante", "supervisor"]` (o PR #195 passou a enviar o array `roles` no backend). Conta só de aluno devolve `roles: ["aluno"]`.
- **“Sou representante”:** o login foi aceito. O console do app registrou o perfil `MOTORISTA` indo para `(representante)/home` e `(representante)/perfil`. O testador relatou que o caso passou.
- **“Sou aluno”:** o login com a mesma conta foi aceito, com o perfil `ALUNO` em `(aluno)/home` e `(aluno)/perfil`.
- É a correção da [#190](https://github.com/GOUOCE/GOUCE-app/issues/190) (login de aluno promovido a representante), que antes dava “Perfil incompatível”.
- Status: ✅ Passou.

---

#### CT-HU030-UI-010 — Perder funções de representante após revogação

**Dados de entrada:** Larissa com sessão de representante aberta; administrador em segunda sessão/dispositivo; revogação real.

**Passos**

1. Manter sessão de Larissa como representante e revogar a função pelo administrador em outra sessão.
2. Na sessão anterior, tentar recarregar e acessar uma função real de representante; pedir à IA para conferir resposta e ausência de escrita indevida (PC-05). Se HU-018/021 não existir, registrar essa parte como 🚫.
3. Sair e tentar novamente **Sou representante**; depois entrar por **Sou aluno**.
4. Pedir à IA para conferir perfis, usuário ativo e dados originais no banco/login (PC-05).

**Resultado esperado**

- Representação revogada não mantém autorização de lista/presença por sessão antiga (AC-07). Tela estática isolada não é prova de autorização.
- Novo login como representante é bloqueado com sentido de perfil incompatível; login como aluno funciona e mantém dados.
- Não exigir mensagem literal não definida pela HU. O PR #195 valida os perfis disponíveis no login; a perda efetiva de permissões também deve ser verificada na API.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU030-UI-011 — Ocultar gestão a aluno e representante e bloquear links diretos

**Dados de entrada:** Aluno comum e representante ativo Ana/Bruno; links de gestão `/representantes` e `/representantes/cadastrar`; outros cadastros administrativos.

**Passos**

1. Entrar como aluno comum, conferir menus e abrir links PC-06.
2. Repetir como representante **ainda ativo**, Ana ou Bruno, pois Larissa pode estar revogada.
3. Como representante, tentar links administrativos de motoristas/frota/faculdades quando as telas estiverem presentes.

**Resultado esperado**

- Menu Representantes não aparece para aluno nem representante; links de gestão mostram **Acesso Negado**, sem dados/formulário brevemente visíveis (AC-09, RN-006).
- Representante não recebe funções administrativas só porque acompanha embarque.
- Rota inexistente não prova autorização correta. As rotas de API são cobertas no CT-HU030-API-012.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU030-UI-012 — Falha de conexão sem exemplos nem atribuição/revogação falsa

**Dados de entrada:** Lista e cadastro de representantes; aluno elegível livre e representante ativo; API inacessível durante a operação.

**Passos**

1. Na execução futura, tornar somente a API inacessível, mantendo o bundle Expo disponível; abrir listagem e busca de alunos.
2. Carregar a tela com conexão antes, se necessário; retirar acesso à API antes de confirmar promoção/revogação.
3. Anotar mensagens e dados; restaurar conexão, reabrir e pedir à IA para conferir representações, perfis e logs (PC-05).

**Resultado esperado**

- Mensagem clara de conexão, sem travar nem exibir alunos/representantes de exemplo como dados reais.
- Não apresentar sucesso sem confirmação da API; após reconectar, a lista reflete o banco. Diferenciar resposta perdida após gravação de sucesso puramente local, com apoio da IA.
- O PR #195 remove os fallbacks do service, mas a tela ainda pode só escrever erros no console; conferir feedback visível, preservação da seleção e possibilidade de tentar de novo.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU030-UI-013 — Ver somente sua universidade e registrar presença real

**Dados de entrada:** Ana em F1, Bruno em F2; listas/alunos reais distintos; HU-018/021 presentes.

**Passos**

1. Conferir PC-07; sem funcionalidade real, registrar 🚫 e não usar passageiros estáticos como massa válida.
2. Entrar como Ana, abrir a lista de embarque e marcar presença de aluno da F1.
3. Procurar/tentar acessar lista da F2; repetir com Bruno para verificar o inverso.
4. Reabrir a tela e pedir à IA para conferir presença no banco e ausência de alterações na outra universidade (PC-05).

**Resultado esperado**

- Exibir e permitir presença apenas da universidade sob responsabilidade (AC-08, RN-015).
- Presença própria persistida após reabrir; nenhuma consulta/escrita indevida na outra universidade.
- “Ônibus 04 | Rota: Quixadá” e checkboxes estáticos não aprovam a regra. Tentativa direta de API contra outra instituição está em CT-HU030-API-013.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 — ativos e revogados | Visualiza ativos e revogados | CT-001, CT-007 |
| AC-02 / FA-004 — localizar aluno | Pesquisa/seleciona; nenhum aluno encontrado | CT-002 |
| AC-03 / FA-002 — aprovado e ativo | Atribui aprovado; bloqueia quatro estados inelegíveis | CT-003, CT-005 |
| AC-04 — permissões concedidas | Atribui função ao aluno aprovado | CT-003, CT-009 |
| AC-05 — cadastro original mantido | Atribuição mantém dados e vínculo de aluno | CT-003, CT-008, CT-009 |
| AC-06 / FA-001 — revogação | Revoga função do representante | CT-007 |
| AC-07 — perda de funções, aluno ativo | Revoga mantendo aluno; login/permissões após revogação | CT-007, CT-010 |
| AC-08 / RN-015 — escopo institucional | Lista e presença só da universidade responsável | CT-013 — depende das HU-018/021 |
| AC-09 / RN-006 — acesso restrito | Menu não exibido a aluno/representante | CT-011; API em CT-HU030-API-012 |
| AC-10 / RNF-013 — auditoria | Atribuição e revogação auditadas | CT-003, CT-007, CT-008, com apoio da IA; CT-HU030-API-008 |
| AC-11 / FA-003 — função já ativa | Bloqueia atribuição repetida | CT-006 |
| AC-12 — instituição obrigatória | Bloqueia sem seleção | CT-004; instituição realmente gravada em CT-003 |
| AC-13 — reatribuição | Atribui novamente após revogação | CT-008 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Referências: [HU-030, seção 7.3.5](../../../../../docs/requisitos.md), [BDD](../../../../../bdd/features/epico-02/HU-030.feature), [README do BDD](../../../../../bdd/features/epico-02/README.md), [issue #185](https://github.com/GOUOCE/GOUCE-app/issues/185) e [PR #195](https://github.com/GOUOCE/GOUCE-app/pull/195).
- **Versões conferidas em 24/10/2026:** PR #195 aberto, `mergedAt=null`, branch `fix/issues-hu030`, head `27b6df1f4f7194e125e92e509b371b618f0b4c99`, igual à referência local lida com `git show`/`git diff`. Issues [#188](https://github.com/GOUOCE/GOUCE-app/issues/188), [#189](https://github.com/GOUOCE/GOUCE-app/issues/189) e [#190](https://github.com/GOUOCE/GOUCE-app/issues/190) estão fechadas; isso não significa que suas correções estejam na branch de planejamento ou na develop.
- A execução futura será **na branch da própria implementação/correção**, antes da integração em develop. Para retestar o perfil e a remoção de exemplos, usar o conteúdo do PR #195 ou correção equivalente, registrando branch/commit. O planejamento permanece em `test/casos-api-ui-epico-02`; não foi feito checkout, merge nem execução.
- **Riscos mapeados no código**:
  - Backend em `backend/src/modulos/usuarios/`: promoção verifica `status_cadastro == ativado` e `usuario.ativo`, mas não `validade_acesso`. Vínculo vencido pode ser promovido, divergindo do BDD/FA-002 (API CT-005; UI CT-005).
  - Identificador de representação é o do usuário/aluno, guardado em `representante.administrador_id`; não é id de administrador executor nem sequência independente. Revogar deve usar o id retornado, preservando `usuario` e `aluno` (API CT-002/007).
  - Promoção/revogação gravam `PROMOVER`/`REVOGAR`; reatribuição reaproveita a linha e troca `id_faculdade_responsavel`. Conferir ausência de duplicação e instituição antiga/nova na auditoria (API CT-008/009; UI CT-008).
  - Frontend `representantes/index.tsx` filtra `r.ativo` e oculta revogados, contrário ao AC-01. O PR #195 **não altera essa tela**. Botão diz Inativar, embora a confirmação fale de revogar representação; falhas de revogação só vão ao console (UI CT-001/007/012).
  - `representantes/cadastrar.tsx` mantém seletor fixo de UFC/IFCE/UECE e pré-seleciona UFC. A chamada de atribuição passa só o aluno e omite instituição; o service mantém `faculdadeId = 1`, inclusive no PR #195. O rótulo escolhido pode divergir da responsabilidade gravada (UI CT-003/004/008).
  - Antes do PR #195, `representanteService.ts` substitui listas vazias/falhas por representantes e alunos fictícios e pode fingir sucesso offline. No PR esses fallbacks são removidos; ainda há valores de exibição padrão, como UFC/curso/semestre, quando faltam campos (UI CT-001/002/012). Conferir dados reais com PC-05.
  - O PR #195 lê `usuario.roles` para permitir escolher Sou representante ou Sou aluno, acrescenta o perfil `representante` ao legado `supervisor` no backend e remove mocks do service. Não afirmar que corrige todos os problemas da HU (UI CT-009/010).
  - O filtro de instituição do PR aceita correspondência por **qualquer** palavra; Campus/Quixadá pode coincidir entre faculdades diferentes. Além disso, falha na consulta de representantes vira lista vazia de exclusão de já ativos; a API deve manter o bloqueio de duplicidade (UI CT-002/006).
  - A área de representante continua estática, com “Ônibus 04 | Rota: Quixadá” e passageiros locais. RN-015 exige HU-018/021 e não pode ser aprovada por abrir essa tela (API/UI CT-013).
- Técnicas: **partição de equivalência** dos quatro estados de elegibilidade e perfis; **valor-limite** de ids positivos/não positivos e validade no passado versus futuro; **transição de estado** sem função → ativa → revogada → ativa; **tabela de decisão** de aprovação/atividade/validade, instituição válida/inativa e função já ativa. Prioridade em instituição gravada, dados originais, autorização e auditoria.
- **Dúvidas/divergências para alinhamento**:
  - A issue #185 segue aberta e o responsável ainda não confirmou as decisões: instituição obrigatória e reatribuição após revogação permanecem referências provisórias do requisito atual, **não decisões aprovadas por esta suíte**.
  - O documento usa RF-034 e a tabela RF-34; esta suíte rastreia ambos como o mesmo item pendente de padronização.
  - FA-002, FA-003 e FA-004 não fixam texto literal. Conferir o sentido da mensagem; “Aluno não aprovado ou inativo.” não é falha apenas por não repetir outra frase. Vínculo vencido aceito, por outro lado, contraria o cenário expresso do BDD.
  - O requisito não diz que a instituição sob responsabilidade tem de ser igual à matrícula do aluno; o backend permite que difiram. **Confirmar essa regra** antes de exigir bloqueio de atribuição entre faculdades. Os casos conferem a instituição escolhida e a preservação da matrícula, sem criar restrição nova.
  - O requisito não exige seletor inicialmente vazio; o AC-12 exige instituição válida e preenchida. Se a UI não deixa limpar a seleção, registrar a variação vazia como não exercitável nela e usar o caso de API, sem presumir validação aprovada.
- Todos os casos permanecem pendentes; riscos estáticos não são defeitos reproduzidos. Marcar dependências 🚫 somente durante a execução, distinguir falha da versão e impedimento de massa/funcionalidade e registrar cada variação. Não alterar o resultado esperado para aprovar o código atual.
- Suíte complementar: [API-HU-030.md](../api/API-HU-030.md). Os passos de persistência e auditoria usam PC-05; Cauan não precisa fazer consultas de banco manualmente.
- Se uma falha anterior impedir promoção/revogação pela UI, a IA pode preparar o estado requerido para testar outro caso independente, registrando a origem e mantendo a falha anterior. Se o estado não puder ser preparado, marcar o dependente como 🚫.
- Ocultar senhas, tokens e dados pessoais nas evidências.
