# Testes de API — HU-013

Execução pela LLM, com revisão de Cauan Ricardo. [Suíte com 12 casos essenciais](API-HU-013.md). Resultado do reteste em 10/11/2026: **12 passaram**. Em 09/11/2026 a API da feature não publicava as rotas de agendamento (CT-001 falhou e 11 casos ficaram bloqueados, [issue #399](https://github.com/GOUOCE/GOUCE-app/issues/399)); a correção entrou na `feature/front-hu013` e os casos foram executados no commit `0c0a079c`. [Evidência JSON](EVIDENCIAS-HU-013.json) e [relato do bug corrigido](issues/BUG-HU013-API-001-rotas-agendamento-nao-publicadas.md).

Os resultados do reteste são versionados na branch `test/reteste-api-hu-013`, criada da develop. O código testado é o backend de `feature/front-hu013`, commit `0c0a079c87da54ac5f8cafbd4dbeffa57e84d972` ([PR #377](https://github.com/GOUOCE/GOUCE-app/pull/377)), preparado em checkout separado para manter o PR de resultados restrito aos testes.

## Execução

1. Ler os requisitos, o BDD referenciado e a resposta do PO na #389, conforme fontes da suíte.
2. Preparar API/PostgreSQL isolados e aplicar migrations do commit alvo em banco novo. Usar contas sintéticas e login real; guardar tokens fora do Git.
3. Executar primeiro CT-001, conferindo health, OpenAPI e publicação das operações do módulo. Não registrar como acesso negado ou validação um 404 de rota inexistente.
4. Com a integração disponível, executar os demais casos, conferindo HTTP e persistência. Se um bloqueio comum impedir a execução, reproduzi-lo, registrar um relato e marcar somente os casos dependentes como bloqueados.
5. Preencher resultado obtido/status, resumo/totais e defeitos. Preservar o esperado. Evidência em `EVIDENCIAS-HU-013.json`, um JSON simples com o alvo, resumo, respostas relevantes e dependências; não criar pastas de executor/evidências.

Preparar relatos de bugs reproduzidos em `issues/` seguindo o [modelo de API](../../../modelos/ISSUE-BUG-API.md). Relatos locais ficam para revisão de Cauan antes da publicação de issues no GitHub.

Fazer commits com autoria de Cauan e sem coautoria, e PR com destino à develop conforme [CONTRIBUTING](../../../../../docs/CONTRIBUTING.md). A UI não é exercitada nesta execução.
