# BDD — Épico 05: Alocação e Distribuição Logística

Especificações em Gherkin (português) do comportamento esperado para cruzar a demanda dos alunos (agendamentos) com a infraestrutura disponível (frota e motoristas): distribuição dos alunos nos ônibus, escala de motoristas, lista de embarque, consulta do aluno e rodízio semanal da frota.

O formato, as tags e a rastreabilidade seguem o padrão descrito em [`../epico-01/README.md`](../epico-01/README.md). As tags adicionais e a organização em blocos `Regra:` seguem o [`../epico-02/README.md`](../epico-02/README.md).

## Estrutura

```
bdd/features/epico-05/
├── HU-016.feature  (Distribuição de Alunos nos Ônibus)
├── HU-017.feature  (Alocação de Motoristas às Rotas)
├── HU-018.feature  (Visualização da Lista de Embarque)
├── HU-019.feature  (Consulta de Alocação Diária)
└── HU-020.feature  (Rotatividade Inteligente / Rodízio Semanal)
```

## Tags adicionais usadas neste épico

| Tag                 | Significado                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `@conectividade`    | Cenário que depende de queda de conexão (padrão do épico 04)                                    |
| `@desempenho`       | Cenário de tempo de resposta (RNF-001)                                                          |
| `@depende_de_HU0XX` | Cenário que só pode ser executado depois que a HU indicada estiver entregue (HU-016 e HU-020)   |

## Histórias de Usuário

**HU-016: Distribuição de Alunos nos Ônibus**

- Fluxo: o administrador seleciona o dia, vê a demanda por rota, confere a prévia da distribuição automática e clica em "Confirmar Distribuição"; a confirmação exibe "Distribuição realizada com sucesso" e o status logístico do dia passa a "DISTRIBUIDO"
- Capacidade: o sistema calcula sentados e em pé em cada ônibus, nunca ultrapassa assentos + capacidade em pé e sinaliza os excedentes (RN-001)
- Realocação: os excedentes podem ser realocados manualmente para outro ônibus com vaga e o aluno passa a ver o aviso de realocação (HU-019)
- Bloqueios: ônibus no mesmo turno em duas rotas (RN-003), capacidade excedida e recursos inativos são recusados com a mensagem do backend
- Organizado em blocos `Regra:` (demanda e prévia, confirmação, realocação, conflitos e capacidade, alerta de rodízio, acesso restrito)
- Cenários: 1 demanda + 1 sentados e em pé + 1 excedentes + 1 realocação para outro ônibus + 1 em pé sem outro ônibus + 1 faculdade sem demanda + 1 prévia sem gravação + 1 dia sem demanda + 1 sem motoristas + 1 confirmação + 1 confirmação (API) + 1 nova confirmação + 1 realocação manual + 1 distribuição manual (API) + 1 capacidade excedida + 1 ônibus em duas rotas + 1 mesmo ônibus na ida e na volta + 1 recursos inativos + 1 alunos inválidos + 1 distribuição inválida não altera a anterior + 1 alerta de rodízio + 3 acesso restrito (menu, API e sem token)

**HU-017: Alocação de Motoristas às Rotas**

- Fluxo: no painel de detalhes da rota, o administrador seleciona o ônibus e, no mesmo formulário, o motorista; a confirmação exibe "Escala de motoristas confirmada com sucesso" e persiste o vínculo motorista-ônibus-rota-data
- Lista de motoristas: só motoristas ativos; a API revalida a escala na confirmação
- Conflito (RN-002): o mesmo motorista não pode ser escalado em duas rotas no mesmo turno do dia; ida e volta do mesmo motorista são aceitas
- Organizado em blocos `Regra:` (escala de motoristas, conflitos e indisponíveis, acesso restrito)
- Cenários: 1 escala + 1 lista de disponíveis + 1 inativo fora da lista + 1 campos obrigatórios + 1 persistência (API) + 1 auditoria + 1 conflito + 1 conflito (API) + 1 ida e volta + 1 revalidação + 2 acesso restrito (menu e API)

**HU-018: Visualização da Lista de Embarque**

- Fluxo: o administrador abre "Lista de Embarque", escolhe a rota no campo "Rota *" e vê o contador ("38 alunos alocados"), a lista ordenada pelo nome com ponto, faculdade e indicação dos turnos, o ônibus e o motorista escalados
- Rota sem alunos: "Essa rota não possui nenhum aluno alocado para este dia." e botão "Imprimir lista" desabilitado
- Acesso direto e representante: a rota vem fixa, sem seletor; o representante vê só os alunos da sua faculdade (RN-015)
- Atualização: cancelamentos e realocações atualizam a lista, o contador e o indicador "Atualizado há X min"
- Organizado em blocos `Regra:` (consulta com seletor, acesso direto e representante, atualização, acesso restrito)
- Cenários: 1 fluxo principal + 1 contador + 1 ordenação + 1 indicação de turnos + 1 rota sem alunos + 1 impressão + 1 rota obrigatória (API) + 1 rota inexistente + 1 rotas do dia + 1 acesso direto + 1 representante + 1 rota automática + 1 várias rotas + 1 sem rota no dia + 1 representante sem vínculo + 1 cancelamento + 1 realocação + 1 indicador de sincronização + 1 só alunos ativos + 2 acesso restrito (perfil e sem token)

**HU-019: Consulta de Alocação Diária**

- Fluxo: o aluno vê, por turno, ônibus (número e placa), rota, motorista, horário, ponto e faculdade; a ida usa o horário de saída da rota e a volta o de retorno
- Sem distribuição: "Aguardando alocação do veículo", sem dados de frota; alocação parcial exibe cada turno com a sua situação
- Realocação: "Atenção: Você foi realocado. Seu ônibus para hoje é o veículo X"
- Sem agendamento ativo: "Você não possui agendamento confirmado para esta data."
- Organizado em blocos `Regra:` (consulta depois da distribuição, distribuição não concluída, isolamento por aluno)
- Cenários: 1 fluxo principal + 1 horários + 1 só ida + 1 realocado + 1 dado atual + 1 aguardando + 1 alocação parcial + 1 status geral (API) + 1 realocação (API) + 1 sem agendamento + 1 desempenho + 1 isolamento + 2 acesso restrito (perfil e sem token)

**HU-020: Rotatividade Inteligente / Rodízio Semanal**

- Fluxo: o administrador vê as rotas ativas e os ônibus vinculados, configura o padrão de alternância, confere a prévia das próximas semanas e confirma ("Rodízio configurado e aplicado com sucesso")
- Alertas e bloqueios: capacidade insuficiente para a demanda prevista (FA-001), ônibus inativo fora da seleção (FA-002) e mesmo ônibus em duas rotas (RN-003)
- Influência: depois de confirmado, o rodízio orienta a distribuição diária da HU-016
- Organizado em blocos `Regra:` (configuração e confirmação, alertas e bloqueios, acesso restrito)
- Cenários: 1 rotas e ônibus + 1 configuração + 1 prévia sem gravação + 1 influência na alocação + 1 capacidade + 1 ônibus inativo + 1 ônibus em duas rotas + 2 acesso restrito (menu e API)
- **Sem implementação na `develop` analisada:** não há API nem tela do rodízio; os cenários seguem apenas os requisitos.

## Resumo de Cobertura

| HU     | Cenários | Esquemas | Execuções |
| ------ | -------- | -------- | --------- |
| HU-016 | 24       | 6        | 34        |
| HU-017 | 12       | 3        | 15        |
| HU-018 | 21       | 4        | 26        |
| HU-019 | 14       | 3        | 17        |
| HU-020 | 9        | 2        | 11        |
| Total  | 80       | 18       | 103       |

- Todos os critérios de aceite e fluxos alternativos de `docs/requisitos.md` (seção 7.6) têm ao menos um cenário.
- Cenários de API, persistência, integridade (RNF-012), auditoria e acesso por perfil estão marcados com `@teste_api @nao_automatizavel_via_appium`.
- Mensagens de API seguem as do código (`backend/src/modulos/alocacao_diaria/`); as de interface vêm de `docs/requisitos.md` ou das telas já implementadas.
- Arquivos validados com o parser oficial `@cucumber/gherkin`.

## Divergências encontradas entre requisitos e implementação

Os cenários seguem os requisitos. Os pontos abaixo mostram o que a `develop` (`b86cc704`) ainda faz diferente do especificado.

**HU-016**

- **Prioridade de outro ônibus (AC-06 e AC-08):** o algoritmo preenche assentos e vagas em pé do primeiro ônibus antes de usar outro (`distribuicao.py` e `test_demanda_excedente_vai_para_em_pe`). O requisito pede reduzir os alunos em pé usando outro ônibus com vaga e alocar até o limite exato de assentos. O cenário de prioridade fica descrito pelo requisito.
- **Alunos excedentes na confirmação automática:** a prévia lista os excedentes, mas a confirmação grava só as alocações; o excedente fica sem ônibus e nada avisa isso ao administrador.
- **Vínculo de ônibus e motorista (AC-02, HU-017 AC-01):** a distribuição automática escolhe o ônibus (maior capacidade) e o motorista (em sequência) sozinha; só o modo manual permite o administrador escolher.
- **Conflito de ônibus (AC-11 e AC-14):** o conflito é por turno do dia (ida ou volta), não por horário. Na prévia automática, um ônibus usado na ida não é reaproveitado na volta, enquanto a distribuição manual aceita o mesmo ônibus nos dois turnos.
- **Alerta de rodízio (AC-15):** a prévia tem um alerta `ONIBUS_DIFERENTE_DO_RODIZIO`, mas ninguém informa o rodízio ao cálculo e o texto é diferente do requisito.

**HU-017**

- **Mensagem de sucesso:** a API responde "Distribuição realizada com sucesso"; "Escala de motoristas confirmada com sucesso" existe só na tela do PR #457.
- **Conflito de motorista (AC-05, AC-08 e FA-001):** a API recusa por turno e com a mensagem "alocação N: motorista X conflitante no turno ida." em vez do alerta do requisito ("Este motorista já está escalado para outra rota neste horário"). A lista da tela traz todos os motoristas ativos, sem filtrar pelo horário (AC-02).
- **Auditoria (RNF-013):** a confirmação da escala não grava log de auditoria.

**HU-018:** sem divergências relevantes; o perfil `supervisor` aceito pela API é apenas um apelido de compatibilidade do representante.

**HU-020**

- **Sem implementação:** não há API nem tela do rodízio. O card "Rodízio de frota" do painel logístico aponta para `/logistica/rodizio`, rota que não existe.

**HU-019:** sem divergências encontradas; mensagens, horários por turno e aviso de realocação seguem o requisito.
