# API da frota aceita placas fora dos formatos Mercosul e antigo

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `feature/testes-api-hu-009` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#227](https://github.com/GOUOCE/GOUCE-app/issues/227) |
| **Caso relacionado** | `CT-HU009-API-006` |
| **Documentação** | [HU-009 — Testes manuais de API](../API-HU-009.md#ct-hu009-api-006--rejeitar-formato-inválido-de-placa) |

---

### Pré-condição

Token de administrador.

### Passos para reproduzir

1. `POST /onibus` com `assentos=44`, `capacidade_em_pe=20` e, uma por vez, `ABCDEFG`, `1234567`, `AB1234`, `ABC12345`, `A1C1D23`, `ABC@1D2` e `GHI@3J45`.
2. `PATCH /onibus/EDT1A11` com `placa=GHI@3J45X`.

### ✅ Resultado esperado

HTTP `422` “Placa inválida.” para qualquer formato que não seja Mercosul (`ABC1D23`) ou antigo (`ABC1234`) (AC-09). Nenhuma criação nem alteração.

### ❌ Resultado obtido

Todas foram aceitas:

```
POST ABCDEFG, 1234567, AB1234, ABC12345, A1C1D23, ABC@1D2, GHI@3J45 -> 201 em todas
PATCH /onibus/EDT1A11 placa=GHI@3J45X -> 200
Banco: 1234567, A1C1D23, AB1234, ABC12345, ABC@1D2, ABCDEFG, GHI@3J45 ...
```

### ⚠️ Impacto

- Placas sem sentido entram na frota e podem ser escaladas em rotas.

### Causa aparente

`backend/src/modulos/crud_basicos/`: a placa não passa por nenhuma validação de formato.

### Critérios de aceite

- Placa fora do padrão devolve `422` “Placa inválida.” no cadastro e na edição.
- Reexecutar `CT-HU009-API-006`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
