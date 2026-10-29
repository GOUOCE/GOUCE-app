# Frota guarda a placa com hífen e permite cadastrar o mesmo veículo duas vezes

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / validação |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `feature/testes-api-hu-009` — Docker local isolado, `http://localhost:8001`, commit `5e7301a0` |
| **Issue** | [#225](https://github.com/GOUOCE/GOUCE-app/issues/225) |
| **Caso relacionado** | `CT-HU009-API-003 e CT-HU009-API-004` |
| **Documentação** | [HU-009 — Testes manuais de API](../API-HU-009.md#ct-hu009-api-003--normalizar-placas-válidas) |

---

### Pré-condição

Token de administrador. Ônibus `QXD2E45` ativo e `XYZ9K87` inativo.

### Passos para reproduzir

1. `POST /onibus` (Form) com `placa=DEF-2G34` e com `placa=ABC-1234`; depois `GET /onibus/DEF2G34`.
2. `POST /onibus` com `placa=QXD-2E45` (já existe `QXD2E45`) e com `xyz-9k87` (existe `XYZ9K87` inativo).
3. `PATCH /onibus/QXD2E45` com `placa=ABC-1D23` (já existe `ABC1D23`).

### ✅ Resultado esperado

A placa é guardada em maiúsculas e **sem hífen** (AC-03). `DEF-2G34` vira `DEF2G34`. Duplicidade ignorando hífen, em ativos e inativos, responde `409` “Este veículo já está registrado.” no cadastro e na edição.

### ❌ Resultado obtido

O hífen permanece e a duplicidade não é detectada:

```
POST placa=DEF-2G34   -> 201, placa gravada "DEF-2G34"; GET /onibus/DEF2G34 -> 404
POST placa=QXD-2E45   -> 201 (QXD2E45 já existia)
POST placa=xyz-9k87   -> 201 (XYZ9K87 inativo já existia)
PATCH /onibus/QXD2E45 placa=ABC-1D23 -> 200; ABC1D23 já existia
Banco: ABC-1D23, ABC1D23, QXD-2E45, XYZ-9K87, XYZ9K87 ...
```

### ⚠️ Impacto

- O mesmo veículo pode ser cadastrado várias vezes com e sem hífen.
- A consulta pela forma sem hífen não acha o veículo guardado com hífen.

### Causa aparente

`backend/src/modulos/crud_basicos/`: DTO, service e repository só aplicam `strip().upper()` à placa.

### Critérios de aceite

- A placa é normalizada (sem hífen, maiúsculas) antes de gravar e de comparar.
- Reexecutar `CT-HU009-API-003` e `CT-HU009-API-004`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-25, ambiente Docker local isolado.
