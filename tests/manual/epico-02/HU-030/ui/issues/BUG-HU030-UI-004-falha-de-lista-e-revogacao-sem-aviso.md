# Quando a lista ou a revogação de representantes falha, a tela não mostra erro, e o discente aparece com curso e semestre inventados

| Campo | Valor |
|---|---|
| **Tipo** | Bug de UX |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-030` a partir da `develop` (`88eb19dc`), com as mudanças do PR #195 aplicadas |
| **Issue** | A definir |
| **Caso relacionado** | `CT-HU030-UI-001`, `CT-HU030-UI-012` |
| **Documentação** | [HU-030 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-030/tests/manual/epico-02/HU-030/ui/UI-HU-030.md#ct-hu030-ui-012--falha-de-conexão-sem-exemplos-nem-atribuiçãorevogação-falsa) |
| **Issue relacionada** | [#263](https://github.com/GOUOCE/GOUCE-app/issues/263) (faculdades) e [#283](https://github.com/GOUOCE/GOUCE-app/issues/283) (frota) |

---

### Pré-condição

Administrador logado.

### Passos para reproduzir

1. Deixar a API inacessível e abrir **Cadastros → Representantes**.
2. Com a lista carregada, tirar o acesso à API e tentar revogar um representante.

### ✅ Resultado esperado

- Mensagem de erro clara em português, sem mostrar exemplos nem informar sucesso; o estado da lista é reconciliado depois.

### ❌ Resultado obtido

- Obtido pela leitura do código (o caso não foi executado com a API fora do ar): em `representantes/index.tsx` a falha ao carregar só faz `console.warn` e a revogação só faz `console.error`. A tela mostra “Nenhum representante cadastrado.” quando a lista não carrega e não avisa se a revogação falhou.
- Melhoria do PR #195: não há mais lista de exemplo nem sucesso falso no `representanteService.ts`.
- **Visto na tela:** o cartão do discente selecionado em **Cadastrar Representante** mostra “Engenharia de Software | 2024.1” para o `QA Teste Aluno Sete`, mas a API (`GET /usuarios/alunos`) não envia curso nem semestre desse aluno. Os valores vêm dos padrões fixos de `representanteService.listarAlunosElegiveis` (`curso || 'Engenharia de Software'` e `periodo_ingresso || '2024.1'`); a lista de representantes também usa `UFC`, `Campus Quixadá`, `Engenharia de Software` e `2023.1` quando o campo falta.

### ⚠️ Impacto

- O administrador acredita que não há representantes quando a lista não carregou, e não sabe que a revogação falhou.

### Causa aparente

- Os `catch` de `carregarRepresentantes` e `handleRevogar` não exibem mensagem; o mapeamento da lista usa `||` com valores fixos.

### Sugestão

- Mostrar uma mensagem de erro (pop-up) na falha da lista e da revogação, mantendo a lista anterior, e remover os valores inventados, exibindo vazio ou “não informado”.

### Critérios de aceite

- A falha ao carregar e a falha ao revogar mostram erro visível em português.
- Campos que a API não enviar não aparecem com dados inventados.
- Reexecutar `CT-HU030-UI-012`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-27, ambiente local.
