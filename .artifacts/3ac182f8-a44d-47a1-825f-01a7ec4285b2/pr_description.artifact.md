## 📋 Descrição

Implementação, refinamento e correções completas para a **HU-006 (Gerenciamento de Administradores e Painel do Administrador)**, garantindo conformidade total com os protótipos, utilização exclusiva de dados reais do banco de dados e correção de bugs visuais de navegação e métricas.

## 🎯 História de Usuário / Épico

- HU/EP: **HU-006** (Gerenciamento de Administradores)

## 🔨 Correções e Melhorias Realizadas (`HU-006`)

- **Correção da Barra de Navegação Inferior (Tab Bar):**
  - Remoção de abas duplicadas ou extras geradas na raiz do grupo no `_layout.tsx`, garantindo que o painel exiba **exatamente os 4 botões oficiais do protótipo**: *Painel*, *Cadastros*, *Logística* e *Mais*.
- **Remoção de Dados Mockados no Painel Principal (`home.tsx`):**
  - Substituição dos números estáticos anteriores por consultas dinâmicas e reais ao PostgreSQL (`/usuarios/alunos?status=pendente` e `ativado`) para as métricas de solicitações pendentes e alunos ativos.
- **Prevenção de Auto-Inativação (AC-06 / FA-002):**
  - Implementada validação síncrona que bloqueia a tentativa de um administrador inativar a própria conta atualmente em uso, exibindo o pop-up com a mensagem *"Não é possível inativar a conta atualmente em uso."*.
- **Tratamento de E-mail Duplicado (AC-03):**
  - Captura robusta de erro HTTP 409 ao cadastrar ou editar administradores, exibindo o aviso padronizado *"Este e-mail já está em uso por outro usuário no sistema."*.
- **Refinamento das Telas de Gestão:**
  - Ajuste visual e de fluxo nas telas de listagem, aba *Promover Aluno*, aba *Novo Cadastro*, edição e reativação com pop-ups estilizados (`AppPopup`) em conformidade com o design system e protótipos.

## 🧪 Como testar

1. **Testar Painel e Métricas Reais:**
   - Faça login como Administrador (`maria.barros@alu.ufc.br` / `Aluno123!`).
   - Confira o Painel principal exibindo as contagens reais de alunos ativos e solicitações pendentes obtidas do banco.
2. **Testar Barra Inferior:**
   - Verifique o menu inferior exibindo exatamente as 4 abas oficiais (*Painel*, *Cadastros*, *Logística*, *Mais*).
3. **Testar Gestão de Administradores e Auto-Inativação:**
   - Acesse **Gestão de administradores**. Tente inativar sua própria conta e confirme o bloqueio com mensagem clara. Inative outro admin e teste a reativação.
4. **Testar Cadastro / Promoção:**
   - Toque em **+ Novo**, navegue pelas abas *Promover Aluno* e *Novo Cadastro* e teste a validação de e-mail duplicado.

## 🔗 Comunicação App ↔ API

- [ ] Não se aplica
- [ ] Novo endpoint
- [x] Endpoint alterado
- [x] Contrato de dados alterado

*Descrição das alterações:*
- Integração e correções nos endpoints `GET /administradores`, `POST /administradores`, `POST /administradores/promover`, `PATCH /administradores/{id}`, `PATCH /administradores/{id}/inativar` e listagem de alunos.

## ✅ Checklist

- [x] Testei localmente
- [x] Testes automatizados / typecheck passando
- [x] Não existem erros no console
- [x] Documentação atualizada, se necessário
- [x] Branch atualizada com `develop`
- [x] Código revisado
