## 📋 Descrição

Resolução de todas as **issues da HU-029 (Carteirinha Digital do Aluno)**, incluindo a habilitação do atalho na tela inicial, suporte a textos longos sem corte, tratamento de erro 403 para alunos não aprovados, remoção de dados fictícios/mock, suporte a cache offline e QR Code seguro.

## 🎯 História de Usuário / Épico

- HU/EP: **HU-029** (Carteirinha Digital do Aluno)

## 🔨 Correções e Melhorias Realizadas (`HU-029`)

- **Habilitação do Atalho na Tela Início (`BUG-HU029-UI-001`):**
  - Conectada a ação do card *"Carteirinha Digital"* na tela `home.tsx` do aluno para abrir diretamente a rota `/(aluno)/carteirinha-digital`.
- **Suporte a Textos Longos sem Corte (`BUG-HU029-UI-001`):**
  - Removida a limitação de `numberOfLines={1}` nos campos de Nome, E-mail, Curso e Instituição da carteirinha, permitindo que cursos longos como *"Licenciatura em Ciências Biológicas"* apareçam por inteiro.
- **Tratamento de Aluno Não Aprovado / HTTP 403 (`BUG-HU029-UI-002`):**
  - Ao receber status HTTP 403 da API (*"Carteirinha indisponível. Seu cadastro está inativo ou em análise"*), a carteirinha e o QR Code são ocultados e a mensagem padrão do AC-02 é exibida.
- **Remoção de Dados Fictícios e Mocks (`BUG-HU029-UI-003`):**
  - Removidas todas as variáveis estáticas e dados mockados (*'10/09/2026'*, *'João Neves'*, foto do Unsplash), utilizando exclusivamente dados reais retornados pela API/banco de dados.
- **Suporte a Cache Offline da Carteirinha (`BUG-HU029-UI-004`):**
  - Armazenamento da carteirinha do aluno aprovado no `AsyncStorage` (`@GOUOCE:carteirinha_cache`). Quando o dispositivo está sem conexão durante o embarque, a carteirinha é carregada do cache com foto, dados, QR Code e o badge *"Disponível offline"*.
- **QR Code Seguro (`SEGURANCA-HU029-UI-005`):**
  - Removidos trechos do token de sessão do QR Code. O payload contém identificadores seguros de validação do aluno.
- **Testes Unitários:**
  - Criada a suíte `carteirinhaSchema.test.ts` com 100% de aprovação no Jest.

## 🧪 Como testar

1. **Testar Atalho no Início:**
   - Na tela inicial do aluno, toque no card **Carteirinha Digital** e confirme que a carteirinha é aberta.
2. **Testar Aluno Não Aprovado:**
   - Tente abrir a carteirinha com uma conta com status `pendente` ou `analise_renovacao` e confirme a mensagem de bloqueio do AC-02.
3. **Testar Leitura Offline:**
   - Abra a carteirinha com internet. Em seguida, desative a conexão Wi-Fi/dados móveis e abra a carteirinha novamente: confirme o carregamento do cache offline com foto, dados e o badge *"Disponível offline"*.

## 🔗 Comunicação App ↔ API

- [ ] Não se aplica
- [ ] Novo endpoint
- [x] Endpoint alterado
- [x] Contrato de dados alterado

*Descrição das alterações:*
- Consumo e cache do endpoint `GET /alunos/me/carteirinha`.

## ✅ Checklist

- [x] Testei localmente
- [x] Testes automatizados / typecheck passando
- [x] Não existem erros no console
- [x] Documentação atualizada, se necessário
- [x] Branch atualizada com `develop`
- [x] Código revisado
