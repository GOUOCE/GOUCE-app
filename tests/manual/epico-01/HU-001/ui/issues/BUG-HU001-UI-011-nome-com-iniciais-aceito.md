# Nome com iniciais isoladas, como “A B”, é aceito como nome completo

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-011` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-011](../UI-HU-001.md#ct-hu001-ui-011--nome-exatamente-no-mínimo) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Na etapa **Dados básicos**, informar o nome `A B`.
2. Tocar em **Próximo** e concluir o cadastro.
3. Comparar com o nome `Ana`.

### ✅ Resultado esperado

Rejeitar “A B” como nome incompleto, assim como acontece com “Ana”.

### ❌ Resultado obtido

Com “Ana”, o app pede o nome completo. Com “A B”, não houve aviso: o app avançou para a etapa 2 e a solicitação de cadastro foi enviada.

### ⚠️ Impacto

- Cadastros chegam sem nome que identifique o aluno, o que atrapalha a análise da coordenação.

### Causa aparente

Em `frontend/src/schemas/alunoSchema.ts:8-11`, a regra apenas confere se existem duas partes separadas por espaço, sem tamanho mínimo por parte.

### Critérios de aceite

- Primeira e última parte do nome com pelo menos 2 letras cada.
- Partes do meio podem ter 1 letra (“João P. Silva”) ou ser preposições (“de”, “da”, “dos”, “e”).
- “A B” e “Ana B” são rejeitados; “Maria da Silva” e “João P. Silva” são aceitos.
- Reexecutar `CT-HU001-UI-011`.

### 📎 Evidência
