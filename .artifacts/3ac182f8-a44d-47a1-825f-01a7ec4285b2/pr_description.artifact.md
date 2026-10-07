## 📋 Descrição

Resolução de todas as **issues da HU-005 (Edição de Perfil do Aluno e Alteração de E-mail)** e melhorias críticas de sessão (Refresh Token automático), em estrita conformidade com o `guia-validacao-formularios.md` e a suíte de testes de UI.

## 🎯 História de Usuário / Épico

- HU/EP: **HU-005** (Edição de Perfil do Aluno)

## 🔨 Correções e Melhorias Realizadas (`HU-005`)

- **Validação e Máscara de Telefone no Perfil (`BUG-HU005-UI-003`, `MELHORIA-HU005-UI-002`):**
  - Reutilização do rigoroso `telefoneSchema` do cadastro (`alunoSchema.ts`) em `perfilSchema.ts` (`editarPerfilSchema`), validando DDD + 9 dígitos começando com 9 e exibindo mensagens amigáveis em PT-BR (sem erros técnicos em inglês).
- **Gerenciamento de Estado ao Reabrir Editar Perfil (`BUG-HU005-UI-004`):**
  - Recarregamento automático dos dados reais do perfil do banco (`userService.getProfile()`) ao focar na tela de edição.
  - Adicionada confirmação de saída na seta de voltar (`AppPopup`: *"Sair desta tela?"* / *"As alterações não salvas serão perdidas"*).
- **Sanitização de E-mail ao Alterar (`BUG-HU005-UI-005`):**
  - Atualização do `alterarEmailSchema` e do campo de novo e-mail (`alterar-email.tsx`) aplicando sanitização automática com `.trim().toLowerCase()` e normalização no `onBlur`.
- **Renovação Automática de Sessão / Refresh Token (`BUG-HU005-UI-005`):**
  - Implementado o mecanismo de Refresh Token automático no interceptador do Axios (`api.ts`). Quando o token expira após 15 minutos, o app renova a sessão de forma 100% transparente utilizando o `token_atualizacao` e repete a requisição original.

## 🧪 Como testar

1. **Testar Edição de Perfil e Validação de Telefone:**
   - Acesse **Meu Perfil** ➔ **Editar perfil**.
   - Tente digitar um telefone inválido e confirme o bloqueio com mensagem em português. Insira um número válido e salve.
2. **Testar Alteração de E-mail:**
   - Acesse **Alterar endereço de e-mail**, preencha um novo e-mail com espaços nas pontas e a senha atual. Confirme a alteração bem-sucedida.
3. **Testar Confirmação de Saída:**
   - Altere dados em *Editar perfil* sem salvar e toque na seta `←` para verificar o pop-up de confirmação de descarte de alterações.

## 🔗 Comunicação App ↔ API

- [ ] Não se aplica
- [ ] Novo endpoint
- [x] Endpoint alterado
- [x] Contrato de dados alterado

*Descrição das alterações:*
- Integração e correções nos endpoints `PATCH /usuarios/me`, `PATCH /usuarios/me/email` e `POST /auth/refresh`.

## ✅ Checklist

- [x] Testei localmente
- [x] Testes automatizados / typecheck passando
- [x] Não existem erros no console
- [x] Documentação atualizada, se necessário
- [x] Branch atualizada com `develop`
- [x] Código revisado
