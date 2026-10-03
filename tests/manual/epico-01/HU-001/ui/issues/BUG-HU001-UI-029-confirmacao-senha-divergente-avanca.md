# Confirmação de senha divergente permite avançar e o erro só aparece na etapa 1 depois de concluir

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / validação |
| **Severidade** | 🔴 Crítica |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-029`, `CT-HU001-UI-032` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-029](../UI-HU-001.md#ct-hu001-ui-029--confirmação-de-senha-divergente) · [CT-HU001-UI-032](../UI-HU-001.md#ct-hu001-ui-032--senha-e-confirmação-acima-do-tamanho-máximo) |
| **Issue relacionada** | [BUG-HU001-UI-009-validacao-tardia-no-envio](BUG-HU001-UI-009-validacao-tardia-no-envio.md) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Na etapa **Dados básicos**, informar senha `Abcde123` e confirmação `Abcde124`.
2. Tocar em **Próximo** e preencher as demais etapas.
3. Tocar em **Concluir cadastro**.

### ✅ Resultado esperado

Na própria etapa 1, informar que as senhas não coincidem e bloquear o avanço até a correção.

### ❌ Resultado obtido

O app permitiu avançar por todas as etapas. Ao tocar em Concluir cadastro, nenhum pop-up ou aviso foi exibido: o app voltou à etapa 1 com a mensagem “As senhas não coincidem”, percebida apenas ao retornar a essa etapa. O mesmo ocorreu com senha de 128 caracteres e confirmação de 127 (CT-HU001-UI-032).

### ⚠️ Impacto

- O usuário preenche todo o cadastro e é devolvido ao início sem entender o motivo.
- Sem aviso no momento do envio, a falha parece um travamento do app.

### Causa aparente

Em `frontend/src/schemas/alunoSchema.ts:48-50`, a igualdade entre `senha` e `confirmarSenha` é um `refine` aplicado ao objeto inteiro. Esse tipo de validação só roda quando todos os campos do formulário são válidos, então ela não é avaliada na validação da etapa 1 e só aparece no envio final.

### Critérios de aceite

- A divergência entre senha e confirmação é apontada na etapa 1, antes de avançar.
- Ao corrigir a confirmação, o erro some e o avanço é liberado.
- Reexecutar `CT-HU001-UI-029` e `CT-HU001-UI-032`.

### 📎 Evidência
