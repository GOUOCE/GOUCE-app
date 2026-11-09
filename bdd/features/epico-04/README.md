# BDD — Épico 04: Agendamento de Transporte (Aluno)

Especificações em Gherkin (português) do comportamento esperado para a experiência diária do aluno com o transporte: agendar os dias de utilização, acompanhar e cancelar os agendamentos em "Meus agendamentos" e consultar a rota complementar para realizar a transferência.

O formato, as tags e a rastreabilidade seguem o padrão descrito em [`../epico-01/README.md`](../epico-01/README.md). As tags adicionais e a organização em blocos `Regra:` seguem o [`../epico-02/README.md`](../epico-02/README.md).

## Estrutura

```
bdd/features/epico-04/
├── HU-013.feature  (Agendamento de Transporte)
├── HU-014.feature  (Visualização e Cancelamento de Agendamentos)
└── HU-015.feature  (Consulta de Rota Complementar e Transferência)
```

## Tags adicionais usadas neste épico

| Tag              | Significado                                                                       |
| ---------------- | --------------------------------------------------------------------------------- |
| `@conectividade` | Cenário que depende de queda de conexão ou de consulta offline (HU-014 e HU-015) |
| `@desempenho`    | Cenário de tempo de resposta (RNF-001)                                            |

As tags `@depende_de_HU0XX` seguem o padrão do épico 02. Neste épico, indicam dependência de HU ainda não entregue (HU-014 para o reagendamento, HU-016, HU-017 e HU-018 para a alocação de veículo e motorista).

## Histórias de Usuário

**HU-013: Agendamento de Transporte**

- Fluxo: o aluno escolhe um dia disponível no calendário mensal, seleciona "Novo agendamento", responde "Sim" ou "Não" para a ida e para a volta e preenche, em listas suspensas com dados ativos, os campos de cada trecho; a confirmação exibe "Agendamento realizado com sucesso" e atualiza o dia para "Agendado"
- Calendário: estados Agendado, Disponível, Indisponível, Feriado e Recesso; feriado e recesso bloqueiam o "Novo agendamento"; janela máxima de 30 dias corridos, contando o dia atual (AC-02 e AC-18)
- Limite: no máximo 22 agendamentos ativos por aluno (AC-02)
- Combinações válidas: apenas ida, apenas volta, ida e volta; "Não" nos dois trechos não cria agendamento e informa isso sem erro (AC-10 e AC-11)
- Bloqueios: dia com agendamento ativo (FA-001), trajeto sem rota principal ativa (FA-002), campos obrigatórios do trecho ausentes (FA-003) e cadastros inativos
- Edição: "Não" para ida e volta equivale ao cancelamento da HU-014, com o mesmo alerta de confirmação (AC-17)
- Organizado em blocos `Regra:` (escolha do dia no calendário, ida e volta e confirmação, agendamentos inválidos, edição e cancelamento por edição, acesso do aluno)
- Cenários: 1 estados do calendário + 1 dia disponível + 1 feriado e recesso + 1 feriado na API + 1 janela de 30 dias (calendário) + 1 janela de 30 dias (API) + 1 navegação entre meses + 1 fluxo principal + 1 campos da ida + 1 ida "Não" + 1 campos da volta + 1 combinações válidas + 1 faculdade de origem diferente + 1 rota complementar + 1 "Não" para ida e volta + 1 listas só de ativos + 1 rotas inativas fora das opções + 1 desempenho + 4 sobreposição (tela, API, simultâneas e reagendamento) + 2 trajeto sem rota (tela e API) + 2 obrigatórios (tela e API) + 1 cadastro inativo (API) + 2 limite de 22 (tela e API) + 4 edição (sucesso, cancelamento por edição, desistência e API) + 3 acesso (titularidade, perfis sem acesso e sem token)

**HU-014: Visualização e Cancelamento de Agendamentos (Meus Agendamentos)**

- Fluxo: na aba "Agenda", o aluno vê o calendário mensal com os dias "Agendado", "Indisponível para agendamento" e "Feriado" e o contador "X de 22 agendamentos ativos"; ao selecionar um dia agendado, o menu oferece "Ver detalhes", "Editar agendamento" e "Remover agendamento"
- Cancelamento: o modal "Cancelar agendamento?" com o aviso "Esta ação não poderá ser desfeita." e os botões "Cancelar" e "Confirmar"; ao confirmar, o agendamento é cancelado, o calendário e o contador são atualizados e o aluno recebe "Agendamento cancelado com sucesso"
- Sem horário limite: o cancelamento não exige antecedência, inclusive no próprio dia (RN-005)
- Histórico: agendamentos de datas passadas não exibem "Remover agendamento" e a API recusa o cancelamento, inclusive pela edição (FA-003)
- Falha de comunicação: o agendamento continua ativo e o aluno recebe a orientação de verificar a conexão (FA-004); falha dentro da transação não deixa cancelamento parcial (RNF-012)
- Cancelamento lógico: o registro permanece com o status `CANCELADO`; a remoção da alocação do veículo depende das HU-016 e HU-018
- Organizado em blocos `Regra:` (acompanhamento no calendário, remoção sem prazo mínimo, histórico preservado, falha na comunicação, acesso restrito ao próprio aluno)
- Cenários: 1 fluxo principal + 1 estados do calendário + 1 contador + 1 ida e volta conta como um + 1 estado vazio + 1 menu do dia agendado + 1 lista da API + 1 calendário da API + 1 mês inválido + 1 remoção + 1 modal + 1 desistência + 1 contador reduzido + 1 sem horário limite + 1 cancelamento na API + 1 cancelamento lógico + 1 alocação + 1 limite liberado + 1 desempenho + 4 data passada (tela, API, edição e opções desabilitadas) + 4 falha de comunicação (cancelamento, nova tentativa, leitura e transação) + 6 acesso (agendamento indisponível, identificador inválido, detalhe de outro aluno, repetição do cancelamento, perfis sem acesso e sem token)

**HU-015: Consulta de Rota Complementar e Transferência**

- Fluxo: o aluno com agendamento ativo que usa rota complementar vê, em "Meus Agendamentos" ou no resumo da viagem do dia na tela inicial, o horário de saída da Van ou micro-ônibus, o nome da linha e o ponto exato de conexão, junto à rota principal de destino
- Trajeto direto: nenhuma seção de rota complementar é exibida, apenas o ônibus e o motorista da rota principal (FA-001)
- Offline: os dados já sincronizados são exibidos a partir do cache local do dispositivo (FA-002 e RNF-015); sem dados sincronizados, o sistema informa a indisponibilidade em vez de exibir dados inventados
- Por trecho: a rota complementar pode existir só na ida, só na volta ou nos dois trechos, de forma independente
- Veículo: o ônibus exibido segue a programação do dia (RN-010, depende das HU-016 e HU-017)
- Organizado em blocos `Regra:` (consulta para a transferência, trajeto direto, consulta offline, acesso restrito ao próprio aluno)
- Cenários: 1 fluxo principal + 1 tela inicial + 1 rota principal de destino + 1 rota complementar por trecho + 2 veículo conforme a programação + 3 API (trechos, dados da transferência e lista) + 3 trajeto direto (tela, resumo e API) + 4 offline (cache, mesmos dados, sem dados sincronizados e atualização ao reconectar) + 5 acesso (agendamento indisponível, identificador inválido, lista restrita, perfis sem acesso e sem token)

## Resumo de Cobertura

| HU     | Cenários | Esquemas | Execuções |
| ------ | -------- | -------- | --------- |
| HU-013 | 36       | 14       | 66        |
| HU-014 | 33       | 7        | 50        |
| HU-015 | 21       | 3        | 28        |
| Total  | 90       | 24       | 144       |

- Todos os critérios de aceite e fluxos alternativos de `docs/requisitos.md` (seção 7.5) têm ao menos um cenário.
- Cenários de API, cancelamento lógico, integridade (RNF-012), desempenho (RNF-001) e acesso por perfil estão marcados com `@teste_api @nao_automatizavel_via_appium`, pois exigem consulta ao banco ou à API.
- Os cenários de acesso por perfil seguem o controle do backend: administrador, aluno com cadastro pendente ou reprovado e aluno com vínculo vencido recebem `403 Forbidden`; sem token, `401 Unauthorized`.
- Mensagens de erro de API seguem as do código (`backend/src/modulos/agendamentos/`); as mensagens de interface vêm de `docs/requisitos.md`.
- Arquivos validados com o parser oficial `@cucumber/gherkin`.

## Divergências encontradas entre requisitos e implementação

Os cenários seguem os requisitos. Os pontos abaixo mostram onde a implementação atual da `develop` (`99bbf2c6`) ainda se afasta do que foi especificado e devem ser decididos pelo PO ou corrigidos pelo time.

**Pendentes:**

- **HU-013, AC-11 ("Não" para ida e volta):** o requisito pede que o sistema não crie o agendamento e informe isso sem erro. A API de criação responde `422` com o código `FA-003` e a mensagem "Selecione pelo menos um trecho: ida ou volta."; o ramo que devolveria "Nenhum agendamento foi criado." nunca é alcançado. O cenário usa a mensagem "Nenhum agendamento foi criado.", que já existe no código.
- **HU-013, AC-06 e AC-09 (horário de ida e de volta):** o requisito lista "horário de ida" e "horário de volta" como campos do agendamento, mas o contrato da API (`AgendamentoInputDTO`) não recebe nem guarda horário. Os cenários de interface incluem os campos; não há cenário de API para o horário até a definição do contrato.
- **HU-013, AC-02 e AC-18 (janela de agendamento):** os dois critérios tratam da janela, e o AC-18 ainda cita "15 a 30 dias" como exemplo. Os cenários adotam 30 dias corridos contando o dia atual, o último dia selecionável é 29 dias depois de hoje, como no código. Sugestão: remover o exemplo do AC-18.
- **HU-013, FA-001 (mensagem de sobreposição):** o requisito pede uma mensagem que oriente a editar ou cancelar o agendamento existente; a API devolve só "Já existe agendamento ativo para este dia.". A orientação precisa vir da tela.
- **HU-014, AC-03 (nome da ação):** o requisito usa "Remover agendamento", mas a tela já existente na branch `feature/front-hu013` mostra "Cancelar agendamento" no menu. Os cenários seguem o requisito.
- **HU-015, AC-01 (dados da rota complementar):** o detalhe do agendamento da API devolve apenas o identificador e o nome da rota complementar. O horário de saída e o ponto de conexão exigidos pelo critério não são devolvidos, e o veículo e o motorista do dia dependem das HU-016, HU-017 e HU-018.
- **HU-014, AC-06 (alocação):** a remoção da alocação do aluno no veículo ainda é um gancho sem efeito (`remove_allocations`) até a entrega das HU-016 e HU-018; os cenários dependentes carregam `@depende_de_HU016` e `@depende_de_HU018`.
