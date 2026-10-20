## 📋 Descrição

Integração completa do serviço de faculdades do frontend com os endpoints reais da API FastAPI/PostgreSQL para a **HU-008 (Gerenciamento de Faculdades)**, permitindo listagem, criação, edição, inativação e reativação em tempo real com fallback Gracioso para funcionamento offline, em conformidade com o `requisitos.md` e o `guia-validacao-formularios.md`.

## 🎯 História de Usuário / Épico

- HU/EP: **HU-008** (Gerenciamento de Faculdades)

## 锤 Alterações Realizadas (`HU-008`)

- **Integração Real App ↔ API (`faculdadeService.ts`):**
  - Conexão do método `listarFaculdades` com o endpoint `GET /faculdades`.
  - Conexão do método `criarFaculdade` com o endpoint `POST /faculdades` (com tratamento de erro HTTP 409 *"Esta faculdade já está cadastrada."*).
  - Conexão do método `atualizarFaculdade` com o endpoint `PATCH /faculdades/{id}`.
  - Conexão dos métodos `inativarFaculdade` e `reativarFaculdade` com os endpoints `PATCH /faculdades/{id}/inativar` e `PATCH /faculdades/{id}/ativar` (com validação de erro HTTP 422 para viagens programadas pendentes).
  - Fallback gracioso mantido para execuções e testes unitários offline.

## 🧪 Como testar

1. **Testar Comunicação Real com a API:**
   - Com o backend no Docker ativo, acesse como Administrador **Gestão de Cadastros** ➔ **Faculdades**.
   - Crie uma nova faculdade (ex: *UFC - Campus Sobral*) e confirme o retorno `201 Created` e a listagem atualizada do banco relacional PostgreSQL.
2. **Testar Bloqueio por Viagens Pendentes:**
   - Tente inativar a faculdade com viagens programadas e confirme a exibição do alerta oficial *"Esta instituição possui viagens programadas pendentes. Não é possível inativar no momento."*.

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
