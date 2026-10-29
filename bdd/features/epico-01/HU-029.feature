# =================================================================================
# ÉPICO: EP-001 - Autenticação e Gestão de Conta
# HISTÓRIA DE USUÁRIO: HU-029 - Carteirinha Digital do Aluno
# REQUISITOS RELACIONADOS: RF-032 (Emissão de Carteirinha Digital)
# REQ. NÃO FUNCIONAIS: RNF-015 (Disponibilidade das Informações de Alocação - modo offline)
# REGRA DE NEGÓCIO: Nenhuma restritiva
# language: pt
# =================================================================================

@EP001 @HU029 @carteirinha_digital
Funcionalidade: Carteirinha Digital do Aluno
  Como aluno com status aprovado
  Quero acessar minha carteirinha digital diretamente no aplicativo, exibindo foto, dados e um QR Code
  Para comprovar minha identidade e meu direito de utilizar o ônibus no momento do embarque

  Contexto:
    Dado que o aluno acessa o aplicativo


  # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-01
  @fluxo_feliz @smoke @prioridade_alta
  Cenário: Aluno aprovado acessa a carteirinha digital com todos os dados obrigatórios
    Dado que o aluno "Maria Souza" possui status "Aprovado"
    Quando o aluno seleciona a opção "Carteirinha Digital"
    Então o sistema exibe a foto de perfil do aluno
    E o sistema exibe os dados de identificação: nome completo, curso e instituição
    E o sistema exibe o QR Code gerado para o aluno


  # AC-02 - Carteirinha indisponível para status diferente de "Aprovado"
  @fluxo_infeliz @prioridade_alta
  Esquema do Cenário: Sistema oculta a carteirinha digital para alunos sem status "Aprovado"
    Dado que o aluno "João Pereira" possui status "<status>"
    Quando o aluno seleciona a opção "Carteirinha Digital"
    Então o sistema oculta o documento da carteirinha
    E o sistema exibe a mensagem "Carteirinha indisponível. Seu cadastro está inativo ou em análise."

    Exemplos:
      | status                 |
      | Em Análise             |
      | Inativo                |
      | Pendente de Aprovação  |


  # FA-001 - Consulta de carteirinha offline (AC-03)
  @fluxo_infeliz @FA001 @conectividade @prioridade_alta
  Cenário: Sistema exibe a versão em cache da carteirinha quando o aluno está offline
    Dado que o aluno "Maria Souza" possui status "Aprovado"
    E já acessou a carteirinha digital com sucesso em uma conexão anterior
    Mas o dispositivo está sem conexão com a internet no momento do embarque
    Quando o aluno seleciona a opção "Carteirinha Digital"
    Então o sistema não exibe erro de conexão
    E o sistema carrega instantaneamente a versão em cache salva na última conexão válida
    E o sistema exibe normalmente a foto, os dados e o QR Code


  # AC-04 - Nitidez do QR Code
  @nao_funcional @usabilidade @prioridade_media @nao_automatizavel_via_appium
  Cenário: QR Code da carteirinha mantém nitidez e contraste adequados para leitura no embarque
    Dado que o aluno "Maria Souza" acessa a carteirinha digital, online ou offline
    Então o QR Code exibido possui nitidez, tamanho e contraste adequados para leitura por validadores físicos


  # AC-05 - Desempenho de carregamento
  @nao_funcional @desempenho @prioridade_media @nao_automatizavel_via_appium
  Cenário: Carteirinha digital carrega rapidamente sem travar a navegação do usuário
    Dado que o aluno "Maria Souza" possui status "Aprovado" e está com conexão ativa
    Quando o aluno seleciona a opção "Carteirinha Digital"
    Então o sistema carrega e renderiza a carteirinha rapidamente
    E a navegação do aplicativo não trava durante o carregamento
