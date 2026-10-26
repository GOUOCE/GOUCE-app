# Listagem de faculdades: a chave “Mostrar inativos” já vem ligada

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-008` a partir da `develop` (`a35ceff7`) |
| **Issue** | [#257](https://github.com/GOUOCE/GOUCE-app/issues/257) |
| **Caso relacionado** | `CT-HU008-UI-001` |
| **Documentação** | [HU-008 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-008/tests/manual/epico-02/HU-008/ui/UI-HU-008.md#ct-hu008-ui-001--acessar-a-gestão-de-faculdades) |
| **Issue relacionada** | #246 (mesmo defeito na listagem de bairros) |

---

### Pré-condição

Administrador logado; existe ao menos uma faculdade inativa.

### Passos para reproduzir

1. Tocar em **Cadastros** e em **Faculdades**.
2. Conferir a posição inicial da chave **Mostrar inativos**.

### ✅ Resultado esperado

- A chave começa **desligada**; as faculdades inativas só aparecem quando ela é ligada (AC-01, AC-09).

### ❌ Resultado obtido

- A chave já abre **ligada** e as inativas aparecem na lista sem o administrador pedir.

### ⚠️ Impacto

- O administrador vê registros inativos misturados à gestão do dia a dia, contra o que o requisito define.

### Causa aparente

- `frontend/src/app/(administrador)/faculdades/index.tsx` inicia o estado com `useState(true)`.

### Sugestão

- Iniciar com `useState(false)`.

### Critérios de aceite

- A chave abre desligada e a listagem mostra só as ativas.
- Reexecutar `CT-HU008-UI-001` e `CT-HU008-UI-008`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
