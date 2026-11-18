# Não é possível realocar um excedente para o ônibus de outra rota (a confirmar com o PO)

| Campo | Valor |
| --- | --- |
| **Tipo** | Divergência de requisito (AC-09/AC-10); confirmar com o PO antes de tratar como defeito |
| **Severidade** | 🟡 Média |
| **Ambiente** | Branch `test/execucao-api-hu-016` — Docker isolado `atu-api016`, `http://localhost:8116`, `develop` `7372b8d6` |
| **Issue relacionada** | [#478](https://github.com/GOUOCE/GOUCE-app/issues/478) |
| **Caso relacionado** | `CT-HU016-API-008` |
| **Documentação** | [HU-016 — Testes manuais de API](../API-HU-016.md#ct-hu016-api-008--distribuição-manual-trocar-ônibusmotorista-e-realocar-excedente) |

---

**Decisão do PO:** pendente na [#473](https://github.com/GOUOCE/GOUCE-app/issues/473); seguimos a recomendação (esperado deste relato) como regra provisória.

### Pré-condição

Administrador autenticado; distribuição de 24/11 com P1 em V3 e V1 e P2 em V2 (aluno Hugo); aluno excedente de P1 (agendamento 64).

### Passos para reproduzir

1. `POST /alocacao-diaria/distribuicao` `modo: manual` incluindo, na alocação de P2/V2, o agendamento 64 (aluno de P1).
2. Conferir a resposta e o banco.

### ✅ Resultado esperado

O administrador realoca o excedente para o ônibus de outra rota com vaga (AC-09/AC-10) e o aluno vê o ônibus (HU-019, FA-002); se a regra for outra, ela deve estar nos requisitos.

### ❌ Resultado obtido

422 `DISTRIBUICAO_INVALIDA` “alocação 2: agendamento 64 não pertence à rota 2.”; nada gravado. A mesma troca só funciona colocando o aluno numa alocação da própria rota P1 com o ônibus V2 (201).

```json
{
  "success": false,
  "error": {"code": "DISTRIBUICAO_INVALIDA", "message": "alocação 2: agendamento 64 não pertence à rota 2."}
}
```

### ⚠️ Impacto

- O aviso de realocação da HU-019 (`foi_realocado`) só poderia aparecer por dado direto no banco.
- Se o PO confirmar a regra atual, ajustar o requisito em vez do código.

### Causa aparente

`_validar_payload` exige que a alocação seja da rota da reserva.

### Critérios de aceite

- Resposta do PO registrada e requisito/BDD ou código alinhados.
- Reexecutar `CT-HU016-API-008`.

### 📎 Evidência

Reproduzido pela LLM em 17/11/2026, ambiente `atu-api016` (`develop` `7372b8d6`), com conferência no banco. [Resumo JSON](../EVIDENCIAS-HU-016.json). Sem tokens nem senhas.
