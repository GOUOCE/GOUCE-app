# Nome com hífen é rejeitado pelo app, embora o backend aceite

| Campo | Valor |
|---|---|
| **Tipo** | Bug de validação |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-018` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-018](../UI-HU-001.md#ct-hu001-ui-018--nome-com-hífen) |
| **Issue relacionada** | [BUG-HU001-UI-017-nome-com-apostrofo-rejeitado](BUG-HU001-UI-017-nome-com-apostrofo-rejeitado.md) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Na etapa **Dados básicos**, informar o nome `Ana-Maria Silva`.
2. Tocar em **Próximo**.

### ✅ Resultado esperado

Aceitar e preservar o hífen entre partes do nome.

### ❌ Resultado obtido

O app rejeitou o nome com hífen.

### ⚠️ Impacto

- Pessoas com nome composto por hífen não conseguem se cadastrar com o nome do documento.

### Causa aparente

A regex do formulário em `frontend/src/schemas/alunoSchema.ts:13` aceita apenas letras e espaços. O validador do backend (`backend/src/shared/validators/string_sem_numero_validator.py:6`) já aceita hífen.

### Critérios de aceite

- `Ana-Maria Silva` é aceito no formulário e no envio.
- Reexecutar `CT-HU001-UI-018`.

### 📎 Evidência
