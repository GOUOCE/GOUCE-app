# =================================================================================
# ÉPICO: EP-004 - Agendamento de Transporte (Aluno)
# HISTÓRIA DE USUÁRIO: HU-014 - Visualização e Cancelamento de Agendamentos (Meus Agendamentos)
# REQUISITOS RELACIONADOS: RF-016 (Consulta e Cancelamento de Agendamento)
# REQ. NÃO FUNCIONAIS: RNF-001 (Desempenho - Tempo de Resposta), RNF-012 (Integridade dos Dados)
# REGRA DE NEGÓCIO: RN-005 (Cancelamento de Agendamento)
# language: pt
# =================================================================================

@EP004 @HU014 @meus_agendamentos
Funcionalidade: Visualização e Cancelamento de Agendamentos (Meus Agendamentos)
  Como aluno
  Quero visualizar minhas viagens programadas no calendário e remover um agendamento futuro quando necessário
  Para acompanhar meu limite mensal de vagas e liberar minha vaga para a logística caso eu não vá utilizar o transporte


  Regra: O aluno acompanha seus agendamentos ativos no calendário de "Meus agendamentos"

    Contexto:
      Dado que o aluno "Maria Souza" está autenticado no sistema com cadastro aprovado e vínculo válido
      E acessa a aba "Agenda" ("Meus agendamentos")
      E o aplicativo possui conexão ativa com a API


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-01
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Aluno visualiza o calendário mensal com seus agendamentos e o contador de agendamentos ativos
      Dado que o aluno possui agendamentos ativos para os dias "10/11/2026" e "17/11/2026"
      Quando o aluno visualiza o calendário mensal
      Então o sistema exibe os dias "10/11/2026" e "17/11/2026" com o status "Agendado"
      E exibe o contador "2 de 22 agendamentos ativos"


    # AC-01 - Estados do calendário
    @fluxo_feliz @prioridade_alta
    Esquema do Cenário: Sistema destaca no calendário os dias com o status "<status>"
      Dado que, no calendário mensal, existe um dia com o status "<status>"
      Quando o aluno visualiza o calendário mensal
      Então o sistema exibe esse dia com a indicação visual própria do status "<status>"

      Exemplos:
        | status                        |
        | Agendado                      |
        | Indisponível para agendamento |
        | Feriado                       |


    # AC-01 - Contador de agendamentos ativos (valores-limite)
    @fluxo_feliz @prioridade_media
    Esquema do Cenário: Contador exibe a quantidade de agendamentos ativos do aluno
      Dado que o aluno possui <ativos> agendamentos ativos para datas futuras
      Quando o aluno visualiza o calendário mensal
      Então o sistema exibe o contador "<contador>"

      Exemplos:
        | ativos | contador                     |
        | 1      | 1 de 22 agendamentos ativos  |
        | 21     | 21 de 22 agendamentos ativos |
        | 22     | 22 de 22 agendamentos ativos |


    # AC-01 - Agendamento de ida e volta conta como um único agendamento ativo
    @regra_negocio @prioridade_media
    Cenário: Agendamento com ida e volta no mesmo dia conta como um único agendamento ativo
      Dado que o aluno possui um agendamento ativo para o dia "10/11/2026" com ida e volta
      Quando o aluno visualiza o calendário mensal
      Então o sistema exibe o contador "1 de 22 agendamentos ativos"


    # FA-001 (AC-02) - Aluno sem agendamentos futuros
    @fluxo_infeliz @FA001 @prioridade_alta
    Cenário: Sistema exibe o estado vazio quando o aluno não possui agendamentos futuros
      Dado que o aluno não possui nenhum agendamento ativo para datas futuras
      Quando o aluno acessa a aba "Agenda" ("Meus agendamentos")
      Então o sistema exibe a tela em estado vazio com a mensagem "Você ainda não possui agendamentos futuros."


    # AC-03 - Menu de opções de um dia agendado
    @fluxo_feliz @prioridade_alta
    Cenário: Aluno seleciona um dia agendado e visualiza o menu de opções
      Dado que o aluno possui um agendamento ativo para o dia "10/11/2026"
      Quando o aluno seleciona o dia "10/11/2026" no calendário
      Então o sistema exibe um menu com as opções "Ver detalhes", "Editar agendamento" e "Remover agendamento"


    # AC-01 - API lista somente os agendamentos ativos e futuros do próprio aluno
    @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API lista apenas os agendamentos ativos e futuros do aluno autenticado, ordenados por data
      Dado que "Maria Souza" possui agendamentos ativos para os dias "17/11/2026" e "10/11/2026"
      E possui um agendamento cancelado e um agendamento de data já passada
      E o aluno "João Lima" possui um agendamento ativo para o dia "11/11/2026"
      Quando "Maria Souza" consulta a lista de "Meus agendamentos" pela API
      Então a API responde com o status "200 OK"
      E a resposta lista somente os agendamentos de "10/11/2026" e "17/11/2026", nessa ordem
      E a resposta informa 2 agendamentos ativos e o limite de 22


    # AC-01 - API informa o calendário mensal com o estado de cada dia
    @regra_negocio @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: API informa o estado de cada dia do mês consultado e o contador de agendamentos ativos
      Dado que "Maria Souza" possui um agendamento ativo para o dia "10/11/2026"
      E o dia "12/11/2026" está sinalizado como feriado
      Quando "Maria Souza" consulta o calendário do mês "2026-11" pela API
      Então a API responde com o status "200 OK"
      E o dia "10/11/2026" é informado como "AGENDADO" com as opções de remover e editar habilitadas
      E o dia "12/11/2026" é informado como "FERIADO" sem a opção de agendar
      E a resposta informa 1 agendamento ativo e o limite de 22


    # AC-01 - API valida o mês consultado
    @fluxo_infeliz @validacao_campos @teste_api @nao_automatizavel_via_appium @prioridade_media
    Esquema do Cenário: API recusa a consulta do calendário com o mês "<mes>" inválido
      Quando "Maria Souza" consulta o calendário do mês "<mes>" pela API
      Então a API responde com o status "422 Unprocessable Entity"

      Exemplos:
        | mes      |
        | 2026-1   |
        | 2026-13  |
        | novembro |


  Regra: O aluno remove um agendamento futuro sem prazo mínimo de antecedência

    Contexto:
      Dado que o aluno "Maria Souza" está autenticado no sistema com cadastro aprovado e vínculo válido
      E acessa a aba "Agenda" ("Meus agendamentos")
      E o aplicativo possui conexão ativa com a API
      E o aluno possui um agendamento ativo para o dia "10/11/2026"


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-04, AC-06
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Aluno remove um agendamento futuro com sucesso
      Quando o aluno seleciona o dia "10/11/2026" no calendário
      E aciona a opção "Remover agendamento"
      E aciona o botão "Confirmar" no modal de confirmação
      Então o sistema exibe a mensagem "Agendamento cancelado com sucesso"
      E o dia "10/11/2026" deixa de ser exibido com o status "Agendado"
      E o contador de agendamentos ativos é atualizado


    # AC-04 - Conteúdo do modal de confirmação
    @fluxo_feliz @prioridade_alta
    Cenário: Sistema exibe o modal de confirmação ao acionar "Remover agendamento"
      Quando o aluno seleciona o dia "10/11/2026" no calendário
      E aciona a opção "Remover agendamento"
      Então o sistema exibe o modal com o título "Cancelar agendamento?"
      E exibe o aviso "Esta ação não poderá ser desfeita."
      E exibe os botões "Cancelar" e "Confirmar"


    # FA-002 - Desistência do cancelamento no modal
    @fluxo_infeliz @FA002 @prioridade_alta
    Cenário: Aluno desiste do cancelamento ao acionar "Cancelar" no modal
      Quando o aluno seleciona o dia "10/11/2026" no calendário
      E aciona a opção "Remover agendamento"
      E aciona o botão "Cancelar" no modal de confirmação
      Então o sistema fecha o modal
      E o agendamento do dia "10/11/2026" permanece ativo sem alterações
      E o contador de agendamentos ativos não é alterado


    # AC-06 - Contador reduzido e dia disponível novamente
    @fluxo_feliz @prioridade_media
    Cenário: Cancelamento reduz o contador de agendamentos ativos e libera o dia no calendário
      Dado que o aluno possui 22 agendamentos ativos para datas futuras
      Quando o aluno remove o agendamento do dia "10/11/2026"
      Então o sistema exibe o contador "21 de 22 agendamentos ativos"
      E o dia "10/11/2026" volta a ficar disponível para um novo agendamento


    # AC-05, RN-005 - Cancelamento sem horário limite (valor-limite)
    @fluxo_feliz @RN005 @prioridade_alta
    Esquema do Cenário: Aluno cancela o agendamento sem exigência de horário limite (<momento>)
      Dado que o aluno possui um agendamento ativo para o dia "<dia>" com saída às "06:30"
      E o horário atual é "<horario_atual>" do dia "09/11/2026"
      Quando o aluno remove o agendamento do dia "<dia>"
      Então o sistema exibe a mensagem "Agendamento cancelado com sucesso"
      E o agendamento do dia "<dia>" deixa de estar ativo

      Exemplos:
        | momento                               | dia        | horario_atual |
        | hoje, antes do horário de saída       | 09/11/2026 | 05:00         |
        | hoje, depois do horário de saída      | 09/11/2026 | 18:00         |
        | amanhã                                | 10/11/2026 | 18:00         |
        | o último dia da janela de agendamento | 08/12/2026 | 18:00         |


    # AC-06 - API cancela o agendamento futuro e informa o novo contador
    @fluxo_feliz @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API cancela o agendamento futuro e informa o estado do dia e o contador atualizado
      Dado que "Maria Souza" possui 3 agendamentos ativos para datas futuras
      Quando "Maria Souza" cancela o agendamento do dia "10/11/2026" pela API
      Então a API responde com o status "200 OK"
      E a resposta informa a mensagem "Agendamento cancelado com sucesso" e o estado do dia "DISPONIVEL"
      E a resposta informa 2 agendamentos ativos e o limite de 22
      E o agendamento deixa de constar em "Meus agendamentos"


    # AC-06, RF-014, RN-004 - Cancelamento lógico preserva o registro
    @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Cancelamento mantém o registro no banco de dados com o status "CANCELADO"
      Quando "Maria Souza" cancela o agendamento do dia "10/11/2026" pela API
      Então o registro do agendamento permanece no banco de dados com o status "CANCELADO"
      E a data do cancelamento fica preenchida
      E a data, o aluno e os trechos de ida e volta do agendamento permanecem inalterados


    # AC-06 - Alocação do aluno removida junto com o agendamento
    @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta @depende_de_HU016 @depende_de_HU018
    Cenário: Cancelamento remove a alocação do aluno no veículo para o dia
      Dado que o agendamento do dia "10/11/2026" possui o aluno alocado em um veículo para o dia
      Quando "Maria Souza" cancela o agendamento do dia "10/11/2026" pela API
      Então a alocação do aluno naquele veículo e dia é removida
      E a vaga volta a ficar disponível para o veículo
      E as alocações dos demais alunos permanecem inalteradas


    # AC-06 - Cancelamento libera o limite e permite um novo agendamento
    @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_media @depende_de_HU013
    Cenário: Cancelamento libera uma vaga do limite de 22 agendamentos ativos
      Dado que "Maria Souza" possui 22 agendamentos ativos para datas futuras
      E o agendamento do dia "10/11/2026" é cancelado
      Quando "Maria Souza" envia uma requisição para agendar novamente o dia "10/11/2026" com ida e volta válidas
      Então a API responde com o status "200 OK"
      E "Maria Souza" volta a ter 22 agendamentos ativos
      E o agendamento cancelado permanece registrado com o status "CANCELADO"


    # RNF-001 - Tempo de resposta do cancelamento
    @nao_funcional @desempenho @RNF001 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: Tempo de resposta do cancelamento não ultrapassa 3 segundos
      Dado que a conexão com a internet está em condições normais
      Quando "Maria Souza" cancela o agendamento do dia "10/11/2026" pela API
      Então a API retorna a resposta do cancelamento em até 3 segundos


  Regra: O histórico de frequência é preservado e agendamentos passados não podem ser removidos

    Contexto:
      Dado que o aluno "Maria Souza" está autenticado no sistema com cadastro aprovado e vínculo válido
      E acessa a aba "Agenda" ("Meus agendamentos")
      E o aplicativo possui conexão ativa com a API
      E hoje é o dia "09/11/2026"
      E o aluno possui um agendamento ativo para o dia "06/11/2026", que já passou


    # FA-003 (AC-07) - Opção de remover não é exibida para data passada
    @fluxo_infeliz @FA003 @prioridade_alta
    Cenário: Sistema não exibe a opção "Remover agendamento" para um agendamento de data já passada
      Quando o aluno seleciona o dia "06/11/2026" no calendário
      Então o sistema não exibe a opção "Remover agendamento"
      E o agendamento do dia "06/11/2026" permanece inalterado


    # FA-003 (AC-07) - API recusa o cancelamento de data passada
    @fluxo_infeliz @FA003 @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API recusa o cancelamento de um agendamento de data já passada
      Quando "Maria Souza" cancela o agendamento do dia "06/11/2026" pela API
      Então a API responde com o status "422 Unprocessable Entity"
      E a resposta informa o código "AGENDAMENTO_PASSADO" e a mensagem "Não é possível cancelar agendamento de data já passada."
      E o agendamento do dia "06/11/2026" permanece ativo no histórico


    # FA-003 (AC-07) - A edição não contorna a proteção do histórico
    @fluxo_infeliz @FA003 @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API recusa o cancelamento de data passada feito por edição com ida e volta desmarcadas
      Quando "Maria Souza" envia uma requisição de edição do agendamento do dia "06/11/2026" com ida e volta marcadas como não utilizadas
      Então a API responde com o status "422 Unprocessable Entity"
      E a resposta informa o código "AGENDAMENTO_PASSADO"
      E o agendamento do dia "06/11/2026" permanece inalterado


    # AC-07 - Opções de remover e editar desabilitadas para data passada
    @regra_negocio @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: API informa que o agendamento passado não pode ser removido nem editado
      Quando "Maria Souza" consulta o detalhe do agendamento do dia "06/11/2026" pela API
      Então a API responde com o status "200 OK"
      E a resposta informa que as opções de remover e de editar estão desabilitadas


  Regra: Falha na comunicação não gera cancelamento parcial

    Contexto:
      Dado que o aluno "Maria Souza" está autenticado no sistema com cadastro aprovado e vínculo válido
      E acessa a aba "Agenda" ("Meus agendamentos")
      E o aluno possui um agendamento ativo para o dia "10/11/2026"


    # FA-004 (AC-08) - Falha de comunicação com a API na confirmação
    @fluxo_infeliz @FA004 @conectividade @prioridade_alta
    Cenário: Sistema mantém o agendamento ativo quando a conexão falha na confirmação do cancelamento
      Dado que o aplicativo perde a conexão com a internet no momento da confirmação
      Quando o aluno seleciona o dia "10/11/2026" no calendário
      E aciona a opção "Remover agendamento"
      E aciona o botão "Confirmar" no modal de confirmação
      Então o sistema exibe a mensagem "Não foi possível processar o cancelamento. Verifique sua conexão e tente novamente"
      E o agendamento do dia "10/11/2026" permanece ativo
      E o contador de agendamentos ativos não é alterado


    # FA-004 (AC-08) - Nova tentativa após restabelecer a conexão
    @fluxo_infeliz @FA004 @conectividade @prioridade_media
    Cenário: Aluno conclui o cancelamento ao tentar novamente com a conexão restabelecida
      Dado que a primeira tentativa de cancelamento do dia "10/11/2026" falhou por falta de conexão
      E a conexão com a internet foi restabelecida
      Quando o aluno aciona novamente "Remover agendamento" e confirma no modal
      Então o sistema exibe a mensagem "Agendamento cancelado com sucesso"
      E o agendamento do dia "10/11/2026" deixa de estar ativo


    # FA-004 (AC-08) - O erro de leitura não é exibido como ausência de agendamentos
    @fluxo_infeliz @FA004 @conectividade @prioridade_media
    Cenário: Sistema não exibe o estado vazio quando a consulta dos agendamentos falha
      Dado que o aluno possui agendamentos ativos para datas futuras
      E o aplicativo perde a conexão com a internet antes de carregar "Meus agendamentos"
      Quando o aluno acessa a aba "Agenda" ("Meus agendamentos")
      Então o sistema exibe uma mensagem de erro orientando verificar a conexão
      E o sistema não exibe a mensagem "Você ainda não possui agendamentos futuros."


    # AC-08, RNF-012 - Falha dentro da transação não deixa cancelamento parcial
    @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Falha durante o cancelamento desfaz todas as alterações e mantém o agendamento ativo
      Dado que ocorre uma falha após a remoção da alocação e antes da conclusão do cancelamento
      Quando "Maria Souza" cancela o agendamento do dia "10/11/2026" pela API
      Então a API responde com um erro e não informa sucesso
      E o agendamento do dia "10/11/2026" permanece ativo
      E a alocação do aluno no veículo permanece inalterada
      E o contador de agendamentos ativos não é alterado


  Regra: Cada aluno acessa e cancela somente os próprios agendamentos

    Contexto:
      Dado que os alunos "Maria Souza" e "João Lima" possuem cadastro aprovado e vínculo válido
      E "João Lima" possui um agendamento ativo para o dia "11/11/2026"


    # RF-016, RNF-012 - Agendamento indisponível para o aluno autenticado
    @fluxo_infeliz @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API recusa o cancelamento de agendamento <situacao>
      Dado que "Maria Souza" está autenticada no sistema
      Quando ela cancela pela API o agendamento <situacao>
      Então a API responde com o status "404 Not Found"
      E a resposta informa o código "RESOURCE_NOT_FOUND" e a mensagem "Agendamento não encontrado."
      E nenhum agendamento é alterado

      Exemplos:
        | situacao                         |
        | de outro aluno                   |
        | que já foi cancelado             |
        | com um identificador inexistente |


    # RF-016 - Identificador inválido
    @fluxo_infeliz @validacao_campos @teste_api @nao_automatizavel_via_appium @prioridade_baixa
    Cenário: API recusa o cancelamento com identificador não numérico
      Dado que "Maria Souza" está autenticada no sistema
      Quando ela cancela pela API o agendamento com o identificador "abc"
      Então a API responde com o status "422 Unprocessable Entity"
      E nenhum agendamento é alterado


    # RF-016 - Detalhe de agendamento de outro aluno
    @fluxo_infeliz @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API não revela o detalhe do agendamento de outro aluno
      Dado que "Maria Souza" está autenticada no sistema
      Quando ela consulta pela API o detalhe do agendamento de "João Lima"
      Então a API responde com o status "404 Not Found"
      E a resposta informa a mensagem "Agendamento não encontrado."
      E a resposta não exibe nenhum dado de "João Lima"


    # RF-016 - Repetir o cancelamento não altera o contador
    @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: Repetir o cancelamento do mesmo agendamento não reduz novamente o contador
      Dado que "Maria Souza" possui 2 agendamentos ativos para datas futuras
      E cancelou um deles pela API
      Quando ela repete o cancelamento do mesmo agendamento
      Então a API responde com o status "404 Not Found"
      E "Maria Souza" continua com 1 agendamento ativo


    # RF-016 - Acesso restrito a alunos com acesso regular
    @fluxo_infeliz @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega "Meus agendamentos" para o usuário "<situacao>"
      Dado que um usuário "<situacao>" possui um token de acesso válido
      Quando esse usuário consulta "Meus agendamentos" e tenta cancelar um agendamento pela API
      Então a API responde com o status "403 Forbidden" em todas as requisições
      E nenhum agendamento é exibido ou alterado

      Exemplos:
        | situacao                     |
        | Administrador                |
        | Aluno com cadastro pendente  |
        | Aluno com cadastro reprovado |
        | Aluno com vínculo vencido    |


    # RF-016 - Requisição sem autenticação
    @fluxo_infeliz @regra_negocio @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega a requisição de <operacao> sem token de acesso
      Quando uma requisição de <operacao> é enviada sem token de acesso
      Então a API responde com o status "401 Unauthorized"
      E nenhum agendamento é exibido ou alterado

      Exemplos:
        | operacao                           |
        | consulta de "Meus agendamentos"    |
        | consulta do calendário             |
        | consulta do detalhe do agendamento |
        | cancelamento do agendamento        |
