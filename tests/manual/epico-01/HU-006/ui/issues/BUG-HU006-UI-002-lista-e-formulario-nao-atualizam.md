# Gestão de administradores não atualiza a lista após cadastrar e mantém o formulário preenchido

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU006-UI-002`, `CT-HU006-UI-004` |
| **Documentação** | HU-006 — Testes manuais de UI: [CT-HU006-UI-002](../UI-HU-006.md#ct-hu006-ui-002--cadastrar-novo-administrador) |
| **Issue relacionada** | #125, #135 e #151 — telas que guardam o estado anterior (mesma causa) |

---

### Pré-condição

Administrador logado em **Painel → Gestão de administradores**.

### Passos para reproduzir

1. Tocar em **Novo**, preencher nome e e-mail válidos e confirmar **Finalizar cadastro?**.
2. Conferir a listagem ao voltar.
3. Voltar ao **Painel** e entrar de novo em **Gestão de administradores**.
4. Tocar em **Novo** outra vez.

### ✅ Resultado esperado

- Após o cadastro, a listagem é atualizada com o novo administrador (AC-07).
- Um novo cadastro começa com o formulário vazio.

### ❌ Resultado obtido

- O administrador é criado (HTTP 201, e-mail enviado), mas não aparece na listagem, nem ao sair e entrar de novo na gestão; só aparece depois de fechar e reabrir o app.
- O mesmo vale para a edição (`CT-HU006-UI-004`): o nome alterado é salvo (HTTP 200), mas a listagem só o mostra depois de reabrir o app.
- O defeito é **intermitente**: no `CT-HU006-UI-008`, com o app recém-aberto e a gestão aberta pela primeira vez na sessão, a listagem atualizou logo após o cadastro. Ele aparece quando a gestão já tinha sido aberta antes na mesma sessão (como no `CT-HU006-UI-002` e no `CT-HU006-UI-004`).
- O formulário de **Novo** continua com os dados do cadastro anterior até reabrir o app.

### ⚠️ Impacto

- O administrador acha que o cadastro falhou e tenta de novo (recebe “e-mail já em uso”) ou cria outro registro.
- Dados de um cadastro concluído ficam expostos no formulário.

### Causa aparente

- `frontend/src/app/(administrador)/administradores/index.tsx`: a listagem é carregada só na montagem (`useEffect`) e recarregada apenas após inativar/reativar.
- `frontend/src/app/(administrador)/administradores/cadastrar.tsx`: após o sucesso, chama `router.back()` sem limpar o formulário.
- As telas da gestão ficam numa aba oculta (`href: null` em `(administrador)/_layout.tsx`) e não são desmontadas.

### Sugestão

- Recarregar a listagem ao ganhar foco (`useFocusEffect`) e limpar o formulário (`reset()`) após o sucesso.
- Corrigir junto com as #125, #135 e #151 (mesmo padrão de telas ocultas).

### Critérios de aceite

- O novo administrador aparece na listagem logo após o cadastro.
- **Novo** abre sempre com o formulário vazio.
- Reexecutar `CT-HU006-UI-002` e `CT-HU006-UI-004`.

### 📎 Evidência

- Log do backend: `POST /administradores HTTP/1.1" 201 Created`; administrador id 5 presente em `GET /administradores` pela API enquanto a tela não o exibia.
