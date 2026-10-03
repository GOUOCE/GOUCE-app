# Erros da API aparecem como “[object Object]” no alerta do cadastro

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / tratamento de erros |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-006`, `CT-HU001-UI-009` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-006](../UI-HU-001.md#ct-hu001-ui-006--toques-repetidos-durante-o-envio) · [CT-HU001-UI-009](../UI-HU-001.md#ct-hu001-ui-009--dados-básicos-obrigatórios) |
| **Issue relacionada** | [BUG-HU001-UI-002-turno-curso-invalido](BUG-HU001-UI-002-turno-curso-invalido.md), [BUG-HU001-UI-009-mensagens-validacao-em-ingles](BUG-HU001-UI-009-mensagens-validacao-em-ingles.md) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Preencher o cadastro em uma situação que a API recuse (ex.: nome com apenas espaços, CT-HU001-UI-009).
2. Tocar em **Concluir cadastro**.

### ✅ Resultado esperado

Exibir a mensagem retornada pela API de forma legível, em português.

### ❌ Resultado obtido

Foi exibido um alerta com a mensagem `[object Object]`, sem informação sobre o que corrigir. Ocorreu nos toques repetidos em Concluir cadastro (CT-HU001-UI-006) e no nome com apenas espaços (CT-HU001-UI-009).

### ⚠️ Impacto

- O usuário não recebe orientação sobre o erro e não consegue corrigir o cadastro.
- Afeta qualquer erro da API que use o formato `{"detail": {"erros": [...]}}`.

### Critérios de aceite

- Todo erro retornado pela API no cadastro é exibido como texto legível.
- Os dois formatos de erro da API (`detail.erros` e `error.details`) são tratados.
- Reexecutar `CT-HU001-UI-006` e `CT-HU001-UI-009`.

### 📎 Evidência
