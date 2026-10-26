# Testes manuais de UI — HU-012 — Gerenciamento de Rotas Complementares

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Gestão de Rotas e Horários (EP-003) |
| Funcionalidade | HU-012 — Gerenciamento de Rotas Complementares |
| Camada | UI |
| Tipo de teste | Funcional manual — suíte essencial (baseada em risco), planejada antes da implementação |
| Tela | Administrador → Cadastros → Rotas complementares, alvo de navegação ainda sem tela correspondente identificada. Controles internos descritos pelo BDD, sujeitos à confirmação na entrega. |
| Ambiente | A preencher — URL, branch e commit da implementação, celular (Expo Go) ou web http://localhost:3000 |
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
| PC-01 | A camada da HU-012 deve existir na branch escolhida para execução; na base `5554bc90` ela não foi identificada. Este é planejamento, sem stack/testes. Na execução futura usar ambiente isolado; sem funcionalidade, registrar 🚫 nas partes dependentes. |
| PC-02 | Administrador A do seed, autenticado via `POST /auth/login`; anotar id e horário para auditoria. App em celular (Expo Go) ou web; sessões de administrador e outros perfis em armazenamento separado. |
| PC-03 | Credenciais de aluno aprovado/ativo e representante ativo; falha de login bloqueia somente a respectiva variação. Sessão vencida exige novo login antes de repetir o passo. |
| PC-04 | Principais com dados-base válidos: RP-A Rota Centro - UFC ativa (06:30/17:30), RP-B Rota Integrada ativa e RP-0 Rota Antiga inativa. RC0 Van Antiga inativa vinculada a RP-A ativa; RC1 Van 2 - Bairro Novo criada no CT-002 com saída 06:00 e conexão Trevo do Bairro Novo. Usar ids distintos e registrar o identificador de cada tipo; preparar massa via HU-011/API/banco local se necessário, anotando origem sem contar como aprovação funcional. |
| PC-05 | **Apoio da IA (Claude Code)** para conferir persistência, vínculo correto, estados e auditoria na API/banco e preparar massa local quando necessário. Cauan executa UI; ids de principal e complementar não devem ser confundidos. |
| PC-06 | Confirmar tela e rota final. Alvo atual do card: web http://localhost:3000/cadastros/rotas-complementares; Expo exp://<IP do computador>:8081/--/cadastros/rotas-complementares. São alvos de navegação, não existência comprovada. Confirmar forma de seleção/entrada da conexão. |
| PC-07 | HU-011 ou preparo local para principais; HU-013 para agenda; módulos/dados históricos para RN-004; decisões abertas antes de julgar a parte correspondente. Sem dependência/decisão, registrar 🚫 somente na parte afetada. |

## Resumo da execução

São **13 casos essenciais**, nas seções A/B/C. CT-001 verifica vazio antes da massa e repete depois de CT-002. CT-006 edita RC1; CT-007 cancela; CT-008 inativa RC1; CT-009 reativa RC0 preparada. Registrar cada variação e origem de massa; dados preparados pela IA não aprovam a funcionalidade.

### Seção A — Listagem e cadastro

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU012-UI-001 | Acessar complementares e conferir lista vazia e vínculos | Cadastros → Rotas complementares; vazio; RC1 ativa e RC0 inativa | Lista real, horário/conexão/principal corretos e acesso aos dois estados | ⏳ PENDENTE | Não executado. |
| CT-HU012-UI-002 | Cadastrar complementar e confirmar persistência | Van 2 - Bairro Novo; principal RP-A; 06:00; Trevo do Bairro Novo | Sucesso; complementar ativa e vínculo persistido após reabrir | ⏳ PENDENTE | Não executado. |
| CT-HU012-UI-003 | Validar obrigatórios no cadastro e na edição | Nome, saída, conexão e principal vazios; texto só com espaços | Campos destacados e salvamento bloqueado, sem dados incompletos | ⏳ PENDENTE | Não executado. |
| CT-HU012-UI-004 | Selecionar principal ativa e conferir vínculo escolhido | RP-A e RP-B ativas; RP-0 inativa; duas opções com nomes identificáveis | Inativa ausente; escolha preservada, sem vincular primeira opção por engano | ⏳ PENDENTE | Não executado. |
| CT-HU012-UI-005 | Preencher horário e conexão sem perda ou conversão | 06:00 e 05:45; conexão Trevo do Bairro Novo/Posto Central; hora impossível se digitável | Valores corretos na tela/API; erro no campo para formato inválido | ⏳ PENDENTE | Não executado. |
| CT-HU012-UI-006 | Editar dados e trocar principal na complementar correta | RC1 → Van 3 - Bairro Novo; 05:45; Posto Central; RP-A → RP-B | Mesmo id; todos os dados e novo vínculo persistidos | ⏳ PENDENTE | Não executado. |

### Seção B — Inativação e reativação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU012-UI-007 | Cancelar inativação sem alteração ou auditoria de sucesso | RC1 ativa; estado e logs anteriores | Cancelamento mantém complementar e principal como estavam | ⏳ PENDENTE | Não executado. |
| CT-HU012-UI-008 | Confirmar inativação sem agendamento futuro | RC1 sem agenda futura; RP-B ativa | Soft delete somente da complementar; sucesso e persistência | ⏳ PENDENTE | Não executado. |
| CT-HU012-UI-009 | Mostrar inativa e reativar com principal ativa | RC0 inativa com RP-A ativa, independente do CT-008 | Inativa identificada; mesma complementar volta às ativas | ⏳ PENDENTE | Não executado. |

### Seção C — Integração, acesso e robustez

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU012-UI-010 | Bloquear acesso administrativo de aluno e representante | Menus e link confirmado de /cadastros/rotas-complementares | Sem gestão para outros perfis; acesso direto protegido | ⏳ PENDENTE | Não executado. |
| CT-HU012-UI-011 | Falha de conexão sem sucesso local nem exemplos inventados | Listagem; cadastro Complementar Offline QA; edição/status com API inacessível | Erro visível; dados preservados; reconciliação sem duplicações | ⏳ PENDENTE | Não executado. |
| CT-HU012-UI-012 | Tratar principal inativada entre selecionar e salvar | Principal de teste ativa selecionada em novo cadastro/edição; depois inativada antes de confirmar | Vínculo novo inválido bloqueado, sem edição parcial | ⏳ PENDENTE | Não executado. |
| CT-HU012-UI-013 | Agenda futura, histórico e seleção pelo aluno | Complementar com amanhã; outra só com passado; uma inativa; HU-013 e histórico | Futuro bloqueia; histórico preservado; seleção inferida aguarda decisão | ⏳ PENDENTE | Depende de HU-013, histórico e decisão de seleção; não executado. |

## Detalhamento dos casos

### Seção A — Listagem e cadastro

#### CT-HU012-UI-001 — Acessar complementares e conferir lista vazia e vínculos

**Dados de entrada:** Cadastros → Rotas complementares; vazio; RC1 ativa e RC0 inativa.

**Passos**

1. Conferir PC-01 e abrir Cadastros → Rotas complementares como administrador. Sem tela entregue, registrar 🚫, não simular execução.
2. Antes da massa, pedir à IA para conferir vazio; depois preparar RC0 e executar CT-002 para obter RC1 (PC-05).
3. Reabrir e conferir nome, saída, conexão, rota principal, identificação de estado e ação de novo cadastro; anotar padrão inicial da lista.

**Resultado esperado**

- Nenhuma rota fictícia para preencher vazio; dados exibidos correspondem à API.
- Ativas e inativas acessíveis ao administrador (AC-01, AC-09). Padrão inicial/filtro divergem entre requisito e BDD e devem ser alinhados.
- A principal exibida deve corresponder à vinculada de fato, não a valor fixo de exemplo ou primeiro item.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU012-UI-002 — Cadastrar complementar e confirmar persistência

**Dados de entrada:** Van 2 - Bairro Novo; principal RP-A; 06:00; Trevo do Bairro Novo.

**Passos**

1. Abrir Nova Rota; preencher nome, saída, ponto de conexão e selecionar RP-A pelo nome/id conferido pela IA (PC-05).
2. Salvar e, se houver diálogo, confirmar; anotar mensagem e conferir a listagem.
3. Fechar/reabrir o app ou recarregar a web; pedir à IA para conferir id, valores, principal e auditoria na API/banco (PC-05).

**Resultado esperado**

- Cadastro com os dados definidos no BDD/AC-02 e estado ativo; principal não muda.
- Confirmação de sucesso e lista atualizada; o BDD usa “Operação realizada com sucesso”. Registrar o texto exato; AC-07 o fixa para inativação.
- Mesmo dado após reabrir, realmente persistido. Não exigir cadastro de veículo/motorista nesta tela sem requisito.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU012-UI-003 — Validar obrigatórios no cadastro e na edição

**Dados de entrada:** Nome, saída, conexão e principal vazios; texto só com espaços.

**Passos**

1. No cadastro, retirar um campo por vez mantendo os demais válidos e tentar salvar.
2. Na edição de RC1, esvaziar nome/saída/conexão/principal por vez. Se o seletor não permitir limpar, registrar que essa variação não pode ser montada pela UI e referenciar CT-HU012-API-003.
3. Pedir à IA para conferir ausência de criação e preservação de RC1 após cada recusa (PC-05).

**Resultado esperado**

- Indicar obrigatório em português e bloquear salvamento (AC-08, FA-003; nome também por AC-02/BDD).
- Sem preenchimento da principal não pode ser enviado id padrão oculto; vazio não é substituído silenciosamente por conexão/horário de exemplo.
- Não inventar mínimo de caracteres, conexão múltipla ou retorno obrigatório; a forma final de entrada da conexão ainda deve ser mapeada.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU012-UI-004 — Selecionar principal ativa e conferir vínculo escolhido

**Dados de entrada:** RP-A e RP-B ativas; RP-0 inativa; duas opções com nomes identificáveis.

**Passos**

1. Abrir seleção de principal no cadastro e na edição; procurar as três rotas da massa conferida pela IA (PC-05).
2. Selecionar RP-B, sair e voltar ao seletor antes de salvar; conferir o item marcado.
3. Salvar uma complementar independente e pedir à IA para conferir id da principal realmente enviado/gravado (PC-05).

**Resultado esperado**

- Somente principais ativas oferecidas para novo vínculo (AC-03, FA-002), com informação suficiente para diferenciar opções.
- RP-B selecionada é mantida e persistida; não voltar à primeira rota nem usar id padrão.
- Não inferir regra de reativação com principal inativa nem de cascata de inativação a partir do filtro de novos vínculos.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU012-UI-005 — Preencher horário e conexão sem perda ou conversão

**Dados de entrada:** 06:00 e 05:45; conexão Trevo do Bairro Novo/Posto Central; hora impossível se digitável.

**Passos**

1. Preencher saída/conexão, salvar e reabrir; pedir à IA para comparar os valores persistidos (PC-05).
2. Se o controle permitir digitar/colar, tentar minuto 60 e texto como horário; se impedir, registrar a proteção sem afirmar validação de API.
3. Caracterizar 00:00/23:59 e saída posterior à principal apenas para alinhamento; não julgar janela de transferência sem decisão.

**Resultado esperado**

- Horário e conexão preservados, sem troca pelo valor da principal, corte de texto ou conversão silenciosa de hora.
- Formato impossível para o controle/contrato confirmado é recusado com orientação no campo e sem gravação.
- Quantidade de horários/conexões, faixa e relação temporal com a principal estão pendentes. O recorte BDD usa um horário de saída e uma conexão.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU012-UI-006 — Editar dados e trocar principal na complementar correta

**Dados de entrada:** RC1 → Van 3 - Bairro Novo; 05:45; Posto Central; RP-A → RP-B.

**Passos**

1. Abrir Editar de RC1 e conferir valores existentes; alterar os quatro campos conforme entrada.
2. Salvar, conferir a lista e reabrir após fechar o app/recarregar a web.
3. Pedir à IA para conferir id de RC1, referência RP-B, ausência de associação atual residual a RP-A e dados das principais/RC0 (PC-05).
4. Alterar o nome sem salvar, voltar e reabrir; conferir com apoio da IA que não houve gravação dessa mudança (PC-05).

**Resultado esperado**

- Edição prevista no AC-04/BDD persiste os quatro dados no mesmo registro e mostra sucesso.
- Somente a complementar selecionada muda; não editar a principal nem criar outra complementar por confusão de ids.
- Dados não salvos ficam fora da persistência. Não exigir diálogo de descarte não especificado; histórico da configuração anterior é conferido no CT-013.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção B — Inativação e reativação

#### CT-HU012-UI-007 — Cancelar inativação sem alteração ou auditoria de sucesso

**Dados de entrada:** RC1 ativa; estado e logs anteriores.

**Passos**

1. Pedir à IA para registrar estado e auditoria de RC1/RP-B (PC-05).
2. Acionar Inativar e, se a confirmação for oferecida, cancelar.
3. Reabrir lista e pedir à IA para conferir dados, status e ausência de escrita concluída (PC-05).

**Resultado esperado**

- Cancelar uma ação ainda não confirmada não grava inativação nem altera a principal.
- Sem mensagem de inativação bem-sucedida nem log de alteração concluída; eventual evento de tentativa não é sucesso.
- Rótulo/modal são referências do fluxo de confirmação do BDD; se a implementação não oferecer cancelamento, registrar a diferença para alinhamento sem inventar desenho de tela.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU012-UI-008 — Confirmar inativação sem agendamento futuro

**Dados de entrada:** RC1 sem agenda futura; RP-B ativa.

**Passos**

1. Pedir à IA para confirmar ausência de futuro e registrar ids/status (PC-05).
2. Acionar Inativar e confirmar; anotar mensagem e listagem.
3. Reabrir e pedir à IA para conferir RC1 mantida inativa, vínculo, principal e log (PC-05).

**Resultado esperado**

- Mensagem “Operação realizada com sucesso” e atualização da lista (AC-07).
- Complementar permanece no banco inativa com mesmo id e dados, conforme AC-05/RF-014; principal continua ativa.
- Se houver erro, exibir mensagem clara e manter estado compatível com a API; não alterar outro registro nem fingir sucesso local.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU012-UI-009 — Mostrar inativa e reativar com principal ativa

**Dados de entrada:** RC0 inativa com RP-A ativa, independente do CT-008.

**Passos**

1. Usar o mecanismo aprovado de mostrar inativas e localizar RC0; conferir principal ainda ativa (PC-05).
2. Acionar Reativar; se houver diálogo, cancelar primeiro e depois confirmar.
3. Reabrir e pedir à IA para conferir id, dados, vínculo e auditoria na API/banco (PC-05).

**Resultado esperado**

- Inativa visível e identificada (AC-09); reativação prevista no fluxo/BDD persiste no mesmo registro.
- Cancelamento, quando disponível, não altera; confirmação mostra sucesso e atualiza listagem.
- Não confundir id de complementar com o da principal. Reativação se a principal estiver inativa é decisão pendente e não é julgada por este caso.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção C — Integração, acesso e robustez

#### CT-HU012-UI-010 — Bloquear acesso administrativo de aluno e representante

**Dados de entrada:** Menus e link confirmado de /cadastros/rotas-complementares.

**Passos**

1. Entrar como aluno, conferir menus e abrir o link direto confirmado em PC-06.
2. Repetir como representante ativo, registrando falha de login separadamente.
3. Conferir que a verificação é da gestão, não da seleção de transporte do aluno.

**Resultado esperado**

- Menu de gestão de complementares ausente para aluno/representante; sem formulário/ações administrativas pelo link (RN-006, BDD).
- Redirecionamento/recusa sem breve exposição de conteúdo administrativo; Acesso Negado é o padrão do app, a confirmar na entrega.
- Sem tela implementada, rota ausente não prova segurança. Escritas diretas são cobertas em CT-HU012-API-012.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU012-UI-011 — Falha de conexão sem sucesso local nem exemplos inventados

**Dados de entrada:** Listagem; cadastro Complementar Offline QA; edição/status com API inacessível.

**Passos**

1. Na execução futura, tornar só a API inacessível e abrir listagem/formulário, mantendo bundle Expo disponível.
2. Se necessário carregar com conexão antes, retirar acesso antes de salvar cadastro/edição ou confirmar mudança de status.
3. Restaurar, reabrir e pedir à IA para conferir complementares, vínculos, estados e logs (PC-05).

**Resultado esperado**

- Erro de conexão em português, sem travar nem mostrar complementares fictícias como reais.
- Não exibir sucesso sem confirmação da API; manter dados de formulário úteis para tentar de novo.
- Após restaurar, refletir o estado persistido; a IA deve distinguir resposta perdida de alteração apenas local, evitando duplicar registros.
- Não há service de complementares identificado na base: a cobertura é preventiva, não acusação de mock já implementado.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU012-UI-012 — Tratar principal inativada entre selecionar e salvar

**Dados de entrada:** Principal de teste ativa selecionada em novo cadastro/edição; depois inativada antes de confirmar.

**Passos**

1. Selecionar principal ativa livre e manter o formulário aberto com os demais campos válidos.
2. Pedir à IA para inativar essa principal antes do salvamento, somente se for possível preparar o estado sem violar proteções existentes; registrar a origem (PC-05).
3. Salvar na UI; pedir à IA para conferir resposta, ausência de novo vínculo e preservação integral dos dados anteriores (PC-05).

**Resultado esperado**

- Mesmo com seletor desatualizado, não gravar novo vínculo com principal já inativa (AC-03, FA-002, RNF-012).
- Exibir erro compreensível e permitir corrigir seleção, sem afirmar sucesso nem salvar outros campos parcialmente.
- Se a preparação for impedida, registrar o bloqueio e usar referências inválidas na API. Esta é criação/edição de vínculo novo; a política de reativar vínculo antigo com principal inativa é outra decisão.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU012-UI-013 — Agenda futura, histórico e seleção pelo aluno

**Dados de entrada:** Complementar com amanhã; outra só com passado; uma inativa; HU-013 e histórico.

**Passos**

1. Conferir PC-07 e pedir à IA para preparar dados reais e registrar datas/fuso e histórico (PC-05).
2. Tentar inativar com futuro e só com passado; pedir à IA para comparar estado, vínculos históricos, principal e logs.
3. Com HU-013 e decisão disponíveis, abrir agendamento do aluno e procurar a inativa; sem suporte, registrar a parte como 🚫.

**Resultado esperado**

- Futuro informa agendamentos pendentes e mantém ativa (AC-06, FA-001); somente passado não equivale a bloqueio futuro.
- Histórico preservado sem apagar vínculo antigo nem alterar principal (RN-004).
- Ausência de inativa no agendamento é proposta inferida do BDD e depende de decisão. RN-010 no uso diário/veículo fica para as HUs operacionais; abrir cadastro não comprova esse fluxo.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 / AC-09 — listagem e inativas | Visualiza ativas com dados; visualiza inativas | CT-001, CT-009; padrão inicial pendente |
| AC-02 — cadastro | Cadastra nova complementar | CT-002 |
| AC-03 / FA-002 — seleção de principal ativa | Não oferece principal inativa | CT-004, CT-012 |
| AC-04 — edição | Edita nome, saída, conexão e principal | CT-006 |
| AC-05 / RF-014 — soft delete | Inativa sem futuro e mantém registro | CT-007, CT-008, com apoio da IA |
| Fluxo principal — reativação | Reativa com principal ativa | CT-009 |
| AC-06 / FA-001 — agenda futura | Bloqueia inativação com agendamentos futuros | CT-013 — HU-013 |
| AC-07 — confirmação da inativação | Inativa e atualiza lista | CT-008 |
| AC-08 / FA-003 — obrigatórios | Cadastro/edição esvaziando | CT-003; nome também por AC-02/BDD |
| RF-028 — horário e conexão | Preenchimento do cadastro/edição; consistência como complemento técnico | CT-005 — relação temporal com principal pendente |
| RNF-013 / fluxo — auditoria | Log das escritas | CT-002, CT-007, CT-008, CT-009 e CT-HU012-API-010, com apoio da IA |
| RN-004 — histórico | Preserva registros antigos | CT-013 — histórico real |
| RN-010 — uso operacional | Inativa fora do agendamento (inferência BDD) | CT-013 — HU-013/decisão; operação diária fora do recorte |
| RN-006 — exclusividade administrativa | Menu não exibido a aluno/representante | CT-010; API em CT-HU012-API-012 |
| Robustez da integração | Cobertura complementar de falha de conexão; sem cenário BDD específico | CT-011 |

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
- Suíte complementar: [API-HU-012.md](../api/API-HU-012.md). As conferências de gravação, auditoria e histórico usam PC-05; Cauan não precisa consultar banco manualmente.
