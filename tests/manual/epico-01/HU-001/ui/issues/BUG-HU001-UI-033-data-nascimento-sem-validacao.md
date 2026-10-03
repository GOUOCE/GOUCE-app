# Data de nascimento aceita datas inexistentes, como 31/02/2002 e 99/99/9999

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-033` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-033](../UI-HU-001.md#ct-hu001-ui-033--data-de-nascimento-inválida) |
| **Issue relacionada** | [BUG-HU001-UI-009-validacao-tardia-no-envio](BUG-HU001-UI-009-validacao-tardia-no-envio.md), [BUG-HU001-UI-033-validacao-data-durante-digitacao](BUG-HU001-UI-033-validacao-data-durante-digitacao.md) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Na etapa **Dados básicos**, informar a data `31/02/2002`.
2. Tocar em **Próximo**.
3. Repetir com `99/99/9999`.

### ✅ Resultado esperado

Rejeitar datas inexistentes na etapa 1, com mensagem compreensível.

### ❌ Resultado obtido

As duas datas foram aceitas na etapa 1 e permitiram avançar. A máscara só restringe a entrada a números; não há validação de data no formulário. O cadastro não foi concluído, mas a recusa só ocorreu no envio final.

### ⚠️ Impacto

- Datas impossíveis passam pelo formulário e só são barradas no fim do cadastro.

### Causa aparente

Em `frontend/src/schemas/alunoSchema.ts:17`, `dataNascimento` só exige 10 caracteres; não há verificação de que a data existe.

### Critérios de aceite

- Dia, mês e ano são validados na etapa 1 (31/02 e 99/99/9999 são rejeitados).
- Datas válidas continuam aceitas.
- Reexecutar `CT-HU001-UI-033`.

### 📎 Evidência
