# =================================================================================
# ÉPICO: EP-005 - Alocação e Distribuição Logística
# HISTÓRIA DE USUÁRIO: HU-020 - Rotatividade Inteligente / Rodízio Semanal
# REQUISITOS RELACIONADOS: RF-023 (Rotatividade Inteligente)
# REQ. NÃO FUNCIONAIS: RNF-012 (Integridade dos Dados)
# REGRA DE NEGÓCIO: RN-003 (Prevenção de Conflito de Veículo), RN-006 (Exclusividade Administrativa), RN-008 (Rodízio de Ônibus)
# OBSERVAÇÃO: na `develop` analisada ainda não há API nem tela do rodízio; os cenários seguem apenas os requisitos.
# language: pt
# =================================================================================

@EP005 @HU020 @rodizio_frota
Funcionalidade: Rotatividade Inteligente / Rodízio Semanal
  Como administrador
  Quero configurar e aplicar um rodízio semanal dos ônibus entre as diferentes rotas cadastradas
  Para equilibrar a quilometragem percorrida e o desgaste mecânico da frota, garantindo uma vida útil mais homogênea para os veículos


  Regra: O administrador configura o rodízio, confere a prévia e confirma

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa a tela "Rodízio de Frota" dentro do painel logístico
      E o aplicativo possui conexão ativa com a API
      E existem as rotas principais ativas "Rota Centro - UFC" e "Rota Campo Velho - UFC"
      E existem os ônibus ativos "ABC1D23" e "XYZ9K87"


    # AC-01 - Rotas ativas e ônibus vinculados
    @fluxo_feliz @prioridade_alta
    Cenário: Administrador visualiza as rotas principais ativas com os ônibus atualmente vinculados
      Dado que o ônibus "ABC1D23" está vinculado à rota "Rota Centro - UFC"
      E o ônibus "XYZ9K87" está vinculado à rota "Rota Campo Velho - UFC"
      Quando o administrador visualiza a tela "Rodízio de Frota"
      Então o sistema exibe a rota "Rota Centro - UFC" com o ônibus "ABC1D23"
      E exibe a rota "Rota Campo Velho - UFC" com o ônibus "XYZ9K87"
      E não exibe rotas inativas


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-02, AC-03, AC-06
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Administrador configura o rodízio, confere a prévia e confirma
      Quando o administrador aciona "Configurar Rodízio"
      E define que o ônibus "ABC1D23" assume a rota "Rota Campo Velho - UFC" na próxima semana
      E define que o ônibus "XYZ9K87" assume a rota "Rota Centro - UFC" na próxima semana
      Então o sistema exibe a prévia da escala das próximas semanas
      Quando o administrador clica em "Confirmar Rodízio"
      Então o sistema exibe a mensagem "Rodízio configurado e aplicado com sucesso"
      E a configuração do rodízio é salva


    # AC-03 - A prévia não persiste
    @fluxo_feliz @prioridade_media
    Cenário: Sistema não grava o rodízio enquanto o administrador não confirma
      Quando o administrador define o padrão de alternância dos ônibus
      E visualiza a prévia da escala das próximas semanas
      E sai da tela sem clicar em "Confirmar Rodízio"
      Então a configuração anterior do rodízio permanece inalterada


    # AC-07 - O rodízio influencia a alocação diária
    @fluxo_feliz @RN008 @depende_de_HU016 @prioridade_alta
    Cenário: Rodízio confirmado passa a orientar os ônibus sugeridos na alocação diária
      Dado que o rodízio confirmado prevê o ônibus "XYZ9K87" para a rota "Rota Centro - UFC" em uma data futura
      Quando o administrador acessa a "Alocação Diária" dessa data
      Então o sistema sugere ou vincula o ônibus "XYZ9K87" à rota "Rota Centro - UFC"


  Regra: O sistema alerta sobre a capacidade e bloqueia veículos inválidos

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa a tela "Rodízio de Frota" dentro do painel logístico
      E existem as rotas principais ativas "Rota Centro - UFC" e "Rota Campo Velho - UFC"


    # FA-001, AC-04 - Capacidade insuficiente
    @fluxo_infeliz @FA001 @RN001 @prioridade_alta
    Cenário: Sistema alerta quando o ônibus escolhido pode não atender à demanda prevista da rota
      Dado que a rota "Rota Centro - UFC" tem demanda prevista maior do que a capacidade do ônibus "ABC1D23" somando assentos e alunos em pé
      Quando o administrador define o ônibus "ABC1D23" para a rota "Rota Centro - UFC" no rodízio
      Então o sistema exibe o alerta "Atenção: O veículo selecionado pode não atender à demanda prevista para esta rota"
      E permite ao administrador ajustar a configuração ou manter ciente do risco de excedente


    # FA-002, AC-05 - Ônibus inativo
    @fluxo_infeliz @FA002 @prioridade_alta
    Cenário: Sistema bloqueia a seleção de ônibus inativo no rodízio
      Dado que o ônibus "OLD0A00" foi inativado
      Quando o administrador abre a lista de ônibus do rodízio
      Então o sistema não exibe o ônibus "OLD0A00" como opção
      E exige que um ônibus ativo seja selecionado para fechar o ciclo do rodízio


    # AC-08, RN-003 - Mesmo ônibus em duas rotas
    @fluxo_infeliz @RN003 @RNF012 @prioridade_alta
    Cenário: Sistema bloqueia o rodízio que aloca o mesmo ônibus em duas rotas no mesmo dia e horário
      Quando o administrador define o ônibus "ABC1D23" para as rotas "Rota Centro - UFC" e "Rota Campo Velho - UFC" na mesma semana e no mesmo horário
      Então o sistema bloqueia a confirmação do rodízio
      E o rodízio não é salvo


  Regra: Somente o administrador configura o rodízio (RN-006)

    # RN-006 - Menu não exibido para outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @prioridade_alta
    Esquema do Cenário: Menu do rodízio de frota não é exibido para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" está autenticado no sistema
      Quando esse usuário visualiza o painel logístico
      Então a opção "Rodízio de Frota" não é exibida

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |


    # RN-006 - API nega acesso a outros perfis
    @fluxo_infeliz @regra_negocio @RN006 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega a configuração do rodízio para usuários sem perfil administrativo
      Dado que um usuário com perfil "<perfil>" possui um token de acesso válido
      Quando esse usuário envia uma requisição para configurar o rodízio de frota
      Então a API responde com o status "403 Forbidden"
      E o rodízio não é alterado

      Exemplos:
        | perfil        |
        | Aluno         |
        | Representante |
