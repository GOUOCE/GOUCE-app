# Editar administrador sai sem confirmar, volta para o Painel e reabre com o texto não salvo

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / UX |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU006-UI-009` |
| **Documentação** | HU-006 — Testes manuais de UI: [CT-HU006-UI-009](../UI-HU-006.md#ct-hu006-ui-009--sair-sem-salvar) |
| **Issue relacionada** | #125 — Editar perfil do aluno com o mesmo comportamento; [BUG-HU006-UI-002](BUG-HU006-UI-002-lista-e-formulario-nao-atualizam.md) — mesma causa (telas não desmontadas) |

---

### Pré-condição

Administrador logado na **Gestão de administradores**.

### Passos para reproduzir

1. Abrir um administrador em **Editar Administrador** e alterar o nome, sem salvar.
2. Tocar na seta de voltar.
3. Abrir o mesmo administrador em **Editar** de novo.

### ✅ Resultado esperado

- A seta pergunta se o usuário quer descartar as alterações e volta para a listagem de administradores.
- Ao reabrir **Editar**, os campos mostram os dados salvos.

### ❌ Resultado obtido

- A seta sai sem confirmação e leva ao **Painel**, e não à listagem.
- Nada é salvo (correto), mas ao reabrir **Editar** o campo mostra o texto descartado; um toque em salvar gravaria o valor que o usuário desistiu de salvar.

### ⚠️ Impacto

- Alterações são perdidas sem aviso, e a navegação leva a uma tela inesperada.
- Risco de salvar sem querer um dado descartado.

### Causa aparente

- `frontend/src/app/(administrador)/administradores/editar.tsx:95`: a seta chama `router.back()` direto, sem confirmação; dentro das abas, o “voltar” vai para o Painel.
- As telas da gestão ficam numa aba oculta (`href: null` em `(administrador)/_layout.tsx`) e não são desmontadas, então o formulário guarda o texto digitado.

### Sugestão

- Confirmar o descarte quando houver alterações e voltar explicitamente para a listagem.
- Recarregar o formulário com os dados do servidor ao ganhar foco; corrigir junto com a #125 e o BUG-HU006-UI-002.

### Critérios de aceite

- A seta pede confirmação quando há alterações e volta para a listagem.
- Ao reabrir **Editar**, os campos mostram os dados salvos.
- Reexecutar `CT-HU006-UI-009`.

### 📎 Evidência

- `GET /administradores` manteve “Carla mendes” enquanto o formulário reaberto exibia “Carla teste”.
