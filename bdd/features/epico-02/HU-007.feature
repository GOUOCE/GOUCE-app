# =================================================================================
# ÉPICO: EP-002 - Gestão de Cadastros Base
# HISTÓRIA DE USUÁRIO: HU-007 - Gerenciamento de Bairros/Pontos de Parada
# REQUISITOS RELACIONADOS: RF-011 (Bairros e Pontos), RF-014 (Soft Delete)
# REQ. NÃO FUNCIONAIS: RNF-012 (Integridade dos Dados), RNF-013 (Auditoria)
# REGRA DE NEGÓCIO: RN-004 (Preservação de Histórico), RN-006 (Exclusividade Administrativa)
# language: pt
# =================================================================================

@EP002 @HU007 @gestao_bairros
Funcionalidade: Gerenciamento de Bairros e Pontos de Parada
  Como administrador
  Quero cadastrar, visualizar, editar, inativar e reativar bairros e seus pontos de parada
  Para estruturar a base geográfica de embarque e desembarque dos estudantes

  Contexto:
    Dado que o administrador está autenticado no sistema
    E acessa o menu "Bairros e Pontos de Parada"
    E o aplicativo possui conexão ativa com a API


  # AC-01 - Listagem de bairros com seus pontos de parada
  @fluxo_feliz @prioridade_media
  Cenário: Administrador visualiza os bairros cadastrados com seus pontos de parada
    Dado que existe o bairro "Centro" com os pontos de parada "Praça José de Barros" e "Mercado Público"
    Quando o administrador visualiza a listagem de bairros
    Então o sistema exibe o bairro "Centro"
    E o sistema exibe os pontos de parada "Praça José de Barros" e "Mercado Público" associados a "Centro"


  # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-02, AC-07
  @fluxo_feliz @smoke @prioridade_alta
  Cenário: Administrador cadastra um novo bairro com ponto de parada
    Quando o administrador seleciona "Novo Cadastro"
    E preenche o campo "Nome do bairro" com "Campo Velho"
    E adiciona o ponto de parada "Escola Coronel Virgílio Távora"
    E clica no botão "Salvar"
    Então o sistema valida que o nome do bairro é único
    E o sistema cadastra o bairro "Campo Velho" com o ponto de parada informado
    E o sistema exibe a mensagem "Operação realizada com sucesso"
    E a listagem de bairros é atualizada com o novo registro


  # FA-002 - Cadastro duplicado (AC-03)
  # Observação: o AC-03 considera registros ativos ou inativos; o FA-002 cita apenas ativos.
  # Os cenários seguem o AC-03, que é mais restritivo.
  @fluxo_infeliz @FA002 @prioridade_alta
  Esquema do Cenário: Sistema bloqueia o cadastro de bairro com nome já existente
    Dado que já existe o bairro "Centro" com status "<status_existente>"
    Quando o administrador seleciona "Novo Cadastro"
    E preenche o campo "Nome do bairro" com "Centro"
    E adiciona o ponto de parada "Rodoviária"
    E clica no botão "Salvar"
    Então o sistema bloqueia o salvamento
    E o sistema exibe a mensagem "Esta localidade já está cadastrada."

    Exemplos:
      | status_existente |
      | ativo            |
      | inativo          |


  # FA-002 - Ponto de parada duplicado (AC-03)
  @fluxo_infeliz @FA002 @prioridade_alta
  Cenário: Sistema bloqueia o cadastro de ponto de parada com nome já existente
    Dado que já existe o ponto de parada "Praça José de Barros"
    Quando o administrador seleciona "Novo Cadastro"
    E preenche o campo "Nome do bairro" com "Planalto Universitário"
    E adiciona o ponto de parada "Praça José de Barros"
    E clica no botão "Salvar"
    Então o sistema bloqueia o salvamento
    E o sistema exibe a mensagem "Esta localidade já está cadastrada."


  # FA-003 - Campos obrigatórios ausentes (AC-08)
  @fluxo_infeliz @FA003 @validacao_campos @prioridade_alta
  Esquema do Cenário: Sistema bloqueia o salvamento quando um campo obrigatório não é preenchido
    Quando o administrador seleciona "Novo Cadastro"
    E deixa o campo "<campo_obrigatorio>" vazio
    E preenche os demais campos obrigatórios corretamente
    E clica no botão "Salvar"
    Então o sistema destaca o campo "<campo_obrigatorio>" como obrigatório
    E o sistema não salva o bairro

    Exemplos:
      | campo_obrigatorio |
      | Nome do bairro    |
      | Ponto de parada   |


  # AC-04 - Edição de bairro existente
  @fluxo_feliz @prioridade_alta
  Cenário: Administrador edita o nome e os pontos de parada de um bairro existente
    Dado que existe o bairro ativo "Campo Velho" com o ponto de parada "Escola Coronel Virgílio Távora"
    Quando o administrador seleciona a ação "Editar" para "Campo Velho"
    E altera o campo "Nome do bairro" para "Campo Velho II"
    E adiciona o ponto de parada "Posto de Saúde"
    E clica no botão "Salvar"
    Então o sistema atualiza os dados do bairro
    E o sistema exibe a mensagem "Operação realizada com sucesso"
    E a listagem exibe "Campo Velho II" com os pontos "Escola Coronel Virgílio Távora" e "Posto de Saúde"


  # AC-05, AC-07 - Inativação com soft delete e auditoria
  @fluxo_feliz @auditoria @RF014 @prioridade_alta
  Cenário: Administrador inativa um bairro sem vínculo com rota ativa
    Dado que existe o bairro ativo "Campo Velho" sem vínculo com rota ativa
    Quando o administrador seleciona a ação "Inativar" para "Campo Velho"
    E confirma a inativação
    Então o sistema aplica o soft delete no registro de "Campo Velho"
    E o registro permanece no banco de dados
    E o sistema registra no log de auditoria o usuário responsável, a ação e o timestamp
    E o sistema exibe a mensagem "Operação realizada com sucesso"
    E a listagem de bairros é atualizada


  # AC-05 - Reativação com auditoria
  @fluxo_feliz @auditoria @RF014 @prioridade_media
  Cenário: Administrador reativa um bairro previamente inativado
    Dado que existe o bairro "Campo Velho" com status inativo
    Quando o administrador seleciona a ação "Reativar" para "Campo Velho"
    E confirma a reativação
    Então o sistema altera o status de "Campo Velho" para ativo
    E o sistema registra no log de auditoria o usuário responsável, a ação e o timestamp
    E o sistema exibe a mensagem "Operação realizada com sucesso"


  # FA-001 - Inativação de bairro vinculado a rota ativa (AC-06, RNF-012)
  @fluxo_infeliz @FA001 @RNF012 @prioridade_alta @depende_de_HU011
  Cenário: Sistema bloqueia a inativação de bairro vinculado a uma rota ativa
    Dado que o bairro "Centro" pertence a uma rota ativa
    Quando o administrador seleciona a ação "Inativar" para "Centro"
    E confirma a inativação
    Então o sistema bloqueia a inativação
    E o sistema exibe a mensagem "Este bairro não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar."
    E o bairro "Centro" permanece ativo


  # AC-09 - Visualização de registros inativos
  @fluxo_feliz @prioridade_media
  Cenário: Administrador visualiza bairros e pontos de parada inativos na listagem
    Dado que existe ao menos um bairro com status inativo
    Quando o administrador habilita a exibição de registros inativos
    Então o sistema exibe os bairros e pontos de parada inativos na listagem
    E os registros inativos são identificados como inativos


  # RN-004 - Preservação de histórico após inativação
  @regra_negocio @RN004 @teste_api @nao_automatizavel_via_appium @prioridade_media
  Cenário: Inativação de bairro preserva os registros históricos vinculados a ele
    Dado que o bairro "Campo Velho" possui registros de alocação e relatórios de períodos anteriores
    Quando o administrador inativa o bairro "Campo Velho"
    Então os registros de alocação e relatórios de períodos anteriores permanecem inalterados


  # RN-006 - Acesso restrito ao Administrador
  @fluxo_infeliz @regra_negocio @RN006 @prioridade_alta
  Esquema do Cenário: Sistema nega acesso à gestão de bairros para usuários sem perfil administrativo
    Dado que um usuário com perfil "<perfil>" está autenticado no sistema
    Quando esse usuário tenta acessar o menu "Bairros e Pontos de Parada"
    Então o sistema nega o acesso com erro "403 Forbidden"

    Exemplos:
      | perfil        |
      | Aluno         |
      | Representante |
