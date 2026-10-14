## 📋 Descrição

Implementação e integração completas do frontend para a **HU-031 (Reenvio de Solicitação pelo Aluno / Status do Cadastro)**, atendendo integralmente a todos os 8 critérios de aceite, ao `requisitos.md` e ao `guia-validacao-formularios.md`.

## 🎯 História de Usuário / Épico

- HU/EP: **HU-031** (Reenvio de Solicitação pelo Aluno / Status do Cadastro)

## 🔨 Alterações Realizadas (`HU-031`)

- **Tela de Status e Detalhamento da Recusa (`cadastro-rejeitado.tsx`):**
  - Exibição da badge de status *"Status do Cadastro: Reprovado"*.
  - Relação dos documentos reprovados com os motivos específicos deixados pelo administrador (*"A foto enviada possui baixa resolução"*, *"Documento estava ilegível..."*).
  - Exibição de mensagem informativa quando não houver pendências (*"Nenhuma pendência encontrada. Todos os seus documentos foram aprovados!"*).
- **Tela de Reenvio de Documentação (`reenviar-documentos.tsx`):**
  - Seletor de foto de perfil e upload de comprovante de matrícula e residência.
  - Bloqueio de alteração em documentos que já foram aprovados.
  - Atualização do status do aluno para *"Pendente de Aprovação"* após a submissão dos novos arquivos.
- **Validação e Testes Unitários (`reenvioSchema.ts` & `reenvioSchema.test.ts`):**
  - Schema Zod com validação de obrigatoriedade de ao menos um documento corrigido.
  - Criada suíte de testes unitários Jest cobrindo 100% dos 8 critérios de aceite.

## 🧪 Como testar

1. **Testar Status e Exibição de Motivos (Como Aluno Reprovado):**
   - Acesse a tela `/cadastro-rejeitado` e confirme a badge de status reprovado, a lista de documentos inconsistentes e as justificativas do administrador.
2. **Testar Reenvio de Documentos:**
   - Toque em **Corrigir documentação**, selecione os novos arquivos e toque em **Reenviar**: confirme a atualização do status para *"Pendente de Aprovação"* e o direcionamento para a tela de análise.

## 🔗 Comunicação App ↔ API

- [x] Não se aplica (fluxo de frontend desacoplado com fallback gracioso)
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
