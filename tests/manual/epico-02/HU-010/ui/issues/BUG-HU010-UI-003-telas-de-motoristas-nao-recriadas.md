# Telas de motoristas não são recriadas: o formulário reabre com dados da vez anterior e a seta volta ao Painel

| Campo | Valor |
|---|---|
| **Tipo** | Bug de UX |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-010` a partir da `develop` (`4b1706ee`), com o `motoristaService.ts` do PR #243 aplicado |
| **Issue** | A definir |
| **Caso relacionado** | `CT-HU010-UI-001`, `CT-HU010-UI-003` |
| **Documentação** | [HU-010 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-010/tests/manual/epico-02/HU-010/ui/UI-HU-010.md#ct-hu010-ui-003--cadastrar-fixo-homônimo-e-número-dos-exemplos) |
| **Issue relacionada** | [#275](https://github.com/GOUOCE/GOUCE-app/issues/275) (frota), [#256](https://github.com/GOUOCE/GOUCE-app/issues/256) (faculdades) e [#245](https://github.com/GOUOCE/GOUCE-app/issues/245) (bairros) |

---

### Pré-condição

Administrador logado.

### Passos para reproduzir

1. Cadastrar um motorista e voltar à lista.
2. Tocar em **+ Novo** de novo.
3. Abrir a edição de um motorista, alterar um campo, sair sem salvar e abrir a edição novamente.

### ✅ Resultado esperado

- O cadastro abre vazio a cada vez e a edição abre com os dados gravados.
- A seta de voltar leva para a tela anterior.

### ❌ Resultado obtido

- O testador observou que a tela de cadastro reabre com os dados da vez anterior.
- Pelo código, o mesmo vale para a edição, e a seta de voltar usa `router.back()` (leva ao Painel, como nas outras gestões); isso não foi conferido na tela nesta execução.

### ⚠️ Impacto

- O administrador pode cadastrar ou salvar com dados antigos sem perceber.

### Causa aparente

- As telas ficam em abas ocultas e não são recriadas; `motoristas/cadastrar.tsx` e `editar.tsx` mantêm o estado do formulário e navegam com `router.back()`.

### Sugestão

- Mesma correção das #245, #256 e #275: recriar as telas ao abrir, voltar para a rota certa e limpar o formulário ao entrar e ao sair.

### Critérios de aceite

- Cadastrar abre vazio; Editar abre com os dados gravados; sair sem salvar descarta as mudanças.
- A seta volta para a tela anterior.
- Reexecutar `CT-HU010-UI-001` e `CT-HU010-UI-003`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-27, ambiente local.
