# =================================================================================
# ÉPICO: EP-006 - Frequência e Relatórios Gerenciais
# HISTÓRIA DE USUÁRIO: HU-022 - Geração de Relatórios Quantitativos
# REQUISITOS RELACIONADOS: RF-022 (Geração de Relatórios)
# REQ. NÃO FUNCIONAIS: RNF-012 (Integridade dos Dados)
# REGRA DE NEGÓCIO: RN-004 (Preservação de Histórico), RN-006 (Exclusividade Administrativa)
# language: pt
# =================================================================================

@EP006 @HU022 @relatorios_quantitativos
Funcionalidade: Geração de Relatórios Quantitativos
  Como administrador
  Quero gerar relatórios quantitativos filtrados por dia, faculdade e localidade
  Para cruzar os dados de agendamentos com as presenças reais e analisar a quantidade efetiva de alunos que utilizam o transporte


  Regra: O administrador gera o relatório cruzando agendamentos e presenças

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa o menu "Relatórios"
      E o aplicativo possui conexão ativa com a API
      E existem agendamentos e presenças registradas entre os dias "16/11/2026" e "20/11/2026"


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-01, AC-02
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Administrador gera o relatório do período e visualiza agendados e embarques por dia e rota
      Quando o administrador define o período de "16/11/2026" a "20/11/2026"
      E aciona o botão de gerar o relatório
      Então o sistema exibe o relatório na tela
      E consolida, por dia e por rota, a quantidade de alunos agendados e a quantidade efetiva de embarques


    # AC-01 - Filtros do relatório
    @fluxo_feliz @prioridade_alta
    Esquema do Cenário: Administrador gera o relatório filtrando por <filtro>
      Dado que existem agendamentos de alunos da faculdade "UFC" e da faculdade "IFCE", dos bairros "Centro" e "Campo Velho"
      Quando o administrador define o período de "16/11/2026" a "20/11/2026"
      E informa <filtro>
      E aciona o botão de gerar o relatório
      Então o relatório considera somente os agendamentos que atendem a <filtro>

      Exemplos:
        | filtro                                |
        | a faculdade de destino "UFC"          |
        | o bairro "Centro"                     |
        | a faculdade "UFC" e o bairro "Centro" |


    # AC-02 - Somente presenças validadas contam como embarque
    @regra_negocio @prioridade_alta @depende_de_HU021
    Cenário: Sistema conta como embarque somente os alunos com o status "Presente"
      Dado que, no dia "17/11/2026", há 10 alunos agendados na rota "Rota Centro - UFC"
      E 7 estão com o status "Presente", 2 com "Falta" e 1 com "Pendente"
      Quando o administrador gera o relatório do dia "17/11/2026"
      Então o relatório informa 10 agendados e 7 embarques para a rota "Rota Centro - UFC" no dia "17/11/2026"


    # AC-09 - Taxa de comparecimento
    @fluxo_feliz @prioridade_alta @depende_de_HU021
    Esquema do Cenário: Sistema calcula a taxa de comparecimento a partir dos agendamentos e dos embarques
      Dado que o período possui <agendados> agendamentos e <embarques> embarques
      Quando o administrador gera o relatório do período
      Então o relatório informa a taxa de comparecimento de "<taxa>"

      Exemplos:
        | agendados | embarques | taxa |
        | 10        | 8         | 80%  |
        | 20        | 20        | 100% |
        | 4         | 1         | 25%  |


    # RF-022 - Quantidade de alunos por dia, faculdade e localidade
    @fluxo_feliz @prioridade_media
    Cenário: Sistema apresenta a quantidade de alunos por dia, faculdade e localidade
      Quando o administrador gera o relatório do período de "16/11/2026" a "20/11/2026"
      Então o relatório informa a quantidade de alunos por dia
      E informa a quantidade de alunos por faculdade
      E informa a quantidade de alunos por bairro


    # AC-07, AC-08 - Dias trabalhados pelos motoristas
    @fluxo_feliz @prioridade_alta @depende_de_HU017
    Cenário: Administrador visualiza os dias trabalhados e as rotas de cada motorista no período
      Dado que o motorista "Carlos Silva" foi escalado nos dias "16/11/2026", "17/11/2026" e "19/11/2026"
      E cumpriu a rota "Rota Centro - UFC" nos dias "16/11/2026" e "17/11/2026" e a rota "Rota Campo Velho - UFC" no dia "19/11/2026"
      Quando o administrador gera o relatório de motoristas do período de "16/11/2026" a "20/11/2026"
      Então o relatório informa 3 dias trabalhados para "Carlos Silva"
      E identifica os dias e as rotas em que "Carlos Silva" foi alocado


    # AC-07 - Dia com ida e volta conta como um dia trabalhado
    @regra_negocio @prioridade_media @depende_de_HU017
    Cenário: Sistema conta um único dia trabalhado quando o motorista faz a ida e a volta no mesmo dia
      Dado que o motorista "Carlos Silva" foi escalado na ida e na volta do dia "17/11/2026"
      Quando o administrador gera o relatório de motoristas do dia "17/11/2026"
      Então o relatório informa 1 dia trabalhado para "Carlos Silva"


    # RN-004 - Histórico preservado
    @regra_negocio @RN004 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Esquema do Cenário: Relatório de períodos anteriores continua exibindo o <cadastro> inativado
      Dado que o <cadastro> "<nome>" participou de agendamentos e alocações de um período anterior
      E o <cadastro> "<nome>" foi inativado
      Quando o administrador gera o relatório desse período anterior pela API
      Então o relatório continua exibindo os dados vinculados ao <cadastro> "<nome>"

      Exemplos:
        | cadastro  | nome              |
        | faculdade | UFC               |
        | rota      | Rota Centro - UFC |
        | motorista | Carlos Silva      |


    # RNF-012 - API consolida os totais dos filtros
    @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API devolve os totais de agendados e embarques consistentes com os registros do banco
      Quando o administrador gera o relatório do período de "16/11/2026" a "20/11/2026" pela API
      Então a API responde com o status "200 OK"
      E os totais de agendados e de embarques da resposta coincidem com os registros de agendamento e de presença do período


  Regra: O administrador exporta o relatório gerado

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa o menu "Relatórios"
      E gerou o relatório do período de "16/11/2026" a "20/11/2026"


    # FLUXO PRINCIPAL, AC-03 - Exportação
    @fluxo_feliz @smoke @prioridade_alta
    Esquema do Cenário: Administrador exporta o relatório no formato <formato>
      Quando o administrador aciona a exportação no formato "<formato>"
      Então o sistema gera o arquivo "<formato>" do relatório
      E o arquivo contém os mesmos filtros e totais exibidos na tela

      Exemplos:
        | formato  |
        | PDF      |
        | planilha |


  Regra: O sistema valida os filtros e informa quando não há dados

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa o menu "Relatórios"


    # FA-001, AC-04 - Filtro sem resultados
    @fluxo_infeliz @FA001 @prioridade_alta
    Cenário: Sistema informa quando os filtros não retornam nenhum dado
      Dado que não houve operação nem demanda de "01/11/2026" a "05/11/2026"
      Quando o administrador define o período de "01/11/2026" a "05/11/2026"
      E aciona o botão de gerar o relatório
      Então o sistema exibe a mensagem "Nenhum dado encontrado para os filtros informados."
      E não habilita a exportação


    # FA-002, AC-05 - Data final anterior à inicial
    @fluxo_infeliz @FA002 @validacao_campos @prioridade_alta
    Cenário: Sistema bloqueia a busca quando a data final é anterior à data inicial
      Quando o administrador define a data inicial "20/11/2026" e a data final "16/11/2026"
      E aciona o botão de gerar o relatório
      Então o sistema sinaliza o erro nos campos de data
      E bloqueia o processamento da busca até a correção


    # FA-002 - Valor-limite: mesmo dia
    @fluxo_feliz @FA002 @validacao_campos @prioridade_media
    Cenário: Sistema aceita o período com a data final igual à data inicial
      Quando o administrador define a data inicial "17/11/2026" e a data final "17/11/2026"
      E aciona o botão de gerar o relatório
      Então o sistema processa a busca para o dia "17/11/2026"


    # AC-01 - Período obrigatório
    @fluxo_infeliz @validacao_campos @prioridade_media
    Esquema do Cenário: Sistema exige a <data> para gerar o relatório
      Quando o administrador deixa a <data> sem preenchimento
      E aciona o botão de gerar o relatório
      Então o sistema destaca o campo "<campo>" como obrigatório
      E bloqueia o processamento da busca

      Exemplos:
        | data         | campo        |
        | data inicial | Data inicial |
        | data final   | Data final   |


    # FA-002 - API valida o período
    @fluxo_infeliz @FA002 @validacao_campos @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API recusa o relatório com a data final anterior à data inicial
      Quando o administrador solicita pela API o relatório com data inicial "2026-11-20" e data final "2026-11-16"
      Então a API responde com o status "422 Unprocessable Entity"
      E a resposta indica os campos de data
      E nenhum relatório é gerado


    # FA-001 - API informa a ausência de dados
    @fluxo_infeliz @FA001 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: API informa que não há dados para os filtros sem retornar erro
      Quando o administrador solicita pela API o relatório de um período sem operação
      Então a API responde com o status "200 OK"
      E a resposta informa totais zerados e a mensagem "Nenhum dado encontrado para os filtros informados."


  Regra: Somente o administrador gera relatórios (RN-006)

    # RN-006 - Menu não exibido para outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @prioridade_alta
    Esquema do Cenário: Menu de relatórios não é exibido para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" está autenticado no sistema
      Quando esse usuário visualiza o menu principal
      Então o menu "Relatórios" não é exibido

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |


    # RN-006 - API nega acesso a outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega a geração e a exportação de relatórios para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" possui um token de acesso válido
      Quando esse usuário solicita pela API a geração e a exportação de um relatório
      Então a API responde com o status "403 Forbidden" em todas as requisições
      E nenhum dado de relatório é exibido

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |


    # RN-006 - Sem autenticação
    @fluxo_infeliz @regra_negocio @RN006 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API nega a geração de relatórios sem token de acesso
      Quando uma requisição de geração de relatório é enviada sem token de acesso
      Então a API responde com o status "401 Unauthorized"
      E nenhum dado de relatório é exibido
