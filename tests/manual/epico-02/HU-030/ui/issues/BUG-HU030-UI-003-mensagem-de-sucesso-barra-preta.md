# Mensagens de sucesso de representantes aparecem em barra preta, fora do padrão de pop-up do app

| Campo | Valor |
|---|---|
| **Tipo** | Bug de UX |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-030` a partir da `develop` (`88eb19dc`), com as mudanças do PR #195 aplicadas |
| **Issue** | [#299](https://github.com/GOUOCE/GOUCE-app/issues/299) |
| **Caso relacionado** | `CT-HU030-UI-007` |
| **Documentação** | [HU-030 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-030/tests/manual/epico-02/HU-030/ui/UI-HU-030.md#ct-hu030-ui-007--cancelar-e-confirmar-revogação-mantendo-aluno-e-revogado-na-lista) |
| **Issue relacionada** | [#289](https://github.com/GOUOCE/GOUCE-app/issues/289) (motoristas), [#278](https://github.com/GOUOCE/GOUCE-app/issues/278) (frota) e [#260](https://github.com/GOUOCE/GOUCE-app/issues/260) (faculdades) |

---

### Pré-condição

Administrador logado.

### Passos para reproduzir

1. Tornar um aluno representante e confirmar.
2. Revogar um representante e confirmar.

### ✅ Resultado esperado

- A confirmação segue o padrão de pop-up de sucesso do app.

### ❌ Resultado obtido

- Pelo código, o sucesso é uma barra preta (toast) no rodapé: “Representante atribuído com sucesso” (`cadastrar.tsx`) e “Representante revogado” (`index.tsx`), que some rápido.

### ⚠️ Impacto

- O administrador pode não ver a confirmação, e a mensagem destoa das demais telas de gestão.

### Causa aparente

- `representantes/cadastrar.tsx` e `index.tsx` usam `Snackbar` para o sucesso.

### Sugestão

- Usar o pop-up de sucesso do app, como nas telas de administradores.

### Critérios de aceite

- Atribuição e revogação mostram o pop-up de sucesso padrão.
- Reexecutar `CT-HU030-UI-007`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-27, ambiente local.
