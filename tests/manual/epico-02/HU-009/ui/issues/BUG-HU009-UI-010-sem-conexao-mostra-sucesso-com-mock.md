# Sem resposta da API, a gestão de frota mostra sucesso e dados de exemplo em vez de erro

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🔴 Alta (bloqueante) |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-009` a partir da `develop` (`1edaf2aa`) |
| **Issue** | A definir |
| **Caso relacionado** | `CT-HU009-UI-007`, `CT-HU009-UI-012` |
| **Documentação** | [HU-009 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-009/tests/manual/epico-02/HU-009/ui/UI-HU-009.md#ct-hu009-ui-012--falha-de-conexao-sem-sucesso-falso) |
| **Issue relacionada** | [#249](https://github.com/GOUOCE/GOUCE-app/issues/249) (bairros) e [#263](https://github.com/GOUOCE/GOUCE-app/issues/263) (faculdades) |

---

### Pré-condição

Administrador logado.

### Passos para reproduzir

1. Deixar a API inacessível para o app (ou provocar um `500`, como o número `883833333333` em pé) e cadastrar um ônibus.
2. Recarregar a lista e conferir a API e o banco.

### ✅ Resultado esperado

- Mensagem de conexão ou de erro clara, sem informar sucesso de escrita sem confirmação da API, e sem tratar exemplos como dados reais.

### ❌ Resultado obtido

- Foi visto na tela: com `883833333333` em pé a barra preta de sucesso apareceu, mas nada foi gravado no banco e o ônibus não aparece depois de recarregar.
- Por leitura do código (o caso não foi executado com a API fora do ar): a lista cai em `ONIBUS_MOCK` sem aviso; o cadastro devolve sucesso e cria o ônibus só na memória; edição e mudança de status de itens que coincidem com os ids 1 a 3 também devolvem sucesso.

### ⚠️ Impacto

- O administrador acredita que o ônibus foi cadastrado, alterado ou inativado sem que isso tenha sido gravado.

### Causa aparente

- `frotaService.criarOnibus`, `atualizarOnibus`, `inativarOnibus` e `reativarOnibus` tratam “sem resposta” (`!error.response`) como API fora do ar e alteram `ONIBUS_MOCK`, retornando sem erro. `listarOnibus` também usa o exemplo no `catch`.

### Sugestão

- Remover os fallbacks para `ONIBUS_MOCK` no fluxo real: a falha deve virar mensagem de erro em português e manter o formulário preenchido para nova tentativa.

### Critérios de aceite

- Sem resposta da API, cadastro, edição e mudança de status mostram erro e não alteram a lista.
- A lista não mostra exemplos como se fossem ônibus reais.
- Reexecutar `CT-HU009-UI-007` e `CT-HU009-UI-012`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
