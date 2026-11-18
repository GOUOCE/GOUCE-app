# Cartão "Rodízio de frota" aparece no painel e abre uma página de erro

| Campo | Valor |
|---|---|
| **Tipo** | Divergência de requisito |
| **Severidade** | 🟡 Média |
| **Ambiente** | Branch `test/execucao-ui-hu-016` — navegador Brave 1.86.148 (Chromium 144.0.7559.133, 64 bits, Linux), front `http://localhost:8081`, API `http://localhost:8216`, commit `0f90c961e484ed1045017d04b1bad15d09b0818c` |
| **Caso relacionado** | `CT-HU016-UI-001` |
| **Documentação** | [HU-016 — Testes manuais de UI](../UI-HU-016.md#ct-hu016-ui-001--acesso-pelo-painel-logístico) |
| **Issue relacionada** | [#504](https://github.com/GOUOCE/GOUCE-app/issues/504) (relato); [#465](https://github.com/GOUOCE/GOUCE-app/issues/465) (decisão do PO sobre o rodízio) |

---

### Pré-condição

Administrador autenticado; `develop` em `0f90c961`.

### Passos para reproduzir

1. Abrir o Painel Logístico.
2. Na seção "Frota", ver o cartão "Rodízio de frota".
3. Tocar nele.
4. Abrir a tela de alocação de um dia (lápis de uma rota).

### ✅ Resultado esperado

- A aba mostra os cartões **Distribuição Logística** e **Lista de embarque**.
- O cartão **Rodízio de frota** fica oculto (HU-020 adiada, decisão do PO na #465); nenhum cartão abre tela inexistente.
- **Distribuição Logística** abre a tela de alocação diária (AC-01).

### ❌ Resultado obtido

- O cartão "Rodízio de frota" aparece na seção "Frota" e, ao tocar, abre `/(administrador)/logistica/rodizio` com "Unmatched Route — Page could not be found." (botões Go back e Sitemap).

Observação (fora do esperado do CT-HU016-UI-001): a tela `/logistica/alocar` mostra o aviso de rodízio de frotas (AC-15) mesmo com o rodízio adiado para a HU-020: "Caso o ônibus mude de rota mesmo sendo associado à outra no rodízio de frotas, ele será alterado apenas para esse dia em específico e voltará para a rota designada no rodízio no dia seguinte."

### ⚠️ Impacto

- O administrador chega a uma rota inexistente e a tela promete uma funcionalidade que não existe nesta HU.

### Causa aparente

Hipótese: em `frontend/src/app/(administrador)/(tabs)/logistica.tsx:65`, o cartão "Rodízio de frota" chama `router.push('/(administrador)/logistica/rodizio' as any)`, rota que não existe no app (só `/(administrador)/logistica/distribuicao` existe no PR #457). Nota breve: o aviso de rodízio em `frontend/src/app/(administrador)/logistica/alocar.tsx:438-442` também não está condicionado à HU-020 estar ativa.

### Critérios de aceite

- O cartão só aparece quando a funcionalidade existir, ou a rota existe e abre uma tela válida (ajuste ao que o CT/AC permitirem).

### 📎 Evidência

Reproduzido por Radlei em 17/11/2026, ambiente local `atu-ui016`. Prints: do painel, do cartão, da tela "Unmatched Route" e da tela de alocação com o aviso.
