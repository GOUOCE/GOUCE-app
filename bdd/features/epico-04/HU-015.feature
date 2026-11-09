# =================================================================================
# ÉPICO: EP-004 - Agendamento de Transporte (Aluno)
# HISTÓRIA DE USUÁRIO: HU-015 - Consulta de Rota Complementar e Transferência
# REQUISITOS RELACIONADOS: RF-029 (Consulta de Rota Complementar)
# REQ. NÃO FUNCIONAIS: RNF-015 (Disponibilidade das Informações de Alocação)
# REGRA DE NEGÓCIO: RN-010 (Rotas Complementares)
# language: pt
# =================================================================================

@EP004 @HU015 @consulta_rota_complementar
Funcionalidade: Consulta de Rota Complementar e Transferência
  Como aluno com um agendamento ativo
  Quero consultar de forma rápida os detalhes da minha rota complementar
  Para saber exatamente o horário e o ponto de conexão necessários para realizar a transferência para o ônibus da rota principal


  Regra: O aluno consulta os dados da rota complementar do seu agendamento para realizar a transferência

    Contexto:
      Dado que o aluno "Maria Souza" está autenticado no sistema com cadastro aprovado e vínculo válido
      E existe a rota principal ativa "Rota Centro - UFC"
      E existe a rota complementar ativa "Van 2 - Bairro Novo" vinculada à rota principal "Rota Centro - UFC", com saída às "05:45" e ponto de conexão "Trevo do Bairro Novo"
      E o aluno possui um agendamento ativo para o dia "10/11/2026" com ida utilizando a rota complementar "Van 2 - Bairro Novo"
      E o aplicativo possui conexão ativa com a API


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-01, AC-02
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Aluno visualiza em "Meus Agendamentos" os dados destacados da rota complementar
      Quando o aluno acessa a área "Meus Agendamentos"
      E seleciona o agendamento do dia "10/11/2026"
      Então o sistema exibe de forma destacada a seção da rota complementar
      E a seção informa o horário de saída "05:45"
      E informa o nome da linha "Van 2 - Bairro Novo"
      E informa o ponto de conexão "Trevo do Bairro Novo"


    # Fluxo principal, passo 5 - Resumo da viagem do dia na tela inicial
    @fluxo_feliz @prioridade_alta
    Cenário: Aluno visualiza os dados da rota complementar no resumo da viagem do dia na tela inicial
      Dado que hoje é o dia "10/11/2026"
      Quando o aluno acessa a tela inicial
      Então o sistema exibe o resumo da viagem do dia
      E o resumo apresenta de forma destacada o horário de saída, o nome da linha e o ponto de conexão da rota complementar "Van 2 - Bairro Novo"


    # AC-02 - Informações suficientes para a transferência com segurança (passo 8)
    @fluxo_feliz @prioridade_alta
    Cenário: Sistema exibe a rota principal de destino junto às instruções de transferência
      Quando o aluno acessa a área "Meus Agendamentos"
      E seleciona o agendamento do dia "10/11/2026"
      Então o sistema exibe a rota complementar "Van 2 - Bairro Novo" antes da rota principal "Rota Centro - UFC"
      E o ponto de conexão "Trevo do Bairro Novo" é apresentado como o local da transferência para o ônibus da rota principal


    # AC-01 - Rota complementar por trecho
    @fluxo_feliz @prioridade_alta
    Esquema do Cenário: Sistema exibe a rota complementar apenas nos trechos em que ela foi agendada (<trechos>)
      Dado que o aluno possui um agendamento ativo para o dia "11/11/2026" com <configuracao>
      Quando o aluno acessa a área "Meus Agendamentos"
      E seleciona o agendamento do dia "11/11/2026"
      Então a seção da rota complementar é <exibicao_ida> no trecho da ida
      E a seção da rota complementar é <exibicao_volta> no trecho da volta

      Exemplos:
        | trechos           | configuracao                                 | exibicao_ida | exibicao_volta |
        | só na ida         | ida com "Van 2 - Bairro Novo" e volta direta | exibida      | ocultada       |
        | só na volta       | ida direta e volta com "Van 2 - Bairro Novo" | ocultada     | exibida        |
        | na ida e na volta | ida e volta com "Van 2 - Bairro Novo"        | exibida      | exibida        |


    # RN-010 - Veículo definido pela programação do dia
    @regra_negocio @RN010 @prioridade_media @depende_de_HU016 @depende_de_HU017
    Cenário: Sistema exibe o veículo da rota principal conforme a programação do dia
      Dado que a programação do dia "10/11/2026" define o ônibus de placa "ABC1D23" para a rota principal "Rota Centro - UFC"
      E a programação do dia "11/11/2026" define o ônibus de placa "XYZ9K87" para a mesma rota principal
      Quando o aluno consulta a rota complementar de um agendamento em cada um dos dias
      Então o sistema exibe o ônibus de placa "ABC1D23" para o dia "10/11/2026"
      E exibe o ônibus de placa "XYZ9K87" para o dia "11/11/2026"


    # RN-010 - Alteração do veículo após a alocação
    @regra_negocio @RN010 @prioridade_media @depende_de_HU016 @depende_de_HU017
    Cenário: Sistema atualiza o veículo exibido quando a programação do dia é alterada
      Dado que a programação do dia "10/11/2026" define o ônibus de placa "ABC1D23" para a rota principal "Rota Centro - UFC"
      E a programação do dia é alterada para o ônibus de placa "XYZ9K87"
      Quando o aluno acessa a área "Meus Agendamentos"
      E seleciona o agendamento do dia "10/11/2026"
      Então o sistema exibe o ônibus de placa "XYZ9K87"
      E mantém o horário e o ponto de conexão da rota complementar "Van 2 - Bairro Novo"


    # AC-01 - API informa a rota complementar de cada trecho do agendamento
    @regra_negocio @RN010 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API informa a rota complementar de cada trecho do agendamento do aluno
      Dado que o aluno possui um agendamento ativo para o dia "11/11/2026" com ida utilizando "Van 2 - Bairro Novo" e volta utilizando "Van 5 - Planalto"
      Quando o aluno consulta o detalhe do agendamento do dia "11/11/2026" pela API
      Então a API responde com o status "200 OK"
      E a resposta informa a rota complementar "Van 2 - Bairro Novo" no trecho da ida
      E informa a rota complementar "Van 5 - Planalto" no trecho da volta


    # AC-01, AC-02 - API informa os dados necessários para a transferência
    @regra_negocio @RN010 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API informa nome da linha, horário e ponto de conexão da rota complementar
      Quando o aluno consulta o detalhe do agendamento do dia "10/11/2026" pela API
      Então a API responde com o status "200 OK"
      E a resposta informa, para a rota complementar do trecho da ida, o nome da linha "Van 2 - Bairro Novo", o horário de saída "05:45" e o ponto de conexão "Trevo do Bairro Novo"


    # AC-01 - A lista de agendamentos também informa a rota complementar
    @regra_negocio @RN010 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: API informa a rota complementar na lista de "Meus agendamentos"
      Quando o aluno consulta a lista de "Meus agendamentos" pela API
      Então a API responde com o status "200 OK"
      E o agendamento do dia "10/11/2026" informa a rota complementar "Van 2 - Bairro Novo" no trecho da ida


  Regra: Trajeto direto não exibe nenhuma informação de rota complementar

    Contexto:
      Dado que o aluno "Maria Souza" está autenticado no sistema com cadastro aprovado e vínculo válido
      E existe a rota principal ativa "Rota Centro - UFC"
      E o aluno possui um agendamento ativo para o dia "10/11/2026" com ida e volta diretas, sem rota complementar
      E o aplicativo possui conexão ativa com a API


    # FA-001 (AC-03) - Aluno sem rota complementar associada
    @fluxo_infeliz @FA001 @prioridade_alta
    Cenário: Sistema oculta a seção de rota complementar quando o trajeto do aluno é direto
      Quando o aluno acessa a área "Meus Agendamentos"
      E seleciona o agendamento do dia "10/11/2026"
      Então o sistema não exibe nenhuma seção relacionada a rota complementar
      E exibe apenas as informações do ônibus e do motorista da rota principal "Rota Centro - UFC"


    # FA-001 (AC-03) - Resumo da viagem do dia sem rota complementar
    @fluxo_infeliz @FA001 @prioridade_media
    Cenário: Sistema oculta a rota complementar no resumo da viagem do dia quando o trajeto é direto
      Dado que hoje é o dia "10/11/2026"
      Quando o aluno acessa a tela inicial
      Então o resumo da viagem do dia não exibe nenhuma informação de rota complementar


    # FA-001 (AC-03) - API não inventa vínculo de rota complementar
    @fluxo_infeliz @FA001 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API não informa rota complementar para o agendamento de trajeto direto
      Quando o aluno consulta o detalhe do agendamento do dia "10/11/2026" pela API
      Então a API responde com o status "200 OK"
      E os campos de rota complementar da ida e da volta não são preenchidos


  Regra: O aluno consulta a rota complementar offline a partir dos dados sincronizados (RNF-015)

    Contexto:
      Dado que o aluno "Maria Souza" está autenticado no sistema com cadastro aprovado e vínculo válido
      E o aluno possui um agendamento ativo para o dia "10/11/2026" com ida utilizando a rota complementar "Van 2 - Bairro Novo"


    # FA-002 (AC-04) - Consulta offline com dados previamente sincronizados
    @fluxo_infeliz @FA002 @RNF015 @conectividade @prioridade_alta
    Cenário: Aluno consulta a rota complementar sem conexão a partir dos dados salvos no dispositivo
      Dado que o aluno consultou a rota complementar do agendamento do dia "10/11/2026" com conexão ativa
      E o aplicativo está sem conexão com a internet
      Quando o aluno abre o aplicativo e acessa a área "Meus Agendamentos"
      E seleciona o agendamento do dia "10/11/2026"
      Então o sistema exibe o horário de saída, o nome da linha e o ponto de conexão da rota complementar "Van 2 - Bairro Novo" a partir do cache local do dispositivo
      E informa que os dados exibidos estão salvos no dispositivo


    # FA-002 (AC-04) - Dados offline iguais aos últimos dados sincronizados
    @fluxo_infeliz @FA002 @RNF015 @conectividade @prioridade_media
    Cenário: Sistema exibe offline os mesmos dados da última sincronização
      Dado que o aluno consultou a rota complementar do agendamento do dia "10/11/2026" com conexão ativa
      E o aplicativo ficou sem conexão com a internet
      Quando o aluno seleciona o agendamento do dia "10/11/2026" em "Meus Agendamentos"
      Então os dados da rota complementar exibidos são idênticos aos da última consulta com conexão


    # FA-002 (AC-04) - Sem dados sincronizados não há o que exibir offline
    @fluxo_infeliz @FA002 @RNF015 @conectividade @prioridade_media
    Cenário: Sistema informa a indisponibilidade quando não há dados sincronizados para a consulta offline
      Dado que o aluno nunca consultou o agendamento do dia "10/11/2026" com conexão ativa neste dispositivo
      E o aplicativo está sem conexão com a internet
      Quando o aluno seleciona o agendamento do dia "10/11/2026" em "Meus Agendamentos"
      Então o sistema informa que as informações não estão disponíveis sem conexão
      E não exibe dados de rota complementar inventados ou de outro agendamento


    # FA-002 (AC-04) - Atualização dos dados ao restabelecer a conexão
    @fluxo_feliz @FA002 @RNF015 @conectividade @prioridade_media
    Cenário: Sistema atualiza os dados da rota complementar quando a conexão é restabelecida
      Dado que o aluno consultou a rota complementar do agendamento do dia "10/11/2026" com conexão ativa
      E o administrador alterou o horário de saída da rota complementar "Van 2 - Bairro Novo" para "05:50"
      E o aplicativo estava sem conexão com a internet
      Quando a conexão com a internet é restabelecida
      E o aluno seleciona o agendamento do dia "10/11/2026" em "Meus Agendamentos"
      Então o sistema exibe o horário de saída "05:50"
      E deixa de exibir o aviso de que os dados estão salvos no dispositivo


  Regra: Cada aluno consulta somente a rota complementar dos próprios agendamentos

    Contexto:
      Dado que os alunos "Maria Souza" e "João Lima" possuem cadastro aprovado e vínculo válido
      E "João Lima" possui um agendamento ativo para o dia "11/11/2026" com ida utilizando a rota complementar "Van 5 - Planalto"


    # RF-029, RNF-012 - Agendamento indisponível para o aluno autenticado
    @fluxo_infeliz @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API não informa a rota complementar de agendamento <situacao>
      Dado que "Maria Souza" está autenticada no sistema
      Quando ela consulta pela API o detalhe do agendamento <situacao>
      Então a API responde com o status "404 Not Found"
      E a resposta informa o código "RESOURCE_NOT_FOUND" e a mensagem "Agendamento não encontrado."
      E a resposta não exibe nenhum dado de rota complementar

      Exemplos:
        | situacao                         |
        | de outro aluno                   |
        | que foi cancelado                |
        | com um identificador inexistente |


    # RF-029 - Identificador inválido
    @fluxo_infeliz @validacao_campos @teste_api @nao_automatizavel_via_appium @prioridade_baixa
    Cenário: API recusa a consulta do detalhe com identificador não numérico
      Dado que "Maria Souza" está autenticada no sistema
      Quando ela consulta pela API o detalhe do agendamento com o identificador "abc"
      Então a API responde com o status "422 Unprocessable Entity"


    # RF-029 - Lista de agendamentos restrita ao próprio aluno
    @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Lista de "Meus agendamentos" não exibe a rota complementar de outro aluno
      Dado que "Maria Souza" possui um agendamento ativo para o dia "10/11/2026" com ida utilizando a rota complementar "Van 2 - Bairro Novo"
      Quando "Maria Souza" consulta a lista de "Meus agendamentos" pela API
      Então a resposta informa somente o agendamento de "Maria Souza"
      E a rota complementar "Van 5 - Planalto" de "João Lima" não é exibida


    # RF-029 - Acesso restrito a alunos com acesso regular
    @fluxo_infeliz @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega a consulta da rota complementar para o usuário "<situacao>"
      Dado que um usuário "<situacao>" possui um token de acesso válido
      Quando esse usuário consulta o detalhe de um agendamento pela API
      Então a API responde com o status "403 Forbidden"
      E a resposta não exibe nenhum dado de rota complementar

      Exemplos:
        | situacao                     |
        | Administrador                |
        | Aluno com cadastro pendente  |
        | Aluno com cadastro reprovado |
        | Aluno com vínculo vencido    |


    # RF-029 - Requisição sem autenticação
    @fluxo_infeliz @regra_negocio @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API nega a consulta da rota complementar sem token de acesso
      Quando uma requisição de consulta do detalhe de um agendamento é enviada sem token de acesso
      Então a API responde com o status "401 Unauthorized"
      E a resposta não exibe nenhum dado de rota complementar
