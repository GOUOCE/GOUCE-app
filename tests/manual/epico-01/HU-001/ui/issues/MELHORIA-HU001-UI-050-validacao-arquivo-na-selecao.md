# Validar tamanho e formato do arquivo na seleção e informar o limite

| Campo | Valor |
|---|---|
| **Tipo** | Melhoria |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo) |
| **Caso relacionado** | `CT-HU001-UI-050` |
| **Documentação** | HU-001 — Testes manuais de UI: [CT-HU001-UI-050](../UI-HU-001.md#ct-hu001-ui-050--arquivo-não-permitido-ou-acima-do-limite) |

---

### Pré-condição

Usuário sem sessão autenticada em **Criar conta** no iPhone, com os demais campos preenchidos com a massa válida das pré-condições PC-02 a PC-04 da suíte.

### Passos para reproduzir

1. Na etapa **Documentação**, selecionar um arquivo de 8 MB como comprovante.
2. Tocar em **Próximo**.

### ✅ Resultado esperado

Recusar o arquivo no momento da seleção, informando os formatos permitidos e o tamanho máximo.

### ❌ Resultado obtido

O app não valida o tamanho nem mostra o limite na seleção: o arquivo de 8 MB pode ser escolhido e o erro só aparece depois de avançar, com mensagem genérica. As mensagens “Formato inválido” e “Arquivo excede o limite de tamanho” não informam o que é permitido nem o limite.

### ⚠️ Impacto

- O usuário só descobre o problema depois de avançar, sem saber que arquivo usar.

### Critérios de aceite

- Tamanho e formato são verificados na seleção.
- As mensagens informam os formatos permitidos e o tamanho máximo.
- Reexecutar `CT-HU001-UI-050`.

### 📎 Evidência
