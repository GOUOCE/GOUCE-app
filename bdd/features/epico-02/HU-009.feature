# =================================================================================
# ÉPICO: EP-002 - Gestão de Cadastros Base
# HISTÓRIA DE USUÁRIO: HU-009 - Gerenciamento de Frota (Ônibus)
# REQUISITOS RELACIONADOS: RF-008 (Gerenciamento de Frota), RF-014 (Soft Delete)
# REQ. NÃO FUNCIONAIS: RNF-012 (Integridade dos Dados), RNF-013 (Auditoria)
# REGRA DE NEGÓCIO: RN-004 (Preservação de Histórico), RN-006 (Exclusividade Administrativa)
# language: pt
# =================================================================================

@EP002 @HU009 @gestao_frota
Funcionalidade: Gerenciamento de Frota (Ônibus)
  Como administrador
  Quero cadastrar, visualizar, editar, inativar e reativar os ônibus, informando placa,
  quantidade de assentos e capacidade máxima de alunos em pé
  Para gerenciar os veículos disponíveis para o transporte universitário e seus limites de ocupação

  Contexto:
    Dado que o administrador está autenticado no sistema
    E acessa o menu "Frota"
    E o aplicativo possui conexão ativa com a API


  # AC-01 - Listagem de veículos
  @fluxo_feliz @prioridade_media
  Cenário: Administrador visualiza os ônibus cadastrados com seus limites de ocupação
    Dado que existe o ônibus de placa "ABC1D23" com 44 assentos e capacidade para 20 alunos em pé
    Quando o administrador visualiza a listagem da frota
    Então o sistema exibe o ônibus "ABC1D23"
    E o sistema exibe a quantidade de assentos 44 e a capacidade de 20 alunos em pé


  # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-02, AC-07
  @fluxo_feliz @smoke @prioridade_alta
  Cenário: Administrador cadastra um novo ônibus com sucesso
    Quando o administrador seleciona "Novo Cadastro"
    E preenche o formulário do ônibus com:
      | campo                           | valor   |
      | Placa                           | QXD2E45 |
      | Quantidade de assentos          | 44      |
      | Capacidade de alunos em pé      | 20      |
    E clica no botão "Salvar"
    Então o sistema valida que a placa é única
    E o sistema cadastra o ônibus de placa "QXD2E45"
    E o sistema exibe a mensagem "Operação realizada com sucesso"
    E a listagem da frota é atualizada com o novo registro


  # FA-002 - Placa duplicada (AC-03)
  # Observação: o AC-03 considera registros ativos ou inativos; o FA-002 cita apenas ativos.
  # Os cenários seguem o AC-03, que é mais restritivo.
  @fluxo_infeliz @FA002 @prioridade_alta
  Esquema do Cenário: Sistema bloqueia o cadastro de ônibus com placa já existente
    Dado que já existe o ônibus de placa "ABC1D23" com status "<status_existente>"
    Quando o administrador seleciona "Novo Cadastro"
    E preenche o formulário do ônibus com:
      | campo                           | valor   |
      | Placa                           | ABC1D23 |
      | Quantidade de assentos          | 40      |
      | Capacidade de alunos em pé      | 15      |
    E clica no botão "Salvar"
    Então o sistema bloqueia o cadastro
    E o sistema exibe a mensagem "Este veículo já está registrado."

    Exemplos:
      | status_existente |
      | ativo            |
      | inativo          |


  # FA-002 - Placa duplicada também na edição
  @fluxo_infeliz @FA002 @prioridade_alta
  Cenário: Sistema bloqueia a edição de ônibus para uma placa já utilizada por outro veículo
    Dado que existem os ônibus de placas "ABC1D23" e "QXD2E45"
    Quando o administrador seleciona a ação "Editar" para "QXD2E45"
    E altera o campo "Placa" para "ABC1D23"
    E clica no botão "Salvar"
    Então o sistema bloqueia a alteração
    E o sistema exibe a mensagem "Este veículo já está registrado."


  # FA-003 - Campos obrigatórios ausentes (AC-08)
  @fluxo_infeliz @FA003 @validacao_campos @prioridade_alta
  Esquema do Cenário: Sistema bloqueia o salvamento quando um campo obrigatório não é preenchido
    Quando o administrador seleciona "Novo Cadastro"
    E deixa o campo "<campo_obrigatorio>" vazio
    E preenche os demais campos obrigatórios corretamente
    E clica no botão "Salvar"
    Então o sistema destaca o campo "<campo_obrigatorio>" como obrigatório
    E o sistema não salva o ônibus

    Exemplos:
      | campo_obrigatorio          |
      | Placa                      |
      | Quantidade de assentos     |
      | Capacidade de alunos em pé |


  # AC-04 - Edição de ônibus existente
  @fluxo_feliz @prioridade_alta
  Cenário: Administrador edita a capacidade de um ônibus existente
    Dado que existe o ônibus ativo de placa "QXD2E45" com 44 assentos e capacidade para 20 alunos em pé
    Quando o administrador seleciona a ação "Editar" para "QXD2E45"
    E altera o campo "Capacidade de alunos em pé" para "15"
    E clica no botão "Salvar"
    Então o sistema atualiza os dados do ônibus
    E o sistema exibe a mensagem "Operação realizada com sucesso"
    E a listagem exibe o ônibus "QXD2E45" com capacidade de 15 alunos em pé


  # AC-05, AC-07 - Inativação com soft delete e auditoria
  @fluxo_feliz @auditoria @RF014 @prioridade_alta
  Cenário: Administrador inativa um ônibus sem alocações futuras
    Dado que existe o ônibus ativo de placa "QXD2E45" sem alocações para dias futuros
    Quando o administrador seleciona a ação "Inativar" para "QXD2E45"
    E confirma a inativação
    Então o sistema aplica o soft delete no registro do ônibus "QXD2E45"
    E o registro permanece no banco de dados
    E o sistema registra no log de auditoria o usuário responsável, a ação e o timestamp
    E o sistema exibe a mensagem "Operação realizada com sucesso"
    E a listagem da frota é atualizada


  # AC-05 - Reativação com auditoria
  @fluxo_feliz @auditoria @RF014 @prioridade_media
  Cenário: Administrador reativa um ônibus previamente inativado
    Dado que existe o ônibus de placa "QXD2E45" com status inativo
    Quando o administrador seleciona a ação "Reativar" para "QXD2E45"
    E confirma a reativação
    Então o sistema altera o status do ônibus "QXD2E45" para ativo
    E o sistema registra no log de auditoria o usuário responsável, a ação e o timestamp
    E o sistema exibe a mensagem "Operação realizada com sucesso"


  # FA-001 - Inativação de ônibus alocado em rota futura (AC-06, RNF-012)
  @fluxo_infeliz @FA001 @RNF012 @prioridade_alta @depende_de_HU016 @depende_de_HU017
  Cenário: Sistema bloqueia a inativação de ônibus escalado para rotas em dias futuros
    Dado que o ônibus de placa "ABC1D23" está escalado para realizar uma rota em um dia futuro
    Quando o administrador seleciona a ação "Inativar" para "ABC1D23"
    E confirma a inativação
    Então o sistema bloqueia a inativação
    E o sistema exibe a mensagem "Este veículo possui alocações pendentes e não pode ser inativado no momento."
    E o ônibus "ABC1D23" permanece ativo


  # AC-09 - Visualização de registros inativos
  @fluxo_feliz @prioridade_media
  Cenário: Administrador visualiza ônibus inativos na listagem
    Dado que existe ao menos um ônibus com status inativo
    Quando o administrador habilita a exibição de registros inativos
    Então o sistema exibe os ônibus inativos na listagem
    E os registros inativos são identificados como inativos


  # RN-004 - Preservação de histórico após inativação
  @regra_negocio @RN004 @teste_api @nao_automatizavel_via_appium @prioridade_media
  Cenário: Inativação de ônibus preserva os registros históricos vinculados a ele
    Dado que o ônibus de placa "QXD2E45" possui registros de alocação e relatórios de períodos anteriores
    Quando o administrador inativa o ônibus "QXD2E45"
    Então os registros de alocação e relatórios de períodos anteriores permanecem inalterados


  # RN-006 - Acesso restrito ao Administrador
  @fluxo_infeliz @regra_negocio @RN006 @prioridade_alta
  Esquema do Cenário: Sistema nega acesso à gestão da frota para usuários sem perfil administrativo
    Dado que um usuário com perfil "<perfil>" está autenticado no sistema
    Quando esse usuário tenta acessar o menu "Frota"
    Então o sistema nega o acesso com erro "403 Forbidden"

    Exemplos:
      | perfil        |
      | Aluno         |
      | Representante |
