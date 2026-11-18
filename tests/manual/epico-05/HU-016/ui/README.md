# Como executar os testes manuais de UI — HU-016

Execução manual por **Radlei**, com apoio da **LLM** (massa pela API, conferência de API/banco e redação dos relatos). [Suíte de UI: 9 casos](UI-HU-016.md). A [suíte de API tem 11 casos](../api/API-HU-016.md), executada antes e usada como mapa de ids e massa de referência. **Execução de 18/11/2026:** 3 casos passaram e 6 falharam; defeitos em [`issues/`](issues/) e resumo em [EVIDENCIAS-UI-HU-016.json](EVIDENCIAS-UI-HU-016.json).

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
- **Nunca** abrir a aba **Headers** de uma requisição nem mostrar token ou senha em nenhum print. A aba **Response** é permitida (corpo da resposta, sem cabeçalhos).
- Se um print acidentalmente mostrar um token/senha, descartar o print e refazer — não tentar recortar depois.

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

- Esta execução não inclui a rodada de **reteste das correções** dos defeitos #504 a #509 — fica para depois que as correções forem publicadas.
- `CT-HU016-UI-005`, verificação 3 ("Aguardando alocação do veículo" no app do aluno excedente): 🚫 não executada — o aluno foi realocado antes dessa checagem, no preparo do caso seguinte. Fica para o reteste.
- `CT-HU016-UI-007`, verificação 3 (mensagem de recusa na tela) ficou 🚫 bloqueada por depender da verificação 1, que não tem nenhuma ação na tela para testar.
- O risco de sobrescrita do status "DISTRIBUIDO" ao trocar de dia sem recarregar (ver segunda reprodução em `BUG-HU016-UI-003`) não foi testado.
- As issues #504, #505 e #507 ainda não têm print anexado (nem no corpo, nem em comentário); só #506 (print em comentário), #508 e #509 (print no corpo) têm evidência anexada até agora.
- A issue [#473](https://github.com/GOUOCE/GOUCE-app/issues/473) (decisão do PO sobre realocação entre rotas) está fechada sem decisão registrada; isso trava uma parte do reteste futuro de `CT-HU016-UI-007` até haver resposta.

## Comportamentos conhecidos que não são defeito da HU-016

- Padrão de 401 seguido de `refresh` e nova tentativa nas chamadas autenticadas (token de acesso com 15 min de vida) — comportamento esperado da renovação automática.
- Popup de tradução automática do navegador (observado no Brave) aparecendo em algumas telas — ruído do navegador, não do app.
- `"representante"` e `"supervisor"` são mapeados internamente para o mesmo papel `MOTORISTA` (`frontend/src/services/authService.ts:42-54`) — nome interno do papel, não uma mistura real de perfis.
