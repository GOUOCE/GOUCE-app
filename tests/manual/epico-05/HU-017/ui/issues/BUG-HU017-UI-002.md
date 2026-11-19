# Recusa de motorista inativo mostra "motorista 2" e texto diferente do BDD

| Campo | Valor |
|---|---|
| **Tipo** | Divergência de requisito |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Branch `test/execucao-ui-hu-017` — navegador web (versão web do app), URL do front `http://localhost:3117`, API `http://localhost:8117`, commit `a4606b39c93ae4cce16fc0d1551815c51a24803d` |
| **Caso relacionado** | `CT-HU017-UI-007` |
| **Documentação** | [HU-017 — Testes manuais de UI](../UI-HU-017.md#ct-hu017-ui-007--motorista-inativado-depois-de-exibido) |
| **Issue relacionada** | Mesmo padrão das [#489](https://github.com/GOUOCE/GOUCE-app/issues/489) e [#490](https://github.com/GOUOCE/GOUCE-app/issues/490), já corrigidas, para outras mensagens da escala. |

---

### Pré-condição

Administrador autenticado. Rota Centro - UFC em 20/11/2026 aberta na tela, com o Mauro Beta (id 2) no V3. Com a tela aberta, o Mauro foi inativado direto no banco local.

### Passos para reproduzir

1. Sem recarregar a tela, trocar o motorista de outro veículo por um motorista disponível.
2. Tocar em confirmar e aceitar o popup.
3. Ler a mensagem do popup "Erro na alocação".

### ✅ Resultado esperado

Confirmação recusada com a mensagem do BDD: "alocação 0: motorista inexistente ou inativo." (HU-017, cenário de motorista inativado depois de exibido; HU-016, esquema de recurso inexistente ou inativo).

### ❌ Resultado obtido

A tela mostra o popup padrão "Erro na alocação" com "Rota Centro - UFC: motorista 2 inexistente ou inativo." A recusa funciona (API 422, nada gravado), mas a mensagem traz o nome da rota e o número do motorista em vez do texto do BDD.

```json
{
  "success": false,
  "error": {
    "code": "DISTRIBUICAO_INVALIDA",
    "message": "Rota Centro - UFC: motorista 2 inexistente ou inativo."
  }
}
```

### ⚠️ Impacto

- O administrador lê um número de motorista que não conhece em vez de uma mensagem clara.
- A mensagem não bate com o texto aprovado no BDD, o que atrapalha a automação do teste de API.

### Causa aparente

`backend/src/modulos/alocacao_diaria/application/services/alocacao_service.py`, linha ~311: `f"{prefix}: motorista {motorista_id} inexistente ou inativo."`. Decisão do testador: o ajuste deve seguir o BDD na mensagem, ou seja, corrigir o código.

### Critérios de aceite

- A API devolve 422 com "alocação 0: motorista inexistente ou inativo.", conforme o BDD; nada é gravado.
- Reexecutar `CT-HU017-UI-007` e o cenário correspondente da suíte de API.

### 📎 Evidência

Reproduzido por Cauan Ricardo em 18/11/2026, ambiente local `atu-exec-hu017` (stack Docker isolada, banco novo, fuso America/Fortaleza). Prints do testador a anexar na issue, sem tokens nem dados pessoais.

### Reteste

| Campo | Valor |
|---|---|
| **Data** | 18/11/2026 |
| **Build** | branch `fix/hu017-issues-522-525`, web `http://localhost:3118`, API `http://localhost:8118` |
| **Issue** | #523 |
| **Resultado** | ✅ Corrigido — Com a tela de 19/11/2026 aberta e a Marta Épsilon inativada no banco, a confirmação mostra “Rota Centro - UFC: o motorista Marta Épsilon está inativo e não pode ser escalado.” (API 422). Decisão final do Cauan: citar o nome do motorista; o BDD da HU-017 foi atualizado para esse texto, no lugar de “alocação 0: motorista inexistente ou inativo.”. |
