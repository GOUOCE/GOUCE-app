# =================================================================================
# ÉPICO: EP-002 - Gestão de Cadastros Base
# HISTÓRIA DE USUÁRIO: HU-010 - Gerenciamento de Motoristas
# REQUISITOS RELACIONADOS: RF-009 (Gerenciamento de Motoristas), RF-014 (Soft Delete)
# REQ. NÃO FUNCIONAIS: RNF-012 (Integridade dos Dados), RNF-013 (Auditoria)
# REGRA DE NEGÓCIO: RN-004 (Preservação de Histórico), RN-006 (Exclusividade Administrativa)
# language: pt
# =================================================================================

@EP002 @HU010 @gestao_motoristas
Funcionalidade: Gerenciamento de Motoristas
  Como administrador
  Quero cadastrar, visualizar, buscar, editar, inativar e reativar motoristas
  Para gerenciar a equipe de profissionais que conduz os veículos nas rotas do transporte universitário


  Regra: O administrador mantém o cadastro de motoristas

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa a tela "Motoristas"
      E o aplicativo possui conexão ativa com a API


    # AC-01 - Listagem de motoristas ativos
    @fluxo_feliz @prioridade_media
    Cenário: Administrador visualiza a listagem de motoristas ativos com nome e telefone
      Dado que existem os motoristas ativos "José Ferreira" e "Antônio Lima"
      E existe o motorista inativo "Raimundo Costa"
      Quando o administrador visualiza a listagem de motoristas
      Então o sistema exibe "José Ferreira" e "Antônio Lima" com nome e telefone
      E o sistema não exibe "Raimundo Costa" na listagem de ativos


    # AC-01 - Busca por nome
    @fluxo_feliz @prioridade_media
    Cenário: Administrador filtra a listagem de motoristas pelo nome
      Dado que existem os motoristas ativos "José Ferreira" e "Antônio Lima"
      Quando o administrador digita "José" na barra de pesquisa "Buscar por nome"
      Então o sistema exibe apenas o motorista "José Ferreira"


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-02, AC-07
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Administrador cadastra um novo motorista com sucesso
      Quando o administrador clica em "+ Novo"
      E preenche o campo "Nome Completo" com "Francisco Alves"
      E preenche o campo "Telefone" com "(88) 99811-2233"
      E clica no botão "Finalizar cadastro"
      Então o sistema exibe uma notificação de confirmação
      E a listagem exibe o motorista "Francisco Alves" com o telefone "(88) 99811-2233"


    # AC-02, AC-10 - Telefone fixo (motorista do interior pode ter só fixo) ou celular, com ou sem máscara
    @fluxo_feliz @prioridade_media
    Esquema do Cenário: Sistema aceita telefone celular ou fixo, com ou sem máscara
      Quando o administrador clica em "+ Novo"
      E preenche o campo "Nome Completo" com "Francisco Alves"
      E preenche o campo "Telefone" com "<telefone_digitado>"
      E clica no botão "Finalizar cadastro"
      Então o sistema exibe uma notificação de confirmação
      E a listagem exibe o motorista "Francisco Alves"

      Exemplos:
        | telefone_digitado |
        | (88) 99811-2233  |
        | 88998112233       |
        | (88) 3412-5566    |


    # AC-02, AC-03 - Homônimos: só o telefone é único
    @fluxo_feliz @prioridade_media
    Cenário: Administrador cadastra um motorista com o mesmo nome de outro e telefone diferente
      Dado que existe o motorista ativo "José Ferreira" com o telefone "(88) 99811-2233"
      Quando o administrador clica em "+ Novo"
      E preenche o campo "Nome Completo" com "José Ferreira"
      E preenche o campo "Telefone" com "(88) 99700-4455"
      E clica no botão "Finalizar cadastro"
      Então o sistema exibe uma notificação de confirmação
      E a listagem exibe dois motoristas com o nome "José Ferreira"


    # FA-002 - Telefone duplicado no cadastro (AC-03)
    # O telefone é o identificador único do motorista; o cadastro não tem CNH (decisão do PO na #207, item 1)
    @fluxo_infeliz @FA002 @prioridade_alta
    Esquema do Cenário: Sistema bloqueia o cadastro de motorista com telefone já existente
      Dado que já existe um motorista com o telefone "(88) 99811-2233" e status "<status_existente>"
      Quando o administrador clica em "+ Novo"
      E preenche o campo "Nome Completo" com "Francisco Alves Filho"
      E preenche o campo "Telefone" com "<telefone_digitado>"
      E clica no botão "Finalizar cadastro"
      Então o sistema exibe a mensagem "Este profissional já está registrado."
      E o motorista não é cadastrado

      Exemplos:
        | status_existente | telefone_digitado |
        | ativo            | (88) 99811-2233  |
        | inativo          | (88) 99811-2233  |
        | ativo            | 88998112233       |


    # FA-002 - Telefone duplicado na edição (AC-03)
    @fluxo_infeliz @FA002 @prioridade_alta
    Cenário: Sistema bloqueia a edição de motorista para um telefone já utilizado por outro
      Dado que existem os motoristas ativos "José Ferreira" com o telefone "(88) 99811-2233" e "Antônio Lima" com o telefone "(88) 99700-4455"
      Quando o administrador seleciona a ação "Editar" para "Antônio Lima"
      E altera o campo "Telefone" para "(88) 99811-2233" na tela "Editar Motorista"
      E clica no botão "Salvar alterações"
      Então o sistema exibe a mensagem "Este profissional já está registrado."
      E o motorista "Antônio Lima" mantém o telefone original


    # FA-003 - Campos obrigatórios ausentes no cadastro (AC-08)
    @fluxo_infeliz @FA003 @validacao_campos @prioridade_alta
    Esquema do Cenário: Sistema bloqueia o cadastro quando um campo obrigatório não é preenchido
      Quando o administrador clica em "+ Novo"
      E deixa o campo "<campo_obrigatorio>" vazio
      E preenche os demais campos obrigatórios corretamente
      E clica no botão "Finalizar cadastro"
      Então o sistema destaca o campo "<campo_obrigatorio>" como obrigatório
      E o motorista não é cadastrado

      Exemplos:
        | campo_obrigatorio |
        | Nome Completo     |
        | Telefone          |


    # FA-003 - Campos obrigatórios ausentes na edição (AC-08)
    @fluxo_infeliz @FA003 @validacao_campos @prioridade_media
    Esquema do Cenário: Sistema bloqueia a edição quando um campo obrigatório é esvaziado
      Dado que existe o motorista ativo "Francisco Alves"
      Quando o administrador seleciona a ação "Editar" para "Francisco Alves"
      E esvazia o campo "<campo_obrigatorio>" na tela "Editar Motorista"
      E clica no botão "Salvar alterações"
      Então o sistema destaca o campo "<campo_obrigatorio>" como obrigatório
      E o motorista "Francisco Alves" mantém os dados originais

      Exemplos:
        | campo_obrigatorio |
        | Nome Completo     |
        | Telefone          |


    # AC-10 - Formato do telefone (DDD + 8 dígitos de fixo ou 9 de celular)
    # A mensagem "Informe um telefone válido com DDD" está definida no critério 10.
    @fluxo_infeliz @validacao_campos @prioridade_alta
    Esquema do Cenário: Sistema bloqueia o salvamento de motorista com telefone incompleto
      Quando o administrador clica em "+ Novo"
      E preenche o campo "Nome Completo" com "Francisco Alves"
      E preenche o campo "Telefone" com "<telefone_invalido>"
      E clica no botão "Finalizar cadastro"
      Então o sistema exibe a mensagem "Informe um telefone válido com DDD"
      E o motorista não é cadastrado

      Exemplos:
        | telefone_invalido | motivo         |
        | 123               | poucos dígitos |
        | 998112233         | sem DDD        |


    # AC-10 - Máscara e limitador do campo Telefone
    @fluxo_feliz @validacao_campos @prioridade_media
    Esquema do Cenário: Campo Telefone aceita apenas números, aplica a máscara e limita a 11 dígitos
      Quando o administrador clica em "+ Novo"
      E digita "<digitado>" no campo "Telefone"
      Então o campo "Telefone" exibe "<exibido>"

      Exemplos:
        | digitado           | exibido         | motivo                                  |
        | 88998112233        | (88) 99811-2233 | celular com máscara                     |
        | 8834125566         | (88) 3412-5566  | fixo com máscara                        |
        | abc88998112233     | (88) 99811-2233 | letras não entram no campo              |
        | 88 99811-22😀33    | (88) 99811-2233 | emoji e símbolos não entram no campo    |
        | 889981122334455    | (88) 99811-2233 | o 12º dígito em diante não entra        |


    # AC-10 - A API recusa telefone fora do formato
    @fluxo_infeliz @validacao_campos @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API recusa telefone com letras ou fora de 10 e 11 dígitos
      Quando o administrador envia uma requisição para cadastrar um motorista com o telefone "<telefone_invalido>"
      Então a API responde com o status "422 Unprocessable Entity"
      E a mensagem informa "Informe um telefone válido com DDD"
      E o motorista não é cadastrado

      Exemplos:
        | telefone_invalido | motivo                  |
        | 123               | poucos dígitos          |
        | 998112233         | sem DDD                 |
        | 889981122334      | 12 dígitos              |
        | 889981122334455   | 15 dígitos              |
        | abcdefghijk       | somente letras          |
        | (88) abcdef       | letras depois do DDD    |


    # AC-13 - Caracteres permitidos no Nome Completo
    @fluxo_infeliz @validacao_campos @prioridade_media
    Esquema do Cenário: Sistema bloqueia Nome Completo com caracteres não permitidos
      Quando o administrador clica em "+ Novo"
      E preenche o campo "Nome Completo" com "<nome>"
      E preenche o campo "Telefone" com "88998112233"
      E clica no botão "Finalizar cadastro"
      Então o sistema exibe a mensagem "Use apenas letras, espaços, hífen ou apóstrofo"
      E o motorista não é cadastrado

      Exemplos:
        | nome             | motivo            |
        | Francisco 😀     | emoji             |
        | Francisco @#$%   | símbolos          |
        | Francisco Alves2 | número no nome    |
        | 333333333333     | somente números   |


    # AC-13 - Nome e sobrenome
    @fluxo_infeliz @validacao_campos @prioridade_media
    Cenário: Sistema bloqueia Nome Completo com uma única palavra
      Quando o administrador clica em "+ Novo"
      E preenche o campo "Nome Completo" com "Francisco"
      E preenche o campo "Telefone" com "88998112233"
      E clica no botão "Finalizar cadastro"
      Então o sistema exibe a mensagem "Informe nome e sobrenome completos"
      E o motorista não é cadastrado


    # AC-13 - Letras acentuadas, hífen e apóstrofo são aceitos
    @fluxo_feliz @validacao_campos @prioridade_media
    Esquema do Cenário: Administrador cadastra motorista com acento, hífen ou apóstrofo no nome
      Quando o administrador clica em "+ Novo"
      E preenche o campo "Nome Completo" com "<nome>"
      E preenche o campo "Telefone" com "88998112233"
      E clica no botão "Finalizar cadastro"
      Então o sistema exibe uma notificação de confirmação
      E a listagem exibe o motorista "<nome>"

      Exemplos:
        | nome              |
        | João D'Ávila      |
        | Ana-Clara Souza   |
        | José da Conceição |


    # AC-13 - Tamanho mínimo e máximo do Nome Completo
    @fluxo_infeliz @validacao_campos @prioridade_media
    Esquema do Cenário: Sistema bloqueia Nome Completo fora do tamanho permitido
      Quando o administrador clica em "+ Novo"
      E preenche o campo "Nome Completo" com <valor>
      E preenche o campo "Telefone" com "88998112233"
      E clica no botão "Finalizar cadastro"
      Então o sistema exibe a mensagem "<mensagem>"
      E o motorista não é cadastrado

      Exemplos:
        | valor                       | mensagem                                              |
        | "Jo"                        | Informe o nome completo com pelo menos 3 caracteres   |
        | um texto de 151 caracteres  | O nome deve ter no máximo 150 caracteres              |


    # AC-13 - A API aplica a mesma regra de caracteres do Nome Completo
    @fluxo_infeliz @validacao_campos @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API recusa Nome Completo com caracteres não permitidos
      Quando o administrador envia uma requisição para cadastrar um motorista com o nome "<nome>"
      Então a API responde com o status "422 Unprocessable Entity"
      E o motorista não é cadastrado

      Exemplos:
        | nome             |
        | Francisco 😀     |
        | Francisco @#$%   |
        | 333333333333     |


    # AC-04, AC-07 - Edição de motorista existente
    @fluxo_feliz @prioridade_alta
    Cenário: Administrador edita os dados de um motorista existente
      Dado que existe o motorista ativo "Francisco Alves"
      Quando o administrador seleciona a ação "Editar" para "Francisco Alves"
      E altera o campo "Telefone" para "(88) 99700-4455" na tela "Editar Motorista"
      E clica no botão "Salvar alterações"
      Então o sistema exibe uma notificação de confirmação
      E a listagem exibe "Francisco Alves" com o telefone "(88) 99700-4455"


    # AC-05, AC-07 - Inativação de motorista
    @fluxo_feliz @RF014 @prioridade_alta
    Cenário: Administrador inativa um motorista sem alocações futuras
      Dado que existe o motorista ativo "Francisco Alves" sem alocações para dias futuros
      Quando o administrador seleciona a ação "Inativar" para "Francisco Alves"
      E confirma a inativação no modal de confirmação
      Então o sistema exibe uma notificação de confirmação
      E o motorista "Francisco Alves" deixa de ser exibido na listagem de ativos


    # AC-05 - Cancelamento da inativação no modal
    @fluxo_infeliz @prioridade_media
    Cenário: Motorista permanece ativo quando o administrador cancela a inativação
      Dado que existe o motorista ativo "Francisco Alves"
      Quando o administrador seleciona a ação "Inativar" para "Francisco Alves"
      E cancela a operação no modal de confirmação
      Então o motorista "Francisco Alves" permanece ativo


    # AC-05, AC-07, AC-09 - Reativação de motorista
    @fluxo_feliz @RF014 @prioridade_media
    Cenário: Administrador reativa um motorista previamente inativado
      Dado que existe o motorista inativo "Raimundo Costa"
      Quando o administrador ativa a chave "Mostrar inativos"
      E seleciona a ação "Reativar" para "Raimundo Costa"
      E confirma a reativação
      Então o sistema exibe uma notificação de confirmação
      E o motorista "Raimundo Costa" volta a ser exibido na listagem de ativos


    # FA-001 - Inativação de motorista com alocação futura (AC-06, RNF-012)
    @fluxo_infeliz @FA001 @RNF012 @prioridade_alta @depende_de_HU017
    Cenário: Sistema bloqueia a inativação de motorista escalado para rotas em dias futuros
      Dado que o motorista ativo "José Ferreira" está escalado para realizar uma rota em um dia futuro
      Quando o administrador tenta inativar o motorista "José Ferreira"
      Então o sistema exibe a mensagem "Este profissional possui alocações pendentes e não pode ser inativado no momento."
      E o motorista "José Ferreira" permanece ativo


    # AC-09 - Visualização de registros inativos
    @fluxo_feliz @prioridade_media
    Cenário: Administrador visualiza os motoristas inativos ao ativar "Mostrar inativos"
      Dado que existe o motorista inativo "Raimundo Costa"
      Quando o administrador ativa a chave "Mostrar inativos"
      Então o sistema exibe a seção "Inativos" na listagem
      E o motorista "Raimundo Costa" aparece na seção "Inativos"


  Regra: Operações de escrita usam soft delete e ficam registradas na auditoria

    # AC-05, RF-014 - Soft delete
    @regra_negocio @RF014 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Inativação de motorista mantém o registro no banco de dados
      Dado que existe o motorista ativo "Francisco Alves"
      Quando o administrador inativa o motorista "Francisco Alves" pela API
      Então o registro de "Francisco Alves" permanece no banco de dados com status inativo


    # AC-11, RNF-013 - Auditoria de todas as operações de escrita
    @auditoria @RNF013 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Esquema do Cenário: Sistema registra no log de auditoria cada operação de escrita sobre motoristas
      Dado que o administrador "admin.qa@gouce.com" está autenticado no sistema
      Quando ele realiza a operação de "<operacao>" sobre um motorista
      Então o log de auditoria contém o registro da operação "<operacao>"
      E o registro informa o usuário "admin.qa@gouce.com" e o timestamp da operação

      Exemplos:
        | operacao   |
        | cadastro   |
        | edição     |
        | inativação |
        | reativação |


    # AC-05, AC-11 - Cancelamento no modal não gera auditoria
    @auditoria @RNF013 @teste_api @nao_automatizavel_via_appium @prioridade_baixa
    Cenário: Cancelar a inativação no modal não gera registro de auditoria
      Dado que existe o motorista ativo "Francisco Alves"
      Quando o administrador seleciona a ação "Inativar" para "Francisco Alves"
      E cancela a operação no modal de confirmação
      Então nenhum registro de auditoria é gerado


  Regra: Motoristas inativos ficam indisponíveis para novas alocações

    # AC-12 - Motorista inativo fora das opções de escalação
    @regra_negocio @prioridade_media @depende_de_HU017
    Cenário: Motorista inativo não é exibido na escalação de rotas
      Dado que existe o motorista inativo "Raimundo Costa"
      Quando o administrador abre a seleção de motorista para escalar uma rota
      Então o motorista "Raimundo Costa" não é exibido como opção


    # AC-12, RN-004 - Preservação de histórico
    @regra_negocio @RN004 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: Inativação de motorista preserva os registros históricos vinculados a ele
      Dado que o motorista "Francisco Alves" possui registros de alocação e relatórios de períodos anteriores
      Quando o administrador inativa o motorista "Francisco Alves"
      Então os registros de alocação e relatórios de períodos anteriores permanecem inalterados


  Regra: Somente o administrador gerencia motoristas (RN-006)

    # RN-006 - Tela não exibida para outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @prioridade_alta
    Esquema do Cenário: Tela de motoristas não é exibida para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" está autenticado no sistema
      Quando esse usuário visualiza o menu principal
      Então a opção "Motoristas" não é exibida

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |


    # RN-006 - API nega acesso a outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega a gestão de motoristas para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" possui um token de acesso válido
      Quando esse usuário envia uma requisição para cadastrar um motorista
      Então a API responde com o status "403 Forbidden"
      E o motorista não é cadastrado

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |
