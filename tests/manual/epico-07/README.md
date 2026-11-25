# Testes manuais — Épico 07 — Comunicação e Mural de Avisos

Suítes essenciais da **HU-023 — Publicação de Avisos** e da **HU-024 — Recebimento de Notificações Push**: **39 casos, sendo 20 de API e 19 de UI**. Todos estão pendentes: o planejamento foi feito antes da execução, e **o código ainda não está na `develop`**.

## Índice das suítes

| HU | Funcionalidade | API | UI |
| --- | --- | --- | --- |
| HU-023 | Publicação de Avisos | [11 casos pendentes](HU-023/api/API-HU-023.md) | [9 casos pendentes](HU-023/ui/UI-HU-023.md) |
| HU-024 | Recebimento de Notificações Push | [9 casos pendentes](HU-024/api/API-HU-024.md) | [10 casos pendentes](HU-024/ui/UI-HU-024.md) |
| **Total** | **2 HUs** | **20** | **19** |

Cada HU tem um [guia de execução da API](HU-023/api/README.md) (`api/README.md`) com a base analisada, a preparação da massa, as conferências e os **riscos mapeados no código**.

## Escopo e organização

- **API:** execução pela LLM, com revisão de Cauan Ricardo; chamadas HTTP contra API e banco reais em ambiente isolado.
- **UI:** execução manual por Cauan Ricardo no celular ou na web; a LLM prepara a massa e confere API e banco depois de cada caso. A LLM não conduz a UI, salvo quando Cauan pedir.
- Estrutura: `epico-07/HU-023/` e `HU-024/`, cada uma com `api/` e `ui/`. Defeitos reproduzidos serão registrados em `api/issues/` ou `ui/issues/` na execução.
- IDs: `CT-HU023-API-001` a `011`, `CT-HU023-UI-001` a `009`, `CT-HU024-API-001` a `009` e `CT-HU024-UI-001` a `010`. Cada caso contém dados, passos, esperado e espaço para o resultado obtido.
- Cada HU tem a sua branch de planejamento (`test/planejamento-api-ui-hu-023` e `-024`), com entrega para `develop`. Depois da revisão e da integração, criar a branch própria de execução; não registrar aprovação de caso por leitura do código.
- Parte dos casos tende a falhar de propósito: edição, inativação, push nativo e gatilho de realocação são lacunas conhecidas ([decisões do PO na #539](https://github.com/GOUOCE/GOUCE-app/issues/539)). Eles ficam na suíte para o resultado real ficar registrado e para servirem de critério de aceite quando forem implementados.

## Técnicas e cobertura essencial

| Técnica | Cobertura | HU |
| --- | --- | --- |
| Valor-limite e volume | Título de 3 a 150 e descrição de 3 a 2000 caracteres; `limite` de 1 a 50; capacidade do buffer de 100 eventos; rajada de avisos; 200 avisos na lista | HU-023, HU-024 |
| Partição de equivalência | Perfis; situação do cadastro do aluno; campo vazio, só espaços, tipo errado; mural vazio e preenchido | todas |
| Tabela de decisão | Perfil × operação; situação do cadastro × recebimento da notificação | HU-023, HU-024 |
| Transição de estado | Publicar → editar → inativar; app aberto, em segundo plano e fechado; online e offline; permissão concedida e negada | todas |
| Integridade e atomicidade (RNF-012) | Aviso e auditoria na mesma transação; recusas sem gravação; publicações simultâneas | HU-023 |
| Rastreabilidade (RNF-013) | Auditoria de cada operação de escrita | HU-023 |
| Autorização e privacidade (RN-006) | Administrador, aluno, representante, sem token; só o aluno afetado recebe a realocação | todas |
| Resiliência (RNF-014) | Buffer em memória, reinício e vários processos; entrega com o aparelho offline | HU-024 |

Matriz essencial: só o administrador publica, edita e inativa; o aviso fica associado ao autor e auditado; o mural do aluno só mostra avisos ativos; o aviso notifica os alunos aprovados com vínculo válido; edição e inativação não notificam de novo; a mudança de ônibus notifica só o aluno afetado; o toque abre a tela do evento.

## Fontes e versões analisadas

1. [Requisitos, seção 7.8](../../../docs/requisitos.md), com as sugestões do PO da [issue #539](https://github.com/GOUOCE/GOUCE-app/issues/539) já aplicadas nos itens 5, 6 e 7 (campos do aviso, destinatários, edição e inativação sem nova notificação).
2. [BDD do épico 07](../../../bdd/features/epico-07/README.md), com 33 cenários; as divergências com a implementação estão em “Decisões do PO (issue #539) e o que falta implementar”.
3. Backend e front, lidos nas branches `feature/hu-023-publicacao-de-avisos` (commit `5466b1de`) e `feature/hu-024-mural-aluno-e-notificacoes` (commit `e15f398a`), com os PRs [#382](https://github.com/GOUOCE/GOUCE-app/pull/382) e [#383](https://github.com/GOUOCE/GOUCE-app/pull/383) **fechados sem merge**. A HU-024 contém a HU-023.
4. `develop` `1bc67d02` para o que mudou depois: a migration, o layout do aluno e a tela de avisos.
5. [Padrão de contribuição](../../../docs/CONTRIBUTING.md) e [suítes do épico 05](../epico-05/README.md).

Leitura realizada em **25/11/2026**. As branches estão **345 commits atrás** da `develop`; registrar o SHA efetivamente testado na execução.

## Integração antes da execução

Estes pontos foram vistos na leitura e precisam ser resolvidos antes de executar qualquer caso:

| Ponto | Evidência |
| --- | --- |
| Duas heads de migration | `81_create_avisos` e `81_add_updated_at_rotas` partem de `80_remove_horarios_agendamento`; a `develop` já tem as migrations 81 a 85 |
| Layout do aluno incompatível | o branch troca `(aluno)/_layout.tsx` por um layout de abas com o monitoramento de notificações; a `develop` usa `Stack` com `(tabs)` e trata o cadastro rejeitado |
| Tela de avisos do aluno fora das abas | o branch cria `(aluno)/avisos.tsx`; na `develop` o item Avisos da barra aponta para `(aluno)/(tabs)/avisos.tsx`, ainda um stub |
| Arquivos compartilhados | `main.py`, `db.py`, `orm_registry.py` e os menus do administrador mudaram dos dois lados |

## Riscos mapeados no código (resumo)

Os riscos de cada HU estão detalhados no guia `api/README.md` da HU. Resumo do planejamento; nenhum foi reproduzido:

| Risco | HU | Casos |
| --- | --- | --- |
| Edição e inativação de aviso não existem (sem rota nem coluna de situação) | HU-023 | API-006, API-007; UI-006 |
| Busca por título trata `%` e `_` como curinga; mensagem de sucesso com ponto final | HU-023 | API-002; API-001, UI-002 |
| Leitura do mural e das notificações aberta a qualquer perfil autenticado | HU-023, HU-024 | HU-023 API-008; HU-024 API-002, API-008 |
| Notificação só com o app aberto: não há Firebase, APNs nem token do dispositivo | HU-024 | API-009; UI-005, UI-006 |
| Alteração de alocação nunca dispara a notificação; o toque sempre abre o Mural | HU-024 | API-004, API-005; UI-003, UI-004 |
| Cursor único mistura ids de aviso e de realocação (1.000.001 em diante) | HU-024 | API-006 |
| Eventos em memória do processo, no máximo 100, e perdidos no reinício | HU-024 | API-007 |
| Destinatários filtrados só no cliente e só pelo status “pendente” | HU-024 | API-002; UI-008 |
| Rajada de avisos perde intermediários (`limite=5` a cada 5 s) | HU-024 | UI-009 |
| Lista de avisos sem paginação e data de publicação em UTC | HU-023 | API-011; UI-005, UI-007 |
| Erros da consulta (inclusive sessão expirada) engolidos pelo monitoramento | HU-024 | UI-010 |
| Migration e layout do aluno conflitam com a `develop` | HU-023, HU-024 | HU-023 API-010 |

## Divergência entre o README do BDD e o código

O README do BDD (decisão 2) diz que a publicação não grava log de auditoria, mas `AvisoRepository.criar` registra `CRIAR` e há teste para isso (`test_criar_aviso_persiste_autor_e_registra_auditoria`). O CT-HU023-API-005 confere o que o banco mostra; se o código estiver certo, o README do BDD deve ser atualizado.
