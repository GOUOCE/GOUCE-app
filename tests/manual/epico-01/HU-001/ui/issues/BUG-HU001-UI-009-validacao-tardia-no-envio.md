# Validações só ocorrem no envio final, e não na etapa em que o dado é informado

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-009`, `CT-HU001-UI-013`, `CT-HU001-UI-031`, `CT-HU001-UI-033` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-009](../UI-HU-001.md#ct-hu001-ui-009--dados-básicos-obrigatórios) · [CT-HU001-UI-013](../UI-HU-001.md#ct-hu001-ui-013--nome-acima-do-tamanho-máximo) · [CT-HU001-UI-031](../UI-HU-001.md#ct-hu001-ui-031--senha-e-confirmação-no-tamanho-máximo) · [CT-HU001-UI-033](../UI-HU-001.md#ct-hu001-ui-033--data-de-nascimento-inválida) |
| **Issue relacionada** | [BUG-HU001-UI-009-mensagens-validacao-em-ingles](BUG-HU001-UI-009-mensagens-validacao-em-ingles.md), [BUG-HU001-UI-033-data-nascimento-sem-validacao](BUG-HU001-UI-033-data-nascimento-sem-validacao.md), [BUG-HU001-UI-029-confirmacao-senha-divergente-avanca](BUG-HU001-UI-029-confirmacao-senha-divergente-avanca.md) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Na etapa **Dados básicos**, informar um dos valores inválidos abaixo, um por tentativa:
   - nome com apenas espaços;
   - nome com 151 caracteres;
   - senha e confirmação com 129 caracteres;
   - data de nascimento 31/02/2002.
2. Tocar em **Próximo** e preencher as demais etapas.
3. Tocar em **Concluir cadastro**.

### ✅ Resultado esperado

Rejeitar cada valor inválido na própria etapa 1, com mensagem compreensível, antes de permitir o avanço.

### ❌ Resultado obtido

Todos os valores passaram pela etapa 1. A rejeição só ocorreu no envio final, pela API, muitas vezes com mensagens em inglês ou como “[object Object]”:

- nome com espaços: HTTP `400`, “Nome completo deve ter pelo menos 3 caracteres”, exibido como “[object Object]”;
- nome com 151 caracteres: HTTP `422`, “String should have at most 150 characters”;
- senha com 129 caracteres: recusa em inglês, “should have at most 128 characters”;
- data 31/02/2002: aceita na etapa 1 e barrada só no envio.

### ⚠️ Impacto

- O usuário preenche o cadastro inteiro para só então descobrir um erro da primeira etapa.
- Formulário e API têm regras diferentes, o que gera retrabalho e mensagens inconsistentes.

### Causa aparente

Em `frontend/src/schemas/alunoSchema.ts`, `nomeCompleto` (linhas 6-15) e `senha` (linhas 18-22) não têm limite máximo, e `dataNascimento` (linha 17) só verifica o tamanho mínimo de 10 caracteres. Os limites de 150 (nome) e 128 (senha) e a validação da data existem apenas no backend.

### Critérios de aceite

- Nome sem conteúdo real, nome acima de 150 caracteres, senha acima de 128 caracteres e datas inexistentes são rejeitados na etapa 1.
- As regras do formulário ficam alinhadas às da API.
- Reexecutar `CT-HU001-UI-009`, `CT-HU001-UI-013`, `CT-HU001-UI-031` e `CT-HU001-UI-033`.

### 📎 Evidência

```json
{
  "success": false,
  "error": {
    "code": "REQUEST_VALIDATION_ERROR",
    "message": "Requisição inválida",
    "details": [
      { "field": "nome", "message": "String should have at most 150 characters" }
    ]
  }
}
```
