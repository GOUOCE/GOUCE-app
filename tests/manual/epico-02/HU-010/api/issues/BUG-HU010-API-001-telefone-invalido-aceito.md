# API de motoristas aceita telefone curto, longo e com letras no cadastro e na edição

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `feature/testes-api-hu-010` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#231](https://github.com/GOUOCE/GOUCE-app/issues/231) |
| **Caso relacionado** | `CT-HU010-API-006` |
| **Documentação** | [HU-010 — Testes manuais de API](../API-HU-010.md#ct-hu010-api-006--validar-quantidade-de-dígitos-e-conteúdo-do-telefone) |

---

### Pré-condição

Token de administrador.

### Passos para reproduzir

1. `POST /motoristas` com `telefone` = `123`, `998112233`, `889981122334`, `889981122334455` e `(88) abcdef` (nome diferente em cada).
2. `PATCH /motoristas/7` com `telefone` = `456`, `(77) zzzzzz` e `12345678901234567`.

### ✅ Resultado esperado

HTTP `422` “Informe um telefone válido com DDD”: só DDD + 8 ou 9 dígitos é válido (AC-10). Nada criado nem alterado.

### ❌ Resultado obtido

Quase tudo foi aceito (só `abcdefghijk`, sem nenhum dígito, foi recusado):

```
POST 123, 998112233, 889981122334, 889981122334455, "(88) abcdef" -> 201 em todos
POST abcdefghijk -> 422 {"field": "telefone", "message": "Valor inválido."}
PATCH telefone=456 / "(77) zzzzzz" / 12345678901234567 -> 200 nas três
GET /motoristas/7 -> {"telefone": "12345678901234567"}
```

### ⚠️ Impacto

- Telefones que não funcionam entram no cadastro, e o contato com o motorista fica impossível.
- A tela já exige 10 caracteres, mas a API aceita lixo que passe da tela.

### Causa aparente

O backend só exige ao menos um dígito no telefone.

### Critérios de aceite

- Telefone fora de DDD + 8/9 dígitos devolve `422` no cadastro e na edição.
- Reexecutar `CT-HU010-API-006`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
