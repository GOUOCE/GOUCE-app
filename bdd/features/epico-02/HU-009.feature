# =================================================================================
# ÉPICO: EP-002 - Gestão de Cadastros Base
# HISTÓRIA DE USUÁRIO: HU-009 - Gerenciamento de Frota (Ônibus)
# REQUISITOS RELACIONADOS: RF-008 (Gerenciamento de Frota), RF-014 (Soft Delete)
# REQ. NÃO FUNCIONAIS: RNF-012 (Integridade dos Dados), RNF-013 (Auditoria)
# REGRA DE NEGÓCIO: RN-004 (Preservação de Histórico), RN-006 (Exclusividade Administrativa)
# language: pt
# =================================================================================

@EP002 @HU009 @gestao_frota
Funcionalidade: Gerenciamento de Frota (Ônibus)
  Como administrador
  Quero cadastrar, visualizar, editar, inativar e reativar os ônibus, informando placa,
  quantidade de assentos e capacidade máxima de alunos em pé
  Para gerenciar os veículos disponíveis para o transporte universitário e seus limites de ocupação


  Regra: O administrador mantém o cadastro da frota

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa o menu "Frota"
      E o aplicativo possui conexão ativa com a API


    # AC-01 - Listagem de ônibus ativos
    @fluxo_feliz @prioridade_media
    Cenário: Administrador visualiza os ônibus ativos com seus limites de ocupação
      Dado que existe o ônibus ativo de placa "ABC1D23" com 44 assentos e capacidade para 20 alunos em pé
      E existe o ônibus inativo de placa "XYZ9K87"
      Quando o administrador visualiza a listagem da frota
      Então o sistema exibe o ônibus "ABC1D23" com 44 assentos e capacidade para 20 alunos em pé
      E o sistema não exibe o ônibus "XYZ9K87"


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-02, AC-07
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Administrador cadastra um novo ônibus com sucesso
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o formulário do ônibus com:
        | campo                      | valor   |
        | Placa                      | QXD2E45 |
        | Quantidade de assentos     | 44      |
        | Capacidade de alunos em pé | 20      |
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a listagem exibe o ônibus "QXD2E45" com 44 assentos e capacidade para 20 alunos em pé


    # AC-02, AC-03 - Placa digitada em formatos aceitos é guardada normalizada
    @fluxo_feliz @prioridade_media
    Esquema do Cenário: Sistema aceita placa em minúsculas ou com hífen e a guarda normalizada
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o formulário do ônibus com:
        | campo                      | valor            |
        | Placa                      | <placa_digitada> |
        | Quantidade de assentos     | 44               |
        | Capacidade de alunos em pé | 0                |
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a listagem exibe o ônibus "<placa_guardada>"

      Exemplos:
        | placa_digitada | placa_guardada |
        | qxd2e45        | QXD2E45        |
        | QXD-2E45       | QXD2E45        |
        | ABC-1234       | ABC1234        |


    # FA-002 - Placa duplicada no cadastro (AC-03)
    # Observação: o AC-03 considera registros ativos ou inativos; o FA-002 cita apenas ativos.
    # Os cenários seguem o AC-03, que é mais restritivo.
    @fluxo_infeliz @FA002 @prioridade_alta
    Esquema do Cenário: Sistema bloqueia o cadastro de ônibus com placa já existente
      Dado que já existe o ônibus de placa "ABC1D23" com status "<status_existente>"
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o formulário do ônibus com:
        | campo                      | valor            |
        | Placa                      | <placa_digitada> |
        | Quantidade de assentos     | 40               |
        | Capacidade de alunos em pé | 15               |
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Este veículo já está registrado."
      E o ônibus não é cadastrado

      Exemplos:
        | status_existente | placa_digitada |
        | ativo            | ABC1D23        |
        | inativo          | ABC1D23        |
        | ativo            | abc1d23        |
        | ativo            | ABC-1D23       |


    # FA-002 - Placa duplicada na edição (AC-03)
    @fluxo_infeliz @FA002 @prioridade_alta
    Cenário: Sistema bloqueia a edição de ônibus para uma placa já utilizada por outro veículo
      Dado que existem os ônibus ativos de placas "ABC1D23" e "QXD2E45"
      Quando o administrador seleciona a ação "Editar" para "QXD2E45"
      E altera o campo "Placa" para "ABC1D23"
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Este veículo já está registrado."
      E o ônibus "QXD2E45" mantém a placa original


    # FA-003 - Campos obrigatórios ausentes no cadastro (AC-08)
    @fluxo_infeliz @FA003 @validacao_campos @prioridade_alta
    Esquema do Cenário: Sistema bloqueia o cadastro quando um campo obrigatório não é preenchido
      Quando o administrador seleciona "Novo Cadastro"
      E deixa o campo "<campo_obrigatorio>" vazio
      E preenche os demais campos obrigatórios corretamente
      E clica no botão "Salvar"
      Então o sistema destaca o campo "<campo_obrigatorio>" como obrigatório
      E o ônibus não é cadastrado

      Exemplos:
        | campo_obrigatorio          |
        | Placa                      |
        | Quantidade de assentos     |
        | Capacidade de alunos em pé |


    # FA-003 - Campos obrigatórios ausentes na edição (AC-08)
    @fluxo_infeliz @FA003 @validacao_campos @prioridade_media
    Esquema do Cenário: Sistema bloqueia a edição quando um campo obrigatório é esvaziado
      Dado que existe o ônibus ativo de placa "QXD2E45" com 44 assentos e capacidade para 20 alunos em pé
      Quando o administrador seleciona a ação "Editar" para "QXD2E45"
      E esvazia o campo "<campo_obrigatorio>"
      E clica no botão "Salvar"
      Então o sistema destaca o campo "<campo_obrigatorio>" como obrigatório
      E o ônibus "QXD2E45" mantém os dados originais

      Exemplos:
        | campo_obrigatorio          |
        | Placa                      |
        | Quantidade de assentos     |
        | Capacidade de alunos em pé |


    # AC-09 - Formato da placa (Mercosul ABC1D23 ou antigo ABC1234)
    # Observação: o texto da mensagem não está definido no requisito; os cenários seguem
    # "Placa inválida." e devem ser alinhados com o time.
    @fluxo_infeliz @validacao_campos @prioridade_alta
    Esquema do Cenário: Sistema bloqueia o salvamento de ônibus com placa em formato inválido
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o formulário do ônibus com:
        | campo                      | valor            |
        | Placa                      | <placa_invalida> |
        | Quantidade de assentos     | 44               |
        | Capacidade de alunos em pé | 20               |
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Placa inválida."
      E o ônibus não é cadastrado

      Exemplos:
        | placa_invalida | motivo                       |
        | ABCDEFG        | só letras                    |
        | 1234567        | só números                   |
        | AB1234         | menos de 7 caracteres        |
        | ABC12345       | mais de 7 caracteres         |
        | A1C1D23        | formato misto fora do padrão |
        | ABC@1D2        | caractere especial           |


    # AC-10 - Valores inválidos de assentos e capacidade em pé
    # Observação: o texto da mensagem não está definido no requisito; os cenários verificam
    # que o campo é destacado como inválido e devem ser alinhados com o time.
    @fluxo_infeliz @validacao_campos @prioridade_alta
    Esquema do Cenário: Sistema bloqueia o salvamento de ônibus com quantidade inválida
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o formulário do ônibus com:
        | campo                      | valor   |
        | Placa                      | QXD2E45 |
        | Quantidade de assentos     | 44      |
        | Capacidade de alunos em pé | 20      |
      E altera o campo "<campo>" para "<valor>"
      E clica no botão "Salvar"
      Então o sistema destaca o campo "<campo>" como inválido
      E o ônibus não é cadastrado

      Exemplos:
        | campo                      | valor |
        | Quantidade de assentos     | 0     |
        | Quantidade de assentos     | -5    |
        | Quantidade de assentos     | abc   |
        | Quantidade de assentos     | 4.5   |
        | Capacidade de alunos em pé | -1    |
        | Capacidade de alunos em pé | abc   |
        | Capacidade de alunos em pé | 2.5   |


    # AC-04, AC-07 - Edição de ônibus existente
    @fluxo_feliz @prioridade_alta
    Cenário: Administrador edita os dados de um ônibus existente
      Dado que existe o ônibus ativo de placa "QXD2E45" com 44 assentos e capacidade para 20 alunos em pé
      Quando o administrador seleciona a ação "Editar" para "QXD2E45"
      E altera o campo "Quantidade de assentos" para "40"
      E altera o campo "Capacidade de alunos em pé" para "15"
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a listagem exibe o ônibus "QXD2E45" com 40 assentos e capacidade para 15 alunos em pé


    # AC-05, AC-07 - Inativação de ônibus
    @fluxo_feliz @RF014 @prioridade_alta
    Cenário: Administrador inativa um ônibus sem alocações futuras
      Dado que existe o ônibus ativo de placa "QXD2E45" sem alocações para dias futuros
      Quando o administrador seleciona a ação "Inativar" para "QXD2E45"
      E confirma a inativação
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E o ônibus "QXD2E45" deixa de ser exibido na listagem de ativos


    # AC-05, AC-07, AC-11 - Reativação de ônibus
    @fluxo_feliz @RF014 @prioridade_media
    Cenário: Administrador reativa um ônibus previamente inativado
      Dado que existe o ônibus inativo de placa "QXD2E45"
      Quando o administrador ativa a chave "Mostrar inativos"
      E seleciona a ação "Reativar" para "QXD2E45"
      E confirma a reativação
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E o ônibus "QXD2E45" volta a ser exibido na listagem de ativos


    # FA-001 - Inativação de ônibus alocado em rota futura (AC-06, RNF-012)
    @fluxo_infeliz @FA001 @RNF012 @prioridade_alta @depende_de_HU016 @depende_de_HU017
    Cenário: Sistema bloqueia a inativação de ônibus escalado para rotas em dias futuros
      Dado que o ônibus ativo de placa "ABC1D23" está escalado para realizar uma rota em um dia futuro
      Quando o administrador tenta inativar o ônibus "ABC1D23"
      Então o sistema exibe a mensagem "Este veículo possui alocações pendentes e não pode ser inativado no momento."
      E o ônibus "ABC1D23" permanece ativo


    # AC-11 - Visualização de registros inativos
    @fluxo_feliz @prioridade_media
    Cenário: Administrador visualiza ônibus inativos ao ativar "Mostrar inativos"
      Dado que existe o ônibus inativo de placa "XYZ9K87"
      Quando o administrador ativa a chave "Mostrar inativos"
      Então o sistema exibe o ônibus "XYZ9K87" identificado como inativo


  Regra: Operações de escrita usam soft delete e ficam registradas na auditoria

    # AC-05, RF-014 - Soft delete
    @regra_negocio @RF014 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Inativação de ônibus mantém o registro no banco de dados
      Dado que existe o ônibus ativo de placa "QXD2E45"
      Quando o administrador inativa o ônibus "QXD2E45" pela API
      Então o registro de "QXD2E45" permanece no banco de dados com status inativo


    # AC-12, RNF-013 - Auditoria de todas as operações de escrita
    @auditoria @RNF013 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Esquema do Cenário: Sistema registra no log de auditoria cada operação de escrita sobre ônibus
      Dado que o administrador "admin.qa@gouce.com" está autenticado no sistema
      Quando ele realiza a operação de "<operacao>" sobre um ônibus
      Então o log de auditoria contém o registro da operação "<operacao>"
      E o registro informa o usuário "admin.qa@gouce.com" e o timestamp da operação

      Exemplos:
        | operacao   |
        | cadastro   |
        | edição     |
        | inativação |
        | reativação |


  Regra: Ônibus inativos ficam indisponíveis para novas alocações

    # AC-13 - Ônibus inativo fora das opções de escalação
    @regra_negocio @prioridade_media @depende_de_HU016 @depende_de_HU017
    Cenário: Ônibus inativo não é exibido na escalação de rotas
      Dado que existe o ônibus inativo de placa "XYZ9K87"
      Quando o administrador abre a seleção de ônibus para escalar uma rota
      Então o ônibus "XYZ9K87" não é exibido como opção


    # AC-13, RN-004 - Preservação de histórico
    @regra_negocio @RN004 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: Inativação de ônibus preserva os registros históricos vinculados a ele
      Dado que o ônibus de placa "QXD2E45" possui registros de alocação e relatórios de períodos anteriores
      Quando o administrador inativa o ônibus "QXD2E45"
      Então os registros de alocação e relatórios de períodos anteriores permanecem inalterados


  Regra: Somente o administrador gerencia a frota (RN-006)

    # RN-006 - Menu não exibido para outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @prioridade_alta
    Esquema do Cenário: Menu de frota não é exibido para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" está autenticado no sistema
      Quando esse usuário visualiza o menu principal
      Então o menu "Frota" não é exibido

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |


    # RN-006 - API nega acesso a outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega a gestão da frota para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" possui um token de acesso válido
      Quando esse usuário envia uma requisição para cadastrar um ônibus
      Então a API responde com o status "403 Forbidden"
      E o ônibus não é cadastrado

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |
