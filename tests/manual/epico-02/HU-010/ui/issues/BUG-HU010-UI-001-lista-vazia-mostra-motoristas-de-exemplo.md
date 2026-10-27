# Com a lista vazia, a tela de motoristas mostra motoristas de exemplo que não existem no banco

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🔴 Alta (bloqueante) |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-010` a partir da `develop` (`4b1706ee`), com o `motoristaService.ts` do PR #243 aplicado |
| **Issue** | [#286](https://github.com/GOUOCE/GOUCE-app/issues/286) |
| **Caso relacionado** | `CT-HU010-UI-001` |
| **Documentação** | [HU-010 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-010/tests/manual/epico-02/HU-010/ui/UI-HU-010.md#ct-hu010-ui-001--abrir-listagem-e-buscar-por-nome) |
| **Issue relacionada** | [PR #243](https://github.com/GOUOCE/GOUCE-app/pull/243) (origem do erro), [#277](https://github.com/GOUOCE/GOUCE-app/issues/277) (frota) e [#258](https://github.com/GOUOCE/GOUCE-app/issues/258) (faculdades) |

---

### Pré-condição

Administrador logado, banco sem nenhum motorista (`GET /motoristas` devolve `[]`) e o app com o código do PR #243.

### Passos para reproduzir

1. Abrir **Cadastros → Motoristas**.
2. Digitar `a` na busca.

### ✅ Resultado esperado

- A lista aparece vazia, com “Nenhum motorista ativo encontrado”, sem inventar motoristas (AC-01).

### ❌ Resultado obtido

- Aparecem José Almeida, Ana Souza e Paulo Ferreira, com o telefone `(88) 9 9999-9999`, como se fossem motoristas cadastrados.
- O log da API mostra `GET /motoristas?incluir_inativos=true` e `...&nome=a` com `200` e lista vazia; o banco tinha 0 motoristas. Com o código da `develop` (sem o PR), a mesma tela mostrava a lista vazia corretamente.

### ⚠️ Impacto

- O administrador vê e pode tentar editar ou inativar motoristas que não existem, e não percebe que o banco está vazio.

### Causa aparente

- O PR #243 trocou, em `motoristaService.listarMotoristas`, o uso de `response.data` por `const lista = listaApi.length > 0 ? listaApi : MOTORISTAS_MOCK;`. Quando a API devolve `[]`, o app usa o exemplo.

### Sugestão

- Remover o fallback para `MOTORISTAS_MOCK` quando a API responde com lista vazia: lista vazia deve mostrar o estado vazio. O exemplo não deve aparecer no fluxo real.

### Critérios de aceite

- Com o banco vazio e na busca sem resultado, a tela mostra “Nenhum motorista ativo encontrado”.
- Reexecutar `CT-HU010-UI-001`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-27, ambiente local.
