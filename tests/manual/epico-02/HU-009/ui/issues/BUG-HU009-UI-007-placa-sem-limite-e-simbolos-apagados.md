# Campo da placa não limita os caracteres e apaga símbolos em silêncio: GHI@3J45 é aceita como GHI3J45

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação / melhoria |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-009` a partir da `develop` (`1edaf2aa`) |
| **Issue** | [#280](https://github.com/GOUOCE/GOUCE-app/issues/280) |
| **Caso relacionado** | `CT-HU009-UI-003`, `CT-HU009-UI-006` |
| **Documentação** | [HU-009 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-009/tests/manual/epico-02/HU-009/ui/UI-HU-009.md#ct-hu009-ui-006--rejeitar-formato-invalido-de-placa) |
| **Issue relacionada** | [#261](https://github.com/GOUOCE/GOUCE-app/issues/261) (faculdades), [#225](https://github.com/GOUOCE/GOUCE-app/issues/225) e [#227](https://github.com/GOUOCE/GOUCE-app/issues/227) (API) e AC-09 da HU-009 |

---

### Pré-condição

Administrador logado.

### Passos para reproduzir

1. Em **+ Novo**, digitar a placa `GHI@3J45`, 33 assentos e 9 em pé, e confirmar.
2. Tentar digitar mais de 7 caracteres, emoji e símbolos no campo.

### ✅ Resultado esperado

- A placa em formato inválido é recusada com “Placa inválida.” e o app não altera o que foi digitado para torná-la válida (AC-09).
- O campo limita a 7 caracteres e não aceita emoji nem símbolos.

### ❌ Resultado obtido

- A placa `GHI@3J45` foi aceita e gravada como `GHI3J45`: o `@` foi apagado e a placa inválida virou outra, válida no formato Mercosul.
- O campo só passa o texto para maiúsculas; não limita o tamanho nem bloqueia símbolos ou emoji na digitação.

### ⚠️ Impacto

- Uma placa digitada errada pode ser cadastrada como outra placa, sem aviso, e fica no banco.

### Causa aparente

- `frotaSchema.ts` aplica `.replace(/[^A-Za-z0-9]/g, '')` antes de validar o formato, descartando qualquer símbolo. `frota/cadastrar.tsx` e `editar.tsx` apenas chamam `toUpperCase()` ao digitar.

### Sugestão

- Validar o texto digitado sem apagar símbolos e rejeitar o que não for letra ou número.
- Limitar o campo a 7 caracteres e bloquear emoji e símbolos já na digitação. Se o hífen deve ser aceito, removê-lo apenas como parte da normalização.

### Critérios de aceite

- `GHI@3J45` é recusada com “Placa inválida.”.
- O campo não aceita mais de 7 caracteres, emoji nem símbolos.
- Reexecutar `CT-HU009-UI-003` e `CT-HU009-UI-006`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
