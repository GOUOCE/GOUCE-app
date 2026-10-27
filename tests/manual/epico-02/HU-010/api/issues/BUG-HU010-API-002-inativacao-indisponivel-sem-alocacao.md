# Não é possível inativar motorista: a API sempre responde 503

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `feature/testes-api-hu-010` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#232](https://github.com/GOUOCE/GOUCE-app/issues/232) |
| **Caso relacionado** | `CT-HU010-API-008` |
| **Documentação** | [HU-010 — Testes manuais de API](../API-HU-010.md#ct-hu010-api-008--inativar-sem-alocação-futura-e-manter-o-registro) |

---

### Pré-condição

Token de administrador. Motorista `João QA` (id 1) ativo e sem alocações futuras.

### Passos para reproduzir

1. `PATCH /motoristas/1/inativar`.
2. `GET /motoristas/1`.
3. `PATCH /motoristas/999999/inativar`.

### ✅ Resultado esperado

HTTP `200` “Operação realizada com sucesso”, `ativo: false`, registro mantido (AC-05, AC-07). Inexistente: `404`.

### ❌ Resultado obtido

HTTP `503` e o motorista continua ativo; o inexistente responde `404`:

```
PATCH /motoristas/1/inativar -> 503 {"error": {"code": "SERVICE_UNAVAILABLE", "message": "A inativação está indisponível até que a verificação de alocações futuras esteja disponível."}}
GET /motoristas/1 -> {"ativo": true}
PATCH /motoristas/999999/inativar -> 404 "Motorista não encontrado."
```

### ⚠️ Impacto

- O administrador nunca consegue inativar um motorista, mesmo sem nenhuma alocação.
- Como não há motorista inativo, a reativação e o filtro de inativos também não podem ser exercitados pela API.

### Causa aparente

O caso de uso de inativação falha por padrão (`AlocacoesFuturasNaoVerificadasError`) enquanto a verificação de alocações (HU-017) não existe.

### Critérios de aceite

- Inativar motorista sem alocações futuras devolve `200` e `ativo: false`.
- A decisão do produto está na issue #207 (ponto 8).
- Reexecutar `CT-HU010-API-008`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
