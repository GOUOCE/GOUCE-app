# Número acima do limite do banco causa erro 500 sem CORS na criação e na edição de ônibus

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-009` a partir da `develop` (`1edaf2aa`) |
| **Issue** | [#282](https://github.com/GOUOCE/GOUCE-app/issues/282) |
| **Caso relacionado** | `CT-HU009-UI-007` |
| **Documentação** | [HU-009 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-009/tests/manual/epico-02/HU-009/ui/UI-HU-009.md#ct-hu009-ui-007--validar-fronteiras-e-inteiros-das-capacidades) |
| **Issue relacionada** | [#229](https://github.com/GOUOCE/GOUCE-app/issues/229) (mensagem genérica na API); relacionada ao item de sucesso falso (sem conexão) |

---

### Pré-condição

Administrador logado.

### Passos para reproduzir

1. Em **+ Novo**, preencher uma placa válida, 10 assentos e `883833333333` em pé; confirmar.
2. Ou chamar `POST /onibus` e `PATCH /onibus/{placa}` com `capacidade_em_pe=883833333333` ou `assentos=883833333333`.

### ✅ Resultado esperado

- A API recusa o valor com `422` e uma mensagem clara. O requisito não define limite máximo; o erro de estouro precisa ser tratado.

### ❌ Resultado obtido

- A API responde `500 Internal Server Error` com o corpo “Internal Server Error”.
- O log mostra `psycopg2.errors.NumericValueOutOfRange: integer out of range`: as colunas são `integer` e a API não valida o valor antes de gravar.
- A resposta 500 sai sem os cabeçalhos CORS, então o navegador entrega “Network Error” ao app. Com `333333333333333333333353` a API responde `422` normalmente.

### ⚠️ Impacto

- Entrada inválida derruba a requisição com erro interno e, no navegador, é confundida com falta de conexão (ver item de sucesso falso).

### Causa aparente

- `onibus_routes.py` valida só `ge=0` para a capacidade em pé e o serviço não limita o intervalo do `integer` do banco. O erro não tratado sai sem os cabeçalhos CORS (verificado com `curl`: o `422` volta com `access-control-allow-origin` e o `500` não).

### Sugestão

- Validar o intervalo suportado pelo `integer` (ou tratar `DataError`) e devolver `422` com mensagem clara.
- Garantir que respostas de erro interno também enviem os cabeçalhos CORS.

### Critérios de aceite

- Valores acima do limite do banco retornam `422` com mensagem em português, na criação e na edição.
- Reexecutar `CT-HU009-UI-007`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
