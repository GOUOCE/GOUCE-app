# Aceitar e-mail com espaços nas pontas, removendo-os antes de validar

| Campo | Valor |
|---|---|
| **Tipo** | Melhoria |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-019` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-019](../UI-HU-001.md#ct-hu001-ui-019--e-mail-inválido) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Na etapa **Dados básicos**, informar o e-mail `" maria@example.com "` (com espaços no início e no fim).
2. Tocar em **Próximo**.

### ✅ Resultado esperado

Remover os espaços das pontas (trim) e aceitar o e-mail válido.

### ❌ Resultado obtido

O e-mail com espaços nas pontas foi rejeitado como inválido.

### ⚠️ Impacto

- Ao colar o e-mail, o usuário leva espaços junto e recebe um erro que não entende.

### Critérios de aceite

- Espaços no início e no fim do e-mail são removidos antes da validação.
- Reexecutar `CT-HU001-UI-019`.

### 📎 Evidência
