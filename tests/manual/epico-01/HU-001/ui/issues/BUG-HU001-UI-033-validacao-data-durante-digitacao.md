# Validação da data de nascimento dispara já no primeiro dígito digitado

| Campo | Valor |
|---|---|
| **Tipo** | Bug de UX |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-033` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-033](../UI-HU-001.md#ct-hu001-ui-033--data-de-nascimento-inválida) |
| **Issue relacionada** | [BUG-HU001-UI-033-data-nascimento-sem-validacao](BUG-HU001-UI-033-data-nascimento-sem-validacao.md) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Na etapa **Dados básicos**, começar a digitar a data de nascimento.
2. Observar a mensagem após o primeiro dígito.

### ✅ Resultado esperado

Validar a data só quando o campo estiver completo, ao sair do campo ou ao tocar em Próximo.

### ❌ Resultado obtido

Ao digitar o primeiro dígito, a mensagem “data inválida” aparece imediatamente, antes de terminar a digitação, e só some quando a data fica completa.

### ⚠️ Impacto

- O usuário vê um erro enquanto ainda está digitando corretamente, o que passa a impressão de que errou.

### Critérios de aceite

- Nenhuma mensagem de data inválida enquanto o usuário digita.
- A validação ocorre ao completar o campo, ao sair dele ou ao tentar avançar.
- Reexecutar `CT-HU001-UI-033`.

### 📎 Evidência
