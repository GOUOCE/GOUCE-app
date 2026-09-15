# =================================================================================
# ÉPICO: EP-001 - Autenticação e Gestão de Conta
# HISTÓRIA DE USUÁRIO: HU-002 - Login de Usuários
# REQUISITOS RELACIONADOS: RF-001 (Autenticação/Login)
# REQ. NÃO FUNCIONAIS: RNF-001 (Tempo de resposta), RNF-002 (Hash de senha), RNF-003 (HTTPS)
# REGRA DE NEGÓCIO: -
# language: pt
# =================================================================================

@EP001 @HU002 @login
Funcionalidade: Login de Usuários
  Como usuário (aluno, representante ou administrador)
  Quero acessar o sistema utilizando meu e-mail e senha
  Para autenticar minha identidade e acessar as funcionalidades restritas à minha conta

  Contexto:
    Dado que o usuário abre o aplicativo e está na tela "Login"
    E o aplicativo possui conexão ativa com a API


  # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-01, AC-05, AC-07, AC-08
  @fluxo_feliz @smoke @prioridade_alta
  Cenário: Login bem-sucedido de aluno com credenciais válidas
    Dado que existe um aluno cadastrado e ativo com e-mail "maria.souza@aluno.ufc.br" e senha "Senha@123"
    Quando o usuário seleciona o perfil de acesso "Aluno"
    E preenche o campo "E-mail" com "maria.souza@aluno.ufc.br"
    E preenche o campo "Senha" com "Senha@123"
    E toca no botão "Entrar"
    Então o sistema autentica o usuário com sucesso em até 3 segundos
    E o sistema gera um token de sessão
    E o usuário é redirecionado para a interface correspondente ao perfil "Aluno"


  # AC-08 - Seleção obrigatória do perfil de acesso antes das credenciais
  @fluxo_infeliz @AC08 @prioridade_media
  Cenário: Sistema exige a seleção do perfil de acesso antes de permitir o login
    Quando o usuário preenche o campo "E-mail" com "maria.souza@aluno.ufc.br"
    E preenche o campo "Senha" com "Senha@123"
    E toca no botão "Entrar" sem selecionar um perfil de acesso
    Então o sistema bloqueia a tentativa de login
    E o sistema sinaliza que é necessário escolher o perfil de acesso (Aluno ou Administrador)


  # FA-002 - Campos obrigatórios não preenchidos (AC-02)
  @fluxo_infeliz @FA002 @validacao_campos @prioridade_alta
  Esquema do Cenário: Sistema bloqueia o login quando um campo obrigatório não é preenchido
    Dado que o usuário selecionou o perfil de acesso "Aluno"
    Quando o usuário tenta entrar com o campo "<campo_obrigatorio>" vazio
    E toca no botão "Entrar"
    Então o sistema bloqueia a ação
    E o sistema destaca o campo "<campo_obrigatorio>" como pendente

    Exemplos:
      | campo_obrigatorio |
      | E-mail             |
      | Senha              |


  # FA-001 - E-mail não cadastrado (AC-03)
  @fluxo_infeliz @FA001 @seguranca @prioridade_alta
  Cenário: Sistema bloqueia o acesso e exibe mensagem genérica para e-mail não cadastrado
    Dado que não existe cadastro associado ao e-mail "inexistente@aluno.ufc.br"
    Quando o usuário seleciona o perfil de acesso "Aluno"
    E preenche o campo "E-mail" com "inexistente@aluno.ufc.br"
    E preenche o campo "Senha" com "QualquerSenha@1"
    E toca no botão "Entrar"
    Então o sistema bloqueia o acesso
    E o sistema exibe a mensagem "E-mail ou senha incorretos. Tente novamente."


  # FA-001 - Senha incorreta (AC-03)
  @fluxo_infeliz @FA001 @seguranca @prioridade_alta
  Cenário: Sistema bloqueia o acesso e exibe mensagem genérica para senha incorreta
    Dado que existe um aluno cadastrado e ativo com e-mail "maria.souza@aluno.ufc.br" e senha "Senha@123"
    Quando o usuário seleciona o perfil de acesso "Aluno"
    E preenche o campo "E-mail" com "maria.souza@aluno.ufc.br"
    E preenche o campo "Senha" com "SenhaErrada@1"
    E toca no botão "Entrar"
    Então o sistema bloqueia o acesso
    E o sistema exibe a mensagem "E-mail ou senha incorretos. Tente novamente."
    E o sistema não informa qual dos dois campos está incorreto


  # FA-003 - Usuário com cadastro inativado (AC-04)
  @fluxo_infeliz @FA003 @regra_negocio @prioridade_alta
  Cenário: Sistema impede login de usuário com cadastro inativado
    Dado que existe um administrador com e-mail "carlos.andrade@atu.ce.gov.br" cujo cadastro foi inativado (soft delete)
    Quando o usuário seleciona o perfil de acesso "Administrador"
    E preenche o campo "E-mail" com "carlos.andrade@atu.ce.gov.br"
    E preenche o campo "Senha" com a senha correta
    E toca no botão "Entrar"
    Então o sistema impede o login
    E o sistema exibe a mensagem "Usuário inativo. Entre em contato com a coordenação."


  # FA-004 - Falha na conexão com a API (AC-06)
  @fluxo_infeliz @FA004 @conectividade @prioridade_alta
  Cenário: Sistema exibe mensagem de erro quando há falha de comunicação com a API durante o login
    Dado que o usuário selecionou o perfil de acesso "Aluno"
    E preencheu o campo "E-mail" com "maria.souza@aluno.ufc.br"
    E preencheu o campo "Senha" com "Senha@123"
    Mas a comunicação com a API está indisponível
    Quando o usuário toca no botão "Entrar"
    Então o sistema exibe uma mensagem de erro de conexão
    E o sistema mantém os dados já digitados para uma nova tentativa


  # REQUISITOS NÃO FUNCIONAIS - validação recomendada via testes de API/backend
  @nao_funcional @desempenho @RNF001 @teste_api @nao_automatizavel_via_appium
  Cenário: Tempo de resposta do login não ultrapassa 3 segundos
    Dado que existe um aluno cadastrado e ativo com credenciais válidas
    Quando o usuário realiza o login em condições normais de conexão com a internet
    Então o sistema retorna a resposta de autenticação em até 3 segundos

  @nao_funcional @seguranca @RNF003 @teste_api @nao_automatizavel_via_appium
  Cenário: Comunicação de login entre aplicativo e API ocorre exclusivamente via HTTPS
    Quando o aplicativo envia a requisição de login para a API
    Então a requisição é realizada utilizando o protocolo HTTPS
    E nenhuma credencial é transmitida via HTTP não criptografado
