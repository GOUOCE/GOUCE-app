# Cadastro e edição de faculdade não geram registro de auditoria

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / auditoria |
| **Severidade** | 🟡 Média |
| **Ambiente** | Branch `feature/testes-api-hu-008` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#219](https://github.com/GOUOCE/GOUCE-app/issues/219) |
| **Caso relacionado** | `CT-HU008-API-009` |
| **Documentação** | [HU-008 — Testes manuais de API](../API-HU-008.md#ct-hu008-api-009--auditoria-das-operações-de-escrita) |

---

### Pré-condição

Token de administrador. Cadastros de UFC, IFCE, UNILAB, UFC/Fortaleza e Uniateneu; duas edições da IFCE.

### Passos para reproduzir

1. Cadastrar e editar faculdades.
2. Consultar `log_auditoria` por `entidade = 'faculdade'`.

### ✅ Resultado esperado

Um registro para **cada** operação de escrita (cadastro, edição, inativação e reativação), com `usuario_id`, ação e data/hora (AC-10, RNF-013).

### ❌ Resultado obtido

Só inativar e ativar geram registro. Nenhum cadastro ou edição aparece:

```json
log_auditoria (entidade = faculdade): só INATIVAR/ATIVAR da faculdade 6; 0 registros de cadastro e 0 de edição
```

### ⚠️ Impacto

- Sem rastro de quem cadastrou ou alterou faculdades, contra o RNF-013.
- As tentativas recusadas corretamente não geram registro.

### Causa aparente

`backend/src/modulos/crud_basicos/`: só os serviços de inativar e ativar chamam o registro de auditoria.

### Critérios de aceite

- Cadastro e edição gravam `log_auditoria` com usuário, ação e data/hora.
- Reexecutar `CT-HU008-API-009`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
