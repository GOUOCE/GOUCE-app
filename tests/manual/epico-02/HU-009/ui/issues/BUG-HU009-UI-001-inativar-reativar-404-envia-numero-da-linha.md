# Inativar e reativar ônibus falham com 404: o app envia o número da linha em vez da placa

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🔴 Alta (bloqueante) |
| **Ambiente** | Desenvolvimento — app web (`http://localhost:3000`), API local (`http://localhost:8000`), branch `test/manual-ui-hu-009` a partir da `develop` (`1edaf2aa`) |
| **Issue** | [#274](https://github.com/GOUOCE/GOUCE-app/issues/274) |
| **Caso relacionado** | `CT-HU009-UI-009`, `CT-HU009-UI-010` |
| **Documentação** | [HU-009 — Testes manuais de UI](https://github.com/GOUOCE/GOUCE-app/blob/test/manual-ui-hu-009/tests/manual/epico-02/HU-009/ui/UI-HU-009.md#ct-hu009-ui-009--cancelar-e-confirmar-inativacao-do-onibus-correto) |
| **Issue relacionada** | AC-05 e AC-12 da HU-009 |

---

### Pré-condição

Administrador logado, com ônibus reais cadastrados (por exemplo `QXD2E46` ativo e `XYZ9K87` inativo).

### Passos para reproduzir

1. Em **Frota**, tocar na lixeira de um ônibus ativo e confirmar **Inativar**.
2. Ligar **Mostrar inativos**, tocar no ícone de reativar de um ônibus inativo e confirmar **Reativar**.

### ✅ Resultado esperado

- O ônibus escolhido muda de status, a mensagem de sucesso aparece e a ação gera registro de auditoria (AC-05, AC-12).

### ❌ Resultado obtido

- Aparece o pop-up “Inativação Bloqueada” com o texto técnico “Request failed with status code 404”. A reativação falha da mesma forma.
- O log da API registra `PATCH /onibus/7/inativar` e `PATCH /onibus/8/ativar` com `404 Not Found`, ou seja, o número da linha no lugar da placa. O ônibus continua no mesmo status e nada é gravado na auditoria.

### ⚠️ Impacto

- Não é possível inativar nem reativar nenhum ônibus real pela tela (AC-05). Só a API faz isso. A regra de bloqueio por alocação futura também não pode ser alcançada.

### Causa aparente

- A API não devolve `id` para ônibus; a chave é a placa. `frotaService.listarOnibus` inventa `id: o.id || idx + 1`, e `frota/index.tsx` chama `inativarOnibus(item.id)` e `reativarOnibus(item.id)`.
- Esses métodos só trocam o número pela placa quando o ônibus está na lista de exemplo (`ONIBUS_MOCK`, ids 1 a 3). Para ônibus reais, a URL fica `/onibus/<número>/inativar`, mas a rota espera `/onibus/{placa}/inativar`. Para as três primeiras linhas, o app usaria as placas de exemplo (`OCR-1234`, `OCR-5521`, `OCR-8890`) no lugar das reais (visto no código, não testado na tela).
- O erro exibido é a mensagem crua do Axios, sem orientação ao usuário.

### Sugestão

- Passar `item.placa` (a chave da API) para `inativarOnibus` e `reativarOnibus`, sem depender de `id` inventado nem da lista de exemplo.
- Mostrar mensagem em português quando a API recusar a mudança de status.

### Critérios de aceite

- Inativar e reativar um ônibus real mudam o status do ônibus escolhido, mostram o sucesso e geram registro na auditoria.
- A mensagem de erro, quando houver, é clara e em português.
- Reexecutar `CT-HU009-UI-009` e `CT-HU009-UI-010`.

### 📎 Evidência

Reproduzido por Cauan Ricardo (com apoio do Claude Code) em 2026-10-26, ambiente local.
