# Listagem de bairros: a chave “Mostrar inativos” já vem ligada e só mostra a quantidade de pontos

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / requisito |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-007` a partir da `develop` (`5445f7b4`) |
| **Issue** | [#246](https://github.com/GOUOCE/GOUCE-app/issues/246) |
| **Caso relacionado** | `CT-HU007-UI-001` |
| **Documentação** | [HU-007 — Testes manuais de UI](../UI-HU-007.md#ct-hu007-ui-001--acessar-a-gestão-de-bairros) |

---

### Pré-condição

Administrador logado. Bairros ativos com pontos (ex.: `Centro QA` com 3 pontos) e pelo menos um bairro inativo.

### Passos para reproduzir

1. Abrir **Cadastros → Bairros e pontos de parada**.
2. Conferir a posição da chave **Mostrar inativos** e o que cada bairro mostra.

### ✅ Resultado esperado

- A chave **Mostrar inativos** começa **desligada**: a listagem traz só os bairros ativos, e os inativos aparecem quando a chave é ligada (AC-01, AC-09).
- Cada bairro é exibido com os **nomes** dos seus pontos de parada ativos (AC-01, cenário “Administrador visualiza os bairros ativos com seus pontos de parada”).

### ❌ Resultado obtido

- A chave abre **ligada**, e os bairros inativos já aparecem sob o título **Inativos**.
- Cada bairro mostra só o texto “N pontos de parada” (ex.: “3 pontos de parada”), sem os nomes.

### ⚠️ Impacto

- O administrador não vê quais pontos cada bairro tem sem abrir **Editar**.
- Registros inativos aparecem sem o administrador pedir.

### Causa aparente

`frontend/src/app/(administrador)/bairros/index.tsx`: `useState(true)` na chave (linha 14) e a linha de cada bairro monta só a quantidade (`textoPontos`).

### Sugestão

- Iniciar a chave desligada (`useState(false)`).
- Listar os nomes dos pontos ativos de cada bairro (ou os primeiros, com “+N”).

### Critérios de aceite

- Ao abrir a tela, a chave está desligada e só há bairros ativos.
- Cada bairro mostra os nomes dos pontos ativos.
- Reexecutar `CT-HU007-UI-001`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
