# Issues — HU-001 — Testes manuais de UI

Issues abertas a partir da execução da suíte [UI-HU-001](../UI-HU-001.md). Total: 24.

| # | Issue | Tipo | Severidade | Casos |
|---:|---|---|---|---|
| 1 | [Confirmação de senha divergente permite avançar e o erro só aparece na etapa 1 depois de concluir](BUG-HU001-UI-029-confirmacao-senha-divergente-avanca.md) | Bug funcional / validação | 🔴 Crítica | CT-HU001-UI-029, CT-HU001-UI-032 |
| 2 | [Turno do curso sem as opções aceitas pela API impede concluir o cadastro](BUG-HU001-UI-002-turno-curso-invalido.md) | Bug funcional | 🟠 Alta | CT-HU001-UI-002 |
| 3 | [Teclado cobre campos, mensagens de erro e o botão Avançar nas etapas 1 e 3](BUG-HU001-UI-007-teclado-cobre-campos.md) | Bug de UX | 🟠 Alta | CT-HU001-UI-007 |
| 4 | [Erros da API aparecem como “[object Object]” no alerta do cadastro](BUG-HU001-UI-006-mensagem-erro-object-object.md) | Bug funcional / tratamento de erros | 🟠 Alta | CT-HU001-UI-006, CT-HU001-UI-009 |
| 5 | [Validações só ocorrem no envio final, e não na etapa em que o dado é informado](BUG-HU001-UI-009-validacao-tardia-no-envio.md) | Bug de validação | 🟠 Alta | CT-HU001-UI-009, CT-HU001-UI-013, CT-HU001-UI-031, CT-HU001-UI-033 |
| 6 | [Mensagens de validação aparecem em inglês para o usuário](BUG-HU001-UI-009-mensagens-validacao-em-ingles.md) | Bug de UX | 🟡 Média | CT-HU001-UI-009, CT-HU001-UI-013, CT-HU001-UI-031 |
| 7 | [Data de nascimento aceita datas inexistentes, como 31/02/2002 e 99/99/9999](BUG-HU001-UI-033-data-nascimento-sem-validacao.md) | Bug de validação | 🟡 Média | CT-HU001-UI-033 |
| 8 | [Nome com hífen é rejeitado pelo app, embora o backend aceite](BUG-HU001-UI-018-nome-com-hifen-rejeitado.md) | Bug de validação | 🟡 Média | CT-HU001-UI-018 |
| 9 | [Nome com apóstrofo, como D'Ávila, é rejeitado](BUG-HU001-UI-017-nome-com-apostrofo-rejeitado.md) | Bug de validação | 🟡 Média | CT-HU001-UI-017 |
| 10 | [Nome com iniciais isoladas, como “A B”, é aceito como nome completo](BUG-HU001-UI-011-nome-com-iniciais-aceito.md) | Bug de validação | 🟡 Média | CT-HU001-UI-011 |
| 11 | [Opção “Anterior” no período de ingresso grava um período inventado](BUG-HU001-UI-043-periodo-anterior-grava-valor-inventado.md) | Bug funcional / integridade de dados | 🟡 Média | CT-HU001-UI-043 |
| 12 | [Termos de uso sem LGPD e com texto provisório em outro idioma](BUG-HU001-UI-051-termos-sem-lgpd-texto-provisorio.md) | Bug funcional / conteúdo | 🟡 Média | CT-HU001-UI-051 |
| 13 | [Caixa de aceite dos termos não aparece na tela](BUG-HU001-UI-052-caixa-aceite-invisivel.md) | Bug de UX | 🟡 Média | CT-HU001-UI-052 |
| 14 | [Mensagem de erro da senha sobrepõe os outros campos](BUG-HU001-UI-031-mensagem-senha-sobrepoe-campos.md) | Bug de UX / layout | 🟢 Baixa | CT-HU001-UI-031 |
| 15 | [Validação da data de nascimento dispara já no primeiro dígito digitado](BUG-HU001-UI-033-validacao-data-durante-digitacao.md) | Bug de UX | 🟢 Baixa | CT-HU001-UI-033 |
| 16 | [Seta do seletor não abre a lista de opções](BUG-HU001-UI-043-seta-seletor-nao-abre.md) | Bug de UX | 🟢 Baixa | CT-HU001-UI-043 |
| 17 | [Semestre atual vai só até o 10º, mas o backend aceita até o 16º](DISCUSSAO-HU001-UI-044-limite-semestre-atual.md) | Divergência de requisito — discutir com o time | 🟡 Média | CT-HU001-UI-044 |
| 18 | [Períodos de ingresso fixos e desatualizados no seletor](MELHORIA-HU001-UI-043-periodos-de-ingresso-fixos.md) | Melhoria | 🟡 Média | CT-HU001-UI-043 |
| 19 | [Período de ingresso e semestre atual não são validados entre si](MELHORIA-HU001-UI-043-coerencia-periodo-semestre.md) | Melhoria | 🟢 Baixa | CT-HU001-UI-043 |
| 20 | [Lista de cursos limitada e “Outro” sem campo para informar o curso](MELHORIA-HU001-UI-043-lista-de-cursos-autocomplete.md) | Melhoria | 🟡 Média | CT-HU001-UI-043 |
| 21 | [Máscara do WhatsApp com DDD e 9 dígitos, aceitando só números](MELHORIA-HU001-UI-039-mascara-whatsapp.md) | Melhoria | 🟢 Baixa | CT-HU001-UI-039, CT-HU001-UI-040, CT-HU001-UI-041, CT-HU001-UI-042 |
| 22 | [Aceitar e-mail com espaços nas pontas, removendo-os antes de validar](MELHORIA-HU001-UI-019-trim-email.md) | Melhoria | 🟢 Baixa | CT-HU001-UI-019 |
| 23 | [Validar tamanho e formato do arquivo na seleção e informar o limite](MELHORIA-HU001-UI-050-validacao-arquivo-na-selecao.md) | Melhoria | 🟡 Média | CT-HU001-UI-050 |
| 24 | [Pesquisar uma base oficial de cursos para alimentar a lista de cursos](IDEIA-HU001-UI-043-base-oficial-de-cursos.md) | Ideia futura | 🟢 Baixa | CT-HU001-UI-043 |
