# =================================================================================
# ÉPICO: EP-001 - Autenticação e Gestão de Conta
# HISTÓRIA DE USUÁRIO: HU-031 - Consultar Pendência de Cadastro
# REQUISITOS RELACIONADOS: RF-005 (Cadastro de Aluno), RF-030 (Upload de Comprovantes), RF-031 (Avaliação de Solicitação de Cadastro)
# REQ. NÃO FUNCIONAIS: RNF-003 (HTTPS), RNF-009 (Controle de Acesso), RNF-010 (Privacidade e Proteção de Dados), RNF-016 (Armazenamento de Arquivos em Nuvem)
# REGRA DE NEGÓCIO: RN-011 (Status de Cadastro Pendente), RN-012 (Reprovação de Cadastro)
# language: pt
# =================================================================================

@EP001 @HU031 @consulta_pendencia_cadastro
Funcionalidade: Consultar Pendência de Cadastro
  Como aluno
  Quero visualizar o resultado da avaliação do meu cadastro e identificar quais documentos foram reprovados e os respectivos motivos
  Para corrigir as pendências e reenviar os documentos para uma nova avaliação


  Regra: O aluno acompanha o resultado da avaliação do seu cadastro na tela "Status do Cadastro"

    Contexto:
      Dado que o aplicativo possui conexão ativa com a API


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-01, AC-02
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Aluno com cadastro reprovado acessa o "Status do Cadastro" após o login
      Dado que o aluno "João Pereira" possui o cadastro reprovado
      Quando o aluno realiza login no aplicativo
      E acessa a tela "Status do Cadastro"
      Então o sistema consulta a situação atual do cadastro
      E exibe o status "Reprovado"


    # AC-02 - Status atual da solicitação de cadastro
    @fluxo_feliz @prioridade_alta
    Esquema do Cenário: Sistema exibe o status atual do cadastro do aluno
      Dado que o aluno possui o cadastro com status "<situacao>"
      Quando o aluno realiza login e acessa a tela "Status do Cadastro"
      Então o sistema exibe o status "<status_exibido>"

      Exemplos:
        | situacao  | status_exibido        |
        | pendente  | Pendente de aprovação |
        | aprovado  | Aprovado              |
        | reprovado | Reprovado             |


    # FA-001 (AC-08) - Cadastro aprovado
    @fluxo_feliz @FA001 @prioridade_alta
    Cenário: Sistema informa que não há pendências para o aluno com cadastro aprovado
      Dado que o aluno "Maria Souza" possui o cadastro aprovado
      Quando o aluno realiza login e acessa a tela "Status do Cadastro"
      Então o sistema exibe o status "Aprovado"
      E informa que não há pendências
      E não oferece nenhuma opção de reenvio de documentos


    # FA-002 - Cadastro ainda pendente
    @fluxo_infeliz @FA002 @prioridade_alta
    Cenário: Sistema informa que o cadastro pendente aguarda a avaliação do administrador
      Dado que o aluno "Carlos Lima" possui o cadastro pendente de aprovação
      Quando o aluno realiza login e acessa a tela "Status do Cadastro"
      Então o sistema exibe o status "Pendente de aprovação"
      E informa que o cadastro aguarda a avaliação do administrador
      E não exibe documentos reprovados nem opção de reenvio de documentos


    # AC-01, FA-002, RN-011 - Cadastro pendente não impede o login
    @fluxo_infeliz @FA002 @regra_negocio @RN011 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API permite o login do aluno com cadastro <situacao> para consultar o status
      Dado que o aluno possui o cadastro com status "<situacao>"
      Quando o aluno envia as credenciais corretas para a API de login
      Então a API responde com o status "200 OK"
      E a resposta informa o status do cadastro "<status_api>"

      Exemplos:
        | situacao  | status_api |
        | pendente  | pendente   |
        | aprovado  | ativado    |
        | reprovado | rejeitado  |


    # RN-011 - Cadastro não aprovado não acessa o agendamento
    @fluxo_infeliz @regra_negocio @RN011 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega o agendamento de transporte ao aluno com cadastro <situacao>
      Dado que o aluno possui o cadastro com status "<situacao>"
      Quando o aluno envia uma requisição para agendar um dia de transporte
      Então a API responde com o status "403 Forbidden"

      Exemplos:
        | situacao  |
        | pendente  |
        | reprovado |


  Regra: O aluno identifica os documentos reprovados e os motivos informados pelo administrador

    Contexto:
      Dado que o aluno "João Pereira" possui o cadastro reprovado
      E o administrador reprovou o "Comprovante de Matrícula" com o motivo "Comprovante de matrícula desatualizado."
      E o administrador reprovou o "Comprovante de Residência" com o motivo "Comprovante com mais de 3 meses."
      E a "Foto de Perfil" do aluno não foi reprovada
      E o aplicativo possui conexão ativa com a API


    # AC-03, AC-04 - Documentos reprovados e respectivos motivos
    @fluxo_feliz @prioridade_alta
    Cenário: Sistema apresenta os documentos enviados, indica os reprovados e exibe o motivo de cada um
      Quando o aluno acessa a tela "Status do Cadastro"
      Então o sistema exibe a relação dos documentos enviados
      E indica que o "Comprovante de Matrícula" e o "Comprovante de Residência" foram reprovados
      E exibe, junto ao "Comprovante de Matrícula", o motivo "Comprovante de matrícula desatualizado."
      E exibe, junto ao "Comprovante de Residência", o motivo "Comprovante com mais de 3 meses."
      E não indica a "Foto de Perfil" como reprovada


    # AC-03, AC-04 - API informa apenas os documentos reprovados com o motivo
    @regra_negocio @RN012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API devolve somente os documentos reprovados, cada um com o motivo do administrador
      Quando o aluno consulta as pendências de reenvio de documentos pela API
      Então a API responde com o status "200 OK"
      E a resposta contém somente os documentos "comprovante_matricula" e "comprovante_residencia"
      E cada documento informa o motivo escrito pelo administrador
      E a resposta não contém o documento "foto_perfil"


    # AC-08 - API informa lista vazia quando não há pendências
    @fluxo_feliz @FA001 @FA002 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API devolve a lista de pendências vazia para o aluno com cadastro <situacao>
      Dado que o aluno possui o cadastro com status "<situacao>"
      Quando o aluno consulta as pendências de reenvio de documentos pela API
      Então a API responde com o status "200 OK"
      E a lista de documentos para reenvio está vazia

      Exemplos:
        | situacao |
        | pendente |
        | aprovado |


    # RNF-010 - Cada aluno consulta somente as próprias pendências
    @regra_negocio @RNF010 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Aluno visualiza apenas os documentos e motivos do próprio cadastro
      Dado que o aluno "Ana Costa" também possui o cadastro reprovado, com o "Comprovante de Residência" reprovado pelo motivo "Endereço ilegível."
      Quando "João Pereira" consulta as pendências de reenvio de documentos pela API
      Então a resposta não contém o documento nem o motivo de "Ana Costa"


  Regra: O aluno reenvia os documentos reprovados e o cadastro volta para avaliação

    Contexto:
      Dado que o aluno "João Pereira" possui o cadastro reprovado
      E o administrador reprovou o "Comprovante de Matrícula" e o "Comprovante de Residência"
      E a "Foto de Perfil" do aluno não foi reprovada
      E o aplicativo possui conexão ativa com a API


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-05, AC-06
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Aluno seleciona os documentos reprovados, reenvia e o cadastro volta para "Pendente de Aprovação"
      Quando o aluno acessa a tela "Status do Cadastro"
      E seleciona a opção de corrigir a documentação
      E anexa o novo "Comprovante de Matrícula" no formato "PDF" com 1MB
      E anexa o novo "Comprovante de Residência" no formato "JPG" com 1MB
      E clica no botão de reenviar
      Então o sistema exibe a mensagem "Sua documentação foi reenviada com sucesso. Seu status foi atualizado para Pendente de Aprovação."
      E o status do cadastro passa a ser "Pendente de aprovação"


    # AC-06 - API registra o reenvio e atualiza o status
    @regra_negocio @RN012 @RNF016 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API registra o reenvio, substitui os arquivos reprovados e muda o status para pendente
      Quando o aluno reenvia pela API o novo "comprovante_matricula" e o novo "comprovante_residencia"
      Então a API responde com o status "200 OK"
      E a resposta informa a mensagem "Documentos enviados com sucesso! Seu cadastro foi encaminhado para análise."
      E o status do cadastro passa a ser "pendente"
      E os comprovantes de matrícula e de residência do aluno apontam para os arquivos novos, armazenados fora do banco de dados relacional
      E a foto de perfil do aluno permanece a mesma


    # Fluxo principal, passos 16 e 17 - Aguarda nova avaliação
    @fluxo_feliz @RN012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Cadastro reenviado volta para a fila de solicitações pendentes do administrador
      Dado que o aluno reenviou os documentos reprovados
      Quando o administrador visualiza a listagem de "Solicitações Pendentes"
      Então o sistema exibe o cadastro de "João Pereira" com os documentos novos
      E posiciona o cadastro pela data e hora do novo envio


    # AC-06 - Sessão mantida após o reenvio
    @fluxo_feliz @RN011 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Aluno continua autenticado e consulta o status "Pendente de aprovação" depois do reenvio
      Dado que o aluno reenviou os documentos reprovados
      Quando o aluno consulta o status do cadastro com a mesma sessão e depois realiza um novo login
      Então a API não encerra a sessão do aluno
      E o novo login é aceito
      E o status do cadastro é "pendente"


    # AC-07 - Somente os documentos reprovados podem ser reenviados na tela
    @fluxo_infeliz @validacao_campos @prioridade_alta
    Cenário: Sistema impede o aluno de alterar documentos que não foram reprovados
      Dado que o administrador reprovou somente a "Foto de Perfil" do aluno "Rafael Alves"
      Quando "Rafael Alves" acessa a tela de correção da documentação
      Então o sistema permite alterar somente a "Foto de Perfil"
      E o "Comprovante de Matrícula" e o "Comprovante de Residência" aparecem bloqueados ou ocultos


    # AC-07 - API recusa documento que não foi solicitado
    @fluxo_infeliz @regra_negocio @RN012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API recusa o reenvio do documento "<tipo>" que não foi reprovado
      Dado que o administrador reprovou somente a "foto_perfil" do aluno "Rafael Alves"
      Quando "Rafael Alves" reenvia pela API o documento "<tipo>"
      Então a API responde com o status "400 Bad Request"
      E a resposta informa a mensagem "Este documento não foi solicitado pelo administrador: <tipo>"
      E nenhum documento do aluno é alterado

      Exemplos:
        | tipo                   |
        | comprovante_matricula  |
        | comprovante_residencia |


    # AC-05 - API exige o reenvio de todos os documentos reprovados
    @fluxo_infeliz @validacao_campos @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: API recusa o reenvio quando falta algum dos documentos reprovados
      Dado que o administrador reprovou o "comprovante_matricula" e o "comprovante_residencia" do aluno "João Pereira"
      Quando "João Pereira" reenvia pela API somente o "comprovante_matricula"
      Então a API responde com o status "400 Bad Request"
      E a resposta informa a mensagem "Para concluir o reenvio, envie também os seguintes documentos: comprovante_residencia"
      E o cadastro continua com o status "rejeitado"


    # AC-05 - API recusa o reenvio sem nenhum arquivo
    @fluxo_infeliz @validacao_campos @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: API recusa o reenvio quando nenhum documento é enviado
      Quando "João Pereira" envia pela API o reenvio sem nenhum arquivo
      Então a API responde com o status "400 Bad Request"
      E a resposta informa a mensagem "Selecione pelo menos um documento para continuar o reenvio."
      E o cadastro continua com o status "rejeitado"


    # RN-012 - Reenvio disponível somente para cadastro reprovado
    @fluxo_infeliz @regra_negocio @RN012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega o reenvio de documentos ao aluno com cadastro <situacao>
      Dado que o aluno possui o cadastro com status "<situacao>"
      Quando o aluno tenta reenviar documentos pela API
      Então a API responde com o status "403 Forbidden"
      E a resposta informa a mensagem "O reenvio de documentos está disponível somente para cadastros rejeitados."
      E nenhum documento do aluno é alterado

      Exemplos:
        | situacao |
        | pendente |
        | aprovado |


  Regra: Falhas no envio mantêm o cadastro reprovado e não alteram nenhum documento

    Contexto:
      Dado que o aluno "Rafael Alves" possui o cadastro reprovado com a "Foto de Perfil" reprovada
      E o aplicativo possui conexão ativa com a API


    # FA-003 - Falha de comunicação durante o envio
    @fluxo_infeliz @FA003 @conectividade @prioridade_alta
    Cenário: Sistema informa o erro e mantém o cadastro reprovado quando a conexão falha durante o reenvio
      Dado que o aluno anexou a nova "Foto de Perfil" na tela de correção da documentação
      E o aplicativo perde a conexão com a internet no momento do envio
      Quando o aluno clica no botão de reenviar
      Então o sistema exibe a mensagem de erro "Erro ao reenviar documentos. Tente novamente."
      E o status do cadastro continua "Reprovado"
      E nenhum documento do aluno é alterado


    # FA-003 - Arquivo inválido no reenvio
    @fluxo_infeliz @FA003 @validacao_campos @prioridade_alta
    Esquema do Cenário: Sistema bloqueia o reenvio do arquivo em formato ou tamanho inválido
      Quando o aluno anexa uma nova "Foto de Perfil" no formato "<formato>" com "<tamanho>"
      E clica no botão de reenviar
      Então o sistema bloqueia o envio
      E exibe uma mensagem de erro informando que o arquivo é inválido
      E o status do cadastro continua "Reprovado"

      Exemplos:
        | formato | tamanho |
        | TXT     | 1MB     |
        | JPG     | 6MB     |


    # FA-003 - API recusa arquivo inválido sem alterar o cadastro
    @fluxo_infeliz @FA003 @validacao_campos @RNF016 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API recusa o reenvio da foto de perfil <situacao_arquivo>
      Quando o aluno reenvia pela API a "foto_perfil" <situacao_arquivo>
      Então a API responde com o status "400 Bad Request"
      E a resposta informa a mensagem "<mensagem>"
      E o cadastro continua com o status "rejeitado"
      E nenhum arquivo sem dono é gravado no armazenamento

      Exemplos:
        | situacao_arquivo                | mensagem                                                                                                                               |
        | com mais de 5MB                 | Não foi possível enviar o documento. O arquivo 'foto.jpg' excede o tamanho máximo permitido de 5MB                                     |
        | em formato não permitido (.txt) | Não foi possível enviar o documento. Formato de arquivo inválido. Apenas arquivos PDF e Imagens (PNG, JPG, JPEG, WEBP) são permitidos. |
        | vazio                           | Não foi possível enviar o documento. O arquivo enviado está vazio                                                                      |


  Regra: Somente o aluno autenticado consulta e reenvia os próprios documentos

    # RNF-009 - Requisição sem autenticação
    @fluxo_infeliz @regra_negocio @RNF009 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega a <operacao> sem token de acesso
      Quando uma requisição de <operacao> é enviada sem token de acesso
      Então a API responde com o status "401 Unauthorized"
      E nenhum dado de cadastro é exibido ou alterado

      Exemplos:
        | operacao                |
        | consulta das pendências |
        | reenvio de documentos   |


    # RNF-009 - Perfis diferentes de aluno não usam a consulta e o reenvio do aluno
    @fluxo_infeliz @regra_negocio @RNF009 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API nega a consulta de pendências e o reenvio de documentos ao administrador
      Dado que um usuário com perfil "Administrador" possui um token de acesso válido
      Quando esse usuário consulta as pendências de reenvio e tenta reenviar documentos pela API
      Então a API responde com o status "403 Forbidden" em todas as requisições
      E nenhum dado de cadastro é exibido ou alterado


    # RNF-003 - Comunicação criptografada
    @nao_funcional @seguranca @RNF003 @teste_api @nao_automatizavel_via_appium
    Cenário: Comunicação do reenvio de documentos ocorre exclusivamente via HTTPS
      Quando o aplicativo envia a requisição de reenvio de documentos para a API
      Então a requisição é realizada utilizando o protocolo HTTPS
