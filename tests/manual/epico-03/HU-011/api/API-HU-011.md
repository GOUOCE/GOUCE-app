# Testes manuais de API — HU-011 — Gerenciamento de Rotas Principais e Horários

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Gestão de Rotas e Horários (EP-003) |
| Funcionalidade | HU-011 — Gerenciamento de Rotas Principais e Horários |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial (baseada em risco), planejada antes da implementação |
| Endpoints | Ainda não publicados na base analisada. Operações lógicas OP-LISTAR, OP-CONSULTAR, OP-CADASTRAR, OP-EDITAR, OP-INATIVAR e OP-REATIVAR devem ser mapeadas para o contrato real em [api/README.md](README.md) antes da execução. |
| Ambiente | A preencher — URL, branch e commit da implementação em execução |
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
| PC-01 | A implementação da camada deve existir na branch escolhida para execução; na base `5554bc90` ela ainda não foi identificada. Este é só planejamento, sem stack/testes. Na execução futura, usar ambiente isolado com banco de teste; sem a funcionalidade, marcar a parte dependente como 🚫, não como falha reproduzida nesta rodada. |
| PC-02 | Administrador A do seed; autenticação por `POST /auth/login`, guardando id e horário do executor para auditoria. Usar Postman/Insomnia ou Swagger em /docs. |
| PC-03 | Credenciais de aluno aprovado/ativo e representante ativo para autorização. Se não conseguir autenticar representante, registrar motivo e bloquear só essa parte; sessão vencida exige novo login antes de repetir. |
| PC-04 | Massa local de teste, com ids registrados: B1 Centro ativo/P1 Praça José de Barros; B2 Campo Velho ativo/P2 Escola Coronel Virgílio Távora; B0 Alto São Francisco inativo; F1 UFC/Quixadá, F2 IFCE/Quixadá e F3 UECE/Quixadá ativas; F0 Unicatólica/Quixadá inativa. RP0 Rota Antiga inativa sem complementar vinculada; RP1 criada no CT-002, RP2 no CT-003 e RP3 no CT-004. Em falha anterior, a IA pode preparar estado independente por API/banco local, registrando origem e sem aprovar a ação que falhou. |
| PC-05 | **Apoio da IA (Claude Code)** para executar chamadas com validação de Cauan e conferir na API/banco os dados realmente gravados, vínculos e auditoria, e preparar massa quando a UI/API não permitir. Comparar entidades pelos ids reais, não apenas pelo nome exibido. |
| PC-06 | Antes de executar, preencher métodos/URLs, Content-Type, campos, ids, formato de horário, respostas e consultas de auditoria em api/README.md usando a implementação e /docs. Nenhum nome de operação lógica é endpoint real. |
| PC-07 | HU-013 para agenda futura e novos agendamentos; dados/módulos históricos para RN-004. Registrar datas/fuso. Regra de seleção de inativa e demais decisões abertas devem ser confirmadas antes de julgar a parte correspondente; ausência de decisão é impedimento documentado. |

## Resumo da execução

São **13 casos essenciais**. Registrar cada variação. CT-001 começa pelo vazio e repete consultas após a massa. Massa criada diretamente pela IA não aprova a operação que se pretende testar. Chamadas administrativas usam a credencial A, exceto no CT-012. Não executar nenhum caso com método/URL/campo presumido.

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU011-API-001 | Listar rotas e consultar horários e vínculos | Lista vazia; RP1 ativa; RP0 inativa; consulta individual | Sucesso de leitura; dados corretos; ativas/inativas acessíveis | ⏳ PENDENTE | Não executado. |
| CT-HU011-API-002 | Cadastrar rota principal mínima e confirmar persistência | RP1: Rota Centro - UFC; 06:30/17:30; B1; F1 na ida e na volta | Criação efetiva, ativa, com horários e vínculos corretos | ⏳ PENDENTE | Não executado. |
| CT-HU011-API-003 | Vincular vários bairros e faculdades sem perder seleções | RP2: Rota Integrada; 06:30/17:30; B1+B2; F1+F2 na ida e volta | Todos os vínculos persistidos uma vez, sem sobrescrever os anteriores | ⏳ PENDENTE | Não executado. |
| CT-HU011-API-004 | Configurar faculdades da volta de forma independente | RP3: ida F1+F2, volta só F1; depois ida F1, volta F3 ativa | Conjuntos distintos preservados; sem cópia automática ou restrição de subconjunto | ⏳ PENDENTE | Não executado. |
| CT-HU011-API-005 | Exigir campos e cardinalidade mínima no cadastro e na edição | Nome/saída/retorno ausentes ou vazios; bairros/ida sem itens; controle com 1 item | Recusa por campo; nenhum cadastro incompleto nem edição parcial | ⏳ PENDENTE | Não executado. |
| CT-HU011-API-006 | Impedir novos vínculos com base inativa ou inexistente | Bairro B0 inativo; faculdade F0 inativa na ida/volta; ids inexistentes; edição válida+referência inválida | Erro de referência; nenhuma associação inválida ou gravação parcial | ⏳ PENDENTE | Não executado. |
| CT-HU011-API-007 | Conferir formato e fronteiras do horário sem criar regra de turno | 06:30/17:30; hora com minuto 60; texto; 00:00/23:59; retorno 01:00 com saída 23:00 | Formato consistente; entradas impossíveis recusadas; cronologia pendente | ⏳ PENDENTE | Não executado. |
| CT-HU011-API-008 | Editar dados e substituir vínculos da rota correta | RP1: novo nome; 06:00/18:00; adicionar B2, retirar B1; ida F2 e volta F3 | Mesmo id; alterações persistidas; outras rotas e base preservadas | ⏳ PENDENTE | Não executado. |
| CT-HU011-API-009 | Inativar e reativar sem agendamento futuro, sem apagar a rota | RP1 sem futuro; RP0 inativa para reativação independente; repetir operações | Soft delete, reativação, mesmos dados/id e nenhuma exclusão | ⏳ PENDENTE | Não executado. |
| CT-HU011-API-010 | Auditar cadastro, edição, inativação e reativação | Operações de RP1 nos CT-002/008/009; administrador e horários | Rastro de cada escrita efetiva com usuário, ação e timestamp | ⏳ PENDENTE | Não executado. |
| CT-HU011-API-011 | Bloquear inativação com agendamento futuro e permitir sem futuro | Rota A agendada amanhã; B sem agenda; C só com agenda passada; datas/fuso | Futuro bloqueia; sem futuro permite; nenhum estado parcial | ⏳ PENDENTE | HU-013 necessária para a parte com agenda; não executado. |
| CT-HU011-API-012 | Negar escrita a aluno, representante e não autenticado | Aluno; representante; sem credencial em cadastro/edição/inativação/reativação | 403 para perfis sem privilégio; autenticação exigida; nada alterado | ⏳ PENDENTE | Não executado. |
| CT-HU011-API-013 | Preservar histórico e conferir rota inativa no agendamento | Rota H só com histórico; rota I inativa; dependências de agenda/alocação/relatório | Histórico preservado; seleção de inativa é hipótese BDD a confirmar | ⏳ PENDENTE | RN-004 depende de histórico real; seleção depende da HU-013 e de decisão. |

## Detalhamento dos casos

### CT-HU011-API-001 — Listar rotas e consultar horários e vínculos

**Dados de entrada:** Lista vazia; RP1 ativa; RP0 inativa; consulta individual.

**Passos**

1. Após mapear o contrato em PC-06, usar OP-LISTAR antes da massa; preparar RP0 e executar CT-002 para obter RP1.
2. Repetir a listagem; usar filtros de status somente se existirem no contrato e consultar RP1/RP0 pelo identificador real.
3. Pedir à IA para comparar horários, bairros e faculdades de ida/volta com os registros persistidos (PC-05).

**Resultado esperado**

- Resposta de sucesso conforme contrato; vazio real sem registros inventados. Placa, motorista e veículo não são campos obrigatórios desta HU.
- Administrador consegue consultar rotas ativas e inativas com saída e retorno corretos (AC-01, AC-09).
- O requisito inclui ambas na listagem; o BDD usa Mostrar inativos. Registrar a forma de exposição e a divergência de padrão inicial, sem aprovar/reprovar esse padrão antes de alinhamento.
- Se filtros não forem implementados, registrar a ausência do recurso técnico sem inventá-lo como critério; a visibilidade dos dois estados continua obrigatória.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU011-API-002 — Cadastrar rota principal mínima e confirmar persistência

**Dados de entrada:** RP1: Rota Centro - UFC; 06:30/17:30; B1; F1 na ida e na volta.

**Passos**

1. Preparar uma requisição válida de OP-CADASTRAR usando os campos reais do contrato: nome Rota Centro - UFC, saída 06:30, retorno 17:30, bairro Centro e faculdade UFC/Quixadá nos dois sentidos.
2. Se o contrato exigir seleção de pontos, mapear o ponto P1 do Centro; não inventar campo obrigatório de ponto quando o contrato não estiver definido.
3. Registrar id/horário da operação e pedir à IA para conferir consulta, linha da rota e associações após uma nova leitura (PC-05).

**Resultado esperado**

- Sucesso de criação (HTTP de sucesso definido no contrato), rota ativa e exatamente um registro funcional novo (AC-02).
- Nome, horários, bairro e faculdades gravados no sentido correto; o id da rota é estável e as entidades-base não são alteradas.
- Confirmação de sucesso conforme fluxo principal/BDD; o BDD usa “Operação realizada com sucesso”. AC-07 fixa esse texto para inativação; padronização das demais mensagens deve ser alinhada.
- Dados de entrada são valores de negócio, não nomes de chaves JSON aprovados. As duas listas de faculdades não podem ser inferidas uma da outra.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU011-API-003 — Vincular vários bairros e faculdades sem perder seleções

**Dados de entrada:** RP2: Rota Integrada; 06:30/17:30; B1+B2; F1+F2 na ida e volta.

**Passos**

1. Cadastrar RP2 com Centro e Campo Velho e com UFC/IFCE nos dois sentidos, usando OP-CADASTRAR.
2. Pedir à IA para conferir a rota e todas as associações persistidas, comparando os ids das entidades da massa (PC-05).
3. Reler RP1 para confirmar que o cadastro de RP2 não alterou seus vínculos.

**Resultado esperado**

- Rota com mais de um bairro e mais de uma faculdade aceita (AC-02 e cenário BDD de vários vínculos).
- As seleções completas são mantidas, sem guardar apenas o último item, cruzar ida/volta ou duplicar a mesma associação.
- RP1 e os cadastros de bairros/faculdades permanecem anteriores; não exigir ordem de passagem ainda não definida nos requisitos.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU011-API-004 — Configurar faculdades da volta de forma independente

**Dados de entrada:** RP3: ida F1+F2, volta só F1; depois ida F1, volta F3 ativa.

**Passos**

1. Cadastrar RP3 com nome Rota Centro - Faculdades, horários 06:30/17:30, B1, ida UFC+IFCE e volta só UFC; conferir com apoio da IA (PC-05).
2. Editar RP3 para ida somente UFC e volta somente UECE (F3 ativa); manter os demais dados.
3. Reler a rota e pedir à IA para conferir cada sentido no banco (PC-05).

**Resultado esperado**

- Configuração de ida/volta independente, conforme AC-10. A variação de subconjunto reproduz o BDD; a volta com instituição exclusiva deriva da independência expressa no requisito.
- Alterar um sentido não preenche, esvazia nem sobrescreve o outro.
- A obrigatoriedade de ao menos uma faculdade na volta está pendente: não executar volta vazia como caso de aprovação/reprovação sem decisão. Ambas as entradas deste caso têm volta preenchida.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU011-API-005 — Exigir campos e cardinalidade mínima no cadastro e na edição

**Dados de entrada:** Nome/saída/retorno ausentes ou vazios; bairros/ida sem itens; controle com 1 item.

**Passos**

1. Em OP-CADASTRAR, omitir um obrigatório por tentativa: nome, saída, retorno, bairros ou faculdade da ida. Testar vazio/nulo e nome só com espaços conforme representações suportadas.
2. Testar listas de bairros/ida com zero e um item. O controle de um item é o CT-002; na edição de RP1, tentar retirar o último bairro e a última faculdade da ida, sem esvaziar a volta.
3. Pedir à IA para conferir ausência de registros novos e preservação integral de RP1 após cada recusa (PC-05).

**Resultado esperado**

- Cadastro/edição sem obrigatórios é recusado com erro de cliente e indicação do campo, conforme contrato (AC-08, FA-003).
- Os mínimos confirmados são um bairro e uma faculdade; o BDD posiciona a faculdade obrigatória na ida. Registrar essa interpretação e a pendência da volta sem torná-la obrigatória por suposição.
- Esvaziamento explícito não se confunde com campo omitido em edição parcial: aplicar a semântica que o contrato documentar, sem presumir PATCH.
- Uma tentativa inválida não pode alterar outros campos válidos enviados na mesma operação.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU011-API-006 — Impedir novos vínculos com base inativa ou inexistente

**Dados de entrada:** Bairro B0 inativo; faculdade F0 inativa na ida/volta; ids inexistentes; edição válida+referência inválida.

**Passos**

1. Com os outros dados válidos, tentar cadastrar rota trocando somente o bairro por B0; repetir com F0 na ida e depois na volta.
2. Repetir com identificador inexistente de bairro/faculdade confirmado pela IA. Em RP1, tentar mudar nome e incluir referência inválida na mesma edição.
3. Se o contrato expuser bairro e ponto separadamente, conferir também a coerência do ponto com seu bairro; se a granularidade não estiver definida, registrar essa verificação como pendente de contrato.
4. Pedir à IA para conferir rota e associações depois de cada tentativa (PC-05).

**Resultado esperado**

- Não criar vínculo com entidade-base inativa ou inexistente (AC-03, FA-002, RNF-012); erros de cliente compreensíveis, sem erro interno ou órfãos.
- A proteção deve valer em chamada direta, além do filtro da UI. Referência inválida em uma lista não pode salvar as demais partes da operação silenciosamente.
- RP1 mantém dados anteriores à tentativa inválida. Não inferir a política para uma entidade que ficou inativa depois de um vínculo já existente: essa decisão é separada.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU011-API-007 — Conferir formato e fronteiras do horário sem criar regra de turno

**Dados de entrada:** 06:30/17:30; hora com minuto 60; texto; 00:00/23:59; retorno 01:00 com saída 23:00.

**Passos**

1. Usar o formato de hora confirmado no contrato para cadastrar/editar horários válidos; representar 06:30/17:30 nesse formato.
2. Enviar separadamente minuto 60 e texto não interpretável como hora; pedir à IA para conferir que a rota não foi alterada (PC-05).
3. Caracterizar 00:00 e 23:59 e a viagem 23:00 → 01:00, sem concluir que cruza o dia ou que deve ser bloqueada; anotar o retorno para alinhamento.
4. Reler uma rota salva e comparar a hora local exibida ao valor persistido, registrando eventual conversão indevida de fuso/dia.

**Resultado esperado**

- Horários bem formados são preservados sem troca entre saída/retorno, arredondamento ou conversão silenciosa (RF-013).
- Valores impossíveis para o formato documentado devem ser recusados com identificação do campo, sem gravação parcial.
- Os limites do relógio são técnica de caracterização, não horário mínimo/máximo de operação. Ordem saída/retorno, pernoite e faixa permitida não estão definidos; manter essa parte pendente de decisão.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU011-API-008 — Editar dados e substituir vínculos da rota correta

**Dados de entrada:** RP1: novo nome; 06:00/18:00; adicionar B2, retirar B1; ida F2 e volta F3.

**Passos**

1. Registrar RP1/RP2 antes da edição; em OP-EDITAR de RP1, trocar nome para Rota Campo Velho - IFCE, horários para 06:00/18:00, bairro para B2 e faculdades para ida F2/volta F3.
2. Reler RP1 e pedir à IA para conferir todos os vínculos atuais e o id (PC-05).
3. Conferir RP2 e os cadastros-base; tentar editar id de rota inexistente com dados válidos.

**Resultado esperado**

- Alteração persistida no mesmo registro, com confirmação e atualização da listagem (AC-04 e fluxo principal).
- Na configuração atual da rota, associações retiradas não ficam ativas indevidamente; não apagar os bairros/faculdades nem alterar RP2.
- Rota inexistente gera resposta de cliente coerente com o contrato; nenhum registro novo. Não fixar 404 antes da publicação do contrato.
- Preservação de vínculos/relatórios antigos deve ser verificada no CT-013, sem presumir que nomes históricos são snapshots ou leituras dinâmicas.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU011-API-009 — Inativar e reativar sem agendamento futuro, sem apagar a rota

**Dados de entrada:** RP1 sem futuro; RP0 inativa para reativação independente; repetir operações.

**Passos**

1. Conferir ausência de agendamentos futuros de RP1; usar OP-INATIVAR e reler como administrador.
2. Pedir à IA para conferir linha, vínculos e log (PC-05); usar OP-REATIVAR e conferir novamente.
3. Repetir cada operação no mesmo estado e registrar o contrato de repetição; se inativar falhar, usar RP0 preparada para isolar reativação, mantendo a falha anterior.

**Resultado esperado**

- Inativação válida mantém rota e associações no banco, altera somente o estado e retorna “Operação realizada com sucesso” (AC-05, AC-07, RF-014).
- Reativação devolve a mesma rota às ativas, com dados e vínculos corretos; prevista no fluxo principal e BDD.
- Repetição não pode excluir registro nem duplicar vínculos. Idempotência versus conflito e códigos exatos ainda dependem do contrato; não importar o 409 de outras HUs.
- Este caso usa rota principal sem complementar ativa vinculada; efeito sobre complementares é decisão pendente, não comportamento presumido.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU011-API-010 — Auditar cadastro, edição, inativação e reativação

**Dados de entrada:** Operações de RP1 nos CT-002/008/009; administrador e horários.

**Passos**

1. Pedir à IA para localizar os registros de auditoria da rota, usando a entidade/id definidos pela implementação e o intervalo de execução (PC-05).
2. Relacionar as quatro escritas efetivas com os logs e comparar dados anteriores/novos quando o contrato os expuser.
3. Conferir recusas por validação, autorização e agendamento; separar eventos de tentativa de eventos de escrita bem-sucedida.

**Resultado esperado**

- Cadastro, edição, inativação e reativação efetivas rastreáveis com executor, ação e timestamp (fluxo principal, RNF-013 e BDD).
- Não registrar operação recusada como alteração concluída. Um log de tentativa, se previsto na política, não pode ser confundido com sucesso.
- AC-05 menciona explicitamente a inativação; a cobertura das quatro operações se apoia no fluxo principal e no BDD. Nomes de ações e entidade ainda devem ser mapeados, não copiados de outro módulo.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU011-API-011 — Bloquear inativação com agendamento futuro e permitir sem futuro

**Dados de entrada:** Rota A agendada amanhã; B sem agenda; C só com agenda passada; datas/fuso.

**Passos**

1. Conferir HU-013 em execução. Sem agenda real, registrar 🚫 na parte dependente, sem fabricar endpoint ou chamar exemplo local de agendamento.
2. Pedir à IA para preparar e registrar as três condições e tentar OP-INATIVAR em cada uma (PC-05).
3. Se houver outro caminho de mudar o estado (por exemplo campo de edição), verificar a mesma proteção; se não houver, registrar que não se aplica.
4. Conferir estado, vínculos e auditoria após as tentativas.

**Resultado esperado**

- Agendamento futuro bloqueia com mensagem sobre agendamentos pendentes; rota continua ativa (AC-06, FA-001). Texto literal e código de erro dependem do contrato.
- Ausência de futuro não pode disparar esse bloqueio; histórico passado sozinho não equivale a agendamento futuro.
- Nenhum sucesso/auditoria de inativação concluída para a tentativa bloqueada e nenhum atalho para contornar a regra.
- Erro genérico de servidor ou indisponibilidade não comprova o bloqueio correto.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU011-API-012 — Negar escrita a aluno, representante e não autenticado

**Dados de entrada:** Aluno; representante; sem credencial em cadastro/edição/inativação/reativação.

**Passos**

1. Enviar OP-CADASTRAR, OP-EDITAR, OP-INATIVAR e OP-REATIVAR com cada perfil; usar corpo válido e alvo existente para isolar autorização.
2. Na variação sem autenticação, remover também cookie e parâmetros de token, conforme mecanismo real.
3. Pedir à IA para conferir ausência de escrita e de log de sucesso (PC-05); registrar separadamente a política de leitura quando o contrato estiver disponível.

**Resultado esperado**

- Aluno e representante recebem `403 Forbidden` nas operações administrativas (RN-006 e BDD). Ausência de autenticação deve ser recusada; o mecanismo compartilhado atual usa 401.
- Não confundir leitura de rotas para agendamento com permissão de gestão. Os requisitos não definem aqui se a leitura será pública ou restrita: não impor regra de GET antes do contrato.
- Nenhuma rota criada, editada ou com status alterado indevidamente. Se o login de representante estiver indisponível, bloquear só essa variação.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU011-API-013 — Preservar histórico e conferir rota inativa no agendamento

**Dados de entrada:** Rota H só com histórico; rota I inativa; dependências de agenda/alocação/relatório.

**Passos**

1. Conferir disponibilidade de dados históricos reais; pedir à IA para registrar ids/vínculos e valores dos registros anteriores de H (PC-05).
2. Inativar H sem agendamento futuro e comparar vínculos/relatórios; conferir também se edição da configuração atual mantém os registros anteriores.
3. Com HU-013 disponível, verificar se I aparece na seleção do aluno e, após decisão da regra, tentar novo vínculo direto com I pelo endpoint real.
4. Sem módulo/histórico ou decisão, marcar a parte correspondente como 🚫, preservando o resultado das partes independentes.

**Resultado esperado**

- Inativação não apaga nem rompe registros antigos de alocações/relatórios (RN-004), nem apaga a rota principal.
- BDD propõe inativa fora de novo agendamento, mas registra essa regra como inferida: manter avaliação dessa parte pendente de confirmação, mesmo com a funcionalidade disponível.
- Não inventar a política para agendamentos existentes ou para complementares vinculadas; registrar as pendências para discussão.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 / AC-09 — listagem e inativas | Visualiza ativas com horários; visualiza inativas | CT-001, CT-009; padrão inicial pendente |
| AC-02 — cadastro e múltiplos vínculos | Cadastra rota; vários bairros/faculdades | CT-002, CT-003; granularidade de pontos a confirmar |
| AC-03 / FA-002 — base ativa | Não oferece bairro/faculdade inativos | CT-006; filtro visual na suíte UI |
| AC-04 — edição | Edita nome, horários e bairros; faculdades pelo AC-04 | CT-008, CT-004 |
| AC-05 / RF-014 — soft delete | Inativa; registro permanece no banco | CT-009 |
| Fluxo principal — reativação | Reativa rota previamente inativada | CT-009 |
| AC-06 / FA-001 — agenda futura | Bloqueia inativação com agendamentos futuros | CT-011 — HU-013 |
| AC-07 — confirmação da inativação | Inativa com mensagem e atualiza lista | CT-009; demais sucessos seguem fluxo/BDD |
| AC-08 / FA-003 — obrigatórios | Cadastro sem obrigatório; edição esvaziando | CT-005 |
| AC-10 — volta independente | Configura faculdades da volta diferentes da ida | CT-004 |
| RF-013 — formato e persistência do horário | Horários de cadastro/edição; fronteiras sem cenário BDD específico | CT-007 — cronologia operacional pendente |
| RNF-013 / fluxo principal — auditoria | Registra cada operação de escrita | CT-010 |
| RN-004 — histórico | Inativação preserva registros anteriores | CT-013 — histórico real |
| Regra inferida de seleção | Inativa fora do agendamento do aluno | CT-013 — HU-013 e decisão |
| RN-006 — exclusividade administrativa | API nega gestão a aluno/representante | CT-012 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Fontes: [requisitos, seção 7.4.1](../../../../../docs/requisitos.md), [HU-011.feature](../../../../../bdd/features/epico-03/HU-011.feature) e [README do BDD](../../../../../bdd/features/epico-03/README.md), nesta ordem de autoridade. Nenhum requisito ou BDD foi alterado.
- **Riscos mapeados no código** — base `5554bc90`, conferida em 24/10/2026:
  - [backend/main.py](../../../../../backend/main.py) ainda não registra router de gestão de rotas principais/complementares. Não foram identificados contrato HTTP, DTO, service ou schema de gestão dessas HUs em `backend/src`. URLs, métodos, chaves e tabelas da rota são **a confirmar**; não presumir `/rotas`, JSON ou PATCH por semelhança com outro módulo.
  - [cadastros.tsx](../../../../../frontend/src/app/%28administrador%29/cadastros.tsx) tem o card Rotas principais apontando para `/(administrador)/cadastros/rotas-principais`, mas a tela de gestão correspondente não foi identificada. O alvo de navegação não comprova implementação.
  - As entidades-base já possuem status e consultas administrativas que podem incluir inativos. Conferir seleção e validação final de referência; filtro de UI sozinho não protege escrita direta.
  - Como a implementação não foi entregue, riscos de perda de vínculos, mistura de ida/volta, gravação parcial, horários convertidos, auditoria omitida e sucesso apenas local são **preventivos**, não bugs constatados.
- Técnicas: **partição de equivalência** (base ativa/inativa/inexistente; perfis; campos válidos/vazios), **valor-limite** (zero/um bairro e faculdade; hora válida/inválida), **transição de estado** (ativa → inativa → ativa) e **tabela de decisão** (sem agenda / só passado / futuro). Prioridade em integridade de vínculos, independência da volta e proteção de estado.
- **Dúvidas/divergências para alinhamento**:
  - AC-01/fluxo pedem listagem com ativas e inativas; BDD propõe ativas inicialmente e chave Mostrar inativos. Garantir acesso a ambos os estados; mecanismo e padrão inicial aguardam decisão.
  - AC-05 cita auditoria da inativação; fluxo principal/BDD registram as quatro escritas. Esta suíte cobre todas com base nesses trechos, sem impor nomes de ação ainda inexistentes.
  - AC-02 permite várias faculdades e volta independente; fluxo/FA-003 usam singular. Os casos seguem o AC-02/AC-10 e o BDD; **mínimo obrigatório na volta** continua sem definição.
  - O AC-02/fluxo mencionam bairros/pontos; o BDD detalha bairros. Confirmar granularidade, seleção de pontos e pertencimento antes de mapear o contrato; não fingir cobertura de campos ainda não definidos.
  - Nome único, ordem dos vínculos, faixa de horários, retorno posterior à saída e pernoite não estão definidos. Não criar bloqueio de duplicidade, mínimo/máximo de texto ou regra temporal por conta própria.
  - Efeito de inativar principal com complementares ativas, reativar complementar com principal inativa e base inativada depois do vínculo salvo: não definidos; registrar decisão antes de exigir cascata/bloqueio.
  - Inativa fora de novo agendamento é cenário **inferido e a confirmar** no BDD; sem decisão, a parte não pode receber aprovação/reprovação.
- Nenhuma suíte foi executada, nenhuma stack foi iniciada e nenhum defeito foi reproduzido. Os 13 casos desta camada permanecem pendentes. Na execução futura, marcar 🚫 por ausência de implementação, contrato, massa ou decisão; registrar partes independentes e não alterar o esperado para adaptar ao código.
- Não vincular veículo/motorista como obrigatório nesta HU: alocações operacionais pertencem a outras histórias. Preservar dados antigos e ocultar credenciais/tokens nas evidências.
- Suíte complementar: [UI-HU-011.md](../ui/UI-HU-011.md). Cancelamento visual e filtros de seleção são verificados na UI; validação final e persistência são verificadas aqui.
