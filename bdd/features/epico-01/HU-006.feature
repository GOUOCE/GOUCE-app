# =================================================================================
# ÉPICO: EP-001 - Autenticação e Gestão de Conta
# HISTÓRIA DE USUÁRIO: HU-006 - Gerenciamento de Administradores
# REQUISITOS RELACIONADOS: RF-001, RF-007 (Gerenciamento de Administradores)
# REQ. NÃO FUNCIONAIS: RNF-003 (HTTPS), RNF-013 (Auditoria)
# REGRA DE NEGÓCIO: RN-001, RN-003, RN-006 (Exclusividade Administrativa)
# language: pt
# =================================================================================

@EP001 @HU006 @gestao_administradores
Funcionalidade: Gerenciamento de Administradores
  Como administrador logado
  Quero acessar um painel para criar, visualizar, editar e inativar perfis com privilégios administrativos
  Para gerenciar os membros da equipe que têm acesso restrito e controle sobre as operações de transporte

  Contexto:
    Dado que o administrador está autenticado no sistema
    E acessa o menu "Gestão de Administradores"
    E o aplicativo possui conexão ativa com a API


  # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-02
  @fluxo_feliz @smoke @prioridade_alta
  Cenário: Administrador cria um novo perfil administrativo com sucesso
    Quando o administrador clica em "Novo Administrador"
    E preenche o campo "Nome" com "Carlos Andrade"
    E preenche o campo "E-mail" com "carlos.andrade@atu.ce.gov.br"
    E clica no botão "Salvar"
    Então o sistema valida que o e-mail é único
    E o sistema cria o novo perfil administrativo
    E o sistema exibe a mensagem "Operação realizada com sucesso"
    E a listagem de administradores é atualizada com o novo registro


  # FA-001 - E-mail já utilizado (AC-03)
  @fluxo_infeliz @FA001 @prioridade_alta
  Cenário: Sistema bloqueia a criação de administrador com e-mail já utilizado
    Dado que já existe um usuário cadastrado com o e-mail "carlos.andrade@atu.ce.gov.br"
    Quando o administrador clica em "Novo Administrador"
    E preenche o campo "Nome" com "Carlos Andrade Filho"
    E preenche o campo "E-mail" com "carlos.andrade@atu.ce.gov.br"
    E clica no botão "Salvar"
    Então o sistema bloqueia a criação
    E o sistema exibe a mensagem "Este e-mail já está em uso por outro usuário no sistema."


  # AC-04 - Edição de administrador existente
  @fluxo_feliz @prioridade_alta
  Cenário: Administrador edita os dados de um perfil administrativo existente
    Dado que existe um administrador ativo chamado "Carlos Andrade"
    Quando o administrador seleciona "Carlos Andrade" na listagem
    E altera o campo "Nome" para "Carlos Andrade Filho"
    E clica no botão "Salvar"
    Então o sistema atualiza os dados do administrador
    E o sistema exibe a mensagem "Operação realizada com sucesso"


  # AC-05, AC-07 - Inativação com registro em auditoria
  @fluxo_feliz @auditoria @prioridade_alta
  Cenário: Administrador inativa um perfil administrativo e a ação é registrada em log de auditoria
    Dado que existe um administrador ativo chamado "Carlos Andrade"
    Quando o administrador seleciona a ação "Inativar" para "Carlos Andrade"
    E confirma a inativação
    Então o sistema aplica o soft delete no registro de "Carlos Andrade"
    E o registro permanece no banco de dados
    E o sistema gera um registro de auditoria contendo usuário responsável, ação e timestamp
    E o sistema exibe a mensagem "Operação realizada com sucesso"


  # FA-002 - Tentativa de auto-inativação (AC-06)
  @fluxo_infeliz @FA002 @prioridade_alta
  Cenário: Sistema bloqueia a tentativa de um administrador inativar a própria conta
    Dado que o administrador logado é "Carlos Andrade"
    Quando o administrador seleciona a ação "Inativar" para a própria conta "Carlos Andrade"
    Então o sistema bloqueia a ação
    E o sistema exibe a mensagem "Não é possível inativar a conta atualmente em uso."


  # Esclarecimento: inativação de outro administrador é permitida (restrição é só de auto-inativação)
  @fluxo_feliz @prioridade_alta
  Cenário: Um administrador consegue inativar outro administrador (apenas auto-inativação é bloqueada)
    Dado que existe um administrador "João Silva" cadastrado e ativo
    E o administrador logado é "Maria Costa" (diferente de João Silva)
    Quando o administrador "Maria Costa" seleciona a ação "Inativar" para "João Silva"
    E confirma a inativação
    Então o sistema aplica soft delete no registro de "João Silva"
    E o sistema gera um registro de auditoria contendo usuário responsável ("Maria Costa"), ação e timestamp
    E o sistema exibe a mensagem "Operação realizada com sucesso"
    E a listagem de administradores é atualizada removendo "João Silva" dos ativos


  # AC-08 - Visualização de administradores inativos
  @fluxo_feliz @prioridade_media
  Cenário: Administrador visualiza perfis administrativos inativos na listagem
    Dado que existe ao menos um administrador com status inativo
    Quando o administrador aplica o filtro "Exibir inativos"
    Então o sistema exibe os perfis administrativos inativos na listagem


  # FA-003 - Restrição de acesso ao menu (AC-09, RN-006)
  @fluxo_infeliz @FA003 @regra_negocio @RN006 @prioridade_alta
  Cenário: Sistema nega acesso ao menu de Gestão de Administradores para usuários sem privilégio administrativo
    Dado que um usuário com perfil "Aluno" está autenticado no sistema
    Quando esse usuário tenta acessar o menu "Gestão de Administradores"
    Então o sistema nega o acesso com erro "403 Forbidden"
    E o usuário é redirecionado para fora da área restrita
