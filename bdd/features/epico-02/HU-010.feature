# =================================================================================
# ÉPICO: EP-002 - Gestão de Cadastros Base
# HISTÓRIA DE USUÁRIO: HU-010 - Gerenciamento de Motoristas
# REQUISITOS RELACIONADOS: RF-009 (Gerenciamento de Motoristas), RF-014 (Soft Delete)
# REQ. NÃO FUNCIONAIS: RNF-012 (Integridade dos Dados), RNF-013 (Auditoria)
# REGRA DE NEGÓCIO: RN-004 (Preservação de Histórico), RN-006 (Exclusividade Administrativa)
# language: pt
# =================================================================================

@EP002 @HU010 @gestao_motoristas
Funcionalidade: Gerenciamento de Motoristas
  Como administrador
  Quero cadastrar, visualizar, buscar, editar, inativar e reativar motoristas
  Para gerenciar a equipe de profissionais que conduz os veículos nas rotas do transporte universitário

  Contexto:
    Dado que o administrador está autenticado no sistema
    E acessa a tela "Motoristas"
    E o aplicativo possui conexão ativa com a API


  # AC-01 - Listagem de motoristas ativos
  @fluxo_feliz @prioridade_media
  Cenário: Administrador visualiza a listagem de motoristas ativos com nome e telefone
    Dado que existem os motoristas ativos "José Ferreira" e "Antônio Lima"
    E existe o motorista inativo "Raimundo Costa"
    Quando o administrador visualiza a listagem de motoristas
    Então o sistema exibe "José Ferreira" e "Antônio Lima" com nome e telefone
    E o sistema não exibe "Raimundo Costa" na listagem de ativos


  # AC-01 - Busca por nome
  @fluxo_feliz @prioridade_media
  Cenário: Administrador filtra a listagem de motoristas pelo nome
    Dado que existem os motoristas ativos "José Ferreira" e "Antônio Lima"
    Quando o administrador digita "José" na barra de pesquisa "Buscar por nome"
    Então o sistema exibe apenas o motorista "José Ferreira"


  # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-02, AC-07
  @fluxo_feliz @smoke @prioridade_alta
  Cenário: Administrador cadastra um novo motorista com sucesso
    Quando o administrador clica em "+ Novo"
    E preenche o campo "Nome Completo" com "Francisco Alves"
    E preenche o campo "Telefone" com "(88) 9 9811-2233"
    E clica no botão "Finalizar cadastro"
    Então o sistema valida que o telefone é único
    E o sistema cadastra o motorista "Francisco Alves"
    E o sistema exibe uma notificação de confirmação
    E a listagem de motoristas é atualizada com o novo registro


  # FA-002 - Cadastro duplicado (AC-03)
  # Observação: o AC-02/AC-03 usam o telefone como identificador único; o FA-002 cita CNH ou CPF
  # e o RF-009 cita número e categoria da CNH. Os cenários seguem os ACs (telefone).
  @fluxo_infeliz @FA002 @prioridade_alta
  Esquema do Cenário: Sistema bloqueia o cadastro de motorista com telefone já existente
    Dado que já existe um motorista com o telefone "(88) 9 9811-2233" e status "<status_existente>"
    Quando o administrador clica em "+ Novo"
    E preenche o campo "Nome Completo" com "Francisco Alves Filho"
    E preenche o campo "Telefone" com "(88) 9 9811-2233"
    E clica no botão "Finalizar cadastro"
    Então o sistema bloqueia o cadastro
    E o sistema exibe a mensagem "Este profissional já está registrado."

    Exemplos:
      | status_existente |
      | ativo            |
      | inativo          |


  # FA-003 - Campos obrigatórios ausentes (AC-08)
  @fluxo_infeliz @FA003 @validacao_campos @prioridade_alta
  Esquema do Cenário: Sistema bloqueia o salvamento quando um campo obrigatório não é preenchido
    Quando o administrador clica em "+ Novo"
    E deixa o campo "<campo_obrigatorio>" vazio
    E preenche os demais campos obrigatórios corretamente
    E clica no botão "Finalizar cadastro"
    Então o sistema destaca o campo "<campo_obrigatorio>" como obrigatório
    E o sistema não salva o motorista

    Exemplos:
      | campo_obrigatorio |
      | Nome Completo     |
      | Telefone          |


  # AC-04 - Edição de motorista existente
  @fluxo_feliz @prioridade_alta
  Cenário: Administrador edita os dados de um motorista existente
    Dado que existe o motorista ativo "Francisco Alves"
    Quando o administrador seleciona a ação "Editar" para "Francisco Alves"
    E altera o campo "Telefone" para "(88) 9 9700-4455" na tela "Editar Motorista"
    E clica no botão "Salvar alterações"
    Então o sistema atualiza os dados do motorista
    E o sistema exibe uma notificação de confirmação
    E a listagem exibe "Francisco Alves" com o telefone "(88) 9 9700-4455"


  # AC-05, AC-07 - Inativação com confirmação, soft delete e auditoria
  @fluxo_feliz @auditoria @RF014 @prioridade_alta
  Cenário: Administrador inativa um motorista sem alocações futuras
    Dado que existe o motorista ativo "Francisco Alves" sem alocações para dias futuros
    Quando o administrador seleciona a ação "Inativar" para "Francisco Alves"
    E confirma a inativação no modal de confirmação
    Então o sistema aplica o soft delete no registro de "Francisco Alves"
    E o registro permanece no banco de dados
    E o sistema registra no log de auditoria o usuário responsável, a ação e o timestamp
    E o sistema exibe uma notificação de confirmação
    E a listagem de motoristas é atualizada


  # AC-05 - Cancelamento da inativação no modal
  @fluxo_infeliz @prioridade_media
  Cenário: Motorista permanece ativo quando o administrador cancela a inativação
    Dado que existe o motorista ativo "Francisco Alves"
    Quando o administrador seleciona a ação "Inativar" para "Francisco Alves"
    E cancela a operação no modal de confirmação
    Então o motorista "Francisco Alves" permanece ativo
    E nenhum registro de auditoria é gerado


  # AC-05 - Reativação com auditoria
  @fluxo_feliz @auditoria @RF014 @prioridade_media
  Cenário: Administrador reativa um motorista previamente inativado
    Dado que existe o motorista "Raimundo Costa" com status inativo
    Quando o administrador ativa a chave "Mostrar inativos"
    E seleciona a ação "Reativar" para "Raimundo Costa"
    E confirma a reativação
    Então o sistema altera o status de "Raimundo Costa" para ativo
    E o sistema registra no log de auditoria o usuário responsável, a ação e o timestamp
    E o sistema exibe uma notificação de confirmação


  # FA-001 - Inativação de motorista com alocação futura (AC-06, RNF-012)
  @fluxo_infeliz @FA001 @RNF012 @prioridade_alta @depende_de_HU017
  Cenário: Sistema bloqueia a inativação de motorista escalado para rotas em dias futuros
    Dado que o motorista "José Ferreira" está escalado para realizar uma rota em um dia futuro
    Quando o administrador seleciona a ação "Inativar" para "José Ferreira"
    E confirma a inativação
    Então o sistema bloqueia a inativação
    E o sistema exibe a mensagem "Este profissional possui alocações pendentes e não pode ser inativado no momento."
    E o motorista "José Ferreira" permanece ativo


  # AC-09 - Visualização de registros inativos
  @fluxo_feliz @prioridade_media
  Cenário: Administrador visualiza os motoristas inativos ao ativar "Mostrar inativos"
    Dado que existe o motorista "Raimundo Costa" com status inativo
    Quando o administrador ativa a chave "Mostrar inativos"
    Então o sistema exibe a seção "Inativos" na listagem
    E o motorista "Raimundo Costa" aparece na seção "Inativos"


  # RN-004 - Preservação de histórico após inativação
  @regra_negocio @RN004 @teste_api @nao_automatizavel_via_appium @prioridade_media
  Cenário: Inativação de motorista preserva os registros históricos vinculados a ele
    Dado que o motorista "Francisco Alves" possui registros de alocação e relatórios de períodos anteriores
    Quando o administrador inativa o motorista "Francisco Alves"
    Então os registros de alocação e relatórios de períodos anteriores permanecem inalterados


  # RN-006 - Acesso restrito ao Administrador
  @fluxo_infeliz @regra_negocio @RN006 @prioridade_alta
  Esquema do Cenário: Sistema nega acesso à gestão de motoristas para usuários sem perfil administrativo
    Dado que um usuário com perfil "<perfil>" está autenticado no sistema
    Quando esse usuário tenta acessar a tela "Motoristas"
    Então o sistema nega o acesso com erro "403 Forbidden"

    Exemplos:
      | perfil        |
      | Aluno         |
      | Representante |
