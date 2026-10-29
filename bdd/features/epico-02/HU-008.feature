# =================================================================================
# ÉPICO: EP-002 - Gestão de Cadastros Base
# HISTÓRIA DE USUÁRIO: HU-008 - Gerenciamento de Faculdades
# REQUISITOS RELACIONADOS: RF-010 (Gerenciamento de Faculdades), RF-014 (Soft Delete)
# REQ. NÃO FUNCIONAIS: RNF-012 (Integridade dos Dados), RNF-013 (Auditoria)
# REGRA DE NEGÓCIO: RN-004 (Preservação de Histórico), RN-006 (Exclusividade Administrativa)
# language: pt
# =================================================================================

@EP002 @HU008 @gestao_faculdades
Funcionalidade: Gerenciamento de Faculdades
  Como administrador
  Quero cadastrar, visualizar, editar, inativar e reativar as faculdades de destino
  Para organizar as instituições de ensino atendidas pelas rotas de transporte


  Regra: O administrador mantém o cadastro de faculdades

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa o menu "Faculdades"
      E o aplicativo possui conexão ativa com a API


    # AC-01 - Listagem de faculdades ativas
    @fluxo_feliz @prioridade_media
    Cenário: Administrador visualiza as faculdades ativas cadastradas
      Dado que existem as faculdades ativas "UFC" e "IFCE" no campus "Quixadá"
      E existe a faculdade inativa "Unicatólica" no campus "Quixadá"
      Quando o administrador visualiza a listagem de faculdades
      Então o sistema exibe as faculdades "UFC" e "IFCE" com nome e campus
      E o sistema não exibe a faculdade "Unicatólica"


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-02, AC-07
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Administrador cadastra uma nova faculdade com sucesso
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o campo "Nome" com "Unicatólica"
      E preenche o campo "Campus" com "Quixadá"
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a listagem exibe a faculdade "Unicatólica" no campus "Quixadá"


    # AC-02 - A unicidade considera a combinação nome + campus
    @fluxo_feliz @prioridade_media
    Cenário: Administrador cadastra a mesma faculdade em um campus diferente
      Dado que já existe a faculdade "UFC" no campus "Quixadá"
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o campo "Nome" com "UFC"
      E preenche o campo "Campus" com "Crateús"
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a listagem exibe a faculdade "UFC" no campus "Crateús"


    # FA-002 - Cadastro duplicado (AC-03)
    # A duplicidade vale contra registros ativos ou inativos (decisão do PO na #207, item 2)
    @fluxo_infeliz @FA002 @prioridade_alta
    Esquema do Cenário: Sistema bloqueia o cadastro de faculdade com nome e campus já existentes
      Dado que já existe a faculdade "UFC" no campus "Quixadá" com status "<status_existente>"
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o campo "Nome" com "<nome_digitado>"
      E preenche o campo "Campus" com "<campus_digitado>"
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Esta faculdade já está cadastrada."
      E a faculdade não é cadastrada

      Exemplos:
        | status_existente | nome_digitado | campus_digitado |
        | ativo            | UFC           | Quixadá         |
        | inativo          | UFC           | Quixadá         |
        | ativo            | ufc           | quixadá         |
        | ativo            | UFC           | QUIXADÁ         |


    # FA-002 - Cadastro duplicado na edição (AC-03)
    @fluxo_infeliz @FA002 @prioridade_alta
    Cenário: Sistema bloqueia a edição de faculdade para nome e campus já utilizados por outra
      Dado que existem as faculdades ativas "UFC" e "IFCE" no campus "Quixadá"
      Quando o administrador seleciona a ação "Editar" para "IFCE"
      E altera o campo "Nome" para "UFC"
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Esta faculdade já está cadastrada."
      E a faculdade "IFCE" mantém o nome original


    # FA-003 - Campos obrigatórios ausentes no cadastro (AC-08)
    @fluxo_infeliz @FA003 @validacao_campos @prioridade_alta
    Esquema do Cenário: Sistema bloqueia o cadastro quando um campo obrigatório não é preenchido
      Quando o administrador seleciona "Novo Cadastro"
      E deixa o campo "<campo_obrigatorio>" vazio
      E preenche os demais campos obrigatórios corretamente
      E clica no botão "Salvar"
      Então o sistema destaca o campo "<campo_obrigatorio>" como obrigatório
      E a faculdade não é cadastrada

      Exemplos:
        | campo_obrigatorio |
        | Nome              |
        | Campus            |


    # AC-12 - Caracteres permitidos no nome, na sigla e no campus
    @fluxo_infeliz @validacao_campos @prioridade_media
    Esquema do Cenário: Sistema bloqueia nome da instituição ou campus com caracteres não permitidos
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o campo "<campo>" com "<valor>"
      E preenche os demais campos corretamente
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Use apenas letras, números, espaços, hífen, apóstrofo ou ponto"
      E a faculdade não é cadastrada

      Exemplos:
        | campo  | valor           |
        | Nome   | Faculdade 😀    |
        | Nome   | Faculdade @#$%  |
        | Campus | Campus 😀       |
        | Campus | Campus @#$%     |


    # AC-12 - Caracteres permitidos na sigla
    @fluxo_infeliz @validacao_campos @prioridade_media
    Esquema do Cenário: Sistema bloqueia sigla com caracteres não permitidos
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o campo "Sigla" com "<sigla>"
      E preenche os demais campos corretamente
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Use apenas letras e números na sigla, sem espaços"
      E a faculdade não é cadastrada

      Exemplos:
        | sigla  |
        | U F C  |
        | UFC 😀 |
        | UFC@#  |


    # AC-12 - Números são aceitos no nome, na sigla e no campus
    @fluxo_feliz @validacao_campos @prioridade_media
    Cenário: Administrador cadastra faculdade com número no nome e na sigla
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o nome da instituição com "Faculdade 7 de Setembro"
      E preenche a sigla com "FA7"
      E preenche o campus com "Campus Fortaleza"
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a listagem exibe a faculdade "Faculdade 7 de Setembro" com a sigla "FA7" no campus "Campus Fortaleza"


    # AC-12 - Tamanho mínimo do nome, da sigla e do campus
    @fluxo_infeliz @validacao_campos @prioridade_media
    Esquema do Cenário: Sistema bloqueia campo abaixo do tamanho mínimo
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o campo "<campo>" com "<valor>"
      E preenche os demais campos corretamente
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "<mensagem>"
      E a faculdade não é cadastrada

      Exemplos:
        | campo  | valor | mensagem                                                       |
        | Nome   | UF    | Informe o nome da instituição com pelo menos 3 caracteres      |
        | Sigla  | U     | Informe a sigla do nome (ex.: UFC)                             |
        | Campus | C     | Informe o campus da instituição                                |


    # AC-12 - Tamanho máximo do nome, da sigla e do campus
    @fluxo_infeliz @validacao_campos @prioridade_media
    Esquema do Cenário: Sistema bloqueia campo acima do tamanho máximo
      Quando o administrador seleciona "Novo Cadastro"
      E preenche o campo "<campo>" com um texto de <quantidade> caracteres
      E preenche os demais campos corretamente
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "<mensagem>"
      E a faculdade não é cadastrada

      Exemplos:
        | campo  | quantidade | mensagem                                                |
        | Nome   | 151        | O nome da instituição deve ter no máximo 150 caracteres |
        | Sigla  | 21         | A sigla deve ter no máximo 20 caracteres                |
        | Campus | 101        | O campus deve ter no máximo 100 caracteres              |


    # AC-12 - A API aplica as mesmas regras de caracteres e de tamanho
    @fluxo_infeliz @validacao_campos @teste_api @nao_automatizavel_via_appium @prioridade_media
    Esquema do Cenário: API rejeita faculdade fora das regras de caracteres e de tamanho
      Quando um administrador envia uma requisição para cadastrar uma faculdade com "<campo>" igual a "<valor>"
      Então a API responde com o status "422 Unprocessable Entity"
      E a faculdade não é cadastrada

      Exemplos:
        | campo  | valor           |
        | nome   | Faculdade 😀    |
        | nome   | UF              |
        | sigla  | U F C           |
        | campus | Campus @#$%     |
        | campus | C               |


    # FA-003 - Campos obrigatórios ausentes na edição (AC-08)
    @fluxo_infeliz @FA003 @validacao_campos @prioridade_media
    Esquema do Cenário: Sistema bloqueia a edição quando um campo obrigatório é esvaziado
      Dado que existe a faculdade ativa "Unicatólica" no campus "Quixadá"
      Quando o administrador seleciona a ação "Editar" para "Unicatólica"
      E esvazia o campo "<campo_obrigatorio>"
      E clica no botão "Salvar"
      Então o sistema destaca o campo "<campo_obrigatorio>" como obrigatório
      E a faculdade "Unicatólica" mantém os dados originais

      Exemplos:
        | campo_obrigatorio |
        | Nome              |
        | Campus            |


    # AC-04, AC-07 - Edição de faculdade existente
    @fluxo_feliz @prioridade_alta
    Cenário: Administrador edita os dados de uma faculdade existente
      Dado que existe a faculdade ativa "Unicatólica" no campus "Quixadá"
      Quando o administrador seleciona a ação "Editar" para "Unicatólica"
      E altera o campo "Nome" para "Centro Universitário Católica de Quixadá"
      E altera o campo "Campus" para "Crateús"
      E clica no botão "Salvar"
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a listagem exibe a faculdade "Centro Universitário Católica de Quixadá" no campus "Crateús"


    # AC-05, AC-07 - Inativação de faculdade
    @fluxo_feliz @RF014 @prioridade_alta
    Cenário: Administrador inativa uma faculdade sem agendamentos futuros
      Dado que existe a faculdade ativa "Unicatólica" sem alunos agendados para datas futuras
      Quando o administrador seleciona a ação "Inativar" para "Unicatólica"
      E confirma a inativação
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a faculdade "Unicatólica" deixa de ser exibida na listagem de ativas


    # AC-05, AC-07, AC-09 - Reativação de faculdade
    @fluxo_feliz @RF014 @prioridade_media
    Cenário: Administrador reativa uma faculdade previamente inativada
      Dado que existe a faculdade inativa "Unicatólica"
      Quando o administrador ativa a chave "Mostrar inativos"
      E seleciona a ação "Reativar" para "Unicatólica"
      E confirma a reativação
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a faculdade "Unicatólica" volta a ser exibida na listagem de ativas


    # FA-001 - Inativação de faculdade com agendamentos futuros (AC-06, RNF-012)
    @fluxo_infeliz @FA001 @RNF012 @prioridade_alta @depende_de_HU013
    Cenário: Sistema bloqueia a inativação de faculdade com alunos agendados para datas futuras
      Dado que a faculdade "UFC" no campus "Quixadá" possui alunos agendados para datas futuras
      Quando o administrador tenta inativar a faculdade "UFC"
      Então o sistema exibe a mensagem "Esta instituição possui viagens programadas pendentes. Não é possível inativar no momento."
      E a faculdade "UFC" permanece ativa


    # FA-004 - Inativação de faculdade vinculada a rota ativa (AC-12, RNF-012, decisão do PO na #207, item 9)
    @fluxo_infeliz @FA004 @RNF012 @prioridade_alta @depende_de_HU011
    Esquema do Cenário: Sistema bloqueia a inativação de faculdade atendida por uma rota ativa
      Dado que a faculdade "UFC" no campus "Quixadá" é atendida <trecho> da rota ativa "Rota Centro - UFC"
      Quando o administrador tenta inativar a faculdade "UFC"
      Então o sistema exibe a mensagem "Esta faculdade não pode ser inativada pois pertence a uma rota ativa. Remova-a da rota antes de continuar."
      E a faculdade "UFC" permanece ativa

      Exemplos:
        | trecho   |
        | na ida   |
        | na volta |


    # AC-12 - Faculdade vinculada apenas a rota inativa pode ser inativada
    @fluxo_feliz @RF014 @prioridade_media @depende_de_HU011
    Cenário: Administrador inativa uma faculdade vinculada apenas a rotas inativas
      Dado que a faculdade "Unicatólica" no campus "Quixadá" é atendida apenas pela rota inativa "Rota Antiga"
      E a faculdade "Unicatólica" não possui alunos agendados para datas futuras
      Quando o administrador seleciona a ação "Inativar" para "Unicatólica"
      E confirma a inativação
      Então o sistema exibe a mensagem "Operação realizada com sucesso"
      E a faculdade "Unicatólica" deixa de ser exibida na listagem de ativas


    # AC-09 - Visualização de registros inativos
    @fluxo_feliz @prioridade_media
    Cenário: Administrador visualiza faculdades inativas ao ativar "Mostrar inativos"
      Dado que existe a faculdade inativa "Unicatólica" no campus "Quixadá"
      Quando o administrador ativa a chave "Mostrar inativos"
      Então o sistema exibe a faculdade "Unicatólica" identificada como inativa


  Regra: Operações de escrita usam soft delete e ficam registradas na auditoria

    # AC-05, RF-014 - Soft delete
    @regra_negocio @RF014 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Inativação de faculdade mantém o registro no banco de dados
      Dado que existe a faculdade ativa "Unicatólica"
      Quando o administrador inativa a faculdade "Unicatólica" pela API
      Então o registro de "Unicatólica" permanece no banco de dados com status inativo


    # AC-10, RNF-013 - Auditoria de todas as operações de escrita
    @auditoria @RNF013 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Esquema do Cenário: Sistema registra no log de auditoria cada operação de escrita sobre faculdades
      Dado que o administrador "admin.qa@gouce.com" está autenticado no sistema
      Quando ele realiza a operação de "<operacao>" sobre uma faculdade
      Então o log de auditoria contém o registro da operação "<operacao>"
      E o registro informa o usuário "admin.qa@gouce.com" e o timestamp da operação

      Exemplos:
        | operacao   |
        | cadastro   |
        | edição     |
        | inativação |
        | reativação |


  Regra: Faculdades inativas ficam indisponíveis para novos vínculos

    # AC-11 - Faculdade inativa fora das opções de seleção do cadastro de aluno
    @regra_negocio @prioridade_media @depende_de_HU001
    Cenário: Faculdade inativa não é exibida na seleção de faculdade do cadastro de aluno
      Dado que existe a faculdade inativa "Unicatólica" no campus "Quixadá"
      Quando um estudante acessa o formulário de solicitação de cadastro
      E abre a seleção de faculdade
      Então a faculdade "Unicatólica" não é exibida como opção


    # AC-11, RN-004 - Preservação de vínculos e histórico
    @regra_negocio @RN004 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: Inativação de faculdade preserva o vínculo dos alunos e os registros históricos
      Dado que a aluna "Larissa Mendes" está vinculada à faculdade "Unicatólica"
      E a faculdade "Unicatólica" possui registros de alocação e relatórios de períodos anteriores
      Quando o administrador inativa a faculdade "Unicatólica"
      Então a aluna "Larissa Mendes" permanece vinculada à faculdade "Unicatólica"
      E os registros de alocação e relatórios de períodos anteriores permanecem inalterados


  Regra: Somente o administrador gerencia faculdades (RN-006)

    # RN-006 - Menu não exibido para outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @prioridade_alta
    Esquema do Cenário: Menu de faculdades não é exibido para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" está autenticado no sistema
      Quando esse usuário visualiza o menu principal
      Então o menu "Faculdades" não é exibido

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |


    # RN-006 - API nega acesso a outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega a gestão de faculdades para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" possui um token de acesso válido
      Quando esse usuário envia uma requisição para cadastrar uma faculdade
      Então a API responde com o status "403 Forbidden"
      E a faculdade não é cadastrada

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |
