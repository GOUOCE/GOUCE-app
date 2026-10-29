# =================================================================================
# ÉPICO: EP-001 - Autenticação e Gestão de Conta
# HISTÓRIA DE USUÁRIO: HU-001 - Solicitação de Cadastro de Aluno
# REQUISITOS RELACIONADOS: RF-004 (Aceite de Termos), RF-005 (Cadastro de Aluno)
# REQ. NÃO FUNCIONAIS: RNF-002 (Hash de senha), RNF-003 (HTTPS), RNF-010 (LGPD)
# REGRA DE NEGÓCIO: RN-011 (Status de Cadastro Pendente)
# language: pt
# =================================================================================

@EP001 @HU001 @cadastro_aluno
  Funcionalidade: Solicitação de Cadastro de Aluno
  Como aluno
  Quero solicitar meu cadastro no aplicativo informando meus dados e anexando meus comprovantes,
  aceitando os termos de uso e política de privacidade
  Para passar pela avaliação da coordenação e ter acesso às funcionalidades do sistema

  Contexto:
    Dado que o usuário abre o aplicativo e está na tela "Solicitação de Cadastro"
    E o aplicativo possui conexão ativa com a API


  # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-01, AC-05, AC-06, AC-07, AC-08, AC-09
  @fluxo_feliz @smoke @prioridade_alta
  Cenário: Cadastro de aluno concluído com sucesso ao preencher todos os dados corretamente
    Quando o usuário preenche os dados pessoais:
      | campo                   | valor                     |
      | Nome completo           | Maria da Silva Souza      |
      | E-mail                  | maria.souza@aluno.ufc.br  |
      | Senha                   | Senha@123                 |
      | Confirmação de senha    | Senha@123                 |
      | Data de nascimento      | 15/03/2002                |
      | Raça                    | Parda                     |
      | Identificação de gênero | Feminino                  |
      | Identificação sexual    | Heterossexual             |
      | Tem filhos              | Não                       |
      | Bairro/Localidade       | Centro                    |
      | WhatsApp                | (85) 99999-0000           |
    E o usuário preenche os dados acadêmicos:
      | campo                    | valor                   |
      | Instituição              | UFC - Campus Quixadá    |
      | Curso                    | Engenharia de Software  |
      | Campus                   | Quixadá                 |
      | Período de ingresso      | 2024.1                  |
      | Turno do curso           | Manhã                   |
      | Quantidade de semestres  | 5                       |
    E o usuário anexa o "Comprovante de Matrícula (ou Histórico)" válido
    E o usuário anexa o "Comprovante de Residência" válido
    E o usuário clica no botão "Avançar"
    Então o sistema exibe a tela com os Termos de Uso e Política de Privacidade
    Quando o usuário marca a opção "Li e aceito os Termos de Uso e a Política de Privacidade"
    E o usuário clica no botão "Enviar Cadastro"
    Então o sistema valida os dados informados sem apontar erros
    E o sistema salva a solicitação de cadastro com status "Pendente de Aprovação"
    E o sistema exibe a mensagem de sucesso "Cadastro enviado para análise da coordenação"
    # COMPORTAMENTO VALIDADO PELO PO: cadastro não gera sessão automática; usuário retorna à tela de login
    E o usuário é direcionado para a tela de login


  # REGRA DE NEGÓCIO RN-011 - Bloqueio de acesso enquanto o cadastro está pendente
  # ATENÇÃO: cenário de integração - depende da implementação de HU-002 (Login) e HU-003 (Controle de Acesso por Perfil)
  @regra_negocio @RN011 @fluxo_infeliz @prioridade_alta @depende_de_HU002 @depende_de_HU003
  Cenário: Aluno com cadastro pendente de aprovação não acessa o agendamento de transporte
    Dado que existe um aluno cadastrado com status "Pendente de Aprovação"
    Quando esse aluno realiza login no aplicativo com sucesso
    Então o sistema não exibe o menu "Agendamento de Transporte" para esse aluno
    E o sistema exibe uma mensagem informando que o cadastro ainda está em análise pela coordenação


  # FA-001 - E-mail já cadastrado no sistema (AC-04)
  @fluxo_infeliz @FA001 @prioridade_alta
  Cenário: Sistema impede cadastro com e-mail já existente
    Dado que já existe um usuário cadastrado com o e-mail "joao.pereira@aluno.ufc.br"
    Quando o usuário preenche o campo "E-mail" com "joao.pereira@aluno.ufc.br"
    E preenche os demais campos obrigatórios corretamente
    E anexa os comprovantes obrigatórios válidos
    E clica no botão "Avançar"
    Então o sistema bloqueia a conclusão do cadastro
    E o sistema exibe a mensagem "Este e-mail já está em uso. Faça login ou recupere sua senha."
    E o sistema não avança para a tela de Termos de Uso


  # FA-002 - Campos de texto/seleção obrigatórios não preenchidos (AC-02)
  @fluxo_infeliz @FA002 @validacao_campos @prioridade_alta
  Esquema do Cenário: Sistema bloqueia o envio quando um campo de texto ou seleção obrigatório não é preenchido
    Dado que o usuário preencheu todos os campos obrigatórios corretamente
    E anexou os comprovantes obrigatórios válidos
    Quando o usuário limpa o campo "<campo_obrigatorio>"
    E clica no botão "Avançar"
    Então o sistema bloqueia o envio do formulário
    E o sistema sinaliza o campo "<campo_obrigatorio>" como pendente
    E o sistema não avança para a tela de Termos de Uso

    Exemplos:
      | <campo_obrigatorio>                            |
      | E-mail                                         |
      | Nome completo                                  |
      | Senha                                          |
      | Confirmação de senha                           |
      | Data de nascimento                             |
      | Raça                                           |
      | Identificação de gênero                        |
      | Identificação sexual                           |
      | Tem filhos                                     |
      | Bairro/Localidade                              |
      | WhatsApp                                       |
      | Instituição                                    |
      | Curso                                          |
      | Campus                                         |
      | Período de ingresso                            |  
      | Turno do curso                                 | 
      | Quantidade de semestres                        |


  # FA-002 - Comprovantes obrigatórios não anexados (AC-02)
  @fluxo_infeliz @FA002 @validacao_campos @prioridade_alta
  Esquema do Cenário: Sistema bloqueia o envio quando um comprovante obrigatório não é anexado
    Dado que o usuário preencheu todos os campos obrigatórios corretamente
    Quando o usuário não anexa o "<comprovante_obrigatorio>"
    E clica no botão "Avançar"
    Então o sistema bloqueia o envio do formulário
    E o sistema sinaliza o "<comprovante_obrigatorio>" como pendente
    E o sistema não avança para a tela de Termos de Uso

    Exemplos:
      | comprovante_obrigatorio                  |
      | Comprovante de Matrícula (ou Histórico)  |
      | Comprovante de Residência                |


  # AC-03 - Regras de complexidade e confirmação de senha
  @fluxo_infeliz @regra_senha @prioridade_alta
  Esquema do Cenário: Sistema bloqueia o cadastro quando a senha não atende às regras de complexidade
    Dado que o usuário preencheu todos os campos obrigatórios corretamente
    Quando o usuário informa "<senha>" no campo "Senha"
    E informa "<confirmacao_senha>" no campo "Confirmação de senha"
    E clica no botão "Avançar"
    Então o sistema bloqueia o envio do formulário
    E o sistema exibe a mensagem de erro "<mensagem_esperada>"

    Exemplos:
      | senha        | confirmacao_senha | mensagem_esperada                                  |
      | Abc123       | Abc123             | A senha deve ter no mínimo 8 caracteres.           |
      | abcdefgh1    | abcdefgh1          | A senha deve conter pelo menos 1 letra maiúscula.  |
      | ABCDEFGH1    | ABCDEFGH1          | A senha deve conter pelo menos 1 letra minúscula.  |
      | Abcdefgh     | Abcdefgh           | A senha deve conter pelo menos 1 número.           |
      | Senha@123    | Senha@124          | As senhas informadas não coincidem.                |


  # FA-003 - Usuário não aceita os termos de uso (AC-05)
  @fluxo_infeliz @FA003 @prioridade_media
  Cenário: Sistema impede a conclusão do cadastro sem o aceite dos Termos de Uso
    Dado que o usuário preencheu todos os campos obrigatórios corretamente
    E anexou os comprovantes obrigatórios válidos
    E clicou no botão "Avançar"
    E o sistema exibe a tela com os Termos de Uso e Política de Privacidade
    Quando o usuário clica no botão "Enviar Cadastro" sem marcar o aceite dos termos
    Então o sistema impede a conclusão do cadastro
    E o sistema mantém o usuário na tela de Termos de Uso
    E nenhuma solicitação de cadastro é salva no sistema


  # FA-004 - Falha na conexão com a API durante o envio (AC-06)
  @fluxo_infeliz @FA004 @conectividade @prioridade_alta
  Cenário: Sistema preserva os dados preenchidos quando há falha de comunicação com a API
    Dado que o usuário preencheu todos os campos obrigatórios corretamente
    E anexou os comprovantes obrigatórios válidos
    E aceitou os Termos de Uso e Política de Privacidade
    Mas a comunicação com a API está indisponível
    Quando o usuário clica no botão "Enviar Cadastro"
    Então o sistema exibe a mensagem de erro "Não foi possível concluir o cadastro. Verifique sua conexão e tente novamente."
    E o sistema mantém todos os dados já preenchidos na tela
    E nenhuma solicitação de cadastro é salva no sistema


  # REQUISITOS NÃO FUNCIONAIS - validação recomendada via testes de API/backend
  @nao_funcional @seguranca @RNF002 @teste_api @nao_automatizavel_via_appium
  Cenário: Senha do aluno é armazenada com hash seguro e irreversível
    Dado que um aluno concluiu a solicitação de cadastro com a senha "Senha@123"
    Quando o registro do aluno é consultado diretamente no banco de dados
    Então o campo de senha não contém o valor "Senha@123" em texto puro
    E o valor armazenado corresponde a um hash seguro e irreversível

  @nao_funcional @seguranca @RNF003 @teste_api @nao_automatizavel_via_appium
  Cenário: Comunicação entre aplicativo e API ocorre exclusivamente via HTTPS
    Quando o aplicativo envia a requisição de cadastro para a API
    Então a requisição é realizada utilizando o protocolo HTTPS
    E nenhuma informação é transmitida via HTTP não criptografado