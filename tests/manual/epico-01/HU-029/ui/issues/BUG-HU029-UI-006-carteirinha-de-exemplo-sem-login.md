# Sem login, o link da carteirinha mostra por um instante uma carteirinha de exemplo

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional / controle de acesso |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo Go) |
| **Caso relacionado** | `CT-HU029-UI-006` |
| **Documentação** | HU-029 — Testes manuais de UI: [CT-HU029-UI-006](../UI-HU-029.md#ct-hu029-ui-006--carteirinha-após-sair-da-conta) |
| **Issue relacionada** | #111 — tela de outro perfil aparece antes do Acesso Negado (mesmo mecanismo); [BUG-HU029-UI-003-emissao](BUG-HU029-UI-003-data-de-emissao-e-valores-fixos.md) — valores de exemplo no código |

---

### Pré-condição

Nenhum usuário logado (o aluno saiu pelo **Sair**) e o app **fechado**.

### Passos para reproduzir

1. No Safari do iPhone, abrir `exp://<IP do computador>:8081/--/carteirinha-digital`.
2. Confirmar a abertura no Expo Go e observar a primeira tela.

### ✅ Resultado esperado

Sem sessão, o app vai direto para o login, sem desenhar a carteirinha (nem por um instante).

### ❌ Resultado obtido

Por um instante aparece uma carteirinha completa do aluno de exemplo **“João Neves”** (foto de banco de imagens, curso, instituição, e-mail de exemplo e QR Code); em seguida, o app vai para o login. Com o app já aberto, o link vai direto para o login.

### ⚠️ Impacto

- Qualquer pessoa, sem conta, consegue ver e capturar uma carteirinha com aparência válida.
- Mesmo sem dados reais, é um documento falso exibido pelo próprio app.

### Causa aparente

- A tela `frontend/src/app/(aluno)/carteirinha-digital.tsx` é desenhada antes de o `AuthContext` carregar a sessão e redirecionar (o controle de acesso roda num `useEffect`, depois da renderização — mesmo mecanismo da #111).
- Sem usuário, a tela usa os valores de exemplo fixos (`'João Neves'`, `'joao@email.com'`, `'UFC'`, `'Campus Quixadá'`, foto do Unsplash).

### Sugestão

- Verificar a sessão no `_layout.tsx` da área do aluno e só renderizar as telas depois que o carregamento terminar e houver usuário (`<Redirect>` para o login caso contrário).
- Remover os valores de exemplo da carteirinha.

### Critérios de aceite

- Sem login, o link da carteirinha nunca desenha a carteirinha, com o app aberto ou fechado.
- Reexecutar `CT-HU029-UI-006`.

### 📎 Evidência

- Gravação de tela feita pelo testador em 06/10/2026 (não anexada).
