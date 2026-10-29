# Senha é passada como parâmetro de rota entre o login e a seleção de perfil

| Campo | Valor |
|---|---|
| **Tipo** | Segurança |
| **Severidade** | 🟡 Média |
| **Ambiente** | Desenvolvimento — app mobile no iPhone (Expo); afeta mais a versão web |
| **Caso relacionado** | Observação da suíte (fluxo dos `CT-HU002-UI-009` e `CT-HU002-UI-010`) |
| **Documentação** | HU-002 — Testes manuais de UI: [Observações gerais](../UI-HU-002.md#observações-gerais) |
| **Issue relacionada** | [BUG-HU002-UI-009-perfil-escolhido-ignorado](BUG-HU002-UI-009-perfil-escolhido-ignorado.md) |

---

### Pré-condição

Usuário sem sessão autenticada na tela **Entrar**.

### Passos para reproduzir

1. Informar e-mail e senha e tocar em **Entrar**.
2. Na versão web, observar a barra de endereço da tela **Como você quer entrar?**.

### ✅ Resultado esperado

A senha fica só na memória da tela em que foi digitada (ou é enviada direto para a API) e nunca aparece em URL, histórico ou estado de navegação.

### ❌ Resultado obtido

A tela de login navega para a seleção de perfil levando `email` e `senha` como parâmetros de rota. Na versão web, eles aparecem na URL (`/selecao-perfil?email=...&senha=...`).

### ⚠️ Impacto

- **Web:** a senha fica visível na barra de endereço e gravada no histórico do navegador; pode ir parar em logs de servidor, proxies e ferramentas de análise.
- **Mobile:** não aparece para o usuário, mas a senha fica no estado de navegação do app, que pode ser registrado em logs, ferramentas de depuração ou links profundos (deep links). É má prática mesmo sem URL visível.
- Quem pegar o celular desbloqueado na tela de seleção de perfil pode voltar e reutilizar as credenciais.

### Causa aparente

- `frontend/src/app/(autenticacao)/login.tsx`: `onSubmit` faz `router.push({ pathname: '/(autenticacao)/selecao-perfil', params: { email, senha } })`.
- `frontend/src/app/(autenticacao)/selecao-perfil.tsx`: lê `senha` de `useLocalSearchParams` para chamar o `signIn`.

### Sugestão

- Resolver junto com a [#99 / BUG-HU002-UI-009](BUG-HU002-UI-009-perfil-escolhido-ignorado.md): se o perfil for escolhido **antes** das credenciais (como preveem o AC-08 e o BDD), a tela de login já sabe o perfil e chama a API direto, sem repassar a senha.
- Alternativa: guardar as credenciais em memória (estado/contexto) só durante a seleção e limpar logo depois do login.

### Critérios de aceite

- A senha não aparece em parâmetros de rota, URL nem histórico, no mobile e na web.
- O login continua funcionando para todos os perfis.

### 📎 Evidência
