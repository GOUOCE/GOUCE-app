# Frota mostra ônibus de exemplo como reais quando a lista está vazia e barra o cadastro das placas OCR-1234, OCR-5521 e OCR-8890

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🔴 Alta (bloqueante) |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-009` a partir da `develop` (`1edaf2aa`) |
| **Issue** | [#277](https://github.com/GOUOCE/GOUCE-app/issues/277) |
| **Caso relacionado** | `CT-HU009-UI-001`, `CT-HU009-UI-003` |
| **Documentação** | [HU-009 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-009/tests/manual/epico-02/HU-009/ui/UI-HU-009.md#ct-hu009-ui-003--normalizar-placa-e-evitar-duplicidade-contra-exemplos) |
| **Issue relacionada** | [#258](https://github.com/GOUOCE/GOUCE-app/issues/258) (faculdades) e [#249](https://github.com/GOUOCE/GOUCE-app/issues/249) |

---

### Pré-condição

Administrador logado; banco sem ônibus (item 1) e, para o item 2, sem `OCR1234` no banco.

### Passos para reproduzir

1. Com o banco de ônibus vazio, abrir **Cadastros → Frota**.
2. Em **+ Novo**, cadastrar a placa `OCR-1234` com 44 assentos e 0 em pé e confirmar.

### ✅ Resultado esperado

- A lista vazia aparece sem inventar ônibus.
- Uma placa que não existe no banco é cadastrada normalmente (AC-02, AC-10).

### ❌ Resultado obtido

- Com o banco vazio, a lista mostra `OCR-1234`, `OCR-5521` e `OCR-8890` como se fossem ônibus reais.
- O cadastro de `OCR-1234` é barrado com “Este veículo já está registrado.” e o log da API não registra nenhuma chamada `POST /onibus`; o banco não tem a placa.

### ⚠️ Impacto

- O administrador vê dados que não existem e fica impedido de cadastrar três placas válidas.

### Causa aparente

- `frotaService.listarOnibus` usa `listaApi.length > 0 ? listaApi : ONIBUS_MOCK` e também cai no exemplo quando a API falha.
- `criarOnibus` compara a placa com `ONIBUS_MOCK` antes de chamar a API.

### Sugestão

- Remover a lista de exemplo do fluxo real: lista vazia mostra estado vazio, e a duplicidade é decidida só pela API (`409`).

### Critérios de aceite

- Banco vazio mostra lista vazia.
- `OCR-1234`, `OCR-5521` e `OCR-8890` podem ser cadastradas quando não existem no banco.
- Reexecutar `CT-HU009-UI-001` e `CT-HU009-UI-003`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
