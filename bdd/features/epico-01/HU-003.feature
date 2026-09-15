# =================================================================================
# ÉPICO: EP-001 - Autenticação e Gestão de Conta
# HISTÓRIA DE USUÁRIO: HU-003 - Controle de Acesso por Perfil
# REQUISITOS RELACIONADOS: RF-003 (Controle de Acesso por Perfil), RF-021 (Frequência - Representante)
# REQ. NÃO FUNCIONAIS: RNF-009 (Segurança - Controle de Acesso)
# REGRA DE NEGÓCIO: RN-006 (Exclusividade Administrativa), RN-015 (Atuação do Representante)
# language: pt
# =================================================================================

@EP001 @HU003 @controle_acesso
Funcionalidade: Controle de Acesso por Perfil
  Como administrador do sistema
  Quero que o aplicativo restrinja o acesso a menus, telas e ações de acordo com o perfil do usuário logado
  Para garantir a integridade dos dados e impedir operações não autorizadas

  Contexto:
    Dado que o aplicativo possui conexão ativa com a API


  # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-01, AC-02, AC-03, AC-04
  @fluxo_feliz @smoke @prioridade_alta
  Esquema do Cenário: Sistema exibe apenas os menus permitidos para cada perfil de usuário autenticado
    Dado que o usuário realizou login com sucesso com o perfil "<perfil>"
    Quando o sistema renderiza a interface principal
    Então o usuário visualiza os menus "<menus_visiveis>"
    E o usuário não visualiza os menus "<menus_ocultos>"

    Exemplos:
      | perfil        | menus_visiveis                                                                               | menus_ocultos                                                         |
      | Aluno         | Agendamento de Transporte, Minha Alocação, Mural de Avisos, Carteirinha Digital, Meu Perfil | Gestão de Frota, Gestão de Motoristas, Gestão de Rotas, Relatórios    |
      | Representante | Lista de Embarque, Frequência da Rota do Dia                                                | Gestão de Frota, Gestão de Administradores, Agendamento de Transporte |
      | Administrador | Gestão de Frota, Gestão de Motoristas, Gestão de Rotas, Gestão de Faculdades, Relatórios, Mural de Avisos | Nenhum                                                          |


  # RN-015 - Atuação restrita do Representante
  @regra_negocio @RN015 @prioridade_alta
  Cenário: Representante acessa exclusivamente a lista de embarque e o registro de frequência da sua universidade
    Dado que o usuário realizou login com sucesso com o perfil "Representante"
    Quando o sistema renderiza a interface principal
    Então o usuário visualiza apenas a lista de embarque e o controle de frequência dos alunos vinculados à universidade sob sua responsabilidade
    E o usuário não visualiza nenhuma funcionalidade administrativa exclusiva do Administrador


  # RN-006 - Exclusividade administrativa para entidades centrais
  @regra_negocio @RN006 @prioridade_alta
  Esquema do Cenário: Apenas o perfil Administrador executa ações de cadastro, edição, inativação e publicação de avisos
    Dado que o usuário realizou login com sucesso com o perfil "<perfil>"
    Quando o usuário tenta executar a ação "<acao_restrita>"
    Então o sistema "<resultado>"

    Exemplos:
      | perfil        | acao_restrita               | resultado                                |
      | Administrador | cadastrar um novo ônibus    | permite a execução da ação               |
      | Aluno         | cadastrar um novo ônibus    | bloqueia a ação e exibe "Acesso Negado"  |
      | Representante | publicar um aviso no mural  | bloqueia a ação e exibe "Acesso Negado"  |


  # FA-001 - Tentativa de acesso a rota/tela não autorizada (AC-05, AC-06)
  @fluxo_infeliz @FA001 @seguranca @prioridade_alta
  Cenário: Sistema bloqueia tentativa de acesso direto a endpoint administrativo por usuário sem privilégio
    Dado que o usuário realizou login com sucesso com o perfil "Aluno"
    Quando o usuário tenta acessar diretamente uma rota ou endpoint restrito ao perfil "Administrador"
    Então a API retorna o código de erro "403 Forbidden"
    E o aplicativo exibe a mensagem "Acesso Negado"
    E nenhum dado sensível é exposto na resposta


  # AC-07 - Validação de token e perfil em toda requisição
  @nao_funcional @seguranca @RNF009 @teste_api @nao_automatizavel_via_appium
  Cenário: Sistema valida token e perfil em toda requisição à API, não apenas no momento do login
    Dado que o usuário está autenticado com um token de sessão válido
    Quando o usuário realiza qualquer requisição às funcionalidades do sistema
    Então a API valida o token e o perfil do usuário antes de processar a requisição
    E requisições com token inválido ou expirado são rejeitadas


  # FA-002 - Alteração de perfil durante sessão ativa (AC-08)
  @fluxo_infeliz @FA002 @seguranca @prioridade_media
  Cenário: Sistema revoga o acesso e exige novo login após alteração do perfil durante uma sessão ativa
    Dado que o usuário "Carlos Andrade" está com sessão ativa no perfil "Aluno"
    E um administrador altera o perfil desse usuário para "Administrador" durante a sessão em curso
    Quando o usuário realiza uma nova requisição ao sistema
    Então o sistema identifica a divergência entre o perfil da sessão e o perfil atual do usuário
    E o sistema revoga o acesso da sessão em curso
    E o sistema exige um novo login para atualizar as permissões
