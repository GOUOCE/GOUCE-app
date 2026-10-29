# Mensagem de erro muito longa extrapola o campo em vez de quebrar a linha

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

1. Na etapa **Dados básicos**, informar senha e confirmação com 129 caracteres (a API recusa com a mensagem longa “should have at most 128 characters”).
2. Avançar até a última etapa e concluir o cadastro, para exibir a mensagem de erro.

### ✅ Resultado esperado

Mensagens de erro, mesmo longas, quebram a linha e ficam dentro da área do campo, sem ultrapassar seus limites.

### ❌ Resultado obtido

Quando a mensagem de erro fica muito longa, o texto não quebra a linha: ele passa para fora do campo e invade o espaço dos campos vizinhos. O problema não é o conteúdo da mensagem de senha, e sim o comportamento do texto longo; apareceu com a senha de 129 caracteres, mas qualquer mensagem longa tende a reproduzi-lo. Com o campo vazio (mensagem curta) não ocorre.

### ⚠️ Impacto

- Campos e textos ficam ilegíveis enquanto a mensagem está na tela.
- Afeta qualquer campo cujo erro seja longo, e não só a senha.

### Critérios de aceite

- Mensagens de erro longas quebram a linha dentro da área do campo, sem passar para fora dele nem sobrepor outros elementos.
- Vale para todos os campos do cadastro, e não só para a senha.
- Reexecutar `CT-HU001-UI-031`.

### 📎 Evidência
