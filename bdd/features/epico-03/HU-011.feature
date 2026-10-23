# =================================================================================
# ÉPICO: EP-003 - Gestão de Rotas e Horários
# HISTÓRIA DE USUÁRIO: HU-011 - Gerenciamento de Rotas Principais e Horários
# REQUISITOS RELACIONADOS: RF-012 (Definição de Rotas e Bairros), RF-013 (Gerenciamento de Horários), RF-014 (Soft Delete)
# REQ. NÃO FUNCIONAIS: RNF-012 (Integridade dos Dados), RNF-013 (Auditoria)
# REGRA DE NEGÓCIO: RN-004 (Preservação de Histórico), RN-006 (Exclusividade Administrativa)
# language: pt
# =================================================================================

@EP003 @HU011 @gestao_rotas
Funcionalidade: Gerenciamento de Rotas Principais e Horários
  Como administrador
  Quero cadastrar, visualizar, editar, inativar e reativar rotas principais e seus horários,
  vinculando os bairros de origem às faculdades de destino
  Para estruturar os trajetos e horários oficiais disponibilizados para o agendamento dos estudantes


  Regra: O administrador mantém o cadastro de rotas principais

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa o menu "Rotas"
      E o aplicativo possui conexão ativa com a API


    # AC-01 - Listagem de rotas ativas com horários
    # Observação: o AC-01 cita rotas ativas e inativas; o AC-09 cita visualizar inativas "quando
    # necessário". Os cenários seguem o padrão do épico 02 (ativas na listagem e inativas com a
    # chave "Mostrar inativos").
    @fluxo_feliz @prioridade_media
    Cenário: Administrador visualiza as rotas ativas com seus horários de saída e retorno
      Dado que existe a rota ativa "Rota Centro - UFC" com saída às "06:30" e retorno às "17:30"
      E existe a rota inativa "Rota Antiga"
      Quando o administrador visualiza a listagem de rotas
      Então o sistema exibe a rota "Rota Centro - UFC" com saída às "06:30" e retorno às "17:30"
      E o sistema não exibe a rota "Rota Antiga"


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-02, AC-07
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Administrador cadastra uma nova rota principal com sucesso
      Dado que existem o bairro ativo "Centro" e a faculdade ativa "UFC" no campus "Quixadá"
      Quando o administrador seleciona "Nova Rota"
      E preenche o formulário da rota com:
        | campo               | valor                |
        | Nome                | Rota Centro - UFC    |
        | Horário de saída    | 06:30                |
        | Horário de retorno  | 17:30                |
        | Bairros             | Centro               |
        | Faculdades da ida   | UFC - Campus Quixadá |
        | Faculdades da volta | UFC - Campus Quixadá |
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a listagem exibe a rota "Rota Centro - UFC" com saída às "06:30" e retorno às "17:30"


    # AC-02 - Rota com mais de um bairro e mais de uma faculdade
    @fluxo_feliz @prioridade_media
    Cenário: Administrador cadastra uma rota atendendo vários bairros e várias faculdades
      Dado que existem os bairros ativos "Centro" e "Campo Velho"
      E existem as faculdades ativas "UFC - Campus Quixadá" e "IFCE - Campus Quixadá"
      Quando o administrador seleciona "Nova Rota"
      E preenche o formulário da rota com:
        | campo               | valor                                       |
        | Nome                | Rota Integrada                              |
        | Horário de saída    | 06:30                                       |
        | Horário de retorno  | 17:30                                       |
        | Bairros             | Centro, Campo Velho                         |
        | Faculdades da ida   | UFC - Campus Quixadá, IFCE - Campus Quixadá |
        | Faculdades da volta | UFC - Campus Quixadá, IFCE - Campus Quixadá |
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a rota "Rota Integrada" fica vinculada aos bairros "Centro" e "Campo Velho"
      E a rota "Rota Integrada" fica vinculada às faculdades "UFC - Campus Quixadá" e "IFCE - Campus Quixadá"


    # AC-10 - Faculdades da volta independentes das faculdades da ida
    @fluxo_feliz @prioridade_alta
    Cenário: Administrador configura faculdades da volta diferentes das faculdades da ida
      Dado que existem o bairro ativo "Centro" e as faculdades ativas "UFC - Campus Quixadá" e "IFCE - Campus Quixadá"
      Quando o administrador seleciona "Nova Rota"
      E preenche o formulário da rota com:
        | campo               | valor                                       |
        | Nome                | Rota Centro - Faculdades                    |
        | Horário de saída    | 06:30                                       |
        | Horário de retorno  | 17:30                                       |
        | Bairros             | Centro                                      |
        | Faculdades da ida   | UFC - Campus Quixadá, IFCE - Campus Quixadá |
        | Faculdades da volta | UFC - Campus Quixadá                        |
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a rota "Rota Centro - Faculdades" atende na ida "UFC - Campus Quixadá" e "IFCE - Campus Quixadá"
      E a rota "Rota Centro - Faculdades" atende na volta apenas "UFC - Campus Quixadá"


    # FA-003 - Campos obrigatórios ausentes no cadastro (AC-08)
    @fluxo_infeliz @FA003 @validacao_campos @prioridade_alta
    Esquema do Cenário: Sistema bloqueia o cadastro quando um campo obrigatório não é preenchido
      Quando o administrador seleciona "Nova Rota"
      E deixa o campo "<campo_obrigatorio>" vazio
      E preenche os demais campos obrigatórios corretamente
      E clica no botão "Salvar"
      Então o sistema destaca o campo "<campo_obrigatorio>" como obrigatório
      E a rota não é cadastrada

      Exemplos:
        | campo_obrigatorio  |
        | Nome               |
        | Horário de saída   |
        | Horário de retorno |
        | Bairros            |
        | Faculdades da ida  |


    # FA-003 - Campos obrigatórios ausentes na edição (AC-08)
    @fluxo_infeliz @FA003 @validacao_campos @prioridade_media
    Esquema do Cenário: Sistema bloqueia a edição quando um campo obrigatório é esvaziado
      Dado que existe a rota ativa "Rota Centro - UFC" com saída às "06:30" e retorno às "17:30"
      Quando o administrador seleciona a ação "Editar" para "Rota Centro - UFC"
      E esvazia o campo "<campo_obrigatorio>"
      E clica no botão "Salvar"
      Então o sistema destaca o campo "<campo_obrigatorio>" como obrigatório
      E a rota "Rota Centro - UFC" mantém os dados originais

      Exemplos:
        | campo_obrigatorio  |
        | Nome               |
        | Horário de saída   |
        | Horário de retorno |
        | Bairros            |
        | Faculdades da ida  |


    # FA-002 - Entidade de base inativa fora das opções de seleção (AC-03)
    @fluxo_infeliz @FA002 @prioridade_alta
    Esquema do Cenário: Sistema não oferece bairros ou faculdades inativos na seleção da rota
      Dado que existe o <entidade> inativo "<nome>"
      Quando o administrador seleciona "Nova Rota"
      E abre a seleção de <campo>
      Então o <entidade> "<nome>" não é exibido como opção

      Exemplos:
        | entidade  | nome                  | campo               |
        | bairro    | Alto São Francisco    | bairros             |
        | faculdade | Unicatólica - Quixadá | faculdades da ida   |
        | faculdade | Unicatólica - Quixadá | faculdades da volta |


    # AC-04, AC-07 - Edição de rota existente
    @fluxo_feliz @prioridade_alta
    Cenário: Administrador edita os dados de uma rota existente
      Dado que existe a rota ativa "Rota Centro - UFC" vinculada ao bairro "Centro" e à faculdade "UFC - Campus Quixadá"
      E existe o bairro ativo "Campo Velho"
      Quando o administrador seleciona a ação "Editar" para "Rota Centro - UFC"
      E altera o campo "Nome" para "Rota Centro e Campo Velho - UFC"
      E altera o campo "Horário de saída" para "06:00"
      E altera o campo "Horário de retorno" para "18:00"
      E adiciona o bairro "Campo Velho"
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a listagem exibe a rota "Rota Centro e Campo Velho - UFC" com saída às "06:00" e retorno às "18:00"
      E a rota fica vinculada aos bairros "Centro" e "Campo Velho"


    # AC-05, AC-07 - Inativação de rota
    @fluxo_feliz @RF014 @prioridade_alta
    Cenário: Administrador inativa uma rota sem agendamentos futuros
      Dado que existe a rota ativa "Rota Centro - UFC" sem alunos agendados para datas futuras
      Quando o administrador seleciona a ação "Inativar" para "Rota Centro - UFC"
      E confirma a inativação
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a rota "Rota Centro - UFC" deixa de ser exibida na listagem de ativas


    # AC-07, AC-09 - Reativação de rota
    @fluxo_feliz @RF014 @prioridade_media
    Cenário: Administrador reativa uma rota previamente inativada
      Dado que existe a rota inativa "Rota Antiga"
      Quando o administrador ativa a chave "Mostrar inativos"
      E seleciona a ação "Reativar" para "Rota Antiga"
      E confirma a reativação
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a rota "Rota Antiga" volta a ser exibida na listagem de ativas


    # FA-001 - Inativação de rota com agendamentos futuros (AC-06, RNF-012)
    # Observação: o requisito não define o texto exato da mensagem; o cenário verifica que ela
    # informa que a rota possui agendamentos pendentes.
    @fluxo_infeliz @FA001 @RNF012 @prioridade_alta @depende_de_HU013
    Cenário: Sistema bloqueia a inativação de rota com alunos agendados para datas futuras
      Dado que a rota ativa "Rota Centro - UFC" possui alunos agendados para datas futuras
      Quando o administrador tenta inativar a rota "Rota Centro - UFC"
      Então o sistema informa que a rota possui agendamentos pendentes
      E a rota "Rota Centro - UFC" permanece ativa


    # AC-09 - Visualização de registros inativos
    @fluxo_feliz @prioridade_media
    Cenário: Administrador visualiza rotas inativas ao ativar "Mostrar inativos"
      Dado que existe a rota inativa "Rota Antiga"
      Quando o administrador ativa a chave "Mostrar inativos"
      Então o sistema exibe a rota "Rota Antiga" identificada como inativa


  Regra: Operações de escrita usam soft delete e ficam registradas na auditoria

    # AC-05, RF-014 - Soft delete
    @regra_negocio @RF014 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Inativação de rota mantém o registro no banco de dados
      Dado que existe a rota ativa "Rota Centro - UFC"
      Quando o administrador inativa a rota "Rota Centro - UFC" pela API
      Então o registro de "Rota Centro - UFC" permanece no banco de dados com status inativo


    # AC-05, RNF-013 - Auditoria de todas as operações de escrita
    # Observação: o AC-05 cita a auditoria da inativação; o fluxo principal registra toda operação
    # no log. Os cenários cobrem as quatro operações.
    @auditoria @RNF013 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Esquema do Cenário: Sistema registra no log de auditoria cada operação de escrita sobre rotas
      Dado que o administrador "admin.qa@gouce.com" está autenticado no sistema
      Quando ele realiza a operação de "<operacao>" sobre uma rota
      Então o log de auditoria contém o registro da operação "<operacao>"
      E o registro informa o usuário "admin.qa@gouce.com" e o timestamp da operação

      Exemplos:
        | operacao   |
        | cadastro   |
        | edição     |
        | inativação |
        | reativação |


  Regra: Rotas inativas ficam indisponíveis para novos agendamentos e preservam o histórico

    # RN-004 - Preservação de histórico
    @regra_negocio @RN004 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: Inativação de rota preserva os registros históricos vinculados a ela
      Dado que a rota "Rota Centro - UFC" possui registros de alocação e relatórios de períodos anteriores
      Quando o administrador inativa a rota "Rota Centro - UFC"
      Então os registros de alocação e relatórios de períodos anteriores permanecem inalterados


    # Rota inativa fora das opções de agendamento do aluno
    # Observação: o requisito não descreve esse comportamento de forma explícita; ele decorre da
    # finalidade da rota (oferecer trajetos para o agendamento) e deve ser confirmado com o time.
    @regra_negocio @prioridade_media @depende_de_HU013
    Cenário: Rota inativa não é exibida como opção de agendamento para o aluno
      Dado que existe a rota inativa "Rota Antiga"
      Quando um aluno aprovado acessa o agendamento de transporte
      Então a rota "Rota Antiga" não é exibida como opção


  Regra: Somente o administrador gerencia rotas (RN-006)

    # RN-006 - Menu não exibido para outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @prioridade_alta
    Esquema do Cenário: Menu de rotas não é exibido para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" está autenticado no sistema
      Quando esse usuário visualiza o menu principal
      Então o menu "Rotas" não é exibido

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |


    # RN-006 - API nega acesso a outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega a gestão de rotas para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" possui um token de acesso válido
      Quando esse usuário envia uma requisição para cadastrar uma rota
      Então a API responde com o status "403 Forbidden"
      E a rota não é cadastrada

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |
