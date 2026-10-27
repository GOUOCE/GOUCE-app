# Administrador consegue aprovar ou reprovar aluno que não está na fila de solicitações

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / regra de negócio |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `feature/testes-api-hu-027-hu-031` — Docker local isolado, `http://localhost:8001`, commit `4bf26d55` |
| **Caso relacionado** | `CT-HU027-API-007` |
| **Documentação** | [HU-027 — Testes manuais de API](../API-HU-027.md#ct-hu027-api-007--avaliar-quem-não-está-na-fila) |

---

### Pré-condição

Token de administrador; AP (id 6) `ativado`; A2 (id 3) `rejeitado` sem ter reenviado documentos; A1 (id 2) já aprovado.

### Passos para reproduzir

1. `PATCH /usuarios/alunos/6/aprovar` e depois `PATCH /usuarios/alunos/6/status` com `{"status_cadastro": "rejeitado", "motivo_reprovacao": "...", "documentos_reenvio": [{"tipo": "comprovante_matricula", "motivo": "Ilegível."}]}`.
2. `PATCH /usuarios/alunos/3/aprovar`.
3. `PATCH /usuarios/alunos/2/aprovar` de novo.

### ✅ Resultado esperado

A avaliação vale só para solicitações na fila (`pendente`). As demais são recusadas (`409` ou `400`) com mensagem clara, sem alterar status nem validade (HU-027, AC-02, AC-04).

### ❌ Resultado obtido

Todas as chamadas deram HTTP `200`:

```json
PATCH /usuarios/alunos/6/status -> 200 {"aluno_id": 6, "status_cadastro": "rejeitado", ...}
PATCH /usuarios/alunos/3/aprovar -> 200 {"aluno_id": 3, "status_cadastro": "ativado", "mensagem": "Cadastro do aluno aprovado com sucesso!"}
PATCH /usuarios/alunos/2/aprovar -> 200 {"aluno_id": 2, "status_cadastro": "ativado", ...}
```

Banco antes: `6 | ativado`, `3 | rejeitado`, `2 | ativado | validade 17:49:18`. Depois: `6 | rejeitado`, `3 | ativado`, `2 | ativado | validade 17:50:44`.

### ⚠️ Impacto

- Um aluno já ativo pode ser reprovado por engano e perder o acesso.
- Um aluno rejeitado pode ser aprovado sem corrigir os documentos.
- Cada nova aprovação renova a validade do vínculo (RN-013) sem renovação real.

### Causa aparente

`AprovarAlunoUseCase.execute` (`aprovar_aluno_use_case.py:60`) só confere se o aluno existe. Não confere o `status_cadastro` atual antes de trocar.

### Critérios de aceite

- Aprovar ou reprovar exige que o aluno esteja `pendente` (ou `analise_renovacao`, no fluxo da HU-028).
- Fora disso: recusa com mensagem clara e nada alterado.
- Reexecutar `CT-HU027-API-007`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-27, ambiente Docker local isolado. JSON: [`CT-HU027-API-007.json`](../evidencias/CT-HU027-API-007.json).
