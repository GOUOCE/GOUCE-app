# =================================================================================
# ÉPICO: EP-001 - Autenticação e Gestão de Conta
# HISTÓRIA DE USUÁRIO: HU-005 - Edição de Perfil do Aluno
# REQUISITOS RELACIONADOS: RF-006 (Edição de Perfil)
# REQ. NÃO FUNCIONAIS: RNF-003 (HTTPS), RNF-010 (Privacidade e Proteção de Dados - LGPD)
# REGRA DE NEGÓCIO: -
# language: pt
# =================================================================================

@EP001 @HU005 @edicao_perfil
Funcionalidade: Edição de Perfil do Aluno
  Como aluno autenticado no aplicativo
  Quero acessar e editar os dados do meu perfil, como telefone e bairro de residência
  Para manter minhas informações de contato e localização sempre atualizadas no sistema

  Contexto:
    Dado que o aluno "Maria Souza" está autenticado no aplicativo
    E acessa a área "Meu Perfil"
    E o aplicativo possui conexão ativa com a API


  # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-01, AC-02, AC-08
  @fluxo_feliz @smoke @prioridade_alta
  Cenário: Aluno edita telefone e bairro de residência com sucesso
    Quando o aluno altera o campo "WhatsApp" para "(85) 98888-1111"
    E altera o campo "Bairro/Localidade" para "São José"
    E clica no botão "Salvar Alterações"
    Então o sistema valida as informações sem apontar erros
    E o sistema atualiza os dados do aluno no banco de dados
    E o sistema exibe a mensagem "Perfil atualizado com sucesso"
    E o aluno visualiza os dados já atualizados na tela


  # AC-03, AC-04 - Alteração de e-mail com confirmação de senha atual
  @fluxo_feliz @prioridade_alta
  Cenário: Aluno altera o e-mail cadastrado informando a senha atual para confirmação
    Quando o aluno altera o campo "E-mail" para "maria.nova@aluno.ufc.br"
    E informa a senha atual "Senha@123" no campo de confirmação
    E clica no botão "Salvar Alterações"
    Então o sistema valida que o novo e-mail é único no sistema
    E o sistema atualiza o e-mail do aluno
    E o sistema exibe a mensagem "Perfil atualizado com sucesso"


  # AC-03 - E-mail já em uso por outro usuário
  @fluxo_infeliz @prioridade_alta
  Cenário: Sistema bloqueia a alteração de e-mail para um endereço já utilizado por outro usuário
    Dado que já existe um usuário cadastrado com o e-mail "joao.pereira@aluno.ufc.br"
    Quando o aluno altera o campo "E-mail" para "joao.pereira@aluno.ufc.br"
    E informa a senha atual no campo de confirmação
    E clica no botão "Salvar Alterações"
    Então o sistema bloqueia a atualização
    E o sistema exibe a mensagem "Este e-mail já está em uso no sistema."


  # AC-04 - Confirmação de senha obrigatória para alterar e-mail
  @fluxo_infeliz @seguranca @prioridade_alta
  Cenário: Sistema exige a senha atual para confirmar a alteração do e-mail
    Quando o aluno altera o campo "E-mail" para "maria.nova@aluno.ufc.br"
    E clica no botão "Salvar Alterações" sem informar a senha atual
    Então o sistema bloqueia a atualização do e-mail
    E o sistema solicita a confirmação da senha atual


  # FA-001 - Dados inseridos com formato inválido (AC-05)
  @fluxo_infeliz @FA001 @validacao_campos @prioridade_media
  Esquema do Cenário: Sistema bloqueia o salvamento quando o dado informado está em formato inválido
    Quando o aluno altera o campo "<campo>" para "<valor_invalido>"
    E clica no botão "Salvar Alterações"
    Então o sistema bloqueia o salvamento
    E o sistema exibe um alerta de validação no campo "<campo>"

    Exemplos:
      | campo    | valor_invalido     |
      | E-mail   | maria.souzaufc.br  |
      | WhatsApp | 8599               |


  # FA-002 - Campos acadêmicos são somente leitura (AC-06)
  @fluxo_infeliz @FA002 @prioridade_media
  Cenário: Sistema mantém campos acadêmicos desabilitados na tela de edição
    Então os campos "Instituição", "Curso", "Campus" e "Período de ingresso" são exibidos como somente leitura
    E o aluno não consegue alterar o valor desses campos diretamente pelo aplicativo


  # FA-003 - Falha de comunicação ao salvar (AC-07)
  @fluxo_infeliz @FA003 @conectividade @prioridade_alta
  Cenário: Sistema preserva os dados preenchidos quando há falha de comunicação ao salvar o perfil
    Dado que o aluno alterou o campo "WhatsApp" para "(85) 98888-1111"
    Mas a comunicação com a API está indisponível
    Quando o aluno clica no botão "Salvar Alterações"
    Então o sistema exibe a mensagem "Não foi possível salvar as alterações. Verifique sua conexão e tente novamente."
    E o sistema mantém os dados preenchidos na tela para uma nova tentativa
