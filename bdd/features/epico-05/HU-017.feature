# =================================================================================
# ÉPICO: EP-005 - Alocação e Distribuição Logística
# HISTÓRIA DE USUÁRIO: HU-017 - Alocação de Motoristas às Rotas
# REQUISITOS RELACIONADOS: RF-018 (Alocação de Motoristas)
# REQ. NÃO FUNCIONAIS: RNF-012 (Integridade dos Dados), RNF-013 (Segurança - Auditoria)
# REGRA DE NEGÓCIO: RN-002 (Prevenção de Conflito de Motorista), RN-006 (Exclusividade Administrativa)
# language: pt
# =================================================================================

@EP005 @HU017 @alocacao_motoristas
Funcionalidade: Alocação de Motoristas às Rotas
  Como administrador
  Quero alocar os motoristas aos ônibus que farão as rotas do dia
  Para definir a escala de trabalho da equipe e garantir que todas as viagens programadas tenham um condutor responsável


  Regra: O administrador define a escala de motoristas na distribuição logística do dia

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa a tela "Alocação Diária" do dia "17/11/2026"
      E o aplicativo possui conexão ativa com a API
      E a rota "Rota Centro - UFC" possui o ônibus "ABC1D23" alocado para o dia


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-01, AC-04, AC-07
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Administrador seleciona o ônibus e o motorista e confirma a escala
      Dado que existe o motorista ativo "Carlos Silva" disponível para o dia
      Quando o administrador abre os detalhes da rota "Rota Centro - UFC"
      E seleciona o ônibus "ABC1D23"
      E seleciona o motorista "Carlos Silva" no mesmo formulário
      E aciona o botão de confirmar a escala
      Então o sistema exibe a mensagem "Escala de motoristas confirmada com sucesso"
      E o motorista "Carlos Silva" passa a constar como condutor do ônibus "ABC1D23" na rota "Rota Centro - UFC"


    # AC-02 - Lista de motoristas disponíveis ao selecionar o ônibus
    @fluxo_feliz @prioridade_alta
    Cenário: Sistema exibe a lista de motoristas disponíveis ao selecionar o ônibus
      Dado que existem os motoristas ativos "Carlos Silva" e "Pedro Alves"
      Quando o administrador abre os detalhes da rota "Rota Centro - UFC"
      E seleciona o ônibus "ABC1D23"
      Então o sistema exibe os motoristas "Carlos Silva" e "Pedro Alves" como opções de escala


    # AC-03, FA-002 - Motorista inativo fora da lista
    @fluxo_infeliz @FA002 @prioridade_alta
    Cenário: Sistema não oferece motoristas inativos na lista de escala
      Dado que existe o motorista ativo "Carlos Silva"
      E existe o motorista inativo "Marcos Dias"
      Quando o administrador abre os detalhes da rota "Rota Centro - UFC"
      E abre a lista de motoristas
      Então o sistema exibe "Carlos Silva" como opção
      E "Marcos Dias" não é exibido como opção


    # Campos obrigatórios
    @fluxo_infeliz @validacao_campos @prioridade_alta
    Esquema do Cenário: Sistema bloqueia a confirmação da escala quando falta o <campo>
      Quando o administrador abre os detalhes da rota "Rota Centro - UFC"
      E deixa o <campo> sem seleção
      E aciona o botão de confirmar a escala
      Então o sistema exibe a mensagem "Selecione um ônibus e um motorista para cada veículo da rota."
      E a escala não é confirmada

      Exemplos:
        | campo     |
        | ônibus    |
        | motorista |


    # AC-07 - API persiste o vínculo motorista-ônibus-rota-data
    @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API persiste o vínculo entre motorista, ônibus, rota e data
      Quando o administrador confirma pela API a escala do motorista "Carlos Silva" no ônibus "ABC1D23" na rota "Rota Centro - UFC" para o dia "17/11/2026"
      Então a API responde com o status "201 Created"
      E a resposta informa a mensagem "Distribuição realizada com sucesso"
      E o banco de dados registra o motorista "Carlos Silva", o ônibus "ABC1D23", a rota "Rota Centro - UFC", o turno e a data "17/11/2026"


    # RNF-013 - Auditoria da escala
    @auditoria @RNF013 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: Sistema registra no log de auditoria a confirmação da escala de motoristas
      Dado que o administrador "admin.qa@gouce.com" está autenticado no sistema
      Quando ele confirma a escala de um motorista pela API
      Então o log de auditoria contém o registro da operação de escala
      E o registro informa o usuário "admin.qa@gouce.com", a ação, os dados da escala e a data e a hora da operação


  Regra: O sistema impede conflitos de escala e motoristas indisponíveis

    Contexto:
      Dado que o administrador está autenticado no sistema
      E o dia "17/11/2026" possui as rotas "Rota Centro - UFC" e "Rota Campo Velho - UFC" com ônibus alocados
      E o motorista "Carlos Silva" já está escalado na rota "Rota Centro - UFC" no turno da ida


    # FA-001, AC-05, RN-002 - Motorista já escalado em outra rota no mesmo turno
    @fluxo_infeliz @FA001 @RN002 @prioridade_alta
    Cenário: Sistema bloqueia a escala de um motorista já designado para outra rota no mesmo turno
      Quando o administrador tenta escalar "Carlos Silva" na rota "Rota Campo Velho - UFC" no turno da ida
      Então o sistema bloqueia a seleção ou exibe o alerta "Este motorista já está escalado para outra rota neste horário"
      E a escala da rota "Rota Campo Velho - UFC" não é confirmada


    # AC-05, AC-06, RN-002 - API revalida o conflito na confirmação
    @fluxo_infeliz @FA001 @RN002 @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API recusa a confirmação com o mesmo motorista em dois ônibus no mesmo turno
      Quando o administrador envia a escala com o motorista "Carlos Silva" em dois ônibus diferentes no turno da ida
      Então a API responde com o status "409 Conflict"
      E a resposta informa a mensagem "Este motorista já está escalado para outra rota neste horário"
      E nenhuma escala é gravada


    # RN-002 - Turnos diferentes não conflitam
    @regra_negocio @RN002 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: API aceita o mesmo motorista na ida e na volta do mesmo dia
      Quando o administrador envia a escala com o motorista "Carlos Silva" no turno da ida e no turno da volta
      Então a API responde com o status "201 Created"


    # AC-06 - Revalidação no momento da confirmação
    @fluxo_infeliz @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API recusa a confirmação de um motorista inativado depois de exibido na lista
      Dado que o motorista "Marcos Dias" estava ativo quando a lista foi exibida
      E o motorista "Marcos Dias" foi inativado antes da confirmação
      Quando o administrador envia a escala com o motorista "Marcos Dias"
      Então a API responde com o status "422 Unprocessable Entity"
      E a resposta informa a mensagem "alocação 0: motorista inexistente ou inativo."
      E a escala não é gravada


  Regra: Somente o administrador define a escala de motoristas (RN-006)

    # RN-006 - Menu não exibido para outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @prioridade_alta
    Esquema do Cenário: Menu de alocação diária não é exibido para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" está autenticado no sistema
      Quando esse usuário visualiza o menu principal
      Então o menu "Alocação Diária" não é exibido

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |


    # RN-006 - API nega acesso a outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega a escala de motoristas para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" possui um token de acesso válido
      Quando esse usuário envia uma requisição para confirmar a escala de motoristas
      Então a API responde com o status "403 Forbidden"
      E nenhuma escala é gravada

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |
