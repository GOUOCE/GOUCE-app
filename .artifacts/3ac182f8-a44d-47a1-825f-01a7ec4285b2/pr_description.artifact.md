## 📋 Descrição

Resolução de todas as **issues e divergências da HU-028 (Renovação de Vínculo Institucional)**, incluindo o reset automático de estado ao cancelar/reabrir, validação com limite estrito de 5 MB para comprovantes, padronização da confirmação de envio via `AppPopup` e testes unitários com 100% de aprovação.

## 🎯 História de Usuário / Épico

- HU/EP: **HU-028** (Renovação de Vínculo Institucional)

## 锤 Correções e Melhorias Realizadas (`HU-028`)

- **Reset Automático de Estado ao Reabrir ou Cancelar (`BUG-HU028-UI-008`):**
  - Implementação do `useFocusEffect` na tela `renovar-vinculo.tsx` para reiniciar os passos (`passo = 0`) e limpar o formulário sempre que a tela ganha foco ou ao confirmar o cancelamento.
- **Validação de Obrigatoriedade e Limite de 5 MB (`MELHORIA-HU028-UI-002`):**
  - Criação do `fileSchema5MB` em `alunoSchema.ts` para impor o limite estrito de **5 MB** exigido pelo AC-03 e pela BDD (`HU-028.feature`), exibindo mensagens claras para arquivo ausente, formato inválido e tamanho excedido.
- **Confirmação Estilizada de Envio (`MELHORIA-HU028-UI-003`):**
  - Substituição do aviso preto de rodapé (*Snackbar*) pelo componente **`AppPopup`**:
    - **Título:** `"Comprovante enviado com sucesso"`
    - **Mensagem:** `"Sua solicitação de renovação foi enviada para análise da coordenação."`
    - **Ação:** A tela só fecha e retorna para o perfil após o aluno tocar em **Entendido**.
- **Logins de Alunos com Vínculo Expirado (`BUG-HU028-API-002`):**
  - Liberação do login de alunos com vínculo expirado para visualizarem o badge no perfil e abrirem a tela de renovação sem bloqueios de API.

## 🧪 Como testar

1. **Testar Reset de Estado ao Cancelar:**
   - Acesse **Meu Perfil** ➔ **Renovar vínculo institucional**, avance para o passo 2 ou 3 e toque no ícone `X`. Confirme o cancelamento e abra a renovação novamente: a tela iniciará do zero (passo 0).
2. **Testar Validação de Comprovante de 5 MB:**
   - No passo 4 da renovação, tente enviar sem anexar o comprovante (mensagem de obrigatoriedade) ou anexe um arquivo maior que 5 MB (mensagem de limite de tamanho).
3. **Testar Confirmação de Sucesso:**
   - Conclua o envio da renovação com um arquivo válido e confirme a exibição do `AppPopup` estilizado com o título de sucesso.

## 🔗 Comunicação App ↔ API

- [ ] Não se aplica
- [ ] Novo endpoint
- [x] Endpoint alterado
- [x] Contrato de dados alterado

*Descrição das alterações:*
- Ajustes na validação de arquivo e estado do aluno para `PATCH /alunos/me/renovar`.

## ✅ Checklist

- [x] Testei localmente
- [x] Testes automatizados / typecheck passando
- [x] Não existem erros no console
- [x] Documentação atualizada, se necessário
- [x] Branch atualizada com `develop`
- [x] Código revisado
