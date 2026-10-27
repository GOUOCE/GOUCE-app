# Decimais passam pela validação do app e o erro da API sai sem o nome do campo, repetido quando os dois campos são inválidos

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação / UX |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-009` a partir da `develop` (`1edaf2aa`) |
| **Issue** | [#281](https://github.com/GOUOCE/GOUCE-app/issues/281) |
| **Caso relacionado** | `CT-HU009-UI-007` |
| **Documentação** | [HU-009 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-009/tests/manual/epico-02/HU-009/ui/UI-HU-009.md#ct-hu009-ui-007--validar-fronteiras-e-inteiros-das-capacidades) |
| **Issue relacionada** | AC-10 da HU-009; [#229](https://github.com/GOUOCE/GOUCE-app/issues/229) (mensagem genérica na API) |

---

### Pré-condição

Administrador logado.

### Passos para reproduzir

1. Em **+ Novo**, preencher placa válida, `4.5` em assentos e `10` em pé; finalizar e confirmar.
2. Repetir com `10` em assentos e `2.5` em pé.
3. Repetir com `4.5` e `2.5` ao mesmo tempo.

### ✅ Resultado esperado

- O campo com decimal é destacado como inválido no próprio formulário, sem arredondar nem cortar (AC-10).
- Quando a API recusar, a mensagem diz qual campo está errado.

### ❌ Resultado obtido

- O app aceita o decimal, abre a confirmação e envia; a API responde `422`.
- O pop-up mostra apenas “Informe um número válido.”, sem dizer qual campo; com os dois campos inválidos a mesma frase aparece duas vezes.

### ⚠️ Impacto

- O administrador não sabe qual campo corrigir. A validação do requisito depende da API.

### Causa aparente

- `frotaSchema.ts` usa `z.coerce.number()` sem `.int()`.
- `utils/errorUtils.ts` monta a mensagem de `error.details` só com `d.message` e descarta o campo (`d.field`).

### Sugestão

- Exigir número inteiro no schema da tela (`.int()`), com mensagens específicas para assentos e capacidade em pé.
- Incluir o nome do campo, em português, na mensagem de erro vinda da API e evitar frases repetidas.

### Critérios de aceite

- `4.5` e `2.5` são destacados no formulário, sem enviar à API.
- O erro da API informa qual campo está inválido, uma vez por campo.
- Reexecutar `CT-HU009-UI-007`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
