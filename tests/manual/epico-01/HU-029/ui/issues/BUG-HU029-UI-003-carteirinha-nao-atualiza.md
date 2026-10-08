# Carteirinha e Meu Perfil não mostram dados alterados até sair e entrar de novo

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU029-UI-003` |
| **Documentação** | HU-029 — Testes manuais de UI: [CT-HU029-UI-003](../UI-HU-029.md#ct-hu029-ui-003--dados-reais-sem-valores-de-exemplo) |
| **Issue relacionada** | #125 e #135 — telas que guardam o estado anterior (mesma causa) |

---

### Pré-condição

Aluno aprovado logado, que já abriu a carteirinha.

### Passos para reproduzir

1. Alterar um dado do cadastro do aluno pela administração (no teste, o curso foi alterado no banco local e confirmado pela API).
2. Sem sair da conta, abrir **Perfil → Ver carteirinha digital** e **Meu Perfil**.

### ✅ Resultado esperado

A carteirinha consulta a situação atual e mostra os dados atualizados a cada abertura com conexão.

### ❌ Resultado obtido

A carteirinha e o **Meu Perfil** continuam com o dado antigo; o novo só aparece depois de sair e entrar de novo.

### ⚠️ Impacto

- O aluno pode exibir dados desatualizados no embarque (curso, instituição, foto).
- O mesmo mecanismo impede a carteirinha de refletir a perda de aprovação durante a sessão (ver CT-HU029-UI-007).

### Causa aparente

- `frontend/src/app/(aluno)/carteirinha-digital.tsx`: a consulta à API roda num `useEffect(..., [])`; como a tela é uma aba oculta (`href: null` em `(aluno)/_layout.tsx`), ela não é desmontada e a consulta não se repete.
- **Meu Perfil** usa os dados guardados na sessão (`user` do `AuthContext`), atualizados só no login.

### Sugestão

- Consultar a API sempre que a tela ganhar foco (`useFocusEffect`) e atualizar a sessão com o resultado.
- Corrigir junto com a #125 e a #135 (mover as telas ocultas da área do aluno para uma `Stack`).

### Critérios de aceite

- Com conexão, abrir a carteirinha mostra os dados atuais do cadastro.
- Reexecutar `CT-HU029-UI-003` e `CT-HU029-UI-007`.

### 📎 Evidência
