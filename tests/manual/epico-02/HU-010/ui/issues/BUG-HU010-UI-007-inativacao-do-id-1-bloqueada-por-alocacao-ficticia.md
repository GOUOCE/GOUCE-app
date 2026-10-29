# O primeiro motorista (id 1) não pode ser inativado: o app o bloqueia com alocação pendente fictícia

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🔴 Alta (bloqueante) |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-010` a partir da `develop` (`4b1706ee`), com o `motoristaService.ts` do PR #243 aplicado |
| **Issue** | [#292](https://github.com/GOUOCE/GOUCE-app/issues/292) |
| **Caso relacionado** | `CT-HU010-UI-009` |
| **Documentação** | [HU-010 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-010/tests/manual/epico-02/HU-010/ui/UI-HU-010.md#ct-hu010-ui-009--inativar-motorista-sem-alocação-futura) |
| **Issue relacionada** | [#258](https://github.com/GOUOCE/GOUCE-app/issues/258) (faculdades), AC-05/AC-06 da HU-010 |

---

### Pré-condição

Administrador logado, motorista com id 1 ativo e sem nenhuma alocação.

### Passos para reproduzir

1. Tocar na lixeira do motorista de id 1 e confirmar **Inativar**.

### ✅ Resultado esperado

- O motorista é inativado, com sucesso e registro na auditoria; o bloqueio por alocação só vale quando existe alocação futura real (AC-05, AC-06).

### ❌ Resultado obtido

- Aparece “Inativação Bloqueada”: “Este profissional possui alocações pendentes e não pode ser inativado no momento.”
- O log da API não registrou nenhum `PATCH /motoristas/1/inativar` e o motorista continua ativo; não existe alocação alguma (o banco nem tem tabela de alocação de motoristas).
- Outros motoristas (por exemplo, o id 3) foram inativados normalmente, com `200` e auditoria.

### ⚠️ Impacto

- O primeiro motorista cadastrado em qualquer banco recebe o id 1 e nunca poderá ser inativado pela tela.

### Causa aparente

- `motoristaService.inativarMotorista` procura o id na lista de exemplo (`MOTORISTAS_MOCK`) e, se o item tem `alocacoes_pendentes: true`, lança o erro antes de chamar a API. O id 1 do exemplo (José Almeida) tem esse valor.

### Sugestão

- Remover a checagem local de `alocacoes_pendentes` e o `MOTORISTAS_MOCK` do fluxo real; decidir o bloqueio apenas pela resposta da API (por exemplo, `409` com a mensagem do requisito).

### Critérios de aceite

- O motorista de id 1 pode ser inativado quando não há alocação real.
- Reexecutar `CT-HU010-UI-009`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-27, ambiente local.
