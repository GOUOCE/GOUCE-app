# Testes manuais — Épico 04 — Agendamento de Transporte (Aluno)

Planejamento essencial da **HU-014 — Visualização e Cancelamento de Agendamentos (Meus Agendamentos)**: **21 casos, sendo 10 de API e 11 de UI**, todos pendentes. Segue a organização e os campos das suítes do épico 03. As HU-013 e HU-015 entram apenas como dependências; suas suítes completas não fazem parte desta entrega.

## Índice das suítes

| HU | Funcionalidade | API | UI | Dependências principais |
| --- | --- | --- | --- | --- |
| HU-014 | Meus agendamentos e cancelamento | [10 casos](HU-014/api/API-HU-014.md) | [11 casos](HU-014/ui/UI-HU-014.md) | HU-013 para massa; HU-011/012 para rotas; HU-016/018 para alocação real; [PR #378](https://github.com/GOUOCE/GOUCE-app/pull/378) para UI |
| **Total** | **1 HU** | **10** | **11** | **21 pendentes** |

## Escopo e organização

- **API:** execução pela LLM, com revisão de Cauan Ricardo; chamadas HTTP contra API e banco reais em ambiente isolado. [Guia de execução](HU-014/api/README.md).
- **UI:** execução manual por Cauan Ricardo no celular ou web; a LLM prepara massa e confere persistência/API quando solicitado.
- Estrutura: `epico-04/HU-014/api/` e `epico-04/HU-014/ui/`. Defeitos reproduzidos serão registrados em `api/issues/` ou `ui/issues/` durante a execução, seguindo os outros épicos.
- Tipos: funcional positivo/negativo, integração com persistência, autorização e integridade. Medição básica do tempo de resposta nos fluxos principais (RNF-001), sem substituir teste de carga.
- IDs: `CT-HU014-API-001` a `010` e `CT-HU014-UI-001` a `011`. Cada caso contém dados, passos, esperado e espaço para resultado obtido.
- Esta branch contém somente planejamento. Depois da revisão e integração em `develop`, criar a branch de execução da HU-014; não registrar aprovação de casos por leitura do código.

## Técnicas e cobertura essencial

| Técnica | Partições ou limites | Casos API | Casos UI |
| --- | --- | --- | --- |
| Partição de equivalência | Sem reservas/com reservas; própria/de outro aluno; ativo/cancelado; perfis autorizados e recusados | 001, 003, 007, 008 | 001, 003, 010 |
| Valor-limite | Ontem/hoje/amanhã; zero/um; 22 → 21 → 22 ativos; mudança de mês | 001, 002, 005, 006, 009 | 001, 002, 006, 007, 011 |
| Transição de estado | ATIVO → CANCELADO; desistir; repetir; erro sem mudança | 004, 007, 010 | 004, 005, 008, 009 |
| Tabela de decisão | Dono × data × status; confirmação × resultado da API | 003 a 008 | 004 a 010 |

O resumo de cada suíte indica as seções A/B/C; os detalhes identificam a técnica aplicada. Não acrescentar combinações repetidas sem risco distinto.

## Fontes e versões analisadas

1. [Requisitos, seção 7.5.2](../../../docs/requisitos.md): AC-01 a AC-08, FA-001 a FA-004, RF-016, RN-005, RNF-001 e RNF-012. AC refere-se somente aos oito critérios de aceite; os itens seguintes do documento são fluxos e referências.
2. API: `origin/develop` **`3e3bb13c6dab1db0b30ea2e58e3bdcd6905c0479`**, com o [PR #381](https://github.com/GOUOCE/GOUCE-app/pull/381) integrado. Código em `backend/src/modulos/agendamentos/`.
3. UI: [PR #378](https://github.com/GOUOCE/GOUCE-app/pull/378), branch **`feature/front-hu014`**, commit **`7d5f01272700c43e6bbecb6d55cc90df35a9da03`**. Código em `frontend/src/app/(aluno)/agenda.tsx` e `frontend/src/services/agendamentoService.ts`.
4. [Padrão de contribuição](../../../docs/CONTRIBUTING.md) e [suítes do épico 03](../epico-03/README.md).

Leitura realizada em **09/11/2026**. Não há arquivo BDD da HU-014 na base analisada; a rastreabilidade usa diretamente os requisitos. Anotar novos commits na execução, pois o PR pode mudar.

## Riscos mapeados no código

São hipóteses para orientar a execução, **não defeitos reproduzidos**.

| Risco | Evidência de leitura | Cobertura |
| --- | --- | --- |
| Calendário e detalhes sem correspondência com a reserva real | `agenda.tsx` tem grade e mês fixos em setembro/2026, data `2026-09-31`, setas sem ação e detalhes de trajeto/ponto/IES fixos | UI-002, UI-003, UI-007 |
| Cancelamento parece funcionar após falha | `cancelarAgendamento` captura qualquer erro e retorna `{ success: true }`; a tela remove a reserva localmente | UI-008, UI-009 |
| Erro de leitura aparece como ausência de reservas | `listarAgendamentosAtivos` retorna `[]` em qualquer erro | UI-009 |
| DELETE usa identificador diferente do registro real | A seleção usa o objeto da grade fixa; o cancelamento usa `idAgendamento` dele ou a data ISO, sem buscar o id da reserva carregada | UI-005 |
| Remoção indevida de histórico | A tela verifica `ehPassado`, mas a grade não preenche esse campo nem usa `pode_remover` retornado pela API | API-006, UI-007 |
| Vaga no veículo continua ocupada | `AgendamentoRepository.remove_allocations` é um gancho sem efeito até HU-016/018 | API-010 e parte de UI-005 |

## Dependências e critérios de bloqueio

Usar a `develop` analisada para API e o build do PR #378 para UI, ambos com os SHAs anotados. A `develop` isoladamente ainda não contém as telas desse PR. Esta branch de documentação não incorpora código da feature.

- A LLM prepara alunos A e B aprovados, rotas ativas e reservas pela API da HU-013. Sem uma dependência, marcar somente a parte afetada como 🚫 e indicar a causa.
- Histórico e feriado/recesso exigem massa de fixture/seed em banco isolado, porque não há endpoint para criar reserva no passado nem para cadastrar feriado no router analisado. Documentar exatamente a preparação; não alterar o relógio do sistema nem dados compartilhados.
- Falta da alocação real bloqueia a comprovação de liberação da vaga e atomicidade com a alocação (API-010); um DELETE 200 sozinho não comprova AC-06 inteiro.
- Para simular falha transacional, é necessário mecanismo controlado no ambiente de teste. Sem ele, registrar a parte como bloqueada, sem chamar teste com mock de integração real.
- No AC-08, testar primeiro erro antes de a requisição chegar à API. Se só a resposta se perder após o commit, consultar novamente o estado no servidor antes de concluir se houve cancelamento parcial.

## Registro dos resultados

Preencher ambiente/commit, data, resultado obtido, status, resumo, totais e defeitos apenas na execução. Em caso parcialmente verificável, separar o que passou, falhou e ficou bloqueado; não aprovar o caso inteiro se houver impedimento. Preservar o esperado mesmo quando a implementação divergir. Contabilização inicial: **21 pendentes, zero executados**.

Registrar HTTP e corpo na API, evidências visuais na UI e consultas de persistência quando pedidas. Omitir credenciais, tokens e dados pessoais dos registros. Preparar relatos `.md` após reprodução; publicação no GitHub fica para a etapa de execução e revisão.
