# Editar um bairro apaga o ponto de parada removido (sem soft delete)

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / regra de negócio |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `feature/testes-api-hu-007` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#211](https://github.com/GOUOCE/GOUCE-app/issues/211) |
| **Caso relacionado** | `CT-HU007-API-007` |
| **Documentação** | [HU-007 — Testes manuais de API](../API-HU-007.md#ct-hu007-api-007--inativar-um-ponto-de-parada-soft-delete) |

---

### Pré-condição

Token de administrador. Bairro **Centro** com os pontos `Praça José de Barros`, `Mercado Público` (`ponto_id` 3) e `Posto de Saúde`.

### Passos para reproduzir

1. `PATCH /bairros/2` com `{"pontos_de_parada": ["Praça José de Barros", "Posto de Saúde"]}` (sem `Mercado Público`).
2. Consultar `ponto_de_parada` pelo `ponto_id` 3 e `GET /bairros/2` com e sem token.
3. `PATCH /bairros/2` com os três nomes de novo.

### ✅ Resultado esperado

Passo 1: o ponto `Mercado Público` continua no banco com o mesmo id e `ativo: false` (soft delete, AC-04, AC-05, RF-014); não aparece sem token e aparece como inativo para o administrador. Passo 3: HTTP `409` “Esta localidade já está cadastrada.” (AC-03).

### ❌ Resultado obtido

Passo 1: HTTP `200`, mas o registro com `ponto_id` 3 **foi apagado** da tabela. Passo 3: HTTP `200`, criou um **novo** ponto (`ponto_id` 6). Também não existe rota para inativar ou reativar um ponto individual.

```json
GET /bairros/2 depois do passo 3:
{"bairro_id": 2, "nome": "Centro", "pontos_de_parada": [
  {"ponto_id": 2, "nome": "Praça José de Barros", "ativo": true},
  {"ponto_id": 4, "nome": "Posto de Saúde", "ativo": true},
  {"ponto_id": 6, "nome": "Mercado Público", "ativo": true}]}
```

### ⚠️ Impacto

- Perda do histórico do ponto: rotas e alunos que o referenciam ficam sem vínculo (RN-004).
- O administrador não consegue inativar nem reativar um ponto, só removê-lo definitivamente.

### Causa aparente

`backend/src/modulos/crud_basicos/`: a edição substitui a lista inteira de pontos e o relacionamento usa `delete-orphan`.

### Critérios de aceite

- O ponto retirado na edição fica com `ativo: false` e o mesmo id; readicionar o mesmo nome é tratado conforme a decisão do produto (409 ou reativação).
- Existe forma de inativar e reativar um ponto individual.
- Reexecutar `CT-HU007-API-007`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
