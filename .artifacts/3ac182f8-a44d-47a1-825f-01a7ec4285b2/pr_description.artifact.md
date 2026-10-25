## 📋 Descrição

Correção na listagem de alunos elegíveis para promoção a administrador (**HU-006**). O serviço `adminService.listarAlunosAprovados` foi atualizado para cruzar a listagem de alunos ativos com os administradores já cadastrados, ocultando automaticamente discentes que já possuem perfil administrativo para evitar duplicidade na interface e tentativas inválidas de promoção.

## 🎯 História de Usuário / Épico

- HU/EP: **HU-006** (Gerenciamento de Administradores / Promoção de Alunos)

## 🔨 Alterações Realizadas (`HU-006` - Fix Issue)

- **Filtro de Exclusão em `adminService.ts`:**
  - Consulta simultânea de `GET /usuarios/alunos?status=ativado` e `GET /administradores`.
  - Cruzamento por ID e e-mail para excluir da listagem de alunos elegíveis qualquer usuário que já conste como administrador ativo.

## 🧪 Como testar

1. **Testar Promoção e Ocultação:**
   - Acesse **Gestão de administradores** ➔ **Cadastrar** ➔ **Promover aluno**.
   - Promova um aluno a administrador e confirme.
   - Retorne à tela de promoção: confirme que o aluno promovido não aparece mais na lista de elegíveis.

## 🔗 Comunicação App ↔ API

- [ ] Não se aplica
- [x] Novo endpoint
- [x] Endpoint alterado
- [x] Contrato de dados alterado

## ✅ Checklist

- [x] Testei localmente
- [x] Testes automatizados / typecheck passando
- [x] Não existem erros no console
- [x] Documentação atualizada, se necessário
- [x] Branch atualizada com `develop`
- [x] Código revisado
