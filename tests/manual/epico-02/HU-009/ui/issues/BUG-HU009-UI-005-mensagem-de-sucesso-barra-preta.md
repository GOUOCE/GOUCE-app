# Mensagens de sucesso da frota aparecem em barra preta e com texto fora do padrão do requisito

| Campo | Valor |
|---|---|
| **Tipo** | Bug de UX / requisito |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-009` a partir da `develop` (`1edaf2aa`) |
| **Issue** | A definir |
| **Caso relacionado** | `CT-HU009-UI-002`, `CT-HU009-UI-008` |
| **Documentação** | [HU-009 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-009/tests/manual/epico-02/HU-009/ui/UI-HU-009.md#ct-hu009-ui-002--cadastrar-e-conferir-persistencia) |
| **Issue relacionada** | [#260](https://github.com/GOUOCE/GOUCE-app/issues/260) (faculdades) e AC-07 da HU-009 |

---

### Pré-condição

Administrador logado.

### Passos para reproduzir

1. Cadastrar um ônibus e anotar a mensagem de sucesso.
2. Editar um ônibus e salvar.
3. Inativar e reativar um ônibus (depois da correção do 404).

### ✅ Resultado esperado

- A confirmação segue o padrão de pop-up de sucesso do app, com a mensagem “Operação realizada com sucesso” (AC-07).

### ❌ Resultado obtido

- O sucesso aparece como barra preta (toast) na parte de baixo, que some rápido.
- Os textos são “Ônibus cadastrado com sucesso”, “Ônibus alterado com sucesso”, “Ônibus inativado” e “Ônibus reativado”.

### ⚠️ Impacto

- O administrador pode não ver a confirmação e as mensagens não seguem o requisito nem as demais telas de gestão.

### Causa aparente

- `frota/cadastrar.tsx`, `editar.tsx` e `index.tsx` usam `Snackbar` para o sucesso.

### Sugestão

- Usar o pop-up de sucesso do app com “Operação realizada com sucesso”, como nas telas de administradores.

### Critérios de aceite

- Cadastro, edição, inativação e reativação mostram o pop-up de sucesso com a mensagem do requisito.
- Reexecutar `CT-HU009-UI-002` e `CT-HU009-UI-008`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
