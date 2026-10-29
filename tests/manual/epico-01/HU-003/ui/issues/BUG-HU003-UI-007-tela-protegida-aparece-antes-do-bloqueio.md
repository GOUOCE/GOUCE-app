# Tela de outro perfil aparece por um instante antes do Acesso Negado

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / controle de acesso |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU003-UI-007` |
| **Documentação** | HU-003 — Testes manuais de UI: [CT-HU003-UI-007](../UI-HU-003.md#ct-hu003-ui-007--administrador-abre-tela-do-aluno-por-link) |

---

### Pré-condição

Administrador ativo logado no iPhone (Expo Go).

### Passos para reproduzir

1. No Safari do iPhone, abrir `exp://<IP do computador>:8081/--/carteirinha-digital`.
2. Confirmar a abertura no Expo Go e observar a tela.

### ✅ Resultado esperado

Exibir direto a tela **Acesso Negado**, sem mostrar, nem por um instante, a tela ou dados de outro perfil (AC-05).

### ❌ Resultado obtido

A tela da **carteirinha digital** é desenhada por um instante e só então o app troca para **Acesso Negado** (“Erro 403 - Forbidden”).

O defeito é **intermitente**: numa segunda tentativa, a carteirinha não chegou a ser percebida. A exibição depende do tempo que o app leva para rodar a checagem de perfil.

### ⚠️ Impacto

- O controle de acesso da interface acontece depois que a tela já abriu: o usuário vê componentes de uma área a que não tem permissão.
- Durante esse instante, a carteirinha é montada com os dados da sessão do administrador (nome e e-mail) misturados a valores de exemplo fixos no código (instituição, curso, foto), e gera um QR Code com id, e-mail e o início do token da sessão.
- A tela também dispara requisições à API com o perfil errado (`GET /alunos/me/carteirinha` → 403). A API bloqueia corretamente; o defeito é só no app.
- O mesmo mecanismo vale para qualquer tela de outro perfil. No CT-HU003-UI-005 não foi percebido porque a tela `cadastros` está vazia.

### Causa aparente

- `frontend/src/contexts/AuthContext.tsx`: a checagem de perfil (`roleMatches` → `router.replace('/acesso-negado')`) roda dentro de um `useEffect`, ou seja, depois da renderização da tela.
- Os layouts `(aluno)/_layout.tsx`, `(administrador)/_layout.tsx` e `(representante)/_layout.tsx` não verificam o perfil antes de renderizar as telas.
- `frontend/src/app/(aluno)/carteirinha-digital.tsx` usa valores padrão fixos (`'João Neves'`, `'UFC'`, `'Engenharia de Software'`, foto de exemplo) quando não há dados.

### Sugestão

- Verificar o perfil no `_layout.tsx` de cada grupo e, se não bater, renderizar `<Redirect href="/acesso-negado" />` (ou nada) **antes** de montar as telas.
- Remover da carteirinha os valores de exemplo fixos e não incluir o token no QR Code.

### Critérios de aceite

- Abrir por link uma tela de outro perfil mostra direto **Acesso Negado**, sem desenhar a tela protegida.
- Nenhuma requisição da tela protegida é disparada.
- Reexecutar `CT-HU003-UI-005`, `CT-HU003-UI-007` e `CT-HU003-UI-008`.

### 📎 Evidência
