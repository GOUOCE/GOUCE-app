# =================================================================================
# ÉPICO: EP-001 - Autenticação e Gestão de Conta
# HISTÓRIA DE USUÁRIO: HU-004 - Recuperação de Senha
# REQUISITOS RELACIONADOS: RF-002 (Recuperação de Senha)
# REQ. NÃO FUNCIONAIS: RNF-002 (Hash de senha), RNF-003 (HTTPS)
# REGRA DE NEGÓCIO: -
# language: pt
# =================================================================================

@EP001 @HU004 @recuperacao_senha
Funcionalidade: Recuperação de Senha
  Como usuário com conta previamente cadastrada
  Quero solicitar a recuperação da minha senha esquecida através do meu e-mail
  Para poder cadastrar uma nova credencial e recuperar o acesso ao sistema de forma segura

  Contexto:
    Dado que o usuário está na tela de "Login" do aplicativo
    E o aplicativo possui conexão ativa com a API


  # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-01, AC-02, AC-05, AC-08, AC-09
  @fluxo_feliz @smoke @prioridade_alta
  Cenário: Aluno recupera a senha com sucesso e acessa o sistema com a nova credencial
    Dado que existe um aluno cadastrado com o e-mail "maria.souza@aluno.ufc.br"
    Quando o usuário toca na opção "Esqueci minha senha"
    E informa o e-mail "maria.souza@aluno.ufc.br"
    E confirma a solicitação de recuperação
    Então o sistema gera um link de recuperação com tempo de expiração
    E o sistema envia o link para o e-mail "maria.souza@aluno.ufc.br"
    Quando o usuário acessa o link de recuperação válido
    E preenche o campo "Nova Senha" com "NovaSenha@1"
    E preenche o campo "Confirmar Nova Senha" com "NovaSenha@1"
    E toca no botão "Redefinir Senha"
    Então o sistema exibe a mensagem de confirmação "Senha redefinida com sucesso"
    E o usuário é redirecionado para a tela de login
    Quando o usuário realiza login com o e-mail "maria.souza@aluno.ufc.br" e a senha "NovaSenha@1"
    Então o sistema autentica o usuário com sucesso


  # AC-09 - Senha antiga deixa de ser válida após redefinição
  @fluxo_infeliz @seguranca @prioridade_alta
  Cenário: Sistema rejeita login com a senha antiga após redefinição bem-sucedida
    Dado que o aluno "maria.souza@aluno.ufc.br" redefiniu sua senha de "Senha@123" para "NovaSenha@1"
    Quando o usuário tenta realizar login com o e-mail "maria.souza@aluno.ufc.br" e a senha "Senha@123"
    Então o sistema bloqueia o acesso
    E o sistema exibe a mensagem "E-mail ou senha incorretos. Tente novamente."


  # FA-001 - E-mail não cadastrado, sem revelar a existência da conta (AC-03)
  @fluxo_infeliz @FA001 @seguranca @prioridade_alta
  Cenário: Sistema não revela se o e-mail informado está cadastrado ao solicitar recuperação
    Dado que não existe cadastro associado ao e-mail "desconhecido@aluno.ufc.br"
    Quando o usuário toca na opção "Esqueci minha senha"
    E informa o e-mail "desconhecido@aluno.ufc.br"
    E confirma a solicitação de recuperação
    Então o sistema exibe a mensagem "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação"
    E nenhum e-mail de recuperação é efetivamente enviado


  # FA-002 - Link ou token expirado/já utilizado (AC-04)
  @fluxo_infeliz @FA002 @seguranca @prioridade_alta
  Esquema do Cenário: Sistema bloqueia o acesso à redefinição de senha com link inválido
    Dado que o usuário possui um link de recuperação que está "<situacao_do_link>"
    Quando o usuário tenta acessar a tela de nova senha através desse link
    Então o sistema bloqueia o acesso à tela de redefinição
    E o sistema exibe a mensagem "Link de recuperação expirado ou inválido. Por favor, solicite novamente."

    Exemplos:
      | situacao_do_link          |
      | expirado                  |
      | já utilizado anteriormente |


  # AC-05 - Regras de complexidade da nova senha
  @fluxo_infeliz @regra_senha @prioridade_alta
  Esquema do Cenário: Sistema bloqueia a redefinição quando a nova senha não atende às regras de complexidade
    Dado que o usuário acessou um link de recuperação válido
    Quando o usuário informa "<nova_senha>" no campo "Nova Senha"
    E informa "<nova_senha>" no campo "Confirmar Nova Senha"
    E toca no botão "Redefinir Senha"
    Então o sistema bloqueia a redefinição
    E o sistema sinaliza que a senha não atende aos critérios mínimos de complexidade

    Exemplos:
      | nova_senha |
      | Abc123     |
      | abcdefgh1  |
      | ABCDEFGH1  |
      | Abcdefgh   |


  # FA-003 - Divergência entre nova senha e confirmação (AC-06)
  @fluxo_infeliz @FA003 @validacao_campos @prioridade_media
  Cenário: Sistema desabilita o envio quando a nova senha e a confirmação não coincidem
    Dado que o usuário acessou um link de recuperação válido
    Quando o usuário informa "NovaSenha@1" no campo "Nova Senha"
    E informa "NovaSenha@2" no campo "Confirmar Nova Senha"
    Então o sistema desabilita o botão "Redefinir Senha"
    E o sistema sinaliza que as senhas não coincidem


  # FA-004 - Falha no envio do e-mail de recuperação (AC-07)
  @fluxo_infeliz @FA004 @conectividade @prioridade_media
  Cenário: Sistema orienta nova tentativa quando falha o envio do e-mail de recuperação
    Dado que o serviço de envio de e-mails (SMTP) está indisponível
    Quando o usuário solicita a recuperação de senha para um e-mail cadastrado
    Então o sistema exibe uma mensagem orientando o usuário a tentar novamente em alguns minutos
    E a aplicação não trava nem retorna erro não tratado


  # REQUISITOS NÃO FUNCIONAIS - validação recomendada via testes de API/backend
  @nao_funcional @seguranca @RNF002 @teste_api @nao_automatizavel_via_appium
  Cenário: Nova senha é armazenada com hash seguro e irreversível
    Dado que um usuário concluiu a redefinição de senha para "NovaSenha@1"
    Quando o registro do usuário é consultado diretamente no banco de dados
    Então o campo de senha não contém o valor "NovaSenha@1" em texto puro
    E o valor armazenado corresponde a um hash seguro e irreversível

  @nao_funcional @seguranca @RNF003 @teste_api @nao_automatizavel_via_appium
  Cenário: Comunicação de recuperação de senha entre aplicativo e API ocorre exclusivamente via HTTPS
    Quando o aplicativo envia a requisição de recuperação de senha para a API
    Então a requisição é realizada utilizando o protocolo HTTPS
    E nenhuma informação é transmitida via HTTP não criptografado
