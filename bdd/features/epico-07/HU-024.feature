# =================================================================================
# ÉPICO: EP-007 - Comunicação e Mural de Avisos
# HISTÓRIA DE USUÁRIO: HU-024 - Recebimento de Notificações Push
# REQUISITOS RELACIONADOS: RF-025 (Recebimento de Notificações Push)
# REQ. NÃO FUNCIONAIS: RNF-014 (Confiabilidade das Notificações)
# REGRA DE NEGÓCIO: RN-009 (Informações de Alocação Atualizadas)
# language: pt
# =================================================================================

@EP007 @HU024 @notificacoes_push
Funcionalidade: Recebimento de Notificações Push
  Como aluno
  Quero receber notificações (push) no meu smartphone sempre que houver um aviso ou alteração na minha rota
  Para ser informado imediatamente sobre imprevistos sem precisar abrir o aplicativo constantemente


  Regra: O sistema dispara a notificação quando ocorre um aviso ou uma alteração na alocação

    Contexto:
      Dado que o aluno "Maria Souza" está autenticado no aplicativo com cadastro aprovado e vínculo válido
      E o aluno permitiu as notificações do aplicativo no sistema operacional
      E o aparelho do aluno está registrado para receber notificações


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-01, passos 7 a 10
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Publicação de um aviso dispara a notificação para o aluno
      Quando o administrador publica o aviso "Alteração no horário da Rota Centro - UFC"
      Então a API monta a notificação com o título e o texto do aviso
      E envia a requisição de disparo para o serviço de mensageria nativo
      E o serviço de mensageria entrega a notificação ao aparelho de "Maria Souza"


    # AC-01 - Alteração de última hora na alocação
    @fluxo_feliz @prioridade_alta
    Esquema do Cenário: Alteração de <alteracao> na alocação do aluno dispara a notificação
      Dado que "Maria Souza" está alocada no ônibus "ABC1D23" da rota "Rota Centro - UFC" para o dia "17/11/2026"
      Quando o administrador altera a alocação de "Maria Souza" mudando <alteracao>
      Então o sistema dispara uma notificação para o aparelho de "Maria Souza"
      E a notificação informa a mudança de alocação

      Exemplos:
        | alteracao |
        | o ônibus  |
        | a rota    |


    # AC-01 - Somente o aluno afetado é notificado
    @fluxo_feliz @prioridade_alta
    Cenário: Alteração na alocação notifica somente o aluno afetado
      Dado que "Maria Souza" e "João Lima" estão alocados no dia "17/11/2026"
      Quando o administrador altera apenas a alocação de "Maria Souza"
      Então o sistema dispara a notificação somente para o aparelho de "Maria Souza"
      E "João Lima" não recebe nenhuma notificação


    # AC-06, RN-009 - Dados atualizados
    @regra_negocio @RN009 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Notificação e consulta de alocação refletem sempre a alocação mais recente do aluno
      Dado que "Maria Souza" foi realocada duas vezes no mesmo dia, para os ônibus "XYZ9K87" e depois "QWE5R67"
      Quando "Maria Souza" abre a notificação mais recente e consulta a alocação do dia
      Então os dados de ônibus, placa, motorista e rota exibidos são os do ônibus "QWE5R67"


    # RNF-014 - Disparo garantido
    @regra_negocio @RNF014 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API dispara a notificação a cada evento configurado (<evento>)
      Quando ocorre o evento "<evento>"
      Então a API envia a requisição ao serviço de mensageria (Firebase ou APNs)
      E o disparo fica registrado com o evento e o aluno destinatário

      Exemplos:
        | evento                       |
        | publicação de aviso          |
        | alteração de ônibus do aluno |
        | alteração de rota do aluno   |


  Regra: O aluno recebe a notificação no aparelho e abre a tela correspondente

    Contexto:
      Dado que o aluno "Maria Souza" está autenticado no aplicativo com cadastro aprovado e vínculo válido
      E o aluno permitiu as notificações do aplicativo no sistema operacional


    # AC-02, passo 11 - App fechado ou em segundo plano
    @fluxo_feliz @prioridade_alta
    Esquema do Cenário: Aluno visualiza a notificação com o aplicativo <situacao>
      Dado que o aplicativo está <situacao>
      Quando o sistema dispara uma notificação para o aparelho de "Maria Souza"
      Então o smartphone exibe o alerta na tela

      Exemplos:
        | situacao         |
        | fechado          |
        | em segundo plano |


    # AC-03, passo 12 - Abertura na tela correspondente
    @fluxo_feliz @prioridade_alta
    Esquema do Cenário: Ao tocar na notificação de <evento>, o aplicativo abre na tela "<tela>"
      Dado que "Maria Souza" recebeu uma notificação de <evento>
      Quando o aluno toca na notificação
      Então o aplicativo é aberto diretamente na tela "<tela>"

      Exemplos:
        | evento                       | tela                 |
        | aviso                        | Mural de Avisos      |
        | mudança de rota ou de ônibus | Consulta de Alocação |


    # AC-03 - Toque na notificação de aviso exibe o aviso
    @fluxo_feliz @prioridade_media
    Cenário: Ao tocar na notificação do aviso, o aluno encontra o aviso no mural
      Dado que "Maria Souza" recebeu a notificação do aviso "Alteração no horário da Rota Centro - UFC"
      Quando o aluno toca na notificação
      Então o Mural de Avisos exibe o aviso "Alteração no horário da Rota Centro - UFC"


    # FA-001, AC-04 - Dispositivo offline
    @fluxo_infeliz @FA001 @conectividade @prioridade_alta
    Cenário: Notificação é entregue quando o aparelho volta a ter conexão
      Dado que o aparelho de "Maria Souza" está sem conexão com a internet
      Quando o sistema dispara uma notificação para o aparelho de "Maria Souza"
      Então o serviço de mensageria retém a notificação
      Quando a conexão com a internet é restabelecida
      Então o smartphone exibe o alerta na tela


    # FA-002, AC-05 - Permissão desativada
    @fluxo_infeliz @FA002 @prioridade_alta
    Cenário: Notificação não é exibida quando o aluno desativou as permissões e o aviso continua no mural
      Dado que o aluno desativou as permissões de notificação do aplicativo nas configurações do sistema operacional
      E o administrador publica o aviso "Alteração no horário da Rota Centro - UFC"
      Então o smartphone não exibe nenhuma notificação
      Quando o aluno abre o aplicativo e acessa a aba "Avisos"
      Então o Mural de Avisos exibe o aviso "Alteração no horário da Rota Centro - UFC"


    # AC-02, FA-002 - Solicitação de permissão
    @fluxo_feliz @prioridade_media
    Cenário: Aplicativo solicita a permissão de notificação ao aluno
      Dado que o aluno ainda não definiu a permissão de notificação
      Quando o aluno abre o aplicativo depois do login
      Então o sistema solicita a permissão para exibir notificações
      E registra o aparelho para receber as notificações quando o aluno permitir
