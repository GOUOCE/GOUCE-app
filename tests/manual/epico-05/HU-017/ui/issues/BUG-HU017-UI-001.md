# Depois de recarregar a escala, o campo Motorista mostra "Selecionar" mas guarda o motorista inativo e a confirmação é recusada

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🟡 Média |
| **Ambiente** | Branch `test/execucao-ui-hu-017` — navegador web (versão web do app), URL do front `http://localhost:3117`, API `http://localhost:8117`, commit `a4606b39c93ae4cce16fc0d1551815c51a24803d` |
| **Caso relacionado** | `CT-HU017-UI-007` |
| **Documentação** | [HU-017 — Testes manuais de UI](../UI-HU-017.md#ct-hu017-ui-007--motorista-inativado-depois-de-exibido) |
| **Issue relacionada** | Nenhuma identificada. A [#492](https://github.com/GOUOCE/GOUCE-app/issues/492) (motorista com escala futura inativado) já foi corrigida; este relato é sobre o que a tela mostra quando o motorista gravado deixa de estar ativo. |

---

### Pré-condição

Administrador autenticado (`admin@gouce.app`). Rota Centro - UFC em 20/11/2026 com a escala já confirmada (V3 HIJ7K89 com Mauro Beta e V1 ABC1D23 com Marcos Alfa na ida). O Mauro Beta foi inativado depois, direto no banco local (pela API a inativação é barrada com "possui alocações pendentes").

### Passos para reproduzir

1. Abrir Logística → Distribuição Logística, escolher 20/11/2026 e abrir a alocação da Rota Centro - UFC.
2. Olhar o campo Motorista do veículo que estava com o Mauro Beta: aparece "Selecionar", como se estivesse vazio.
3. Sem tocar em nenhum campo, tocar em confirmar e aceitar o popup.

### ✅ Resultado esperado

O campo deve indicar que o motorista gravado não está mais disponível (por exemplo, mostrando o nome com um aviso) ou ficar realmente vazio, de modo que a validação "Campos Obrigatórios" o bloqueie. A tela não deve enviar às escondidas um valor que o administrador não vê.

### ❌ Resultado obtido

O campo mostra "Selecionar", mas o formulário continua com o motorista 2 por trás. A confirmação envia esse motorista e a tela mostra o popup "Erro na alocação" com "Rota Centro - UFC: motorista 2 inexistente ou inativo." (API 422). O administrador não sabe qual campo corrigir. Escolhendo outro motorista, a confirmação foi aceita (201).

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

- O administrador vê um campo aparentemente vazio, mas a validação de campo obrigatório não o barra; só descobre o problema depois da recusa da API.
- Com a regra atual da API (inativar motorista com escala futura é barrado), o cenário depende de inativação por outro caminho ou de dado antigo; por isso não bloqueia o fluxo principal.

### Causa aparente

Em `frontend/src/app/(administrador)/logistica/alocar.tsx`, o `motoristaId` de cada formulário vem da escala gravada (linha ~123) e `getLabelPorValor` (linhas 219–222) devolve "Selecionar" quando o valor não está nas opções, e as opções só trazem motoristas ativos (`incluir_inativos: false`). A checagem de obrigatórios (linha ~294) só olha se `motoristaId` não é vazio.

### Critérios de aceite

- Quando o motorista gravado não está entre as opções, a tela o trata como não selecionado (valor limpo) ou o sinaliza de forma visível.
- A confirmação não envia motorista que a tela exibe como vazio.
- Reexecutar `CT-HU017-UI-007` e `CT-HU017-UI-006`.

### 📎 Evidência

Reproduzido por Cauan Ricardo em 18/11/2026, ambiente local `atu-exec-hu017` (stack Docker isolada, banco novo, fuso America/Fortaleza). Prints do testador a anexar na issue, sem tokens nem dados pessoais.
