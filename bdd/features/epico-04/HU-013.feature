# =================================================================================
# ÉPICO: EP-004 - Agendamento de Transporte (Aluno)
# HISTÓRIA DE USUÁRIO: HU-013 - Agendamento de Transporte
# REQUISITOS RELACIONADOS: RF-015 (Agendamento de Transporte)
# REQ. NÃO FUNCIONAIS: RNF-001 (Desempenho - Tempo de Resposta), RNF-012 (Integridade dos Dados)
# REGRA DE NEGÓCIO: RN-010 (Rotas Complementares)
# language: pt
# =================================================================================

@EP004 @HU013 @agendamento_transporte
Funcionalidade: Agendamento de Transporte
  Como aluno
  Quero acessar um formulário inteligente para agendar meus dias de utilização do transporte,
  informando a faculdade de destino, a faculdade de origem no retorno e os pontos de embarque e desembarque por opções padronizadas
  Para garantir minha vaga de forma rápida e sem erros de digitação


  Regra: O aluno escolhe, no seletor semanal, um ou mais dias disponíveis dentro da janela de agendamento

    Contexto:
      Dado que o aluno "Maria Souza" está autenticado no sistema com cadastro aprovado e vínculo válido
      E acessa a tela "Agendar Transporte"
      E o aplicativo possui conexão ativa com a API


    # AC-01, AC-17 - Seletor semanal com o estado de cada dia
    @fluxo_feliz @smoke @prioridade_alta
    Esquema do Cenário: Sistema identifica visualmente o estado de cada dia no seletor semanal
      Dado que, no seletor semanal, existe um dia no estado "<estado>"
      Quando o aluno visualiza o seletor de dias
      Então o sistema exibe esse dia com a indicação visual própria do estado "<estado>"

      Exemplos:
        | estado       |
        | Agendado     |
        | Disponível   |
        | Indisponível |


    # AC-01 - Sábado e domingo são indisponíveis (decisão do PO na #389, item 2)
    @fluxo_infeliz @validacao_campos @prioridade_alta
    Esquema do Cenário: Sistema bloqueia o novo agendamento em <dia_semana>
      Dado que o dia "<dia>" é <dia_semana>
      Quando o aluno visualiza o seletor de dias
      Então o sistema exibe o dia "<dia>" como "Indisponível"
      E o dia "<dia>" não pode ser selecionado para um novo agendamento

      Exemplos:
        | dia_semana | dia        |
        | sábado     | 14/11/2026 |
        | domingo    | 15/11/2026 |


    # AC-01 - Dia sem nenhuma rota principal ativa é indisponível (decisão do PO na #389, item 2)
    @fluxo_infeliz @validacao_campos @prioridade_media
    Cenário: Sistema exibe como indisponível o dia em que não existe nenhuma rota principal ativa
      Dado que não existe nenhuma rota principal ativa
      Quando o aluno visualiza o seletor de dias
      Então o sistema exibe os dias úteis da janela de agendamento como "Indisponível"
      E nenhum desses dias pode ser selecionado e o botão "Continuar" permanece desabilitado


    # AC-01 - API recusa o agendamento em sábado ou domingo
    @fluxo_infeliz @regra_negocio @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API recusa o agendamento em <dia_semana>
      Dado que o dia "<dia>" é <dia_semana>
      Quando o aluno envia uma requisição para agendar o dia "<dia>" com ida e volta válidas
      Então a API responde com o status "422 Unprocessable Entity"
      E o agendamento não é criado

      Exemplos:
        | dia_semana | dia        |
        | sábado     | 14/11/2026 |
        | domingo    | 15/11/2026 |


    # AC-03 - Dias selecionados habilitam o botão "Continuar"
    @fluxo_feliz @prioridade_alta
    Cenário: Aluno seleciona dias disponíveis e o botão "Continuar" é habilitado
      Dado que os dias "11/11/2026" e "12/11/2026" estão disponíveis para agendamento
      E nenhum dia vem selecionado ao abrir a tela
      Quando o aluno seleciona o dia "11/11/2026" no seletor de dias
      E seleciona o dia "12/11/2026" no seletor de dias
      Então o sistema marca os dois dias como selecionados
      E exibe o total "2 dias selecionados"
      E habilita o botão "Continuar"


    # AC-02 - Janela máxima de 30 dias corridos (valor-limite)
    @fluxo_infeliz @validacao_campos @prioridade_alta
    Esquema do Cenário: Sistema limita a seleção de datas à janela máxima de 30 dias corridos
      Dado que a janela de agendamento está na configuração padrão de 30 dias
      E hoje é o dia "09/11/2026"
      Quando o aluno visualiza o seletor de dias
      Então o dia "<dia>" <resultado>

      Exemplos:
        | dia        | resultado                                    |
        | 09/11/2026 | pode ser selecionado para agendamento        |
        | 08/12/2026 | pode ser selecionado para agendamento        |
        | 09/12/2026 | não pode ser selecionado nem fica disponível |
        | 08/11/2026 | não pode ser selecionado nem fica disponível |


    # AC-02 - API valida a janela de agendamento (valor-limite)
    @fluxo_infeliz @validacao_campos @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API valida a janela de agendamento para o dia <dia>
      Dado que a janela de agendamento está na configuração padrão de 30 dias
      E hoje é o dia "09/11/2026"
      Quando o aluno envia uma requisição para agendar o dia "<dia>" com ida e volta válidas
      Então a API responde com o status "<status>"
      E <resultado>

      Exemplos:
        | dia        | status                   | resultado                                                                  |
        | 08/12/2026 | 200 OK                   | o agendamento é criado                                                     |
        | 09/12/2026 | 422 Unprocessable Entity | a resposta informa a mensagem "A data está fora da janela de agendamento." |
        | 08/11/2026 | 422 Unprocessable Entity | a resposta informa a mensagem "A data está fora da janela de agendamento." |


    # AC-02 - Janela e limite de agendamentos ativos configuráveis por variáveis de ambiente
    @regra_negocio @teste_api @nao_automatizavel_via_appium @prioridade_media
    Esquema do Cenário: API aplica o valor configurado em "<variavel>"
      Dado que a variável de ambiente "<variavel>" está configurada com o valor "<valor>"
      E hoje é o dia "09/11/2026"
      Quando o aluno envia uma requisição de agendamento <situacao>
      Então a API responde com o status "<status>"

      Exemplos:
        | variavel                  | valor | situacao                                               | status                   |
        | AGENDAMENTO_JANELA_DIAS   | 15    | para o dia "23/11/2026", o último dia da janela        | 200 OK                   |
        | AGENDAMENTO_JANELA_DIAS   | 15    | para o dia "24/11/2026", o primeiro dia fora da janela | 422 Unprocessable Entity |
        | AGENDAMENTO_LIMITE_ATIVOS | 5     | com o aluno possuindo 4 agendamentos ativos            | 200 OK                   |
        | AGENDAMENTO_LIMITE_ATIVOS | 5     | com o aluno já possuindo 5 agendamentos ativos         | 422 Unprocessable Entity |


    # AC-17 - Seletor semanal navegável sem paginação
    @fluxo_feliz @prioridade_media
    Cenário: Aluno navega entre as semanas da janela de agendamento sem paginação
      Dado que a janela de agendamento vai de "09/11/2026" a "08/12/2026"
      Quando o aluno visualiza o seletor de dias
      Então o sistema exibe a semana atual, de segunda a domingo
      Quando o aluno avança para a semana seguinte
      Então o sistema exibe os dias da semana seguinte
      E os dias que ficam fora da janela aparecem desabilitados
      E não há paginação de resultados


  Regra: O aluno informa a ida e a volta e confirma o agendamento

    Contexto:
      Dado que o aluno "Maria Souza" está autenticado no sistema com cadastro aprovado e vínculo válido
      E acessa a tela "Agendar Transporte"
      E o aplicativo possui conexão ativa com a API
      E existe a rota principal ativa "Rota Centro - UFC" com saída às "06:30" e retorno às "17:30", atendendo o bairro "Centro" e a faculdade "UFC" na ida e na volta
      E o dia "10/11/2026" está disponível para agendamento


    # FLUXO PRINCIPAL (CAMINHO FELIZ) - AC-04, AC-05, AC-07, AC-08, AC-09, AC-14
    @fluxo_feliz @smoke @prioridade_alta
    Cenário: Aluno agenda o transporte com ida e volta
      Quando o aluno seleciona o dia "10/11/2026" no seletor de dias
      E toca em "Continuar"
      E responde "Sim" para a utilização do ônibus na ida
      E informa os dados da ida:
        | campo                | valor           |
        | Ponto de embarque    | Praça da Matriz |
        | Faculdade de destino | UFC             |
      E responde "Sim" para a utilização do ônibus na volta
      E informa os dados da volta:
        | campo                | valor           |
        | Faculdade de origem  | UFC             |
        | Ponto de desembarque | Praça da Matriz |
      E confirma o agendamento
      Então o sistema exibe a tela de confirmação com a mensagem "1 agendamento realizado com sucesso!"
      E o dia "10/11/2026" passa a ser exibido no seletor de dias com o estado "Agendado"


    # AC-04, AC-05 - Resposta "Sim" para a ida exibe os campos da ida
    @fluxo_feliz @prioridade_alta
    Cenário: Sistema exibe os campos da ida quando o aluno responde "Sim"
      Quando o aluno seleciona o dia "10/11/2026" no seletor de dias
      E toca em "Continuar"
      E responde "Sim" para a utilização do ônibus na ida
      Então o sistema exibe, em lista suspensa, os campos "Ponto de embarque", "Faculdade de destino" e "Rota complementar de ida"
      E o sistema pergunta se o aluno utilizará o ônibus na volta


    # AC-06 - Resposta "Não" para a ida dispensa os campos da ida
    @fluxo_feliz @prioridade_alta
    Cenário: Sistema não exige os campos da ida quando o aluno responde "Não"
      Quando o aluno seleciona o dia "10/11/2026" no seletor de dias
      E toca em "Continuar"
      E responde "Não" para a utilização do ônibus na ida
      Então o sistema não exibe nem exige o preenchimento dos campos da ida
      E o sistema pergunta se o aluno utilizará o ônibus na volta


    # AC-07, AC-08 - Resposta "Sim" para a volta exibe os campos da volta
    @fluxo_feliz @prioridade_alta
    Cenário: Sistema exibe os campos da volta quando o aluno responde "Sim", independentemente da resposta da ida
      Quando o aluno seleciona o dia "10/11/2026" no seletor de dias
      E toca em "Continuar"
      E responde "Não" para a utilização do ônibus na ida
      E responde "Sim" para a utilização do ônibus na volta
      Então o sistema exibe, em lista suspensa, os campos "Faculdade de origem", "Ponto de desembarque" e "Rota complementar de volta"


    # AC-09 - Combinações válidas de ida e volta
    @fluxo_feliz @prioridade_alta
    Esquema do Cenário: Aluno confirma o agendamento com a combinação "<combinacao>"
      Quando o aluno seleciona o dia "10/11/2026" no seletor de dias
      E toca em "Continuar"
      E responde "<ida>" para a utilização do ônibus na ida
      E responde "<volta>" para a utilização do ônibus na volta
      E preenche os campos obrigatórios dos trechos escolhidos
      E confirma o agendamento
      Então o sistema exibe a tela de confirmação com a mensagem "1 agendamento realizado com sucesso!"
      E o dia "10/11/2026" passa a ser exibido no seletor de dias com o estado "Agendado"
      E o agendamento registra <trechos>

      Exemplos:
        | combinacao   | ida | volta | trechos                      |
        | apenas ida   | Sim | Não   | somente o trecho da ida      |
        | apenas volta | Não | Sim   | somente o trecho da volta    |
        | ida e volta  | Sim | Sim   | os trechos da ida e da volta |


    # AC-08 - Faculdade de origem da volta diferente da faculdade de destino da ida
    @fluxo_feliz @prioridade_media
    Cenário: Aluno agenda a volta partindo de uma faculdade diferente da faculdade de destino da ida
      Dado que a rota principal "Rota Centro - UFC" também atende a faculdade "IFCE" na volta
      Quando o aluno seleciona o dia "10/11/2026" no seletor de dias
      E toca em "Continuar"
      E informa a ida com a faculdade de destino "UFC"
      E informa a volta com a faculdade de origem "IFCE"
      E confirma o agendamento
      Então o sistema exibe a tela de confirmação com a mensagem "1 agendamento realizado com sucesso!"
      E o agendamento registra a faculdade de destino "UFC" na ida e a faculdade de origem "IFCE" na volta


    # AC-08 - Ponto de desembarque de bairro e rota diferentes dos da ida
    @fluxo_feliz @prioridade_media
    Cenário: Aluno agenda a volta com ponto de desembarque de um bairro e de uma rota diferentes dos da ida
      Dado que existe a rota principal ativa "Rota Campo Velho - UFC" atendendo o bairro "Campo Velho" e a faculdade "UFC" na volta
      E o ponto "Praça do Campo Velho" pertence ao bairro "Campo Velho"
      Quando o aluno seleciona o dia "10/11/2026" no seletor de dias
      E toca em "Continuar"
      E informa a ida com o ponto de embarque "Praça da Matriz" e a faculdade de destino "UFC"
      E informa a volta com a faculdade de origem "UFC" e o ponto de desembarque "Praça do Campo Velho"
      E confirma o agendamento
      Então o sistema exibe a tela de confirmação com a mensagem "1 agendamento realizado com sucesso!"
      E o agendamento registra o ponto de embarque "Praça da Matriz" na ida e o ponto de desembarque "Praça do Campo Velho" na volta


    # AC-05, AC-08, RN-010 - Rota complementar na ida e na volta
    @fluxo_feliz @RN010 @prioridade_media
    Cenário: Aluno agenda a ida e a volta utilizando rota complementar
      Dado que existe a rota complementar ativa "Van 2 - Bairro Novo" vinculada à rota principal "Rota Centro - UFC"
      Quando o aluno seleciona o dia "10/11/2026" no seletor de dias
      E toca em "Continuar"
      E informa a ida e a volta escolhendo a rota complementar "Van 2 - Bairro Novo" nos dois trechos
      E confirma o agendamento
      Então o sistema exibe a tela de confirmação com a mensagem "1 agendamento realizado com sucesso!"
      E o agendamento registra a rota complementar "Van 2 - Bairro Novo" na ida e na volta


    # AC-10 - Ida "Não" e volta "Não" não cria agendamento
    @fluxo_feliz @prioridade_alta
    Cenário: Sistema não cria agendamento quando o aluno responde "Não" para a ida e para a volta
      Quando o aluno seleciona o dia "10/11/2026" no seletor de dias
      E toca em "Continuar"
      E responde "Não" para a utilização do ônibus na ida
      E responde "Não" para a utilização do ônibus na volta
      E confirma o agendamento
      Então o sistema exibe a mensagem "Nenhum agendamento foi criado."
      E o sistema não exibe nenhuma mensagem de erro
      E o dia "10/11/2026" permanece no seletor de dias com o estado "Disponível"


    # AC-05 - Listas suspensas exibem apenas cadastros ativos
    @fluxo_infeliz @validacao_campos @prioridade_alta
    Esquema do Cenário: Sistema não oferece cadastros inativos de <cadastro> nas listas do agendamento
      Dado que o cadastro de <cadastro> "<ativo>" está ativo
      E o cadastro de <cadastro> "<inativo>" está inativo
      Quando o aluno seleciona o dia "10/11/2026" no seletor de dias
      E toca em "Continuar"
      E abre a lista "<lista>"
      Então o sistema exibe "<ativo>" como opção
      E "<inativo>" não é exibido como opção

      Exemplos:
        | cadastro          | ativo               | inativo          | lista                    |
        | ponto de parada   | Praça da Matriz     | Ponto Desativado | Ponto de embarque        |
        | faculdade         | UFC                 | Faculdade Antiga | Faculdade de destino     |
        | rota complementar | Van 2 - Bairro Novo | Van Antiga       | Rota complementar de ida |


    # HU-011 AC-14, HU-012 AC-14, RN-010 - Rotas inativas fora das opções de agendamento
    @regra_negocio @RN010 @prioridade_media
    Esquema do Cenário: Sistema não oferece no agendamento o trajeto de uma <tipo_rota> inativa
      Dado que existe a <tipo_rota> inativa "<rota_inativa>"
      Quando o aluno seleciona o dia "10/11/2026" no seletor de dias
      E toca em "Continuar"
      Então nenhuma opção de agendamento é gerada a partir da <tipo_rota> "<rota_inativa>"

      Exemplos:
        | tipo_rota         | rota_inativa |
        | rota principal    | Rota Antiga  |
        | rota complementar | Van Antiga   |


    # AC-15, RNF-001 - Tempo de resposta do agendamento
    @nao_funcional @desempenho @RNF001 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: Tempo de resposta do agendamento não ultrapassa 3 segundos
      Dado que a conexão com a internet está em condições normais
      Quando o aluno envia uma requisição para agendar o dia "10/11/2026" com ida e volta válidas
      Então a API retorna a resposta do agendamento em até 3 segundos


  Regra: O sistema bloqueia agendamentos inválidos e destaca os campos pendentes

    Contexto:
      Dado que o aluno "Maria Souza" está autenticado no sistema com cadastro aprovado e vínculo válido
      E acessa a tela "Agendar Transporte"
      E o aplicativo possui conexão ativa com a API
      E existe a rota principal ativa "Rota Centro - UFC" com saída às "06:30" e retorno às "17:30", atendendo o bairro "Centro" e a faculdade "UFC" na ida e na volta
      E o dia "10/11/2026" está disponível para agendamento


    # FA-001 - Sobreposição de agendamento (AC-11)
    @fluxo_infeliz @FA001 @prioridade_alta
    Cenário: Sistema oferece a edição quando o aluno seleciona um dia que já possui solicitação ativa
      Dado que o aluno já possui um agendamento ativo para o dia "10/11/2026"
      Quando o aluno seleciona o dia "10/11/2026" no seletor de dias
      Então o sistema exibe o aviso "Agendamento já existente" com a pergunta "Deseja editar o agendamento existente?"
      E o aluno continua com apenas um agendamento ativo no dia "10/11/2026"


    # FA-001 - API recusa a sobreposição de agendamento (AC-11)
    @fluxo_infeliz @FA001 @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API recusa um segundo agendamento ativo para o mesmo dia
      Dado que o aluno já possui um agendamento ativo para o dia "10/11/2026"
      Quando o aluno envia uma requisição para agendar o dia "10/11/2026"
      Então a API responde com o status "409 Conflict"
      E a resposta informa o código "FA-001" e a mensagem "Já existe um agendamento ativo para este dia. Edite ou cancele o agendamento existente."
      E o aluno continua com apenas um agendamento ativo no dia "10/11/2026"


    # FA-001, RNF-012 - Requisições simultâneas para o mesmo dia
    @fluxo_infeliz @FA001 @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: Requisições simultâneas para o mesmo dia criam um único agendamento ativo
      Quando o aluno envia duas requisições simultâneas para agendar o dia "10/11/2026"
      Então apenas uma das requisições cria o agendamento
      E a outra requisição é recusada com o status "409 Conflict"
      E o banco de dados mantém um único agendamento ativo do aluno para o dia "10/11/2026"


    # FA-001 - Agendamento cancelado não bloqueia um novo agendamento no mesmo dia
    @regra_negocio @FA001 @teste_api @nao_automatizavel_via_appium @prioridade_media @depende_de_HU014
    Cenário: Aluno agenda novamente um dia cujo agendamento anterior foi cancelado
      Dado que o aluno cancelou o agendamento do dia "10/11/2026"
      Quando o aluno envia uma requisição para agendar o dia "10/11/2026" com ida e volta válidas
      Então a API responde com o status "200 OK"
      E é criado um novo agendamento ativo para o dia "10/11/2026"
      E o agendamento cancelado permanece registrado com o status "CANCELADO"


    # FA-002 - Combinação de ponto e faculdade sem rota ativa (AC-12)
    @fluxo_infeliz @FA002 @validacao_campos @prioridade_alta
    Esquema do Cenário: Sistema informa a indisponibilidade quando não há rota ativa para o trajeto da <trecho>
      Dado que nenhuma rota principal ativa atende o ponto "<ponto>" e a faculdade "<faculdade>" no trecho da <trecho>
      Quando o aluno seleciona o dia "10/11/2026" no seletor de dias
      E toca em "Continuar"
      E informa no trecho da <trecho> o ponto "<ponto>" e a faculdade "<faculdade>"
      E confirma o agendamento
      Então o sistema exibe a mensagem "Não foi possível criar o agendamento: não há rota principal ativa para o ponto '<ponto>' e a faculdade '<faculdade>'."
      E o agendamento não é criado

      Exemplos:
        | trecho | ponto           | faculdade          |
        | ida    | Ponto Sem Rota  | UFC                |
        | volta  | Ponto Sem Rota  | UFC                |
        | ida    | Praça da Matriz | Faculdade Sem Rota |
        | volta  | Praça da Matriz | Faculdade Sem Rota |


    # FA-002 - API recusa a combinação sem rota ativa (AC-12)
    @fluxo_infeliz @FA002 @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API recusa o agendamento sem rota principal ativa para o trajeto da <trecho>
      Dado que nenhuma rota principal ativa atende o ponto "Ponto Sem Rota" e a faculdade "UFC" no trecho da <trecho>
      Quando o aluno envia uma requisição para agendar o dia "10/11/2026" com esse ponto e essa faculdade na <trecho>
      Então a API responde com o status "422 Unprocessable Entity"
      E a resposta informa o código "FA-002"
      E a resposta indica os campos "<campo_ponto>" e "<campo_faculdade>"
      E o agendamento não é criado

      Exemplos:
        | trecho | campo_ponto          | campo_faculdade |
        | ida    | ponto_embarque_id    | ies_destino_id  |
        | volta  | ponto_desembarque_id | ies_origem_id   |


    # FA-003 - Campos condicionais obrigatórios ausentes (AC-13)
    @fluxo_infeliz @FA003 @validacao_campos @prioridade_alta
    Esquema do Cenário: Sistema bloqueia o salvamento quando o campo "<campo_obrigatorio>" da <trecho> não é preenchido
      Quando o aluno seleciona o dia "10/11/2026" no seletor de dias
      E toca em "Continuar"
      E responde "Sim" para a utilização do ônibus na <trecho>
      E deixa o campo "<campo_obrigatorio>" vazio
      E preenche os demais campos obrigatórios corretamente
      E confirma o agendamento
      Então o sistema destaca o campo "<campo_obrigatorio>" como pendente
      E o agendamento não é criado

      Exemplos:
        | trecho | campo_obrigatorio    |
        | ida    | Ponto de embarque    |
        | ida    | Faculdade de destino |
        | volta  | Faculdade de origem  |
        | volta  | Ponto de desembarque |


    # FA-003 - API recusa os campos obrigatórios ausentes (AC-13)
    @fluxo_infeliz @FA003 @validacao_campos @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API recusa o agendamento da <trecho> sem os campos obrigatórios
      Quando o aluno envia uma requisição para agendar o dia "10/11/2026" com a <trecho> marcada como utilizada e sem "<campos>"
      Então a API responde com o status "422 Unprocessable Entity"
      E a resposta informa o código "FA-003" e a mensagem "<mensagem>"
      E a resposta indica os campos "<campos>"
      E o agendamento não é criado

      Exemplos:
        | trecho | campos                              | mensagem                                 |
        | ida    | ponto_embarque_id, ies_destino_id   | Informe os campos obrigatórios da ida.   |
        | volta  | ies_origem_id, ponto_desembarque_id | Informe os campos obrigatórios da volta. |


    # AC-05 - API recusa cadastros inativos ou inexistentes
    @fluxo_infeliz @RNF012 @validacao_campos @teste_api @nao_automatizavel_via_appium @prioridade_media
    Esquema do Cenário: API recusa o agendamento com o campo "<campo>" apontando para um cadastro inativo ou inexistente
      Dado que o cadastro informado no campo "<campo>" está inativo ou não existe
      Quando o aluno envia uma requisição para agendar o dia "10/11/2026" com esse cadastro
      Então a API responde com o status "422 Unprocessable Entity"
      E a resposta informa o código "ITEM_INATIVO_OU_INEXISTENTE"
      E a resposta informa a mensagem "O campo <campo> informa um cadastro inexistente ou inativo."
      E o agendamento não é criado

      Exemplos:
        | campo                |
        | ponto_embarque_id    |
        | ies_destino_id       |
        | ies_origem_id        |
        | ponto_desembarque_id |


    # AC-02 - Limite de 22 agendamentos ativos (valor-limite)
    @fluxo_infeliz @validacao_campos @prioridade_alta
    Esquema do Cenário: Sistema aplica o limite de 22 agendamentos ativos com o aluno em <ativos> agendamentos
      Dado que o aluno possui <ativos> agendamentos ativos para datas futuras
      Quando o aluno tenta registrar um novo agendamento para um dia disponível
      Então <resultado>

      Exemplos:
        | ativos | resultado                                                            |
        | 21     | o sistema exibe a tela de confirmação "1 agendamento realizado com sucesso!"|
        | 22     | o sistema exibe a mensagem "Limite de agendamentos ativos atingido." |


    # AC-02 - API aplica o limite de 22 agendamentos ativos
    @fluxo_infeliz @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API recusa o agendamento quando o aluno já possui 22 agendamentos ativos
      Dado que o aluno possui 22 agendamentos ativos para datas futuras
      Quando o aluno envia uma requisição para agendar um novo dia disponível com ida e volta válidas
      Então a API responde com o status "422 Unprocessable Entity"
      E a resposta informa o código "LIMITE_AGENDAMENTOS" e a mensagem "Limite de agendamentos ativos atingido."
      E o aluno continua com 22 agendamentos ativos


  Regra: O aluno edita um agendamento existente e a edição sem nenhum trecho equivale ao cancelamento

    Contexto:
      Dado que o aluno "Maria Souza" está autenticado no sistema com cadastro aprovado e vínculo válido
      E acessa a tela "Agendar Transporte"
      E o aplicativo possui conexão ativa com a API
      E o aluno possui um agendamento ativo para o dia "10/11/2026" com ida e volta


    # FA-001 - Edição de agendamento existente
    @fluxo_feliz @FA001 @prioridade_media
    Cenário: Aluno edita um agendamento existente e remove o trecho da volta
      Quando o aluno seleciona o dia "10/11/2026" no seletor de dias
      E confirma o aviso "Deseja editar o agendamento existente?"
      E altera a resposta da volta para "Não"
      E confirma o agendamento
      Então o sistema exibe a tela de confirmação com o resumo do dia "10/11/2026"
      E o agendamento do dia "10/11/2026" passa a registrar somente o trecho da ida


    # AC-16 - Edição com "Não" para ida e volta é tratada como cancelamento (HU-014)
    @fluxo_feliz @prioridade_alta
    Cenário: Sistema trata a edição com "Não" para ida e volta como cancelamento e pede confirmação
      Quando o aluno seleciona o dia "10/11/2026" no seletor de dias
      E confirma o aviso "Deseja editar o agendamento existente?"
      E altera a resposta da ida para "Não"
      E altera a resposta da volta para "Não"
      E confirma o agendamento
      Então o sistema exibe o alerta de confirmação "Cancelar agendamento?" com o aviso "Esta ação não poderá ser desfeita."
      Quando o aluno aciona o botão "Confirmar"
      Então o sistema exibe a mensagem "Agendamento cancelado com sucesso"
      E o dia "10/11/2026" passa a ser exibido no seletor de dias com o estado "Disponível"


    # AC-16, HU-014 FA-002 - Desistência do cancelamento por edição
    @fluxo_infeliz @prioridade_media
    Cenário: Aluno desiste do cancelamento por edição ao acionar "Cancelar" no alerta de confirmação
      Quando o aluno seleciona o dia "10/11/2026" no seletor de dias
      E confirma o aviso "Deseja editar o agendamento existente?"
      E altera a resposta da ida para "Não"
      E altera a resposta da volta para "Não"
      E confirma o agendamento
      E aciona o botão "Cancelar" no alerta de confirmação
      Então o sistema fecha o alerta
      E o agendamento do dia "10/11/2026" permanece ativo sem alterações


    # AC-16 - API trata o PUT sem nenhum trecho como cancelamento
    @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_media
    Cenário: API cancela o agendamento quando a edição informa "Não" para ida e volta
      Quando o aluno envia uma requisição de edição do agendamento do dia "10/11/2026" com ida e volta marcadas como não utilizadas
      Então a API responde com o status "200 OK"
      E a resposta informa a mensagem "Agendamento cancelado com sucesso" e o estado do dia "DISPONIVEL"
      E o agendamento permanece registrado com o status "CANCELADO"


  Regra: O agendamento pertence ao aluno autenticado e só é acessível a alunos com acesso regular

    # RF-015, fluxo principal passo 26 - Vínculo com o perfil logado
    @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: Agendamento é vinculado ao aluno autenticado e não aparece para outro aluno
      Dado que os alunos "Maria Souza" e "João Lima" possuem cadastro aprovado e vínculo válido
      Quando "Maria Souza" cria um agendamento para o dia "10/11/2026"
      Então o agendamento registra "Maria Souza" como titular
      E "Maria Souza" visualiza o agendamento em "Meus agendamentos"
      E "João Lima" não visualiza o agendamento de "Maria Souza"


    # RF-015, RNF-012 - Alunos sem acesso regular não agendam
    @fluxo_infeliz @regra_negocio @RNF012 @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Esquema do Cenário: API nega o agendamento para o usuário "<situacao>"
      Dado que um usuário "<situacao>" possui um token de acesso válido
      Quando esse usuário envia uma requisição para agendar o dia "10/11/2026" com ida e volta válidas
      Então a API responde com o status "403 Forbidden"
      E o agendamento não é criado

      Exemplos:
        | situacao                     |
        | Administrador                |
        | Aluno com cadastro pendente  |
        | Aluno com cadastro reprovado |
        | Aluno com vínculo vencido    |


    # RF-015 - Requisição sem autenticação
    @fluxo_infeliz @regra_negocio @teste_api @nao_automatizavel_via_appium @prioridade_alta
    Cenário: API nega o agendamento sem token de acesso
      Quando uma requisição para agendar o dia "10/11/2026" é enviada sem token de acesso
      Então a API responde com o status "401 Unauthorized"
      E o agendamento não é criado
