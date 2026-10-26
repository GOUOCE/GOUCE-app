# Telefone obrigatório de motorista devolve “Valor inválido.” sem dizer o motivo

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação / mensagens |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Branch `feature/testes-api-hu-010` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#234](https://github.com/GOUOCE/GOUCE-app/issues/234) |
| **Caso relacionado** | `CT-HU010-API-005` |
| **Documentação** | [HU-010 — Testes manuais de API](../API-HU-010.md#ct-hu010-api-005--exigir-nome-e-telefone-no-cadastro-e-impedir-esvaziamento) |

---

### Pré-condição

Token de administrador.

### Passos para reproduzir

1. `POST /motoristas` com `{}` e com `{"nome": "Só Nome"}` (sem telefone).

### ✅ Resultado esperado

HTTP `422` com o campo e o motivo em português, por exemplo “Informe o telefone.” (AC-08, FA-003).

### ❌ Resultado obtido

HTTP `422` com mensagem genérica para o telefone, enquanto o nome tem mensagens específicas:

```
{} -> [{"field": "nome", "message": "Informe o nome completo."}, {"field": "telefone", "message": "Valor inválido."}]
{"nome": "Só Nome"} -> [{"field": "telefone", "message": "Valor inválido."}]
telefone "" -> "O campo deve ter pelo menos 1 caracteres."
```

### ⚠️ Impacto

- O app não consegue dizer ao administrador o que corrigir no telefone; as mensagens do nome e do telefone são inconsistentes.

### Causa aparente

O tradutor genérico de validação troca a mensagem do campo ausente por “Valor inválido.”.

### Critérios de aceite

- Telefone ausente devolve uma mensagem com o motivo em português.
- Reexecutar `CT-HU010-API-005`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
