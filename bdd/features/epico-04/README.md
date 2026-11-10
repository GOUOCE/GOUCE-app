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
- Calendário: estados Agendado, Disponível e Indisponível (AC-01); sábado, domingo e dia sem nenhuma rota principal ativa são indisponíveis (decisão do PO na [issue #389](https://github.com/GOUOCE/GOUCE-app/issues/389)); janela de 30 dias corridos, contando o dia atual como o 1º (último dia agendável: hoje + 29), e limite de 22 agendamentos ativos por aluno, ambos padrões configuráveis por variáveis de ambiente (AC-02)
- Campos: ida com ponto de embarque, faculdade de destino e rota complementar; volta com faculdade de origem, ponto de desembarque (podendo ser de outro bairro ou rota) e rota complementar; a seleção não tem horário (AC-05 e AC-08)
- Combinações válidas: apenas ida, apenas volta, ida e volta; "Não" nos dois trechos não cria agendamento e informa "Nenhum agendamento foi criado." sem erro (AC-09 e AC-10)
- Bloqueios: dia com agendamento ativo, com a mensagem "Já existe um agendamento ativo para este dia. Edite ou cancele o agendamento existente." (FA-001), trajeto sem rota principal ativa (FA-002), campos obrigatórios do trecho ausentes (FA-003) e cadastros inativos
- Edição: "Não" para ida e volta equivale ao cancelamento da HU-014, com o mesmo alerta de confirmação (AC-16)
- Organizado em blocos `Regra:` (escolha do dia no calendário, ida e volta e confirmação, agendamentos inválidos, edição e cancelamento por edição, acesso do aluno)
- Cenários: 1 estados do calendário + 1 dia disponível + 3 dias indisponíveis (fim de semana na tela, sem rota ativa e fim de semana na API) + 1 janela de 30 dias (calendário) + 1 janela de 30 dias (API) + 1 janela e limite configuráveis (API) + 1 navegação entre meses + 1 fluxo principal + 1 campos da ida + 1 ida "Não" + 1 campos da volta + 1 combinações válidas + 1 faculdade de origem diferente + 1 ponto de desembarque de outro bairro + 1 rota complementar + 1 "Não" para ida e volta + 1 listas só de ativos + 1 rotas inativas fora das opções + 1 desempenho + 4 sobreposição (tela, API, simultâneas e reagendamento) + 2 trajeto sem rota (tela e API) + 2 obrigatórios (tela e API) + 1 cadastro inativo (API) + 2 limite de 22 (tela e API) + 4 edição (sucesso, cancelamento por edição, desistência e API) + 3 acesso (titularidade, perfis sem acesso e sem token)

**HU-014: Visualização e Cancelamento de Agendamentos (Meus Agendamentos)**

- Fluxo: na aba "Agenda", o aluno vê o calendário mensal com os dias "Agendado", "Disponível" e "Indisponível para agendamento" e o contador "X de 22 agendamentos ativos"; ao selecionar um dia agendado, o menu oferece "Ver detalhes", "Editar agendamento" e "Remover agendamento"
- Cancelamento: o modal "Cancelar agendamento?" com o aviso "Esta ação não poderá ser desfeita." e os botões "Cancelar" e "Confirmar"; ao confirmar, o agendamento é cancelado, o calendário e o contador são atualizados e o aluno recebe "Agendamento cancelado com sucesso"
- Sem horário limite: o cancelamento não exige antecedência, inclusive no próprio dia (RN-005)
- Histórico: agendamentos de datas passadas não exibem "Remover agendamento" e a API recusa o cancelamento, inclusive pela edição (FA-003)
- Falha de comunicação: o agendamento continua ativo e o aluno recebe a orientação de verificar a conexão (FA-004); falha dentro da transação não deixa cancelamento parcial (RNF-012)
- Cancelamento lógico: o registro permanece com o status `CANCELADO`; a remoção da alocação do veículo depende das HU-016 e HU-018
- Organizado em blocos `Regra:` (acompanhamento no calendário, remoção sem prazo mínimo, histórico preservado, falha na comunicação, acesso restrito ao próprio aluno)
- Cenários: 1 fluxo principal + 1 estados do calendário + 1 contador + 1 ida e volta conta como um + 1 estado vazio + 1 menu do dia agendado + 1 lista da API + 1 calendário da API + 1 mês inválido + 1 remoção + 1 modal + 1 desistência + 1 contador reduzido + 1 sem horário limite + 1 cancelamento na API + 1 cancelamento lógico + 1 alocação + 1 limite liberado + 1 desempenho + 4 data passada (tela, API, edição e opções desabilitadas) + 4 falha de comunicação (cancelamento, nova tentativa, leitura e transação) + 6 acesso (agendamento indisponível, identificador inválido, detalhe de outro aluno, repetição do cancelamento, perfis sem acesso e sem token)

**HU-015: Consulta de Rota Complementar e Transferência**

- Fluxo: o aluno com agendamento ativo que usa rota complementar vê, em "Meus Agendamentos" ou no resumo da viagem do dia na tela inicial, o horário da Van ou micro-ônibus (saída na ida e retorno na volta), o nome da linha e o ponto exato de conexão, junto à rota principal de destino
- Trajeto direto: nenhuma seção de rota complementar é exibida, apenas o ônibus e o motorista da rota principal (FA-001)
- Offline: os dados já sincronizados são exibidos a partir do cache local do dispositivo (FA-002 e RNF-015); sem dados sincronizados, o sistema informa a indisponibilidade em vez de exibir dados inventados
- Por trecho: a rota complementar pode existir só na ida, só na volta ou nos dois trechos, de forma independente
- Veículo e motorista: ficam ocultos enquanto não existe alocação diária (decisão do PO na #389) e, depois dela, o ônibus exibido segue a programação do dia (RN-010, depende das HU-016 e HU-017)
- Organizado em blocos `Regra:` (consulta para a transferência, trajeto direto, consulta offline, acesso restrito ao próprio aluno)
- Cenários: 1 fluxo principal + 1 tela inicial + 1 rota principal de destino + 1 horário de retorno na volta + 1 ônibus e motorista ocultos + 1 rota complementar por trecho + 2 veículo conforme a programação + 6 API (trechos, dados da transferência, consulta por data, consulta por data recusada, ônibus e motorista sem alocação e lista) + 3 trajeto direto (tela, resumo e API) + 4 offline (cache, mesmos dados, sem dados sincronizados e atualização ao reconectar) + 5 acesso (agendamento indisponível, identificador inválido, lista restrita, perfis sem acesso e sem token)

## Resumo de Cobertura

| HU     | Cenários | Esquemas | Execuções |
| ------ | -------- | -------- | --------- |
| HU-013 | 39       | 16       | 71        |
| HU-014 | 33       | 7        | 50        |
| HU-015 | 26       | 4        | 34        |
| Total  | 98       | 27       | 155       |

- Todos os critérios de aceite e fluxos alternativos de `docs/requisitos.md` (seção 7.5) têm ao menos um cenário.
- Cenários de API, cancelamento lógico, integridade (RNF-012), desempenho (RNF-001) e acesso por perfil estão marcados com `@teste_api @nao_automatizavel_via_appium`, pois exigem consulta ao banco ou à API.
- Os cenários de acesso por perfil seguem o controle do backend: administrador, aluno com cadastro pendente ou reprovado e aluno com vínculo vencido recebem `403 Forbidden`; sem token, `401 Unauthorized`.
- Mensagens de erro de API seguem as do código (`backend/src/modulos/agendamentos/`); as mensagens de interface vêm de `docs/requisitos.md`.
- Arquivos validados com o parser oficial `@cucumber/gherkin`.

## Divergências encontradas entre requisitos e implementação

Os cenários seguem os requisitos. A seção 7.5.1 (HU-013) foi atualizada em 09/11/2026 e as decisões do PO na [issue #389](https://github.com/GOUOCE/GOUCE-app/issues/389) (10/11/2026) foram incorporadas às seções 7.5.1, 7.5.2 e 7.5.3 de `docs/requisitos.md`. O que ainda falta na implementação está na [issue #390](https://github.com/GOUOCE/GOUCE-app/issues/390).

**Resolvidas nos requisitos:**

- Horário de ida e de volta saiu dos campos do agendamento (migration 80 do backend já refletia isso).
- Janela e limite de agendamentos configuráveis, com padrão de 30 dias e 22 agendamentos.
- Contagem da janela: o dia atual é o 1º dia, e o último dia agendável é hoje + 29.
- Feriado e recesso estão fora do escopo (PO, #389, item 1): saíram da HU-013 e do status do calendário da HU-014. A tabela da migration 79 permanece, mas nenhum teste ou tela cobra feriado.
- Dia indisponível: sábado, domingo e dia sem nenhuma rota principal ativa (PO, #389, item 2).
- Mensagens: "Já existe um agendamento ativo para este dia. Edite ou cancele o agendamento existente." e "Nenhum agendamento foi criado." (PO, #389, item 4).
- Nome da ação da HU-014: "Remover agendamento" (PO, #389, item 5).
- HU-015: horário de saída na ida e de retorno na volta; ônibus e motorista ocultos até existir alocação diária (PO, #389, itens 6 e 7).
- O backend da HU-015 (PR #388) já devolve o horário de saída, o horário de retorno e o ponto de conexão da rota complementar, a consulta por data (`GET /transporte/agendamentos/detalhes?data=YYYY-MM-DD`) e ônibus e motorista nulos.

**Pendentes na implementação (issue #390):**

- **Fim de semana (HU-013, AC-01):** o backend não bloqueia sábado e domingo; o calendário e o `POST` tratam todos os dias iguais.
- **Mensagem de sobreposição (HU-013, AC-11):** a API ainda devolve "Já existe agendamento ativo para este dia." e a tela precisa mostrar a mensagem nova.
- **"Não" para ida e volta (HU-013, AC-10):** a API responde `422 FA-003`; a sugestão é a tela tratar o caso sem chamar a API.
- **Listas suspensas (HU-013, AC-05 e AC-08):** não há rota HTTP para o aluno carregar as opções do agendamento; a tela chama `/agendamentos/opcoes`, que não existe, e cai em dados de exemplo.
- **Nome da ação (HU-014, AC-03):** o menu da tela mostra "Cancelar agendamento".
- **Alocação ao cancelar (HU-014, AC-06):** `remove_allocations` ainda não faz nada até as HU-016 e HU-018.
- **Bloqueio de inativação (HU-008, HU-011 e HU-012):** a consulta de agendamentos futuros nunca foi ligada (`TODO(HU-013)`).
- **Tela da HU-015:** chama `/agendamentos/detalhes`, sem o prefixo `/transporte` da API.

**Pendente na redação dos requisitos:**

- **HU-013, fluxo principal (passo 22):** a lista de campos da volta cita faculdade de origem e rota complementar, mas não o ponto de desembarque, que o AC-08 inclui. Os cenários seguem o AC-08.
