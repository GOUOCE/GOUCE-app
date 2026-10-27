# Telefone do motorista aceita 12 e 15 dígitos e letras, a edição sobrescreve com valor inválido e a mensagem de erro não orienta

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-010` a partir da `develop` (`4b1706ee`), com o `motoristaService.ts` do PR #243 aplicado |
| **Issue** | A definir |
| **Caso relacionado** | `CT-HU010-UI-006` |
| **Documentação** | [HU-010 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-010/tests/manual/epico-02/HU-010/ui/UI-HU-010.md#ct-hu010-ui-006--máscara-e-validação-de-telefone-por-dígitos) |
| **Issue relacionada** | [#231](https://github.com/GOUOCE/GOUCE-app/issues/231) (API aceita telefone curto, longo e com letras), [#234](https://github.com/GOUOCE/GOUCE-app/issues/234) (mensagem genérica na API) e AC-10 da HU-010 |

---

### Pré-condição

Administrador logado.

### Passos para reproduzir

1. Em **+ Novo**, cadastrar telefones `889981122334` (12 dígitos), `889981122334455` (15 dígitos) e `aaaaaaaaaw33333`.
2. Tentar o telefone `abcdefghijk`.
3. Editar o Francisco Alves e trocar o telefone por `88998112233422`.

### ✅ Resultado esperado

- O campo só aceita números, aplica a máscara de telefone (DDD + 8 ou 9 dígitos) e bloqueia o resto com “Informe um telefone válido com DDD” (AC-10).
- A edição inválida não grava.

### ❌ Resultado obtido

- Os três primeiros telefones foram gravados (motoristas de id 7, 8 e 9, `POST` com `201`).
- `abcdefghijk` passou pelo app e a API respondeu `422` com “Telefone deve conter ao menos um dígito.”, mensagem que não orienta e difere do requisito; o testador relatou também o texto vermelho distorcido abaixo do campo.
- A edição gravou `88998112233422` no Francisco e perdeu o `(88) 99811-2233` (`PATCH /motoristas/1` com `200`).
- Cadastros pela tela ficam com máscara (`(88) 99811-2233`) e cadastros feitos pela API ficam sem máscara (`88998223344`), e a API devolve os dois formatos na listagem.

### ⚠️ Impacto

- Telefones inválidos entram na base e sobrescrevem dados corretos; a base mistura formatos.

### Causa aparente

- `formatarTelefone` só formata entradas de exatamente 10 ou 11 dígitos e devolve o texto original nas demais; o campo não filtra caracteres.
- `motoristaSchema.ts` valida `min(10)` e `max(20)` em caracteres, não em dígitos; a API só exige ao menos um dígito (#231).

### Sugestão

- Aplicar a máscara e o limitador como no cadastro de aluno: aceitar só dígitos, no máximo 11, com `(DD) 9XXXX-XXXX` para celular e `(DD) XXXX-XXXX` para fixo.
- Validar o telefone pela quantidade de dígitos (10 ou 11, com DDD de 2 dígitos) no app e na API, e usar a mensagem “Informe um telefone válido com DDD”.
- Gravar e exibir sempre no mesmo formato.

### Critérios de aceite

- O campo não aceita letras, símbolos nem mais de 11 dígitos, e aplica a máscara ao digitar.
- Telefones com menos de 10 ou mais de 11 dígitos são recusados com a mensagem do requisito, no cadastro e na edição.
- Reexecutar `CT-HU010-UI-006`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-27, ambiente local.
