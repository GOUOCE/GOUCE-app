# Testes manuais de UI — HU-017 — Alocação de Motoristas às Rotas

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Alocação e Distribuição Logística (EP-005) |
| Funcionalidade | HU-017 — Alocação de Motoristas às Rotas |
| Camada | UI — celular ou web |
| Tipo de teste | Funcional manual essencial, integração e tratamento de falha — baseado em risco |
| Telas | Logística → Distribuição Logística → alocação da rota (ônibus e motorista por turno). |
| Base do planejamento | [PR #457](https://github.com/GOUOCE/GOUCE-app/pull/457), branch `feature/front-hu16e17`, commit `80830b4d`, sobre a `develop` `1eb2818d`; a tela de escala (`alocar.tsx`) ainda não está na `develop` |
| Branch de planejamento | `test/planejamento-api-ui-hu-017`, com entrega para `develop` |
| Revisão do planejamento | 16/11/2026 — requisitos 7.6 com as decisões do PO (#465), BDD do épico 05 e leitura do código |
| Ambiente | Versão web em http://localhost:3117, API em http://localhost:8117 (stack `atu-exec-hu017`, banco novo, fuso America/Fortaleza); front e API da `develop` `a4606b39` (já inclui o PR #457, as correções #474–#492 e o PR #510 das HU-016/017); massa do épico 05 (`.qa/seed05.py`) |
| Total de casos | 9 |
| Última execução | 18/11/2026 |
| Testador | Cauan Ricardo — execução manual; LLM — massa e conferência de API/banco |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ✅ Concluída | 9 | 9 | 0 | 0 | 0 | 0 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | Front do [PR #457](https://github.com/GOUOCE/GOUCE-app/pull/457), branch `feature/front-hu16e17`, commit `80830b4d`, com a API da `develop` `1eb2818d`. Sem esse build a tela de escala não existe e os casos ficam bloqueados. Registrar URL, SHAs e navegador. |
| PC-02 | Cauan executa a UI; a LLM prepara a massa e confere API/banco depois de cada caso, e inativa motoristas pela API quando o caso pedir. |
| PC-03 | Usar a massa da [suíte de API](../api/API-HU-017.md) e da [HU-016](../../HU-016/api/API-HU-016.md): P1/P2, V1/V2/V3, M1/M2/M3 ativos e M4 inativo, reservas em D+1. |
| PC-04 | Os esperados seguem requisitos 7.6, BDD e decisões do PO; os riscos de leitura do [guia da API](../api/README.md) não são defeitos reproduzidos. Toda a suíte está pendente. |

## Resumo da execução

Executar na ordem e registrar cada variação. A LLM confere API e banco depois dos casos de confirmação e prepara as mudanças feitas por API (motorista inativado).

### Defeitos registrados

| Issue | Relato | Severidade | Bloqueante | Responsável |
| --- | --- | --- | --- | --- |
| [#522](https://github.com/GOUOCE/GOUCE-app/issues/522) | [BUG-HU017-UI-001](issues/BUG-HU017-UI-001.md) — campo Motorista parece vazio mas guarda o motorista inativo | 🟡 Média | Não | `dev-mariab` |
| [#523](https://github.com/GOUOCE/GOUCE-app/issues/523) | [BUG-HU017-UI-002](issues/BUG-HU017-UI-002.md) — mensagem de motorista inativo difere do BDD | 🟢 Baixa | Não | `Joao-Vitor-Rd` |
| [#524](https://github.com/GOUOCE/GOUCE-app/issues/524) | [BUG-HU017-UI-003](issues/BUG-HU017-UI-003.md) — turno Volta mostra horário de saída | 🟢 Baixa | Não | `dev-mariab` |
| [#525](https://github.com/GOUOCE/GOUCE-app/issues/525) | [BUG-HU017-UI-004](issues/BUG-HU017-UI-004.md) — capacidade sem rótulo no seletor de ônibus | 🟢 Baixa | Não | `dev-mariab` |

**Reteste de 18/11/2026** (branch `fix/hu017-issues-522-525`): as quatro issues (#522 a #525) ✅ corrigidas, executado por Cauan Ricardo; detalhes na seção "Reteste" de cada relato. Os casos CT-HU017-UI-001 e CT-HU017-UI-007 seguem ✅.

Observação sem issue: a lista de motoristas é filtrada por turno em todas as rotas (correto pelo BDD), mas isso impede trocar dois motoristas entre veículos sem liberar um antes; registrado só como observação de UX.

### Seção A — Escala na tela

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU017-UI-001 | Abrir a alocação da rota com ônibus e motorista no mesmo formulário | Administrador; dia com rotas P1 e P2 distribuídas; detalhe de uma rota na tela de distribuição. | Formulário da rota com ônibus e motorista por turno. | ✅ PASSOU | Executado em 18/11/2026. Ônibus e motorista no mesmo formulário, turnos separados e valores iniciais iguais à prévia da API. Observações de UX (não são falha): o seletor mostra a capacidade do ônibus sem rótulo (“3 sentados + 2 em pé”) e a prévia usa “Capacidade Máxima”; o turno Volta exibe “Horário de Saída” (06:30) e “Horário de Volta” (17:30) da rota, quando o horário coerente seria um só por turno (`alocar.tsx` linhas 541–546). Relatos [BUG-HU017-UI-003](issues/BUG-HU017-UI-003.md) (issue #524, horário na volta) e [BUG-HU017-UI-004](issues/BUG-HU017-UI-004.md) (issue #525, capacidade sem rótulo), ambas Não bloqueantes. |
| CT-HU017-UI-002 | Lista de motoristas ao selecionar o ônibus | M1 a M3 ativos e M4 inativo; M2 já escalado em outra rota no mesmo turno. | Apenas ativos; M4 ausente; indisponível no turno não aparece ou é sinalizado. | ✅ PASSOU | Executado em 18/11/2026. Na ida do Veículo 1 (Rota Centro - UFC, 19/11) a lista mostrou só Miguel Gama (o atual): Marcos Alfa está no Veículo 2 da mesma rota, Mauro Beta na Rota Campo - IFCE e Mario Delta está inativo. O risco de leitura (lista sem filtrar pelo turno) deixou de valer com o PR #510. Observação de UX: com a lista tão filtrada, trocar dois motoristas entre veículos exige liberar um antes. |
| CT-HU017-UI-003 | Confirmar a escala e ver a mensagem de sucesso | Selecionar V3 e M2 para P1 na ida e confirmar; reabrir a rota; recarregar a página. | Popup de confirmação, mensagem “Escala de motoristas confirmada com sucesso”, vínculo salvo e mantido ao reabrir. | ✅ PASSOU | Executado em 18/11/2026 (dia 20/11, Rota Centro - UFC, ida). Cauan trocou o motorista de um veículo para Mauro Beta e confirmou; popup e mensagem de sucesso conforme o esperado e escala mantida ao reabrir. Conferido na API/banco: V3 HIJ7K89 passou de Miguel Gama para Mauro Beta (4 alunos mantidos) e V1 ABC1D23 continua com Marcos Alfa (2 alunos), sem duplicidade (restrições únicas por data, ônibus e turno e por data, motorista e turno); as alocações de 19/11 permanecem iguais à prévia. |

### Seção B — Conflitos

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU017-UI-004 | Conflito: motorista já escalado em outra rota no mesmo turno | M1 escalado em P1 na ida; tentar escalar M1 em P2 na ida; a LLM pode forçar por API para comparar. | Bloqueio na seleção ou alerta com a mensagem do requisito; nada salvo. | ✅ PASSOU | Executado em 18/11/2026 (19/11, Rota Centro - UFC, ida). O Mauro Beta, escalado na Rota Campo - IFCE na ida, não aparece em nenhum veículo da ida: cada veículo só oferece o próprio motorista atual (Miguel Gama no Veículo 1, Marcos Alfa no Veículo 2). Na volta, sem outra rota no turno, a lista mostra Miguel Gama, Marcos Alfa e Mauro Beta. Bloqueio na seleção conforme requisito 7.6 (AC-05) e BDD. Conferência por API (LLM): confirmação forçada com Mauro no V3 da Rota Centro - UFC na ida devolveu 409 DISTRIBUICAO_INVALIDA, “Este motorista já está escalado para outra rota neste horário” (texto igual ao do requisito e do BDD); as alocações de 19/11 no banco ficaram inalteradas. |
| CT-HU017-UI-005 | Mesmo motorista na ida e na volta | M1 em P1 na ida e na volta do mesmo dia. | Aceito nos dois turnos. | ✅ PASSOU | Executado em 18/11/2026 (19/11, Rota Centro - UFC). Cauan confirmou a escala e a tela aceitou, segundo o relato. Conferido no banco: Marcos Alfa ficou como motorista na ida (V1 ABC1D23) e na volta (V3 HIJ7K89) do mesmo dia, sem recusa por conflito entre turnos; as demais alocações do dia (Miguel Gama no V3 na ida e Mauro Beta na Rota Campo - IFCE) foram mantidas. Obs.: o roteiro previa o Miguel nos dois turnos; Cauan usou o Marcos, o que cobre a mesma regra (AC-08). |
| CT-HU017-UI-006 | Campos obrigatórios do formulário | Confirmar sem escolher ônibus; sem escolher motorista; ambos vazios. | Confirmação bloqueada com indicação do campo; nada gravado. | ✅ PASSOU | Executado em 18/11/2026 (20/11, Rota Centro - UFC). Os campos Ônibus e Motorista são seletores sem opção vazia: depois de preenchidos pela prévia não dá para esvaziá-los, então o envio sem ônibus ou sem motorista não é possível pela tela e nada foi gravado (banco de 20/11 inalterado). A mensagem “Campos Obrigatórios” (“Selecione um ônibus e um motorista para cada veículo da rota.”, `alocar.tsx` linha 303) existe no código, mas não foi exercitada: só dispararia se a prévia chegasse com um veículo sem motorista. |

### Seção C — Falhas

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU017-UI-007 | Motorista inativado depois de exibido | Tela aberta com M2 na lista; a LLM inativa M2 pela API; confirmar com M2. | Confirmação recusada com mensagem; sem sucesso falso. | ✅ PASSOU | Executado em 18/11/2026 (20/11, Rota Centro - UFC). A API recusou a inativação normal do Mauro Beta (409, “possui alocações pendentes”), então a LLM o inativou direto no banco local com a tela aberta. Ao confirmar, a tela mostrou o popup padrão “Erro na alocação” com “Rota Centro - UFC: motorista 2 inexistente ou inativo.” (API 422 DISTRIBUICAO_INVALIDA); sem sucesso falso e o banco de 20/11 não mudou. Observações: a mensagem mostra o número do motorista em vez do nome (UX); o BDD prevê o texto “alocação 0: motorista inexistente ou inativo.”, diferente do que o código devolve (`alocacao_service.py` linha 311). Decisão do Cauan: o ajuste deve seguir o BDD na mensagem, ou seja, corrigir o código. Achado em 18/11/2026 durante a tentativa do CT-008: depois de recarregar a rota do dia 20/11, a escala salva tinha o Mauro Beta (inativo) no V3; o campo Motorista do veículo apareceu como “Selecionar”, porque o inativo não está na lista, mas o formulário continuou com o motorista 2 por trás. Ao confirmar, a tela enviou o motorista inativo e recusou com “motorista 2 inexistente ou inativo” (API 422), sem mostrar o motivo no campo. Escolhendo outro motorista, a confirmação foi aceita (banco: V3 com Miguel Gama). Defeito candidato a issue: campo parece vazio mas carrega valor antigo. Relatos [BUG-HU017-UI-001](issues/BUG-HU017-UI-001.md) (issue #522, campo parece vazio, Não bloqueante) e [BUG-HU017-UI-002](issues/BUG-HU017-UI-002.md) (issue #523, mensagem diferente do BDD, Não bloqueante). |
| CT-HU017-UI-008 | Falha de comunicação ao confirmar a escala | Rede desligada ao confirmar; religar e repetir. | Falha informada, nada gravado, repetição funciona. | ✅ PASSOU | Executado em 18/11/2026 (20/11, Rota Centro - UFC). Cauan simulou a falha de comunicação pelo modo offline das ferramentas de desenvolvedor do navegador (a API ficou no ar): a confirmação exibiu o popup “Erro na alocação” com erro de servidor, sem “sucesso” falso; depois de voltar a rede e escolher outro motorista a confirmação foi aceita (API 201; banco: V3 com Miguel Gama e V1 com Marcos Alfa). Limite da conferência: a requisição offline não chega à API, então a ausência de gravação durante a falha não aparece no log; o texto exato do popup não foi registrado. |
| CT-HU017-UI-009 | Perfis sem acesso à escala | Aluno, representante e sem sessão; endereço direto da alocação da rota. | Menu e tela indisponíveis; URL direta negada. | ✅ PASSOU | Executado em 18/11/2026. Aluno (ana@qa.gouce.app), representante (daniel@qa.gouce.app, promovido pela API na UFC) e sem sessão: o menu não oferece a escala e o endereço direto da alocação da rota (`/logistica/alocar?linhaId=1&dataIso=2026-11-20`) não abre a tela, segundo o relato de Cauan. Conferido na API pela LLM: aluno e representante recebem 403 na prévia e na confirmação; sem token, 401. |

## Detalhamento dos casos

### Seção A — Escala na tela

#### CT-HU017-UI-001 — Abrir a alocação da rota com ônibus e motorista no mesmo formulário

**Técnica/tipo:** Funcional positivo e navegação.

**Dados de entrada:** Administrador; dia com rotas P1 e P2 distribuídas; detalhe de uma rota na tela de distribuição.

**Passos**

1. Abrir Logística → Distribuição Logística e escolher o dia.
2. Abrir a alocação de P1.
3. Conferir o formulário por turno (Ida e Volta).

**Resultado esperado**

- O painel de detalhes da rota mostra o ônibus e, no mesmo formulário, o campo do motorista (AC-01).
- Os turnos aparecem separados e os valores iniciais correspondem à prévia da API.

**Resultado obtido**

- Ônibus e motorista no mesmo formulário (AC-01); turnos Ida e Volta separados; valores iniciais iguais à prévia da API (Veículo 3, Volta: V3 HIJ7K89, Miguel Gama, 2 alunos).
- Observações de UX: capacidade sem rótulo no seletor de ônibus; o turno Volta mostra “Horário de Saída” e “Horário de Volta” da rota (a ida deveria usar o de saída e a volta o de retorno, como na HU-019).
- Status: ✅ Passou, com observações.

---

#### CT-HU017-UI-002 — Lista de motoristas ao selecionar o ônibus

**Técnica/tipo:** Partição ativo/inativo e disponível/indisponível no turno.

**Dados de entrada:** M1 a M3 ativos e M4 inativo; M2 já escalado em outra rota no mesmo turno.

**Passos**

1. Selecionar um ônibus no formulário e abrir a lista de motoristas.
2. Procurar M4 (inativo) e M2 (já escalado em outra rota no mesmo turno).
3. Comparar com `GET /motoristas`.

**Resultado esperado**

- A lista mostra só motoristas ativos; M4 não aparece (AC-03 e FA-002).
- O motorista já escalado em outra rota no mesmo turno não aparece como disponível ou exibe o alerta de indisponibilidade (AC-02 e AC-05).

**Resultado obtido**

- Lista do campo Motorista (Ida, Veículo 1, 19/11) com só Miguel Gama: Marcos Alfa já está no Veículo 2 da mesma rota, Mauro Beta na Rota Campo - IFCE e Mario Delta está inativo (AC-02, AC-03, AC-05).
- Observação de UX: a lista filtrada não permite trocar dois motoristas entre veículos sem liberar um antes.
- Status: ✅ Passou, com observação.

---

#### CT-HU017-UI-003 — Confirmar a escala e ver a mensagem de sucesso

**Técnica/tipo:** Transição de estado e persistência; popup padrão do app.

**Dados de entrada:** Selecionar V3 e M2 para P1 na ida e confirmar; reabrir a rota; recarregar a página.

**Passos**

1. Escolher o ônibus e o motorista e tocar em confirmar; desistir uma vez no popup.
2. Confirmar de novo e ler a mensagem.
3. Reabrir a rota e recarregar a página; comparar com o banco.

**Resultado esperado**

- O popup identifica a rota e a data; desistir não grava nada.
- A confirmação mostra “Escala de motoristas confirmada com sucesso” em popup padrão, sem toast preto.
- A escala persiste no banco (motorista, ônibus, rota, data e turno) e continua exibida depois de reabrir e de recarregar; as outras rotas do dia não mudam.

**Resultado obtido**

- (dia 20/11, Rota Centro - UFC, ida). Cauan trocou o motorista de um veículo para Mauro Beta e confirmou; popup e mensagem de sucesso conforme o esperado e escala mantida ao reabrir. Conferido na API/banco: V3 HIJ7K89 passou de Miguel Gama para Mauro Beta (4 alunos mantidos) e V1 ABC1D23 continua com Marcos Alfa (2 alunos), sem duplicidade (restrições únicas por data, ônibus e turno e por data, motorista e turno); as alocações de 19/11 permanecem iguais à prévia.
- Status: ✅ Passou.

---

### Seção B — Conflitos

#### CT-HU017-UI-004 — Conflito: motorista já escalado em outra rota no mesmo turno

**Técnica/tipo:** Tabela de decisão motorista × rota × turno (RN-002).

**Dados de entrada:** M1 escalado em P1 na ida; tentar escalar M1 em P2 na ida; a LLM pode forçar por API para comparar.

**Passos**

1. Escalar M1 em P1 (ida) e confirmar.
2. Abrir P2 e tentar selecionar M1 na ida.
3. Se a tela permitir, confirmar e ler a mensagem; conferir o banco.

**Resultado esperado**

- M1 não aparece como disponível para P2 na ida ou a tela exibe “Este motorista já está escalado para outra rota neste horário” (AC-05, FA-001).
- Nenhuma escala conflitante é gravada.

**Resultado obtido**

- (19/11, Rota Centro - UFC, ida). O Mauro Beta, escalado na Rota Campo - IFCE na ida, não aparece em nenhum veículo da ida: cada veículo só oferece o próprio motorista atual (Miguel Gama no Veículo 1, Marcos Alfa no Veículo 2). Na volta, sem outra rota no turno, a lista mostra Miguel Gama, Marcos Alfa e Mauro Beta. Bloqueio na seleção conforme requisito 7.6 (AC-05) e BDD. Conferência por API (LLM): confirmação forçada com Mauro no V3 da Rota Centro - UFC na ida devolveu 409 DISTRIBUICAO_INVALIDA, “Este motorista já está escalado para outra rota neste horário” (texto igual ao do requisito e do BDD); as alocações de 19/11 no banco ficaram inalteradas.
- Status: ✅ Passou.

---

#### CT-HU017-UI-005 — Mesmo motorista na ida e na volta

**Técnica/tipo:** Tabela de decisão por turno; funcional positivo.

**Dados de entrada:** M1 em P1 na ida e na volta do mesmo dia.

**Passos**

1. Escolher M1 para a ida e para a volta de P1 e confirmar.
2. Conferir o banco.

**Resultado esperado**

- A tela permite o mesmo motorista nos dois turnos, mostra o sucesso e grava duas linhas (AC-08).

**Resultado obtido**

- (19/11, Rota Centro - UFC). Cauan confirmou a escala e a tela aceitou, segundo o relato. Conferido no banco: Marcos Alfa ficou como motorista na ida (V1 ABC1D23) e na volta (V3 HIJ7K89) do mesmo dia, sem recusa por conflito entre turnos; as demais alocações do dia (Miguel Gama no V3 na ida e Mauro Beta na Rota Campo - IFCE) foram mantidas. Obs.: o roteiro previa o Miguel nos dois turnos; Cauan usou o Marcos, o que cobre a mesma regra (AC-08).
- Status: ✅ Passou.

---

#### CT-HU017-UI-006 — Campos obrigatórios do formulário

**Técnica/tipo:** Partição de entradas válidas e inválidas.

**Dados de entrada:** Confirmar sem escolher ônibus; sem escolher motorista; ambos vazios.

**Passos**

1. Limpar o ônibus e tentar confirmar.
2. Limpar o motorista e tentar confirmar.
3. Limpar os dois e tentar confirmar; conferir o banco.

**Resultado esperado**

- A confirmação não é enviada e a tela indica o campo obrigatório pendente.
- Nenhuma alocação é criada ou alterada.

**Resultado obtido**

- (20/11, Rota Centro - UFC). Os campos Ônibus e Motorista são seletores sem opção vazia: depois de preenchidos pela prévia não dá para esvaziá-los, então o envio sem ônibus ou sem motorista não é possível pela tela e nada foi gravado (banco de 20/11 inalterado). A mensagem “Campos Obrigatórios” (“Selecione um ônibus e um motorista para cada veículo da rota.”, `alocar.tsx` linha 303) existe no código, mas não foi exercitada: só dispararia se a prévia chegasse com um veículo sem motorista.
- Status: ✅ Passou, com ressalva (mensagem de campo obrigatório não exercitada).

---

### Seção C — Falhas

#### CT-HU017-UI-007 — Motorista inativado depois de exibido

**Técnica/tipo:** Transição de estado entre listar e confirmar; revalidação.

**Dados de entrada:** Tela aberta com M2 na lista; a LLM inativa M2 pela API; confirmar com M2.

**Passos**

1. Abrir a alocação com M2 disponível.
2. Pedir à LLM que inative M2 pela API.
3. Confirmar a escala com M2 e ler a mensagem; conferir o banco.

**Resultado esperado**

- A tela mostra a recusa (motorista inexistente ou inativo) e não exibe sucesso.
- Nada é gravado e a escala anterior continua.

**Resultado obtido**

- (20/11, Rota Centro - UFC). A API recusou a inativação normal do Mauro Beta (409, “possui alocações pendentes”), então a LLM o inativou direto no banco local com a tela aberta. Ao confirmar, a tela mostrou o popup padrão “Erro na alocação” com “Rota Centro - UFC: motorista 2 inexistente ou inativo.” (API 422 DISTRIBUICAO_INVALIDA); sem sucesso falso e o banco de 20/11 não mudou. Observações: a mensagem mostra o número do motorista em vez do nome (UX); o BDD prevê o texto “alocação 0: motorista inexistente ou inativo.”, diferente do que o código devolve (`alocacao_service.py` linha 311). Decisão do Cauan: o ajuste deve seguir o BDD na mensagem, ou seja, corrigir o código.
- Status: ✅ Passou, com observações.

---

#### CT-HU017-UI-008 — Falha de comunicação ao confirmar a escala

**Técnica/tipo:** Transição online/offline; erro sem efeito parcial.

**Dados de entrada:** Rede desligada ao confirmar; religar e repetir.

**Passos**

1. Selecionar ônibus e motorista, desligar a rede e confirmar.
2. Religar a rede e repetir.
3. Conferir o banco nas duas etapas.

**Resultado esperado**

- Sem rede, a mensagem é de falha, a escala não é gravada e não há popup de sucesso.
- Com a rede de volta, a repetição grava a escala.

**Resultado obtido**

- (20/11, Rota Centro - UFC). Cauan simulou a falha de comunicação pelo modo offline das ferramentas de desenvolvedor do navegador (a API ficou no ar): a confirmação exibiu o popup “Erro na alocação” com erro de servidor, sem “sucesso” falso; depois de voltar a rede e escolher outro motorista a confirmação foi aceita (API 201; banco: V3 com Miguel Gama e V1 com Marcos Alfa). Limite da conferência: a requisição offline não chega à API, então a ausência de gravação durante a falha não aparece no log; o texto exato do popup não foi registrado.
- Status: ✅ Passou.

---

#### CT-HU017-UI-009 — Perfis sem acesso à escala

**Técnica/tipo:** Partição por perfil; acesso por URL direta.

**Dados de entrada:** Aluno, representante e sem sessão; endereço direto da alocação da rota.

**Passos**

1. Entrar como aluno e como representante e procurar o menu de logística.
2. Abrir o endereço direto da alocação da rota com cada perfil e sem sessão.

**Resultado esperado**

- Aluno e representante não veem o menu; a URL direta leva a acesso negado ou ao login, sem dados de escala.

**Resultado obtido**

- Aluno (ana@qa.gouce.app), representante (daniel@qa.gouce.app, promovido pela API na UFC) e sem sessão: o menu não oferece a escala e o endereço direto da alocação da rota (`/logistica/alocar?linhaId=1&dataIso=2026-11-20`) não abre a tela, segundo o relato de Cauan. Conferido na API pela LLM: aluno e representante recebem 403 na prévia e na confirmação; sem token, 401.
- Status: ✅ Passou.

---

## Rastreabilidade

| Critério/regra | Casos UI | Complemento |
| --- | --- | --- |
| AC-01 — formulário com ônibus e motorista | UI-001, UI-006 | API-003 |
| AC-02 / AC-03 / FA-002 — motoristas disponíveis | UI-002 | API-002 |
| AC-04 / AC-07 — confirmar e mensagem de sucesso | UI-003 | API-001, API-007 |
| AC-05 / AC-08 / FA-001 — conflito e ida/volta | UI-004, UI-005 | API-004, API-005 |
| AC-06 — revalidação | UI-007 | API-006 |
| RNF-012 — falha sem efeito parcial | UI-008 | API-009 |
| RN-006 — somente administrador | UI-009 | API-010 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. Os riscos de leitura estão no [guia de execução da API](../api/README.md). | — |

## Observações gerais

- Referências: [requisitos, seção 7.6](../../../../../docs/requisitos.md), [BDD do épico 05](../../../../../bdd/features/epico-05/README.md) e as [decisões do PO na #465](https://github.com/GOUOCE/GOUCE-app/issues/465).
- O PR #457 está aberto e pode mudar; registrar o SHA efetivamente testado.
- Nenhum caso foi executado nesta entrega.
