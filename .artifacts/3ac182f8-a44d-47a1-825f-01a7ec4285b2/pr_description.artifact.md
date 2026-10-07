## 📋 Descrição

Implementação e integração completas do frontend para a **HU-027 (Avaliação de Solicitação de Cadastro)**, incluindo a **Fila de Solicitações** do administrador, a tela de **Análise e Avaliação de Cadastro** (com aprovação e recusa detalhada) e o fluxo do aluno para **Reenvio de Documentação**, em conformidade com o `requisitos.md`, os protótipos visuais e a suíte BDD.

## 🎯 História de Usuário / Épico

- HU/EP: **HU-027** (Avaliação de Solicitação de Cadastro)

## 🔨 Alterações Realizadas (`HU-027`)

- **Fila de Solicitações (`solicitacoes/index.tsx`):**
  - Listagem de alunos pendentes obtida dinamicamente do banco de dados via `GET /usuarios/alunos?status=pendente`.
  - Campo de busca por aluno e filtros por chips (*"Todos"*, *"Novos"*, *"Renovações"*).
  - Ícones e badges alinhados com o protótipo.
- **Análise e Avaliação de Solicitação (`solicitacoes/[id].tsx`):**
  - Visualização detalhada de dados pessoais, acadêmicos e documentos anexados.
  - **Aprovação:** Botão *"Aprovar cadastro"* com modal de confirmação (*"Aprovar cadastro?"* / *"Essa ação não poderá ser desfeita"*) integrado à API `PATCH /usuarios/alunos/{aluno_id}/aprovar` e toast de confirmação.
  - **Reprovação:** Botão *"Reprovar cadastro"* com o modal *"Detalhar Recusa"* (seleção de documentos e campo de motivo obrigatório com no mínimo 5 caracteres) integrado à API `PATCH /usuarios/alunos/{aluno_id}/status`.
- **Fluxo de Aluno Rejeitado e Reenvio (`cadastro-rejeitado.tsx` e `reenviar-documentos.tsx`):**
  - Exibição das observações de recusa deixadas pelo administrador (*"Opa! Precisamos que você ajuste algumas coisas"*) quando o aluno loga com status `rejeitado`.
  - Formulário para seleção e reenvio de nova foto de perfil, comprovante de matrícula e comprovante de residência.
- **Validação e Testes Unitários (`solicitacaoSchema.ts` e `solicitacaoSchema.test.ts`):**
  - Validação Zod para o motivo de reprovação e seleção de documentos.
  - Testes unitários no Jest aprovados com 100% de cobertura.

## 🧪 Como testar

1. **Testar Fila e Aprovação (Como Administrador):**
   - Faça login como Administrador (`maria.barros@alu.ufc.br` / `Aluno123!`).
   - Acesse **Fila de solicitações** no Painel, selecione o aluno pendente e teste a aprovação com confirmação no modal.
2. **Testar Reprovação e Reenvio:**
   - Na análise de solicitação de um aluno, toque em *Reprovar cadastro*, selecione os documentos incorretos e digite a justificativa.
   - Faça login com o e-mail do aluno reprovado e confirme a exibição da tela de ajustes necessários com as observações do administrador.

## 🔗 Comunicação App ↔ API

- [ ] Não se aplica
- [ ] Novo endpoint
- [x] Endpoint alterado
- [x] Contrato de dados alterado

*Descrição das alterações:*
- Integração com `GET /usuarios/alunos?status=pendente`, `GET /alunos/{id}`, `PATCH /usuarios/alunos/{aluno_id}/aprovar` e `PATCH /usuarios/alunos/{aluno_id}/status`.

## ✅ Checklist

- [x] Testei localmente
- [x] Testes automatizados / typecheck passando
- [x] Não existem erros no console
- [x] Documentação atualizada, se necessário
- [x] Branch atualizada com `develop`
- [x] Código revisado
