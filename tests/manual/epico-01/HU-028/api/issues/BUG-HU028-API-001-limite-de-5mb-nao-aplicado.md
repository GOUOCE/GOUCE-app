# Renovação de vínculo aceita comprovante acima de 5 MB

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação |
| **Severidade** | 🟡 Média |
| **Ambiente** | Branch `feature/testes-api-hu-028` — Docker local isolado, `http://localhost:8001`, commit `a0a08b5f` |
| **Caso relacionado** | `CT-HU028-API-003` |
| **Documentação** | [HU-028 — Testes manuais de API](../API-HU-028.md#ct-hu028-api-003--arquivo-inválido) |

---

### Pré-condição

Aluno com cadastro aprovado (`ativado`) e token válido.

### Passos para reproduzir

1. `PUT /alunos/renovar-vinculo` (`multipart/form-data`) com os campos obrigatórios da renovação.
2. Enviar em `comprovante_matricula` um PDF de 8 MB.
3. Conferir o status HTTP e o status do aluno em `GET /usuarios/me`.

### ✅ Resultado esperado

HTTP `422` com “Arquivo excede o limite de tamanho” no campo `comprovante_matricula` (limite de 5 MB, AC-03); status do aluno inalterado.

### ❌ Resultado obtido

HTTP `200`; a renovação é aceita e o aluno passa para `analise_renovacao`.

```json
{"success": true, "message": "Renovação de vínculo enviada para análise", "aluno_id": 3, "status_cadastro": "analise_renovacao"}
```

Com um PDF de 11 MB, a API recusa com “O arquivo excede o tamanho máximo permitido de 10MB”: o limite aplicado é 10 MB.

### ⚠️ Impacto

- Comprovantes entre 5 MB e 10 MB entram na fila do administrador, contrariando o AC-03.
- O cadastro (etapa 4) usa 5 MB e a renovação usa 10 MB: regras diferentes para o mesmo documento.
- Mais espaço de armazenamento e uploads mais lentos no app.

### Causa aparente

`backend/src/modulos/usuarios/application/use_cases/renovar_vinculo_use_case.py` importa `validar_regras_arquivo` de `validar_etapa_1_use_case.py` (limite de 10 MB, pensado para a foto). O validador do comprovante no cadastro está em `validar_etapa_4_use_case.py` (5 MB e a mensagem “Arquivo excede o limite de tamanho”).

### Critérios de aceite

- Comprovante de matrícula acima de 5 MB é recusado na renovação com HTTP `422` e “Arquivo excede o limite de tamanho”.
- Comprovante de até 5 MB continua aceito.
- Reexecutar `CT-HU028-API-003`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-06, ambiente Docker local isolado.
