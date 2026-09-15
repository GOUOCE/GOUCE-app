# =================================================================================
# ÉPICO: EP-001 - Autenticação e Gestão de Conta
# HISTÓRIA DE USUÁRIO: HU-028 - Renovação de Vínculo Institucional
# REQUISITOS RELACIONADOS: RF-030 (Upload de Comprovantes), RF-033 (Renovação Semestral)
# REQ. NÃO FUNCIONAIS: RNF-016 (Armazenamento de Arquivos em Nuvem)
# REGRA DE NEGÓCIO: RN-011 (Status de Cadastro Pendente), RN-013 (Validade do Vínculo Institucional)
# language: pt
# =================================================================================

@EP001 @HU028 @renovacao_vinculo
Funcionalidade: Renovação de Vínculo Institucional
  Como aluno com cadastro previamente aprovado
  Quero realizar o upload do meu comprovante de matrícula atualizado no início de um novo semestre letivo
  Para revalidar meu vínculo institucional e voltar a ter o direito de agendar o transporte

  Contexto:
    Dado que o aluno "Maria Souza" possui cadastro previamente aprovado com vínculo vencido
    E realiza login no aplicativo
    E o aplicativo possui conexão ativa com a API


  # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-01, AC-05
  @fluxo_feliz @smoke @prioridade_alta
  Cenário: Aluno realiza a renovação de vínculo institucional com sucesso
    Então o sistema exibe um aviso destacado de necessidade de renovação
    Quando o aluno seleciona a opção de renovar vínculo
    E anexa o comprovante de matrícula atualizado no formato "PDF" com 2MB
    E toca no botão "Enviar"
    Então o sistema exibe a mensagem "Comprovante enviado com sucesso"
    E o sistema altera o status do aluno para "Em Análise"
    E o documento é encaminhado para a fila do administrador


  # AC-02 - Envio sem anexo é bloqueado
  @fluxo_infeliz @validacao_campos @prioridade_alta
  Cenário: Sistema bloqueia o envio da renovação quando nenhum arquivo é anexado
    Quando o aluno seleciona a opção de renovar vínculo
    E tenta enviar sem selecionar nenhum arquivo
    Então o sistema bloqueia a ação
    E o sistema exibe um alerta de que o comprovante é obrigatório


  # AC-03 - Formato e tamanho de arquivo inválidos
  @fluxo_infeliz @validacao_campos @prioridade_alta
  Esquema do Cenário: Sistema bloqueia o envio de arquivos em formato ou tamanho inválido
    Quando o aluno seleciona a opção de renovar vínculo
    E anexa um arquivo no formato "<formato>" com "<tamanho>"
    E toca no botão "Enviar"
    Então o sistema bloqueia o envio
    E o sistema exibe a mensagem "<mensagem_esperada>"

    Exemplos:
      | formato | tamanho | mensagem_esperada                 |
      | DOCX    | 2MB     | Formato inválido                  |
      | PDF     | 8MB     | Arquivo excede o limite de tamanho |


  # FA-001 - Falha de conexão durante o upload (AC-04)
  @fluxo_infeliz @FA001 @conectividade @prioridade_alta
  Cenário: Sistema orienta nova tentativa quando há falha de conexão durante o upload do comprovante
    Dado que o aluno anexou o comprovante de matrícula atualizado válido
    Mas a comunicação com a API está indisponível
    Quando o aluno toca no botão "Enviar"
    Então o sistema exibe a mensagem "Falha no envio. Verifique sua conexão e tente novamente."
    E o sistema mantém a tela de renovação ativa para uma nova tentativa


  # AC-06 - Acesso ao agendamento permanece bloqueado durante a análise
  @regra_negocio @RN011 @prioridade_alta
  Cenário: Aluno com renovação em análise permanece sem acesso ao agendamento de transporte
    Dado que o aluno "Maria Souza" está com status "Em Análise" após enviar a renovação
    Quando "Maria Souza" acessa o menu de agendamentos
    Então o sistema mantém o acesso ao agendamento bloqueado
    E o sistema exibe um informativo de que a liberação depende da validação do documento
