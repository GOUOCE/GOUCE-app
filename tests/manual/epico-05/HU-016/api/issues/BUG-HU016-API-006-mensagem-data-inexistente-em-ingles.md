# Data inexistente na prévia responde com mensagem técnica em inglês

| Campo | Valor |
| --- | --- |
| **Tipo** | Bug de validação (mensagem) |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Branch `test/execucao-api-hu-016` — Docker isolado `atu-api016`, `http://localhost:8116`, `develop` `7372b8d6` |
| **Caso relacionado** | `CT-HU016-API-002` |
| **Documentação** | [HU-016 — Testes manuais de API](../API-HU-016.md#ct-hu016-api-002--dia-sem-demanda-sem-motoristas-e-data-inválida) |

---

### Pré-condição

Administrador autenticado.

### Passos para reproduzir

1. `GET /alocacao-diaria/distribuicao-automatica?data=2026-02-30`.

### ✅ Resultado esperado

422 `DISTRIBUICAO_INVALIDA` com mensagem em português para o usuário (por exemplo, “Data inválida.”).

### ❌ Resultado obtido

422 `DISTRIBUICAO_INVALIDA` com a mensagem “day is out of range for month”, texto da exceção do Python em inglês.

```json
{
  "success": false,
  "error": {"code": "DISTRIBUICAO_INVALIDA", "message": "day is out of range for month"}
}
```

### ⚠️ Impacto

- Quem chama a API ou a tela pode exibir texto técnico e em inglês.

### Causa aparente

A rota repassa `str(ValueError)` do `date.fromisoformat`.

### Critérios de aceite

- Mensagem em português e amigável.
- Reexecutar `CT-HU016-API-002`.

### 📎 Evidência

Reproduzido pela LLM em 17/11/2026, ambiente `atu-api016` (`develop` `7372b8d6`), com conferência no banco. [Resumo JSON](../EVIDENCIAS-HU-016.json). Sem tokens nem senhas.
