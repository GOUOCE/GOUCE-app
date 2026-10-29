# Carteirinha mostra data de emissão fixa e usa valores de exemplo quando falta dado

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / integridade de dados |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU029-UI-003` |
| **Documentação** | HU-029 — Testes manuais de UI: [CT-HU029-UI-003](../UI-HU-029.md#ct-hu029-ui-003--dados-reais-sem-valores-de-exemplo) |
| **Issue relacionada** | [BUG-HU029-UI-002](BUG-HU029-UI-002-app-exibe-carteirinha-recusada-pela-api.md) — os valores fixos aparecem quando a API recusa ou falha |

---

### Pré-condição

Aluno aprovado logado.

### Passos para reproduzir

1. Abrir **Perfil → Ver carteirinha digital**.
2. Conferir a data de emissão.

### ✅ Resultado esperado

Todos os dados da carteirinha vêm do cadastro do aluno, inclusive a data de emissão (ou de validade). Quando um dado não estiver disponível, o app informa a indisponibilidade, sem inventar valores.

### ❌ Resultado obtido

- A data de emissão é sempre “10/09/2026”, para qualquer aluno (a conta testada foi criada em 04/10/2026).
- Quando a API não devolve os dados, a carteirinha é montada com valores de exemplo: “João Neves”, “joao@email.com”, “UFC”, “Campus Quixadá”, “Engenharia de Software”, “2024.1” e uma foto de banco de imagens.

### ⚠️ Impacto

- A carteirinha é um documento: uma data falsa e dados inventados podem ser aceitos no embarque como se fossem do aluno.
- Combinado com o BUG-HU029-UI-002, um aluno sem dados ou sem aprovação pode exibir uma carteirinha com aparência válida.

### Causa aparente

`frontend/src/app/(aluno)/carteirinha-digital.tsx`, linhas 54 a 67: `const emissao = '10/09/2026'` e valores padrão (`|| 'João Neves'`, `|| 'UFC'`, `|| 'Campus Quixadá'`, `|| '2024.1'`, foto do Unsplash).

### Critérios de aceite

- A data exibida vem do backend (emissão ou validade do vínculo).
- Nenhum valor de exemplo no código da carteirinha; dado ausente gera mensagem de indisponibilidade.
- Reexecutar `CT-HU029-UI-003`.

### 📎 Evidência
