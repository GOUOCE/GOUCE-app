# BDD — Épico 06: Frequência e Relatórios Gerenciais

Especificações em Gherkin (português) do comportamento esperado para acompanhar a execução das viagens e analisar os dados operacionais: o check-in de presença dos alunos no embarque e os relatórios quantitativos que cruzam agendamentos, presenças e escala de motoristas.

O formato, as tags e a rastreabilidade seguem o padrão descrito em [`../epico-01/README.md`](../epico-01/README.md). As tags adicionais e a organização em blocos `Regra:` seguem o [`../epico-02/README.md`](../epico-02/README.md).

## Estrutura

```
bdd/features/epico-06/
├── HU-021.feature  (Registro de Embarque e Frequência)
└── HU-022.feature  (Geração de Relatórios Quantitativos)
```

## Tags adicionais usadas neste épico

| Tag                 | Significado                                                                          |
| ------------------- | ------------------------------------------------------------------------------------ |
| `@conectividade`    | Cenário que depende de queda de conexão ou de sincronização posterior (FA-003)       |
| `@depende_de_HU0XX` | Cenário que só pode ser executado depois que a HU indicada estiver entregue (HU-017 e HU-021) |

## Histórias de Usuário

**HU-021: Registro de Embarque e Frequência**

- Fluxo: o representante abre a lista de embarque do dia, vê os alunos da sua faculdade com as opções "Presente" e "Falta" e marca cada aluno; o status é salvo a cada marcação e o administrador acompanha os totais em tempo real
- Status inicial: todos os alunos aparecem como "Pendente"; nunca como "Falta" sem registro explícito (AC-07); ao fim da viagem, quem não passou pelo check-in continua "Pendente" e não conta como presença
- Restrição de data (RN-014): em data passada ou futura a lista fica em modo somente leitura, com os botões desabilitados e o alerta de que a chamada só vale no dia da viagem
- Sem conexão (FA-003): as marcações ficam guardadas no aparelho com o ícone de "Sincronização Pendente" e são enviadas sozinhas quando a conexão volta
- Aluno fora da lista (FA-002): não há inclusão manual de passageiros
- Data sem viagens (AC-04 e FA-004): "Não há registros de viagens ou agendamentos para a data selecionada."
- Organizado em blocos `Regra:` (registro no dia da viagem, restrição por data, aluno fora da lista e conexão, acompanhamento do administrador, acesso restrito)
- Cenários: 1 lista com as opções + 1 status inicial + 1 pendente ao fim da viagem + 1 presente + 1 falta + 1 correção + 1 totais + 1 busca + 1 escopo do representante + 1 cancelamento (RN-005) + 1 status aceitos (API) + 1 gravação (API) + 1 data passada ou futura + 1 recusa fora do dia (API) + 1 administrador fora do dia (API) + 1 aluno não listado + 1 agendamento fora da rota (API) + 1 sem conexão + 1 sincronização + 1 painel do administrador + 1 administrador registra + 1 data sem viagens + 2 acesso restrito (perfis e sem token)

**HU-022: Geração de Relatórios Quantitativos**

- Fluxo: o administrador abre "Relatórios", define o período e, se quiser, a faculdade de destino e o bairro, gera o relatório e vê, por dia e por rota, os alunos agendados e os embarques efetivos (presenças validadas)
- Indicadores: quantidade de agendamentos, de embarques e taxa de comparecimento (AC-09); quantidade de alunos por dia, faculdade e localidade; dias trabalhados e rotas de cada motorista (AC-07 e AC-08)
- Tipos de relatório: "Agendamentos e embarques" e "Motoristas"; faculdade vale para o destino na ida e a origem na volta; bairro é o do ponto de embarque ou de desembarque
- Exportação: PDF e planilha, com os mesmos filtros e totais da tela (AC-03)
- Validações: "Nenhum dado encontrado para os filtros informados." quando não há dados (FA-001); data final anterior à inicial bloqueia a busca e marca os campos (FA-002)
- Histórico (RN-004): a inativação de faculdade, rota ou motorista não apaga os dados de períodos anteriores nos relatórios
- Organizado em blocos `Regra:` (geração, exportação, validação dos filtros, acesso restrito)
- Cenários: 1 geração + 1 tipos de relatório + 1 faculdade na ida e na volta + 1 bairro de embarque e desembarque + 1 filtros + 1 só presença conta + 1 taxa de comparecimento + 1 alunos por dia, faculdade e localidade + 1 dias trabalhados dos motoristas + 1 ida e volta no mesmo dia + 1 histórico (RN-004) + 1 totais (API) + 1 exportação + 1 sem dados + 1 data final anterior + 1 mesmo dia + 1 período obrigatório + 1 período inválido (API) + 1 sem dados (API) + 3 acesso restrito (menu, API e sem token)

## Resumo de Cobertura

| HU     | Cenários | Esquemas | Execuções |
| ------ | -------- | -------- | --------- |
| HU-021 | 24       | 7        | 34        |
| HU-022 | 22       | 10       | 35        |
| Total  | 46       | 17       | 69        |

- Todos os critérios de aceite e fluxos alternativos de `docs/requisitos.md` (seção 7.7) têm ao menos um cenário.
- Cenários de API, persistência, integridade (RNF-012), histórico (RN-004) e acesso por perfil estão marcados com `@teste_api @nao_automatizavel_via_appium`.
- Mensagens de interface vêm de `docs/requisitos.md`; como a API ainda não existe, os códigos de status de API (`422`, `403`, `401`) seguem o padrão dos outros épicos e devem ser confirmados na implementação.
- Arquivos validados com o parser oficial `@cucumber/gherkin`.

## Decisões do PO (issue #537) e o que falta implementar

O PO não respondeu a tempo; seguimos as sugestões ⭐ da issue #537 e elas já estão em `docs/requisitos.md` (seção 7.7) e nos cenários. A `develop` analisada é a `f51e7d1e`.

**Decididas:**

- **Aluno sem check-in (HU-021, AC-07 e passo 11):** só vira "Falta" com registro explícito; quem fica "Pendente" continua assim e não conta como presença.
- **Quem registra (HU-021, RF-021 e AC-06):** o representante responsável e o administrador registram e alteram, sempre só no dia da viagem (RN-014).
- **Embarque e taxa (HU-022):** embarque é o aluno com status "Presente"; taxa de comparecimento = embarques ÷ agendados × 100.
- **Dias trabalhados (HU-022, AC-07):** ida e volta no mesmo dia contam como 1 dia.
- **Tipos de relatório (HU-022, passo 11):** "Agendamentos e embarques" (por dia, faculdade, bairro e rota) e "Motoristas" (dias trabalhados e rotas).
- **Filtros (HU-022, AC-01):** faculdade vale para a ida (destino) e a volta (origem); localidade é o bairro do ponto de embarque ou de desembarque do aluno.
- **Exportação (HU-022, AC-03):** os dois formatos, PDF e planilha.

**Sem implementação:**

- **HU-021, backend:** não existe tabela, API nem regra de presença. O que há de frequência está só no front, na branch `feature/hu-021-registro-embarque-frequencia` (sem PR), que chama `PATCH /alocacao-diaria/lista-embarque/frequencia` e espera `status_presenca`, `total_presentes`, `total_faltas` e `somente_leitura` na lista de embarque; nada disso existe na API.
- **HU-022:** não há API, tela nem menu "Relatórios".

**Ponto ainda em aberto:**

- **HU-021, RN-005:** a regra é citada, mas nenhum critério a usa. Os cenários só garantem que o aluno que cancelou sai da lista.
