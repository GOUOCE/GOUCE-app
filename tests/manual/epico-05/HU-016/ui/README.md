# Como executar os testes manuais de UI — HU-016

Execução manual por **Radlei**, com apoio da **LLM** (massa pela API, conferência de API/banco e redação dos relatos). [Suíte de UI: 9 casos](UI-HU-016.md). A [suíte de API tem 11 casos](../api/API-HU-016.md), executada antes e usada como mapa de ids e massa de referência. **Execução de 18/11/2026:** 3 casos passaram e 6 falharam; defeitos em [`issues/`](issues/) e resumo em [EVIDENCIAS-UI-HU-016.json](EVIDENCIAS-UI-HU-016.json). **Reteste de 18/11/2026 (build `82eac441`, branch `fix/issues-hu16e17`):** os 6 casos que falharam passaram a ✅ — ver "Resultado do reteste" abaixo.

## Objetivo e escopo

Verificar a tela de **Distribuição Logística** (demanda por rota, prévia, confirmação, alocação por rota e excedentes) da HU-016 — Distribuição de Alunos nos Ônibus — do ponto de vista de quem usa a interface, complementando a suíte de API (que cobre o mesmo backend por HTTP). Fora do escopo: a tela de Rodízio de frota (HU-020, adiada pelo PO na #465) e qualquer ajuste de código — este guia é só de execução de teste.

## Base e fontes

Planejamento na branch `test/planejamento-api-ui-hu-016`, com entrega para `develop`. A tela de Distribuição Logística foi trazida pelo [PR #457](https://github.com/GOUOCE/GOUCE-app/pull/457) (já mesclado na `develop`, commit `7372b8d6`). Build testado: `develop`, commit `0f90c961e484ed1045017d04b1bad15d09b0818c` — o merge do [PR #472](https://github.com/GOUOCE/GOUCE-app/pull/472) (execução de API da HU-016), que já inclui o PR #457 — na branch de execução `test/execucao-ui-hu-016`. Ler os [requisitos, seção 7.6](../../../../../docs/requisitos.md), o [BDD do épico 05](../../../../../bdd/features/epico-05/README.md) e as [decisões do PO na #465](https://github.com/GOUOCE/GOUCE-app/issues/465).

## Pré-requisitos e ambiente

1. Projeto Docker isolado `atu-ui016`: API em `http://localhost:8216`, banco PostgreSQL `atu_ui016`, fuso `America/Fortaleza`.
2. Front em Expo web, `http://localhost:8081`, apontando para a API acima.
3. Navegador baseado em Chromium (Brave, Chrome ou Edge), com DevTools disponível (abas Network e Console).
4. Anotar URL, commit/SHA do build, branch de execução e navegador usado — esses dados vão no cabeçalho da suíte ("Identificação da suíte").

## Como a execução funciona

- O **testador** executa na tela (toques, campos, botões) e relata o que vê, com os textos exatos.
- A **LLM** prepara a massa pela API (e, só quando a API não permite — como reserva em data passada — direto no banco, registrando o motivo), confere a API e o banco antes e depois de cada caso de confirmação, e redige os relatos de defeito.
- **Massa de teste** (sem senhas nem tokens): IES cadastradas (UFC, IFCE, UECE), rotas P1 (UFC), P2 (IFCE) e P3 (UECE, quando o caso exigir), ônibus V1 a V4 (V4 inativo), motoristas M1 a M4 (M4 inativo), um administrador, alunos com cadastro aprovado, em quantidade suficiente para cada caso, e representantes (um ativo e um inativo) para os casos de perfil. Reservas criadas por `POST /transporte/agendamentos` nas datas de cada caso.
- **Troca de perfil no login:** a tela de login oferece escolher o perfil ("Sou aluno" / "Sou representante"). Internamente, o perfil "representante" é mapeado para o mesmo papel usado por motoristas (`MOTORISTA`, em `frontend/src/services/authService.ts`); escolher o perfil errado faz a sessão abrir como aluno comum, então sempre confirmar a escolha explícita de perfil antes de testar o caso de representante.

## Como coletar evidência

- Print da **janela inteira**, com a barra de endereço visível, e o DevTools aberto na aba **Network** (filtro Fetch/XHR, com **Preserve log** ativado) e na aba **Console**.
- Abrir o DevTools **só depois do login** — nunca durante a tela de login, para não capturar a senha sendo digitada.
- **Assim que o DevTools abrir, limpar o Console (ícone 🚫 "Clear console")** antes de qualquer print ou interação. O Console **reexibe mensagens antigas** mesmo depois de aberto após o login — inclusive o aviso "A form field element should have an id or name attribute" / "Password field is not contained in a form", que o navegador imprime junto com o valor digitado no campo de senha da tela de login. Limpar o Console não é opcional: é o único jeito de garantir que esse aviso (e a senha dentro dele) não apareça num print tirado depois.
- **Nunca** abrir a aba **Headers** de uma requisição nem mostrar token ou senha em nenhum print. A aba **Response** é permitida (corpo da resposta, sem cabeçalhos).
- **Nunca anexar um print em que o aviso de "password field" (ou qualquer outro texto com a senha) apareça no Console** — mesmo que pareça ilegível ou cortado. Se um print acidentalmente mostrar um token/senha, descartar o print e refazer (limpando o Console de novo antes) — não tentar recortar ou borrar depois.

## Regras

- O **resultado esperado nunca é ajustado** para um caso passar; se o comportamento divergir, o caso falha e vira relato.
- Um risco visto só na leitura do código **não é defeito**: só vira defeito quando o mesmo comportamento aparece de fato na tela ou numa requisição, durante a execução.
- Status: ✅ passou, ❌ falhou, ⚠️ parcial, 🚫 bloqueado e ⏳ pendente — mesmas definições do [README da API](../api/README.md); registrar a dependência específica quando impedir uma parte.

## Fluxo de defeito

1. Reproduzir o comportamento divergente na tela (ou numa requisição disparada pela tela) e registrar o relato em `ui/issues/`, pelo [modelo de UI](../../../modelos/ISSUE-BUG-UI.md).
2. Numerar os relatos como `BUG-HU016-UI-NNN`, em ordem de criação — **essa numeração não coincide com a dos casos de teste** (CT-HU016-UI-NNN); a correspondência fica registrada na própria suíte e aqui:

   | Caso (CT) | Relato | Issue |
   | --- | --- | --- |
   | CT-HU016-UI-001 | BUG-HU016-UI-001 | #504 |
   | CT-HU016-UI-002 | BUG-HU016-UI-002 | #505 |
   | CT-HU016-UI-004 | BUG-HU016-UI-003 | #506 |
   | CT-HU016-UI-005 | BUG-HU016-UI-004 | #507 |
   | CT-HU016-UI-006 | BUG-HU016-UI-005 | #508 |
   | CT-HU016-UI-007 | BUG-HU016-UI-006 | #509 |
   | CT-HU016-UI-007 (reteste) | BUG-HU016-UI-007 | issue #517 |

3. Publicar a issue no GitHub com as labels `bug`, `Front`, `HU-016` e `Bloqueante` ou `Não bloqueante` (conforme a severidade e o efeito no fluxo principal), atribuída a `dev-mariab`.
4. Anexar evidência (prints/GIF, pela regra de coleta acima); o ideal é anexar sempre, e quando faltar tempo, ao menos nas issues `Bloqueante`.

## Resultado da execução de 18/11/2026

- **9 casos:** 3 ✅ / 6 ❌.
- **28 verificações** (cada bullet do "Resultado esperado" de cada caso, contado separadamente quando reúne mais de uma checagem): **17 ✅ / 9 ❌ / 2 🚫**.
- **Defeitos:**

  | Issue | Relato | Severidade | Bloqueante |
  | --- | --- | --- | --- |
  | #504 | BUG-HU016-UI-001 | 🟡 Média | Não |
  | #505 | BUG-HU016-UI-002 | 🟡 Média | Não |
  | #506 | BUG-HU016-UI-003 | 🟠 Alta | Sim |
  | #507 | BUG-HU016-UI-004 | 🟡 Média | Não |
  | #508 | BUG-HU016-UI-005 | 🟡 Média | Não |
  | #509 | BUG-HU016-UI-006 | 🟠 Alta | Sim |

Detalhe por caso e por verificação na [suíte](UI-HU-016.md) e no [JSON de evidências](EVIDENCIAS-UI-HU-016.json).

## Resultado do reteste (18/11/2026)

- **Build testado:** `82eac441` (branch `fix/issues-hu16e17`), correções de `dev-mariab` para as issues #504 a #509. Branch de resultados: `test/reteste-ui-hu-016`.
- **6 casos retestados:** 6 ✅ / 0 ❌ — **20 verificações:** 20 ✅ / 0 ❌ / 0 🚫.
- Massa de apoio em 27/11 montada pela API (preparação de dado); a realocação e a tentativa de recusa do CT-007 foram feitas pela própria tela.
- **Defeitos corrigidos:**

  | Issue | Relato | Resultado no reteste |
  | --- | --- | --- |
  | #504 | BUG-HU016-UI-001 | ✅ Cartão "Rodízio de frota" removido do painel |
  | #505 | BUG-HU016-UI-002 | ✅ Histórico virou somente leitura |
  | #506 | BUG-HU016-UI-003 | ✅ Depois do F5, a tela lê o status e os ônibus/motoristas gravados no banco |
  | #507 | BUG-HU016-UI-004 | ✅ Excedentes mostram o nome do aluno; "Aguardando alocação do veículo" verificado |
  | #508 | BUG-HU016-UI-005 | ✅ Listas filtram recurso já usado por outra rota; mensagens de conflito citam nome da rota/recurso |
  | #509 | BUG-HU016-UI-006 | ✅ Tela de Excedentes seleciona, lista ônibus com vaga, realoca e recusa com causa |

- **Novo defeito encontrado durante o reteste:** [BUG-HU016-UI-007](issues/BUG-HU016-UI-007.md) (🟢 Baixa, Não bloqueante, issue #517) — o aviso de excedentes continua visível na tela depois da realocação, junto com a mensagem de "nenhum excedente". **Corrigido e confirmado no reteste de 18/11/2026 à noite (build `f9cde78e`)** — ver "Resultado do reteste da issue #517" abaixo.

Detalhe por verificação no [JSON de evidências](EVIDENCIAS-UI-HU-016.json) (bloco `reteste`) e na [suíte](UI-HU-016.md) (seção "Reteste (18/11/2026)").

## Resultado do reteste da issue #517 (18/11/2026, noite)

- **Build testado:** `f9cde78e` (branch `fix/issues-hu16e17`), commit "fix: corrige excedentes apos realocacao issue #517", de `dev-mariab` — branch ainda fora da `develop`. Branch de resultados: `test/reteste-ui-hu-016-bug007`. Backend testado: `82eac441` (a correção só alterou o frontend).
- **Resultado:** ✅ Corrigido — em 27/11, realocando o aluno H Um Farias para o ônibus com vaga (Rota 2, `DEF4G56`) pela tela de Excedentes, o `POST /alocacao-diaria/distribuicao` retornou 201 e, depois da realocação, a tela passou a mostrar só "Nenhum aluno excedente para esta data.", sem repetir "1 aluno(s)... ultrapassam a capacidade dos veículos alocados". `CT-HU016-UI-007` continua ✅.
- **Observação:** a ponta da branch `fix/issues-hu16e17` (`457f0fec`) traz uma mudança extra de backend (HU-017) ainda **não testada** neste reteste — fora do escopo da #517.

Detalhe no [JSON de evidências](EVIDENCIAS-UI-HU-016.json) (bloco `reteste_517`), em [BUG-HU016-UI-007](issues/BUG-HU016-UI-007.md) e na [suíte](UI-HU-016.md) (seção "Reteste da issue #517 (18/11/2026, noite)").

## Riscos mapeados no código

Os riscos abaixo vêm da leitura do código e orientam a execução. **Não são defeitos reproduzidos por si só**: cada um só contou como defeito depois de confirmado na tela ou na requisição, com relato e issue (ver tabela acima).

| Risco | Evidência de leitura | Confirmado em |
| --- | --- | --- |
| A tela reexibe a sugestão automática depois de recarregar, em vez do que está gravado | Em `distribuicao.tsx:104`, `statusLogistico` é um `useState('')`, preenchido só pela resposta do `POST` de confirmação (linha ~185) e nunca resetado explicitamente; um F5 remonta o componente e volta ao `''` inicial. A prévia da API não tem campo de status/gravado para repopular esse estado. O mesmo `useState` também não é resetado ao trocar de dia sem recarregar — risco adicional, não totalmente testado. | UI-004 (#506) |
| Excedentes aparecem como "Agendamento #id" | `obterExcedentes` monta `nome: Agendamento #id` e iniciais fixas "ID" | UI-005 (#507) |
| Cartão Rodízio de frota aponta para rota inexistente | `logistica.tsx` abre `/logistica/rodizio`, que não existe no app | UI-001 (#504) |
| Histórico reaproveita as ações da aba Próximos | o lápis e o "Confirmar distribuição" não checam a aba ativa | UI-002 (#505) |
| Seleção de ônibus/motorista só filtra a própria rota aberta | `alocar.tsx` só carrega as alocações da `linhaId` da tela; não vê o que outra rota já usa no mesmo turno | UI-006 (#508) |
| Tela de excedentes não tem ação de realocar | `excedentes.tsx` só lista cards estáticos, sem `onPress` nem botão de ação além de voltar | UI-007 (#509) |

## Dependências e critérios de bloqueio

- **UI:** exige o PR #457 (tela de distribuição) mesclado na `develop`; o build testado é o merge do PR #472 (`0f90c961`), que já inclui o #457. Se o front mudar depois disso, registrar o novo SHA e reavaliar os casos.
- **Massa:** depende de HU-013 (reservas), HU-014 (cancelamento) e cadastros administrativos de rotas, frota e motoristas; HU-018 e HU-019 para conferir o efeito da distribuição no app do aluno.
- **HU-020:** adiada pelo PO (#465); não há caso de rodízio, e o cartão correspondente deveria ficar oculto (ver UI-001/#504).
- **CT-HU016-UI-007:** a massa de "excedente real com ônibus com vaga" não existe na prévia automática recalculada (o algoritmo sempre usa toda a frota ativa até não sobrar vaga antes de gerar excedente); só existe no estado **gravado** — uma distribuição confirmada com frota menor, seguida da reativação de mais veículos.

## Limitações e itens de reteste

- A rodada de **reteste das correções** dos defeitos #504 a #509 foi feita em 18/11/2026, no build `82eac441` — ver "Resultado do reteste" acima. Todos os 6 casos passaram.
- `CT-HU016-UI-005`, verificação 3 ("Aguardando alocação do veículo" no app do aluno excedente): 🚫 não executada na execução original — o aluno foi realocado antes dessa checagem, no preparo do caso seguinte. **Executada no reteste: ✅ passou.**
- `CT-HU016-UI-007`, verificação 3 (mensagem de recusa na tela) ficou 🚫 bloqueada na execução original por depender da verificação 1, que não tinha nenhuma ação na tela para testar. **Executada no reteste** (com o ônibus de destino inativado antes de confirmar): ✅ a tela mostrou a causa e o banco não foi alterado.
- O risco de sobrescrita do status "DISTRIBUIDO" ao trocar de dia sem recarregar (ver segunda reprodução em `BUG-HU016-UI-003`) não foi testado nem no reteste.
- As issues #504, #505 e #507 ainda não têm print anexado (nem no corpo, nem em comentário); só #506 (print em comentário), #508 e #509 (print no corpo) têm evidência anexada da execução original — anexar também evidência do reteste.
- A issue [#473](https://github.com/GOUOCE/GOUCE-app/issues/473) (decisão do PO sobre realocação entre rotas) continua fechada sem decisão registrada; a realocação testada no reteste foi dentro da mesma rota (ida), então não dependeu dessa decisão.
- Novo defeito, issue #517: [BUG-HU016-UI-007](issues/BUG-HU016-UI-007.md), encontrado durante o reteste do `CT-HU016-UI-007`. **Corrigido e confirmado no reteste de 18/11/2026 à noite, build `f9cde78e`** (backend ainda no `82eac441`); a ponta da branch `fix/issues-hu16e17` (`457f0fec`) trouxe uma mudança extra de backend (HU-017) não testada neste reteste.

## Comportamentos conhecidos que não são defeito da HU-016

- Padrão de 401 seguido de `refresh` e nova tentativa nas chamadas autenticadas (token de acesso com 15 min de vida) — comportamento esperado da renovação automática.
- Popup de tradução automática do navegador (observado no Brave) aparecendo em algumas telas — ruído do navegador, não do app.
- `"representante"` e `"supervisor"` são mapeados internamente para o mesmo papel `MOTORISTA` (`frontend/src/services/authService.ts:42-54`) — nome interno do papel, não uma mistura real de perfis.
