# Mensagens de sucesso das faculdades aparecem em barra preta e com texto fora do padrão do requisito

| Campo | Valor |
|---|---|
| **Tipo** | Bug de UX / requisito |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-008` a partir da `develop` (`a35ceff7`) |
| **Issue** | [#260](https://github.com/GOUOCE/GOUCE-app/issues/260) |
| **Caso relacionado** | `CT-HU008-UI-002`, `CT-HU008-UI-006`, `CT-HU008-UI-007` |
| **Documentação** | [HU-008 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-008/tests/manual/epico-02/HU-008/ui/UI-HU-008.md#ct-hu008-ui-002--cadastrar-faculdade) |
| **Issue relacionada** | AC-07 da HU-008; padrão de pop-up de sucesso das telas de `administradores` |

---

### Pré-condição

Administrador logado.

### Passos para reproduzir

1. Cadastrar uma faculdade e anotar a mensagem de sucesso.
2. Editar uma faculdade e salvar.
3. Inativar e reativar uma faculdade.

### ✅ Resultado esperado

- A confirmação segue o padrão de pop-up de sucesso do app e usa a mensagem do requisito: “Operação realizada com sucesso” (AC-07).

### ❌ Resultado obtido

- O sucesso aparece como uma **barra preta (toast)** na parte de baixo da tela, que some rápido, e não como pop-up.
- Os textos são “Faculdade cadastrada com sucesso”, “Faculdade alterada com sucesso” e “Faculdade <sigla> inativada/reativada”, diferentes do requisito.

### ⚠️ Impacto

- O administrador pode não ver a confirmação; as mensagens não seguem o requisito nem as demais telas de gestão.

### Causa aparente

- `faculdades/cadastrar.tsx`, `editar.tsx` e `index.tsx` usam `Snackbar` para o sucesso.

### Sugestão

- Usar o pop-up de sucesso do app com “Operação realizada com sucesso”, como nas telas de administradores.

### Critérios de aceite

- Cadastro, edição, inativação e reativação mostram o pop-up de sucesso com a mensagem do requisito.
- Reexecutar `CT-HU008-UI-002`, `CT-HU008-UI-006` e `CT-HU008-UI-007`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
