# A distribuição coloca aluno em pé enquanto outro ônibus tem assento livre

| Campo | Valor |
| --- | --- |
| **Tipo** | Bug funcional / divergência de requisito (RN-007, decisão do PO na #465) |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `test/execucao-api-hu-016` — Docker isolado `atu-api016`, `http://localhost:8116`, `develop` `7372b8d6` |
| **Caso relacionado** | `CT-HU016-API-004` |
| **Documentação** | [HU-016 — Testes manuais de API](../API-HU-016.md#ct-hu016-api-004--outro-ônibus-com-assento-livre-antes-de-aluno-em-pé) |

---

### Pré-condição

Administrador autenticado; ônibus V1 `ABC1D23` (3 assentos e 2 em pé) e V3 `HIJ7K89` (4 assentos e 0 em pé) ativos, com dois motoristas ativos (os demais ônibus e motoristas inativos); 5 reservas ativas de P1 na ida na data.

### Passos para reproduzir

1. `GET /alocacao-diaria/distribuicao-automatica?data=2026-11-20` com 5 alunos de P1 na ida.
2. Somar `sentados` e `em_pe` de cada ônibus.
3. Repetir com 8 alunos.

### ✅ Resultado esperado

Com 5 alunos, ninguém em pé: os 5 ficam sentados entre os dois ônibus. Com 8 alunos (7 assentos), 7 sentados e 1 em pé. Só vai em pé quem não cabe nos assentos de nenhum ônibus.

### ❌ Resultado obtido

5 alunos: apenas V1 é usado, com 3 sentados e 2 em pé, e V3 (4 assentos livres) fica sem uso. 8 alunos: V1 com 3 sentados e 2 em pé e V3 com 3 sentados, sobrando 1 assento enquanto 2 alunos vão em pé. Com 10 alunos e com só V1 o resultado está correto.

```json
{
  "alocacoes": [
    {"onibus_id": "ABC1D23", "sentados": 3, "em_pe": 2, "alunos": 5}
  ],
  "excedentes_globais": []
}
```

### ⚠️ Impacto

- Alunos viajam em pé sem necessidade, contra a regra de prioridade do assento.
- Não ultrapassa a capacidade: o problema é de distribuição, não de segurança.

### Causa aparente

`distribuicao.py` enche assentos e vagas em pé do ônibus de maior capacidade total antes de passar ao seguinte.

### Critérios de aceite

- Com mais de um ônibus, só há aluno em pé quando todos os assentos de todos os ônibus estão ocupados.
- Reexecutar `CT-HU016-API-004`.

### 📎 Evidência

Reproduzido pela LLM em 17/11/2026, ambiente `atu-api016` (`develop` `7372b8d6`), com conferência no banco. [Resumo JSON](../EVIDENCIAS-HU-016.json). Sem tokens nem senhas.
