# Dados da carteirinha são cortados com reticências quando o texto é longo

| Campo | Valor |
|---|---|
| **Tipo** | Bug de UX / layout |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU029-UI-001` |
| **Documentação** | HU-029 — Testes manuais de UI: [CT-HU029-UI-001](../UI-HU-029.md#ct-hu029-ui-001--abrir-a-carteirinha-do-aluno-aprovado) |

---

### Pré-condição

Aluno aprovado com dados de tamanho comum ou longo (ex.: curso “Engenharia de Software”).

### Passos para reproduzir

1. Abrir **Perfil → Ver carteirinha digital**.
2. Conferir o nome, o e-mail, a instituição e o curso.

### ✅ Resultado esperado

Todos os dados de identificação aparecem completos (AC-01), quebrando em mais de uma linha ou reduzindo a fonte quando necessário. A carteirinha é um documento apresentado no embarque.

### ❌ Resultado obtido

Os textos ficam limitados a uma linha e são cortados com reticências. O curso “Engenharia de Software” já aparece cortado; nomes completos, instituições e cursos mais longos (ex.: “Licenciatura em Ciências Biológicas”) ficam incompletos.

### ⚠️ Impacto

- O motorista ou fiscal não consegue conferir o nome ou o curso completos.
- O problema piora em telas menores.

### Causa aparente

`frontend/src/app/(aluno)/carteirinha-digital.tsx`, linhas 100 a 109: `numberOfLines={1}` no nome, no e-mail, na instituição e no curso.

### Sugestão

- Permitir 2 linhas (`numberOfLines={2}`) e/ou `adjustsFontSizeToFit` com `minimumFontScale`, garantindo que o conteúdo apareça inteiro.
- Testar com nomes e cursos longos e em telas pequenas.

### Critérios de aceite

- Nome, e-mail, instituição e curso aparecem completos com textos longos.
- Reexecutar `CT-HU029-UI-001`.

### 📎 Evidência
