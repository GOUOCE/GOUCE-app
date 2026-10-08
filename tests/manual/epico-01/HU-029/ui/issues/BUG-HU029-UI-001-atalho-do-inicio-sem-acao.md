# Atalho “Carteirinha Digital” da tela Início não abre a carteirinha

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU029-UI-001` |
| **Documentação** | HU-029 — Testes manuais de UI: [CT-HU029-UI-001](../UI-HU-029.md#ct-hu029-ui-001--abrir-a-carteirinha-do-aluno-aprovado) |

---

### Pré-condição

Aluno aprovado logado, na tela **Início**.

### Passos para reproduzir

1. Na seção **Acesso rápido**, tocar em **Carteirinha Digital**.

### ✅ Resultado esperado

Abrir a **Carteirinha Digital**, como pelo caminho **Perfil → Ver carteirinha digital** (fluxo principal da HU-029: “No menu principal ou tela inicial, o aluno seleciona Carteirinha Digital”).

### ❌ Resultado obtido

Nada acontece. Só é possível abrir a carteirinha por **Perfil → Ver carteirinha digital**.

### ⚠️ Impacto

- No embarque, o aluno procura a carteirinha no atalho mais visível e não consegue abrir; precisa descobrir o caminho pelo Perfil.

### Causa aparente

`frontend/src/app/(aluno)/home.tsx:47`: `<QuickAction title="Carteirinha Digital" Icone={Contact} />` sem `onPress`. Os demais atalhos (**Agendar Transporte**, **Meus Agendamentos**, **Mural de Avisos**) também estão sem ação, mas pertencem a funcionalidades ainda não implementadas.

### Critérios de aceite

- Tocar em **Carteirinha Digital** no **Início** abre a carteirinha.
- Reexecutar `CT-HU029-UI-001`.

### 📎 Evidência
