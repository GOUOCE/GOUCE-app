# Cadastro e edição de motorista não geram registro de auditoria

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / auditoria |
| **Severidade** | 🟡 Média |
| **Ambiente** | Branch `feature/testes-api-hu-010` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#233](https://github.com/GOUOCE/GOUCE-app/issues/233) |
| **Caso relacionado** | `CT-HU010-API-010` |
| **Documentação** | [HU-010 — Testes manuais de API](../API-HU-010.md#ct-hu010-api-010--auditar-todas-as-escritas-efetivas) |

---

### Pré-condição

Token de administrador. `log_auditoria` sem registros de `motorista`.

### Passos para reproduzir

1. `POST /motoristas` (`Aud QA`).
2. `PATCH /motoristas/1` com `{"nome": "João QA Editado"}`.
3. Consultar `log_auditoria` com `entidade = 'motorista'`.

### ✅ Resultado esperado

Um registro para cada escrita efetiva (cadastro, edição, inativação e reativação) com usuário, ação e data/hora (AC-11, RNF-013).

### ❌ Resultado obtido

Nenhum registro foi gravado para o cadastro nem para a edição:

```
POST /motoristas -> 201 (id 7) | PATCH /motoristas/1 -> 200
select ... from log_auditoria where entidade='motorista' -> 0 linhas
```

### ⚠️ Impacto

- Sem rastro de quem cadastrou ou alterou motoristas, contra o RNF-013.
- A auditoria de inativar e reativar não pôde ser conferida: a inativação devolve 503 (ver issue da inativação).

### Causa aparente

O módulo de motoristas só grava auditoria na reativação (ação `REATIVAR`).

### Critérios de aceite

- Cadastro e edição gravam `log_auditoria` com usuário, ação e data/hora.
- Reexecutar `CT-HU010-API-010`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
