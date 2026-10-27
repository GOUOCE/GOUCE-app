# Listagem de frota: a chave “Mostrar inativos” já vem ligada

| Campo | Valor |
|---|---|
| **Tipo** | Bug de requisito |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-009` a partir da `develop` (`1edaf2aa`) |
| **Issue** | [#276](https://github.com/GOUOCE/GOUCE-app/issues/276) |
| **Caso relacionado** | `CT-HU009-UI-001` |
| **Documentação** | [HU-009 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-009/tests/manual/epico-02/HU-009/ui/UI-HU-009.md#ct-hu009-ui-001--abrir-a-frota-buscar-e-conferir-lista-vazia) |
| **Issue relacionada** | [#257](https://github.com/GOUOCE/GOUCE-app/issues/257) (faculdades) e AC-01/AC-11 da HU-009 |

---

### Pré-condição

Administrador logado.

### Passos para reproduzir

1. Abrir **Cadastros → Frota** e observar a chave **Mostrar inativos**.

### ✅ Resultado esperado

- A chave começa desligada e a lista mostra só os ônibus ativos (AC-01, AC-11).

### ❌ Resultado obtido

- A chave abre ligada e os inativos aparecem misturados com os ativos.

### ⚠️ Impacto

- A listagem deixa de mostrar só os ativos por padrão, contrariando o requisito.

### Causa aparente

- `frota/index.tsx` inicializa `mostrarInativos` com `useState(true)`.

### Sugestão

- Inicializar com `useState(false)`.

### Critérios de aceite

- Ao abrir a frota a chave está desligada e só ativos aparecem.
- Reexecutar `CT-HU009-UI-001`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
