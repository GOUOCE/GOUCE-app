# Termos de uso sem LGPD e com texto provisório em outro idioma

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / conteúdo |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-051` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-051](../UI-HU-001.md#ct-hu001-ui-051--leitura-dos-termos-e-da-política-de-privacidade) |
| **Issue relacionada** | [BUG-HU001-UI-052-caixa-aceite-invisivel](BUG-HU001-UI-052-caixa-aceite-invisivel.md) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Avançar até a etapa **Termos de Uso**.
2. Ler o texto dos termos e da política de privacidade.

### ✅ Resultado esperado

Exibir os termos e a política de privacidade definitivos, em português, mencionando a LGPD.

### ❌ Resultado obtido

O texto dos termos não menciona a LGPD e aparenta estar em outro idioma (possivelmente hebraico ou latim), sem o conteúdo definitivo.

### ⚠️ Impacto

- O aluno aceita termos que não consegue ler.
- O consentimento exigido pela LGPD para dados pessoais e sensíveis fica comprometido.

### Critérios de aceite

- Os termos e a política de privacidade são o texto definitivo, em português.
- O texto cita a LGPD e explica o uso dos dados pessoais coletados no cadastro.
- Reexecutar `CT-HU001-UI-051`.

### 📎 Evidência
