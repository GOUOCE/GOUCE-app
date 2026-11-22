# =================================================================================
# ÉPICO: EP-007 - Comunicação e Mural de Avisos
# HISTÓRIA DE USUÁRIO: HU-023 - Publicação de Avisos
# REQUISITOS RELACIONADOS: RF-024 (Publicação de Avisos)
# REQ. NÃO FUNCIONAIS: RNF-012 (Integridade dos Dados), RNF-013 (Segurança - Auditoria)
# REGRA DE NEGÓCIO: RN-006 (Exclusividade Administrativa)
# OBSERVAÇÃO: os cenários seguem o que está implementado nas branches da HU-023 e da HU-024 (publicação e consulta de avisos);
#             edição, inativação e auditoria estão nos requisitos, mas ainda não foram implementados e levam a tag @nao_implementado.
# language: pt
# =================================================================================

@EP007 @HU023 @publicacao_avisos
Funcionalidade: Publicação de Avisos
  Como administrador
  Quero criar, editar e inativar comunicados em um mural de avisos
  Para manter os alunos informados sobre alterações de rotas, manutenções, imprevistos logísticos e comunicados oficiais da coordenação


  Regra: O administrador publica e consulta os avisos do mural

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa a opção "Notificações" do menu "Mais"
      E o aplicativo possui conexão ativa com a API


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-01, AC-03
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Administrador publica um novo aviso com sucesso
      Quando o administrador seleciona "Novo" na tela "Gerenciar Avisos"
      E preenche o formulário "Novo Aviso" com:
        | campo     | valor                                           |
        | Título    | Alteração no horário da Rota Centro - UFC       |
        | Descrição | A saída de amanhã será às 06:45 por manutenção. |
      E aciona o botão para salvar o aviso
      Então o sistema exibe o título "Operação realizada com sucesso" e a mensagem "Aviso publicado com sucesso."
      E o aviso "Alteração no horário da Rota Centro - UFC" passa a ser exibido no mural do aplicativo


    # Fluxo principal, passo 7 - Lista de avisos publicados
    @fluxo_feliz @prioridade_media
    Cenário: Administrador visualiza a lista de avisos publicados
      Dado que existem os avisos publicados "Alteração no horário da Rota Centro - UFC" e "Manutenção do ônibus ABC1D23"
      Quando o administrador visualiza a tela "Gerenciar Avisos"
      Então o sistema exibe os dois avisos com título, descrição e data de publicação


    # Busca pelo título
    @fluxo_feliz @prioridade_baixa
    Cenário: Administrador busca avisos pelo título
      Dado que existem os avisos publicados "Alteração no horário da Rota Centro - UFC" e "Manutenção do ônibus ABC1D23"
      Quando o administrador digita "Manutenção" no campo "Buscar por título"
      Então o sistema exibe somente o aviso "Manutenção do ônibus ABC1D23"


    # AC-03 - O autor é o administrador logado
    @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Aviso publicado é associado automaticamente ao administrador logado
      Dado que o administrador "admin.qa@gouce.com" está autenticado no sistema
      Quando ele publica um aviso pela API
      Então a API responde com o status "201 Created"
      E a resposta informa a mensagem "Aviso publicado com sucesso."
      E o aviso fica registrado com o administrador "admin.qa@gouce.com" como autor
      E o registro informa a data e a hora de criação


    # AC-02, FA-001 - Campos obrigatórios
    @fluxo_infeliz @FA001 @validacao_campos @prioridade_alta
    Esquema do Cenário: Sistema bloqueia a publicação quando o campo "<campo>" não é preenchido
      Quando o administrador seleciona "Novo" na tela "Gerenciar Avisos"
      E deixa o campo "<campo>" vazio
      E preenche o outro campo corretamente
      E aciona o botão para salvar o aviso
      Então o sistema exibe a mensagem "<mensagem>"
      E o aviso não é publicado

      Exemplos:
        | campo     | mensagem                 |
        | Título    | Título é obrigatório.    |
        | Descrição | Descrição é obrigatória. |


    # AC-02, FA-001 - Campos preenchidos só com espaços
    @fluxo_infeliz @FA001 @validacao_campos @prioridade_media
    Esquema do Cenário: Sistema trata o campo "<campo>" preenchido só com espaços como vazio
      Quando o administrador seleciona "Novo" na tela "Gerenciar Avisos"
      E preenche o campo "<campo>" somente com espaços
      E preenche o outro campo corretamente
      E aciona o botão para salvar o aviso
      Então o sistema exibe a mensagem "<mensagem>"
      E o aviso não é publicado

      Exemplos:
        | campo     | mensagem                 |
        | Título    | Título é obrigatório.    |
        | Descrição | Descrição é obrigatória. |


    # Tamanho dos campos (valor-limite)
    @fluxo_infeliz @validacao_campos @prioridade_media
    Esquema do Cenário: Sistema valida o tamanho do campo "<campo>" ao publicar o aviso
      Quando o administrador seleciona "Novo" na tela "Gerenciar Avisos"
      E preenche o campo "<campo>" com <tamanho> caracteres
      E preenche o outro campo corretamente
      E aciona o botão para salvar o aviso
      Então <resultado>

      Exemplos:
        | campo     | tamanho | resultado                                                                    |
        | Título    | 2       | o sistema exibe a mensagem "O título deve ter pelo menos 3 caracteres."      |
        | Título    | 150     | o aviso é publicado                                                          |
        | Título    | 151     | o sistema exibe a mensagem "O título deve ter no máximo 150 caracteres."     |
        | Descrição | 2       | o sistema exibe a mensagem "A descrição deve ter pelo menos 3 caracteres."   |
        | Descrição | 2000    | o aviso é publicado                                                          |
        | Descrição | 2001    | o sistema exibe a mensagem "A descrição deve ter no máximo 2000 caracteres." |


    # AC-02 - API valida os campos
    @fluxo_infeliz @FA001 @validacao_campos @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API recusa a publicação do aviso sem o campo "<campo>"
      Quando o administrador envia pela API a publicação de um aviso sem o campo "<campo>"
      Então a API responde com o status "422 Unprocessable Entity"
      E a resposta indica o campo "<campo>" com a mensagem "<mensagem>"
      E o aviso não é publicado

      Exemplos:
        | campo     | mensagem                 |
        | titulo    | Título é obrigatório.    |
        | descricao | Descrição é obrigatória. |


  Regra: O administrador edita e inativa avisos (ainda não implementado)

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa a opção "Notificações" do menu "Mais"


    # AC-04, FA-002 - Edição de aviso
    @fluxo_feliz @FA002 @nao_implementado @prioridade_alta
    Cenário: Administrador edita um aviso publicado e a alteração aparece imediatamente no mural
      Dado que existe o aviso publicado "Alteração no horário da Rota Centro - UFC"
      Quando o administrador seleciona a ação "Editar" para o aviso "Alteração no horário da Rota Centro - UFC"
      E altera o campo "Descrição" para "A saída de amanhã será às 07:00."
      E salva a alteração
      Então o sistema exibe a mensagem de sucesso da edição
      E o mural do aplicativo exibe a descrição "A saída de amanhã será às 07:00."


    # AC-05, FA-002 - Inativação de aviso
    @fluxo_feliz @FA002 @nao_implementado @prioridade_alta
    Cenário: Administrador inativa um aviso e ele deixa de ser exibido no mural imediatamente
      Dado que existe o aviso publicado "Manutenção do ônibus ABC1D23"
      Quando o administrador seleciona a ação "Inativar" para o aviso "Manutenção do ônibus ABC1D23"
      E confirma a inativação
      Então o sistema exibe a mensagem de sucesso da inativação
      E o aviso "Manutenção do ônibus ABC1D23" deixa de ser exibido no mural do aplicativo


    # AC-05 - Soft delete
    @regra_negocio @RNF012 @nao_implementado @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Inativação do aviso mantém o registro no banco de dados
      Dado que existe o aviso publicado "Manutenção do ônibus ABC1D23"
      Quando o administrador inativa o aviso pela API
      Então o registro do aviso permanece no banco de dados com status inativo
      E o aviso não é devolvido na consulta do mural


    # RNF-013 - Auditoria
    @auditoria @RNF013 @nao_implementado @teste_api @nao_automatizavel_via_appium @prioridade_media
    Esquema do Cenário: Sistema registra no log de auditoria cada operação de escrita sobre avisos
      Dado que o administrador "admin.qa@gouce.com" está autenticado no sistema
      Quando ele realiza a operação de "<operacao>" sobre um aviso
      Então o log de auditoria contém o registro da operação "<operacao>"
      E o registro informa o usuário "admin.qa@gouce.com" e o timestamp da operação

      Exemplos:
        | operacao   |
        | publicação |
        | edição     |
        | inativação |


  Regra: O aluno visualiza no mural os avisos publicados

    Contexto:
      Dado que o aluno "Maria Souza" está autenticado no sistema com cadastro aprovado e vínculo válido
      E o aplicativo possui conexão ativa com a API


    # AC-03 - Aviso publicado aparece no mural do aluno
    @fluxo_feliz @prioridade_alta
    Cenário: Aluno visualiza no mural os avisos publicados pelo administrador
      Dado que existem os avisos publicados "Alteração no horário da Rota Centro - UFC" e "Manutenção do ônibus ABC1D23"
      Quando o aluno acessa a aba "Avisos"
      Então o sistema exibe os dois avisos com título, descrição e data de publicação


    # AC-03 - Aviso novo aparece sem reabrir a tela
    @fluxo_feliz @prioridade_media
    Cenário: Mural do aluno exibe o aviso publicado enquanto o aluno usa o aplicativo
      Dado que o aluno está com o aplicativo aberto na aba "Avisos"
      Quando o administrador publica o aviso "Alteração no horário da Rota Centro - UFC"
      Então o mural do aluno passa a exibir o aviso "Alteração no horário da Rota Centro - UFC" sem que o aluno precise reabrir a tela


    # Busca pelo título
    @fluxo_feliz @prioridade_baixa
    Cenário: Aluno busca avisos pelo título no mural
      Dado que existem os avisos publicados "Alteração no horário da Rota Centro - UFC" e "Manutenção do ônibus ABC1D23"
      Quando o aluno digita "Manutenção" no campo "Buscar por título"
      Então o sistema exibe somente o aviso "Manutenção do ônibus ABC1D23"


    # Falha de carregamento do mural
    @fluxo_infeliz @conectividade @prioridade_media
    Cenário: Sistema informa o erro quando o mural não carrega
      Dado que o aplicativo perde a conexão com a internet
      Quando o aluno acessa a aba "Avisos"
      Então o sistema exibe o título "Erro de Conexão" com uma mensagem de erro de carregamento do mural


    # AC-05 - Aviso inativado fora do mural
    @fluxo_infeliz @nao_implementado @prioridade_alta
    Cenário: Aluno não visualiza no mural o aviso que foi inativado
      Dado que o aviso "Manutenção do ônibus ABC1D23" foi inativado pelo administrador
      Quando o aluno acessa a aba "Avisos"
      Então o sistema não exibe o aviso "Manutenção do ônibus ABC1D23"


    # AC-04 - Edição visível ao aluno
    @fluxo_feliz @nao_implementado @prioridade_media
    Cenário: Aluno visualiza a descrição atualizada de um aviso editado
      Dado que o administrador editou a descrição do aviso "Alteração no horário da Rota Centro - UFC"
      Quando o aluno acessa a aba "Avisos"
      Então o sistema exibe a descrição atualizada do aviso


  Regra: Somente o administrador publica avisos (RN-006)

    # RN-006 - Menu não exibido para outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @prioridade_alta
    Esquema do Cenário: Gerenciamento de avisos não é exibido para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" está autenticado no sistema
      Quando esse usuário visualiza o menu principal
      Então a opção de gerenciar avisos não é exibida

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |


    # RN-006 - API nega a publicação a outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega a publicação de avisos para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" possui um token de acesso válido
      Quando esse usuário tenta publicar um aviso pela API
      Então a API responde com o status "403 Forbidden"
      E nenhum aviso é criado

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |


    # RN-006 - Sem autenticação
    @fluxo_infeliz @regra_negocio @RN006 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega a <operacao> de avisos sem token de acesso
      Quando uma requisição de <operacao> de avisos é enviada sem token de acesso
      Então a API responde com o status "401 Unauthorized"
      E nenhum aviso é criado ou exibido

      Exemplos:
        | operacao   |
        | publicação |
        | consulta   |
