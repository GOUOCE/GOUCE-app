# =================================================================================
# ÉPICO: EP-005 - Alocação e Distribuição Logística
# HISTÓRIA DE USUÁRIO: HU-016 - Distribuição de Alunos nos Ônibus
# REQUISITOS RELACIONADOS: RF-017 (Distribuição de Alunos)
# REQ. NÃO FUNCIONAIS: RNF-012 (Integridade dos Dados)
# REGRA DE NEGÓCIO: RN-001 (Limite de Capacidade), RN-003 (Prevenção de Conflito de Veículo), RN-006 (Exclusividade Administrativa), RN-007 (Realocação por Capacidade)
# language: pt
# =================================================================================

@EP005 @HU016 @distribuicao_alunos
Funcionalidade: Distribuição de Alunos nos Ônibus
  Como administrador
  Quero distribuir os alunos agendados entre os ônibus disponíveis considerando assentos e capacidade de alunos em pé
  Para equilibrar a ocupação dos veículos e minimizar a quantidade de alunos em pé


  Regra: O administrador visualiza a demanda do dia e confere a prévia da distribuição

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa a tela "Alocação Diária"
      E o aplicativo possui conexão ativa com a API


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-01
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Administrador seleciona um dia e visualiza a demanda de alunos agendados por rota
      Dado que existem 4 alunos agendados na rota "Rota Centro - UFC" e 2 alunos agendados na rota "Rota Campo Velho - UFC" para o dia "17/11/2026"
      Quando o administrador seleciona o dia "17/11/2026"
      Então o sistema exibe a demanda de 4 alunos para a rota "Rota Centro - UFC"
      E exibe a demanda de 2 alunos para a rota "Rota Campo Velho - UFC"


    # AC-03, AC-04, AC-05 - Sentados e em pé em cada ônibus
    @fluxo_feliz @RN001 @prioridade_alta
    Esquema do Cenário: Sistema calcula a quantidade de alunos sentados e em pé no ônibus
      Dado que existem <alunos> alunos agendados na rota "Rota Centro - UFC" no turno da ida
      E existe um único ônibus ativo com 3 assentos e capacidade para 2 alunos em pé
      Quando o administrador visualiza a prévia da distribuição automática
      Então o sistema aloca <alunos> alunos no ônibus, sendo <sentados> sentados e <em_pe> em pé

      Exemplos:
        | alunos | sentados | em_pe |
        | 2      | 2        | 0     |
        | 3      | 3        | 0     |
        | 5      | 3        | 2     |


    # AC-03, AC-08, FA-001 - Excedentes além da capacidade
    @fluxo_infeliz @FA001 @RN001 @prioridade_alta
    Cenário: Sistema sinaliza os alunos excedentes quando a demanda ultrapassa a capacidade do único ônibus
      Dado que existem 6 alunos agendados na rota "Rota Centro - UFC" no turno da ida
      E existe um único ônibus ativo com 3 assentos e capacidade para 2 alunos em pé
      Quando o administrador visualiza a prévia da distribuição automática
      Então o sistema aloca 5 alunos no ônibus, sem ultrapassar a capacidade
      E sinaliza 1 aluno excedente


    # AC-06, RN-007 - Realocação para outro ônibus com vaga
    @fluxo_feliz @RN007 @prioridade_alta
    Cenário: Sistema prioriza outro ônibus com vaga para reduzir a quantidade de alunos em pé
      Dado que existem 5 alunos agendados na rota "Rota Centro - UFC" no turno da ida
      E existem dois ônibus ativos, um com 3 assentos e outro com 3 assentos, ambos com capacidade para 2 alunos em pé
      Quando o administrador visualiza a prévia da distribuição automática
      Então o sistema distribui os alunos entre os dois ônibus
      E nenhum aluno fica em pé enquanto houver assento disponível no outro ônibus


    # AC-07, FA-001 passo 5 - Sem outro ônibus, o aluno permanece em pé
    @fluxo_feliz @RN007 @prioridade_media
    Cenário: Sistema mantém o aluno em pé quando não há outro ônibus disponível
      Dado que existem 4 alunos agendados na rota "Rota Centro - UFC" no turno da ida
      E existe um único ônibus ativo com 3 assentos e capacidade para 2 alunos em pé
      Quando o administrador visualiza a prévia da distribuição automática
      Então o sistema aloca o quarto aluno em pé
      E exibe a quantidade de alunos em pé do ônibus


    # AC-16 - Faculdade sem demanda no turno
    @fluxo_feliz @prioridade_media
    Cenário: Sistema permite a alocação quando uma faculdade da rota não possui aluno agendado no turno
      Dado que a rota "Rota Centro - UFC" atende as faculdades "UFC" e "IFCE" na volta
      E existem alunos agendados somente para a faculdade "UFC" no turno da volta
      Quando o administrador visualiza a prévia da distribuição automática
      Então o sistema aloca os alunos normalmente
      E desconsidera a parada na faculdade "IFCE" para essa viagem


    # AC-12 - Prévia não persiste
    @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Prévia da distribuição não grava nenhuma alocação no banco de dados
      Dado que existem alunos agendados para o dia "17/11/2026"
      Quando o administrador consulta a prévia da distribuição automática do dia "17/11/2026" pela API
      Então a API responde com o status "200 OK"
      E nenhuma alocação é gravada no banco de dados


    # Dia sem demanda
    @fluxo_infeliz @prioridade_media
    Cenário: Sistema informa que não há alunos agendados para o dia selecionado
      Dado que não existem alunos agendados para o dia "18/11/2026"
      Quando o administrador seleciona o dia "18/11/2026"
      Então o sistema informa que não há alunos agendados para este dia
      E não permite confirmar a distribuição


    # Sem motoristas ativos
    @fluxo_infeliz @regra_negocio @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: API recusa a prévia quando não há motoristas ativos
      Dado que existem ônibus ativos e nenhum motorista ativo
      Quando o administrador consulta a prévia da distribuição automática do dia "17/11/2026" pela API
      Então a API responde com o status "422 Unprocessable Entity"
      E a resposta informa a mensagem "Não há motoristas ativos disponíveis."


  Regra: O administrador confirma a distribuição e o sistema persiste as alocações

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa a tela "Alocação Diária"
      E o aplicativo possui conexão ativa com a API
      E existem alunos agendados para o dia "17/11/2026"


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-13
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Administrador revisa a prévia e confirma a distribuição
      Dado que o administrador selecionou o dia "17/11/2026" e revisou a prévia da distribuição
      Quando o administrador aciona o botão "Confirmar Distribuição"
      Então o sistema exibe a mensagem "Distribuição realizada com sucesso"
      E o status logístico do dia "17/11/2026" passa a ser "DISTRIBUIDO"


    # AC-13 - API persiste a alocação
    @fluxo_feliz @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API persiste a distribuição automática vinculando os alunos aos veículos
      Quando o administrador confirma a distribuição automática do dia "17/11/2026" pela API
      Então a API responde com o status "201 Created"
      E a resposta informa a mensagem "Distribuição realizada com sucesso" e o status logístico "DISTRIBUIDO"
      E cada aluno agendado fica vinculado a um ônibus, a um motorista e ao tipo de lugar "sentado" ou "em_pe"


    # AC-13 - Confirmação com alunos excedentes (decisão do PO na #465, item 2)
    @fluxo_infeliz @FA001 @RN001 @prioridade_alta
    Cenário: Sistema permite confirmar a distribuição com alunos excedentes e exibe o aviso com a lista deles
      Dado que a prévia da distribuição do dia "17/11/2026" possui o aluno "Maria Souza" como excedente
      Quando o administrador aciona o botão "Confirmar Distribuição"
      Então o sistema exibe a mensagem "Distribuição realizada com sucesso"
      E exibe um aviso com a lista dos alunos excedentes, incluindo "Maria Souza"
      E "Maria Souza" fica sem ônibus alocado até ser realocada


    # AC-13 - API confirma e mantém o excedente sem alocação (decisão do PO na #465, item 2)
    @regra_negocio @RN001 @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API confirma a distribuição automática e informa os alunos excedentes sem alocação
      Dado que a prévia da distribuição do dia "17/11/2026" possui um aluno excedente
      Quando o administrador confirma a distribuição automática do dia "17/11/2026" pela API
      Então a API responde com o status "201 Created"
      E a resposta lista o aluno excedente
      E o aluno excedente não possui alocação gravada


    # AC-02 - Troca do ônibus e do motorista sugeridos (decisão do PO na #465, item 5)
    @fluxo_feliz @prioridade_alta
    Cenário: Administrador troca o ônibus e o motorista sugeridos antes de confirmar a distribuição automática
      Dado que a prévia sugere o ônibus "ABC1D23" e o motorista "Carlos Silva" para a rota "Rota Centro - UFC"
      Quando o administrador troca o ônibus para "XYZ9K87" e o motorista para "Pedro Alves"
      E aciona o botão "Confirmar Distribuição"
      Então o sistema exibe a mensagem "Distribuição realizada com sucesso"
      E a rota "Rota Centro - UFC" fica com o ônibus "XYZ9K87" e o motorista "Pedro Alves"


    # RNF-012 - Nova confirmação substitui a anterior
    @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: Nova confirmação do mesmo dia substitui a distribuição anterior sem duplicar alocações
      Dado que o dia "17/11/2026" já possui uma distribuição confirmada
      Quando o administrador confirma uma nova distribuição para o dia "17/11/2026" pela API
      Então a distribuição anterior do dia é substituída
      E cada aluno possui uma única alocação por turno


  Regra: O administrador realoca manualmente os alunos excedentes

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa a tela "Alocação Diária"
      E o aplicativo possui conexão ativa com a API
      E o aluno "Maria Souza" ficou como excedente da rota "Rota Centro - UFC" no dia "17/11/2026"
      E existe outro ônibus ativo com vaga disponível


    # AC-09, AC-10, FA-001 - Realocação manual para ônibus de outra rota
    @fluxo_feliz @FA001 @RN007 @prioridade_alta
    Cenário: Administrador realoca um aluno excedente para outro ônibus e o status do aluno é atualizado
      Quando o administrador seleciona "Maria Souza" entre os alunos excedentes
      E realoca "Maria Souza" para o ônibus de outra rota que possui vaga
      E confirma a distribuição
      Então o sistema exibe a mensagem "Distribuição realizada com sucesso"
      E "Maria Souza" passa a constar na alocação do ônibus alternativo
      E "Maria Souza" visualiza o aviso "Atenção: Você foi realocado. Seu ônibus para hoje é o veículo" seguido da placa do ônibus alternativo


    # AC-09 - API aceita a distribuição manual
    @regra_negocio @RN007 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: API persiste a distribuição manual informada pelo administrador
      Quando o administrador envia pela API a distribuição manual do dia "17/11/2026" com a aluna "Maria Souza" no ônibus alternativo
      Então a API responde com o status "201 Created"
      E a aluna "Maria Souza" fica vinculada ao ônibus informado


  Regra: O sistema bloqueia alocações que violam a capacidade e os conflitos de veículo

    Contexto:
      Dado que o administrador está autenticado no sistema
      E o dia "17/11/2026" possui alunos agendados na rota "Rota Centro - UFC"


    # AC-11, RN-001 - Capacidade do ônibus excedida
    @fluxo_infeliz @RN001 @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API recusa a distribuição que excede a capacidade do ônibus (<situacao>)
      Dado que o ônibus "ABC1D23" possui 3 assentos e capacidade para 2 alunos em pé
      Quando o administrador envia a distribuição manual com <alunos> alunos no ônibus "ABC1D23", sendo <sentados> sentados e <em_pe> em pé
      Então a API responde com o status "422 Unprocessable Entity"
      E a resposta informa a mensagem "<mensagem>"
      E nenhuma alocação é gravada

      Exemplos:
        | situacao            | alunos | sentados | em_pe | mensagem                                              |
        | acima da capacidade | 6      | 3        | 3     | alocação 0: capacidade total do ônibus excedida.      |
        | assentos excedidos  | 4      | 4        | 0     | alocação 0: capacidade de assentos ou em pé excedida. |


    # AC-14, FA-002, RN-003 - Mesmo ônibus em duas rotas no mesmo turno
    @fluxo_infeliz @FA002 @RN003 @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API recusa a alocação do mesmo ônibus em duas rotas no mesmo dia e turno
      Quando o administrador envia a distribuição manual com o ônibus "ABC1D23" em duas rotas diferentes no turno da ida
      Então a API responde com o status "409 Conflict"
      E a resposta informa a mensagem "alocação 1: ônibus ABC1D23 conflitante no turno ida."
      E nenhuma alocação é gravada


    # RN-003 - O mesmo ônibus pode atender a ida e a volta
    @regra_negocio @RN003 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: API aceita o mesmo ônibus na ida e na volta da mesma rota
      Quando o administrador envia a distribuição manual com o ônibus "ABC1D23" no turno da ida e no turno da volta da rota "Rota Centro - UFC"
      Então a API responde com o status "201 Created"


    # FA-002 - Ônibus, rota ou motorista indisponíveis
    @fluxo_infeliz @FA002 @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API recusa a distribuição com <recurso> inexistente ou inativo
      Dado que <recurso> informado na distribuição manual está inexistente ou inativo
      Quando o administrador envia a distribuição manual do dia "17/11/2026"
      Então a API responde com o status "422 Unprocessable Entity"
      E a resposta informa a mensagem "<mensagem>"

      Exemplos:
        | recurso   | mensagem                                           |
        | ônibus    | alocação 0: ônibus ZZZ0Z00 inexistente ou inativo. |
        | rota      | alocação 0: rota inexistente ou inativa.           |
        | motorista | alocação 0: motorista inexistente ou inativo.      |


    # RNF-012 - Alunos que não pertencem à distribuição
    @fluxo_infeliz @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API recusa a distribuição com aluno <problema>
      Quando o administrador envia a distribuição manual do dia "17/11/2026" com um agendamento <problema>
      Então a API responde com o status "422 Unprocessable Entity"
      E a resposta informa a mensagem "<mensagem>"
      E nenhuma alocação é gravada

      Exemplos:
        | problema                       | mensagem                                              |
        | cancelado ou de outro dia      | alocação 0: agendamento 99 não está ativo nessa data. |
        | sem o turno informado          | alocação 0: agendamento 99 não usa o turno volta.     |
        | de outra rota                  | alocação 0: agendamento 99 não pertence à rota 2.     |
        | repetido na mesma distribuição | alocação 1: agendamento 99 alocado mais de uma vez.   |


    # RNF-012 - Falha não altera a distribuição anterior
    @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Distribuição inválida não altera a distribuição já confirmada do dia
      Dado que o dia "17/11/2026" já possui uma distribuição confirmada
      Quando o administrador envia uma distribuição manual inválida para o dia "17/11/2026"
      Então a API recusa a distribuição
      E a distribuição confirmada anteriormente permanece inalterada


    # RN-004 - Histórico de períodos anteriores preservado
    @regra_negocio @RN004 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: API recusa distribuir ou realocar um dia que já passou
      Dado que a data "17/11/2026" é anterior a hoje
      Quando o administrador envia a distribuição manual do dia "17/11/2026"
      Então a API responde com o status "422 Unprocessable Entity"
      E a resposta informa a mensagem "Não é possível alterar a distribuição de um dia que já passou."
      E nenhuma alocação do dia é alterada


  Regra: Somente o administrador distribui os alunos (RN-006)

    # RN-006 - Menu não exibido para outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @prioridade_alta
    Esquema do Cenário: Menu de alocação diária não é exibido para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" está autenticado no sistema
      Quando esse usuário visualiza o menu principal
      Então o menu "Alocação Diária" não é exibido

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |


    # RN-006 - API nega acesso a outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega a distribuição para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" possui um token de acesso válido
      Quando esse usuário envia uma requisição para consultar a prévia e para confirmar a distribuição
      Então a API responde com o status "403 Forbidden" em todas as requisições
      E nenhuma alocação é gravada

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |


    # RN-006 - Sem autenticação
    @fluxo_infeliz @regra_negocio @RN006 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API nega a distribuição sem token de acesso
      Quando uma requisição de confirmação da distribuição é enviada sem token de acesso
      Então a API responde com o status "401 Unauthorized"
      E nenhuma alocação é gravada
