## 📋 Descrição

Resolução de inconsistências de navegação e exibição no painel administrativo e na renovação de vínculo de alunos: exibição da foto de perfil do aluno na análise de solicitações, garantia estrita dos 4 botões no menu inferior do administrador, dinâmica do cartão de aviso de renovação e ajuste de URL base da API.

## 🎯 História de Usuário / Épico

- HUs: **HU-006, HU-027, HU-028** (Gestão Administrativa, Avaliação de Solicitações e Renovação de Vínculo)

## 🔨 Correções e Melhorias Realizadas

- **Exibição da Foto do Aluno na Análise de Solicitações (`HU-027`):**
  - Adicionado o token JWT de autorização (`?token=${token}` e cabeçalho `Authorization: Bearer ${token}`) para recuperar e renderizar a imagem do avatar armazenada no MinIO/FastAPI.
  - Fallback gracioso para avatar circular com as iniciais estilizadas do nome do aluno (ex: *"MP"*) caso o aluno não possua foto cadastrada.
- **Barra de Navegação Inferior do Administrador (`HU-006`):**
  - Filtro rígido no componente de renderização da barra (`AdminTabBar`) para garantir **exatamente os 4 botões do protótipo**: *Painel*, *Cadastros*, *Logística* e *Mais*, ocultando qualquer rota adicional do Expo Router.
- **Cartão Dinâmico de Aviso de Renovação (`HU-028`):**
  - Renderização condicional do cartão de aviso em `renovar-vinculo.tsx`: exibe em azul suave *"Vínculo institucional ativo"* para alunos aprovados ativos (`status === 'ativado'`), reservando o aviso vermelho de vínculo expirado para contas cuja validade de acesso de 6 meses realmente expirou.
- **Conectividade de Rede no Expo Go (`api.ts`):**
  - Resolução dinâmica da URL base da API utilizando o IP da máquina local via Metro (`Constants.expoConfig?.hostUri`), permitindo requisições de imagens e dados no celular físico e emulador.

## 🧪 Como testar

1. **Testar Análise de Solicitação (Foto do Aluno):**
   - Acesse como Administrador (`maria.barros@alu.ufc.br` / `Aluno123!`), entre na **Fila de solicitações** e abra os detalhes de um aluno: confirme a foto do perfil ou inicial estilizada no avatar.
2. **Testar Barra Inferior do Administrador:**
   - Navegue pelo painel do administrador e confirme que o menu inferior possui estritamente 4 botões (*Painel*, *Cadastros*, *Logística*, *Mais*).
3. **Testar Tela de Renovação de Vínculo:**
   - Com uma conta de aluno ativa, abra **Renovar vínculo institucional** e confirme o cartão em azul suave indicando vínculo ativo.

## 🔗 Comunicação App ↔ API

- [ ] Não se aplica
- [ ] Novo endpoint
- [x] Endpoint alterado
- [x] Contrato de dados alterado

## ✅ Checklist

- [x] Testei localmente
- [x] Testes automatizados / typecheck passando
- [x] Não existem erros no console
- [x] Documentação atualizada, se necessário
- [x] Branch atualizada com `develop`
- [x] Código revisado
