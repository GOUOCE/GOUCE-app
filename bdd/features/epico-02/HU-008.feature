# =================================================================================
# ÉPICO: EP-002 - Gestão de Cadastros Base
# HISTÓRIA DE USUÁRIO: HU-008 - Gerenciamento de Faculdades
# REQUISITOS RELACIONADOS: RF-010 (Gerenciamento de Faculdades), RF-014 (Soft Delete)
# REQ. NÃO FUNCIONAIS: RNF-012 (Integridade dos Dados), RNF-013 (Auditoria)
# REGRA DE NEGÓCIO: RN-004 (Preservação de Histórico), RN-006 (Exclusividade Administrativa)
# language: pt
# =================================================================================

@EP002 @HU008 @gestao_faculdades
Funcionalidade: Gerenciamento de Faculdades
  Como administrador
  Quero cadastrar, visualizar, editar, inativar e reativar as faculdades de destino
  Para organizar as instituições de ensino atendidas pelas rotas de transporte

  Contexto:
    Dado que o administrador está autenticado no sistema
    E acessa o menu "Faculdades"
    E o aplicativo possui conexão ativa com a API


  # AC-01 - Listagem de faculdades
  @fluxo_feliz @prioridade_media
  Cenário: Administrador visualiza as faculdades cadastradas
    Dado que existem as faculdades "UFC" no campus "Quixadá" e "IFCE" no campus "Quixadá"
    Quando o administrador visualiza a listagem de faculdades
    Então o sistema exibe as faculdades cadastradas com nome e campus


  # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-02, AC-07
  @fluxo_feliz @smoke @prioridade_alta
  Cenário: Administrador cadastra uma nova faculdade com sucesso
    Quando o administrador seleciona "Novo Cadastro"
    E preenche o campo "Nome" com "Unicatólica"
    E preenche o campo "Campus" com "Quixadá"
    E clica no botão "Salvar"
    Então o sistema valida que a combinação de nome e campus é única
    E o sistema cadastra a faculdade "Unicatólica" no campus "Quixadá"
    E o sistema exibe a mensagem "Operação realizada com sucesso"
    E a listagem de faculdades é atualizada com o novo registro


  # AC-02 - A unicidade considera a combinação nome + campus
  @fluxo_feliz @prioridade_media
  Cenário: Sistema permite cadastrar a mesma faculdade em um campus diferente
    Dado que já existe a faculdade "UFC" no campus "Quixadá"
    Quando o administrador seleciona "Novo Cadastro"
    E preenche o campo "Nome" com "UFC"
    E preenche o campo "Campus" com "Crateús"
    E clica no botão "Salvar"
    Então o sistema cadastra a faculdade "UFC" no campus "Crateús"
    E o sistema exibe a mensagem "Operação realizada com sucesso"


  # FA-002 - Cadastro duplicado (AC-03)
  # Observação: o AC-03 considera registros ativos ou inativos; o FA-002 cita apenas ativos.
  # Os cenários seguem o AC-03, que é mais restritivo.
  @fluxo_infeliz @FA002 @prioridade_alta
  Esquema do Cenário: Sistema bloqueia o cadastro de faculdade com mesmo nome e campus
    Dado que já existe a faculdade "UFC" no campus "Quixadá" com status "<status_existente>"
    Quando o administrador seleciona "Novo Cadastro"
    E preenche o campo "Nome" com "UFC"
    E preenche o campo "Campus" com "Quixadá"
    E clica no botão "Salvar"
    Então o sistema bloqueia o cadastro
    E o sistema exibe a mensagem "Esta faculdade já está cadastrada."

    Exemplos:
      | status_existente |
      | ativo            |
      | inativo          |


  # FA-003 - Campos obrigatórios ausentes (AC-08)
  @fluxo_infeliz @FA003 @validacao_campos @prioridade_alta
  Esquema do Cenário: Sistema bloqueia o salvamento quando um campo obrigatório não é preenchido
    Quando o administrador seleciona "Novo Cadastro"
    E deixa o campo "<campo_obrigatorio>" vazio
    E preenche os demais campos obrigatórios corretamente
    E clica no botão "Salvar"
    Então o sistema destaca o campo "<campo_obrigatorio>" como obrigatório
    E o sistema não salva a faculdade

    Exemplos:
      | campo_obrigatorio |
      | Nome              |
      | Campus            |


  # AC-04 - Edição de faculdade existente
  @fluxo_feliz @prioridade_alta
  Cenário: Administrador edita os dados de uma faculdade existente
    Dado que existe a faculdade ativa "Unicatólica" no campus "Quixadá"
    Quando o administrador seleciona a ação "Editar" para "Unicatólica"
    E altera o campo "Nome" para "Centro Universitário Católica de Quixadá"
    E clica no botão "Salvar"
    Então o sistema atualiza os dados da faculdade
    E o sistema exibe a mensagem "Operação realizada com sucesso"


  # AC-05, AC-07 - Inativação com soft delete e auditoria
  @fluxo_feliz @auditoria @RF014 @prioridade_alta
  Cenário: Administrador inativa uma faculdade sem agendamentos futuros
    Dado que existe a faculdade ativa "Unicatólica" sem alunos agendados para datas futuras
    Quando o administrador seleciona a ação "Inativar" para "Unicatólica"
    E confirma a inativação
    Então o sistema aplica o soft delete no registro de "Unicatólica"
    E o registro permanece no banco de dados
    E o sistema registra no log de auditoria o usuário responsável, a ação e o timestamp
    E o sistema exibe a mensagem "Operação realizada com sucesso"
    E a listagem de faculdades é atualizada


  # AC-05 - Reativação com auditoria
  @fluxo_feliz @auditoria @RF014 @prioridade_media
  Cenário: Administrador reativa uma faculdade previamente inativada
    Dado que existe a faculdade "Unicatólica" com status inativo
    Quando o administrador seleciona a ação "Reativar" para "Unicatólica"
    E confirma a reativação
    Então o sistema altera o status de "Unicatólica" para ativo
    E o sistema registra no log de auditoria o usuário responsável, a ação e o timestamp
    E o sistema exibe a mensagem "Operação realizada com sucesso"


  # FA-001 - Inativação de faculdade com agendamentos futuros (AC-06, RNF-012)
  @fluxo_infeliz @FA001 @RNF012 @prioridade_alta @depende_de_HU013
  Cenário: Sistema bloqueia a inativação de faculdade com alunos agendados para datas futuras
    Dado que a faculdade "UFC" no campus "Quixadá" possui alunos agendados para datas futuras
    Quando o administrador seleciona a ação "Inativar" para "UFC"
    E confirma a inativação
    Então o sistema bloqueia a inativação
    E o sistema exibe a mensagem "Esta instituição possui viagens programadas pendentes. Não é possível inativar no momento."
    E a faculdade "UFC" permanece ativa


  # AC-09 - Visualização de registros inativos
  @fluxo_feliz @prioridade_media
  Cenário: Administrador visualiza faculdades inativas na listagem
    Dado que existe ao menos uma faculdade com status inativo
    Quando o administrador habilita a exibição de registros inativos
    Então o sistema exibe as faculdades inativas na listagem
    E os registros inativos são identificados como inativos


  # RN-004 - Preservação de histórico após inativação
  @regra_negocio @RN004 @teste_api @nao_automatizavel_via_appium @prioridade_media
  Cenário: Inativação de faculdade preserva os registros históricos vinculados a ela
    Dado que a faculdade "Unicatólica" possui registros de alocação e relatórios de períodos anteriores
    Quando o administrador inativa a faculdade "Unicatólica"
    Então os registros de alocação e relatórios de períodos anteriores permanecem inalterados


  # RN-006 - Acesso restrito ao Administrador
  @fluxo_infeliz @regra_negocio @RN006 @prioridade_alta
  Esquema do Cenário: Sistema nega acesso à gestão de faculdades para usuários sem perfil administrativo
    Dado que um usuário com perfil "<perfil>" está autenticado no sistema
    Quando esse usuário tenta acessar o menu "Faculdades"
    Então o sistema nega o acesso com erro "403 Forbidden"

    Exemplos:
      | perfil        |
      | Aluno         |
      | Representante |
