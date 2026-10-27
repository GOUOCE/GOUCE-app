# Sem conexão com a API, a gestão de bairros mostra sucesso e dados de exemplo em vez de erro

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / integridade de dados |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-007` a partir da `develop` (`5445f7b4`) |
| **Issue** | [#249](https://github.com/GOUOCE/GOUCE-app/issues/249) |
| **Caso relacionado** | `CT-HU007-UI-013`, `CT-HU007-UI-009` |
| **Documentação** | [HU-007 — Testes manuais de UI](../UI-HU-007.md#ct-hu007-ui-013--falha-de-conexão-ao-salvar) |

---

### Pré-condição

Administrador logado em **Bairros e pontos de parada**, com a API disponível; depois, sem conexão (na web: DevTools → Network → Offline).

### Passos para reproduzir

1. Em **Novo**, preencher `Serra do Estêvão` com o ponto `Igreja Matriz`.
2. Ficar sem conexão e finalizar o cadastro; repetir com a inativação de um bairro.
3. Voltar a ter conexão e conferir a listagem e o banco.

### ✅ Resultado esperado

- Mensagem clara de falha de conexão, em português, sem mostrar sucesso.
- O bairro não entra na listagem sem ter sido gravado na API; no cadastro, os campos ficam preenchidos para nova tentativa; na inativação, o bairro continua ativo.

### ❌ Resultado obtido

- Caso reprovado no teste manual (web). Nada chegou à API (nenhum `POST` ou `PATCH` no log).
- Pelo código, sem resposta da API o serviço **não repassa o erro**: cadastra, edita e inativa em um mock em memória e devolve **sucesso**. Reproduzido com teste de unidade simulando “Network Error”: o cadastro devolveu sucesso e a listagem passou a mostrar `Serra do Estêvão | Centro | Bairro Novo | Vila Antiga` (dados de exemplo, não os do banco); a inativação também devolveu sucesso.
- Se a API responde com lista vazia (banco sem bairros), a tela também mostra os bairros de exemplo no lugar de “nenhum bairro”.
- A reativação, quando falha, só escreve no `console.error`; o administrador não vê mensagem.

### ⚠️ Impacto

- O administrador acredita que o bairro foi gravado, mas ele some quando a conexão volta.
- Ele pode editar ou inativar bairros de exemplo que não existem no banco.

### Causa aparente

- `frontend/src/services/bairroService.ts`: `BAIRROS_MOCK` e os blocos `if (!error.response)` em `criarBairro`, `atualizarBairro`, `inativarBairro` e `reativarBairro`; `listarBairros` usa `listaApi.length > 0 ? listaApi : BAIRROS_MOCK`.
- `bairros/index.tsx`, `handleReativar`: o `catch` só chama `console.error`.
- `getErrorMessage` já tem o texto de falha de conexão, mas o serviço não repassa o erro para ela.

### Sugestão

- Remover os mocks do `bairroService` e repassar o erro à tela (`getErrorMessage`).
- Mostrar pop-up de erro também na reativação.
- Manter os campos preenchidos no cadastro com falha.

### Critérios de aceite

- Sem conexão, cadastro, edição, inativação e reativação mostram erro de conexão e não alteram a listagem.
- Lista vazia mostra “nenhum bairro”, e não dados de exemplo.
- Reexecutar `CT-HU007-UI-013` e `CT-HU007-UI-009` (inclusive no celular, quando houver ambiente).

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.

**Issue bloqueante: anexar captura de tela da falha.**
