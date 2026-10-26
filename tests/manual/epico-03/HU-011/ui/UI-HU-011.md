# Testes manuais de UI — HU-011 — Gerenciamento de Rotas Principais e Horários

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Gestão de Rotas e Horários (EP-003) |
| Funcionalidade | HU-011 — Gerenciamento de Rotas Principais e Horários |
| Camada | UI |
| Tipo de teste | Funcional manual — suíte essencial (baseada em risco), planejada antes da implementação |
| Tela | Administrador → Cadastros → Rotas principais (alvo atual de navegação, ainda sem tela identificada). Rótulos internos baseados no BDD, sujeitos à confirmação na entrega. |
| Ambiente | A preencher — URL, branch e commit da implementação em execução, celular (Expo Go) ou web http://localhost:3000 |
| Total de casos | 13 |
| Última execução | Não realizada |
| Testador | Cauan Ricardo |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 13 | 0 | 0 | 0 | 13 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | A implementação da camada deve existir na branch escolhida para execução; na base `5554bc90` ela ainda não foi identificada. Este é só planejamento, sem stack/testes. Na execução futura, usar ambiente isolado com banco de teste; sem a funcionalidade, marcar a parte dependente como 🚫, não como falha reproduzida nesta rodada. |
| PC-02 | Administrador A do seed; autenticação por `POST /auth/login`, guardando id e horário do executor para auditoria. App no celular (Expo Go) ou web, sem compartilhar armazenamento de sessão entre administrador e outros perfis. |
| PC-03 | Credenciais de aluno aprovado/ativo e representante ativo para autorização. Se não conseguir autenticar representante, registrar motivo e bloquear só essa parte; sessão vencida exige novo login antes de repetir. |
| PC-04 | Massa local de teste, com ids registrados: B1 Centro ativo/P1 Praça José de Barros; B2 Campo Velho ativo/P2 Escola Coronel Virgílio Távora; B0 Alto São Francisco inativo; F1 UFC/Quixadá, F2 IFCE/Quixadá e F3 UECE/Quixadá ativas; F0 Unicatólica/Quixadá inativa. RP0 Rota Antiga inativa sem complementar vinculada; RP1 criada no CT-002, RP2 no CT-003 e RP3 no CT-004. Em falha anterior, a IA pode preparar estado independente por API/banco local, registrando origem e sem aprovar a ação que falhou. |
| PC-05 | **Apoio da IA (Claude Code)** para conferir na API/banco os dados realmente gravados, vínculos e auditoria, e preparar massa quando a UI/API não permitir. Comparar entidades pelos ids reais, não apenas pelo nome exibido. |
| PC-06 | Confirmar a rota final e os controles da tela entregue. Alvo atual do card: web http://localhost:3000/cadastros/rotas-principais; Expo exp://<IP do computador>:8081/--/cadastros/rotas-principais. Esses links são intenção de navegação, não existência confirmada de tela. Confirmar como bairros/pontos são selecionados. |
| PC-07 | HU-013 para agenda futura e novos agendamentos; dados/módulos históricos para RN-004. Registrar datas/fuso. Regra de seleção de inativa e demais decisões abertas devem ser confirmadas antes de julgar a parte correspondente; ausência de decisão é impedimento documentado. |

## Resumo da execução

São **13 casos essenciais**, nas seções A/B/C. Registrar cada variação. CT-001 começa pelo vazio e repete consultas após a massa. Massa criada diretamente pela IA não aprova a operação que se pretende testar. Os passos referem-se a ações do BDD; adequar rótulos à entrega sem mudar os resultados esperados.

### Seção A — Listagem e cadastro

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU011-UI-001 | Acessar rotas, conferir horários e lista vazia | Cadastros → Rotas principais; sem rotas; depois RP1 ativa e RP0 inativa | Lista real; horários corretos; acesso aos dois estados | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-002 | Cadastrar rota mínima e conferir persistência | Rota Centro - UFC; saída 06:30; retorno 17:30; Centro; UFC ida/volta | Sucesso e mesmos dados após reabrir e consultar API | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-003 | Cadastrar com vários bairros e faculdades | Rota Integrada; B1+B2; F1+F2 ida/volta; 06:30/17:30 | Todas as seleções gravadas e exibidas sem perda | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-004 | Configurar volta diferente da ida | RP3: ida UFC+IFCE, volta só UFC; depois ida UFC e volta UECE | Independência persistida, sem copiar seleções entre sentidos | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-005 | Validar obrigatórios e retirada do último vínculo | Nome/saída/retorno vazios; zero bairros; zero faculdades da ida; controle com um | Destaque do campo; salvamento bloqueado; dados anteriores preservados | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-006 | Selecionar somente base ativa e tratar mudança após seleção | B0 inativo; F0 inativa; B1/F1 ativos; base inativada depois de selecionada | Inativos fora das opções; vínculo inválido bloqueado | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-007 | Preencher horários sem troca de turno ou conversão silenciosa | 06:30/17:30; minuto 60/texto se possível; 00:00/23:59 e 23:00→01:00 para caracterizar | Horas preservadas; erros compreensíveis; cronologia sem regra presumida | ⏳ PENDENTE | Não executado. |

### Seção B — Edição, inativação e reativação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU011-UI-008 | Editar rota, horários e vínculos e sair sem salvar | RP1 → Rota Campo Velho - IFCE; 06:00/18:00; B2; ida F2/volta F3 | Mesmo id; dados e listas corretos; alterações não salvas descartadas | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-009 | Cancelar e confirmar inativação sem agenda futura | RP1 sem futuro nem complementar ativa; registro/log anteriores | Cancelar não altera; confirmar faz soft delete só da rota escolhida | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-010 | Mostrar inativas e reativar | RP0 inativa, independente de eventual falha do CT-009 | Registro identificado e mesmo id reativado com persistência | ⏳ PENDENTE | Não executado. |

### Seção C — Integração, acesso e robustez

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU011-UI-011 | Impedir acesso administrativo de aluno e representante | Menus e link direto pretendido /cadastros/rotas-principais | Sem menu de gestão; acesso direto sem ações administrativas | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-012 | Falha de conexão e rejeição da API sem sucesso falso | Lista; cadastro de Rota Offline QA; edição/status em registro real | Erro visível; campos preservados; lista reconciliada com a API | ⏳ PENDENTE | Não executado. |
| CT-HU011-UI-013 | Agenda futura, histórico e indisponibilidade de inativa | Rota com agenda amanhã; outra só com passado; rota inativa; HU-013 | Bloqueio real na futura; histórico preservado; seleção ainda a confirmar | ⏳ PENDENTE | HU-013, histórico real e decisão de seleção; não executado. |

## Detalhamento dos casos

### Seção A — Listagem e cadastro

#### CT-HU011-UI-001 — Acessar rotas, conferir horários e lista vazia

**Dados de entrada:** Cadastros → Rotas principais; sem rotas; depois RP1 ativa e RP0 inativa.

**Passos**

1. Conferir PC-01; como administrador, tocar em Cadastros → Rotas principais. Se a tela ainda não existir, registrar 🚫 e não continuar como se o formulário tivesse sido aberto.
2. Antes da massa, conferir lista vazia com apoio da IA (PC-05); depois preparar RP0 e executar CT-002 para obter RP1.
3. Reabrir a lista, conferir nome/saída/retorno, mecanismo de mostrar inativas e ação de novo cadastro; anotar o estado inicial do filtro.
4. Voltar pela navegação da tela e conferir retorno ao painel de cadastros.

**Resultado esperado**

- Nenhum exemplo apresentado como rota real; as horas exibidas correspondem à API.
- Ativas e inativas acessíveis ao administrador (AC-01, AC-09). O BDD oculta inativas inicialmente com uma chave, mas o requisito cita ambas na listagem; o padrão inicial fica pendente de alinhamento.
- Rótulos de cadastro/edição e posição de controles são referências do BDD, não desenho final implementado. Ausência de tela não é defeito já reproduzido desta rodada.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU011-UI-002 — Cadastrar rota mínima e conferir persistência

**Dados de entrada:** Rota Centro - UFC; saída 06:30; retorno 17:30; Centro; UFC ida/volta.

**Passos**

1. Abrir Nova Rota (ou ação equivalente confirmada na implementação); preencher nome, saída e retorno.
2. Vincular Centro e UFC/Quixadá na ida e na volta; se a tela expuser pontos, selecionar P1 do Centro conforme PC-06.
3. Salvar; anotar a confirmação e conferir a listagem. Se houver diálogo, confirmar a operação.
4. Fechar/reabrir o app, ou recarregar a web; pedir à IA para conferir id, dados e associações na API/banco (PC-05).

**Resultado esperado**

- Rota criada ativa, com nome, horários e vínculos corretos (AC-02); não exigir veículo ou motorista nesta HU.
- Mensagem de sucesso e lista atualizada conforme fluxo/BDD; registrar o texto exato. O BDD usa “Operação realizada com sucesso”.
- Registro continua depois de reabrir e existe na API: resultado só em memória não aprova o caso.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU011-UI-003 — Cadastrar com vários bairros e faculdades

**Dados de entrada:** Rota Integrada; B1+B2; F1+F2 ida/volta; 06:30/17:30.

**Passos**

1. Abrir nova rota e preencher os dados de RP2; selecionar Centro e Campo Velho, UFC e IFCE na ida e na volta.
2. Sair e voltar aos seletores antes de salvar para conferir que selecionar o segundo item não apaga o primeiro.
3. Salvar, reabrir e pedir à IA para conferir todos os vínculos e os dados de RP1 (PC-05).

**Resultado esperado**

- Mais de um bairro e faculdade aceitos (AC-02 e BDD).
- RP2 mantém o conjunto completo nos dois sentidos; não guardar só o último item nem transferir uma seleção entre ida/volta.
- Os dados das outras rotas e das entidades-base não mudam. Não exigir ordem de passagem não definida.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU011-UI-004 — Configurar volta diferente da ida

**Dados de entrada:** RP3: ida UFC+IFCE, volta só UFC; depois ida UFC e volta UECE.

**Passos**

1. Cadastrar RP3 com B1, 06:30/17:30, ida F1+F2 e volta F1.
2. Reabrir e conferir os dois seletores; editar para ida F1 e volta F3.
3. Salvar/reabrir e pedir à IA para confirmar as associações por sentido no banco/API (PC-05).

**Resultado esperado**

- Volta pode diferir da ida (AC-10), inclusive faculdade exclusiva na volta pela independência expressa no requisito.
- Modificar a ida não preenche a volta automaticamente nem obriga os dois conjuntos a coincidirem.
- Este caso mantém a volta preenchida: esvaziá-la exige decisão sobre obrigatoriedade ainda ausente no requisito.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU011-UI-005 — Validar obrigatórios e retirada do último vínculo

**Dados de entrada:** Nome/saída/retorno vazios; zero bairros; zero faculdades da ida; controle com um.

**Passos**

1. Na criação, deixar um obrigatório vazio por vez e preencher corretamente os demais; testar nome só com espaços.
2. Na edição de RP1, esvaziar nome/horários por vez, retirar o último bairro e depois a última faculdade da ida, mantendo a volta preenchida.
3. Tentar salvar cada variação; reabrir o registro entre tentativas e pedir à IA para conferir ausência de alterações/criações (PC-05).

**Resultado esperado**

- Campo obrigatório destacado e orientação em português; não salvar cadastro/edição incompleto (AC-08, FA-003).
- Um bairro e uma faculdade da ida são o controle mínimo do BDD; não perder o último vínculo sem avisar.
- Não acrescentar obrigatoriedade da volta, mínimo de caracteres do nome nem limites máximos não definidos; anotar a pendência da volta.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU011-UI-006 — Selecionar somente base ativa e tratar mudança após seleção

**Dados de entrada:** B0 inativo; F0 inativa; B1/F1 ativos; base inativada depois de selecionada.

**Passos**

1. Abrir seletores de bairros e faculdades da ida/volta e procurar a massa ativa/inativa conferida pela IA (PC-05).
2. Confirmar que B1/F1 podem ser selecionados e B0/F0 não aparecem como opções novas.
3. Para uma variação independente, selecionar base ativa livre; pedir à IA para inativá-la antes de salvar, somente se o ambiente permitir sem violar outra regra. Registrar o preparo.
4. Tentar salvar e pedir à IA para conferir ausência de vínculo inválido e preservação dos demais dados (PC-05).

**Resultado esperado**

- Somente bairros e faculdades ativos oferecidos nos três seletores (AC-03, FA-002).
- Validação final impede gravar novo vínculo com base já inativa, inclusive se a seleção ficou desatualizada.
- Se a regra de HU-007 impedir preparar a inativação, registrar a barreira e usar o caso de API para referências inativas; não contornar proteção de produção nem declarar aprovado sem evidência.
- Tratamento de uma base inativada depois de vínculo já salvo é outra decisão, ainda pendente.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU011-UI-007 — Preencher horários sem troca de turno ou conversão silenciosa

**Dados de entrada:** 06:30/17:30; minuto 60/texto se possível; 00:00/23:59 e 23:00→01:00 para caracterizar.

**Passos**

1. Preencher saída/retorno pelos controles reais da tela e salvar uma configuração válida, sem alterar o bairro/faculdades.
2. Se o controle permitir digitar/colar hora impossível, tentar minuto 60 e texto; se só permitir opções válidas, registrar essa proteção.
3. Caracterizar fronteiras do relógio e retorno no dia seguinte apenas como observação até decisão; pedir à IA para conferir valores salvos (PC-05).
4. Reabrir em celular/web disponível e comparar os horários locais, sem exigir teste em uma plataforma que não esteja preparada.

**Resultado esperado**

- 06:30/17:30 preservados na listagem, edição e API, sem trocar saída/retorno ou deslocar por fuso.
- Entrada incompatível com o formato confirmado deve mostrar o campo e não gravar; teclado seletivo não prova validação do backend.
- Faixa operacional, retorno posterior à saída e pernoite não estão definidos: essa parte permanece pendente de decisão, sem reprovar a implementação por uma suposição.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção B — Edição, inativação e reativação

#### CT-HU011-UI-008 — Editar rota, horários e vínculos e sair sem salvar

**Dados de entrada:** RP1 → Rota Campo Velho - IFCE; 06:00/18:00; B2; ida F2/volta F3.

**Passos**

1. Abrir Editar de RP1 e conferir dados atuais e seleções; alterar nome, horas, bairro e faculdades conforme entrada.
2. Salvar, conferir listagem e reabrir; pedir à IA para confirmar id e vínculos de RP1 e que RP2 não mudou (PC-05).
3. Alterar um nome sem salvar, voltar e reabrir; pedir à IA para confirmar que essa mudança não foi persistida (PC-05).

**Resultado esperado**

- Edição válida mantém o id e persiste os campos e associações corretos (AC-04).
- Remover um vínculo da configuração atual não apaga a entidade-base nem altera outra rota.
- Sair sem acionar salvar mantém o último dado gravado; não exigir diálogo de descarte que ainda não foi especificado.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU011-UI-009 — Cancelar e confirmar inativação sem agenda futura

**Dados de entrada:** RP1 sem futuro nem complementar ativa; registro/log anteriores.

**Passos**

1. Pedir à IA para conferir o cenário sem futuro e registrar estado/log antes (PC-05).
2. Acionar Inativar, se houver diálogo cancelar e conferir que o registro continua ativo; pedir à IA para confirmar ausência de escrita (PC-05).
3. Repetir e confirmar; anotar texto e lista; reabrir e pedir à IA para conferir estado, registro e auditoria (PC-05).

**Resultado esperado**

- Cancelamento, quando oferecido, não grava mudança nem log de inativação concluída.
- Inativação válida mostra “Operação realizada com sucesso” e atualiza a lista conforme o mecanismo de status escolhido (AC-05, AC-07).
- Rota permanece no banco como inativa com mesmo id/vínculos e auditoria correta; outra rota não é afetada.
- Cascata para complementares não é avaliada aqui: a rota da massa não tem complementares ativas.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU011-UI-010 — Mostrar inativas e reativar

**Dados de entrada:** RP0 inativa, independente de eventual falha do CT-009.

**Passos**

1. Usar Mostrar inativos ou o mecanismo aprovado para localizar RP0; conferir identificação de inativa.
2. Acionar Reativar; se houver confirmação, cancelar primeiro e depois repetir confirmando.
3. Reabrir e pedir à IA para conferir status, dados e log na API/banco (PC-05).

**Resultado esperado**

- Inativa acessível e identificada (AC-09), sem confundir com rota ativa.
- Reativação, prevista no fluxo/BDD, mantém id e configuração e exibe sucesso; se recusada, deve haver feedback visível.
- Preparo direto de RP0 não aprova o fluxo de inativação. O padrão inicial da lista continua sujeito à divergência documentada.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção C — Integração, acesso e robustez

#### CT-HU011-UI-011 — Impedir acesso administrativo de aluno e representante

**Dados de entrada:** Menus e link direto pretendido /cadastros/rotas-principais.

**Passos**

1. Entrar como aluno e conferir menus; abrir o link direto confirmado para a tela de gestão (PC-06).
2. Repetir como representante ativo; se o login estiver indisponível, registrar só essa variação como bloqueada.
3. Confirmar que é a tela administrativa e não uma lista de rotas destinada ao agendamento.

**Resultado esperado**

- Aluno/representante não veem o menu de gestão nem conseguem abrir formulário ou ações administrativas (RN-006, BDD).
- Rejeição/redirecionamento ocorre sem exibir dados administrativos brevemente; Acesso Negado é o padrão atual do app, a confirmar na tela entregue.
- Rota inexistente não prova proteção: só executar a verificação com a implementação presente. A API de escrita é coberta no CT-HU011-API-012.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU011-UI-012 — Falha de conexão e rejeição da API sem sucesso falso

**Dados de entrada:** Lista; cadastro de Rota Offline QA; edição/status em registro real.

**Passos**

1. Na execução futura, tornar somente a API inacessível, mantendo o bundle Expo disponível; tentar abrir a listagem.
2. Carregar formulário/registro com conexão antes, se necessário, e retirar a conexão antes de salvar ou mudar status.
3. Restaurar acesso, reabrir e pedir à IA para conferir registros, vínculos e logs (PC-05).
4. Se houver resposta de negócio recusando operação, conferir que a tela também a apresenta, sem transformar erro em sucesso.

**Resultado esperado**

- Falha de conexão ou negócio aparece em português, sem travamento e sem exemplos inventados para preencher a lista.
- Não informar sucesso de escrita sem confirmação da API; manter dados úteis do formulário para nova tentativa.
- Reconciliar o resultado ao reconectar; distinguir resposta perdida após gravação de alteração puramente local com apoio da IA, sem criar duplicação.
- Este é risco preventivo de integração, não afirmação de que existe service com mocks para rotas nesta versão.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU011-UI-013 — Agenda futura, histórico e indisponibilidade de inativa

**Dados de entrada:** Rota com agenda amanhã; outra só com passado; rota inativa; HU-013.

**Passos**

1. Conferir PC-07; pedir à IA para preparar vínculos reais e registrar datas/fuso e histórico (PC-05). Sem dependência, marcar a parte como 🚫.
2. Tentar inativar a rota com agenda futura; depois a que só tem passado; conferir os resultados com a IA.
3. Após confirmação da regra de seleção, abrir o agendamento do aluno e procurar a inativa; sem decisão manter essa parte bloqueada.
4. Reabrir registros e pedir à IA para comparar histórico/logs, sem usar exemplos locais como agendamento real.

**Resultado esperado**

- Futuro bloqueia com mensagem de agendamentos pendentes; estado ativo preservado (AC-06, FA-001).
- Histórico passado não equivale a futuro e não é apagado pela inativação (RN-004).
- Ausência de inativa no agendamento é proposta inferida do BDD, não regra já aprovada. HU-013, histórico real e decisão são dependências separadas.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 / AC-09 — listagem e inativas | Visualiza ativas com horários; visualiza inativas | CT-001, CT-010; padrão inicial pendente |
| AC-02 — cadastro/múltiplos vínculos | Cadastra rota; vários bairros/faculdades | CT-002, CT-003; pontos a confirmar |
| AC-03 / FA-002 — seleção ativa | Não oferece base inativa | CT-006 |
| AC-04 — edição | Edita dados existentes | CT-008, CT-004 |
| AC-05 / RF-014 — soft delete | Inativa sem futuro; mantém registro | CT-009, com apoio da IA |
| Fluxo principal — reativação | Reativa rota inativa | CT-010 |
| AC-06 / FA-001 — agenda futura | Bloqueia inativação com agendamentos futuros | CT-013 — HU-013 |
| AC-07 — confirmação da inativação | Inativa e atualiza lista | CT-009; demais sucessos pelo fluxo/BDD |
| AC-08 / FA-003 — obrigatórios | Cadastro/edição com obrigatório vazio | CT-005 |
| AC-10 — volta independente | Configura volta diferente da ida | CT-004 |
| RF-013 — horários | Preenchimento no cadastro/edição; formato e fronteiras como complemento técnico | CT-007 — cronologia operacional pendente |
| RNF-013 / fluxo — auditoria | Log de escritas | CT-009, CT-010 e CT-HU011-API-010, com apoio da IA |
| RN-004 — histórico | Preserva registros antigos | CT-013 — histórico real |
| Regra inferida de seleção | Inativa fora do agendamento | CT-013 — HU-013 e decisão |
| RN-006 — exclusividade administrativa | Menu não exibido a aluno/representante | CT-011; escrita em CT-HU011-API-012 |
| Robustez da integração | Cobertura complementar de falha de conexão; sem cenário BDD específico | CT-012 |

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
- Suíte complementar: [API-HU-011.md](../api/API-HU-011.md). Sempre usar PC-05 nas conferências de persistência/auditoria; Cauan não precisa consultar o banco manualmente.
