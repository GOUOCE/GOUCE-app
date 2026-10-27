# Sem conexão com a API, a gestão de faculdades mostra sucesso e dados de exemplo em vez de erro

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🔴 Alta |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-008` a partir da `develop` (`a35ceff7`) |
| **Issue** | [#263](https://github.com/GOUOCE/GOUCE-app/issues/263) |
| **Caso relacionado** | `CT-HU008-UI-012` |
| **Documentação** | [HU-008 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-008/tests/manual/epico-02/HU-008/ui/UI-HU-008.md#ct-hu008-ui-012--falha-de-conexão-e-dados-de-exemplo) |
| **Issue relacionada** | #249 (mesmo defeito nos bairros) |

---

### Pré-condição

Administrador logado; API parada (por exemplo, `docker stop gouce_backend`).

### Passos para reproduzir

1. Com a API fora do ar, abrir a listagem de faculdades.
2. Cadastrar `Faculdade Offline` / `Campus Teste` e finalizar.
3. Inativar uma faculdade da lista.
4. Religar a API e abrir a listagem de novo.

### ✅ Resultado esperado

- Mensagem clara de falha de conexão, em português, sem travar o app.
- O app não mostra sucesso nem altera a listagem quando a API não gravou, e não exibe faculdades de exemplo que não existem no banco.
- Depois que a API volta, só existe o que foi realmente gravado.

### ❌ Resultado obtido

- A listagem, o cadastro e a inativação **parecem funcionar** offline, com mensagem de sucesso.
- Ao religar a API, a listagem é diferente do que a tela mostrou; no banco não existe `Faculdade Offline`, nenhuma faculdade mudou de status e a auditoria não registrou nada.

### ⚠️ Impacto

- O administrador acredita que cadastrou ou inativou uma faculdade que não foi gravada.
- Dados de exemplo (`UFC`, `IFCE`, `Uniateneu`) aparecem como se fossem reais.

### Causa aparente

- `faculdadeService.ts`: quando a chamada à API falha sem resposta (`!error.response`), cada operação age só em `FACULDADES_MOCK` (lista em memória) e devolve sucesso: `listarFaculdades` devolve a lista de exemplo; `criarFaculdade` insere na lista de exemplo; `atualizarFaculdade`, `inativarFaculdade` e `reativarFaculdade` alteram a lista de exemplo e retornam sem erro.

### Sugestão

- Remover a lista de exemplo e o fallback: sem resposta da API, lançar erro de conexão e mostrar a mensagem (como na gestão de administradores), mantendo os campos preenchidos no cadastro.

### Critérios de aceite

- Sem a API, listar, cadastrar, editar, inativar e reativar mostram erro de conexão e não alteram a listagem.
- Nenhum dado de exemplo é exibido.
- Reexecutar `CT-HU008-UI-012`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
