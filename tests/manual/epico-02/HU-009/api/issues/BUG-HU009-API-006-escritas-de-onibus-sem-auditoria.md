# Cadastro, edição e PATCH de status de ônibus não registram auditoria

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / auditoria |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `feature/testes-api-hu-009` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#230](https://github.com/GOUOCE/GOUCE-app/issues/230) |
| **Caso relacionado** | `CT-HU009-API-010 e CT-HU009-API-011` |
| **Documentação** | [HU-009 — Testes manuais de API](../API-HU-009.md#ct-hu009-api-010--auditar-todas-as-escritas) |

---

### Pré-condição

Token de administrador. Registros prévios em `log_auditoria` (entidade `onibus`): 1.

### Passos para reproduzir

1. `POST /onibus` `AUD1A11`; `PATCH` com `assentos=40`; `PATCH` com `placa=AUD1A12`; `PATCH .../inativar`; `PATCH .../ativar`.
2. `PATCH /onibus/AUD1A12` com `ativo=false` e depois `ativo=true`.
3. Consultar `log_auditoria` com `entidade = 'onibus'`.

### ✅ Resultado esperado

Um registro para cada escrita efetiva (cadastro, edição, troca de placa, inativação, reativação) com usuário, ação e data/hora (AC-12, RNF-013). A mudança de status pelo `PATCH` com `ativo` também deve seguir as regras e a auditoria das rotas próprias.

### ❌ Resultado obtido

Só inativar e ativar geram registro; cadastro, edições e as duas mudanças de status por `PATCH ativo` não geraram nada:

```
log_auditoria (onibus): 1 INATIVAR XYZ9K87 | 2 INATIVAR AUD1A12 | 3 ATIVAR AUD1A12
PATCH ativo=false -> 200 (GET: ativo false)  | PATCH ativo=true -> 200 (GET: ativo true)
registros depois dos PATCH com ativo: 3 (nenhum novo)
```

### ⚠️ Impacto

- Sem rastro de quem cadastrou, editou ou trocou a placa de um ônibus, contra o RNF-013.
- O `PATCH` com `ativo` contorna a auditoria e o futuro bloqueio por alocação.

### Causa aparente

`backend/src/modulos/crud_basicos/`: só os serviços de inativar e ativar gravam o log; o `PATCH` aceita `ativo`.

### Critérios de aceite

- Cadastro e edição gravam `log_auditoria`; o `PATCH` com `ativo` é recusado ou passa pelas mesmas regras e auditoria.
- Reexecutar `CT-HU009-API-010` e `CT-HU009-API-011`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
