# =================================================================================
# ÉPICO: EP-007 - Comunicação e Mural de Avisos
# HISTÓRIA DE USUÁRIO: HU-024 - Recebimento de Notificações Push
# REQUISITOS RELACIONADOS: RF-025 (Recebimento de Notificações Push)
# REQ. NÃO FUNCIONAIS: RNF-014 (Confiabilidade das Notificações)
# REGRA DE NEGÓCIO: RN-009 (Informações de Alocação Atualizadas)
# OBSERVAÇÃO: os cenários seguem o que está implementado na branch da HU-024 (o aplicativo consulta a API a cada 5 segundos e exibe notificações locais);
#             o envio por Firebase/APNs, a entrega com o aplicativo fechado e o disparo de realocação estão nos requisitos, mas ainda não foram implementados e levam a tag @nao_implementado.
# language: pt
# =================================================================================

@EP007 @HU024 @notificacoes_push
Funcionalidade: Recebimento de Notificações Push
  Como aluno
  Quero receber notificações (push) no meu smartphone sempre que houver um aviso ou alteração na minha rota
  Para ser informado imediatamente sobre imprevistos sem precisar abrir o aplicativo constantemente


  Regra: O aplicativo exibe a notificação quando o administrador publica um aviso

    Contexto:
      Dado que o aluno "Maria Souza" está autenticado no aplicativo com cadastro aprovado e vínculo válido
      E o aluno permitiu as notificações do aplicativo no sistema operacional
      E o aplicativo está aberto e possui conexão ativa com a API


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-01, AC-02
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Publicação de um aviso gera a notificação no aparelho do aluno
      Quando o administrador publica o aviso "Alteração no horário da Rota Centro - UFC"
      Então o aplicativo detecta o novo aviso na próxima consulta periódica à API, feita a cada 5 segundos
      E o smartphone exibe a notificação do aplicativo "GOUOCE" com o título e o texto do aviso


    # AC-03 - Toque na notificação
    @fluxo_feliz @prioridade_alta
    Cenário: Ao tocar na notificação do aviso, o aplicativo abre o Mural de Avisos
      Dado que "Maria Souza" recebeu a notificação do aviso "Alteração no horário da Rota Centro - UFC"
      Quando o aluno toca na notificação
      Então o aplicativo abre a tela "Avisos"
      E o mural exibe o aviso "Alteração no horário da Rota Centro - UFC"


    # AC-01 - Cada evento notifica uma única vez
    @fluxo_feliz @prioridade_media
    Cenário: Sistema não repete a notificação de um aviso que já foi notificado
      Dado que "Maria Souza" já recebeu a notificação do aviso "Alteração no horário da Rota Centro - UFC"
      Quando o aplicativo realiza novas consultas periódicas à API
      Então o smartphone não exibe a notificação desse aviso novamente


    # Primeira sincronização
    @fluxo_feliz @prioridade_media
    Cenário: Ao abrir o aplicativo, avisos anteriores não geram notificações e ficam no mural
      Dado que existem avisos publicados antes de o aluno abrir o aplicativo
      Quando o aluno abre o aplicativo
      Então o smartphone não exibe notificações para os avisos anteriores
      E a aba "Avisos" exibe esses avisos


    # FA-002, AC-05 - Permissão desativada
    @fluxo_infeliz @FA002 @prioridade_alta
    Cenário: Notificação não é exibida quando o aluno desativou as permissões e o aviso continua no mural
      Dado que o aluno desativou as permissões de notificação do aplicativo nas configurações do sistema operacional
      E o administrador publica o aviso "Alteração no horário da Rota Centro - UFC"
      Então o smartphone não exibe nenhuma notificação
      Quando o aluno acessa a aba "Avisos"
      Então o mural exibe o aviso "Alteração no horário da Rota Centro - UFC"


    # AC-02, FA-002 - Solicitação de permissão
    @fluxo_feliz @prioridade_media
    Cenário: Aplicativo solicita a permissão de notificação ao aluno
      Dado que o aluno ainda não definiu a permissão de notificação
      Quando o aluno abre o aplicativo depois do login
      Então o sistema solicita a permissão para exibir notificações


    # Perfis monitorados
    @fluxo_infeliz @regra_negocio @prioridade_media
    Cenário: Aluno com cadastro pendente não recebe notificações
      Dado que o aluno "Carlos Lima" possui o cadastro pendente de aprovação
      Quando o administrador publica um aviso
      Então o aplicativo não consulta as notificações para esse aluno


  Regra: A API disponibiliza os eventos de notificação para o aplicativo

    # RNF-014 - Consulta dos eventos
    @fluxo_feliz @RNF014 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API devolve os eventos de notificação do mais recente para o mais antigo
      Dado que existem os avisos publicados "Alteração no horário da Rota Centro - UFC" e "Manutenção do ônibus ABC1D23", nessa ordem
      Quando o aluno consulta as notificações pela API
      Então a API responde com o status "200 OK"
      E a resposta lista primeiro o aviso "Manutenção do ônibus ABC1D23"
      E cada evento informa o tipo, o nome do aplicativo "GOUOCE", o título, a mensagem e a data de criação


    # Consulta incremental
    @fluxo_feliz @RNF014 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: API devolve somente os eventos posteriores ao último já recebido pelo aplicativo
      Dado que o aplicativo já recebeu os eventos até o identificador 5
      Quando o aluno consulta as notificações pela API informando o identificador 5 como referência
      Então a resposta contém somente eventos com identificador maior que 5


    # Limite da consulta
    @fluxo_infeliz @validacao_campos @teste_api @nao_automatizavel_via_appium @prioridade_media
    Esquema do Cenário: API valida o limite de eventos da consulta de notificações (<limite>)
      Quando o aluno consulta as notificações pela API com o limite <limite>
      Então a API responde com o status "<status>"

      Exemplos:
        | limite | status                   |
        | 1      | 200 OK                   |
        | 50     | 200 OK                   |
        | 0      | 422 Unprocessable Entity |
        | 51     | 422 Unprocessable Entity |


    # Referência inválida
    @fluxo_infeliz @validacao_campos @teste_api @nao_automatizavel_via_appium @prioridade_baixa
    Cenário: API recusa a consulta com identificador de referência negativo
      Quando o aluno consulta as notificações pela API informando o identificador -1 como referência
      Então a API responde com o status "422 Unprocessable Entity"


    # RNF-014 - A falha do disparo não desfaz o aviso
    @regra_negocio @RNF014 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Falha no disparo da notificação não desfaz a publicação do aviso
      Dado que o serviço de notificações apresenta uma falha
      Quando o administrador publica um aviso pela API
      Então a API responde com o status "201 Created"
      E o aviso fica registrado e disponível no mural


    # Sem autenticação
    @fluxo_infeliz @regra_negocio @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API nega a consulta de notificações sem token de acesso
      Quando uma requisição de consulta de notificações é enviada sem token de acesso
      Então a API responde com o status "401 Unauthorized"


  Regra: Entrega por Firebase/APNs e alteração de alocação (ainda não implementado)

    Contexto:
      Dado que o aluno "Maria Souza" está autenticado no aplicativo com cadastro aprovado e vínculo válido
      E o aluno permitiu as notificações do aplicativo no sistema operacional


    # AC-02, passo 11 - App fechado ou em segundo plano
    @fluxo_feliz @nao_implementado @prioridade_alta
    Esquema do Cenário: Aluno visualiza a notificação com o aplicativo <situacao>
      Dado que o aplicativo está <situacao>
      Quando o sistema dispara uma notificação para o aparelho de "Maria Souza"
      Então o smartphone exibe o alerta na tela

      Exemplos:
        | situacao         |
        | fechado          |
        | em segundo plano |


    # AC-01, passos 8 a 10 - Serviço de mensageria
    @regra_negocio @RNF014 @nao_implementado @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API envia a notificação ao serviço de mensageria nativo a cada aviso publicado
      Quando o administrador publica um aviso
      Então a API envia a requisição de disparo ao serviço de mensageria (Firebase ou APNs)
      E o serviço de mensageria entrega a notificação ao aparelho do aluno


    # FA-001, AC-04 - Dispositivo offline
    @fluxo_infeliz @FA001 @conectividade @nao_implementado @prioridade_alta
    Cenário: Notificação é entregue quando o aparelho volta a ter conexão
      Dado que o aparelho de "Maria Souza" está sem conexão com a internet
      Quando o sistema dispara uma notificação para o aparelho de "Maria Souza"
      Então o serviço de mensageria retém a notificação
      Quando a conexão com a internet é restabelecida
      Então o smartphone exibe o alerta na tela


    # AC-01 - Alteração de última hora na alocação
    @fluxo_feliz @nao_implementado @prioridade_alta
    Esquema do Cenário: Alteração de <alteracao> na alocação do aluno dispara a notificação
      Dado que "Maria Souza" está alocada no ônibus "ABC1D23" da rota "Rota Centro - UFC" para o dia "17/11/2026"
      Quando o administrador altera a alocação de "Maria Souza" mudando <alteracao>
      Então o sistema dispara uma notificação para o aparelho de "Maria Souza"
      E a notificação informa o novo ônibus ou a nova rota

      Exemplos:
        | alteracao |
        | o ônibus  |
        | a rota    |


    # AC-01 - Somente o aluno afetado é notificado
    @fluxo_feliz @nao_implementado @prioridade_alta
    Cenário: Alteração na alocação notifica somente o aluno afetado
      Dado que "Maria Souza" e "João Lima" estão alocados no dia "17/11/2026"
      Quando o administrador altera apenas a alocação de "Maria Souza"
      Então o sistema dispara a notificação somente para o aparelho de "Maria Souza"
      E "João Lima" não recebe nenhuma notificação


    # AC-03 - Toque na notificação de alocação
    @fluxo_feliz @nao_implementado @prioridade_alta
    Cenário: Ao tocar na notificação de mudança de rota ou de ônibus, o aplicativo abre a Consulta de Alocação
      Dado que "Maria Souza" recebeu uma notificação de mudança de ônibus
      Quando o aluno toca na notificação
      Então o aplicativo é aberto diretamente na tela "Consulta de Alocação"


    # AC-06, RN-009 - Dados atualizados
    @regra_negocio @RN009 @nao_implementado @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Notificação e consulta de alocação refletem sempre a alocação mais recente do aluno
      Dado que "Maria Souza" foi realocada duas vezes no mesmo dia, para os ônibus "XYZ9K87" e depois "QWE5R67"
      Quando "Maria Souza" abre a notificação mais recente e consulta a alocação do dia
      Então os dados de ônibus, placa, motorista e rota exibidos são os do ônibus "QWE5R67"
