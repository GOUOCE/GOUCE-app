# =================================================================================
# ÉPICO: EP-002 - Gestão de Cadastros Base
# HISTÓRIA DE USUÁRIO: HU-007 - Gerenciamento de Bairros/Pontos de Parada
# REQUISITOS RELACIONADOS: RF-011 (Bairros e Pontos), RF-014 (Soft Delete)
# REQ. NÃO FUNCIONAIS: RNF-012 (Integridade dos Dados), RNF-013 (Auditoria)
# REGRA DE NEGÓCIO: RN-004 (Preservação de Histórico), RN-006 (Exclusividade Administrativa)
# language: pt
# =================================================================================

@EP002 @HU007 @gestao_bairros
Funcionalidade: Gerenciamento de Bairros e Pontos de Parada
  Como administrador
  Quero cadastrar, visualizar, editar, inativar e reativar bairros e seus pontos de parada
  Para estruturar a base geográfica de embarque e desembarque dos estudantes


  Regra: O administrador mantém o cadastro de bairros e pontos de parada

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa o menu "Bairros e Pontos de Parada"
      E o aplicativo possui conexão ativa com a API


    # AC-01 - Listagem de bairros ativos com seus pontos de parada
    @fluxo_feliz @prioridade_media
    Cenário: Administrador visualiza os bairros ativos com seus pontos de parada
      Dado que existe o bairro ativo "Centro" com os pontos de parada "Praça José de Barros" e "Mercado Público"
      E existe o bairro inativo "Alto São Francisco"
      Quando o administrador visualiza a listagem de bairros
      Então o sistema exibe o bairro "Centro" com os pontos de parada "Praça José de Barros" e "Mercado Público"
      E o sistema não exibe o bairro "Alto São Francisco"


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-02, AC-07
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Administrador cadastra um novo bairro com ponto de parada
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o campo "Nome do bairro" com "Campo Velho"
      E adiciona o ponto de parada "Escola Coronel Virgílio Távora"
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a listagem exibe o bairro "Campo Velho" com o ponto de parada "Escola Coronel Virgílio Távora"


    # AC-02 - Mesmo nome de ponto de parada em bairros diferentes
    @fluxo_feliz @prioridade_media
    Cenário: Administrador cadastra um ponto de parada com nome já usado em outro bairro
      Dado que existe o bairro ativo "Centro" com o ponto de parada "Posto de Saúde"
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o campo "Nome do bairro" com "Planalto Universitário"
      E adiciona o ponto de parada "Posto de Saúde"
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a listagem exibe o bairro "Planalto Universitário" com o ponto de parada "Posto de Saúde"


    # FA-002 - Bairro duplicado no cadastro (AC-03)
    @fluxo_infeliz @FA002 @prioridade_alta
    Esquema do Cenário: Sistema bloqueia o cadastro de bairro com nome já existente
      Dado que já existe o bairro "Centro" com status "<status_existente>"
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o campo "Nome do bairro" com "<nome_digitado>"
      E adiciona o ponto de parada "Rodoviária"
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Esta localidade já está cadastrada."
      E o bairro não é cadastrado

      Exemplos:
        | status_existente | nome_digitado |
        | ativo            | Centro        |
        | inativo          | Centro        |
        | ativo            | centro        |
        | ativo            | CENTRO        |


    # FA-002 - Bairro duplicado na edição (AC-03)
    @fluxo_infeliz @FA002 @prioridade_alta
    Cenário: Sistema bloqueia a edição de bairro para um nome já utilizado por outro bairro
      Dado que existem os bairros ativos "Centro" e "Campo Velho"
      Quando o administrador seleciona a ação "Editar" para "Campo Velho"
      E altera o campo "Nome do bairro" para "Centro"
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Esta localidade já está cadastrada."
      E o bairro "Campo Velho" mantém o nome original


    # FA-002 - Ponto de parada duplicado no mesmo bairro (AC-03)
    @fluxo_infeliz @FA002 @prioridade_alta
    Esquema do Cenário: Sistema bloqueia ponto de parada com nome já existente no mesmo bairro
      Dado que o bairro "Centro" possui o ponto de parada "Mercado Público" com status "<status_existente>"
      Quando o administrador seleciona a ação "Editar" para "Centro"
      E adiciona o ponto de parada "Mercado Público"
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Esta localidade já está cadastrada."
      E o ponto de parada não é adicionado

      Exemplos:
        | status_existente |
        | ativo            |
        | inativo          |


    # FA-003 - Campos obrigatórios ausentes no cadastro (AC-08)
    @fluxo_infeliz @FA003 @validacao_campos @prioridade_alta
    Esquema do Cenário: Sistema bloqueia o cadastro quando um campo obrigatório não é preenchido
      Quando o administrador seleciona "Novo Cadastro"
      E deixa o campo "<campo_obrigatorio>" vazio
      E preenche os demais campos obrigatórios corretamente
      E clica no botão "Salvar"
      Então o sistema destaca o campo "<campo_obrigatorio>" como obrigatório
      E o bairro não é cadastrado

      Exemplos:
        | campo_obrigatorio |
        | Nome do bairro    |
        | Ponto de parada   |


    # AC-12 - Caracteres permitidos no nome do bairro
    @fluxo_infeliz @validacao_campos @prioridade_media
    Esquema do Cenário: Sistema bloqueia nome de bairro com caracteres não permitidos
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o nome do bairro com "<nome>"
      E adiciona o ponto de parada "Praça José de Barros"
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Use apenas letras, espaços, hífen ou apóstrofo"
      E o bairro não é cadastrado

      Exemplos:
        | nome         |
        | Centro 2     |
        | Centro 😀    |
        | Centro @#$%  |


    # AC-12 - Caracteres permitidos no nome do ponto de parada
    @fluxo_infeliz @validacao_campos @prioridade_media
    Esquema do Cenário: Sistema bloqueia nome de ponto de parada com caracteres não permitidos
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o nome do bairro com "Campo Velho"
      E adiciona o ponto de parada "<ponto>"
      Então o sistema exibe a mensagem "Use apenas letras, números, espaços, hífen, apóstrofo ou ponto"
      E o ponto de parada não é adicionado

      Exemplos:
        | ponto         |
        | Escola 😀     |
        | Posto @#$%    |


    # AC-12 - Tamanho mínimo do nome do bairro
    @fluxo_infeliz @validacao_campos @prioridade_media
    Cenário: Sistema bloqueia nome de bairro com menos de 3 caracteres
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o nome do bairro com "Ab"
      E adiciona o ponto de parada "Praça José de Barros"
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Informe o nome do bairro com pelo menos 3 caracteres"
      E o bairro não é cadastrado


    # AC-12 - Tamanho mínimo do nome do ponto de parada
    @fluxo_infeliz @validacao_campos @prioridade_media
    Cenário: Sistema bloqueia nome de ponto de parada com menos de 2 caracteres
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o nome do bairro com "Campo Velho"
      E adiciona o ponto de parada "A"
      Então o sistema exibe a mensagem "Informe um nome válido com pelo menos 2 caracteres."
      E o ponto de parada não é adicionado


    # AC-12 - Números são aceitos no nome do ponto de parada
    @fluxo_feliz @validacao_campos @prioridade_media
    Cenário: Administrador cadastra ponto de parada com número no nome
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o nome do bairro com "Campo Velho"
      E adiciona o ponto de parada "Parada 12"
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a listagem exibe o bairro "Campo Velho" com o ponto de parada "Parada 12"


    # FA-003 - Bairro sem ponto de parada ativo na edição (AC-08)
    @fluxo_infeliz @FA003 @validacao_campos @prioridade_alta
    Esquema do Cenário: Sistema impede que o bairro fique sem ponto de parada ativo
      Dado que existe o bairro ativo "Campo Velho" com apenas o ponto de parada "Escola Coronel Virgílio Távora"
      Quando o administrador seleciona a ação "Editar" para "Campo Velho"
      E <acao> o ponto de parada "Escola Coronel Virgílio Távora"
      E clica no botão "Salvar"
      Então o sistema destaca o campo "Ponto de parada" como obrigatório
      E o ponto de parada "Escola Coronel Virgílio Távora" permanece ativo

      Exemplos:
        | acao    |
        | remove  |
        | inativa |


    # AC-04, AC-07 - Edição de bairro existente
    @fluxo_feliz @prioridade_alta
    Cenário: Administrador edita o nome e os pontos de parada de um bairro existente
      Dado que existe o bairro ativo "Campo Velho" com o ponto de parada "Escola Coronel Virgílio Távora"
      Quando o administrador seleciona a ação "Editar" para "Campo Velho"
      E altera o campo "Nome do bairro" para "Campo Velho II"
      E adiciona o ponto de parada "Posto de Saúde"
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a listagem exibe o bairro "Campo Velho II" com os pontos de parada "Escola Coronel Virgílio Távora" e "Posto de Saúde"


    # AC-05, AC-07 - Inativação de bairro
    @fluxo_feliz @RF014 @prioridade_alta
    Cenário: Administrador inativa um bairro sem vínculo com rota ativa
      Dado que existe o bairro ativo "Campo Velho" sem vínculo com rota ativa
      Quando o administrador seleciona a ação "Inativar" para "Campo Velho"
      E confirma a inativação
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E o bairro "Campo Velho" deixa de ser exibido na listagem de ativos


    # AC-04, AC-05 - Inativação de um ponto de parada individual
    @fluxo_feliz @RF014 @prioridade_media
    Cenário: Administrador inativa um ponto de parada mantendo o bairro ativo
      Dado que existe o bairro ativo "Centro" com os pontos de parada "Praça José de Barros" e "Mercado Público"
      E o ponto de parada "Mercado Público" não pertence a uma rota ativa
      Quando o administrador seleciona a ação "Editar" para "Centro"
      E inativa o ponto de parada "Mercado Público"
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a listagem exibe o bairro "Centro" apenas com o ponto de parada "Praça José de Barros"


    # AC-05, AC-07, AC-09 - Reativação de bairro
    @fluxo_feliz @RF014 @prioridade_media
    Cenário: Administrador reativa um bairro previamente inativado
      Dado que existe o bairro inativo "Campo Velho"
      Quando o administrador ativa a chave "Mostrar inativos"
      E seleciona a ação "Reativar" para "Campo Velho"
      E confirma a reativação
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E o bairro "Campo Velho" volta a ser exibido na listagem de ativos


    # FA-001 - Inativação de bairro ou ponto vinculado a rota ativa (AC-06, RNF-012)
    @fluxo_infeliz @FA001 @RNF012 @prioridade_alta @depende_de_HU011
    Esquema do Cenário: Sistema bloqueia a inativação de bairro ou ponto de parada vinculado a uma rota ativa
      Dado que o <tipo> "<nome>" pertence a uma rota ativa
      Quando o administrador tenta inativar o <tipo> "<nome>"
      Então o sistema exibe a mensagem "<mensagem>"
      E o <tipo> "<nome>" permanece ativo

      Exemplos:
        | tipo             | nome            | mensagem                                                                                                          |
        | bairro           | Centro          | Este bairro não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar.          |
        | ponto de parada  | Mercado Público | Este ponto de parada não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar. |


    # AC-09 - Visualização de registros inativos
    @fluxo_feliz @prioridade_media
    Cenário: Administrador visualiza bairros e pontos de parada inativos ao ativar "Mostrar inativos"
      Dado que existe o bairro inativo "Alto São Francisco"
      E o bairro ativo "Centro" possui o ponto de parada inativo "Mercado Público"
      Quando o administrador ativa a chave "Mostrar inativos"
      Então o sistema exibe o bairro "Alto São Francisco" identificado como inativo
      E o sistema exibe o ponto de parada "Mercado Público" identificado como inativo


  Regra: Operações de escrita usam soft delete e ficam registradas na auditoria

    # AC-05, RF-014 - Soft delete
    @regra_negocio @RF014 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Inativação de bairro mantém o registro no banco de dados
      Dado que existe o bairro ativo "Campo Velho"
      Quando o administrador inativa o bairro "Campo Velho" pela API
      Então o registro de "Campo Velho" permanece no banco de dados com status inativo


    # AC-10, RNF-013 - Auditoria de todas as operações de escrita
    @auditoria @RNF013 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Esquema do Cenário: Sistema registra no log de auditoria cada operação de escrita sobre bairros
      Dado que o administrador "admin.qa@gouce.com" está autenticado no sistema
      Quando ele realiza a operação de "<operacao>" sobre um bairro
      Então o log de auditoria contém o registro da operação "<operacao>"
      E o registro informa o usuário "admin.qa@gouce.com" e o timestamp da operação

      Exemplos:
        | operacao   |
        | cadastro   |
        | edição     |
        | inativação |
        | reativação |


  Regra: Bairros e pontos inativos ficam indisponíveis para novos vínculos

    # AC-11 - Bairro inativo fora das opções de seleção
    @regra_negocio @prioridade_media @depende_de_HU001
    Cenário: Bairro inativo não é exibido na seleção de bairro do cadastro de aluno
      Dado que existe o bairro inativo "Alto São Francisco"
      Quando um estudante acessa o formulário de solicitação de cadastro
      E abre a seleção de bairro
      Então o bairro "Alto São Francisco" não é exibido como opção


    # AC-11, RN-004 - Preservação de vínculos e histórico
    @regra_negocio @RN004 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: Inativação de bairro preserva o vínculo dos alunos e os registros históricos
      Dado que a aluna "Larissa Mendes" está vinculada ao bairro "Campo Velho"
      E o bairro "Campo Velho" possui registros de alocação e relatórios de períodos anteriores
      Quando o administrador inativa o bairro "Campo Velho"
      Então a aluna "Larissa Mendes" permanece vinculada ao bairro "Campo Velho"
      E os registros de alocação e relatórios de períodos anteriores permanecem inalterados


  Regra: Somente o administrador gerencia bairros e pontos de parada (RN-006)

    # RN-006 - Menu não exibido para outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @prioridade_alta
    Esquema do Cenário: Menu de bairros não é exibido para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" está autenticado no sistema
      Quando esse usuário visualiza o menu principal
      Então o menu "Bairros e Pontos de Parada" não é exibido

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |


    # RN-006 - API nega acesso a outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega a gestão de bairros para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" possui um token de acesso válido
      Quando esse usuário envia uma requisição para cadastrar um bairro
      Então a API responde com o status "403 Forbidden"
      E o bairro não é cadastrado

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |
