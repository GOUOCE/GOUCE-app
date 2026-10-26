## 📋 Descrição

Integração completa do frontend de gerenciamento de rotas principais com os endpoints reais da API FastAPI/PostgreSQL para a **HU-011 (Gerenciamento de Rotas Principais)**, permitindo listagem, criação, edição, inativação e reativação em tempo real com suporte a turnos independentes de ida e volta e fallback gracioso para execução offline.

## 🎯 História de Usuário / Épico

- HU/EP: **HU-011** (Gerenciamento de Rotas Principais)

## 🔨 Alterações Realizadas (`HU-011` - Integração App ↔ API)

- **Serviço e Conexão Real (`rotaPrincipalService.ts`):**
  - Conexão do método `listarRotasPrincipais` com o endpoint `GET /rotas-principais` (com parâmetros `incluir_inativos` e `nome`).
  - Conexão dos métodos `listarFaculdadesAtivas` e `listarBairrosAtivos` com o endpoint `GET /rotas-principais/opcoes`.
  - Conexão do método `criarRotaPrincipal` com `POST /rotas-principais`.
  - Conexão do método `atualizarRotaPrincipal` com `PATCH /rotas-principais/{id}`.
  - Conexão dos métodos `inativarRotaPrincipal` e `reativarRotaPrincipal` com `PATCH /rotas-principais/{id}/inativar` e `PATCH /rotas-principais/{id}/reativar` (tratando HTTP 409 para agendamentos pendentes).

## 🧪 Como testar

1. **Testar Listagem e Operações com API Real:**
   - Com o backend no Docker ativo, acesse como Administrador **Gestão de Cadastros** ➔ **Rotas principais**.
   - Crie uma nova rota principal com horários e faculdades de ida/volta independentes e confirme o retorno `201 Created` e a persistência no PostgreSQL.

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
