# Representantes revogados somem da lista: a tela filtra só os ativos, contrariando o AC-01

| Campo | Valor |
|---|---|
| **Tipo** | Bug de requisito |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-030` a partir da `develop` (`88eb19dc`), com as mudanças do PR #195 aplicadas |
| **Issue** | A definir |
| **Caso relacionado** | `CT-HU030-UI-001`, `CT-HU030-UI-007` |
| **Documentação** | [HU-030 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-030/tests/manual/epico-02/HU-030/ui/UI-HU-030.md#ct-hu030-ui-007--cancelar-e-confirmar-revogação-mantendo-aluno-e-revogado-na-lista) |
| **Issue relacionada** | AC-01 da HU-030 |

---

### Pré-condição

Administrador logado, com pelo menos um representante revogado.

### Passos para reproduzir

1. Em **Cadastros → Representantes**, revogar um representante e confirmar.
2. Voltar para a lista e atualizar a página.

### ✅ Resultado esperado

- A lista mostra os representantes ativos **e** os que tiveram a função revogada, identificados como revogados (AC-01).

### ❌ Resultado obtido

- O representante revogado (`QA Teste Aluno Sete`) deixa de aparecer, mesmo depois de atualizar a página.
- A API continua devolvendo o revogado com `ativo = false`: `GET /representantes` lista os três representantes, dois ativos e um revogado.

### ⚠️ Impacto

- O administrador não consegue ver quem teve a função revogada, nem conferir a revogação nem reatribuir a partir da lista.

### Causa aparente

- `representantes/index.tsx` aplica `setRepresentantes(lista.filter((r) => r.ativo))` em `carregarRepresentantes`.

### Sugestão

- Mostrar todos os registros devolvidos pela API e identificar os revogados (por exemplo, uma etiqueta “Revogado” e sem o botão de revogar), ou confirmar com o produto que o AC-01 deve mudar.

### Critérios de aceite

- Depois da revogação o representante continua na lista, identificado como revogado.
- Reexecutar `CT-HU030-UI-001` e `CT-HU030-UI-007`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-27, ambiente local.
