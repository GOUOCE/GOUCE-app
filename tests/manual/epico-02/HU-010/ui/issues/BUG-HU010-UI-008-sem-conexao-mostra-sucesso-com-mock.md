# Sem resposta da API, a gestão de motoristas mostra sucesso e dados de exemplo em vez de erro

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🔴 Alta (bloqueante) |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-010` a partir da `develop` (`4b1706ee`), com o `motoristaService.ts` do PR #243 aplicado |
| **Issue** | [#293](https://github.com/GOUOCE/GOUCE-app/issues/293) |
| **Caso relacionado** | `CT-HU010-UI-012`, `CT-HU010-UI-013` |
| **Documentação** | [HU-010 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-010/tests/manual/epico-02/HU-010/ui/UI-HU-010.md#ct-hu010-ui-012--falha-de-conexão-sem-exemplos-nem-sucesso-falso) |
| **Issue relacionada** | [#283](https://github.com/GOUOCE/GOUCE-app/issues/283) (frota), [#263](https://github.com/GOUOCE/GOUCE-app/issues/263) (faculdades) e [#249](https://github.com/GOUOCE/GOUCE-app/issues/249) (bairros) |

---

### Pré-condição

Administrador logado.

### Passos para reproduzir

1. Deixar a API inacessível para o app e cadastrar, editar, inativar e reativar um motorista.
2. Abrir a lista de motoristas.

### ✅ Resultado esperado

- Mensagem de erro de conexão em português, sem informar sucesso de escrita sem confirmação da API e sem tratar exemplos como motoristas reais; formulários preservados.

### ❌ Resultado obtido

- Obtido pela leitura do código (o caso não foi executado com a API fora do ar, a pedido do testador): a lista cai em `MOTORISTAS_MOCK`; o cadastro faz `MOTORISTAS_MOCK.unshift(...)` e devolve sucesso; a edição, a inativação e a reativação alteram o item de exemplo de mesmo `id` e retornam sem erro.
- Como os ids 1 a 3 do exemplo coincidem com os primeiros motoristas reais, essas ações dão sucesso falso para eles.

### ⚠️ Impacto

- O administrador acredita que o motorista foi cadastrado, alterado ou inativado sem que isso tenha sido gravado.

### Causa aparente

- `motoristaService.criarMotorista`, `atualizarMotorista`, `inativarMotorista`, `reativarMotorista` e `listarMotoristas` tratam “sem resposta” (`!error.response`) ou falha como API fora do ar e usam `MOTORISTAS_MOCK`.

### Sugestão

- Remover os fallbacks para `MOTORISTAS_MOCK` no fluxo real: a falha vira mensagem de erro em português e o formulário continua preenchido.

### Critérios de aceite

- Sem resposta da API, cadastro, edição e mudança de status mostram erro e não alteram a lista.
- A lista não mostra exemplos como se fossem motoristas reais.
- Reexecutar `CT-HU010-UI-012`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-27, ambiente local.
