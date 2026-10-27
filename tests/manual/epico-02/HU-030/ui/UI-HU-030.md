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
| ❌ Concluída com falhas | 13 | 3 | 6 | 0 | 4 |

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
| CT-HU030-UI-001 | Listar ativos e revogados sem representantes fictícios | Lista vazia; ativos/revogados reais | Sem exemplos; ambos os status identificados e dados reais | ❌ FALHOU | A lista mostra representantes reais e a busca funciona, mas os representantes revogados não aparecem na tela, contrariando o AC-01. |
| CT-HU030-UI-002 | Localizar aluno real e tratar pesquisa sem resultado | Busca real, nomes semelhantes e lista de elegíveis vazia | Aluno correto; vazio informado; sem João/Clara fictícios | ⏳ NÃO EXECUTADO | Fora do recorte reduzido desta execução. |
| CT-HU030-UI-003 | Atribuir a instituição escolhida e preservar cadastro de aluno | Promover Larissa para F2 ≠ 1; confirmação e persistência | Sucesso; F2 correta no banco; mesmo aluno | ❌ FALHOU | Reprovado pela leitura do código (não executado na tela): a instituição escolhida não é enviada, e a atribuição sempre usa a faculdade 1. |
| CT-HU030-UI-004 | Exigir instituição válida e impedir seleção inativa | Instituição vazia/inativa; seleção válida | Bloqueio compreensível; nenhum perfil ou instituição padrão indevida | ❌ FALHOU | Reprovado pela leitura do código (não executado na tela): a lista de instituições é fixa e nunca fica vazia nem trata instituição inativa. |
| CT-HU030-UI-005 | Impedir atribuição nos quatro estados inelegíveis | Quatro estados do BDD, inclusive validade vencida | Sem promoção; orientação de somente aprovados/ativos | ⏳ NÃO EXECUTADO | Fora do recorte reduzido desta execução. |
| CT-HU030-UI-006 | Impedir atribuição repetida ao representante ativo | Já representante; tentativa repetida e resposta 409 | Bloqueio por função ativa; sem duplicação nem troca de instituição | ⏳ NÃO EXECUTADO | Fora do recorte reduzido desta execução. |

### Seção B — Revogação e reatribuição

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU030-UI-007 | Cancelar e confirmar revogação mantendo aluno e revogado na lista | Modal cancelar/confirmar; função revogada, aluno preservado | Cancelar não grava; confirmar revoga só a função e mantém linha visível | ❌ FALHOU | Cancelar não revoga e confirmar revoga só a função, com auditoria, mas o revogado some da lista em vez de ficar visível como revogado. |
| CT-HU030-UI-008 | Reatribuir ao revogado em instituição diferente | Revogada → ativa; responsabilidade F2 → F1 | Sucesso; mesma identidade; nova instituição correta | ❌ FALHOU | Reprovado pela leitura do código (não executado na tela): depende da instituição escolhida, que é ignorada. |

### Seção C — Perfis, acesso e robustez

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU030-UI-009 | Entrar como representante e como aluno com a mesma conta | Sou representante e Sou aluno após promoção | Ambos os acessos funcionam; dados originais e menus corretos | ✅ PASSOU | Com o PR #195, a mesma conta entra como representante (“Sou representante”) e como aluno (“Sou aluno”). |
| CT-HU030-UI-010 | Perder funções de representante após revogação | Sessão existente e novo login após revogação | Sem funções de representante; aluno continua acessando | ✅ PASSOU | Revogada a função, “Sou representante” é recusado com “Perfil incompatível” e “Sou aluno” entra normalmente. |
| CT-HU030-UI-011 | Ocultar gestão a aluno e representante e bloquear links diretos | Menus e links para não administradores | Sem menu de gestão; Acesso Negado; sem privilégios administrativos | ✅ PASSOU | Aluno e representante foram levados a Acesso Negado em todos os links de gestão, sem abrir nenhuma tela administrativa. |
| CT-HU030-UI-012 | Falha de conexão sem exemplos nem atribuição/revogação falsa | Listas e escritas sem resposta da API | Erro visível; sem exemplos; estado reconciliado com o banco | ❌ FALHOU | Reprovado pela leitura do código: o PR removeu os exemplos, mas a falha da lista e da revogação não mostra erro na tela. |
| CT-HU030-UI-013 | Ver somente sua universidade e registrar presença real | Consulta/presença da própria instituição e de outra | Só próprios alunos; presença persiste; outra instituição bloqueada | ⏳ NÃO EXECUTADO | Fora do recorte reduzido desta execução. |

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

- **Banco não estava vazio:** já havia dois representantes reais (Cauan Ricardo e QA Teste Representante Sete); o trecho de lista vazia não foi executado. Antes do caso foi promovida pela API a conta `qa.hu007.aluno` (id 14) para servir de representante a revogar (auditoria `PROMOVER`, id 39).
- **Dados reais e busca:** o testador relatou que a lista mostrou os representantes certos, sem exemplos fictícios, e que a busca por nome funcionou. O PR #195 removeu os exemplos de `representanteService.ts`.
- **Revogados:** após a revogação do CT-007, a API continua devolvendo o QA Teste Aluno Sete com `ativo = false`, mas a tela não o mostra: `representantes/index.tsx` faz `setRepresentantes(lista.filter((r) => r.ativo))`. O AC-01 pede a listagem dos representantes ativos **e** dos que tiveram a função revogada, identificados.
- **Visto na tela** (print do testador, 2026-10-27 02:25) em **Cadastrar Representante**: a tela abriu com a instituição **IFCE - Campus Quixadá** e o discente **QA Teste Aluno Sete** já selecionados, dados da vez anterior (telas não recriadas), e o cartão do discente mostra “Engenharia de Software | 2024.1”, que a API não envia (`/usuarios/alunos` não traz curso nem semestre): os valores vêm dos padrões fixos de `representanteService.ts` (`curso || 'Engenharia de Software'`, `periodo_ingresso || '2024.1'`). Na mesma tela, os rótulos do cartão e o botão “Tornar representante” aparecem com fonte serifada, diferente do restante (causa não investigada).
- O testador relatou também que a seta de voltar leva ao **Painel** (`router.back()` em todas as telas de gestão).
- Status: ❌ Falhou (revogados fora da lista). O testador considerou o caso aprovado pelos itens de busca e dados reais.

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

- **Não executado.** A execução foi reduzida aos casos principais do PR #195; este caso (busca de aluno elegível) ficou fora do recorte, a pedido do testador, e não foi avaliado.
- Status: ⏳ Não executado.

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

- **Não executado na tela**, a pedido do testador, pela evidência no código.
- `representantes/cadastrar.tsx` chama `representanteService.atribuirRepresentante(alunoSelecionado.aluno_id || alunoSelecionado.id)`, **sem passar a instituição**; o serviço usa `faculdadeId = 1` como padrão e envia `faculdade_id: 1` em `POST /representantes/promover`. Qualquer instituição escolhida na tela vira a faculdade 1, e a F2 do plano nunca seria gravada.
- A lista de instituições da tela é fixa (`UFC - Campus Quixadá`, `IFCE - Campus Quixadá` e `UECE - Campus Quixadá`), e a seleção inicial é `UFC - Campus Quixadá`; ela não vem da API.
- Relacionado à [#262](https://github.com/GOUOCE/GOUCE-app/issues/262) (lista fixa de instituições no cadastro).
- Status: ❌ Falhou (por análise do código).

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

- **Não executado na tela.** A seleção da instituição em `cadastrar.tsx` usa uma lista fixa de três itens, sempre com `UFC - Campus Quixadá` pré-selecionada. Não há estado de instituição vazia, instituição inativa nem consulta às faculdades cadastradas, então o bloqueio pedido pelo caso não existe.
- Como a instituição escolhida também não é enviada à API (CT-003), a validação por instituição não acontece em nenhum ponto da tela.
- Status: ❌ Falhou (por análise do código).

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

- **Não executado.** A execução foi reduzida aos casos principais do PR #195; este caso (alunos inelegíveis) ficou fora do recorte, a pedido do testador, e não foi avaliado.
- Status: ⏳ Não executado.

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

- **Não executado.** A execução foi reduzida aos casos principais do PR #195; este caso (atribuição repetida) ficou fora do recorte, a pedido do testador, e não foi avaliado.
- Status: ⏳ Não executado.

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

- Representante revogado: `QA Teste Aluno Sete` (aluno id 14, promovido pela API antes do CT-001).
- **Cancelar:** o log da API não registrou chamada de revogação nessa etapa.
- **Confirmar:** `PATCH /representantes/14/revogar` com `200`. No banco, `is_representante_ativo = false` para o id 14 e os outros dois representantes seguem ativos; a auditoria ganhou `REVOGAR` (id 40, de `{"faculdade_id":1,"ativo":true}` para `{"faculdade_id":1,"ativo":false}`).
- **Lista:** o testador relatou que o QA Teste Aluno Sete não aparece mais, nem depois de atualizar a página. Pelo código, a tela filtra `ativo` (ver CT-001), então o revogado não fica visível como revogado, como o caso e o AC-01 pedem.
- Mensagem de sucesso (pelo código): barra preta “Representante revogado” (`index.tsx`, `Snackbar`), fora do padrão de pop-up; o pop-up de confirmação é “Revogar representação?”. Se a revogação falhar, o código só faz `console.error`, sem aviso na tela.
- A permanência do aluno ativo e dos dados originais é conferida no CT-010 (login como aluno).
- Status: ❌ Falhou (revogado não permanece visível).

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

- **Não executado na tela.** O caso reatribui um representante revogado a uma instituição diferente. Como a instituição escolhida não é enviada à API e a promoção usa sempre a faculdade 1 (CT-003), a nova responsabilidade não seria gravada.
- Pelo código, o aluno revogado volta a aparecer entre os elegíveis (o filtro exclui só os representantes ativos), então a reatribuição para a mesma faculdade 1 é possível.
- Status: ❌ Falhou (por análise do código).

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

- Conta `qa.hu007.aluno`, revogada no CT-007. O testador relatou que **“Sou representante”** deu “Perfil incompatível” e que **“Sou aluno”** entrou normalmente.
- **Conferido:** o login dessa conta passou a devolver `roles: ["aluno"]`, o usuário continua ativo no banco e o console do app registrou apenas a entrada com `ALUNO` em `(aluno)/home`, sem nenhuma entrada de representante. O login com a escolha de representante foi recusado antes de abrir a sessão.
- **Não coberto:** a sessão antiga já aberta durante a revogação (passo 1 e 2 do plano) e a lista ou presença reais do representante (HU-018/021); nesses pontos o caso fica sem verificação.
- Status: ✅ Passou (login). Sessão antiga e funções reais do representante: 🚫 sem a funcionalidade.

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

- Contas usadas: `qa.hu007.aluno` (aluno) e `qa.hu007.rep` (representante, com “Sou representante”). O testador relatou que todos os links de gestão (`/representantes`, `/representantes/cadastrar` e os de outras gestões) mostraram **Acesso Negado** (erro 403).
- O console do app registrou quatro redirecionamentos para `acesso-negado`, dois com o perfil `MOTORISTA` e dois com `ALUNO`, e nenhuma abertura de tela administrativa (`representantes`, `frota` ou `motoristas`) por esses perfis. O log da API não registra chamada de gestão feita por eles.
- Também aparece no console uma tentativa de entrar com a conta do representante escolhendo “Sou administrador”, que o app recusou.
- Status: ✅ Passou.

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

- **Não foi derrubada a API.** Avaliado pela leitura de `representanteService.ts` e das telas.
- **Melhoria do PR #195:** o serviço não tem mais lista de exemplo nem sucesso falso; se a chamada falha, o erro é propagado.
- **Falta:** em `representantes/index.tsx`, a falha ao carregar só faz `console.warn` e a revogação só faz `console.error`. A tela mostra “Nenhum representante cadastrado.” quando a lista não carrega, sem mensagem de erro de conexão, e a falha da revogação não é avisada. Na atribuição, o erro aparece no pop-up “Aviso” com a mensagem do erro.
- Status: ❌ Falhou (por análise do código).

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

- **Não executado.** A execução foi reduzida aos casos principais do PR #195; este caso (presença real, que depende da HU-018/021) ficou fora do recorte, a pedido do testador, e não foi avaliado.
- Status: ⏳ Não executado.

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
| CT-001, CT-007 | Representantes revogados somem da lista (a tela filtra só os ativos), contrariando o AC-01 | [#297](https://github.com/GOUOCE/GOUCE-app/issues/297) |
| CT-003, CT-004, CT-008 | A instituição escolhida é ignorada: a atribuição usa sempre a faculdade 1, e a lista de instituições é fixa. **Bloqueante** | [#298](https://github.com/GOUOCE/GOUCE-app/issues/298) |
| CT-007 | Mensagens de sucesso em barra preta, fora do padrão de pop-up | [#299](https://github.com/GOUOCE/GOUCE-app/issues/299) |
| CT-001, CT-007 | Telas não recriadas: Cadastrar reabre com instituição e discente da vez anterior (print) e a seta volta ao Painel | [#301](https://github.com/GOUOCE/GOUCE-app/issues/301) |
| CT-001, CT-012 | Falha da lista e da revogação sem erro visível; curso e semestre inventados no cartão do discente (print) | [#300](https://github.com/GOUOCE/GOUCE-app/issues/300) |
| CT-009 | Login de aluno promovido a representante, que dava “Perfil incompatível” | Corrigido pelo PR #195 ([#190](https://github.com/GOUOCE/GOUCE-app/issues/190)) |

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
- **Execução (27/10/2026), recorte reduzido a pedido do testador:** 3 casos passaram (CT-009, 010 e 011), 6 falharam (CT-001 e 007 na tela; CT-003, 004, 008 e 012 reprovados pela leitura do código, sem executar) e 4 não foram executados (CT-002, 005, 006 e 013). O PR #195 corrigiu o login de representante promovido e removeu os exemplos do serviço, mas não mexeu na tela de representantes (revogados ocultos, instituição ignorada).
- Suíte complementar: [API-HU-030.md](../api/API-HU-030.md). Os passos de persistência e auditoria usam PC-05; Cauan não precisa fazer consultas de banco manualmente.
