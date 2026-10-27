# Aluno com vínculo vencido pode ser promovido a representante

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / regra de negócio |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `feature/testes-api-hu-030` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#235](https://github.com/GOUOCE/GOUCE-app/issues/235) |
| **Caso relacionado** | `CT-HU030-API-005` |
| **Documentação** | [HU-030 — Testes manuais de API](../API-HU-030.md#ct-hu030-api-005--bloquear-os-quatro-estados-inelegíveis-do-bdd) |

---

### Pré-condição

Token de administrador. Faculdade UFC / Campus Quixadá (id 1) ativa. Aluno `Aluno Vencido Qa` (id 10) com `status_cadastro = ativado`, usuário ativo e `validade_acesso` vencida há 30 dias (preparado no banco local).

### Passos para reproduzir

1. Conferir no banco: `select aluno_id, status_cadastro, validade_acesso::date from aluno where aluno_id = 10` → `10 | ativado | 2026-09-25`.
2. `POST /representantes/promover` com `{"aluno_id": 10, "faculdade_id": 1}`.
3. Conferir `representante` e `log_auditoria`.

### ✅ Resultado esperado

HTTP `422` informando que somente alunos aprovados e ativos podem ser representantes. O BDD da HU-030 lista “Vínculo vencido” entre os estados que bloqueiam a atribuição (AC-03, FA-002). Nenhuma função concedida.

### ❌ Resultado obtido

A função foi concedida:

```
POST /representantes/promover {"aluno_id": 10, "faculdade_id": 1} -> 201 {"success": true, "data": {"id": 10, "nome": "Aluno Vencido Qa", "ativo": true, "faculdade_id": 1}}
select count(*) from representante where administrador_id = 10 -> 1
log_auditoria: PROMOVER (entidade_id 10)

Controles que passaram (422 "Aluno não aprovado ou inativo."): pendente, rejeitado, inativado e ativado com usuario.ativo = false.
```

### ⚠️ Impacto

- Um aluno cujo vínculo com a faculdade expirou continua podendo representar a instituição e receber os acessos de representante.
- Contraria o cenário expresso no BDD.

### Causa aparente

`backend/src/modulos/usuarios/`: a promoção só confere `status_cadastro == ativado` e `usuario.ativo`; não consulta `validade_acesso`.

### Critérios de aceite

- Aluno `ativado` e ativo com `validade_acesso` no passado é recusado na promoção com `422` e sem log.
- Decisão de produto: confirmar se “vínculo vencido” é definido por `validade_acesso` (ver issue #207).
- Reexecutar `CT-HU030-API-005`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
