# Como executar os testes manuais de API — HU-015

Execução pela **LLM**, com revisão de **Cauan Ricardo**. Esta entrega é de planejamento: todos os casos estão pendentes. A consulta offline é exercitada na [UI](../ui/UI-HU-015.md), porque o cache pertence ao dispositivo, não à API.

## 1. Branch e fontes

Depois da revisão e integração do planejamento em `develop`, criar a branch de execução conforme o [CONTRIBUTING](../../../../../docs/CONTRIBUTING.md):

```bash
git switch develop
git pull --ff-only
git switch -c feature/testes-api-hu-015
```

Preservar alterações locais usando worktree quando necessário. Ler a [suíte](API-HU-015.md), os [requisitos, seção 7.5.3](../../../../../docs/requisitos.md), o [índice do épico](../../README.md) e o [exemplo preenchido da HU-001](../../../epico-01/HU-001/api/API-HU-001.md).

Não havia BDD da HU-015 na base analisada. Se ele for adicionado, comparar seus cenários aos quatro critérios de aceite e às duas alternativas antes da execução; registrar divergências para revisão sem alterar o esperado apenas para fazer o teste passar.

## 2. Confirmar o contrato antes de executar

| Origem | Operação | Situação na análise |
| --- | --- | --- |
| Backend `develop` `99bbf2c6` | `GET /transporte/agendamentos/meus` e `GET /transporte/agendamentos/{id}` | Reais; retornam reservas do aluno e ids/nomes das complementares por trecho |
| Front do PR #379 `b2111a9c` | `GET /agendamentos/detalhes?data=YYYY-MM-DD` | Chamado pelo serviço; não encontrado no backend analisado |
| Cadastro administrativo | `GET /rotas-complementares/{id}` | Existe, exige administrador; serve de referência para preparar/conferir massa, não como permissão a ser dada ao aluno |

Executar CT-001 e guardar OpenAPI, URL e resposta real. Os campos de `DetalhesViagemResponse` no TypeScript são uma expectativa do front, não prova de um contrato HTTP implementado. Não inventar endpoint, response ou códigos de erro para operações ainda ausentes. Quando houver contrato integrado, anotar o endpoint efetivo usado no build e executar os casos dependentes nele.

## 3. Ambiente e massa

1. Usar API e PostgreSQL reais em ambiente isolado; registrar URL, SHA do backend e fuso. Não modificar dados compartilhados.
2. Autenticar alunos A e B aprovados e com vínculo válido em `POST /auth/login`; separar token de administrador para preparar cadastros e conferir referências.
3. Pela API de cadastros, preparar bairro/pontos, IES e rota principal ativa. Criar duas complementares distintas com `horario_saida`, `horario_retorno`, `ponto_conexao` e vínculo à principal (HU-012).
4. Criar reservas pelo `POST /transporte/agendamentos` da HU-013: uma só com complementar na ida; outra só na volta; outra com complementares diferentes na ida/volta; uma direta; e reserva de B para a mesma data de uma reserva de A. Usar dias válidos na janela e ids reais, sem presumir `id = 1`.
5. Conferir e guardar o mapa aluno/data/id/trechos/complementares antes de chamar o detalhe. Os dados devem diferir do protótipo fixo do front para detectar fallback.
6. Para conferir veículo/motorista por operação/dia, preparar alocação real das HU-016/017/018 quando disponível. Sem modelo/operação implementada, registrar a dependência; não inferir que o nome cadastrado da rota é o veículo escalado.

## 4. Executar e registrar

Executar CT-001 a CT-007. Chamadas de leitura não devem alterar reservas, alocação ou contador. Guardar HTTP e corpo sem tokens, campos ausentes, referência consultada e estado antes/depois quando houver preparação entre chamadas.

- Nos endpoints existentes, usar os códigos e campos documentados na suíte.
- Nos casos de detalhe completo/veículo diário, ausência do contrato ou da alocação bloqueia a comprovação dependente. Um 404 de rota inexistente não aprova controle de acesso nem comportamento de viagem sem reserva.
- Se o front exibir dados apesar de o HTTP falhar, isso é verificado na UI: não contar como API aprovada, sincronização ou cache de dados reais.
- Testes com mock existentes no PR não substituem chamadas HTTP reais. Um GET no servidor não comprova cache offline persistente.

## 5. Revisão e entrega

Preencher ambiente/SHA, última execução, resultado obtido por variação, status, resumo, totais e defeitos. Usar ✅ passou, ❌ falhou, ⚠️ parcial, 🚫 bloqueado e ⏳ pendente; separar o que foi verificado do que a dependência impediu.

Para falha reproduzida, preparar `api/issues/BUG-HU015-API-001-<resumo>.md` usando o [modelo de API](../../../modelos/ISSUE-BUG-API.md), com referência na suíte. Cauan revisa os registros antes de publicar relatos. Commitar somente os resultados/relatos pertinentes, com sua autoria e sem coautoria, em PR de execução destinado à `develop`.
