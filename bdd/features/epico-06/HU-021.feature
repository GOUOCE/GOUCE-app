# =================================================================================
# ÉPICO: EP-006 - Frequência e Relatórios Gerenciais
# HISTÓRIA DE USUÁRIO: HU-021 - Registro de Embarque e Frequência
# REQUISITOS RELACIONADOS: RF-021 (Acompanhamento de Frequência)
# REQ. NÃO FUNCIONAIS: RNF-012 (Integridade dos Dados)
# REGRA DE NEGÓCIO: RN-005 (Cancelamento de Agendamento), RN-006 (Exclusividade Administrativa), RN-014 (Restrição de Check-in), RN-015 (Atuação do Representante)
# language: pt
# =================================================================================

@EP006 @HU021 @registro_frequencia
Funcionalidade: Registro de Embarque e Frequência
  Como representante da universidade
  Quero utilizar a lista de embarque para dar o check-in (Presente ou Falta) nos alunos da minha instituição de ensino no momento da entrada
  Para que o administrador acompanhe a assiduidade em tempo real


  Regra: O representante registra a presença dos alunos no dia da viagem

    Contexto:
      Dado que o representante "Rafael Alves" é responsável pela faculdade "UFC"
      E está autenticado no sistema
      E o aplicativo possui conexão ativa com a API
      E hoje é o dia "17/11/2026"
      E a rota "Rota Centro - UFC" possui os alunos "Ana Souza", "Bruno Alves" e "Carlos Lima" da faculdade "UFC" alocados para o dia


    # AC-01, AC-02 - Lista do dia com as opções de presença
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Representante visualiza os alunos da sua faculdade com as opções "Presente" e "Falta"
      Quando o representante acessa a lista de embarque do dia
      Então o sistema exibe os alunos "Ana Souza", "Bruno Alves" e "Carlos Lima"
      E exibe para cada aluno somente as opções "Presente" e "Falta"


    # AC-07 - Status inicial neutro
    @fluxo_feliz @prioridade_alta
    Cenário: Sistema exibe todos os alunos com o status "Pendente" antes do check-in
      Quando o representante acessa a lista de embarque do dia
      Então todos os alunos aparecem com o status "Pendente"
      E nenhum aluno aparece como "Falta" sem registro explícito


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-03, passos 10 e 12
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Representante marca "Presente" e o sistema salva o status imediatamente
      Quando o representante localiza "Ana Souza" na lista
      E aciona a opção "Presente"
      Então o sistema exibe "Ana Souza" com o status "Presente"
      E salva o status no banco de dados imediatamente
      E o total de presentes passa a ser 1


    # Passo 11 - Falta
    @fluxo_feliz @prioridade_alta
    Cenário: Representante marca "Falta" para o aluno que não compareceu
      Quando o representante aciona a opção "Falta" para "Bruno Alves"
      Então o sistema exibe "Bruno Alves" com o status "Falta"
      E o total de faltas passa a ser 1


    # Decisão do PO (#537, item 1) - Pendente não vira Falta sozinho
    @regra_negocio @prioridade_alta
    Cenário: Aluno sem check-in continua "Pendente" ao fim da viagem e não conta como presença
      Dado que "Carlos Lima" não passou pelo check-in durante a viagem
      Quando a viagem da rota "Rota Centro - UFC" termina
      Então o sistema mantém "Carlos Lima" com o status "Pendente"
      E não registra "Falta" para "Carlos Lima"
      E "Carlos Lima" não é contado como embarque nos relatórios


    # AC-02, AC-03 - Correção do status no mesmo dia
    @fluxo_feliz @prioridade_media
    Cenário: Representante corrige o status de um aluno de "Falta" para "Presente"
      Dado que "Bruno Alves" está com o status "Falta"
      Quando o representante aciona a opção "Presente" para "Bruno Alves"
      Então o sistema exibe "Bruno Alves" com o status "Presente"
      E o total de faltas volta a ser 0


    # AC-03 - Totais consolidados
    @fluxo_feliz @prioridade_alta
    Esquema do Cenário: Sistema exibe os totais de presentes, faltas e pendentes da rota
      Dado que, dos 3 alunos da rota, <presentes> estão "Presente", <faltas> estão "Falta" e <pendentes> estão "Pendente"
      Quando o representante visualiza a lista de embarque do dia
      Então o sistema exibe <presentes> presente(s), <faltas> falta(s) e <pendentes> pendente(s)

      Exemplos:
        | presentes | faltas | pendentes |
        | 0         | 0      | 3         |
        | 2         | 1      | 0         |
        | 1         | 1      | 1         |


    # Passo 10 - Barra de busca
    @fluxo_feliz @prioridade_media
    Cenário: Representante localiza o aluno pela barra de busca
      Quando o representante digita "Bruno" na barra de busca
      Então o sistema exibe somente o aluno "Bruno Alves"


    # AC-01, RN-015 - Escopo do representante
    @fluxo_feliz @RN015 @prioridade_alta
    Cenário: Representante visualiza somente os alunos da faculdade sob a sua responsabilidade
      Dado que a rota também possui o aluno "Diana Rocha" da faculdade "IFCE"
      Quando o representante acessa a lista de embarque do dia
      Então o sistema não exibe "Diana Rocha"


    # RN-005 - Aluno que cancelou o agendamento
    @regra_negocio @RN005 @prioridade_media
    Cenário: Aluno que cancelou o agendamento deixa de aparecer na lista de presença
      Dado que "Carlos Lima" cancelou o agendamento do dia "17/11/2026"
      Quando o representante acessa a lista de embarque do dia
      Então o sistema não exibe "Carlos Lima"
      E exibe o total de 2 alunos


    # AC-02 - API aceita somente as duas opções
    @fluxo_infeliz @validacao_campos @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API valida o status de presença informado
      Quando o representante envia pela API o status "<status>" para o agendamento de "Ana Souza"
      Então a API responde com o status "<resposta>"
      E <resultado>

      Exemplos:
        | status   | resposta                 | resultado                                    |
        | PRESENTE | 200 OK                   | o status de "Ana Souza" é gravado            |
        | FALTA    | 200 OK                   | o status de "Ana Souza" é gravado            |
        | ATRASADO | 422 Unprocessable Entity | o status de "Ana Souza" permanece inalterado |


    # Passo 12, RNF-012 - Persistência a cada marcação
    @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API grava cada marcação de presença com a data e a hora do registro
      Quando o representante registra "PRESENTE" para "Ana Souza" pela API
      Então o banco de dados registra o status "PRESENTE" vinculado ao agendamento de "Ana Souza" no dia "17/11/2026"
      E registra a data e a hora do check-in
      E uma nova consulta da lista devolve "Ana Souza" como "PRESENTE"


  Regra: O check-in só pode ser feito no dia exato da viagem (RN-014)

    Contexto:
      Dado que o representante "Rafael Alves" é responsável pela faculdade "UFC"
      E está autenticado no sistema
      E o aplicativo possui conexão ativa com a API
      E hoje é o dia "17/11/2026"
      E a rota "Rota Centro - UFC" possui alunos alocados para os dias "16/11/2026", "17/11/2026" e "18/11/2026"


    # FA-001, AC-08 - Datas passada e futura em modo somente leitura
    @fluxo_infeliz @FA001 @RN014 @prioridade_alta
    Esquema do Cenário: Sistema exibe a lista em modo somente leitura para uma data <situacao>
      Quando o representante acessa a lista de embarque do dia "<data>"
      Então o sistema exibe a lista de alunos em modo somente leitura
      E desabilita as opções "Presente" e "Falta"
      E exibe o alerta de que a chamada só pode ser realizada no dia exato da viagem

      Exemplos:
        | situacao | data       |
        | passada  | 16/11/2026 |
        | futura   | 18/11/2026 |


    # AC-08 - API recusa a alteração fora do dia
    @fluxo_infeliz @RN014 @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API recusa o registro de presença para o dia "<data>"
      Quando o representante registra "PRESENTE" pela API para um aluno alocado no dia "<data>"
      Então a API responde com o status "422 Unprocessable Entity"
      E o status de presença do aluno permanece inalterado

      Exemplos:
        | data       |
        | 16/11/2026 |
        | 18/11/2026 |


    # AC-08, AC-06 - A restrição vale também para o administrador
    @fluxo_infeliz @RN014 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: API recusa a alteração de presença feita pelo administrador em data passada
      Dado que o administrador está autenticado no sistema
      Quando o administrador altera pela API a presença de um aluno do dia "16/11/2026"
      Então a API responde com o status "422 Unprocessable Entity"
      E o status de presença do aluno permanece inalterado


  Regra: Aluno fora da lista não embarca e a falta de conexão não perde marcações

    Contexto:
      Dado que o representante "Rafael Alves" é responsável pela faculdade "UFC"
      E está autenticado no sistema
      E hoje é o dia "17/11/2026"


    # FA-002 - Aluno não listado
    @fluxo_infeliz @FA002 @prioridade_alta
    Cenário: Sistema não permite incluir manualmente um aluno que não está na lista de embarque
      Dado que o aluno "Eduardo Prado" não agendou o transporte para o dia "17/11/2026"
      Quando o representante busca "Eduardo Prado" na lista de embarque
      Então o sistema não exibe "Eduardo Prado"
      E não oferece nenhuma opção de adicionar passageiros


    # FA-002 - API recusa agendamento fora da rota
    @fluxo_infeliz @FA002 @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API recusa o registro de presença para o agendamento <situacao>
      Quando o representante registra "PRESENTE" pela API para um agendamento <situacao>
      Então a API responde com o status "<resposta>"
      E nenhum status de presença é gravado

      Exemplos:
        | situacao                               | resposta                 |
        | que não está alocado na rota informada | 422 Unprocessable Entity |
        | de um aluno de outra faculdade         | 403 Forbidden            |
        | que foi cancelado                      | 422 Unprocessable Entity |


    # FA-003 - Perda de conexão durante o check-in
    @fluxo_infeliz @FA003 @conectividade @prioridade_alta
    Cenário: Sistema guarda as marcações no aparelho e exibe "Sincronização Pendente" quando a conexão cai
      Dado que o aplicativo do representante perde a conexão com a internet
      Quando o representante marca "Presente" para "Ana Souza" e "Falta" para "Bruno Alves"
      Então o sistema não trava
      E exibe as marcações com os status escolhidos
      E exibe o ícone de "Sincronização Pendente"


    # FA-003 - Sincronização automática
    @fluxo_infeliz @FA003 @conectividade @prioridade_alta
    Cenário: Sistema envia as marcações guardadas quando a conexão é restabelecida
      Dado que existem marcações de presença guardadas no aparelho com "Sincronização Pendente"
      Quando a conexão com a internet é restabelecida
      Então o aplicativo envia as marcações automaticamente em segundo plano
      E o ícone de "Sincronização Pendente" deixa de ser exibido
      E o administrador visualiza os status atualizados no painel


  Regra: O administrador acompanha a frequência em tempo real

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa o painel gerencial
      E o aplicativo possui conexão ativa com a API


    # AC-05, passo 13 - Atualização em tempo real
    @fluxo_feliz @prioridade_alta
    Cenário: Painel do administrador reflete as marcações feitas pelo representante
      Dado que o representante marcou "Presente" para "Ana Souza" na rota "Rota Centro - UFC" do dia "17/11/2026"
      Quando o administrador visualiza a lista de embarque da rota "Rota Centro - UFC" do dia "17/11/2026"
      Então o sistema exibe "Ana Souza" com o status "Presente"
      E exibe os totais de presentes, faltas e pendentes atualizados


    # AC-06 - Administrador também registra a presença
    @fluxo_feliz @RN006 @prioridade_media
    Cenário: Administrador altera o status de presença de um aluno no dia da viagem
      Dado que hoje é o dia "17/11/2026"
      Quando o administrador aciona a opção "Falta" para "Bruno Alves" na rota "Rota Centro - UFC"
      Então o sistema exibe "Bruno Alves" com o status "Falta"


    # AC-04, FA-004 - Data sem viagens
    @fluxo_infeliz @FA004 @prioridade_alta
    Esquema do Cenário: Sistema informa a data sem viagens para o <perfil>
      Dado que o usuário com perfil "<perfil>" está autenticado no sistema
      E não existem viagens nem agendamentos para o dia "21/11/2026"
      Quando o usuário seleciona o dia "21/11/2026"
      Então o sistema exibe a mensagem "Não há registros de viagens ou agendamentos para a data selecionada."

      Exemplos:
        | perfil        |
        | Administrador |
        | Representante |


  Regra: Somente o representante responsável e o administrador alteram a presença (AC-06)

    # AC-06 - Perfis sem permissão
    @fluxo_infeliz @regra_negocio @RN006 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega o registro de presença para o usuário "<perfil>"
      Dado que um usuário com perfil "<perfil>" possui um token de acesso válido
      Quando esse usuário tenta registrar a presença de um aluno pela API
      Então a API responde com o status "403 Forbidden"
      E nenhum status de presença é gravado

      Exemplos:
        | perfil                           |
        | Aluno                            |
        | Representante de outra faculdade |


    # AC-06 - Sem autenticação
    @fluxo_infeliz @regra_negocio @RN006 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API nega o registro de presença sem token de acesso
      Quando uma requisição de registro de presença é enviada sem token de acesso
      Então a API responde com o status "401 Unauthorized"
      E nenhum status de presença é gravado
