# =================================================================================
# ÉPICO: EP-002 - Gestão de Cadastros Base
# HISTÓRIA DE USUÁRIO: HU-030 - Gerenciamento de Representantes
# REQUISITOS RELACIONADOS: RF-034 (Gerenciamento de Representantes), RF-003 (Controle de Acesso por Perfil)
# REQ. NÃO FUNCIONAIS: RNF-012 (Integridade dos Dados), RNF-013 (Auditoria)
# REGRA DE NEGÓCIO: RN-006 (Exclusividade Administrativa), RN-015 (Atuação do Representante)
# language: pt
# =================================================================================

@EP002 @HU030 @gestao_representantes
Funcionalidade: Gerenciamento de Representantes
  Como administrador
  Quero atribuir ou revogar a função de representante de um aluno já cadastrado
  Para definir quais estudantes acompanham as listas de embarque e registram a frequência dos alunos


  Regra: O administrador atribui e revoga a função de representante

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa o menu "Representantes"
      E o aplicativo possui conexão ativa com a API


    # AC-01 - Listagem de representantes ativos e revogados
    @fluxo_feliz @prioridade_media
    Cenário: Administrador visualiza os representantes ativos e os que tiveram a função revogada
      Dado que a aluna "Ana Beatriz" possui a função de representante ativa
      E o aluno "Pedro Henrique" teve a função de representante revogada
      Quando o administrador visualiza a listagem de representantes
      Então o sistema exibe "Ana Beatriz" como representante ativa
      E o sistema exibe "Pedro Henrique" como representante revogado


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-02, AC-03, AC-04, AC-05, AC-12
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Administrador atribui a função de representante a um aluno aprovado e ativo
      Dado que existe a aluna "Larissa Mendes" com cadastro aprovado e ativo
      Quando o administrador seleciona "Adicionar Representante"
      E seleciona a instituição de ensino "UFC - Campus Quixadá"
      E pesquisa e seleciona a aluna "Larissa Mendes"
      E confirma a atribuição da função
      Então o sistema exibe uma mensagem de sucesso
      E a listagem exibe "Larissa Mendes" como representante ativa da instituição "UFC - Campus Quixadá"
      E os dados pessoais e o cadastro de aluno de "Larissa Mendes" são mantidos


    # AC-12 - Instituição de ensino obrigatória na atribuição
    @fluxo_infeliz @validacao_campos @prioridade_alta
    Cenário: Sistema bloqueia a atribuição quando a instituição de ensino não é selecionada
      Dado que existe a aluna "Larissa Mendes" com cadastro aprovado e ativo
      Quando o administrador seleciona "Adicionar Representante"
      E pesquisa e seleciona a aluna "Larissa Mendes"
      E confirma a atribuição da função sem selecionar a instituição de ensino
      Então o sistema destaca o campo "Instituição de Ensino" como obrigatório
      E a função de representante não é atribuída a "Larissa Mendes"


    # FA-001 - Revogação da função de representante (AC-06, AC-07)
    @fluxo_feliz @FA001 @prioridade_alta
    Cenário: Administrador revoga a função de representante e o cadastro de aluno permanece ativo
      Dado que a aluna "Ana Beatriz" possui a função de representante ativa
      Quando o administrador seleciona "Ana Beatriz" na listagem de representantes
      E escolhe a opção "Revogar Representante"
      E confirma a revogação
      Então o sistema exibe uma mensagem de sucesso
      E a listagem exibe "Ana Beatriz" como representante revogada
      E o cadastro de aluno de "Ana Beatriz" permanece ativo com as permissões de aluno


    # AC-13 - Reatribuição após revogação
    @fluxo_feliz @prioridade_media
    Cenário: Administrador atribui novamente a função a um aluno que teve a função revogada
      Dado que o aluno "Pedro Henrique" teve a função de representante revogada
      Quando o administrador seleciona "Adicionar Representante"
      E seleciona a instituição de ensino "IFCE - Campus Quixadá"
      E pesquisa e seleciona o aluno "Pedro Henrique"
      E confirma a atribuição da função
      Então o sistema exibe uma mensagem de sucesso
      E a listagem exibe "Pedro Henrique" como representante ativo da instituição "IFCE - Campus Quixadá"


    # FA-002 - Aluno sem cadastro aprovado e ativo (AC-03)
    @fluxo_infeliz @FA002 @prioridade_alta
    Esquema do Cenário: Sistema bloqueia a atribuição para aluno sem cadastro aprovado e ativo
      Dado que existe o aluno "Marcos Vinícius" com status de cadastro "<status_cadastro>"
      Quando o administrador seleciona "Adicionar Representante"
      E seleciona a instituição de ensino "UFC - Campus Quixadá"
      E pesquisa e seleciona o aluno "Marcos Vinícius"
      E confirma a atribuição da função
      Então o sistema exibe a mensagem "Somente alunos aprovados podem ser representantes."
      E a função de representante não é atribuída a "Marcos Vinícius"

      Exemplos:
        | status_cadastro |
        | Pendente        |
        | Reprovado       |
        | Vínculo vencido |
        | Inativo         |


    # FA-003 - Aluno já é representante (AC-11)
    @fluxo_infeliz @FA003 @prioridade_alta
    Cenário: Sistema impede atribuir novamente a função a um aluno que já é representante
      Dado que a aluna "Ana Beatriz" possui a função de representante ativa
      Quando o administrador seleciona "Adicionar Representante"
      E pesquisa e seleciona a aluna "Ana Beatriz"
      Então o sistema exibe a mensagem "Este aluno já é representante."
      E o sistema impede uma nova atribuição


    # FA-004 - Aluno não encontrado (AC-02)
    @fluxo_infeliz @FA004 @prioridade_media
    Cenário: Sistema informa quando nenhum aluno corresponde à pesquisa
      Quando o administrador seleciona "Adicionar Representante"
      E pesquisa pelo aluno "Nome Inexistente da Silva"
      Então o sistema exibe a mensagem "Nenhum aluno encontrado."


  Regra: Atribuição e revogação ficam registradas na auditoria

    # AC-10, RNF-013 - Auditoria das operações de atribuição e revogação
    @auditoria @RNF013 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Esquema do Cenário: Sistema registra no log de auditoria a atribuição e a revogação da função de representante
      Dado que o administrador "admin.qa@gouce.com" está autenticado no sistema
      Quando ele realiza a operação de "<operacao>" da função de representante
      Então o log de auditoria contém o registro da operação "<operacao>"
      E o registro informa o usuário "admin.qa@gouce.com" e o timestamp da operação

      Exemplos:
        | operacao   |
        | atribuição |
        | revogação  |


  Regra: O representante atua apenas sobre a universidade sob sua responsabilidade (RN-015)

    # AC-08, RN-015 - Escopo do representante restrito à sua universidade
    @regra_negocio @RN015 @prioridade_alta @depende_de_HU018 @depende_de_HU021
    Cenário: Representante visualiza apenas a lista de embarque da universidade sob sua responsabilidade
      Dado que a aluna "Ana Beatriz" é representante da universidade "UFC - Campus Quixadá"
      E existem listas de embarque das universidades "UFC - Campus Quixadá" e "IFCE - Campus Quixadá"
      Quando "Ana Beatriz" acessa a lista de embarque
      Então o sistema exibe apenas os alunos vinculados ao transporte de "UFC - Campus Quixadá"
      E "Ana Beatriz" consegue registrar a presença desses alunos


    # AC-07 - Perda das permissões após revogação
    @regra_negocio @RF003 @prioridade_alta
    Cenário: Aluno com a função revogada deixa de acessar as funcionalidades de representante
      Dado que o aluno "Pedro Henrique" teve a função de representante revogada
      Quando "Pedro Henrique" se autentica no sistema
      Então o sistema exibe a interface do perfil Aluno
      E "Pedro Henrique" não consegue acessar a lista de embarque como representante


  Regra: Somente o administrador gerencia representantes (RN-006)

    # AC-09, RN-006, RN-015, RF-003 - Menu não exibido para outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @RN015 @RF003 @prioridade_alta
    Esquema do Cenário: Menu de representantes não é exibido para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" está autenticado no sistema
      Quando esse usuário visualiza o menu principal
      Então o menu "Representantes" não é exibido

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |


    # AC-09, RN-006 - API nega acesso a outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @RF003 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega a gestão de representantes para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" possui um token de acesso válido
      Quando esse usuário envia uma requisição para atribuir a função de representante
      Então a API responde com o status "403 Forbidden"
      E a função de representante não é atribuída

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |
