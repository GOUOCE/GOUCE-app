# Testes manuais — Épico 05 — Alocação e Distribuição Logística

Suítes essenciais da **HU-016 — Distribuição de Alunos nos Ônibus**, **HU-017 — Alocação de Motoristas às Rotas**, **HU-018 — Visualização da Lista de Embarque** e **HU-019 — Consulta de Alocação Diária**: **76 casos, sendo 39 de API e 37 de UI**. A **HU-020 — Rodízio Semanal** foi adiada pelo PO na [issue #465](https://github.com/GOUOCE/GOUCE-app/issues/465) e não tem suíte nesta entrega. As execuções de API incorporadas nesta base registram **HU-017: 5 passaram, 4 falharam e 1 parcial**; **HU-018: 5 passaram e 4 falharam**; **HU-019: 6 passaram, 2 falharam e 1 parcial**. Total: **16 passaram, 10 falharam, 2 parciais e 48 sem resultado incorporado nesta base**. Execuções em outras branches mantêm seu histórico separado.

## Índice das suítes

| HU | Funcionalidade | API | UI |
| --- | --- | --- | --- |
| HU-016 | Distribuição de Alunos nos Ônibus | [11 casos](HU-016/api/API-HU-016.md) | [9 casos](HU-016/ui/UI-HU-016.md) |
| HU-017 | Alocação de Motoristas às Rotas | [10 casos: 5 passaram, 4 falharam, 1 parcial](HU-017/api/API-HU-017.md) | [9 casos pendentes](HU-017/ui/UI-HU-017.md) |
| HU-018 | Visualização da Lista de Embarque | [9 casos: 5 passaram, 4 falharam](HU-018/api/API-HU-018.md) | [10 casos pendentes](HU-018/ui/UI-HU-018.md) |
| HU-019 | Consulta de Alocação Diária | [9 casos: 6 passaram, 2 falharam, 1 parcial](HU-019/api/API-HU-019.md) | [9 casos pendentes](HU-019/ui/UI-HU-019.md) |
| **Total** | **4 HUs** | **39** | **37** |

Cada HU tem um [guia de execução da API](HU-016/api/README.md) (`api/README.md`) com a base analisada, a preparação da massa, as conferências e os **riscos mapeados no código**.

## Escopo e organização

- **API:** execução pela LLM, com revisão de Cauan Ricardo; chamadas HTTP contra API e banco reais em ambiente isolado.
- **UI:** execução manual por Cauan Ricardo no celular ou na web; a LLM prepara a massa e confere API e banco depois de cada caso. A LLM não conduz a UI.
- Estrutura: `epico-05/HU-016/`, `HU-017/`, `HU-018/` e `HU-019/`, cada uma com `api/` e `ui/`. Defeitos reproduzidos serão registrados em `api/issues/` ou `ui/issues/` na execução.
- Tipos: funcional positivo e negativo, integração com persistência, autorização, integridade e desempenho básico (RNF-001), sem substituir teste de carga.
- IDs: `CT-HU016-API-001` a `011`, `CT-HU016-UI-001` a `009`, `CT-HU017-API-001` a `010`, `CT-HU017-UI-001` a `009`, `CT-HU018-API-001` a `009`, `CT-HU018-UI-001` a `010`, `CT-HU019-API-001` a `009` e `CT-HU019-UI-001` a `009`. Cada caso contém dados, passos, esperado e espaço para o resultado obtido.
- Cada HU tem a sua branch de planejamento (`test/planejamento-api-ui-hu-016` a `-019`), com entrega para `develop`. Depois da revisão e da integração, criar a branch própria de execução; não registrar aprovação de caso por leitura do código.

## Técnicas e cobertura essencial

| Técnica | Cobertura | HU |
| --- | --- | --- |
| Valor-limite | Capacidade de assentos e em pé (abaixo, no limite, acima); tempo de resposta de até 3 s | HU-016, HU-019 |
| Tabela de decisão | Ônibus com vaga × demanda; motorista × rota × turno; ida × volta × IES; turno alocado × aguardando | HU-016, HU-017, HU-018, HU-019 |
| Partição de equivalência | Perfis; ativo/inativo; com/sem alocação; rota com/sem alunos; entradas inválidas | todas |
| Transição de estado | Prévia → persistida; reconfirmar; cancelamento e realocação com a lista aberta; online/offline | todas |
| Integridade e atomicidade (RNF-012) | Recusas sem gravação parcial; confirmações simultâneas; substituição do dia | HU-016, HU-017 |
| Autorização e privacidade (RN-006, RNF-010) | Administrador, representante, aluno, sem token; só alunos da própria IES | todas |

Matriz essencial: a distribuição nunca ultrapassa assentos + em pé; excedente é permitido na confirmação e fica aguardando; a escala não repete motorista nem ônibus no mesmo dia e turno; a lista de embarque só traz alunos alocados com reserva ativa; o aluno vê só a própria alocação e, sem distribuição, “Aguardando alocação do veículo”.

## Fontes e versões analisadas

1. [Requisitos, seção 7.6](../../../docs/requisitos.md), já com as decisões do PO na [issue #465](https://github.com/GOUOCE/GOUCE-app/issues/465) (alunos em pé, excedentes, conflito por turno, mensagem do conflito de motorista, troca de ônibus e motorista, rodízio adiado e auditoria da escala).
2. [BDD do épico 05](../../../bdd/features/epico-05/README.md), com 84 cenários; as divergências com a implementação estão em “Divergências encontradas entre requisitos e implementação”.
3. Backend: `develop` **`1eb2818d`**, módulo `backend/src/modulos/alocacao_diaria/` (rotas, `alocacao_service.py`, `distribuicao.py`, `lista_embarque_service.py` e `minha_viagem_service.py`), migrations até `82_updated_at_faculdade_ponto`.
4. Front: `develop` para a lista de embarque (HU-018) e a consulta do aluno (HU-019); **HU-016 e HU-017 dependem do [PR #457](https://github.com/GOUOCE/GOUCE-app/pull/457)** (`feature/front-hu16e17`, commit `80830b4d`), que ainda não está na `develop`.
5. [Padrão de contribuição](../../../docs/CONTRIBUTING.md) e [suítes do épico 04](../epico-04/README.md).

Leitura realizada em **16/11/2026**. O PR #457 está aberto e pode mudar: registrar o SHA efetivamente testado na execução.

## Riscos mapeados no código (resumo)

Os riscos de cada HU estão detalhados no guia `api/README.md` da HU. Resumo do planejamento; os resultados das HU-017, HU-018 e HU-019 estão indicados abaixo e nas respectivas suítes. A HU-016 mantém o histórico da sua entrega própria:

| Risco | HU | Casos |
| --- | --- | --- |
| A prévia não usa outro ônibus com assento livre antes de deixar aluno em pé | HU-016 | API-004; UI-003 |
| A confirmação com excedentes não informa a lista; a tela mostra “Agendamento #id” | HU-016 | API-007; UI-005 |
| Realocar excedente para ônibus de outra rota parece impossível pela API (e, por consequência, o aviso de realocação da HU-019) | HU-016, HU-019 | HU-016 API-008; HU-019 API-005 |
| Lista de alocações vazia no modo manual apaga a distribuição do dia | HU-016 | API-010 |
| A tela reexibe a distribuição confirmada a partir de memória do app | HU-016, HU-017 | HU-016 UI-004; HU-017 UI-003 |
| **Reproduzido:** mensagem de sucesso [#489](https://github.com/GOUOCE/GOUCE-app/issues/489), mensagem de conflito [#490](https://github.com/GOUOCE/GOUCE-app/issues/490) e auditoria ausente [#491](https://github.com/GOUOCE/GOUCE-app/issues/491) | HU-017 | API-001/004/007 falharam |
| **Parcial:** roteiro pede id no texto, mas a API responde exatamente como o BDD — revalidação/rollback corretos; sem bug de backend atribuído | HU-017 | API-006 parcial |
| **Reproduzido:** inativação de motorista com escala futura é aceita — [#492](https://github.com/GOUOCE/GOUCE-app/issues/492) | HU-017 | API-008 falhou |
| **Reproduzido:** data inexistente causa 500 em lista-embarque e rotas-do-dia — [#480](https://github.com/GOUOCE/GOUCE-app/issues/480) | HU-018 | API-005 falhou |
| **Reproduzido:** representante recebe dados do trecho da outra IES — [#481](https://github.com/GOUOCE/GOUCE-app/issues/481) | HU-018 | API-006 falhou |
| **Reproduzido:** filtro por turno mantém ponto/IES do trecho excluído — [#482](https://github.com/GOUOCE/GOUCE-app/issues/482) | HU-018 | API-003 falhou |
| **Reproduzido:** nomes acentuados depois de Z — [#483](https://github.com/GOUOCE/GOUCE-app/issues/483) | HU-018 | API-002 falhou |
| **Reproduzido em fixture legada:** mensagem genérica para representante sem IES — [#484](https://github.com/GOUOCE/GOUCE-app/issues/484) | HU-018 | API-006 falhou |
| Uma chamada de alocação por reserva ao abrir Agenda e Início; falha vira “Aguardando alocação” | HU-019 | UI-008, UI-009 |
| **Reproduzido:** `minha-viagem` retorna 200 ALOCADO para pendente/rejeitado/vencido enquanto `/meus` recusa 403 — [#487](https://github.com/GOUOCE/GOUCE-app/issues/487); esperado inferido a confirmar com o PO | HU-019 | API-008 falhou |
| **Reproduzido:** data inválida retorna 422 com texto técnico em inglês — [#486](https://github.com/GOUOCE/GOUCE-app/issues/486) | HU-019 | API-007 falhou |
| **Parcial:** leitura do aviso de realocação confirmada com fixture restaurada; distribuição regular recusa a troca de rota — [#478](https://github.com/GOUOCE/GOUCE-app/issues/478) | HU-019 | API-005 parcial |

## Dependências e critérios de bloqueio

- **HU-016 e HU-017 (UI):** exigem o build do PR #457; na `develop`, o painel logístico aponta para telas que só existem nesse PR e ainda mostra o cartão do rodízio (HU-020 adiada).
- **Massa:** toda a massa de alocação parte de reservas da HU-013 e de cadastros administrativos de rotas, frota e motoristas; a LLM prepara pela API e registra ids, datas, donos e trechos.
- **Ordem sugerida de execução:** HU-016 (cria a distribuição) → HU-017 (escala) → HU-018 (lista) → HU-019 (consulta do aluno).
- **Realocação:** depende de a distribuição permitir ônibus de outra rota; se não permitir, a HU-019 só pode ser exercitada por fixture documentada no banco isolado, sem aprovar o fluxo completo.
- Registrar cada parte verificada, falha ou impedimento; não aprovar o caso inteiro quando houver impedimento.

## Registro dos resultados

Preencher ambiente/commit, data, resultado obtido, status, resumo, totais e defeitos apenas na execução. Preservar o esperado mesmo quando a implementação divergir. Contabilização após incorporar as execuções de API HU-017, HU-018 e HU-019: **16 passaram, 10 falharam, 2 parciais e 48 sem resultado registrado nesta base**. Registrar HTTP e corpo na API, evidências visuais na UI e consultas de persistência quando pedidas, sem credenciais, tokens ou dados pessoais. Relatos `.md` de defeitos são preparados depois da reprodução; a publicação no GitHub fica para a etapa de execução e revisão.

## Execução de API HU-018 — 17/11/2026

Branch `test/execucao-api-hu-018` criada da develop atualizada `7372b8d67165344545c1264ac936cd4c060ca245`, já com PR #457 integrado. Stack isolada `atu-qa-hu018`, HTTP na porta 8118, PostgreSQL real e migration head `82_create_alocacao_diaria`. Os 9 casos foram concluídos: 5 passaram e 4 falharam; nenhuma dependência bloqueou esta execução. Resultados completos na [suíte](HU-018/api/API-HU-018.md).

Por solicitação de Cauan, somente erros têm JSON de evidência, no próprio corpo das cinco issues vinculadas. Não há pasta/arquivo de evidências desta execução no repositório. A UI não foi executada; os 37 casos de UI e os 30 casos de API das outras HUs preservam o estado registrado nesta base.

## Execução de API HU-019 — 17/11/2026

Branch `test/execucao-api-hu-019` criada da develop atualizada `7372b8d67165344545c1264ac936cd4c060ca245`, já com PR #457 integrado. Stack isolada `atu-qa-hu019`, HTTP na porta 8119, banco PostgreSQL real e head `82_create_alocacao_diaria`. Os 9 casos foram abordados: **6 passaram, 2 falharam e 1 parcial**. Resultados, dependência da realocação, fixtures restauradas e medições de desempenho na [suíte](HU-019/api/API-HU-019.md).

Foram 128 chamadas HTTP reais. Somente falhas têm JSON de evidência, no corpo das issues #486 e #487, atribuídas ao Clidenor e classificadas com HU-019. Sem arquivo JSON/pasta de evidências no repositório. A dependência de realocação usa a issue #478 já existente, sem duplicá-la. Os testes de UI e resultados de outras HUs foram preservados.

## Execução de API HU-017 — 17/11/2026

Branch `test/execucao-api-hu-017` criada da develop atualizada `a2bd96f757f0bbccf1fd2ecec3260c557bda166a`; backend dessa revisão executado por HTTP real e PostgreSQL vazio migrado até `82_create_alocacao_diaria`, na porta 8117. A branch incorporou depois a develop `3e340ac3` com os resultados HU-019; somente documentação mudou nessa atualização e o código executado permaneceu idêntico.

Os 10 casos foram concluídos: **5 passaram, 4 falharam e 1 parcial**. Foram 126 chamadas HTTP, incluindo revisão da divergência do API-006 com o BDD. As duas rodadas de concorrência tiveram sobreposição real, quatro respostas 201 e estado final consistente, sem 500. Os defeitos #489 a #492 têm JSON das falhas no corpo das issues e estão atribuídos ao Clidenor. Não há pasta/arquivo JSON de evidência no repositório. Resultados detalhados na [suíte](HU-017/api/API-HU-017.md).
