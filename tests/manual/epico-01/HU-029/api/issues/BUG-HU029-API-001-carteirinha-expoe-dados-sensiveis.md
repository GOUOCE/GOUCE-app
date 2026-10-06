# Rota da carteirinha devolve dados sensíveis que a carteirinha não usa

| Campo | Valor |
|---|---|
| **Tipo** | Segurança / privacidade (LGPD) |
| **Severidade** | 🟡 Média |
| **Ambiente** | Branch `feature/testes-api-hu-029` — Docker local isolado, `http://localhost:8001`, commit `46a79355` |
| **Caso relacionado** | `CT-HU029-API-001` |
| **Documentação** | [HU-029 — Testes manuais de API](../API-HU-029.md#ct-hu029-api-001--carteirinha-do-aluno-aprovado) |

---

### Pré-condição

Aluno aprovado (`ativado`) e token válido.

### Passos para reproduzir

1. `GET /alunos/me/carteirinha` com o token do aluno.
2. Listar os campos da resposta.

### ✅ Resultado esperado

HTTP `200` só com o necessário para a carteirinha (AC-01): nome completo, curso, instituição/campus, identificador da foto e o que for preciso para o QR Code e a validade.

### ❌ Resultado obtido

HTTP `200` com o perfil completo do aluno (`PerfilAlunoResponseDTO`), incluindo dados sensíveis que a carteirinha não exibe:

```json
{
  "data_nascimento": 20030621,
  "identificacao_genero": "Mulher",
  "raca": "Pardo",
  "identificacao_sexual": "Heterossexual",
  "tem_filhos": false,
  "telefone": "85988881111",
  "bairro_id": "Serra",
  "id_comprovante_matricula": "…",
  "id_comprovante_residencia": "…"
}
```

### ⚠️ Impacto

- Raça e orientação sexual são dados pessoais sensíveis (LGPD, art. 5º, II). Enviá-los sem necessidade contraria o princípio da necessidade (art. 6º, III) e o RNF-010.
- A carteirinha é pensada para uso offline (AC-03): se o app guardar essa resposta em cache, os dados sensíveis ficam no aparelho.
- Qualquer log, proxy ou ferramenta de depuração no caminho recebe esses dados a cada abertura da carteirinha.

### Causa aparente

`backend/src/modulos/usuarios/interface/http/aluno_router.py`: a rota `GET /alunos/me/carteirinha` usa `response_model=PerfilAlunoResponseDTO`, o mesmo do perfil completo.

### Critérios de aceite

- A rota usa um DTO próprio da carteirinha, apenas com os campos exibidos.
- Os dados sensíveis continuam disponíveis só onde forem necessários (perfil do próprio aluno e administração).
- Reexecutar `CT-HU029-API-001`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-06, ambiente Docker local isolado. Dados fictícios.
