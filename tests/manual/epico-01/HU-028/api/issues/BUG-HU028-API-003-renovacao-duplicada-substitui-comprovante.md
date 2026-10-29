# Nova renovação é aceita enquanto a anterior está em análise e substitui o comprovante

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / regra de negócio |
| **Severidade** | 🟡 Média |
| **Ambiente** | Branch `feature/testes-api-hu-028` — Docker local isolado, `http://localhost:8001`, commit `a0a08b5f` |
| **Caso relacionado** | `CT-HU028-API-007` |
| **Documentação** | [HU-028 — Testes manuais de API](../API-HU-028.md#ct-hu028-api-007--nova-renovação-estando-em-análise) |

---

### Pré-condição

Aluno com status `analise_renovacao` (renovação já enviada e aguardando o administrador).

### Passos para reproduzir

1. Anotar o `id_comprovante_matricula` em `GET /usuarios/me`.
2. `PUT /alunos/renovar-vinculo` de novo, com outro comprovante válido.
3. Conferir o `id_comprovante_matricula` novamente.

### ✅ Resultado esperado

A segunda renovação é bloqueada (ex.: HTTP `409` com mensagem informando que já há uma renovação em análise) e o comprovante em análise não muda.

### ❌ Resultado obtido

HTTP `200`, “Renovação de vínculo enviada para análise”, e o comprovante em análise é trocado pelo novo. O comprovante anterior fica na tabela `arquivos` sem vínculo com o aluno.

```json
{"success": true, "message": "Renovação de vínculo enviada para análise", "aluno_id": 2, "status_cadastro": "analise_renovacao"}
```

### ⚠️ Impacto

- O aluno pode trocar o documento enquanto o administrador o analisa; o administrador pode aprovar um arquivo diferente do que viu.
- Cada reenvio deixa o comprovante anterior sem vínculo no armazenamento (relaciona-se à #85).

### Causa aparente

`renovar_vinculo_use_case.py` não confere o status atual do aluno antes de aceitar a renovação; a rota só barra o status `rejeitado` (`verify_student_standard_access`).

### Critérios de aceite

- Com status `analise_renovacao`, uma nova renovação é recusada com mensagem clara, sem alterar dados nem arquivos.
- Reexecutar `CT-HU028-API-007` e o `CT-HU028-UI-009`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-06, ambiente Docker local isolado.
