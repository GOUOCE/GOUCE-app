# Testes manuais de UI — HU-014 — Visualização e Cancelamento de Agendamentos

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Agendamento de Transporte — Aluno (EP-004) |
| Funcionalidade | HU-014 — Meus Agendamentos |
| Camada | UI — celular ou web |
| Tipo de teste | Funcional manual essencial, integração e recuperação de erro — baseado em risco |
| Tela | Aba **Agenda** e atalho **Meus Agendamentos** no Início; calendário, menu do dia, detalhes e confirmação |
| Ambiente | Navegador (versão web) em `http://localhost:3014`, front do PR #378 `7d5f0127` (com contorno local de 2 linhas em `api.ts`, porque o PR fixa a web na porta 8000); API `develop` `7c302a8c` em `http://localhost:8014`, banco limpo, fuso America/Fortaleza |
| Total de casos | 11 |
| Última execução | 10/11/2026 |
| Testador | Cauan Ricardo — execução manual; LLM — apoio de massa e conferência de API/banco |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ❌ Reprovada (3 passaram, 5 falharam, 3 bloqueados) | 11 | 3 | 5 | 0 | 3 | 0 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | App do [PR #378](https://github.com/GOUOCE/GOUCE-app/pull/378), branch `feature/front-hu014`, conectado à API real com HU-014. Anotar commits de ambos; a branch de planejamento não contém as telas. |
| PC-02 | Alunos A e B aprovados com vínculo válido, contas distintas e reservas distintas. Cauan entra como A; credenciais não entram nas evidências. Administrador e sessão encerrada para CT-010. |
| PC-03 | LLM prepara rotas/pontos/IES ativos e reservas de A: R1 (D+1, ida e volta), R2 (outro dia válido, só ida), R3 (outro dia válido, só volta); B tem RB. D é a data local do servidor; conferir relógio/fuso do aparelho sem alterar o host. Guardar ids reais. |
| PC-04 | CT-001 começa sem reservas futuras de A. Depois dele a LLM cria R1/R2/R3. Preparar também RP (ontem, histórico ATIVO), feriado/recesso e, se possível, reserva em mês adjacente dentro da janela por fixture documentada no banco isolado. |
| PC-05 | Dados de R2/R3 devem ser diferentes dos detalhes fixos do código (trajeto, ponto e IES); pelo menos uma reserva deve ter id diferente dos ids fixos da grade. Não ajustar datas para setembro/2026 para fazer a tela passar. |
| PC-06 | Apoio da LLM para conferir `GET /transporte/agendamentos/meus`, `/calendario?mes=YYYY-MM`, `/{id}`, banco e alocação. Ausência de HU-016/018 bloqueia a comprovação da liberação de vaga, não as demais verificações. |
| PC-07 | Falhas de comunicação simuladas no dispositivo/navegador antes do envio; a LLM mantém canal separado para verificar a API. Restaurar rede entre os casos. |

## Resumo da execução

Executar na ordem, preparando novamente apenas a massa que os casos consumirem. Registrar resultado por variação. Se a tela não alcançar uma etapa, registrar o impedimento; um GET executado pela LLM não substitui a observação da UI.

### Seção A — Acesso, calendário e consulta

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU014-UI-001 | Acesso e estado vazio | A sem reservas futuras; aba e atalho | Tela acessível; mensagem exata de estado vazio; nenhum dado de B/exemplo | ✅ PASSOU | Aba e atalho abrem a mesma tela, com a mensagem exata de estado vazio. |
| CT-HU014-UI-002 | Calendário mensal e contador reais | R1/R2/R3, feriado/recesso, mês atual e adjacente | Dias/legenda corretos, navegação funcional, contador igual à API | ❌ FALHOU | Calendário fixo em setembro/2026, sem navegação de mês e sem as reservas reais. Contador 3 de 22 correto. |
| CT-HU014-UI-003 | Menu, detalhes e entrada da edição | Dia de R1/R2/R3 | Três ações; dados do registro selecionado; edição abre a reserva existente | ❌ FALHOU | Menu abre só nos 5 dias fixos; detalhes com texto fixo; Editar abre a tela preta do Expo. |

### Seção B — Confirmação, cancelamento e histórico

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU014-UI-004 | Modal e desistência | Remover R1 → Cancelar | Título, aviso e botões corretos; reserva e contador intactos | ✅ PASSOU | Modal correto em um dia fixo de setembro; desistir não altera nada. |
| CT-HU014-UI-005 | Confirmar e persistir após reabrir | Remover R1 → Confirmar | Sucesso real; dia e contador atualizados; cancelamento permanece após reabrir | 🚫 BLOQUEADO | A reserva R1 não é selecionável na grade fixa. |
| CT-HU014-UI-006 | Cancelar hoje sem prazo mínimo | Reserva de D antes e depois da saída | Opção disponível e cancelamento aceito nas duas condições | 🚫 BLOQUEADO | O dia de hoje não existe na grade fixa. |
| CT-HU014-UI-007 | Proteger o histórico de ontem | RP em D−1 | Histórico consultável sem ação de remover; nenhum cancelamento | ❌ FALHOU | Dias passados oferecem **Cancelar agendamento**; o histórico real não aparece. |

### Seção C — Falhas, isolamento e limite

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU014-UI-008 | Falha ao confirmar cancelamento | R2 com requisição bloqueada antes de chegar à API | Mensagem de conexão; R2 ativa e contador intacto; repetição com rede funciona | ❌ FALHOU | Offline, o app mostra sucesso falso em toast preto. |
| CT-HU014-UI-009 | Falha ao carregar e recusa do servidor | Rede bloqueada no GET; reserva cancelada em outra sessão antes do DELETE | Erro explícito; nenhum vazio/sucesso falso; sincronização recupera estado real | ❌ FALHOU | Offline, a Agenda mostra o estado vazio como se não houvesse reservas. |
| CT-HU014-UI-010 | Sessão e isolamento entre contas | A → sair → B; sem sessão; administrador | Cada aluno vê só suas reservas; acesso sem permissão bloqueado | ✅ PASSOU | B vê só a sua reserva (1 de 22); isolamento correto. |
| CT-HU014-UI-011 | Contador no limite e última reserva | 22 → 21 → 22; depois 1 → 0 | Cancelar libera limite; reagendamento aparece; última remoção exibe estado vazio | 🚫 BLOQUEADO | Depende de cancelar e reagendar reservas reais, inacessíveis na grade. |

## Detalhamento dos casos

### Seção A — Acesso, calendário e consulta

#### CT-HU014-UI-001 — Acesso e estado vazio

**Técnica/tipo:** partição de equivalência e limite zero; funcional positivo.

**Dados de entrada:** aluno A sem agendamentos futuros; B com RB; histórico de A pode existir.

**Passos**

1. Entrar como A e abrir **Agenda** pela barra inferior.
2. Conferir título e mensagem; voltar ao Início e abrir **Meus Agendamentos** pelo atalho.
3. Reabrir o app (na web, recarregar); pedir à LLM para confirmar `/meus` com `ativos: 0`.

**Resultado esperado**

- Os dois caminhos abrem **Meus agendamentos**, sem rota inexistente ou travamento.
- Exibir “Você ainda não possui agendamentos futuros.” (AC-02, FA-001).
- Nenhuma reserva de B, antiga ou de exemplo é apresentada como futura. O estado vazio deve decorrer de resposta válida da API, não de uma falha de conexão.
- Depois deste caso, solicitar à LLM a criação de R1/R2/R3 para continuar.

**Resultado obtido**

- Entrando como A (sem reservas futuras), a aba **Agenda** e o atalho **Meus Agendamentos** do Início abriram a mesma tela **Meus agendamentos**.
- Mensagem exata: “Você ainda não possui agendamentos futuros.”; recarregar a página manteve o resultado.
- Conferido na API antes de criar as reservas: `GET /transporte/agendamentos/meus` da A com `ativos: 0`.
- Status: ✅ Passou.

---

#### CT-HU014-UI-002 — Calendário mensal e contador reais

**Técnica/tipo:** partição por estado e limite de mês; funcional e integração.

**Dados de entrada:** R1/R2/R3, feriado/recesso e dia indisponível preparados pela LLM; mês atual e mês adjacente.

**Passos**

1. Sair e voltar à aba Agenda após a preparação; conferir mês/ano e dias destacados.
2. Comparar datas, estados e contador com a resposta de `/calendario` e `/meus`, com apoio da LLM.
3. Usar setas/seletor para mudar o mês e voltar. Conferir quantidade de dias e alinhamento com os dias da semana.
4. Tocar em feriado/recesso e dia indisponível; verificar que não abrem ações de uma reserva inexistente.

**Resultado esperado**

- Calendário mensal interativo com estados e legenda **Agendado**, **Indisponível para agendamento** e **Feriado**, coerentes com a base; recesso não aparece como disponível (AC-01).
- Mês/ano acompanham a navegação. Não permanecer fixo em setembro/2026 nem apresentar 31 em mês de 30 dias. Não inventar disponibilidade para datas fora da janela retornada pela API.
- “X de 22 agendamentos ativos”, com X igual ao total de A na API; ida e volta do mesmo dia contam uma reserva. Navegar entre meses não altera o total nem mostra reservas de B.
- Dia sem reserva não oferece **Remover agendamento**. Se não houver massa de determinado estado, registrar a variação bloqueada, sem aprová-la por comparação de cores da legenda.

**Resultado obtido**

- Massa: R1 (11/11, ida e volta), R2 (13/11, só ida) e R3 (02/12, só volta), ids 101 a 103; feriado em 16/11 e recesso em 17/11 (fixture no banco). API: `ativos: 3`; calendário de novembro com 11 e 13 agendados e dezembro com o 02.
- O calendário mostra sempre **Setembro 2026**; o seletor de mês e as duas setas não respondem ao toque.
- Nenhuma reserva real aparece destacada; feriado e recesso reais também não. O “feriado” exibido é o 07/09, escrito no código.
- A grade tem dois dias 31: o 31/08 e o 31/09, que não existe.
- Contador “3 de 22 agendamentos ativos”, igual à API (único dado real da tela).
- Código: `DIAS_DO_MES` fixo em `agenda.tsx`; setas sem `onPress`.
- Status: ❌ Falhou. Issues: ISS1 (grade fixa), ISS2 (navegação de mês).

---

#### CT-HU014-UI-003 — Menu, detalhes e entrada da edição

**Técnica/tipo:** partições ida/volta/ambos; funcional e integração com navegação.

**Dados de entrada:** R1, R2 e R3 com pontos/IES distintos dos textos fixos do app.

**Passos**

1. Selecionar cada dia agendado e anotar as ações do menu.
2. Tocar em **Ver detalhes**; comparar data, trechos e referências exibidos com `GET /{id}` consultado pela LLM. Fechar.
3. Abrir **Editar agendamento** para R2; conferir se a tela carrega a reserva existente e seus dados; voltar sem salvar.

**Resultado esperado**

- Menu contém **Ver detalhes**, **Editar agendamento** e **Remover agendamento** (AC-03). Registrar o texto real se a implementação usar **Cancelar agendamento**, sem mudar o esperado para coincidir com a tela.
- Detalhes correspondem ao dia selecionado: só ida não exibe volta contratada, só volta não exibe ida; ponto e IES não são textos fixos de outra viagem.
- A edição abre para o dia/reserva correta, sem criar nova reserva. Voltar sem salvar preserva estado e contador. Teste completo de alteração pertence à HU-013; aqui se verifica o acesso funcional à edição previsto no AC-03.
- Se a rota da HU-013 não existir no build, registrar essa parte bloqueada e concluir separadamente menu e detalhes.

**Resultado obtido**

- O menu só abre nos cinco dias fixos 31/08 e 01 a 04/09 (dias passados); nenhuma das reservas R1, R2 e R3 pode ser selecionada.
- O menu tem **Ver detalhes**, **Editar agendamento** e **Cancelar agendamento**. O requisito chama a terceira ação de **Remover agendamento**; texto real registrado, sem tratar a diferença como falha por si só.
- **Ver detalhes** do dia 01/09 mostra “Data: 2026-09-01”, “Ida (05:30) e Volta (17:00)”, “Igreja Matriz de Quixadá” e “UFC - Campus Quixadá”: textos escritos no código, sem relação com as reservas da A (Praça José de Barros, Terminal do Planalto, Praça do Campo Velho).
- **Editar agendamento** abre a tela preta do Expo (rota `/(aluno)/agendar-transporte/configurar` inexistente neste build; ela pertence ao PR #377, da HU-013).
- Status: ❌ Falhou. Issues: ISS1, ISS3, ISS4.

---

### Seção B — Confirmação, cancelamento e histórico

#### CT-HU014-UI-004 — Modal e desistência

**Técnica/tipo:** tabela de decisão confirmar/cancelar e transição sem mudança; funcional positivo.

**Dados de entrada:** R1 ativa, contador inicial anotado.

**Passos**

1. Selecionar R1 e tocar na ação de remover/cancelar a reserva.
2. Conferir o modal antes de tocar em qualquer botão.
3. Tocar em **Cancelar**, voltar à Agenda e reabrir R1.
4. Pedir à LLM para conferir reserva/contador no servidor. No Android, repetir fechando o modal pelo botão voltar do aparelho, se disponível.

**Resultado esperado**

- Título **“Cancelar agendamento?”**, aviso **“Esta ação não poderá ser desfeita.”**, botões **Cancelar** e **Confirmar** visíveis e utilizáveis (AC-04).
- Desistir fecha o modal e mantém reserva, alocação e contador intactos; não mostra sucesso nem envia cancelamento efetivo (FA-002).
- Reabrir permite acessar novamente a mesma reserva; texto não fica cortado no dispositivo testado.

**Resultado obtido**

- Em um dia fixo de setembro (01/09), o modal mostrou o título **“Cancelar agendamento?”**, o aviso **“Esta ação não poderá ser desfeita.”** e os botões **Cancelar** e **Confirmar**.
- Ao desistir, o modal fechou sem mensagem de sucesso, e o contador continuou “3 de 22”. Banco e API sem alteração.
- Limite do teste: executado em dia fixo, porque as reservas reais não são selecionáveis (ISS1).
- Status: ✅ Passou.

---

#### CT-HU014-UI-005 — Confirmar e persistir após reabrir

**Técnica/tipo:** transição ATIVO → CANCELADO; integração ponta a ponta e persistência.

**Dados de entrada:** R1 com id real anotado, preferencialmente diferente de 1 a 5; R2/R3 e RB preservadas como controle.

**Passos**

1. Anotar contador e destaque de R1; abrir remoção e confirmar. Medir do toque até a atualização perceptível da tela em conexão normal.
2. Anotar mensagem, destaque e novo contador. Solicitar à LLM o id enviado no DELETE por evidência de rede/log, sem expor token.
3. Fechar completamente e reabrir o app (recarregar na web); voltar à Agenda.
4. Pedir à LLM para conferir `/meus`, calendário, registro no banco e alocação quando existir.

**Resultado esperado**

- Somente R1 é cancelada, usando seu **id de banco**, nunca a data ISO nem um id fixo da grade. Mensagem de sucesso após confirmação efetiva do servidor (AC-06).
- R1 deixa de estar AGENDADO; contador diminui um; dia regular com rota ativa volta a disponível. R2/R3/RB intactas.
- Ao reabrir, o estado continua correto. Banco com CANCELADO e `cancelled_at`, e a alocação de R1 liberada quando a integração existir. Sem alocação real, registrar essa parcela bloqueada e referenciar API-010.
- Tempo percebido até 3 s em conexão normal (RNF-001); registrar medição e condições, sem inferir desempenho por leitura do código.

**Resultado obtido**

- Bloqueado: a reserva R1 (id 101) não é selecionável (ISS1).
- Por leitura do código, a confirmação usaria o id fixo do dia da grade (1 a 5), nunca o id de banco da reserva. Não foi executado em dia fixo, porque os ids 1 e 2 pertencem a registros reais de outras contas.
- Status: 🚫 Bloqueado.

---

#### CT-HU014-UI-006 — Cancelar hoje sem prazo mínimo

**Técnica/tipo:** valor-limite ontem/hoje/amanhã e tabela de decisão por horário; funcional positivo.

**Dados de entrada:** reserva ativa em D, antes e depois do horário de saída; LLM prepara uma nova reserva para a segunda variação.

**Passos**

1. Conferir data/hora do servidor e do aparelho; selecionar a reserva de hoje antes da saída e confirmar cancelamento.
2. Com apoio da LLM, preparar outra reserva para hoje e repetir depois da saída; documentar horários/massa, sem alterar relógio do host.
3. Conferir mensagem, calendário e persistência nas duas variações.

**Resultado esperado**

- A ação de remover está disponível em D, inclusive após a hora de saída, e ambas as confirmações cancelam sem prazo mínimo (AC-05, RN-005).
- Hoje não é tratado como ontem. Reservas futuras continuam elegíveis como no CT-005.
- Registrar separadamente qualquer faixa que não tenha sido possível executar; não aprovar a regra inteira por um único horário.

**Resultado obtido**

- Bloqueado: o dia de hoje (10/11) não existe na grade fixa de setembro (ISS1).
- Status: 🚫 Bloqueado.

---

#### CT-HU014-UI-007 — Proteger o histórico de ontem

**Técnica/tipo:** valor-limite D−1/D e transição proibida; funcional negativo.

**Dados de entrada:** RP em D−1, retornada no calendário da API como histórico, com `pode_remover: false`.

**Passos**

1. Pedir à LLM para confirmar a existência de RP e as flags no calendário/detalhe.
2. Navegar ao mês/dia de RP na Agenda; abrir o menu/detalhes quando disponível.
3. Procurar a ação de remover; conferir histórico e contador com apoio da LLM após navegar e reabrir.

**Resultado esperado**

- RP não oferece **Remover/Cancelar agendamento**, não abre confirmação de cancelamento nem altera histórico (AC-07, FA-003).
- O histórico segue consultável conforme dados do calendário e não entra no total de reservas futuras. Se a tela não permitir chegar ao histórico, registrar o impedimento; isso não comprova que o botão está corretamente protegido.
- Conferência complementar de proteção no servidor: CT-HU014-API-006.

**Resultado obtido**

- Nos dias fixos 31/08 e 01/09, que já são passados, o menu oferece **Cancelar agendamento**.
- O histórico real (RP, 09/11) não aparece na grade, então a parte de histórico consultável ficou bloqueada.
- Código: a flag `ehPassado` nunca é preenchida, e `pode_remover`, enviada pela API, é ignorada.
- Status: ❌ Falhou. Issue: ISS5.

---

### Seção C — Falhas, isolamento e limite

#### CT-HU014-UI-008 — Falha ao confirmar cancelamento

**Técnica/tipo:** transição com erro e recuperação; integração negativa (FA-004).

**Dados de entrada:** R2 ativa e contador anotado; conexão do cliente bloqueada antes do envio do DELETE, com API disponível para conferência pela LLM.

**Passos**

1. Abrir a confirmação de remoção de R2 enquanto conectado.
2. Bloquear a requisição antes de ela chegar ao servidor (navegador em offline/bloqueio de rede ou dispositivo sem conexão); tocar em **Confirmar**.
3. Anotar mensagem, destaque e contador; pedir à LLM que confirme no servidor que R2 continua ativa e não houve cancelamento.
4. Restaurar a rede, sair e voltar à Agenda; repetir a remoção e confirmar a recuperação.

**Resultado esperado**

- Na falha, exibir **“Não foi possível processar o cancelamento. Verifique sua conexão e tente novamente”**, sem sucesso falso; R2 permanece agendada, contador e alocação intactos (AC-08, FA-004).
- Ao reconectar, estado coerente com o servidor e nova tentativa funcional; somente após sucesso R2 deixa a Agenda.
- Se apenas a resposta se perder depois de um commit, consultar novamente a API antes de avaliar: esse cenário não comprova que a requisição deixou de chegar. Registrar o estado real em vez de presumir rollback.

**Resultado obtido**

- Com o navegador offline (DevTools, Network), ao tocar em **Confirmar** o app mostrou “Agendamento cancelado com sucesso”, em toast preto, e não a mensagem de falha de conexão.
- API: nenhum `DELETE` recebido e banco intacto, ou seja, o sucesso é falso.
- Código: `cancelarAgendamento` captura qualquer erro e devolve `{ success: true }`.
- Status: ❌ Falhou. Issues: ISS6 (sucesso falso), ISS8 (mensagem fora do padrão).

---

#### CT-HU014-UI-009 — Falha ao carregar e recusa do servidor

**Técnica/tipo:** partição por resultado HTTP/rede; transição e sincronização entre sessões.

**Dados de entrada:** A com ao menos uma reserva ativa; reserva R3 para cancelamento em outra sessão.

**Passos**

1. Bloquear GET da Agenda e reabrir a tela; anotar o que aparece. Restaurar a conexão e retornar à tela.
2. Com R3 carregada, abrir o modal de confirmação. Pedir à LLM para cancelar R3 pela API em outra sessão, sem atualizar a tela de Cauan.
3. Confirmar a remoção na tela desatualizada; registrar resposta HTTP/mensagem e contador. Sair e voltar à aba.

**Resultado esperado**

- Falha de carregamento é comunicada; não apresentar **“Você ainda não possui agendamentos futuros.”** como se a API tivesse confirmado ausência, nem inventar reservas de exemplo.
- Nova remoção de R3 recebe recusa real do servidor (404 no contrato analisado). A tela não deve afirmar que acabou de cancelar com sucesso uma operação recusada; informa indisponibilidade/estado já alterado e permite recuperar o estado atual.
- Após sincronização, contador e calendário iguais à API, sem reduzir duas vezes nem ficar negativos. Não restaurar R3 localmente como ativa se a outra sessão já a cancelou (RNF-012; robustez de integração).

**Resultado obtido**

- Parte 1: com o navegador offline, ao voltar à aba **Agenda** o app mostrou “Você ainda não possui agendamentos futuros.”, embora a A tenha 3 reservas; ao religar, a lista voltou ao normal.
- Parte 2 (reserva cancelada em outra sessão): bloqueada, porque a R3 não é selecionável (ISS1).
- Código: `listarAgendamentosAtivos` devolve lista vazia em qualquer falha.
- Status: ❌ Falhou. Issue: ISS7.

---

#### CT-HU014-UI-010 — Sessão e isolamento entre contas

**Técnica/tipo:** partição por perfil e dono; controle de acesso e isolamento de estado.

**Dados de entrada:** A e B com reservas futuras distintas; sessão encerrada; administrador. Na web, endereço da Agenda capturado ao abri-la como aluno.

**Passos**

1. Como A, abrir Agenda e conferir suas reservas; sair da conta.
2. Entrar como B, abrir Agenda e detalhes; pedir à LLM para comparar com `/meus` de B.
3. Sair e tentar reabrir Agenda por histórico/link direto. Repetir autenticado como administrador; no celular, usar os caminhos disponíveis sem forjar navegação inexistente.

**Resultado esperado**

- A e B veem somente seus dados; nenhuma reserva da sessão anterior aparece ou pode ser removida pela conta seguinte (RF-016).
- Sem sessão, solicitar autenticação; perfil sem permissão recebe acesso negado/redirecionamento sem exibir dados nem permitir cancelar. O recurso segue a autorização real da API (API-008).
- O retorno para a tela após login válido carrega os dados do usuário atual.

**Resultado obtido**

- A viu “3 de 22”; B, depois do login, viu “1 de 22”, sem reservas da A. Sem sessão e como administrador, o acesso à Agenda foi bloqueado e a A recuperou seus dados ao voltar.
- Como o calendário é fixo, a conferência foi feita pelo contador e pelo acesso.
- Status: ✅ Passou.

---

#### CT-HU014-UI-011 — Contador no limite e última reserva

**Técnica/tipo:** valores-limite 22/21 e 1/0; integração de cancelamento com HU-013.

**Dados de entrada:** massa independente com 22 reservas futuras válidas de A; depois massa com exatamente uma reserva ativa. LLM prepara e registra ids/datas.

**Passos**

1. Com 22 reservas, entrar na Agenda e conferir “22 de 22 agendamentos ativos”.
2. Remover uma reserva pela tela; conferir “21 de 22” e o dia sem destaque.
3. Criar novamente para esse dia pela HU-013, quando disponível no build, e voltar à Agenda. Se a tela de agendamento faltar, a LLM pode preparar pela API, registrando que a navegação de criação não foi verificada.
4. Com apoio da LLM, preparar cenário de uma reserva; atualizar a tela, remover a última e reabrir o app.

**Resultado esperado**

- 22 → 21 → 22, sem contar canceladas nem duas vezes os trechos de ida/volta; reagendamento aceito e novo destaque persistente (AC-01/06).
- Ao cancelar a última, mensagem **“Você ainda não possui agendamentos futuros.”**, sem contador antigo ou reserva fantasma; `/meus` confirma `ativos: 0` (AC-02, FA-001).
- Ausência da tela da HU-013 limita a comprovação do fluxo de reagendamento, não autoriza marcar a navegação como aprovada.

**Resultado obtido**

- Bloqueado: depende de cancelar e reagendar reservas reais (ISS1) e da tela de agendamento da HU-013 (PR #377).
- Status: 🚫 Bloqueado.

## Rastreabilidade

| Critério/regra | Casos UI | Complemento API |
| --- | --- | --- |
| AC-01 — calendário e contador | 002, 011 | API-001, API-002, API-009 |
| AC-02 / FA-001 — estado vazio | 001, 011 | API-001 |
| AC-03 — menu com três ações | 003 | API-003 |
| AC-04 / FA-002 — modal e desistência | 004 | Conferência de ausência de mutação pela LLM |
| AC-05 / RN-005 — sem horário limite | 005, 006 | API-004, API-005 |
| AC-06 — cancelar, liberar vaga, atualizar | 005, 011 | API-004, API-009, API-010 |
| AC-07 / FA-003 — passado sem remoção | 007 | API-002, API-006 |
| AC-08 / FA-004 — falha de comunicação | 008, 009 | API-010 (transação) |
| RF-016 — consulta pessoal | 001, 003, 010 | API-003, API-007, API-008 |
| RNF-001 — até 3 s em conexão normal | 005, medição básica | API-003, API-004 |
| RNF-012 — integridade e recuperação | 004, 005, 008, 009 | API-004, API-010 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-002, 003, 005, 006, 007, 011 | A grade do calendário é fixa em setembro/2026 e não mostra as reservas reais, o feriado e o recesso; há um dia 31 inexistente. | ISS1 |
| CT-002 | O seletor de mês e as setas de navegação não funcionam. | ISS2 |
| CT-003 | **Ver detalhes** mostra data, trajeto, embarque e destino escritos no código. | ISS3 |
| CT-003 | **Editar agendamento** abre a tela preta do Expo (rota inexistente no build). | ISS4 |
| CT-007 | O menu oferece **Cancelar agendamento** em dias passados. | ISS5 |
| CT-008 | Com a conexão caída, o app mostra “Agendamento cancelado com sucesso”. | ISS6 |
| CT-009 | Falha ao carregar mostra “Você ainda não possui agendamentos futuros.”. | ISS7 |
| CT-008 | Mensagens de sucesso e erro usam toast preto fora do padrão de popup do app. | ISS8 |

## Observações gerais

- Referências: [requisitos, seção 7.5.2](../../../../../docs/requisitos.md), [PR #378](https://github.com/GOUOCE/GOUCE-app/pull/378), [índice do épico e riscos de código](../../README.md) e [suíte de API](../api/API-HU-014.md).
- O requisito chama a ação do menu de **Remover agendamento**; o front analisado usa **Cancelar agendamento**. Registrar a divergência de texto e avaliar o comportamento separadamente, sem substituir o esperado.
- **Execução de 10/11/2026:** stack isolada (web 3014, API 8014), front do PR #378 `7d5f0127` e API da `develop` `7c302a8c`. A web do PR fixa a API na porta 8000 (porta de outro ambiente); foi aplicado um contorno local, sem commit, para ela usar a 8014. O container da API usa o fuso America/Fortaleza. Massa pelo fluxo real: A e B aprovadas, rotas e instituições pela API; feriado, recesso e histórico de ontem por fixture no banco isolado.
- Os CT-005, 006 e 011 ficam para **reteste**, e os demais para reexecução depois da correção das issues. O PR #379 (HU-015), cuja `agenda.tsx` liga calendário e detalhes à API, **não** foi executado nesta rodada; a decisão sobre qual PR vale cabe ao time.
- Na execução, guardar capturas e registrar mensagens exatas, dispositivo e commits. Relatos reproduzidos ficam em `ui/issues/`; não publicar falhas presumidas pelo código.
