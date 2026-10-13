## 📋 Descrição

Implementação e integração completas do frontend para a **HU-007 (Gerenciamento de Bairros e Pontos de Parada)**, incluindo as telas de listagem, cadastro e edição de bairros com pontos de parada associados, validação de nome único, bloqueio de inativação para bairros vinculados a rotas ativas e suíte de testes unitários com 100% de aprovação, em conformidade com o `requisitos.md`, o `guia-validacao-formularios.md` e os protótipos visuais.

## 🎯 História de Usuário / Épico

- HU/EP: **HU-007** (Gerenciamento de Bairros e Pontos de Parada)

## 🔨 Alterações Realizadas (`HU-007`)

- **Tela de Listagem (`bairros/index.tsx`):**
  - Exibição de bairros ativos e inativos com suas respectivas contagens de pontos de parada.
  - Alternador de exibição de inativos, busca por nome e ações de edição (`Pencil`), inativação (`Trash2`) e reativação (`RotateCcw`).
  - **Bloqueio de Rota Ativa:** Ao tentar inativar um bairro atrelado a uma rota ativa (ex: *Centro*), exibe o pop-up com a mensagem do requisito *"Este bairro não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar."*.
- **Tela de Cadastro de Bairro (`bairros/cadastrar.tsx`):**
  - Campo obrigatório de Nome do Bairro e adição/remoção de múltiplos pontos de parada via modal.
  - Validação Zod para impedir bairros ou pontos sem nome ou duplicados (*"Esta localidade já está cadastrada."*).
- **Tela de Edição de Bairro (`bairros/editar.tsx`):**
  - Pré-preenchimento dos dados existentes e ajuste dinâmico de pontos de parada associados.
- **Serviço e Regras de Negócio (`bairroService.ts`):**
  - Gerenciamento de bairros e pontos de parada com validação de duplicidade e regra de soft delete.
- **Validação e Testes Unitários (`bairroSchema.ts` & `bairroSchema.test.ts`):**
  - Schema Zod e testes unitários cobrindo 100% dos 9 critérios de aceite.

## 🧪 Como testar

1. **Testar Acesso e Listagem:**
   - Como Administrador, acesse **Gestão de Cadastros** ➔ **Bairros e pontos de parada**: visualize os bairros cadastrados e teste a busca e o filtro de inativos.
2. **Testar Cadastro e Edição:**
   - Toque em **+ Novo**, informe o nome do bairro e adicione pelo menos um ponto de parada. Em seguida, edite um bairro existente.
3. **Testar Bloqueio de Inativação por Rota Ativa:**
   - Tente inativar o bairro *Centro* e confirme o bloqueio com a mensagem de aviso de rota ativa.

## 🔗 Comunicação App ↔ API

- [x] Não se aplica (fluxo de frontend desacoplado com mock service para funcionamento offline/standalone)
- [ ] Novo endpoint
- [ ] Endpoint alterado
- [ ] Contrato de dados alterado

## ✅ Checklist

- [x] Testei localmente
- [x] Testes automatizados / typecheck passando
- [x] Não existem erros no console
- [x] Documentação atualizada, se necessário
- [x] Branch atualizada com `develop`
- [x] Código revisado
