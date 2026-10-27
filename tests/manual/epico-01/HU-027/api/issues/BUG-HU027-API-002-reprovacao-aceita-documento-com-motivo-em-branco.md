# Reprovação com motivo do documento em branco deixa o aluno rejeitado sem nada para reenviar

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / validação |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `feature/testes-api-hu-027-hu-031` — Docker local isolado, `http://localhost:8001`, commit `4bf26d55` |
| **Caso relacionado** | `CT-HU027-API-006` (item 3c) e `CT-HU027-API-008` |
| **Documentação** | [HU-027 — Testes manuais de API](../API-HU-027.md#ct-hu027-api-008--reprovação-deixa-o-aluno-conseguir-corrigir) |

---

### Pré-condição

Token de administrador; aluno A3 (id 4) `pendente`.

### Passos para reproduzir

1. `PATCH /usuarios/alunos/4/status` com:
   `{"status_cadastro": "rejeitado", "motivo_reprovacao": "Cadastro com dados inconsistentes.", "documentos_reenvio": [{"tipo": "comprovante_matricula", "motivo": "   "}]}`
2. Logar com o A3 e enviar `GET /usuarios/reenvio_documento`.
3. Tentar reenviar qualquer documento em `PUT /usuarios/reenvio_documento`.

### ✅ Resultado esperado

O motivo do documento só com espaços conta como vazio: a reprovação é recusada (HTTP `422`) com mensagem no campo, como já acontece quando falta `documentos_reenvio` (HU-027, AC-06; RN-012: o aluno precisa conseguir corrigir e reenviar).

### ❌ Resultado obtido

A reprovação é aceita e o documento é descartado sem aviso:

```json
{"aluno_id": 4, "status_cadastro": "rejeitado", "motivo_reprovacao": "Cadastro com dados inconsistentes.", "documentos_reenvio": null, "mensagem": "Documentos rejeitados e marcados para reenvio."}
```

O aluno fica preso:

```json
GET /usuarios/reenvio_documento -> 200 {"documentos": []}
PUT /usuarios/reenvio_documento (comprovante_matricula) -> 400 {"success": false, "error": {"code": "VALIDATION_ERROR", "message": "Este documento não foi solicitado pelo administrador: comprovante_matricula"}}
```

(o mesmo `400` para `comprovante_residencia` e `foto_perfil`).

### ⚠️ Impacto

- O aluno fica rejeitado para sempre: não tem documento para reenviar e não volta à fila.
- O administrador recebe sucesso e não percebe que o documento foi perdido.

### Causa aparente

O validador de `AtualizarStatusAlunoDTO` (`usuario_dto.py:182`) confere só se a lista não está vazia. O `motivo` do documento tem `min_length=1`, que aceita `"   "`. Depois, `normalizar_documentos_reenvio` (`usuario_repository.py:62`) apaga em silêncio os itens com motivo vazio depois do `strip`, e a lista vira `null`.

### Critérios de aceite

- Motivo de documento vazio ou só com espaços é recusado com `422` no campo `documentos_reenvio[i].motivo`.
- Não é possível gravar um aluno `rejeitado` sem nenhum documento para reenviar.
- Reexecutar `CT-HU027-API-006` e `CT-HU027-API-008`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-27, ambiente Docker local isolado. JSON: [`CT-HU027-API-006.json`](../evidencias/CT-HU027-API-006.json) (passo 3c) e [`CT-HU027-API-008.json`](../evidencias/CT-HU027-API-008.json).
