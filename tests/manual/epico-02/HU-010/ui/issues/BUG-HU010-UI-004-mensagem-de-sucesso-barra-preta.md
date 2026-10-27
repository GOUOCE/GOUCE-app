# Mensagens de sucesso dos motoristas aparecem em barra preta no rodapé, fora do padrão de pop-up do app

| Campo | Valor |
|---|---|
| **Tipo** | Bug de UX / requisito |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-010` a partir da `develop` (`4b1706ee`), com o `motoristaService.ts` do PR #243 aplicado |
| **Issue** | [#289](https://github.com/GOUOCE/GOUCE-app/issues/289) |
| **Caso relacionado** | `CT-HU010-UI-002`, `CT-HU010-UI-007`, `CT-HU010-UI-009`, `CT-HU010-UI-010` |
| **Documentação** | [HU-010 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-010/tests/manual/epico-02/HU-010/ui/UI-HU-010.md#ct-hu010-ui-002--cadastrar-celular-e-conferir-persistência) |
| **Issue relacionada** | [#278](https://github.com/GOUOCE/GOUCE-app/issues/278) (frota), [#260](https://github.com/GOUOCE/GOUCE-app/issues/260) (faculdades) e AC-07 da HU-010 |

---

### Pré-condição

Administrador logado.

### Passos para reproduzir

1. Cadastrar um motorista e observar a confirmação.
2. Editar, inativar e reativar um motorista.

### ✅ Resultado esperado

- A confirmação segue o padrão de pop-up de sucesso do app e é exibida no topo da tela, como pede o fluxo da HU-010 (passo 16); os textos de exemplo do requisito são “Motorista alterado com sucesso” (AC-07).

### ❌ Resultado obtido

- O sucesso aparece como barra preta (toast) no rodapé, que some rápido; o testador não conseguiu ler a mensagem.
- Os textos são “Motorista cadastrado com sucesso”, “Motorista alterado com sucesso”, “Motorista inativado” e “Motorista reativado”.

### ⚠️ Impacto

- O administrador pode não ver a confirmação, e a mensagem não segue o padrão das demais telas de gestão.

### Causa aparente

- `motoristas/cadastrar.tsx`, `editar.tsx` e `index.tsx` usam `Snackbar` para o sucesso.

### Sugestão

- Usar o pop-up de sucesso do app, como nas telas de administradores, mantendo textos coerentes com o AC-07.

### Critérios de aceite

- Cadastro, edição, inativação e reativação mostram o pop-up de sucesso padrão do app.
- Reexecutar `CT-HU010-UI-002`, `CT-HU010-UI-007`, `CT-HU010-UI-009` e `CT-HU010-UI-010`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-27, ambiente local.
