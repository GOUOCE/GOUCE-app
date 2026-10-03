# Mensagens de validação aparecem em inglês para o usuário

| Campo | Valor |
|---|---|
| **Tipo** | Bug de UX |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-009`, `CT-HU001-UI-013`, `CT-HU001-UI-031` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-009](../UI-HU-001.md#ct-hu001-ui-009--dados-básicos-obrigatórios) · [CT-HU001-UI-013](../UI-HU-001.md#ct-hu001-ui-013--nome-acima-do-tamanho-máximo) · [CT-HU001-UI-031](../UI-HU-001.md#ct-hu001-ui-031--senha-e-confirmação-no-tamanho-máximo) |
| **Issue relacionada** | [BUG-HU001-UI-009-validacao-tardia-no-envio](BUG-HU001-UI-009-validacao-tardia-no-envio.md), [BUG-HU001-UI-006-mensagem-erro-object-object](BUG-HU001-UI-006-mensagem-erro-object-object.md) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Na etapa **Dados básicos**, deixar todos os campos vazios e tocar em **Próximo**.
2. Em nova tentativa, informar senha com 129 caracteres e concluir o cadastro.

### ✅ Resultado esperado

Exibir todas as mensagens de validação em português, de forma compreensível.

### ❌ Resultado obtido

Com os campos vazios, as mensagens em vermelho aparecem como “Required”. Nos limites de tamanho, a recusa vem em inglês, como “String should have at most 150 characters” e “should have at most 128 characters”. No campo Nome também apareceu uma borda em tom marrom.

### ⚠️ Impacto

- Usuários que não leem inglês não entendem o que precisa ser corrigido.
- A interface fica inconsistente, misturando português e inglês.

### Critérios de aceite

- Campos obrigatórios vazios mostram mensagem em português (ex.: “Campo obrigatório”).
- Erros de tamanho e de formato vindos da API são traduzidos antes de chegar ao usuário.
- Reexecutar `CT-HU001-UI-009`, `CT-HU001-UI-013` e `CT-HU001-UI-031`.

### 📎 Evidência
