# Listagem de motoristas: a chave “Mostrar inativos” já vem ligada

| Campo | Valor |
|---|---|
| **Tipo** | Bug de requisito |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-010` a partir da `develop` (`4b1706ee`), com o `motoristaService.ts` do PR #243 aplicado |
| **Issue** | A definir |
| **Caso relacionado** | `CT-HU010-UI-001`, `CT-HU010-UI-010` |
| **Documentação** | [HU-010 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-010/tests/manual/epico-02/HU-010/ui/UI-HU-010.md#ct-hu010-ui-001--abrir-listagem-e-buscar-por-nome) |
| **Issue relacionada** | [#276](https://github.com/GOUOCE/GOUCE-app/issues/276) (frota), [#257](https://github.com/GOUOCE/GOUCE-app/issues/257) (faculdades) e AC-01/AC-09 da HU-010 |

---

### Pré-condição

Administrador logado.

### Passos para reproduzir

1. Abrir **Cadastros → Motoristas** e observar a chave **Mostrar inativos**.

### ✅ Resultado esperado

- A chave começa desligada e a lista mostra só os motoristas ativos (AC-01, AC-09).

### ❌ Resultado obtido

- A chave abre ligada e os inativos aparecem na tela desde o início.
- O app também pede sempre `incluir_inativos=true` à API, qualquer que seja a chave; o filtro dos inativos é feito só na tela.

### ⚠️ Impacto

- A listagem deixa de mostrar só os ativos por padrão, contrariando o requisito.

### Causa aparente

- `motoristas/index.tsx` inicializa `mostrarInativos` com `useState(true)` e chama `motoristaService.listarMotoristas(busca)`, cujo padrão é `incluirInativos = true`.

### Sugestão

- Inicializar com `useState(false)` e, se a ideia do PR #243 é consultar a API conforme a chave, passar o valor da chave para `listarMotoristas`.

### Critérios de aceite

- Ao abrir a tela, a chave está desligada e só ativos aparecem.
- Reexecutar `CT-HU010-UI-001` e `CT-HU010-UI-010`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-27, ambiente local.
