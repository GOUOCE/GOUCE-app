# =================================================================================
# ÉPICO: EP-005 - Alocação e Distribuição Logística
# HISTÓRIA DE USUÁRIO: HU-018 - Visualização da Lista de Embarque
# REQUISITOS RELACIONADOS: RF-019 (Consulta de Alocação Diária), RF-020 (Visualização da Lista de Embarque)
# REQ. NÃO FUNCIONAIS: RNF-010 (Privacidade e Proteção de Dados), RNF-012 (Integridade dos Dados)
# REGRA DE NEGÓCIO: RN-001 (Limite de Capacidade), RN-007 (Realocação por Capacidade), RN-015 (Atuação do Representante)
# language: pt
# =================================================================================

@EP005 @HU018 @lista_embarque
Funcionalidade: Visualização da Lista de Embarque
  Como administrador ou representante
  Quero visualizar a lista de embarque consolidada para os ônibus do dia, contendo a relação de alunos alocados
  Para conferir a distribuição logística e realizar a conferência no momento da viagem


  Regra: O administrador consulta a lista de embarque escolhendo a rota

    Contexto:
      Dado que o administrador está autenticado no sistema
      E acessa o menu "Lista de Embarque"
      E o aplicativo possui conexão ativa com a API
      E a rota "Rota Centro - UFC" possui alunos alocados no dia "17/11/2026"


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-01, AC-03
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Administrador seleciona a rota e visualiza o total e a lista de alunos alocados
      Quando o sistema exibe a tela com a data "17/11/2026" e o campo seletor "Rota *"
      E o administrador seleciona a rota "Rota Centro - UFC"
      Então o sistema exibe o contador de alunos alocados
      E exibe a lista de alunos com nome, ponto de embarque ou desembarque e faculdade (IES)


    # AC-03 - Contador de alunos alocados
    @fluxo_feliz @prioridade_media
    Esquema do Cenário: Sistema exibe o contador conforme a quantidade de alunos alocados
      Dado que a rota "Rota Centro - UFC" possui <total> aluno(s) alocado(s) no dia "17/11/2026"
      Quando o administrador seleciona a rota "Rota Centro - UFC"
      Então o sistema exibe o contador "<contador>"

      Exemplos:
        | total | contador           |
        | 1     | 1 aluno alocado    |
        | 38    | 38 alunos alocados |


    # AC-03 - Ordenação da lista
    @fluxo_feliz @prioridade_media
    Cenário: Sistema ordena a lista de embarque pelo nome do aluno
      Dado que a rota "Rota Centro - UFC" possui os alunos "Carlos Lima", "Ana Souza" e "Bruno Alves" alocados
      Quando o administrador seleciona a rota "Rota Centro - UFC"
      Então o sistema exibe os alunos na ordem "Ana Souza", "Bruno Alves" e "Carlos Lima"


    # AC-03 - Indicação visual dos turnos agendados
    @fluxo_feliz @prioridade_alta
    Esquema do Cenário: Sistema indica o turno agendado do aluno na lista de embarque
      Dado que o aluno "Ana Souza" está alocado na rota "Rota Centro - UFC" com <agendamento>
      Quando o administrador seleciona a rota "Rota Centro - UFC"
      Então o sistema identifica o aluno "Ana Souza" com a indicação "<indicacao>"

      Exemplos:
        | agendamento                          | indicacao                 |
        | apenas a ida                         | APENAS_IDA                |
        | apenas a volta                       | APENAS_VOLTA              |
        | ida e volta na mesma faculdade       | IDA_E_VOLTA_MESMA_IES     |
        | ida e volta em faculdades diferentes | IDA_E_VOLTA_IES_DISTINTAS |


    # AC-04, AC-05, FA-002 - Rota sem alunos e botão de impressão
    @fluxo_infeliz @FA002 @prioridade_alta
    Cenário: Sistema informa a rota sem alunos alocados e mantém a impressão desabilitada
      Dado que a rota "Rota Campo Velho - UFC" não possui alunos alocados no dia "17/11/2026"
      Quando o administrador seleciona a rota "Rota Campo Velho - UFC"
      Então o sistema exibe a mensagem "Essa rota não possui nenhum aluno alocado para este dia."
      E o botão "Imprimir lista" permanece desabilitado


    # AC-05 - Botão de impressão com alunos alocados
    @fluxo_feliz @prioridade_media
    Cenário: Sistema habilita o botão "Imprimir lista" quando há alunos alocados
      Quando o administrador seleciona a rota "Rota Centro - UFC"
      Então o botão "Imprimir lista" fica habilitado


    # AC-01 - API exige a rota para o administrador
    @fluxo_infeliz @validacao_campos @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API exige o identificador da rota na consulta do administrador
      Quando o administrador consulta a lista de embarque do dia "17/11/2026" pela API sem informar a rota
      Então a API responde com o status "422 Unprocessable Entity"
      E a resposta informa o código "ROTA_ID_OBRIGATORIO" e a mensagem "O parâmetro rota_id é obrigatório para administradores."


    # Rota inexistente
    @fluxo_infeliz @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: API recusa a consulta de uma rota inexistente
      Quando o administrador consulta a lista de embarque de uma rota inexistente pela API
      Então a API responde com o status "404 Not Found"
      E a resposta informa a mensagem "Rota não encontrada."


    # AC-01 - Seletor de rotas
    @fluxo_feliz @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: API informa as rotas do dia para popular o seletor "Rota *"
      Quando o administrador consulta as rotas do dia "17/11/2026" pela API
      Então a API responde com o status "200 OK"
      E a resposta lista as rotas com alocação na data, com o nome e o horário de saída de cada uma


  Regra: O acesso direto por uma rota e o acesso do representante exibem a rota fixa

    Contexto:
      Dado que o aplicativo possui conexão ativa com a API
      E a rota "Rota Centro - UFC" possui alunos alocados das faculdades "UFC" e "IFCE" no dia "17/11/2026"


    # FA-001, AC-02 - Acesso direto pelo painel logístico
    @fluxo_feliz @FA001 @prioridade_alta
    Cenário: Administrador abre a lista de embarque a partir da rota no painel logístico
      Dado que o administrador está autenticado no sistema
      Quando o administrador aciona a lista de embarque da rota "Rota Centro - UFC" no painel logístico
      Então o sistema exibe a tela "Lista de Embarque" com o título "Rota Centro - UFC"
      E não exibe o campo seletor de rotas


    # AC-02, RN-015 - Representante vê somente a sua faculdade
    @fluxo_feliz @FA001 @RN015 @RNF010 @prioridade_alta
    Cenário: Representante visualiza apenas os alunos da faculdade sob a sua responsabilidade
      Dado que o representante "Rafael Alves" é responsável pela faculdade "UFC"
      E o representante está autenticado no sistema
      Quando o representante acessa a lista de embarque da sua rota
      Então o sistema exibe somente os alunos da faculdade "UFC"
      E não exibe nenhum aluno da faculdade "IFCE"
      E não exibe o campo seletor de rotas


    # RN-015 - Descoberta automática da rota do representante
    @fluxo_feliz @RN015 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: API descobre a rota do representante quando o identificador não é informado
      Dado que existe uma única rota do dia com alunos da faculdade "UFC"
      Quando o representante consulta a lista de embarque do dia "17/11/2026" pela API sem informar a rota
      Então a API responde com o status "200 OK"
      E a resposta traz a lista da rota "Rota Centro - UFC" somente com os alunos da faculdade "UFC"


    # RN-015 - Mais de uma rota para o representante
    @fluxo_infeliz @RN015 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: API pede a escolha da rota quando o representante possui mais de uma rota no dia
      Dado que existem duas rotas do dia com alunos da faculdade "UFC"
      Quando o representante consulta a lista de embarque do dia "17/11/2026" pela API sem informar a rota
      Então a API responde com o status "422 Unprocessable Entity"
      E a resposta informa o código "MULTIPLAS_ROTAS" e a mensagem "Múltiplas rotas disponíveis. Especifique rota_id."
      E a resposta lista as rotas disponíveis


    # RN-015 - Representante sem rota no dia
    @fluxo_infeliz @RN015 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: API informa que não há rota no dia para a faculdade do representante
      Dado que nenhuma rota do dia possui alunos da faculdade do representante
      Quando o representante consulta a lista de embarque do dia "17/11/2026" pela API sem informar a rota
      Então a API responde com o status "404 Not Found"
      E a resposta informa o código "SEM_ROTA_NO_DIA" e a mensagem "Nenhuma rota encontrada para esta data e faculdade."


    # RN-015 - Representante sem vínculo válido
    @fluxo_infeliz @RN015 @RNF010 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega a lista de embarque ao representante <situacao>
      Dado que o usuário é um representante <situacao>
      Quando ele consulta a lista de embarque do dia "17/11/2026" pela API
      Então a API responde com o status "403 Forbidden"
      E a resposta informa a mensagem "<mensagem>"

      Exemplos:
        | situacao                           | mensagem                                          |
        | sem vínculo de representante ativo | Usuário sem vínculo de representante ativo.       |
        | sem faculdade responsável definida | Representante sem faculdade responsável definida. |


  Regra: A lista de embarque acompanha cancelamentos e realocações

    Contexto:
      Dado que o administrador está autenticado no sistema
      E a rota "Rota Centro - UFC" possui os alunos "Ana Souza" e "Bruno Alves" alocados no dia "17/11/2026"
      E o administrador mantém a lista de embarque da rota "Rota Centro - UFC" aberta


    # FA-003, AC-06 - Cancelamento de agendamento
    @fluxo_feliz @FA003 @RNF012 @prioridade_alta
    Cenário: Sistema remove o aluno que cancelou o agendamento e recalcula o contador
      Quando o aluno "Ana Souza" cancela o agendamento do dia "17/11/2026"
      Então o sistema atualiza a lista de embarque automaticamente
      E remove "Ana Souza" da lista
      E exibe o contador "1 aluno alocado"
      E atualiza o indicador de sincronização exibido na parte inferior da tela


    # FA-003, AC-06 - Realocação manual
    @fluxo_feliz @FA003 @RN007 @prioridade_media
    Cenário: Sistema atualiza a lista quando um aluno é realocado para outro ônibus
      Quando o administrador realoca "Bruno Alves" para a rota "Rota Campo Velho - UFC"
      Então a lista da rota "Rota Centro - UFC" deixa de exibir "Bruno Alves"
      E a lista da rota "Rota Campo Velho - UFC" passa a exibir "Bruno Alves"


    # AC-06 - Indicador de sincronização
    @fluxo_feliz @prioridade_media
    Cenário: Sistema exibe o tempo desde a última sincronização da lista
      Dado que a lista de embarque foi carregada há 1 minuto
      Quando o administrador visualiza a parte inferior da tela
      Então o sistema exibe o indicador "Atualizado há 1 min"


    # AC-06 - API só lista alocações e agendamentos ativos
    @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API lista apenas os alunos alocados com agendamento ativo
      Dado que o agendamento de "Ana Souza" foi cancelado
      Quando o administrador consulta a lista de embarque da rota "Rota Centro - UFC" no dia "17/11/2026" pela API
      Então a resposta contém somente "Bruno Alves"
      E o total de alunos alocados é 1
      E a resposta informa a data e a hora da última sincronização


  Regra: Somente o administrador e o representante acessam os dados pessoais dos alunos (RNF-010)

    # RNF-010 - Perfis sem acesso
    @fluxo_infeliz @regra_negocio @RNF010 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega a lista de embarque ao usuário "<perfil>"
      Dado que um usuário com perfil "<perfil>" possui um token de acesso válido
      Quando esse usuário consulta a lista de embarque pela API
      Então a API responde com o status "403 Forbidden"
      E a resposta não exibe nenhum dado de aluno

      Exemplos:
        | perfil |
        | Aluno  |


    # RNF-010 - Sem autenticação
    @fluxo_infeliz @regra_negocio @RNF010 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API nega a lista de embarque sem token de acesso
      Quando uma requisição de consulta da lista de embarque é enviada sem token de acesso
      Então a API responde com o status "401 Unauthorized"
      E a resposta não exibe nenhum dado de aluno
