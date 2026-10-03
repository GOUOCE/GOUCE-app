# Mensagem de erro da senha sobrepõe os outros campos

| Campo | Valor |
|---|---|
| **Tipo** | Bug de UX / layout |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-031` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-031](../UI-HU-001.md#ct-hu001-ui-031--senha-e-confirmação-no-tamanho-máximo) |
| **Issue relacionada** | [BUG-HU001-UI-009-validacao-tardia-no-envio](BUG-HU001-UI-009-validacao-tardia-no-envio.md) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Na etapa **Dados básicos**, informar senha com 129 caracteres.
2. Provocar a exibição da mensagem de erro da senha.

### ✅ Resultado esperado

Exibir a mensagem de erro abaixo do campo, empurrando o layout, sem cobrir outros campos.

### ❌ Resultado obtido

A mensagem de erro longa sobrepôs as linhas dos outros campos. O problema não aparecia com o campo vazio, só ao exibir a mensagem da senha.

### ⚠️ Impacto

- Campos e textos ficam ilegíveis enquanto a mensagem está na tela.

### Critérios de aceite

- Mensagens longas quebram linha sem sobrepor outros elementos.
- Reexecutar `CT-HU001-UI-031`.

### 📎 Evidência
