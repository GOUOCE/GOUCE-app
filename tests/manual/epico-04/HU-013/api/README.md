# Testes de API — HU-013

Execução pela LLM, com revisão de Cauan Ricardo. [Suíte com 12 casos essenciais](API-HU-013.md). Resultado em 09/11/2026: **1 falhou e 11 bloqueados**. A API da feature iniciou e autenticou o aluno, mas não publicou as rotas de agendamento. [Evidência JSON](EVIDENCIAS-HU-013.json) e [relato local do bug](issues/BUG-HU013-API-001-rotas-agendamento-nao-publicadas.md). Nenhuma issue foi publicada no GitHub.

Os resultados são versionados na branch `feature/testes-api-hu-013`, criada da develop. O código testado é o backend de `feature/front-hu013`, commit `ee305857954fcb23f3919f3ebfe7e163fcbc167a` ([PR #377](https://github.com/GOUOCE/GOUCE-app/pull/377)), preparado em checkout separado para manter o PR de resultados restrito aos testes.

## Execução

1. Ler os requisitos, o BDD referenciado e a resposta do PO na #389, conforme fontes da suíte.
2. Preparar API/PostgreSQL isolados e aplicar migrations do commit alvo em banco novo. Usar contas sintéticas e login real; guardar tokens fora do Git.
3. Executar primeiro CT-001, conferindo health, OpenAPI e publicação das operações do módulo. Não registrar como acesso negado ou validação um 404 de rota inexistente.
4. Com a integração disponível, executar os demais casos, conferindo HTTP e persistência. Se um bloqueio comum impedir a execução, reproduzi-lo, registrar um relato e marcar somente os casos dependentes como bloqueados.
5. Preencher resultado obtido/status, resumo/totais e defeitos. Preservar o esperado. Evidência em `EVIDENCIAS-HU-013.json`, um JSON simples com o alvo, resumo, respostas relevantes e dependências; não criar pastas de executor/evidências.

Preparar relatos de bugs reproduzidos em `issues/` seguindo o [modelo de API](../../../modelos/ISSUE-BUG-API.md). Relatos locais ficam para revisão de Cauan antes da publicação de issues no GitHub.

Fazer commits com autoria de Cauan e sem coautoria, e PR com destino à develop conforme [CONTRIBUTING](../../../../../docs/CONTRIBUTING.md). A UI não é exercitada nesta execução.
