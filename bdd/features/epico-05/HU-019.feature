# =================================================================================
# ÉPICO: EP-005 - Alocação e Distribuição Logística
# HISTÓRIA DE USUÁRIO: HU-019 - Consulta de Alocação Diária
# REQUISITOS RELACIONADOS: RF-019 (Consulta de Alocação Diária)
# REQ. NÃO FUNCIONAIS: RNF-001 (Desempenho - Tempo de Resposta), RNF-012 (Integridade dos Dados)
# REGRA DE NEGÓCIO: RN-001 (Limite de Capacidade), RN-003 (Prevenção de Conflito de Veículo), RN-007 (Realocação por Capacidade)
# language: pt
# =================================================================================

@EP005 @HU019 @consulta_alocacao_diaria
Funcionalidade: Consulta de Alocação Diária
  Como aluno com agendamento confirmado
  Quero consultar em qual ônibus fui alocado para a minha viagem do dia
  Para saber exatamente qual veículo devo embarcar e garantir que estou na rota correta


  Regra: O aluno consulta o ônibus da viagem do dia depois da distribuição logística

    Contexto:
      Dado que o aluno "Maria Souza" está autenticado no sistema com cadastro aprovado e vínculo válido
      E o aplicativo possui conexão ativa com a API
      E o aluno possui um agendamento ativo para o dia "17/11/2026" com ida e volta
      E o administrador concluiu a distribuição logística do dia "17/11/2026"


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-01, AC-04
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Aluno visualiza os dados da alocação separados por turno
      Quando o aluno acessa a tela inicial ou a área "Meus Agendamentos"
      Então o sistema exibe de forma destacada os dados do turno da ida e do turno da volta
      E cada turno informa o número e a placa do ônibus, o nome da rota, o nome do motorista e o horário
      E cada turno informa o ponto de embarque escolhido pelo aluno e a faculdade de destino ou de origem


    # AC-01 - Horário de cada turno
    @fluxo_feliz @prioridade_media
    Cenário: Sistema exibe o horário de saída na ida e o horário de retorno na volta
      Dado que a rota "Rota Centro - UFC" sai às "06:30" e retorna às "17:30"
      Quando o aluno acessa a área "Meus Agendamentos"
      Então o turno da ida informa o horário "06:30"
      E o turno da volta informa o horário "17:30"


    # AC-01 - Agendamento só de ida
    @fluxo_feliz @prioridade_media
    Cenário: Sistema exibe somente o turno agendado quando o aluno usa apenas a ida
      Dado que o aluno possui um agendamento ativo para o dia "18/11/2026" somente com ida
      E o administrador concluiu a distribuição logística do dia "18/11/2026"
      Quando o aluno acessa a área "Meus Agendamentos"
      Então o sistema exibe os dados do turno da ida
      E não exibe o turno da volta


    # AC-03, FA-002, RN-007 - Aluno realocado
    @fluxo_infeliz @FA002 @RN007 @prioridade_alta
    Cenário: Sistema exibe o aviso destacado quando o aluno foi realocado para um ônibus de outra rota
      Dado que o administrador realocou o aluno para o ônibus de placa "XYZ9K87", de outra rota
      Quando o aluno acessa a área "Meus Agendamentos"
      Então o sistema exibe o aviso destacado "Atenção: Você foi realocado. Seu ônibus para hoje é o veículo XYZ9K87"


    # AC-04 - Dados atualizados
    @fluxo_feliz @prioridade_alta
    Cenário: Sistema exibe a alocação mais atual depois de uma nova distribuição
      Dado que o aluno já consultou o ônibus de placa "ABC1D23"
      E o administrador confirmou uma nova distribuição que alocou o aluno no ônibus "XYZ9K87"
      Quando o aluno consulta novamente a área "Meus Agendamentos"
      Então o sistema exibe o ônibus "XYZ9K87"


  Regra: O aluno acompanha a situação quando a distribuição ainda não foi concluída

    Contexto:
      Dado que o aluno "Maria Souza" está autenticado no sistema com cadastro aprovado e vínculo válido
      E o aplicativo possui conexão ativa com a API
      E o aluno possui um agendamento ativo para o dia "17/11/2026" com ida e volta


    # FA-001, AC-02 - Alocação ainda não finalizada
    @fluxo_infeliz @FA001 @prioridade_alta
    Cenário: Sistema exibe "Aguardando alocação do veículo" enquanto a distribuição não foi concluída
      Dado que o administrador ainda não concluiu a distribuição logística do dia "17/11/2026"
      Quando o aluno acessa a área "Meus Agendamentos"
      Então o sistema exibe o agendamento com o status "Aguardando alocação do veículo"
      E não exibe nenhum dado de ônibus ou de motorista


    # AC-02, HU-016 AC-13 - Aluno excedente da distribuição
    @fluxo_infeliz @FA001 @prioridade_alta
    Cenário: Sistema exibe "Aguardando alocação do veículo" para o aluno que ficou como excedente
      Dado que o administrador confirmou a distribuição do dia "17/11/2026" e o aluno ficou como excedente
      Quando o aluno acessa a área "Meus Agendamentos"
      Então o sistema exibe o agendamento com o status "Aguardando alocação do veículo"
      E não exibe nenhum dado de ônibus ou de motorista


    # AC-02 - Alocação parcial
    @fluxo_infeliz @FA001 @prioridade_media
    Cenário: Sistema exibe a alocação do turno concluído e aguarda o outro turno
      Dado que o administrador alocou somente o turno da ida do dia "17/11/2026"
      Quando o aluno acessa a área "Meus Agendamentos"
      Então o sistema exibe os dados do ônibus no turno da ida
      E exibe o turno da volta com o status "Aguardando alocação do veículo"


    # AC-02 - API informa o status geral
    @regra_negocio @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API informa o status geral da viagem como "<status_geral>"
      Dado que a situação do dia é "<situacao>"
      Quando o aluno consulta a minha viagem do dia "17/11/2026" pela API
      Então a API responde com o status "200 OK"
      E o status geral da resposta é "<status_geral>"

      Exemplos:
        | situacao                 | status_geral         |
        | nenhum turno alocado     | AGUARDANDO_ALOCACAO  |
        | somente um turno alocado | PARCIALMENTE_ALOCADO |
        | todos os turnos alocados | ALOCADO              |


    # AC-01, AC-03 - API informa a realocação
    @regra_negocio @RN007 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API informa que o aluno foi realocado quando o ônibus é de outra rota
      Dado que o administrador realocou o aluno para o ônibus de placa "XYZ9K87", de outra rota
      Quando o aluno consulta a minha viagem do dia "17/11/2026" pela API
      Então a resposta informa que o aluno foi realocado
      E informa o aviso "Atenção: Você foi realocado. Seu ônibus para hoje é o veículo XYZ9K87"


    # Sem agendamento
    @fluxo_infeliz @teste_api @nao_automatizavel_via_appium @prioridade_media
    Esquema do Cenário: API informa que não há viagem quando o aluno <situacao>
      Dado que o aluno <situacao> para o dia "17/11/2026"
      Quando o aluno consulta a minha viagem do dia "17/11/2026" pela API
      Então a API responde com o status "200 OK"
      E o status geral da resposta é "SEM_AGENDAMENTO"
      E a resposta informa a mensagem "Você não possui agendamento confirmado para esta data."

      Exemplos:
        | situacao               |
        | não possui agendamento |
        | cancelou o agendamento |


    # AC-05, RNF-001 - Tempo de resposta
    @nao_funcional @desempenho @RNF001 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: Tempo de resposta da consulta de alocação não ultrapassa 3 segundos
      Dado que a conexão com a internet está em condições normais
      Quando o aluno consulta a minha viagem do dia "17/11/2026" pela API
      Então a API retorna a resposta da consulta em até 3 segundos


  Regra: Cada aluno consulta somente a própria alocação

    # RNF-012 - Isolamento entre alunos
    @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Aluno visualiza somente a alocação do próprio agendamento
      Dado que os alunos "Maria Souza" e "João Lima" possuem agendamento no dia "17/11/2026" em ônibus diferentes
      Quando "Maria Souza" consulta a minha viagem do dia "17/11/2026" pela API
      Então a resposta traz somente o ônibus de "Maria Souza"


    # Perfis sem acesso
    @fluxo_infeliz @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega a consulta da minha viagem ao usuário "<perfil>"
      Dado que um usuário com perfil "<perfil>" possui um token de acesso válido
      Quando esse usuário consulta a minha viagem pela API
      Então a API responde com o status "403 Forbidden"

      Exemplos:
        | perfil        |
        | Administrador |


    # Sem autenticação
    @fluxo_infeliz @regra_negocio @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API nega a consulta da minha viagem sem token de acesso
      Quando uma requisição de consulta da minha viagem é enviada sem token de acesso
      Então a API responde com o status "401 Unauthorized"
