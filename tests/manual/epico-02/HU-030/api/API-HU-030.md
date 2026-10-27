# Testes manuais de API — HU-030 — Gerenciamento de Representantes

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Gestão de Cadastros Base (EP-002) |
| Funcionalidade | HU-030 — Gerenciamento de Representantes |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial (baseada em risco) |
| Endpoints | `GET /representantes` (filtros `ativo`, `faculdade_id`), `POST /representantes/promover` com JSON `aluno_id` e `faculdade_id`, `PATCH /representantes/{id}/revogar` sem corpo obrigatório. Todas exigem administrador. O id da URL é o do usuário/aluno. |
| Ambiente | Stack Docker isolada com banco limpo (`docker compose -p atu-api`), API em `http://localhost:8001`, branch `feature/testes-api-hu-030`, commit `5e7301a0` (`develop`, **sem** o PR #195). Migrations até a 75 com um contorno de ambiente (ver Observações gerais) |
| Total de casos | 13 |
| Última execução | 2026-10-25 |
| Testador | Cauan Ricardo — execução com apoio de IA (Claude Code) |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ❌ Reprovada | 13 | 9 | 1 | 2 | 1 | 0 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | Na execução futura, stack isolada com banco limpo; API disponível, Postman/Insomnia ou Swagger em `/docs`. Anotar versão com/sem PR #195; a execução será na branch da implementação. |
| PC-02 | Token do administrador A via `POST /auth/login` com o administrador do seed; anotar id e horários. Seed deve conter o tipo de usuário `representante`, exigido pela promoção; falta dele é impedimento de ambiente, não inelegibilidade do aluno. |
| PC-03 | Credenciais do aluno comum, Larissa e representantes ativos Ana/Bruno. Login real dos representantes é necessário para CT-012/013; não substituir pelo token administrativo. |
| PC-04 | **Massa após conferir vazio:** F1 = UFC / Campus Quixadá ativa; F2 = IFCE / Campus Quixadá ativa, com **id diferente de 1**; F3 = faculdade inativa. Alunos de teste com credenciais conhecidas: Larissa Mendes aprovada (`ativado`), usuário ativo, validade futura e matrícula F2, ainda sem função; Ana Beatriz representante ativa F1; Pedro Henrique revogado F1; Bruno representante ativo F2; aluno aprovado livre para recusas; alunos pendente, rejeitado, vínculo vencido e inativado. “Reprovado” do BDD corresponde a `rejeitado`; “vínculo vencido” é `ativado` + usuário ativo + `validade_acesso` no passado, não um novo status textual. Anotar ids reais, datas/fuso e origem de cada preparo via API/banco local. Não usar preparo como evidência de operação aprovada. |
| PC-05 | **Apoio da IA (Claude Code)** para executar chamadas e conferir na API/banco dados e persistência, com validação de Cauan: tabelas `usuario`, `aluno`, `representante`, `usuario_tipo`, `faculdade` e `log_auditoria`. Ocultar credenciais/tokens; comparar dados pessoais pela API/ORM quando cifrados. |
| PC-06 | CT-002 promove Larissa para F2; CT-007 revoga; CT-009 reatribui F1; CT-010 guarda sessão de representante e CT-011 revoga de novo. Manter Ana/Bruno ativos para autorização e escopo. CT-008 revisita os logs após as transições posteriores. |
| PC-07 | Para CT-013 e parte do CT-011, HU-018/021 disponíveis com endpoints reais de lista/presença. Sem eles, marcar as partes como 🚫; não inventar caminhos nem usar tela estática como evidência. |

## Resumo da execução

São **13 casos essenciais**, executados na ordem abaixo. CT-001 começa com vazio e repete filtros após preparar massa; CT-008 volta à auditoria após CT-009/011. Chamadas administrativas usam token de A, exceto perfis explicitamente indicados. Registrar separadamente cada estado/entrada.

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU030-API-001 | Listar ativos e revogados e filtrar instituição | Vazio; ativos/revogados; filtros de status/instituição | 200; ambos os status sem filtro; id igual ao do aluno | ✅ PASSOU | 200 `[]` no vazio; sem filtro vêm ativos e revogados; filtros por status, instituição e combinados respeitados. |
| CT-HU030-API-002 | Promover aluno aprovado e ativo sem alterar seu cadastro | Larissa aprovada/ativa e instituição F2 com id ≠ 1 | 201; representação F2; mesmo aluno e dados preservados | ✅ PASSOU | 201 para Larissa na F2; mesmo aluno e matrícula; perfil de representante concedido sem novo usuário. |
| CT-HU030-API-003 | Validar instituição obrigatória e ids | Omissão/null; fronteiras −1/0/positivo e tipo inválido | 422; erro por campo; nenhuma promoção | ⚠️ PARCIAL | 422 em todas as variações e nada gravado; mas a mensagem é só “Valor inválido.”, sem motivo. |
| CT-HU030-API-004 | Recusar aluno/instituição inexistente e faculdade inativa | Referências inexistentes e instituição inativa | 404 para inexistentes; 422 para faculdade inativa | ✅ PASSOU | 404 “Aluno não encontrado.” e “Faculdade não encontrada.”; 422 “Faculdade inativa.”; nada gravado. |
| CT-HU030-API-005 | Bloquear os quatro estados inelegíveis do BDD | Pendente; rejeitado; vínculo vencido; inativo | 422 com sentido de somente aprovados/ativos; sem promoção | ❌ FALHOU | Pendente, rejeitado e inativado recusados (422); aluno com vínculo vencido foi promovido (201). |
| CT-HU030-API-006 | Impedir promoção repetida de representante ativo | Mesma função ativa, mesma ou outra instituição | 409; sem duplicação nem troca silenciosa de instituição | ✅ PASSOU | 409 “Este aluno já é um representante ativo.” na mesma e em outra instituição; sem troca silenciosa nem log. |
| CT-HU030-API-007 | Revogar função preservando aluno e tratar repetição/inexistente | Ativo → revogado; repetição; aluno sem representação | 200 e aluno mantido; repetição 409; inexistente 404 | ✅ PASSOU | 200 na revogação (aluno mantido); repetição 409; inexistente e nunca promovido 404. |
| CT-HU030-API-008 | Auditar atribuição, revogação e reatribuição | PROMOVER/REVOGAR; valores, usuário e timestamp | Um log por operação efetiva; tentativas recusadas sem log de sucesso | ✅ PASSOU | Um log por operação efetiva (PROMOVER/REVOGAR), com executor, valores e horário; recusas sem log. |
| CT-HU030-API-009 | Reatribuir ao revogado em outra instituição sem duplicar aluno | Revogado → ativo; instituição diferente | 201; mesma linha e aluno; F1 correta; novo log | ✅ PASSOU | 201 na reatribuição à F1; mesma linha e aluno; F2 sem vínculo ativo; novo log PROMOVER. |
| CT-HU030-API-010 | Conceder perfil no login e preservar acesso de aluno | Login após promoção; perfis de aluno/representante e dados originais | 200; ambos os perfis; cadastro/credenciais preservados | ✅ PASSOU | Login 200 com `aluno` e `supervisor` (papel legado do representante); dados originais preservados. |
| CT-HU030-API-011 | Remover permissões após revogação, inclusive com sessão anterior | Revogar com sessão existente; token antigo e login novo | Aluno continua acessando; nenhuma permissão de representante | ⚠️ PARCIAL | Novo login volta só com `aluno`; a parte com endpoint exclusivo de representante é 🚫 (não existe na `develop`). |
| CT-HU030-API-012 | Restringir gestão a administrador e negar menus administrativos ao representante | Três credenciais × todas as rotas de representantes | 403 aluno/representante; 401 sem autenticação; nenhuma escrita | ✅ PASSOU | 403 (aluno e representantes) e 401 (sem token) nas 3 rotas; representante também 403 em `/motoristas`; nada gravado. |
| CT-HU030-API-013 | Limitar lista e presença à instituição sob responsabilidade | Própria universidade × outra; consulta e escrita direta | Só próprios alunos; presença externa recusada e não gravada | 🚫 BLOQUEADO | Sem endpoints de lista/presença (HU-018/021) na `develop`: o OpenAPI só tem as 3 rotas de representantes. |

## Detalhamento dos casos

### CT-HU030-API-001 — Listar ativos e revogados e filtrar instituição

**Dados de entrada:** `GET /representantes`, `?ativo=true`, `?ativo=false`, `?faculdade_id=<F1/F2>` e combinação dos filtros; administrador A. Busca de aluno real em `GET /usuarios/alunos?status=ativado`.

**Passos**

1. Conferir lista vazia antes da massa; preparar PC-04 e repetir todos os filtros.
2. Conferir Ana ativa, Pedro revogado e Bruno ativo em outra instituição, com apoio da IA (PC-05).
3. Consultar alunos ativados e localizar Larissa pelo nome/id existente para a promoção.

**Resultado esperado**

- HTTP `200`; sem filtro inclui ativos **e revogados**, cada um com status identificável (AC-01).
- Filtros respeitados, inclusive status + instituição; nome, email, faculdade e campus corretos. `id` e `aluno_id` identificam o usuário/aluno, não uma sequência própria de representação.
- Larissa é localizada em dados reais; lista vazia retorna `[]`. Não exigir parâmetro de busca de nome inexistente na rota `/representantes`: o frontend filtra localmente.

**Resultado obtido**

- Antes da massa, `GET /representantes` devolveu `200` `[]`. Com Ana (F1, ativa), Pedro (F1, revogado) e Bruno (F2, ativo): sem filtro, 3 itens (inclui o revogado); `ativo=true`: Ana e Bruno; `ativo=false`: Pedro; `faculdade_id=1`: Ana e Pedro; `faculdade_id=2`: Bruno; `ativo=false&faculdade_id=1`: Pedro; `ativo=true&faculdade_id=2`: Bruno.
- Cada item traz `id`, `aluno_id` (iguais), nome, e-mail, `faculdade_id`, instituição e campus. `GET /usuarios/alunos?status=ativado` lista Larissa, usada na promoção.
- Status: ✅ Passou.

---

### CT-HU030-API-002 — Promover aluno aprovado e ativo sem alterar seu cadastro

**Dados de entrada:** `POST /representantes/promover` JSON `{"aluno_id":<Larissa>,"faculdade_id":<F2>}`; F2 ativa com id diferente de 1 e Larissa com vínculo vigente.

**Passos**

1. Pedir à IA para registrar id, dados pessoais, faculdade de matrícula e validade do aluno antes da operação (PC-05).
2. Enviar promoção, anotar horário/id e conferir a listagem com filtros de F2.
3. Pedir à IA para conferir `usuario`, `aluno`, `representante` e `usuario_tipo` depois da operação (PC-05).

**Resultado esperado**

- HTTP `201`, `success: true`, “Operação realizada com sucesso”, representação ativa na **F2 enviada** (AC-02, AC-03, AC-12).
- Mesmos ids e dados pessoais, matrícula e credenciais do aluno, sem novo usuário nem duplicação do aluno (AC-05).
- Função de representante concedida mantendo a função de aluno (AC-04); verificar o reflexo no login no CT-010, sem aprovar permissões só pela presença da linha.

**Resultado obtido**

- `POST /representantes/promover` com Larissa (aluno 2, matrícula F2, validade futura) e F2: HTTP `201`, “Operação realizada com sucesso”, `ativo: true`, `faculdade_id: 2` (IFCE).
- Banco: uma linha em `representante` (2, ativo, F2); `aluno` inalterado (2, `ativado`, F2); o perfil de representante entrou em `usuario_tipo` (conferido no CT-009: 2 linhas, aluno + representante); nenhum novo usuário.
- Status: ✅ Passou.

---

### CT-HU030-API-003 — Validar instituição obrigatória e ids

**Dados de entrada:** POST com aluno elegível livre: sem `faculdade_id`, com `null`, `0`, `-1` ou `"abc"`; depois sem `aluno_id`, com `null`, `0`, `-1` ou `"abc"`, mantendo a outra chave válida.

**Passos**

1. Enviar uma variação por vez, usando aluno ainda não representante.
2. Pedir à IA para conferir ausência de representação, vínculo de perfil e log de promoção (PC-05).

**Resultado esperado**

- HTTP `422`, campo e motivo compreensíveis em português; ids devem ser inteiros positivos e instituição é obrigatória (AC-12).
- Não assumir instituição padrão quando o campo não for enviado.
- Controle de id positivo válido no CT-002; id positivo inexistente é 404 no CT-004, não a mesma partição de zero/negativo.

**Resultado obtido**

- HTTP `422` em todas: sem `faculdade_id`, `null`, `0`, `-1` (mensagem “Valor inválido.”) e `"abc"` (“Informe um número válido.”); o mesmo para `aluno_id` ausente, `null`, `0`, `-1` e `"abc"`. Nenhuma instituição padrão assumida; nenhuma representação criada.
- A mensagem para ausente, nulo e não positivo é só `"Valor inválido."`, sem o motivo. Defeito: [BUG-HU030-API-002](issues/BUG-HU030-API-002-mensagens-de-validacao-genericas.md).
- Status: ⚠️ Parcial.

---

### CT-HU030-API-004 — Recusar aluno/instituição inexistente e faculdade inativa

**Dados de entrada:** POST: aluno `999999` inexistente + F1; aluno livre elegível + faculdade `999999`; mesmo aluno + F3 inativa.

**Passos**

1. Confirmar quais ids não existem e que F3 está inativa (PC-05).
2. Enviar cada tentativa e pedir à IA para conferir ausência de efeitos em dados/perfis/logs.

**Resultado esperado**

- Aluno inexistente: `404` “Aluno não encontrado.” (FA-004 em sua variação de referência direta). Faculdade inexistente: `404` “Faculdade não encontrada.”.
- Faculdade inativa: `422` “Faculdade inativa.”; nenhum perfil concedido. É proteção de integridade já existente no contrato, coerente com HU-008.
- Nenhum `500` nem atribuição parcial. A pesquisa sem resultados no app é coberta separadamente na UI.

**Resultado obtido**

- Aluno `999999` (F1): HTTP `404` “Aluno não encontrado.”. Faculdade `999999`: `404` “Faculdade não encontrada.”. Faculdade inativa (F3): `422` “Faculdade inativa.”. Nenhuma representação criada para o aluno livre.
- Status: ✅ Passou.

---

### CT-HU030-API-005 — Bloquear os quatro estados inelegíveis do BDD

**Dados de entrada:** Quatro alunos distintos: pendente; rejeitado; `ativado` com usuário ativo e `validade_acesso` vencida; inativado. Todos sem representação ativa, F1 ativa. Controle válido com validade futura no CT-002.

**Passos**

1. Pedir à IA para registrar cada status, `usuario.ativo`, validade e horário/fuso (PC-05). Mapear Reprovado do BDD para `rejeitado`; Vínculo vencido não é string de status, e sim data vencida.
2. Promover cada aluno na F1; para inativo, conferir `status_cadastro=inativado` e também a variação `ativado` com `usuario.ativo=false`.
3. Pedir à IA para conferir representações, perfis e logs depois de cada tentativa (PC-05).

**Resultado esperado**

- Recusar todos os estados inelegíveis com `422`, informando o sentido de que somente alunos aprovados e ativos podem ser representantes (AC-03, FA-002).
- Não conceder função, alterar cadastro nem gerar log de promoção bem-sucedida.
- O texto literal não está fixado no requisito. A mensagem atual “Aluno não aprovado ou inativo.” deve ser avaliada pelo sentido, não marcada como falha só por diferir de uma frase sugerida.
- O código não consulta `validade_acesso`: aceitação do vínculo vencido é falha esperada em relação ao BDD/FA-002, ainda não reproduzida. Registrar a decisão pendente sobre cadastro atualizado, sem inventar novos status.

**Resultado obtido**

- Pendente, rejeitado e inativado: HTTP `422` “Aluno não aprovado ou inativo.”, sem representação criada. Variante `ativado` com `usuario.ativo = false`: `422`, sem representação.
- Aluno `ativado`, usuário ativo e `validade_acesso` vencida há 30 dias: HTTP `201` e a função foi concedida (esperado `422`, BDD “Vínculo vencido”).
- A frase da mensagem foi avaliada pelo sentido (“aprovado ou inativo”), não pelo texto.
- Defeito: [BUG-HU030-API-001](issues/BUG-HU030-API-001-aluno-com-vinculo-vencido-pode-ser-representante.md).
- Status: ❌ Falhou.

---

### CT-HU030-API-006 — Impedir promoção repetida de representante ativo

**Dados de entrada:** Larissa ativa do CT-002; POST repetido com F2 e depois F1 diferente.

**Passos**

1. Registrar a representação, F2 e quantidade de logs de Larissa.
2. Enviar as duas promoções e pedir à IA para conferir linha, perfis e logs (PC-05).

**Resultado esperado**

- HTTP `409` com mensagem de já possuir a função; contrato atual: “Este aluno já é um representante ativo.” (AC-11, FA-003).
- A promoção repetida não troca a instituição nem duplica o vínculo de perfil; nada muda em F2.
- Não definir um endpoint de transferência de representante: a HU cobre revogar e reatribuir, não uma nova regra de troca enquanto ativo.

**Resultado obtido**

- Promover de novo Larissa (ativa na F2) com a F2 e com a F1: HTTP `409` “Este aluno já é um representante ativo.” nas duas. A linha de representação continuou com a F2; a contagem de `log_auditoria` não mudou (6 antes e depois).
- Status: ✅ Passou.

---

### CT-HU030-API-007 — Revogar função preservando aluno e tratar repetição/inexistente

**Dados de entrada:** `PATCH /representantes/{id de Larissa}/revogar`; repetir; `999999`; aluno real que nunca foi representante.

**Passos**

1. Anotar id e dados de Larissa; usar na URL o id do usuário/aluno, que o retorno chama `id`.
2. Revogar e pedir à IA para conferir status da representação, usuário/aluno e vínculo de perfil (PC-05).
3. Repetir; enviar para o id inexistente e para aluno nunca promovido.

**Resultado esperado**

- HTTP `200` e “Operação realizada com sucesso”; representação revogada permanece na listagem sem filtro/`ativo=false` (AC-06, FA-001).
- Aluno continua ativo, com seus dados e permissão de aluno; apenas o perfil de representante é removido (AC-07).
- Repetição: `409` “Este usuário não é um representante ativo.”; inexistente ou aluno sem linha de representação: `404` “Representante não encontrado.”. Não gerar novo log de revogação recusada.

**Resultado obtido**

- `PATCH /representantes/2/revogar`: HTTP `200`, `ativo: false`, que continua na listagem sem filtro. Aluno mantido (`ativado`, usuário ativo); `usuario_tipo` ficou só com `aluno`.
- Repetir a revogação: `409` “Este usuário não é um representante ativo.”. Id `999999` e aluno que nunca foi representante: `404` “Representante não encontrado.”.
- Status: ✅ Passou.

---

### CT-HU030-API-008 — Auditar atribuição, revogação e reatribuição

**Dados de entrada:** Operações de Larissa nos CT-002/007 e, ao concluir o CT-009, reatribuição; id do administrador A e horários.

**Passos**

1. Pedir à IA para consultar `log_auditoria` com `entidade='representante'`, id do aluno e intervalo de execução (PC-05).
2. Conferir os logs de CT-002/007; voltar a esta conferência após CT-009 e CT-011 para incluir as transições seguintes.
3. Confrontar valores anteriores/novos com a instituição e o status reais; excluir preparo direto de massa da contagem funcional.

**Resultado esperado**

- `PROMOVER` e `REVOGAR` com usuário executor, timestamp e entidade correta (AC-10, RNF-013).
- A reatribuição gera novo `PROMOVER`, com estado anterior revogado e instituição nova correta, sem apagar os logs anteriores.
- Recusas, repetição e cancelamento de UI não geram log de operação bem-sucedida. A coluna de id pode ser textual no schema migrado: respeitar seu tipo real na consulta.

**Resultado obtido**

- `log_auditoria` (`entidade = 'representante'`) tem 9 registros, todos do administrador A: PROMOVER (Ana, Pedro, Bruno e Larissa na F2), REVOGAR (Pedro), PROMOVER (aluno com vínculo vencido, ver CT-005), REVOGAR (Larissa), PROMOVER (Larissa na F1, `valor_anterior` F2 inativa, `valor_novo` F1 ativa) e REVOGAR (Larissa).
- Recusas (404, 409, 422, 403) não geraram registro. Os logs anteriores não foram apagados na reatribuição.
- Status: ✅ Passou.

---

### CT-HU030-API-009 — Reatribuir ao revogado em outra instituição sem duplicar aluno

**Dados de entrada:** Larissa revogada do CT-007; POST com o mesmo `aluno_id` e F1, diferente de F2 anterior.

**Passos**

1. Registrar a linha de representação revogada e os dados do aluno.
2. Enviar promoção para F1; pedir à IA para conferir listagens por F1/F2, quantidade de linhas e vínculos de perfil (PC-05).
3. Repetir a auditoria do CT-008.

**Resultado esperado**

- HTTP `201` e sucesso; Larissa volta como representante ativa na F1 (AC-13).
- Mesma identidade/linha de representação e mesmo aluno, sem duplicações; filtros não mantêm vínculo ativo incorreto em F2.
- Um perfil de representante e novo log `PROMOVER`; histórico de auditoria mantido. A decisão de negócio do AC-13 segue pendente na issue #185, conforme orientação do responsável.

**Resultado obtido**

- `POST /representantes/promover` de Larissa revogada com a F1: HTTP `201`. `GET ?faculdade_id=1` a mostra ativa; `?faculdade_id=2` só tem Bruno. Mesma linha em `representante` (id 2, agora F1, ativa) e mesmo aluno; novo log PROMOVER com valor anterior (F2, inativa) e novo (F1, ativa).
- Status: ✅ Passou.

---

### CT-HU030-API-010 — Conceder perfil no login e preservar acesso de aluno

**Dados de entrada:** Larissa ativa do CT-009; `POST /auth/login` com as credenciais originais; `GET /usuarios/me`; token recém-obtido.

**Passos**

1. Entrar com email/senha originais; guardar token para o CT-011 sem expô-lo nas evidências.
2. Conferir `usuario.roles`, perfil principal e dados; consultar `/usuarios/me` e comparar ao cadastro original com apoio da IA (PC-05).
3. Anotar branch/commit: na versão sem PR #195 o frontend pode ignorar perfis secundários, mesmo quando a API os retorna.

**Resultado esperado**

- Login `200` e função de representante disponível junto à de aluno, sem exigir que a principal deixe de ser aluno (AC-04, AC-05).
- O legado `supervisor` representa a função operacional; o PR #195 também expõe `representante`. Avaliar a concessão real sem exigir um único rótulo interno.
- Aluno acessa seu perfil/dados originais. A seleção visual Sou representante/Sou aluno é coberta na UI; lista/presença real depende do CT-013.

**Resultado obtido**

- `POST /auth/login` de Larissa promovida: HTTP `200`; `usuario.roles` e o token trazem `["aluno", "supervisor"]`. `GET /usuarios/me` devolve os dados originais (matrícula F2, `ativado`, bairro, curso).
- A `develop` usa o papel legado `supervisor` para o representante; o rótulo `representante` só existe no PR #195 (não incluído nesta execução).
- Status: ✅ Passou.

---

### CT-HU030-API-011 — Remover permissões após revogação, inclusive com sessão anterior

**Dados de entrada:** Token de Larissa obtido no CT-010; administrador revoga novamente; novo login com credenciais de Larissa; endpoints reais de representante quando disponíveis.

**Passos**

1. Com o administrador, revogar Larissa; manter o token anterior identificado.
2. Pedir à IA para conferir remoção do perfil no banco e no novo login; consultar `/usuarios/me` como aluno (PC-05).
3. Se houver endpoint funcional exclusivo de representante, tentar com o token antigo e o novo. Se não houver HU-018/021, registrar essa parte como 🚫.

**Resultado esperado**

- Novo login mantém aluno ativo e não anuncia perfil operacional de representante; dados originais mantidos (AC-07).
- Permissões de representante devem cessar também com token antigo; acesso exclusivo deve ser negado. Não exigir um status único: 401 por sessão invalidada ou 403 por permissão removida podem expressar a recusa; avaliar o contrato real.
- Token antigo pode continuar válido para funções de aluno quando contiver esse perfil, desde que não autorize representante. Menu/claims isolados não comprovam autorização de lista/presença ausente.

**Resultado obtido**

- Revogar Larissa e entrar de novo: HTTP `200` com `roles: ["aluno"]`; `usuario_tipo` só `aluno`; `GET /usuarios/me` segue 200 com os dados do aluno.
- Token anterior (de antes da revogação): `GET /usuarios/me` 200 como aluno; `GET /representantes` 403 (rota de administrador, o que não prova nada sobre o perfil). O token antigo continua carregando `supervisor` até expirar, mas não existe endpoint exclusivo de representante para tentar. Essa parte ficou 🚫 (depende da HU-018/021).
- Status: ⚠️ Parcial.

---

### CT-HU030-API-012 — Restringir gestão a administrador e negar menus administrativos ao representante

**Dados de entrada:** Aluno comum, representante ativo (Ana ou Bruno) e sem autenticação: GET `/representantes` com filtros, POST `/promover` e PATCH `/{id}/revogar`. Representante tenta também GET `/motoristas`.

**Passos**

1. Enviar cada rota com corpos válidos, mantendo um aluno elegível livre para a promoção e representante real para revogar.
2. Sem autenticação, retirar também cookies e parâmetros de token.
3. Pedir à IA para conferir ausência de alterações nos perfis, registros e logs (PC-05).

**Resultado esperado**

- HTTP `403` para aluno e representante em todas as rotas `/representantes`, inclusive a lista; `401` sem autenticação (AC-09, RN-006).
- Representante também não acessa gestão exclusiva de motoristas; ser representante não concede funções administrativas.
- Nenhuma promoção/revogação indevida nem log de sucesso. Não usar Larissa já revogada como única evidência do perfil representante; usar Ana/Bruno ativos.

**Resultado obtido**

- Aluno comum, Ana e Bruno (representantes) e sem token, em `GET /representantes?ativo=true`, `POST /representantes/promover` e `PATCH /representantes/{id}/revogar`: HTTP `403` “Acesso negado” para os três perfis logados e `401` “Não autenticado” sem token, nas três rotas. Ana também recebeu `403` em `GET /motoristas`.
- Contagem de `representante` (5) e de `log_auditoria` (9) igual antes e depois; Ana e Bruno seguiram ativos.
- Status: ✅ Passou.

---

### CT-HU030-API-013 — Limitar lista e presença à instituição sob responsabilidade

**Dados de entrada:** Ana representante de F1; Bruno de F2; alunos/listas reais de F1 e F2; HU-018/021 disponíveis.

**Passos**

1. Conferir a existência dos endpoints reais de lista/registro de presença em `/docs`; sem suporte, marcar 🚫, sem inventar caminhos.
2. Autenticar Ana; consultar sua lista e registrar presença de aluno da F1.
3. Tentar consultar lista da F2 e registrar presença de aluno de F2, alterando os identificadores reais da requisição; repetir o inverso com Bruno.
4. Pedir à IA para conferir se a presença permitida foi gravada e a externa não foi (PC-05).

**Resultado esperado**

- Só a universidade sob responsabilidade aparece e pode receber presença (AC-08, RN-015).
- Tentativas diretas sobre outra universidade são negadas, sem expor alunos nem gravar presença; não fixar texto/status não definido pelo requisito.
- Tela estática ou checkboxes locais não comprovam isolamento nem persistência. Função revogada também perde esse acesso, conforme CT-011.

**Resultado obtido**

- O OpenAPI da `develop` tem só `/representantes`, `/representantes/promover` e `/representantes/{id}/revogar`; não há lista de embarque nem presença (HU-018/021). Sem os endpoints, o isolamento por universidade (RN-015) não pode ser verificado.
- Status: 🚫 Bloqueado.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 — ativos e revogados | Visualiza representantes ativos e revogados | CT-001, CT-007, CT-009 |
| AC-02 / FA-004 — localizar aluno | Pesquisa/seleciona aluno; nenhum aluno correspondente | CT-001, CT-002, CT-004; busca visual em CT-HU030-UI-002 |
| AC-03 / FA-002 — aprovado e ativo | Bloqueia quatro estados inelegíveis | CT-005; controle CT-002 |
| AC-04 — permissões concedidas | Atribuição de função ao aluno aprovado | CT-002, CT-010; funções reais no CT-013 |
| AC-05 — cadastro original | Atribui mantendo dados pessoais e cadastro | CT-002, CT-009, CT-010 |
| AC-06 / FA-001 — revogar | Revoga a função | CT-007 |
| AC-07 — aluno mantido e perda de função | Revoga mantendo aluno; revogado não acessa funções de representante | CT-007, CT-011 |
| AC-08 / RN-015 — universidade responsável | Lista e presença apenas da própria universidade | CT-013 — depende das HU-018/021 |
| AC-09 / RN-006 — sem gestão administrativa | API nega gestão a outros perfis | CT-012 |
| AC-10 / RNF-013 — auditoria | Registra atribuição e revogação | CT-008, CT-009 |
| AC-11 / FA-003 — função já ativa | Impede nova atribuição a quem já é representante | CT-006 |
| AC-12 — instituição obrigatória | Bloqueia atribuição sem instituição | CT-003; associação correta em CT-002 |
| AC-13 — reatribuição | Atribui novamente após revogação | CT-009 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-HU030-API-005 | Aluno com vínculo vencido pode ser promovido a representante | [#235](https://github.com/GOUOCE/GOUCE-app/issues/235) |
| CT-HU030-API-003 | Mensagens de validação genéricas (“Valor inválido.”) | [#236](https://github.com/GOUOCE/GOUCE-app/issues/236) |
| PC-01 (ambiente) | A `develop` não sobe em banco vazio (migration 69) | [#215](https://github.com/GOUOCE/GOUCE-app/issues/215) |

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
- **Execução (2026-10-25):** stack isolada (`docker compose -p atu-api`), banco limpo, na `develop` **sem** o PR #195. Resultado: 9 passaram, 1 falhou, 2 parciais e 1 bloqueado.
- **Contorno de ambiente (não é do caso):** em banco vazio a migration `69_faculdade_fk_in_aluno` falha (`column f.sigla does not exist`); foi usada uma cópia temporária da migration 68 com a coluna `sigla`, sem alterar o repositório ([#215](https://github.com/GOUOCE/GOUCE-app/issues/215)).
- **Massa:** F1 = UFC / Campus Quixadá (seed da migration 69, id 1), F2 = IFCE / Campus Quixadá (id 2) e F3 = Uniateneu / Campus Ocara inativa (id 3), criadas pela API. Alunos de teste cadastrados pela API e aprovados; os estados `rejeitado` e `inativado`, o `validade_acesso` vencido e o `usuario.ativo = false` do CT-005 foram preparados direto no banco local, e restaurados quando temporários. Ana, Pedro e Bruno foram promovidos pela API antes do CT-001 e entram na contagem de auditoria.
- **Observação:** o aluno com vínculo vencido promovido no CT-005 (Aluno Vencido Qa) permaneceu como representante ativo no banco de teste.
- **Observação de segurança (não confirmada como defeito):** o token de acesso emitido antes da revogação continua com o papel `supervisor` até expirar. Sem endpoint exclusivo de representante não foi possível mostrar impacto.
- Todos os casos foram executados ou bloqueados nesta rodada; riscos estáticos não são defeitos reproduzidos. Marcar dependências 🚫 somente durante a execução, distinguir falha da versão e impedimento de massa/funcionalidade e registrar cada variação. Não alterar o resultado esperado para aprovar o código atual.
- Suíte complementar: [UI-HU-030.md](../ui/UI-HU-030.md). Cancelamento de confirmação e pesquisa visual de aluno são verificados na UI; não existe chamada funcional de cancelar na API.
