# Capacidade em pé vazia (ou só com espaços) é aceita e gravada como 0, no cadastro e na edição

| Campo | Valor |
|---|---|
| **Tipo** | Bug de requisito (decisão de produto) |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-009` a partir da `develop` (`1edaf2aa`) |
| **Issue** | A definir |
| **Caso relacionado** | `CT-HU009-UI-005` |
| **Documentação** | [HU-009 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-009/tests/manual/epico-02/HU-009/ui/UI-HU-009.md#ct-hu009-ui-005--obrigatorios-no-cadastro-e-na-edicao) |
| **Issue relacionada** | [#226](https://github.com/GOUOCE/GOUCE-app/issues/226) (API assume 0 quando o campo não vem) e AC-08/AC-10 da HU-009 |

---

### Pré-condição

Administrador logado.

### Passos para reproduzir

1. Em **+ Novo**, preencher placa e assentos válidos e deixar **Capac. Máxima em Pé** vazio.
2. Finalizar e confirmar.
3. Abrir a edição de um ônibus com capacidade em pé maior que zero, apagar esse campo e salvar.

### ✅ Resultado esperado

- O campo vazio é destacado como obrigatório e o salvamento é bloqueado (AC-08). O `0` só vale quando digitado (AC-10).

### ❌ Resultado obtido

- O app aceita, mostra a confirmação e cria o ônibus com 0 em pé (`HDO0009`, 33 assentos, 0 em pé).
- Na edição, `QXD2E45` passou de 20 para 0 em pé sem aviso; o valor anterior foi perdido.

### ⚠️ Impacto

- Um campo esquecido ou apagado sem querer vira 0 e sobrescreve a capacidade existente, o que afeta a distribuição de alunos em pé.

### Causa aparente

- `frotaSchema.ts` usa `z.coerce.number()` para a capacidade em pé, que converte vazio e espaços em `0`; `0` passa na regra “maior ou igual a zero”.

### Sugestão

- Tratar vazio como ausente (campo obrigatório) antes da conversão numérica.
- Se o time preferir manter vazio como 0, ajustar o AC-08 e o caso de teste. É uma decisão de produto.

### Critérios de aceite

- Campo vazio é destacado e bloqueia o salvamento no cadastro e na edição, ou o requisito é ajustado para o comportamento aprovado.
- Reexecutar `CT-HU009-UI-005`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
