# Cadastro e edição de bairro não geram registro de auditoria

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / auditoria |
| **Severidade** | 🟡 Média |
| **Ambiente** | Branch `feature/testes-api-hu-007` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#212](https://github.com/GOUOCE/GOUCE-app/issues/212) |
| **Caso relacionado** | `CT-HU007-API-009` |
| **Documentação** | [HU-007 — Testes manuais de API](../API-HU-007.md#ct-hu007-api-009--auditoria-das-operações-de-escrita) |

---

### Pré-condição

Token de administrador. Operações feitas: cadastro de Campo Velho, Centro e Alto São Francisco; edição de Campo Velho II; inativação e reativação do Campo Velho II.

### Passos para reproduzir

1. Executar cadastro, edição, inativação e reativação de um bairro.
2. Consultar `log_auditoria` por `entidade = 'bairro'`.

### ✅ Resultado esperado

Um registro para **cada** operação de escrita (cadastro, edição, inativação e reativação), com `usuario_id`, ação e data/hora (AC-10, RNF-013).

### ❌ Resultado obtido

Só a inativação e a reativação geram registro. Cadastros e edições não geram nada:

```json
 id | usuario_id |   acao   | entidade | entidade_id
  1 |          1 | INATIVAR | bairro   | 3
  2 |          1 | INATIVAR | bairro   | 1
  3 |          1 | ATIVAR   | bairro   | 1
```

### ⚠️ Impacto

- Sem rastro de quem cadastrou ou alterou bairros, contra o RNF-013.
- As tentativas recusadas (409/422) corretamente não geram registro.

### Causa aparente

`backend/src/modulos/crud_basicos/`: só os serviços de inativar e ativar chamam o registro de auditoria.

### Critérios de aceite

- Cadastro e edição gravam `log_auditoria` com usuário, ação e data/hora.
- Reexecutar `CT-HU007-API-009`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
