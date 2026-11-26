# =================================================================================
# ÉPICO: EP-007 - Comunicação e Mural de Avisos
# HISTÓRIA DE USUÁRIO: HU-023 - Publicação de Avisos
# REQUISITOS RELACIONADOS: RF-024 (Publicação de Avisos)
# REQ. NÃO FUNCIONAIS: RNF-012 (Integridade dos Dados), RNF-013 (Segurança - Auditoria)
# REGRA DE NEGÓCIO: RN-006 (Exclusividade Administrativa)
# language: pt
# =================================================================================

@EP007 @HU023 @publicacao_avisos
Funcionalidade: Publicação de Avisos
  Como administrador
  Quero criar, editar e inativar comunicados em um mural de avisos
  Para manter os alunos informados sobre alterações de rotas, manutenções, imprevistos logísticos e comunicados oficiais da coordenação


  Regra: O administrador publica, edita e inativa avisos no mural

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa o menu "Mural de Avisos"
      E o aplicativo possui conexão ativa com a API


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-01, AC-03
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Administrador publica um novo aviso com sucesso
      Quando o administrador seleciona "Novo Aviso"
      E preenche o formulário do aviso com:
        | campo     | valor                                           |
        | Título    | Alteração no horário da Rota Centro - UFC       |
        | Descrição | A saída de amanhã será às 06:45 por manutenção. |
      E aciona o botão "Publicar"
      Então o sistema exibe a mensagem "Aviso publicado com sucesso"
      E o aviso "Alteração no horário da Rota Centro - UFC" passa a ser exibido no mural do aplicativo


    # Fluxo principal, passo 7 e FA-002 - Lista de avisos publicados
    @fluxo_feliz @prioridade_media
    Cenário: Administrador visualiza a lista de avisos já publicados
      Dado que existem os avisos publicados "Alteração no horário da Rota Centro - UFC" e "Manutenção do ônibus ABC1D23"
      Quando o administrador visualiza a lista de avisos
      Então o sistema exibe os dois avisos com título e descrição


    # AC-03 - O autor é o administrador logado
    @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Aviso publicado é associado automaticamente ao administrador logado
      Dado que o administrador "admin.qa@gouce.com" está autenticado no sistema
      Quando ele publica um aviso pela API
      Então a API responde com o status "201 Created"
      E o aviso fica registrado com o administrador "admin.qa@gouce.com" como autor
      E o registro informa a data e a hora de criação


    # AC-02, FA-001 - Campos obrigatórios
    @fluxo_infeliz @FA001 @validacao_campos @prioridade_alta
    Esquema do Cenário: Sistema bloqueia a publicação quando o campo "<campo_obrigatorio>" não é preenchido
      Quando o administrador seleciona "Novo Aviso"
      E deixa o campo "<campo_obrigatorio>" vazio
      E preenche o outro campo corretamente
      E aciona o botão "Publicar"
      Então o sistema destaca o campo "<campo_obrigatorio>" como obrigatório
      E o aviso não é publicado

      Exemplos:
        | campo_obrigatorio |
        | Título            |
        | Descrição         |


    # AC-02, FA-001 - Campos preenchidos só com espaços
    @fluxo_infeliz @FA001 @validacao_campos @prioridade_media
    Esquema do Cenário: Sistema trata o campo "<campo>" preenchido só com espaços como vazio
      Quando o administrador seleciona "Novo Aviso"
      E preenche o campo "<campo>" somente com espaços
      E preenche o outro campo corretamente
      E aciona o botão "Publicar"
      Então o sistema destaca o campo "<campo>" como obrigatório
      E o aviso não é publicado

      Exemplos:
        | campo     |
        | Título    |
        | Descrição |


    # Decisão do PO (#539, item 5) - Limites de tamanho: recusa
    @fluxo_infeliz @FA001 @validacao_campos @valor_limite @prioridade_media
    Esquema do Cenário: Sistema recusa o campo "<campo>" com <tamanho> caracteres
      Quando o administrador seleciona "Novo Aviso"
      E preenche o campo "<campo>" com <tamanho> caracteres
      E preenche o outro campo corretamente
      E aciona o botão "Publicar"
      Então o sistema exibe a mensagem "<mensagem>"
      E o aviso não é publicado

      Exemplos:
        | campo     | tamanho | mensagem                                        |
        | Título    | 2       | O título deve ter pelo menos 3 caracteres.      |
        | Título    | 151     | O título deve ter no máximo 150 caracteres.     |
        | Descrição | 2       | A descrição deve ter pelo menos 3 caracteres.   |
        | Descrição | 2001    | A descrição deve ter no máximo 2000 caracteres. |


    # Decisão do PO (#539, item 5) - Limites de tamanho: aceitação
    @fluxo_feliz @validacao_campos @valor_limite @prioridade_media
    Esquema do Cenário: Sistema aceita o campo "<campo>" com <tamanho> caracteres
      Quando o administrador seleciona "Novo Aviso"
      E preenche o campo "<campo>" com <tamanho> caracteres
      E preenche o outro campo corretamente
      E aciona o botão "Publicar"
      Então o sistema exibe a mensagem "Aviso publicado com sucesso"

      Exemplos:
        | campo     | tamanho |
        | Título    | 3       |
        | Título    | 150     |
        | Descrição | 3       |
        | Descrição | 2000    |


    # AC-02 - API valida os campos obrigatórios
    @fluxo_infeliz @FA001 @validacao_campos @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API recusa a publicação do aviso sem o campo "<campo>"
      Quando o administrador envia pela API a publicação de um aviso sem o campo "<campo>"
      Então a API responde com o status "422 Unprocessable Entity"
      E a resposta indica o campo "<campo>"
      E o aviso não é publicado

      Exemplos:
        | campo     |
        | titulo    |
        | descricao |


    # AC-04, FA-002 - Edição de aviso
    @fluxo_feliz @FA002 @prioridade_alta
    Cenário: Administrador edita um aviso publicado e a alteração aparece imediatamente no mural
      Dado que existe o aviso publicado "Alteração no horário da Rota Centro - UFC"
      Quando o administrador seleciona a ação "Editar" para o aviso "Alteração no horário da Rota Centro - UFC"
      E altera o campo "Descrição" para "A saída de amanhã será às 07:00."
      E aciona o botão "Salvar"
      Então o sistema exibe a mensagem de sucesso da edição
      E o mural do aplicativo exibe a descrição "A saída de amanhã será às 07:00."


    # AC-05, FA-002 - Inativação de aviso
    @fluxo_feliz @FA002 @prioridade_alta
    Cenário: Administrador inativa um aviso e ele deixa de ser exibido no mural imediatamente
      Dado que existe o aviso publicado "Manutenção do ônibus ABC1D23"
      Quando o administrador seleciona a ação "Inativar" para o aviso "Manutenção do ônibus ABC1D23"
      E confirma a inativação
      Então o sistema exibe a mensagem de sucesso da inativação
      E o aviso "Manutenção do ônibus ABC1D23" deixa de ser exibido no mural do aplicativo


    # AC-05 - Soft delete
    @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Inativação do aviso mantém o registro no banco de dados
      Dado que existe o aviso publicado "Manutenção do ônibus ABC1D23"
      Quando o administrador inativa o aviso pela API
      Então o registro do aviso permanece no banco de dados com status inativo
      E o aviso não é devolvido na consulta do mural


    # RNF-013 - Auditoria
    @auditoria @RNF013 @teste_api @nao_automatizavel_via_appium @prioridade_media
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


  Regra: O aluno visualiza no mural somente os avisos ativos

    Contexto:
      Dado que o aluno "Maria Souza" está autenticado no sistema com cadastro aprovado e vínculo válido
      E o aplicativo possui conexão ativa com a API


    # AC-03 - Aviso publicado aparece no mural do aluno
    @fluxo_feliz @prioridade_alta
    Cenário: Aluno visualiza no mural os avisos publicados pelo administrador
      Dado que existem os avisos ativos "Alteração no horário da Rota Centro - UFC" e "Manutenção do ônibus ABC1D23"
      Quando o aluno acessa a aba "Avisos"
      Então o sistema exibe os dois avisos com título e descrição


    # AC-05 - Aviso inativado fora do mural
    @fluxo_infeliz @prioridade_alta
    Cenário: Aluno não visualiza no mural o aviso que foi inativado
      Dado que o aviso "Manutenção do ônibus ABC1D23" foi inativado pelo administrador
      Quando o aluno acessa a aba "Avisos"
      Então o sistema não exibe o aviso "Manutenção do ônibus ABC1D23"


    # Mural sem avisos
    @fluxo_infeliz @prioridade_baixa
    Cenário: Sistema informa que não há avisos quando o mural está vazio
      Dado que não existe nenhum aviso ativo
      Quando o aluno acessa a aba "Avisos"
      Então o sistema informa que não há avisos no momento


    # AC-04 - Edição visível ao aluno
    @fluxo_feliz @prioridade_media
    Cenário: Aluno visualiza a descrição atualizada de um aviso editado
      Dado que o administrador editou a descrição do aviso "Alteração no horário da Rota Centro - UFC"
      Quando o aluno acessa a aba "Avisos"
      Então o sistema exibe a descrição atualizada do aviso


  Regra: Somente o administrador publica, edita e inativa avisos (RN-006)

    # RN-006 - Menu não exibido para outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @prioridade_alta
    Esquema do Cenário: Menu de gerenciamento de avisos não é exibido para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" está autenticado no sistema
      Quando esse usuário visualiza o menu principal
      Então o menu "Mural de Avisos" de gerenciamento não é exibido

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |


    # RN-006 - API nega acesso a outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega a publicação, edição e inativação de avisos para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" possui um token de acesso válido
      Quando esse usuário tenta publicar, editar e inativar um aviso pela API
      Então a API responde com o status "403 Forbidden" em todas as requisições
      E nenhum aviso é criado ou alterado

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |


    # RN-006 - Sem autenticação
    @fluxo_infeliz @regra_negocio @RN006 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API nega a publicação de aviso sem token de acesso
      Quando uma requisição de publicação de aviso é enviada sem token de acesso
      Então a API responde com o status "401 Unauthorized"
      E nenhum aviso é criado
