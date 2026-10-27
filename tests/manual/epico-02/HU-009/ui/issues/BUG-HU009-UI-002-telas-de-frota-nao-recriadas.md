# Telas de frota não são recriadas: a seta volta ao Painel, os formulários não limpam e a edição não é descartada

| Campo | Valor |
|---|---|
| **Tipo** | Bug de UX |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-009` a partir da `develop` (`1edaf2aa`) |
| **Issue** | A definir |
| **Caso relacionado** | `CT-HU009-UI-001`, `CT-HU009-UI-002` |
| **Documentação** | [HU-009 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-009/tests/manual/epico-02/HU-009/ui/UI-HU-009.md#ct-hu009-ui-001--abrir-a-frota-buscar-e-conferir-lista-vazia) |
| **Issue relacionada** | [#245](https://github.com/GOUOCE/GOUCE-app/issues/245) (bairros) e [#256](https://github.com/GOUOCE/GOUCE-app/issues/256) (faculdades) |

---

### Pré-condição

Administrador logado.

### Passos para reproduzir

1. Abrir **Cadastros → Frota** e tocar na seta de voltar.
2. Abrir **+ Novo**, preencher campos, sair e abrir **+ Novo** de novo.
3. Abrir a edição de um ônibus, alterar um campo, sair sem salvar e abrir a edição de novo.

### ✅ Resultado esperado

- A seta volta para a tela anterior (lista de cadastros).
- O formulário de cadastro abre vazio a cada vez.
- Sair da edição sem salvar descarta as mudanças.

### ❌ Resultado obtido

- A seta de voltar leva ao **Painel**, e não à tela anterior.
- O cadastro e a edição reabrem com os dados da vez anterior.

### ⚠️ Impacto

- O administrador perde o contexto de navegação e pode cadastrar ou editar um ônibus com dados antigos sem perceber.

### Causa aparente

- As telas ficam em abas ocultas e não são recriadas. `frota/cadastrar.tsx`, `editar.tsx` e `index.tsx` usam `router.back()`; o estado de formulário permanece em memória.

### Sugestão

- Mesma correção das #245 e #256: recriar as telas ao abrir, voltar para a rota correta e limpar o formulário ao entrar e ao sair.

### Critérios de aceite

- A seta volta para a tela anterior.
- Cadastrar abre vazio; Editar abre com os dados gravados.
- Reexecutar `CT-HU009-UI-001` e `CT-HU009-UI-002`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
