# Testes manuais de API — HU-012 — Gerenciamento de Rotas Complementares

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Gestão de Rotas e Horários (EP-003) |
| Funcionalidade | HU-012 — Gerenciamento de Rotas Complementares |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial (baseada em risco), planejada antes da implementação |
| Endpoints | Não publicados na base analisada. Mapear OP-LISTAR, OP-CONSULTAR, OP-CADASTRAR, OP-EDITAR, OP-INATIVAR e OP-REATIVAR em [api/README.md](README.md) com o contrato real antes de executar. |
| Ambiente | A preencher — URL, branch e commit da implementação |
| Total de casos | 13 |
| Última execução | Não realizada |
| Testador | Cauan Ricardo — execução com apoio de IA (Claude Code) |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 13 | 0 | 0 | 0 | 0 | 13 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | A camada da HU-012 deve existir na branch escolhida para execução; na base `5554bc90` ela não foi identificada. Este é planejamento, sem stack/testes. Na execução futura usar ambiente isolado; sem funcionalidade, registrar 🚫 nas partes dependentes. |
| PC-02 | Administrador A do seed, autenticado via `POST /auth/login`; anotar id e horário para auditoria. Usar Postman/Insomnia ou Swagger /docs. |
| PC-03 | Credenciais de aluno aprovado/ativo e representante ativo; falha de login bloqueia somente a respectiva variação. Sessão vencida exige novo login antes de repetir o passo. |
| PC-04 | Principais com dados-base válidos: RP-A Rota Centro - UFC ativa (06:30/17:30), RP-B Rota Integrada ativa e RP-0 Rota Antiga inativa. RC0 Van Antiga inativa vinculada a RP-A ativa; RC1 Van 2 - Bairro Novo criada no CT-002 com saída 06:00 e conexão Trevo do Bairro Novo. Usar ids distintos e registrar o identificador de cada tipo; preparar massa via HU-011/API/banco local se necessário, anotando origem sem contar como aprovação funcional. |
| PC-05 | **Apoio da IA (Claude Code)** para executar API com validação de Cauan e conferir persistência, vínculo correto, estados e auditoria na API/banco e preparar massa local quando necessário. Cauan executa UI; ids de principal e complementar não devem ser confundidos. |
| PC-06 | Preencher métodos/URLs, Content-Type, campos, ids, representação de hora/conexão, respostas e consulta de auditoria no README de API. As operações lógicas não são endpoints reais; verificar contrato integral/parcial de edição. |
| PC-07 | HU-011 ou preparo local para principais; HU-013 para agenda; módulos/dados históricos para RN-004; decisões abertas antes de julgar a parte correspondente. Sem dependência/decisão, registrar 🚫 somente na parte afetada. |

## Resumo da execução

São **13 casos essenciais**. CT-001 verifica vazio antes da massa e repete depois de CT-002. CT-006 edita os dados; CT-007 troca principal; CT-008 inativa RC1; CT-009 reativa RC0 preparada, sem depender da inativação anterior. Registrar cada variação e origem de massa; dados preparados pela IA não aprovam a funcionalidade.

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU012-API-001 | Listar complementares com horário, conexão e principal | Lista vazia; RC1 ativa; RC0 inativa; principais RP-A/RP-B ativas | Dados reais e dois estados acessíveis; vínculo correto | ⏳ PENDENTE | Não executado. |
| CT-HU012-API-002 | Cadastrar complementar vinculada a principal ativa | RC1 Van 2 - Bairro Novo; RP-A Rota Centro - UFC; 06:00; Trevo do Bairro Novo | Complementar ativa, persistida e vinculada à principal enviada | ⏳ PENDENTE | Não executado. |
| CT-HU012-API-003 | Exigir nome, saída, conexão e principal no cadastro/edição | Cada campo omitido/vazio/nulo; principal sem seleção; edição esvaziando | Erro por campo; sem cadastro incompleto ou edição parcial | ⏳ PENDENTE | Não executado. |
| CT-HU012-API-004 | Rejeitar principal inativa ou inexistente e preservar atomicidade | RP-0 inativa; id inexistente; edição de nome/conexão junto com principal inválida | Nenhum vínculo inválido nem gravação parcial | ⏳ PENDENTE | Não executado. |
| CT-HU012-API-005 | Validar horário sem presumir regra de transferência | 06:00 e 05:45 válidos; minuto 60/texto; 00:00/23:59 para caracterização | Formato preservado; entradas impossíveis recusadas; limites operacionais pendentes | ⏳ PENDENTE | Não executado. |
| CT-HU012-API-006 | Editar nome, horário e conexão sem trocar a principal | RC1: Van 3 - Bairro Novo; 05:45; Posto Central; manter RP-A | Mesmo id; dados atualizados; principal e outra complementar intactas | ⏳ PENDENTE | Não executado. |
| CT-HU012-API-007 | Trocar rota principal e tratar complementar inexistente | RC1 de RP-A para RP-B Rota Integrada; id de complementar inexistente | Referência nova correta, sem vínculo atual residual ou alteração das principais | ⏳ PENDENTE | Não executado. |
| CT-HU012-API-008 | Inativar sem agendamento futuro e manter principal ativa | RC1 ativa sem agenda futura; principal RP-B ativa | Soft delete só da complementar; registro e vínculos mantidos | ⏳ PENDENTE | Não executado. |
| CT-HU012-API-009 | Reativar complementar com principal ativa | RC0 inativa com RP-A ativa, independente da inativação de RC1 | Mesmo registro reativado com dados e vínculo preservados | ⏳ PENDENTE | Não executado. |
| CT-HU012-API-010 | Auditar as quatro escritas da complementar | Cadastro CT-002; edições CT-006/007; inativação CT-008; reativação CT-009 | Usuário, ação, timestamp e vínculo corretos por escrita efetiva | ⏳ PENDENTE | Não executado. |
| CT-HU012-API-011 | Bloquear inativação com agendamento futuro, sem contorno | Complementar A com agenda amanhã; B sem agenda; C só com passado | Futuro bloqueado; sem futuro permite; sem alteração parcial | ⏳ PENDENTE | Depende da HU-013 para agenda real; não executado. |
| CT-HU012-API-012 | Negar gestão a aluno, representante e sem autenticação | Três credenciais em cadastro/edição/inativação/reativação | 403 nos perfis sem privilégio; autenticação exigida; nenhuma escrita | ⏳ PENDENTE | Não executado. |
| CT-HU012-API-013 | Preservar histórico e caracterizar seleção no agendamento | Complementar com passado, conexão e principal registradas; outra inativa; HU-013 e operação diária | Histórico mantido; seleção inferida pendente; veículo diário fora do cadastro | ⏳ PENDENTE | Histórico real; HU-013 e decisão para seleção; operação diária fora deste recorte. |

## Detalhamento dos casos

### CT-HU012-API-001 — Listar complementares com horário, conexão e principal

**Dados de entrada:** Lista vazia; RC1 ativa; RC0 inativa; principais RP-A/RP-B ativas.

**Passos**

1. Com contrato PC-06 preenchido, usar OP-LISTAR antes da massa; preparar RC0 e executar CT-002 para obter RC1.
2. Listar novamente, consultar cada complementar e usar filtros apenas se publicados.
3. Pedir à IA para comparar nome, saída, conexão, principal e estado com os dados persistidos (PC-05).

**Resultado esperado**

- Leitura de sucesso conforme contrato; vazio real, sem substituir por exemplos.
- Administrador acessa complementares ativas e inativas, com horário, ponto de conexão e principal corretos (AC-01, AC-09 e BDD).
- Requisito inclui os dois estados na listagem; BDD usa Mostrar inativos. Padrão inicial e mecanismo de filtro aguardam alinhamento.
- Identificador da complementar deve permanecer distinto do identificador da principal; não confundir o alvo das operações.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU012-API-002 — Cadastrar complementar vinculada a principal ativa

**Dados de entrada:** RC1 Van 2 - Bairro Novo; RP-A Rota Centro - UFC; 06:00; Trevo do Bairro Novo.

**Passos**

1. Conferir RP-A ativa e seu id real; preparar OP-CADASTRAR com nome Van 2 - Bairro Novo, saída 06:00 e conexão Trevo do Bairro Novo.
2. Usar a representação de conexão confirmada no contrato: texto, entidade ou outro formato documentado, sem presumir campo de chave estrangeira.
3. Registrar o id de RC1 e pedir à IA para conferir a complementar, vínculo e dados da principal (PC-05).

**Resultado esperado**

- Criação efetiva de complementar ativa com os quatro valores corretos (AC-02, RN-010 no escopo cadastral).
- A rota principal existe e não é alterada pelo cadastro da complementar; não criar outra principal silenciosamente.
- Confirmação de sucesso conforme fluxo/BDD; o BDD usa “Operação realizada com sucesso”. Código e payload dependem do contrato.
- Cadastro não fixa veículo/motorista por conta própria: a operação diária prevista em RN-010 é dependência de outras HUs.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU012-API-003 — Exigir nome, saída, conexão e principal no cadastro/edição

**Dados de entrada:** Cada campo omitido/vazio/nulo; principal sem seleção; edição esvaziando.

**Passos**

1. Em OP-CADASTRAR, omitir um campo por tentativa: nome, saída, ponto de conexão ou principal; manter os demais válidos.
2. Testar nome/conexão só com espaços se forem textuais; na edição de RC1, esvaziar explicitamente cada obrigatório.
3. Pedir à IA para conferir ausência de novos registros e preservação de RC1 (PC-05).

**Resultado esperado**

- Impedir cadastro/edição sem os dados exigidos (AC-02, AC-08, FA-003 e BDD), com erro de cliente e indicação do campo conforme contrato.
- O nome não aparece no AC-08, mas é exigido no cadastro pelo AC-02 e no BDD: registrar essa diferença de redação, sem permitir complementar sem nome.
- Sem principal não pode surgir vínculo padrão oculto; ausência em edição parcial não equivale a esvaziamento, conforme semântica de método ainda a mapear.
- Não inventar tamanho máximo de nome/conexão, horário de retorno ou mais de uma conexão obrigatória.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU012-API-004 — Rejeitar principal inativa ou inexistente e preservar atomicidade

**Dados de entrada:** RP-0 inativa; id inexistente; edição de nome/conexão junto com principal inválida.

**Passos**

1. Conferir RP-0 inativa e id inexistente; enviar criações válidas trocando somente a referência da principal.
2. Tentar editar RC1 com nome Novo não deve salvar, conexão Posto Central e principal inválida, numa única operação.
3. Pedir à IA para conferir todos os dados e associações de RC1/RP-A depois de cada recusa (PC-05).

**Resultado esperado**

- Principal inválida/inativa não recebe vínculo novo (AC-03, FA-002, RNF-012), inclusive em chamada direta de API.
- A edição recusada não altera nome, horário, conexão ou referência anterior; nenhum órfão, exclusão ou erro interno por referência inválida.
- Não aplicar automaticamente a mesma política à reativação de vínculo antigo com principal agora inativa: isso é outra decisão pendente.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU012-API-005 — Validar horário sem presumir regra de transferência

**Dados de entrada:** 06:00 e 05:45 válidos; minuto 60/texto; 00:00/23:59 para caracterização.

**Passos**

1. Usar o formato de saída confirmado no contrato para cadastrar/editar uma complementar com 06:00 e depois 05:45.
2. Testar separadamente minuto 60 e texto incompatível; pedir à IA para conferir que os dados não mudaram (PC-05).
3. Caracterizar 00:00/23:59 e uma saída posterior à da principal, anotando respostas sem impor janela de conexão não definida.

**Resultado esperado**

- Horário válido persistido e lido sem conversão silenciosa de fuso/dia e sem alterar o da principal.
- Entrada impossível para o formato documentado é recusada com campo e motivo; sem truncamento ou gravação parcial.
- Horário mínimo/máximo, antecedência para transferência, duração do trajeto e relação com horário da principal não estão definidos. Não aprovar/reprovar essas variações até decisão.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU012-API-006 — Editar nome, horário e conexão sem trocar a principal

**Dados de entrada:** RC1: Van 3 - Bairro Novo; 05:45; Posto Central; manter RP-A.

**Passos**

1. Registrar RC1, RC0 e RP-A antes da operação.
2. Editar RC1 com os novos dados, preservando a principal; se o contrato permitir edição parcial, conferir campos omitidos; se exigir corpo completo, enviá-lo integralmente.
3. Reler e pedir à IA para conferir id, conexão, horário e os registros não envolvidos (PC-05).

**Resultado esperado**

- Alteração válida persistida, com confirmação e listagem atualizada (AC-04 e fluxo principal).
- Mesmo id e vínculo RP-A; não criar nova complementar nem alterar RC0/principal.
- Troca de conexão atual não apaga entidade-base eventualmente compartilhada; representação/relacionamentos devem ser confirmados no contrato.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU012-API-007 — Trocar rota principal e tratar complementar inexistente

**Dados de entrada:** RC1 de RP-A para RP-B Rota Integrada; id de complementar inexistente.

**Passos**

1. Conferir RP-B ativa e registrar o vínculo anterior de RC1.
2. Editar a referência de RC1 para RP-B; pedir à IA para conferir complementar e relacionamentos atuais de RP-A/RP-B (PC-05).
3. Tentar a mesma edição com identificador de complementar inexistente, mantendo corpo válido.

**Resultado esperado**

- RC1 passa a apontar para RP-B com o mesmo id, horário e conexão corretos (AC-04).
- Não manter a associação atual antiga nem modificar nome/horários/status das principais. Preservação de histórico anterior é conferida no CT-013.
- Id inexistente é recusado conforme contrato, sem criação por engano. Não fixar código de detalhe ainda não publicado.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU012-API-008 — Inativar sem agendamento futuro e manter principal ativa

**Dados de entrada:** RC1 ativa sem agenda futura; principal RP-B ativa.

**Passos**

1. Pedir à IA para conferir cenário sem futuro e registrar dados/status de RC1 e RP-B (PC-05).
2. Usar OP-INATIVAR em RC1 e reler os dois registros.
3. Repetir no mesmo estado para caracterizar o contrato; conferir registro, vínculo e auditoria.

**Resultado esperado**

- Complementar mantida no banco como inativa, com mesmo id/conexão/principal; resposta “Operação realizada com sucesso” (AC-05, AC-07, RF-014).
- Inativar complementar não inativa nem apaga sua rota principal.
- Repetição não causa exclusão/duplicação de vínculos; idempotência versus conflito depende do contrato futuro e não deve ser copiada de outra HU.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU012-API-009 — Reativar complementar com principal ativa

**Dados de entrada:** RC0 inativa com RP-A ativa, independente da inativação de RC1.

**Passos**

1. Confirmar principal ativa antes de OP-REATIVAR; registrar a complementar e logs anteriores.
2. Reativar RC0 e pedir à IA para conferir status, dados, vínculo e auditoria na API/banco (PC-05).
3. Repetir a reativação e registrar o tratamento de mesmo estado.

**Resultado esperado**

- Reativação prevista no fluxo principal/BDD devolve a mesma complementar às ativas, com confirmação de sucesso.
- Não gerar outra linha nem alterar rota principal ou conexão. A repetição não pode duplicar vínculos.
- Este caso segue a pré-condição explícita do BDD: principal ativa. Reativação com principal inativa permanece fora de julgamento até decisão.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU012-API-010 — Auditar as quatro escritas da complementar

**Dados de entrada:** Cadastro CT-002; edições CT-006/007; inativação CT-008; reativação CT-009.

**Passos**

1. Pedir à IA para localizar logs pelo tipo/id real da complementar e pelo intervalo registrado (PC-05).
2. Relacionar as escritas concluídas aos logs, diferenciando id da complementar e id da principal.
3. Conferir que tentativas recusadas não aparecem como alterações concluídas; registrar separadamente eventual log de tentativa.

**Resultado esperado**

- Cadastro, edição, inativação e reativação rastreáveis pelo executor, ação e timestamp (fluxo principal/BDD, RNF-013); AC-05 explicita ao menos inativação.
- Troca de principal não pode tornar a operação indistinguível de edição da rota principal ou apagar a auditoria anterior.
- Não inventar nomes de ação/entidade ou exigir estrutura de valor anterior/novo além do que for documentado; registrar ausência de rastreabilidade.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU012-API-011 — Bloquear inativação com agendamento futuro, sem contorno

**Dados de entrada:** Complementar A com agenda amanhã; B sem agenda; C só com passado.

**Passos**

1. Conferir HU-013 e preparar agenda real com apoio da IA, registrando datas/fuso (PC-05). Sem agenda, marcar a parte como 🚫.
2. Tentar inativar cada complementar e conferir também o estado das principais vinculadas.
3. Se houver edição genérica de status, repetir a tentativa com futuro por esse caminho; se não houver, registrar não aplicável.

**Resultado esperado**

- Agenda futura impede inativar e informa agendamentos pendentes; mantém complementar e principal nos estados anteriores (AC-06, FA-001).
- Sem futuro e somente passado não devem ser tratados como agenda futura. Código/texto literal da recusa ainda dependem do contrato.
- Não gerar log de inativação concluída para operação recusada nem contornar pelo campo de status; erro 500/503 não prova regra de negócio.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU012-API-012 — Negar gestão a aluno, representante e sem autenticação

**Dados de entrada:** Três credenciais em cadastro/edição/inativação/reativação.

**Passos**

1. Enviar operações administrativas com alvo existente e corpo válido usando aluno e representante ativo.
2. Repetir sem cabeçalho, cookie ou parâmetro de token; pedir à IA para conferir registros e ausência de log de sucesso (PC-05).
3. Caracterizar política de leitura somente quando publicada, diferenciando consulta de opções de agendamento da gestão.

**Resultado esperado**

- Escritas por aluno/representante recebem `403 Forbidden` (RN-006 e BDD); sem autenticação deve ser recusado, seguindo o mecanismo compartilhado atual de 401.
- Nenhuma complementar criada/editada/inativada/reativada indevidamente, nem mudança nas rotas principais.
- Permissão de leitura pública/restrita não foi definida para esta API: não impor uma regra de GET por analogia. Login indisponível de representante bloqueia só essa variação.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU012-API-013 — Preservar histórico e caracterizar seleção no agendamento

**Dados de entrada:** Complementar com passado, conexão e principal registradas; outra inativa; HU-013 e operação diária.

**Passos**

1. Pedir à IA para registrar ids e vínculos históricos reais de alocação/relatórios (PC-05), sem agenda futura.
2. Inativar a complementar e conferir manutenção do registro e das referências históricas; se trocar principal/conexão, conferir também integridade dos registros anteriores.
3. Com HU-013 e decisão disponíveis, conferir seleção de inativa e tentativa de vínculo novo pelo endpoint real.
4. Registrar separadamente a cobertura de uso diário/veículo de RN-010, dependente das HUs operacionais, sem criar campo fixo de veículo no cadastro.

**Resultado esperado**

- Histórico não apagado nem rompido pela inativação/edição (RN-004), nem alteração indevida da principal.
- Exclusão de inativa das opções de agendamento é inferência explicitamente pendente no BDD; sem decisão, não emitir aprovação/reprovação dessa parte.
- RN-010 inclui rota, horário, conexão e veículo da operação diária. Esta suíte cobre os dados cadastrais; prova de veículo programado/troca por dia depende das HUs operacionais, não é declarada concluída.
- Sem histórico/agenda/decisão, bloquear a parte dependente e manter as verificações independentes registradas.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 / AC-09 — listagem e inativas | Visualiza ativas com horário/conexão/principal; visualiza inativas | CT-001, CT-008, CT-009; padrão inicial pendente |
| AC-02 — cadastro | Cadastra nova complementar | CT-002 |
| AC-03 / FA-002 — principal ativa | Não oferece principal inativa | CT-004; seleção na UI |
| AC-04 — edição | Edita nome, saída, conexão e principal | CT-006, CT-007 |
| AC-05 / RF-014 — soft delete | Inativa e mantém registro no banco | CT-008 |
| Fluxo principal — reativação | Reativa complementar com principal ativa | CT-009 |
| AC-06 / FA-001 — agenda futura | Bloqueia inativação com agendamento futuro | CT-011 — HU-013 |
| AC-07 — mensagem da inativação | Inativa com sucesso e atualiza lista | CT-008; demais sucessos pelo fluxo/BDD |
| AC-08 / FA-003 — obrigatórios | Cadastro/edição sem obrigatório | CT-003; nome também por AC-02/BDD |
| RF-028 — horário e conexão | Dados do cadastro/edição; formato/fronteiras como complemento técnico | CT-005 — relação temporal com principal pendente |
| RNF-013 / fluxo — auditoria | Log de cada escrita | CT-010 |
| RN-004 — histórico | Preserva alocações/relatórios antigos | CT-013 — histórico real |
| RN-010 — uso operacional | Inativa fora do agendamento (inferência BDD) | CT-013 — HU-013/decisão; uso diário/veículo fora do recorte |
| RN-006 — exclusividade administrativa | API nega gestão a aluno/representante | CT-012 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Fontes: [requisitos, seção 7.4.2](../../../../../docs/requisitos.md), [HU-012.feature](../../../../../bdd/features/epico-03/HU-012.feature) e [README do BDD](../../../../../bdd/features/epico-03/README.md), nesta ordem de autoridade. Nenhum requisito/BDD foi alterado.
- **Riscos mapeados no código** — base `5554bc90`, conferida em 24/10/2026:
  - [backend/main.py](../../../../../backend/main.py) não registra router de gestão de rotas principais/complementares; contrato, DTO e service da HU-012 não foram identificados em `backend/src`. Operações e campos do plano são lógicos; métodos/URLs reais só podem ser preenchidos quando a implementação existir.
  - [cadastros.tsx](../../../../../frontend/src/app/%28administrador%29/cadastros.tsx) aponta o card para `/(administrador)/cadastros/rotas-complementares`, sem tela correspondente identificada em `frontend/src`. Link planejado não prova acesso ou autorização.
  - A HU-011 também está em planejamento. Massa de principal criada diretamente pela IA permite testar a complementar depois de sua entrega, mas não aprova o cadastro da principal.
  - Riscos preventivos: trocar id de complementar pelo de principal, enviar principal padrão diferente da escolhida, manter vínculo atual antigo, gravar parcialmente edição inválida, não validar principal que ficou inativa e apagar histórico/entidades compartilhadas. Sem código de negócio entregue, não há falhas confirmadas dessas hipóteses.
  - Integração futura precisa retornar estado realmente persistido e erro visível; sucesso local/mocks não pode substituir API. Não foi identificado service de complementares com esse comportamento nesta base.
- Técnicas: **partição de equivalência** (principal ativa/inativa/inexistente; perfis; obrigatórios), **valor-limite** (zero/uma seleção e formato de hora), **transição de estado** (ativa → inativa → ativa, com principal ativa) e **tabela de decisão** (sem agenda / passado / futuro; principal ativa/inativa ao gravar). Prioridade em integridade e identidade do vínculo, atomicidade e histórico.
- **Dúvidas/divergências para alinhamento**:
  - AC-01/fluxo incluem ativas e inativas; BDD usa ativas inicialmente e chave Mostrar inativos. Visibilidade dos dois estados é requisito; mecanismo e padrão inicial estão abertos.
  - AC-05 menciona log da inativação; fluxo/BDD preveem as quatro escritas. Cobrir todas se apoia nesses trechos; nomes de ação, entidade e códigos dependem do contrato futuro.
  - AC-02/fluxo usam “horários” e “pontos de conexão” no plural; BDD adota **um horário de saída e uma conexão**. Confirmar se a entrega terá retorno ou múltiplas conexões, sem acrescentá-los como obrigatórios nesta suíte.
  - AC-08 não lista nome, mas AC-02 e BDD o exigem: os casos incluem nome obrigatório e registram a diferença de redação.
  - Tipo da conexão (texto, ponto cadastrado ou outra estrutura) e validações de pertencimento precisam ser confirmados antes de definir payload ou exigir referência a um ponto de parada.
  - Nome único, limite de texto, janela temporal para transferência e relação entre saída complementar/principal não estão definidos; não inventar bloqueios.
  - Inativar principal com complementares ativas: cascata, bloqueio ou manutenção do vínculo não definidos. Reativar complementar com principal inativa também aguarda decisão; não inferir isso da regra de criar vínculo novo.
  - Complementar inativa fora do agendamento é comportamento **inferido a confirmar** no BDD. Sem decisão, não emitir aprovação/reprovação dessa parte.
- RN-010 envolve rota, horário, conexão e veículo **da operação diária**, permitindo troca do veículo conforme programação. A suíte cobre cadastro/vínculo; uso pelo aluno, programação e troca de veículo exigem HUs operacionais próprias. Não declarar RN-010 integralmente validada com este CRUD.
- Nenhum teste executado, nenhuma stack iniciada, nenhum defeito reproduzido. Os 13 casos desta camada estão pendentes. Na execução, marcar 🚫 nas partes sem implementação/contrato/dependência/decisão, preservando as verificações independentes. Não trocar esperado para adaptar ao código.
- Ocultar credenciais e dados pessoais nas evidências. Preparo direto de inativo não aprova a operação de inativação; retorno genérico de erro não comprova bloqueio por agendamento.
- Suíte complementar: [UI-HU-012.md](../ui/UI-HU-012.md). Seletores e cancelamento visual ficam na UI; validação final e persistência aqui.
