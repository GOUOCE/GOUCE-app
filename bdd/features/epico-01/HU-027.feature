# =================================================================================
# ÉPICO: EP-001 - Autenticação e Gestão de Conta
# HISTÓRIA DE USUÁRIO: HU-027 - Avaliação de Solicitação de Cadastro
# REQUISITOS RELACIONADOS: RF-031 (Avaliação de Solicitação de Cadastro)
# REQ. NÃO FUNCIONAIS: RNF-016 (Armazenamento de Arquivos em Nuvem)
# REGRA DE NEGÓCIO: RN-006 (Exclusividade Administrativa), RN-012 (Reprovação de Cadastro)
# language: pt
# =================================================================================

@EP001 @HU027 @avaliacao_cadastro
Funcionalidade: Avaliação de Solicitação de Cadastro
  Como administrador
  Quero acessar a fila de solicitações de cadastro pendentes, visualizar os dados e documentos anexados pelo aluno
  Para decidir se aprovo ou reprovo o pedido, garantindo que apenas estudantes elegíveis utilizem o transporte

  Contexto:
    Dado que o administrador está autenticado no sistema
    E acessa o menu "Solicitações Pendentes"
    E o aplicativo possui conexão ativa com a API


  # AC-02 - Ordenação da fila de pendentes
  @fluxo_feliz @prioridade_media
  Cenário: Fila de solicitações pendentes é exibida ordenada do pedido mais antigo para o mais recente
    Dado que existem solicitações de cadastro pendentes enviadas em datas diferentes
    Quando o administrador visualiza a listagem de "Solicitações Pendentes"
    Então o sistema exibe os pedidos ordenados do mais antigo para o mais recente


  # AC-03 - Visualização de dados e documentos anexados
  @fluxo_feliz @prioridade_alta
  Cenário: Administrador visualiza os dados e documentos de um aluno na fila de avaliação
    Dado que existe uma solicitação de cadastro pendente do aluno "Maria Souza"
    Quando o administrador seleciona o cadastro de "Maria Souza" na fila
    Então o sistema exibe todos os dados pessoais e acadêmicos preenchidos por "Maria Souza"
    E o sistema disponibiliza os documentos anexados para visualização e download


  # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-04, AC-08
  @fluxo_feliz @smoke @prioridade_alta
  Cenário: Administrador aprova uma solicitação de cadastro
    Dado que existe uma solicitação de cadastro pendente do aluno "Maria Souza"
    Quando o administrador seleciona o cadastro de "Maria Souza"
    E toca no botão "Aprovar"
    Então o sistema atualiza o status do aluno para "Aprovado"
    E o sistema remove o registro da fila de pendentes
    E o sistema dispara uma notificação informando "Maria Souza" sobre a liberação do acesso
    E o sistema exibe a mensagem "Solicitação avaliada com sucesso"


  # FA-001 - Reprovação com motivo obrigatório (AC-05, AC-07, RN-012)
  @fluxo_infeliz @FA001 @regra_negocio @RN012 @prioridade_alta
  Cenário: Administrador reprova uma solicitação de cadastro informando o motivo
    Dado que existe uma solicitação de cadastro pendente do aluno "João Pereira"
    Quando o administrador seleciona o cadastro de "João Pereira"
    E toca no botão "Reprovar"
    E informa o motivo "Comprovante de matrícula desatualizado"
    E confirma a reprovação
    Então o sistema atualiza o status do aluno para "Reprovado"
    E o sistema armazena a justificativa informada
    E o sistema notifica "João Pereira" com o motivo da reprovação, permitindo reenvio para nova avaliação
    E o sistema exibe a mensagem "Solicitação avaliada com sucesso"


  # AC-06 - Motivo de reprovação obrigatório
  @fluxo_infeliz @validacao_campos @prioridade_alta
  Cenário: Sistema bloqueia a confirmação da reprovação quando o motivo não é preenchido
    Dado que existe uma solicitação de cadastro pendente do aluno "João Pereira"
    Quando o administrador seleciona o cadastro de "João Pereira"
    E toca no botão "Reprovar"
    E tenta confirmar a reprovação sem preencher o campo de motivo
    Então o sistema bloqueia a confirmação
    E o sistema destaca o campo de motivo como obrigatório


  # AC-01 - Acesso restrito ao Administrador (RN-006)
  @regra_negocio @RN006 @prioridade_alta
  Cenário: Acesso ao menu de Solicitações Pendentes é restrito ao perfil Administrador
    Dado que um usuário com perfil "Aluno" está autenticado no sistema
    Quando esse usuário tenta acessar o menu "Solicitações Pendentes"
    Então o sistema nega o acesso com erro "403 Forbidden"
