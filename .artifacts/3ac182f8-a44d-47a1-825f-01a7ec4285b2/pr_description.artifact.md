## 📋 Descrição

Adequação e alinhamento do gerenciamento da frota de ônibus (**HU-009**) aos cenários oficiais do BDD (`HU-009.feature`), incluindo normalização automática de placas (minúsculas e hífens), validação estrita de assentos e capacidade em pé, bloqueio de inativação para veículos escalados em rotas futuras e suíte de testes unitários com 100% de aprovação.

## 🎯 História de Usuário / Épico

- HU/EP: **HU-009** (Gerenciamento da Frota / Ônibus)

## 🔨 Alterações Realizadas (`HU-009`)

- **Validação Zod e Normalização de Placa (`frotaSchema.ts`):**
  - Aplicação de regex e normalização automática para placas Mercosul/antigas (ex: `qxd2e45` e `QXD-2E45` -> `QXD2E45`).
  - Validações de limites de assentos (> 0) e alunos em pé (>= 0) com as mensagens exatas do BDD (`"A quantidade de assentos deve ser maior que zero"`, `"A capacidade em pé não pode ser negativa"`).
- **Tratamento de Mensagens e Conflitos (`cadastrar.tsx` & `editar.tsx`):**
  - Mapeamento direto de mensagens de erro para placas duplicadas (`"Este veículo já está registrado."`) e inativação bloqueada por rotas futuras (`"Este veículo possui alocações pendentes e não pode ser inativado no momento."`).
- **Suíte de Testes BDD (`frotaSchema.test.ts`):**
  - Cobertura automatizada de todos os cenários e esquemas do arquivo `HU-009.feature`.

## 🧪 Como testar

1. **Testar Normalização de Placas:**
   - Acesse **Gestão de Cadastros** ➔ **Frota** ➔ **+ Novo** e digite `qxd2e45` ou `ABC-1234`. Confirme que a placa é salva normalizada como `QXD2E45` e `ABC1234`.
2. **Testar Validações do BDD:**
   - Tente salvar com assentos `0` ou `-1` em pé e confirme as mensagens de validação do formulário.

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
