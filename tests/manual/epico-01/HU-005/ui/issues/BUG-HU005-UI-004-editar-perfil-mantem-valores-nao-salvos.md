# Editar perfil mantém valores não salvos ao reabrir e a seta volta para Início sem confirmação

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / UX |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU005-UI-003`, `CT-HU005-UI-004` |
| **Documentação** | HU-005 — Testes manuais de UI: [CT-HU005-UI-004](../UI-HU-005.md#ct-hu005-ui-004--campos-acadêmicos-somente-leitura) |
| **Issue relacionada** | [BUG-HU005-UI-003-validacao-telefone-fraca-no-perfil](BUG-HU005-UI-003-validacao-telefone-fraca-no-perfil.md) |

---

### Pré-condição

Aluno ativo logado, em **Meu Perfil**.

### Passos para reproduzir

1. Tocar em **Editar perfil** e digitar no **Telefone** um valor que a API recusa (ex.: mais de 20 dígitos); tocar em **Salvar alterações** e fechar o erro.
2. Tocar na seta de voltar.
3. Voltar a **Meu Perfil** e tocar de novo em **Editar perfil**.

### ✅ Resultado esperado

- A seta de voltar pergunta se o usuário quer descartar as alterações e volta para **Meu Perfil**.
- Ao reabrir **Editar perfil**, os campos mostram os dados salvos no banco.

### ❌ Resultado obtido

- A seta sai sem confirmação e leva à aba **Início**, e não a **Meu Perfil**.
- Ao reabrir **Editar perfil**, o campo **Telefone** ainda mostra o número inválido que não foi salvo. O banco continua com o telefone correto (`GET /usuarios/me`).

### ⚠️ Impacto

- O usuário vê um dado que não está salvo e pode achar que a alteração deu certo, ou salvar sem querer um valor antigo digitado.
- Alterações são perdidas sem aviso ao tocar na seta.
- A navegação de volta leva a uma tela inesperada.

### Causa aparente

- `frontend/src/app/(aluno)/_layout.tsx`: `editar-perfil` é registrada como aba oculta (`Tabs.Screen` com `href: null`). Abas não são desmontadas ao sair, então o formulário guarda o que foi digitado, e o `useEffect(..., [])` que recarrega o perfil (`editar-perfil.tsx`) não roda de novo.
- `editar-perfil.tsx`: a seta chama `router.back()` direto, sem confirmação; dentro das abas, o “voltar” leva à aba anterior do histórico (Início).
- O mesmo vale para as outras telas ocultas da área do aluno (`alterar-email`, `carteirinha-digital`, `renovar-vinculo`).

### Sugestão

- Recarregar o formulário sempre que a tela ganhar foco (`useFocusEffect`) ou mover essas telas para uma `Stack` dentro da área do aluno.
- Na seta, perguntar se deseja descartar as alterações (como no cadastro e no login) e voltar explicitamente para **Meu Perfil**.

### Critérios de aceite

- Reabrir **Editar perfil** sempre mostra os dados salvos.
- A seta pede confirmação quando houver alterações e volta para **Meu Perfil**.
- Reexecutar `CT-HU005-UI-002` a `CT-HU005-UI-004`.

### 📎 Evidência
