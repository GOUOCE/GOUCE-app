# =================================================================================
# ÉPICO: EP-003 - Gestão de Rotas e Horários
# HISTÓRIA DE USUÁRIO: HU-012 - Gerenciamento de Rotas Complementares
# REQUISITOS RELACIONADOS: RF-028 (Gerenciamento de Rotas Complementares), RF-014 (Soft Delete)
# REQ. NÃO FUNCIONAIS: RNF-012 (Integridade dos Dados), RNF-013 (Auditoria)
# REGRA DE NEGÓCIO: RN-004 (Preservação de Histórico), RN-006 (Exclusividade Administrativa), RN-010 (Rotas Complementares)
# language: pt
# =================================================================================

@EP003 @HU012 @gestao_rotas_complementares
Funcionalidade: Gerenciamento de Rotas Complementares
  Como administrador
  Quero cadastrar, visualizar, editar, inativar e reativar rotas complementares,
  definindo seus horários e pontos de conexão com as rotas principais
  Para garantir que alunos de áreas não cobertas pelo trajeto principal consigam utilizar o transporte


  Regra: O administrador mantém o cadastro de rotas complementares

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa o menu "Rotas Complementares"
      E o aplicativo possui conexão ativa com a API


    # AC-01 - Listagem de rotas complementares ativas
    # Observação: o AC-01 cita rotas ativas e inativas; o AC-09 cita visualizar inativas "quando
    # necessário". Os cenários seguem o padrão do épico 02 (ativas na listagem e inativas com a
    # chave "Mostrar inativos").
    @fluxo_feliz @prioridade_media
    Cenário: Administrador visualiza as rotas complementares ativas com horário e ponto de conexão
      Dado que existe a rota complementar ativa "Van 2 - Bairro Novo" vinculada à rota principal "Rota Centro - UFC", com saída às "06:00" e ponto de conexão "Trevo do Bairro Novo"
      E existe a rota complementar inativa "Van Antiga"
      Quando o administrador visualiza a listagem de rotas complementares
      Então o sistema exibe a rota "Van 2 - Bairro Novo" com saída às "06:00", ponto de conexão "Trevo do Bairro Novo" e rota principal "Rota Centro - UFC"
      E o sistema não exibe a rota "Van Antiga"


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-02, AC-07
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Administrador cadastra uma nova rota complementar com sucesso
      Dado que existe a rota principal ativa "Rota Centro - UFC"
      Quando o administrador seleciona "Nova Rota"
      E preenche o formulário da rota complementar com:
        | campo                    | valor                |
        | Rota Principal Vinculada | Rota Centro - UFC    |
        | Nome                     | Van 2 - Bairro Novo  |
        | Horário de saída         | 06:00                |
        | Ponto de Conexão         | Trevo do Bairro Novo |
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a listagem exibe a rota "Van 2 - Bairro Novo" vinculada à rota principal "Rota Centro - UFC"


    # FA-003 - Campos obrigatórios ausentes no cadastro (AC-08)
    @fluxo_infeliz @FA003 @validacao_campos @prioridade_alta
    Esquema do Cenário: Sistema bloqueia o cadastro quando um campo obrigatório não é preenchido
      Quando o administrador seleciona "Nova Rota"
      E deixa o campo "<campo_obrigatorio>" vazio
      E preenche os demais campos obrigatórios corretamente
      E clica no botão "Salvar"
      Então o sistema destaca o campo "<campo_obrigatorio>" como obrigatório
      E a rota complementar não é cadastrada

      Exemplos:
        | campo_obrigatorio        |
        | Nome                     |
        | Horário de saída         |
        | Ponto de Conexão         |
        | Rota Principal Vinculada |


    # FA-003 - Campos obrigatórios ausentes na edição (AC-08)
    @fluxo_infeliz @FA003 @validacao_campos @prioridade_media
    Esquema do Cenário: Sistema bloqueia a edição quando um campo obrigatório é esvaziado
      Dado que existe a rota complementar ativa "Van 2 - Bairro Novo"
      Quando o administrador seleciona a ação "Editar" para "Van 2 - Bairro Novo"
      E esvazia o campo "<campo_obrigatorio>"
      E clica no botão "Salvar"
      Então o sistema destaca o campo "<campo_obrigatorio>" como obrigatório
      E a rota complementar "Van 2 - Bairro Novo" mantém os dados originais

      Exemplos:
        | campo_obrigatorio        |
        | Nome                     |
        | Horário de saída         |
        | Ponto de Conexão         |
        | Rota Principal Vinculada |


    # FA-002 - Rota principal inativa fora das opções de seleção (AC-03)
    @fluxo_infeliz @FA002 @prioridade_alta
    Cenário: Sistema não oferece rotas principais inativas na seleção da rota complementar
      Dado que existe a rota principal ativa "Rota Centro - UFC"
      E existe a rota principal inativa "Rota Antiga"
      Quando o administrador seleciona "Nova Rota"
      E abre a seleção de rota principal vinculada
      Então o sistema exibe a rota principal "Rota Centro - UFC" como opção
      E a rota principal "Rota Antiga" não é exibida como opção


    # AC-04, AC-07 - Edição de rota complementar existente
    @fluxo_feliz @prioridade_alta
    Cenário: Administrador edita os dados de uma rota complementar existente
      Dado que existe a rota complementar ativa "Van 2 - Bairro Novo" vinculada à rota principal "Rota Centro - UFC"
      E existe a rota principal ativa "Rota Integrada"
      Quando o administrador seleciona a ação "Editar" para "Van 2 - Bairro Novo"
      E altera o campo "Nome" para "Van 3 - Bairro Novo"
      E altera o campo "Horário de saída" para "05:45"
      E altera o campo "Ponto de Conexão" para "Posto Central"
      E altera o campo "Rota Principal Vinculada" para "Rota Integrada"
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a listagem exibe a rota "Van 3 - Bairro Novo" com saída às "05:45", ponto de conexão "Posto Central" e rota principal "Rota Integrada"


    # AC-05, AC-07 - Inativação de rota complementar
    @fluxo_feliz @RF014 @prioridade_alta
    Cenário: Administrador inativa uma rota complementar sem agendamentos futuros
      Dado que existe a rota complementar ativa "Van 2 - Bairro Novo" sem alunos agendados para datas futuras
      Quando o administrador seleciona a ação "Inativar" para "Van 2 - Bairro Novo"
      E confirma a inativação
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a rota complementar "Van 2 - Bairro Novo" deixa de ser exibida na listagem de ativas


    # AC-07, AC-09 - Reativação de rota complementar
    @fluxo_feliz @RF014 @prioridade_media
    Cenário: Administrador reativa uma rota complementar previamente inativada
      Dado que existe a rota complementar inativa "Van Antiga" vinculada a uma rota principal ativa
      Quando o administrador ativa a chave "Mostrar inativos"
      E seleciona a ação "Reativar" para "Van Antiga"
      E confirma a reativação
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a rota complementar "Van Antiga" volta a ser exibida na listagem de ativas


    # FA-001 - Inativação de rota complementar com agendamentos futuros (AC-06, RNF-012)
    # Observação: o requisito não define o texto exato da mensagem; o cenário verifica que ela
    # informa que a rota possui agendamentos pendentes.
    @fluxo_infeliz @FA001 @RNF012 @prioridade_alta @depende_de_HU013
    Cenário: Sistema bloqueia a inativação de rota complementar com alunos agendados para datas futuras
      Dado que a rota complementar ativa "Van 2 - Bairro Novo" possui alunos agendados para datas futuras
      Quando o administrador tenta inativar a rota complementar "Van 2 - Bairro Novo"
      Então o sistema informa que a rota possui agendamentos pendentes
      E a rota complementar "Van 2 - Bairro Novo" permanece ativa


    # AC-09 - Visualização de registros inativos
    @fluxo_feliz @prioridade_media
    Cenário: Administrador visualiza rotas complementares inativas ao ativar "Mostrar inativos"
      Dado que existe a rota complementar inativa "Van Antiga"
      Quando o administrador ativa a chave "Mostrar inativos"
      Então o sistema exibe a rota complementar "Van Antiga" identificada como inativa


  Regra: Operações de escrita usam soft delete e ficam registradas na auditoria

    # AC-05, RF-014 - Soft delete
    @regra_negocio @RF014 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Inativação de rota complementar mantém o registro no banco de dados
      Dado que existe a rota complementar ativa "Van 2 - Bairro Novo"
      Quando o administrador inativa a rota complementar "Van 2 - Bairro Novo" pela API
      Então o registro de "Van 2 - Bairro Novo" permanece no banco de dados com status inativo


    # AC-05, RNF-013 - Auditoria de todas as operações de escrita
    # Observação: o AC-05 cita a auditoria da inativação; o fluxo principal registra toda operação
    # no log. Os cenários cobrem as quatro operações.
    @auditoria @RNF013 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Esquema do Cenário: Sistema registra no log de auditoria cada operação de escrita sobre rotas complementares
      Dado que o administrador "admin.qa@gouce.com" está autenticado no sistema
      Quando ele realiza a operação de "<operacao>" sobre uma rota complementar
      Então o log de auditoria contém o registro da operação "<operacao>"
      E o registro informa o usuário "admin.qa@gouce.com" e o timestamp da operação

      Exemplos:
        | operacao   |
        | cadastro   |
        | edição     |
        | inativação |
        | reativação |


  Regra: Rotas complementares inativas preservam o histórico e ficam indisponíveis para novos agendamentos

    # RN-004 - Preservação de histórico
    @regra_negocio @RN004 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: Inativação de rota complementar preserva os registros históricos vinculados a ela
      Dado que a rota complementar "Van 2 - Bairro Novo" possui registros de alocação e relatórios de períodos anteriores
      Quando o administrador inativa a rota complementar "Van 2 - Bairro Novo"
      Então os registros de alocação e relatórios de períodos anteriores permanecem inalterados


    # RN-010 - Rota complementar inativa fora das opções de agendamento do aluno
    # Observação: o requisito não descreve esse comportamento de forma explícita; ele decorre da
    # finalidade da rota (oferecer trajetos para o agendamento) e deve ser confirmado com o time.
    @regra_negocio @RN010 @prioridade_media @depende_de_HU013
    Cenário: Rota complementar inativa não é exibida como opção de agendamento para o aluno
      Dado que existe a rota complementar inativa "Van Antiga"
      Quando um aluno aprovado acessa o agendamento de transporte
      Então a rota complementar "Van Antiga" não é exibida como opção


  Regra: Somente o administrador gerencia rotas complementares (RN-006)

    # RN-006 - Menu não exibido para outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @prioridade_alta
    Esquema do Cenário: Menu de rotas complementares não é exibido para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" está autenticado no sistema
      Quando esse usuário visualiza o menu principal
      Então o menu "Rotas Complementares" não é exibido

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |


    # RN-006 - API nega acesso a outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega a gestão de rotas complementares para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" possui um token de acesso válido
      Quando esse usuário envia uma requisição para cadastrar uma rota complementar
      Então a API responde com o status "403 Forbidden"
      E a rota complementar não é cadastrada

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |
