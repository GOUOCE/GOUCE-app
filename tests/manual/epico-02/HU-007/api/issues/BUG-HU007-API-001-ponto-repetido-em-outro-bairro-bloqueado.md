# Ponto de parada com o mesmo nome em outro bairro é bloqueado

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / regra de negócio |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `feature/testes-api-hu-007` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#210](https://github.com/GOUOCE/GOUCE-app/issues/210) |
| **Caso relacionado** | `CT-HU007-API-003` |
| **Documentação** | [HU-007 — Testes manuais de API](../API-HU-007.md#ct-hu007-api-003--mesmo-nome-de-ponto-em-outro-bairro) |

---

### Pré-condição

Token de administrador. Bairro **Centro** já cadastrado com o ponto `Posto de Saúde`.

### Passos para reproduzir

1. `POST /bairros` com `{"nome": "Planalto Universitário", "pontos_de_parada": ["Posto de Saúde"]}`.
2. Conferir a resposta e `GET /bairros`.

### ✅ Resultado esperado

HTTP `201` “Operação realizada com sucesso”. O nome do ponto só precisa ser único **dentro do mesmo bairro**; o mesmo nome pode existir em bairros diferentes (AC-02 da HU-007).

### ❌ Resultado obtido

HTTP `409`, e nenhum bairro é criado:

```json
{
  "success": false,
  "message": "Esta localidade já está cadastrada.",
  "error": {"code": "CONFLICT", "message": "Esta localidade já está cadastrada."}
}
```

### ⚠️ Impacto

- Não é possível cadastrar dois bairros com pontos de mesmo nome (ex.: “Praça Central”, “Escola Municipal”), o que é comum.
- A mesma regra também bloqueia a edição de um bairro (CT-006) quando o ponto já existe em outro.

### Causa aparente

`backend/src/modulos/crud_basicos/`: `ponto_existe_no_sistema` verifica o nome do ponto no sistema inteiro, e não só no bairro.

### Critérios de aceite

- Cadastro e edição aceitam o mesmo nome de ponto em bairros diferentes.
- Continua bloqueado o ponto repetido no **mesmo** bairro (CT-004).
- Reexecutar `CT-HU007-API-003` e `CT-HU007-API-006`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
